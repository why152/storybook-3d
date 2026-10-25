import { defineConfig, devices } from '@playwright/test';
const webkit=process.env.STORYBOOK_BROWSER==='webkit';

export default defineConfig({
  testDir: './tests',
  timeout: 100_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices[webkit?'Desktop Safari':'Desktop Chrome'],
    browserName:webkit?'webkit':'chromium',
    viewport: { width: 1440, height: 900 },
    baseURL: 'http://127.0.0.1:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
