import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'iphone-se',
      use: {
        ...devices['iPhone SE'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'iphone-14-pro',
      use: { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'ipad-portrait',
      use: { viewport: { width: 768, height: 1024 }, isMobile: false },
    },
    {
      name: 'ipad-landscape',
      use: { viewport: { width: 1024, height: 768 }, isMobile: false },
    },
    {
      name: 'laptop',
      use: { viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'ultrawide',
      use: { viewport: { width: 2560, height: 1440 } },
    },
  ],
});
