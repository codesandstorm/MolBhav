import { defineConfig } from '@playwright/test';

const PORT = 4321;
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: ci ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Locally: the system Edge (no browser download). In CI: Playwright's Chromium.
    ...(ci ? {} : { channel: 'msedge' }),
    // Headless Chromium has no GPU: software WebGL so the live scene can be tested.
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
  },
  webServer: [
    {
      command: 'npm run build && npm run preview',
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !ci,
      timeout: 180_000,
    },
    {
      // the same build, served with the Cloudflare headers in public/_headers (e2e/csp.spec.ts)
      command: 'node ../../scripts/pages-serve.ts --dir dist --headers public/_headers --port 4181',
      url: 'http://127.0.0.1:4181/',
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
