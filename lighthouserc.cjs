module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4322',
      startServerReadyPattern: 'Local',
      startServerReadyTimeout: 120000,
      url: [
        'http://127.0.0.1:4322/noduct/',
        'http://127.0.0.1:4322/noduct/tools/',
        'http://127.0.0.1:4322/noduct/pdf-tools/',
        'http://127.0.0.1:4322/noduct/sponsor/'
      ],
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
