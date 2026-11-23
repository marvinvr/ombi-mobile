import { defineConfig, devices } from '@playwright/test';

/**
 * E2E suite. By default it serves the production build in ./www with `serve -s`
 * (exactly what the Docker runtime stage does). Set E2E_BASE_URL to run against an
 * already running instance instead, e.g. the Docker container:
 *   E2E_BASE_URL=http://localhost:3000 npx playwright test
 */
const PORT = 4300;
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // Small tolerance for anti-aliasing noise; anything larger is investigated.
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'Europe/Zurich',
    // The production build registers a service worker; it would sit between the page and
    // Playwright's request interception, so it is blocked except in the dedicated PWA test.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'android-chromium',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'iphone-webkit',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx serve -s www -l ${PORT} --no-port-switching --no-clipboard`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
