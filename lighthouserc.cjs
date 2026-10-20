const { execFileSync } = module.require('node:child_process');
const lighthousePort = Number(process.env.PORT ?? 4321);
const paths = JSON.parse(
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/lighthouse-urls.ts'], {
    encoding: 'utf8'
  })
);
const assertions = {
  'categories:performance': ['error', { minScore: 0.9 }],
  'categories:accessibility': ['error', { minScore: 0.95 }],
  'categories:best-practices': ['error', { minScore: 0.95 }],
  'crawlable-anchors': 'error',
  'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
  'total-blocking-time': ['error', { maxNumericValue: 200 }],
  'unused-javascript': ['warn', { maxLength: 0 }]
};
const url = (path) => `http://127.0.0.1:${lighthousePort}${path}`;
const exactUrlPattern = (path) => `^${url(path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`;
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'pages artifact ready',
      startServerReadyTimeout: 120000,
      url: paths.map(({ path }) => url(path)),
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-gpu',
        preset: 'desktop'
      }
    },
    assert: {
      assertMatrix: paths.map(({ path, indexable }) => ({
        matchingUrlPattern: exactUrlPattern(path),
        assertions: {
          ...assertions,
          // Lighthouse keeps noindex in the category score even when its assertion is off.
          'categories:seo': ['error', { minScore: indexable ? 0.95 : 0.9 }],
          ...(indexable ? {} : { 'is-crawlable': 'off' })
        }
      }))
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-report' }
  }
};
