#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { getGitHubToken, ghApi, ghGraphql, validateRepo } from './client.mjs';

const HELP = `GitHub automation CLI for AI agents

Usage: node scripts/github/manage.mjs <resource> <action> [...arguments] [options]

Resources:
  issue     get <number> | list | create <payload> | update <number> <payload> | close <number> [--comment <text>] | comment <number> <text> | link-branch <number> <branch> [--from <sha-or-branch>] | unlink-branch <number> <branch> | linked-branches <number>
  milestone get <number> | list | create <payload> | update <number> <payload> | close <number>
  branch    get <name> | list | create <name> [--from <sha-or-branch>] | delete <name> | link <name> <issue-number> [--from <sha-or-branch>] | unlink <name> <issue-number> | linked <issue-number>
  pull      get <number> | list | create <payload> | update <number> <payload> | merge <number> [--method merge|squash|rebase]
  push      <branch> [--remote <name>]

Options:
  --repo OWNER/REPOSITORY  Target repository (then GITHUB_REPOSITORY, then git origin).
  --execute                Required for remote mutations; otherwise prints a dry-run plan.
  --state open|closed|all  Filter list commands (default: open).
  --label <name>           Filter issue list; can be repeated.
  --milestone <number>     Filter issue list.
  --limit <1-100>          List page size (default: 100).
  --comment <text>         Closing comment for an issue.
  --from <sha-or-branch>   Source for branch creation.
  --method <name>          Merge method (default: squash).
  --remote <name>          Git remote for push (default: origin).

Payloads are inline JSON or paths to UTF-8 JSON files. Run with --execute only after checking the dry-run plan.
`;

function fail(message) {
  throw new Error(message);
}
function parseArguments(argv) {
  const positionals = [];
  const options = { labels: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      positionals.push(value);
      continue;
    }
    const key = value.slice(2);
    if (key === 'help') positionals.push('help');
    else if (key === 'execute') options.execute = true;
    else if (key === 'label')
      options.labels.push(argv[++index] ?? fail('--label requires a value'));
    else if (
      ['repo', 'state', 'milestone', 'limit', 'comment', 'from', 'method', 'remote'].includes(key)
    )
      options[key] = argv[++index] ?? fail(`--${key} requires a value`);
    else fail(`Unknown option --${key}`);
  }
  return { positionals, options };
}
function repoFromGitRemote() {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf8'
    }).trim();
    return remote.match(/(?:github\.com[:/])([^/]+\/[^/.]+)(?:\.git)?$/)?.[1];
  } catch {
    return undefined;
  }
}
function resolveRepo(value) {
  return validateRepo(
    value ||
      process.env.GITHUB_REPOSITORY ||
      repoFromGitRemote() ||
      fail('Repository missing. Pass --repo OWNER/REPOSITORY.')
  );
}
function number(value, label) {
  if (!/^\d+$/.test(value ?? '')) fail(`${label} must be a positive integer.`);
  return Number(value);
}
function payload(value) {
  if (!value) fail('A JSON payload or path to a JSON file is required.');
  const source = fs.existsSync(value) ? fs.readFileSync(value, 'utf8') : value;
  try {
    const parsed = JSON.parse(source);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')
      fail('Payload must be a JSON object.');
    return parsed;
  } catch (error) {
    if (error.message === 'Payload must be a JSON object.') throw error;
    fail(`Invalid JSON payload: ${error.message}`);
  }
}
function plainText(value) {
  if (!value) fail('Text or a path to a text file is required.');
  return fs.existsSync(value) ? fs.readFileSync(value, 'utf8') : value;
}
function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
async function mutate(options, request) {
  if (!options.execute) {
    output({
      dryRun: true,
      message: 'No remote change was made. Re-run with --execute to apply.',
      request
    });
    return null;
  }
  return ghApi(request.endpoint, {
    method: request.method,
    ...(request.body ? { body: JSON.stringify(request.body) } : {})
  });
}
function listQuery(options) {
  const query = new URLSearchParams({
    state: options.state ?? 'open',
    per_page: String(number(options.limit ?? '100', 'limit'))
  });
  if (options.milestone) query.set('milestone', String(number(options.milestone, 'milestone')));
  if (options.labels.length) query.set('labels', options.labels.join(','));
  return query;
}
async function getIssueDetailsWithLinkedBranches(repo, issueNumber) {
  const [owner, name] = repo.split('/');
  const query = `
    query IssueWithLinkedBranches($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        id
        defaultBranchRef {
          name
          target {
            oid
          }
        }
        issue(number: $number) {
          id
          number
          title
          linkedBranches(first: 50) {
            nodes {
              id
              ref {
                name
                prefix
                target {
                  oid
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await ghGraphql(query, { owner, name, number: issueNumber });
  const repository = data?.repository;
  if (!repository?.issue) {
    fail(`Issue #${issueNumber} not found in ${repo}.`);
  }
  return { repository, issue: repository.issue };
}

