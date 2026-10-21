import { execFileSync } from 'node:child_process';

type Git = (args: string[]) => string;

const git: Git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

/** Compare the entire branch, never just the uncommitted working tree. */
export function resolveRatchetBase(
  env: NodeJS.ProcessEnv = process.env,
  runGit: Git = git
): string {
  const explicit = env.GITHUB_BASE_SHA || env.NODUCT_BASE_REF;
  if (explicit && !/^0+$/.test(explicit)) {
    try {
      return runGit(['merge-base', 'HEAD', explicit]);
    } catch {
      throw new Error(`Ratchet base ${explicit} unavailable. Fetch the base branch before checking.`);
    }
  }
  const candidates = [env.NODUCT_BASE_REF, 'origin/epic/pdf-ecosystem', 'origin/main'].filter(
    (ref): ref is string => Boolean(ref)
  );
  for (const ref of candidates) {
    try {
      return runGit(['merge-base', 'HEAD', ref]);
    } catch {
      // Try the next configured branch before failing closed.
    }
  }
  throw new Error('Ratchet base unavailable. Fetch origin or set NODUCT_BASE_REF to the issue base branch.');
}
