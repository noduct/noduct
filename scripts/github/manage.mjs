#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { getGitHubToken, ghApi, validateRepo } from './client.mjs';

const HELP = `GitHub automation CLI for AI agents

Usage: node scripts/github/manage.mjs <resource> <action> [...arguments] [options]

Resources:
  issue     get <number> | list | create <payload> | update <number> <payload> | close <number> [--comment <text>] | comment <number> <text>
  milestone get <number> | list | create <payload> | update <number> <payload> | close <number>
  branch    get <name> | list | create <name> [--from <sha-or-branch>] | delete <name>
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
