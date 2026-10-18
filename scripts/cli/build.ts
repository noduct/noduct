import { rootDir } from '../pages-manifest.ts';
import { parallel, run, runAsync, selectedTools, localBin } from './shared.ts';
import { stampArtifact } from './artifact.ts';

export async function build(slugs: string[] = []): Promise<void> {
  const tools = selectedTools(slugs);
  await parallel([
    () => runAsync(localBin('astro'), ['build'], rootDir),
    ...(!slugs.length
      ? [
          () =>
            runAsync(
              localBin('astro'),
              ['build', '--root', 'tests/fixtures/sponsorship-app'],
              rootDir
            )
        ]
      : []),
    ...tools.map(
      (tool) => () => runAsync(localBin('astro'), ['build', '--root', tool.packageDir], rootDir)
    )
  ]);
  if (!slugs.length) {
    run(localBin('tsx'), ['scripts/assemble-pages.ts']);
    stampArtifact();
    console.log(`Build complete: hub + ${tools.length} tool(s), each compiled once.`);
  } else
    console.log(
      `Partial build complete: hub + ${tools.length} selected tool(s). Run npm run build for the complete Pages artifact.`
    );
}
