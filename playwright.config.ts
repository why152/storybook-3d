import { defineConfig, devices } from '@playwright/test';

const production = process.env.STORYBOOK_TEST_PRODUCTION === '1';
const deployedURL = process.env.STORYBOOK_TEST_BASE_URL;
const browserName = process.env.STORYBOOK_TEST_BROWSER === 'webkit' ? 'webkit' : 'chromium';

export default defineConfig({
  testDir: './tests',
  timeout: 100_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    browserName,
    viewport: { width: 1440, height: 900 },
    baseURL: deployedURL || 'http://127.0.0.1:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: deployedURL ? undefined : {
    command: production
      ? 'npm run preview -- --host 127.0.0.1 --port 5173 --strictPort'
      : 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !production && !process.env.CI,
    timeout: 30_000,
  },
});
