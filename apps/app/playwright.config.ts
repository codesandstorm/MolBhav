import { defineConfig } from '@playwright/test';

const PORT = 4173;
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: ci ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Locally: the system Edge (no browser download). In CI: Playwright's Chromium.
    ...(ci ? {} : { channel: 'msedge' }),
    serviceWorkers: 'allow',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
});
