import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { cpus } from 'node:os';
import { join } from 'node:path';
import { deployedTools, rootDir, type DeployedTool } from '../pages-manifest.ts';

export function selectedTools(slugs: readonly string[]): DeployedTool[] {
  const tools = deployedTools();
  if (!slugs.length) return tools;
  for (const slug of slugs) {
    if (!tools.some((tool) => tool.slug === slug)) throw new Error(`Unknown tool: ${slug}`);
  }
  return tools.filter((tool) => slugs.includes(tool.slug));
}

export function run(command: string, args: string[], cwd = rootDir): void {
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(' ')} failed (${result.status ?? result.signal})`);
}

export function npmRun(script: string, cwd = rootDir): void {
  run('npm', ['run', script], cwd);
}

export function localBin(name: string): string {
  return join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);
}

export function spawnLocal(name: string, args: string[], env = process.env): ChildProcess {
  return spawn(localBin(name), args, {
    cwd: rootDir,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
}

export async function parallel(
  tasks: Array<() => Promise<void>>,
  limit = Math.max(1, Math.min(cpus().length, 4))
): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      if (task) await task();
    }
  });
  await Promise.all(workers);
}

export function runAsync(command: string, args: string[], cwd = rootDir): Promise<void> {
  console.log(`> ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} failed (${code})`))
    );
  });
}
