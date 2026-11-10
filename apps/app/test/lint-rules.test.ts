// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const lint = async (code: string, file: string) => {
  const eslint = new ESLint({ cwd: root });
  const [r] = await eslint.lintText(code, { filePath: `${root}${file}` });
  return (r?.messages ?? []).map((m) => m.ruleId);
};

describe('lint guards', () => {
  it('the app cannot import three, gsap or @react-three/*', async () => {
    const ids = await lint(
      "import * as T from 'three'; import { gsap } from 'gsap'; import { Canvas } from '@react-three/fiber'; export { T, gsap, Canvas };",
      'apps/app/src/probe.ts',
    );
    expect(ids.filter((x) => x === 'no-restricted-imports')).toHaveLength(3);
  }, 30_000);
  it('the engine cannot use Math, Number or fractional literals', async () => {
    const ids = await lint(
      'export const f = (x: bigint) => Math.round(Number(x) * 1.5);',
      'packages/engine/src/probe.ts',
    );
    expect(ids).toEqual(['no-restricted-globals', 'no-restricted-globals', 'no-restricted-syntax']);
  }, 30_000);
});
