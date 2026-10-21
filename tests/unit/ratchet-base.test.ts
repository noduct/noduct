import { describe, expect, it } from 'vitest';
import { resolveRatchetBase } from '../../scripts/cli/ratchet-base';

describe('ratchet comparison base', () => {
  it('uses the merge base of a pull request', () => {
    const calls: string[][] = [];
    expect(resolveRatchetBase({ GITHUB_BASE_SHA: 'base-sha' }, (args) => {
      calls.push(args);
      return 'common-sha';
    })).toBe('common-sha');
    expect(calls).toEqual([['merge-base', 'HEAD', 'base-sha']]);
  });

  it('uses the push before SHA', () => {
    expect(resolveRatchetBase({ GITHUB_BASE_SHA: 'before-sha' }, () => 'before-sha')).toBe('before-sha');
  });

  it('falls back to the issue epic when a new branch has a zero before SHA', () => {
    const calls: string[][] = [];
    expect(resolveRatchetBase({ GITHUB_BASE_SHA: '000000' }, (args) => {
      calls.push(args);
      return 'epic-base';
    })).toBe('epic-base');
    expect(calls).toEqual([['merge-base', 'HEAD', 'origin/epic/pdf-ecosystem']]);
  });

  it('fails closed when no base is available', () => {
    expect(() => resolveRatchetBase({}, () => { throw new Error('missing'); })).toThrow('Ratchet base unavailable');
  });
});
