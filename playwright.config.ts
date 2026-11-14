import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  timeout: 45_000,
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4175', browserName: 'chromium', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'phone', use: { viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
});
