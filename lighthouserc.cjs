const { execFileSync } = module.require('node:child_process');
const paths = JSON.parse(
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/lighthouse-urls.ts'], {
    encoding: 'utf8'
  })
);
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'pages artifact ready',
      startServerReadyTimeout: 120000,
      url: paths.map((path) => `http://127.0.0.1:4321${path}`),
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-gpu',
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'unused-javascript': ['warn', { maxLength: 0 }]
      }
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-report' }
  }
};
