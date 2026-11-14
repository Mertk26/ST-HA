import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'phone-viewport', use: { viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
