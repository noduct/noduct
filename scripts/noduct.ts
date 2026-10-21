import { build } from './cli/build.ts';
import { check } from './cli/check.ts';
import { dev } from './cli/dev.ts';
import { newTool } from './cli/new-tool.ts';
import { preview } from './cli/preview.ts';
import { e2e } from './cli/e2e.ts';
import { verify } from './cli/verify.ts';

const [command, ...raw] = process.argv.slice(2);
const args = raw[0] === '--' ? raw.slice(1) : raw;

async function main(): Promise<void> {
  switch (command) {
    case 'dev':
      return dev(args);
    case 'build':
      return build(args);
    case 'preview':
      return preview();
    case 'check':
      return check(args[0]);
    case 'e2e':
      return e2e(args);
    case 'verify':
      return verify();
    case 'new-tool':
      return newTool(args);
    default:
      throw new Error(`Unknown command: ${command ?? '(none)'}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
