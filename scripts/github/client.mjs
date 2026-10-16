import fs from 'node:fs';

const API_ROOT = 'https://api.github.com';
const API_VERSION = '2022-11-28';

export function getGitHubToken() {
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_ACCESS_TOKEN ||
    tokenFromRepositoryEnv();
  if (!token?.trim()) {
    throw new Error(
      'GitHub token not found. Set GITHUB_TOKEN (preferred), GH_TOKEN, or GITHUB_ACCESS_TOKEN in the environment.'
    );
  }
  return token.trim();
}

function tokenFromRepositoryEnv() {
  const envPath = `${process.cwd()}/.env`;
  if (!fs.existsSync(envPath)) return undefined;

  const keys = ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_ACCESS_TOKEN'];
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || !keys.includes(match[1])) continue;
    const value = match[2].replace(/^("|')(.*)\1$/, '$2').trim();
    if (value) return value;
  }
  return undefined;
}

/** Makes an authenticated request without writing secrets to stdout. */
export async function ghApi(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_ROOT}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${getGitHubToken()}`,
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': 'github-ai-automation',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const detail = typeof data === 'string' ? data : (data.message ?? JSON.stringify(data));
    throw new Error(`GitHub API ${response.status} for ${endpoint}: ${detail}`);
  }
  return data;
}

/** Makes an authenticated GraphQL request and unwraps data, throwing on GraphQL errors. */
export async function ghGraphql(query, variables = {}) {
  const data = await ghApi('/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables })
  });
  if (data?.errors?.length) {
    const message = data.errors.map((e) => e.message).join('; ');
    throw new Error(`GitHub GraphQL error: ${message}`);
  }
  return data?.data;
}

export function validateRepo(repo) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))
    throw new Error(`Invalid repository "${repo}". Use OWNER/REPOSITORY.`);
  return repo;
}

