import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['test/hand-verified.test.ts'] },
});
