import { describe, expect, it } from 'vitest';
import shot from '../src/lib/product-shot.json';
import { SHOT_SCREEN, shotSourceHash } from '../scripts/shot-source.ts';

describe('the product shot matches the app it claims to show', () => {
  it('was taken from the current ladder screen (else run: npm run shots:product)', () => {
    expect(shot.screen).toBe(SHOT_SCREEN);
    expect(
      shot.sourceSha256,
      'The app’s ladder screen changed since the product shot was taken. Run `npm run shots:product`.',
    ).toBe(shotSourceHash());
  });
});
