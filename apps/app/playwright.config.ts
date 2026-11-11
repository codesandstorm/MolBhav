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
  webServer: [
    {
      command: 'npm run build && npm run preview',
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
    {
      // the same build, served with the Cloudflare headers in public/_headers (e2e/csp.spec.ts)
      command:
        'node ../../scripts/pages-serve.ts --dir dist --headers public/_headers --port 4180 --spa',
      url: 'http://127.0.0.1:4180/',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