async function listLinkedBranches(repo, issueNumber) {
  const { issue } = await getIssueDetailsWithLinkedBranches(repo, issueNumber);
  const nodes = issue.linkedBranches?.nodes ?? [];
  return nodes.map((node) => ({
    id: node.id,
    name: node.ref?.name,
    prefix: node.ref?.prefix,
    target: node.ref?.target?.oid
  }));
}

async function linkBranchToIssue(repo, issueNumber, branchName, options) {
  if (!branchName) fail('Branch name is required to link to an issue.');
  const { repository, issue } = await getIssueDetailsWithLinkedBranches(repo, issueNumber);

  const existingLink = issue.linkedBranches?.nodes?.find(
    (node) => node.ref?.name === branchName
  );
  if (existingLink) {
    return {
      alreadyLinked: true,
      issue: issueNumber,
      branch: branchName,
      linkedBranchId: existingLink.id
    };
  }

  let remoteRef = null;
  try {
    remoteRef = await ghApi(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`);
  } catch (error) {
    if (!error.message.includes('404')) throw error;
  }

  let commitOid = null;
  if (remoteRef?.object?.sha) {
    commitOid = remoteRef.object.sha;
  } else {
    const source = options.from ?? repository.defaultBranchRef?.name;
    if (!source) fail('Could not determine source branch/commit for new branch.');
    if (/^[0-9a-f]{40}$/i.test(source)) {
      commitOid = source;
    } else {
      const sourceRef = await ghApi(`/repos/${repo}/git/ref/heads/${encodeURIComponent(source)}`);
      commitOid = sourceRef.object.sha;
    }
  }

  const dryRunRequest = {
    action: 'link-branch',
    issue: issueNumber,
    branch: branchName,
    existsOnRemote: Boolean(remoteRef),
    oid: commitOid
  };

  if (!options.execute) {
    output({
      dryRun: true,
      message: 'No remote change was made. Re-run with --execute to apply.',
      request: dryRunRequest
    });
    return null;
  }

  const mutation = `
    mutation LinkBranch($input: CreateLinkedBranchInput!) {
      createLinkedBranch(input: $input) {
        linkedBranch {
          id
          ref {
            name
          }
        }
        issue {
          number
          title
        }
      }
    }
  `;

  if (remoteRef) {
    await ghApi(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branchName)}`, {
      method: 'DELETE'
    });
    try {
      const result = await ghGraphql(mutation, {
        input: {
          issueId: issue.id,
          repositoryId: repository.id,
          name: branchName,
          oid: commitOid
        }
      });
      return {
        linked: true,
        issue: issueNumber,
        branch: branchName,
        linkedBranchId: result?.createLinkedBranch?.linkedBranch?.id,
        oid: commitOid
      };
    } catch (mutationError) {
      await ghApi(`/repos/${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: commitOid })
      }).catch(() => {});
      throw mutationError;
    }
  }

  const result = await ghGraphql(mutation, {
    input: {
      issueId: issue.id,
      repositoryId: repository.id,
      name: branchName,
      oid: commitOid
    }
  });

  return {
    linked: true,
    issue: issueNumber,
    branch: branchName,
    linkedBranchId: result?.createLinkedBranch?.linkedBranch?.id,
    oid: commitOid
  };
}

async function unlinkBranchFromIssue(repo, issueNumber, branchName, options) {
  if (!branchName) fail('Branch name is required to unlink from an issue.');
  const { issue } = await getIssueDetailsWithLinkedBranches(repo, issueNumber);

  const existingLink = issue.linkedBranches?.nodes?.find(
    (node) => node.ref?.name === branchName
  );
  if (!existingLink) {
    fail(`Branch "${branchName}" is not linked to issue #${issueNumber}.`);
  }

  const dryRunRequest = {
    action: 'unlink-branch',
    issue: issueNumber,
    branch: branchName,
    linkedBranchId: existingLink.id
  };

  if (!options.execute) {
    output({
      dryRun: true,
      message: 'No remote change was made. Re-run with --execute to apply.',
      request: dryRunRequest
    });
    return null;
  }

  const mutation = `
    mutation UnlinkBranch($input: DeleteLinkedBranchInput!) {
      deleteLinkedBranch(input: $input) {
        issue {
          number
        }
      }
    }
  `;

  await ghGraphql(mutation, {
    input: {
      linkedBranchId: existingLink.id
    }
  });

  return {
    unlinked: true,
    issue: issueNumber,
    branch: branchName
  };
}

async function issues(repo, action, args, options) {
  const base = `/repos/${repo}/issues`;
  if (action === 'get') return ghApi(`${base}/${number(args[0], 'Issue number')}`);
  if (action === 'list') return ghApi(`${base}?${listQuery(options)}`);
  if (action === 'create')
    return mutate(options, { method: 'POST', endpoint: base, body: payload(args[0]) });
  if (action === 'update')
    return mutate(options, {
      method: 'PATCH',
      endpoint: `${base}/${number(args[0], 'Issue number')}`,
      body: payload(args[1])
    });
  if (action === 'comment')
    return mutate(options, {
      method: 'POST',
      endpoint: `${base}/${number(args[0], 'Issue number')}/comments`,
      body: { body: plainText(args[1]) }
    });
  if (action === 'linked-branches')
    return listLinkedBranches(repo, number(args[0], 'Issue number'));
  if (action === 'link-branch')
    return linkBranchToIssue(repo, number(args[0], 'Issue number'), args[1], options);
  if (action === 'unlink-branch')
    return unlinkBranchFromIssue(repo, number(args[0], 'Issue number'), args[1], options);
  if (action === 'close') {
    const issue = number(args[0], 'Issue number');
    const closeRequest = {
      method: 'PATCH',
      endpoint: `${base}/${issue}`,
      body: { state: 'closed', state_reason: 'completed' }
    };
    if (!options.execute) {
      const requests = options.comment
        ? [
            {
              method: 'POST',
              endpoint: `${base}/${issue}/comments`,
              body: { body: options.comment }
            },
            closeRequest
          ]
        : [closeRequest];
      output({
        dryRun: true,
        message: 'No remote change was made. Re-run with --execute to apply.',
        requests
      });
      return null;
    }
    if (options.comment) {
      await ghApi(`${base}/${issue}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: options.comment })
      });
    }
    return mutate(options, closeRequest);
  }
  fail(`Unknown issue action "${action}".`);
}
async function milestones(repo, action, args, options) {
  const base = `/repos/${repo}/milestones`;
  if (action === 'list') return ghApi(`${base}?${listQuery(options)}`);
  if (action === 'get') return ghApi(`${base}/${number(args[0], 'Milestone number')}`);
  if (action === 'create')
    return mutate(options, { method: 'POST', endpoint: base, body: payload(args[0]) });
  if (action === 'update')
    return mutate(options, {
      method: 'PATCH',
      endpoint: `${base}/${number(args[0], 'Milestone number')}`,
      body: payload(args[1])
    });
  if (action === 'close')
    return mutate(options, {
      method: 'PATCH',
      endpoint: `${base}/${number(args[0], 'Milestone number')}`,
      body: { state: 'closed' }
    });
  fail(`Unknown milestone action "${action}".`);
}
async function branches(repo, action, args, options) {
  const refBase = `/repos/${repo}/git/ref`;
  if (action === 'list')
    return ghApi(`/repos/${repo}/branches?per_page=${number(options.limit ?? '100', 'limit')}`);
  if (action === 'get')
    return ghApi(
      `/repos/${repo}/branches/${encodeURIComponent(args[0] ?? fail('Branch name is required.'))}`
    );
  if (action === 'create') {
    const name = args[0] ?? fail('Branch name is required.');
    if (!options.execute) {
      output({
        dryRun: true,
        message: 'No remote change was made. Re-run with --execute to apply.',
        request: {
          method: 'POST',
          endpoint: refBase.replace('/ref', '/refs'),
          body: { ref: `refs/heads/${name}`, from: options.from ?? '<repository default branch>' }
        }
      });
      return null;
    }
    const source = options.from ?? (await ghApi(`/repos/${repo}`)).default_branch;
    const reference = await ghApi(`${refBase}/heads/${encodeURIComponent(source)}`);
    return mutate(options, {
      method: 'POST',
      endpoint: refBase.replace('/ref', '/refs'),
      body: { ref: `refs/heads/${name}`, sha: reference.object.sha }
    });
  }
  if (action === 'delete')
    return mutate(options, {
      method: 'DELETE',
      endpoint: `${refBase}/heads/${encodeURIComponent(args[0] ?? fail('Branch name is required.'))}`
    });
  if (action === 'link')
    return linkBranchToIssue(repo, number(args[1], 'Issue number'), args[0], options);
  if (action === 'unlink')
    return unlinkBranchFromIssue(repo, number(args[1], 'Issue number'), args[0], options);
  if (action === 'linked')
    return listLinkedBranches(repo, number(args[0], 'Issue number'));
  fail(`Unknown branch action "${action}".`);
}
async function pulls(repo, action, args, options) {
  const base = `/repos/${repo}/pulls`;
  if (action === 'list') return ghApi(`${base}?${listQuery(options)}`);
  if (action === 'get') return ghApi(`${base}/${number(args[0], 'Pull request number')}`);
  if (action === 'create')
    return mutate(options, { method: 'POST', endpoint: base, body: payload(args[0]) });
  if (action === 'update')
    return mutate(options, {
      method: 'PATCH',
      endpoint: `${base}/${number(args[0], 'Pull request number')}`,
      body: payload(args[1])
    });
  if (action === 'merge')
    return mutate(options, {
      method: 'PUT',
      endpoint: `${base}/${number(args[0], 'Pull request number')}/merge`,
      body: { merge_method: options.method ?? 'squash' }
    });
  fail(`Unknown pull action "${action}".`);
}
function push(branch, options) {
  if (!branch || branch.startsWith('-')) fail('A branch name is required for push.');
  const remote = options.remote ?? 'origin';
  if (!options.execute) {
    output({
      dryRun: true,
      message: 'No remote change was made. Re-run with --execute to apply.',
      request: { command: 'git push', remote, branch }
    });
    return;
  }

  const remoteUrl = execFileSync('git', ['remote', 'get-url', remote], { encoding: 'utf8' }).trim();
  if (!/^https:\/\/github\.com\//i.test(remoteUrl)) {
    fail(
      `Remote "${remote}" is not an HTTPS GitHub remote; refusing to send the GitHub token to it.`
    );
  }

  const credentials = Buffer.from(`x-access-token:${getGitHubToken()}`, 'utf8').toString('base64');
  execFileSync(
    'git',
    [
      '-c',
      `http.https://github.com/.extraheader=AUTHORIZATION: basic ${credentials}`,
      'push',
      remote,
      branch
    ],
    { stdio: 'pipe' }
  );
  output({ pushed: true, remote, branch });
}
async function main() {
  const { positionals, options } = parseArguments(process.argv.slice(2));
  if (!positionals.length || positionals[0] === '--help' || positionals[0] === 'help') {
    process.stdout.write(HELP);
    return;
  }
  const [resource, action, ...args] = positionals;
  if (resource === 'push') {
    if (args.length) fail('Usage: push <branch> [--remote <name>]');
    return push(action, options);
  }
  const repo = resolveRepo(options.repo);
  const result =
    resource === 'issue'
      ? await issues(repo, action, args, options)
      : resource === 'milestone'
        ? await milestones(repo, action, args, options)
        : resource === 'branch'
          ? await branches(repo, action, args, options)
          : resource === 'pull'
            ? await pulls(repo, action, args, options)
            : fail(`Unknown resource "${resource}".`);
  if (result !== null) output(result);
}
main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
});
