import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { deployedTools, rootDir } from '../pages-manifest.ts';
import { selectedTools } from './shared.ts';

export function toolPorts(slugs: readonly string[], first = 4331): Map<string, number> {
  return new Map(slugs.map((slug, index) => [slug, first + index]));
}

export async function availableToolPorts(
  slugs: readonly string[],
  first = 4331
): Promise<Map<string, number>> {
  const ports = new Map<string, number>();
  let candidate = first;
  for (const slug of slugs) {
    while (
      !(await new Promise<boolean>((resolve) => {
        const server = createServer();
        server.once('error', () => resolve(false));
        server.listen(candidate, '127.0.0.1', () => server.close(() => resolve(true)));
      }))
    )
      candidate++;
    ports.set(slug, candidate++);
  }
  return ports;
}

export function proxyEnvironment(ports: ReadonlyMap<string, number>): string {
  return [...ports].map(([slug, port]) => `${slug}=${port}`).join(',');
}

function stopTree(child: ChildProcess): void {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true
    });
  } else child.kill('SIGTERM');
}

export async function dev(args: string[]): Promise<void> {
  const only = args[0] === '--only';
  const slugs = only ? args.slice(1) : args;
  if (only && slugs.length !== 1) throw new Error('Usage: npm run dev -- --only <slug>');
  const tools = selectedTools(slugs);
  const all = deployedTools();
  const ports = only
    ? new Map<string, number>()
    : await availableToolPorts(all.map((tool) => tool.slug));
  const children: ChildProcess[] = [];
  const launch = (args: string[], label: string, env = process.env): ChildProcess => {
    const child = spawn(
      process.execPath,
      [join(rootDir, 'node_modules', 'astro', 'astro.js'), ...args],
      {
        cwd: rootDir,
        env,
        stdio: ['inherit', 'pipe', 'pipe'],
        windowsHide: true
      }
    );
    for (const [stream, destination] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr]
    ] as const) {
      let pending = '';
      stream?.on('data', (chunk: Buffer) => {
        pending += chunk.toString();
        const lines = pending.split(/\r?\n/);
        pending = lines.pop() ?? '';
        for (const line of lines) destination.write(`[${label}] ${line}\n`);
      });
      stream?.on('end', () => {
        if (pending) destination.write(`[${label}] ${pending}\n`);
      });
    }
    children.push(child);
    child.once('error', (error) => {
      console.error(`[${label}] ${error.message}`);
      shutdown();
      process.exitCode = 1;
    });
    child.once('exit', (code) => {
      if (!stopping) {
        console.error(`Development process exited (${code ?? 'signal'}).`);
        shutdown();
        process.exitCode = code || 1;
      }
    });
    return child;
  };
  let stopping = false;
  const shutdown = (): void => {
    if (stopping) return;
    stopping = true;
    children.forEach(stopTree);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  if (only) console.warn('Tool-only mode: hub links may return 404.');
  else
    launch(['dev', '--host', '127.0.0.1', '--port', '4321', '--strictPort'], 'hub', {
      ...process.env,
      NODUCT_DEV_TOOLS: proxyEnvironment(
        new Map(tools.map((tool) => [tool.slug, ports.get(tool.slug)!]))
      )
    });
  for (const tool of tools) {
    const port = only ? 4321 : ports.get(tool.slug)!;
    launch(
      [
        'dev',
        '--root',
        tool.packageDir,
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--strictPort'
      ],
      tool.slug
    );
  }
  console.log(
    only
      ? `Tool ready at http://localhost:4321/${tools[0]?.slug}/`
      : 'Hub and tools: http://localhost:4321/'
  );
  await new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (children.every((child) => child.exitCode !== null || child.killed)) {
        clearInterval(timer);
        resolve();
      }
    }, 200);
    timer.unref();
  });
}
