import { defineConfig } from 'vitest/config';

// Main suite. The hand-verified suite has its own config (vitest.hand.config.ts)
// so it is never run before the property tests are green.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/hand-verified.test.ts', '**/node_modules/**'],
  },
});
