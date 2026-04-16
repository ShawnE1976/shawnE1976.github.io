// Playwright config for PhenoMap browser smoke tests.
//
// One-time setup (blocked in this sandbox, run locally or in CI):
//   npm install --save-dev @playwright/test
//   npx playwright install chromium
//
// Run the suite:
//   npm run test:e2e
//
// The webServer block starts a static file server on port 4173 pointing
// at the repo root, so the tests load the real index.html / app.js.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // npx-installed, no extra deps required.
    command: 'npx --yes http-server@14 -p 4173 -c-1 .',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
