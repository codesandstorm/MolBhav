/**
 * Showcase performance budgets. Sources: docs/product/08_experience_and_brand.md §8.3
 * (the 300 KB, 1.5 MB, 2.5 s LCP and 30 fps rules). HTML + CSS, hero 3D JS and CLS were approved
 * by the owner in the Phase A2 revision; TBT applies to the window before the first interaction.
 * Sizes are compressed bytes on the wire (gzip from scripts/serve.mjs).
 */
export const budgets = {
  /** 08 §8.3: initial page weight before any 3D (HTML, CSS, fonts, JS) */
  initialBeforeThreeD: 300 * 1024,
  /** approved (A2 revision): the HTML document plus its CSS */
  htmlAndCss: 50 * 1024,
  /** approved (A2 revision): the hero's 3D JavaScript (three, R3F, scene), loaded after the first interaction */
  heroThreeDJs: 350 * 1024,
  /** 08 §8.3: 3D per scene (geometry + textures + its code here), loaded only on demand */
  sceneTotal: 1.5 * 1024 * 1024,
  /** 08 §8.3: Largest Contentful Paint on the lab mobile profile */
  lcpMs: 2500,
  /** approved (A2 revision): Cumulative Layout Shift, before and after the scene takes over */
  cls: 0.1,
  /** A2: Total Blocking Time in the window before the first interaction */
  tbtMs: 200,
} as const;

/** Lighthouse-like mobile lab profile, applied through the Chrome DevTools Protocol. */
export const mobileProfile = {
  viewport: { width: 360, height: 740 },
  rttMs: 150,
  downloadKbps: 1638.4,
  uploadKbps: 675,
  cpuSlowdown: 4,
} as const;
