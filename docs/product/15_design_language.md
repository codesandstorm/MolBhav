# 15 · Design language

**LOCKED v1.0**, 2026-11-11 (Phase A2 revision). Tags: [EVIDENCE: path or command] · [HYPOTHESIS] · [GAP]. Nothing here has been tested with users; every "feels like" statement is a [HYPOTHESIS] until measured with consent ([04_research_integrity.md](04_research_integrity.md) §4).

The source of truth is code: [packages/tokens/src/index.ts](../../packages/tokens/src/index.ts). `tokens.css` is generated from it. Four tests guard it [EVIDENCE: packages/tokens/test/tokens.test.ts]:
- drift: `tokens.css` must equal what `index.ts` generates;
- contrast: every pair in use, and text on glass, must pass WCAG AA;
- raw-colour scan: no raw colour or px font size in app or site sources;
- **design lock** (§10): the token source must hash to the value in the changelog row for the current version.

## 1. Principles
| # | Principle | What it means in practice | Tag |
|---|---|---|---|
| P1 | **Calm app, expressive showcase** | The app has no 3D, no scroll effects and no sound; motion only shows cause and effect, ≤ 200 ms. The showcase may be immersive, but text and numbers come first. | [EVIDENCE: 08_experience_and_brand.md intro; 03_scope_and_cut_line.md D8] |
| P2 | **Numbers are claims** | Every number carries a visible label chip (FACT / CALCULATION / ESTIMATE / USER DECISION / RECOMMENDATION). Rupee amounts appear only inside a labelled claim or the user's own text. | [EVIDENCE: apps/app/test/labels.test.tsx; apps/site/e2e/hero.spec.ts] |
| P3 | **Stone, glass, light** | One material language for the three rungs on every surface: the **floor is stone** (heavy, matte, you stand on it), the **target is glass** with a copper rim (you can see how it was made), the **opening is light** (where you start, the brightest thing on screen). The app's rung cards, the showcase's 3D scene, its poster, the example card and the favicon all use it. | [HYPOTHESIS: design judgement] |
| P4 | **Semantic colour** | Tokens are named for their job (`text`, `surfaceSunken`, `rungFloor`), never their look. Colour never carries meaning alone: rungs always have their names in text. | [EVIDENCE: 08 §6] |
| P5 | **Text first** | Headline, promise, calls to action and every number are plain HTML, usable before any JavaScript runs. 3D replaces an identical poster, and only after the visitor's first interaction. | [EVIDENCE: apps/site/e2e/hero.spec.ts] |
| P6 | **Everything on our own origin** | Fonts self-hosted; no CDNs, no analytics; every request is same-origin GET. | [EVIDENCE: apps/app/e2e/privacy.spec.ts; apps/site/e2e/hero.spec.ts "privacy"] |
| P7 | **Glass only where it stays readable** | Text never sits on thin glass: glass fill is 86 % opaque (94 % for the top bar), and a test composites it over the brightest colour on the page before checking contrast. | [EVIDENCE: tokens.test.ts "text on glass"] |

## 2. Two moods
| | App (the working tool) | Showcase (the public site) |
|---|---|---|
| Purpose | decide a price quickly and correctly | explain what the ladder means |
| Type | Plex for UI and numbers; Fraunces for screen titles, italic for one emphasis | Fraunces display headings with italic emphasis; Plex for text and numbers |
| Layout | one column from 360 px; the ladder screen splits in two at 64 rem | text column + sticky stage; stacks on narrow screens |
| Motion | 120/200 ms; rungs rise in a 60 ms stagger; hover, press, disclosure | scroll-linked 3D through our own read-only scroll module; nothing is pinned |
| Depth | glass panels, a soft top glow, no 3D | one R3F canvas, procedural geometry, a poster for every state |

## 3. Type
| Role | Family | Why | Licence |
|---|---|---|---|
| Text, UI, all numbers | **IBM Plex Sans** 400/600 (`@fontsource/ibm-plex-sans` 5.3.0) | Legible at small sizes, tabular figures, and its latin-ext subset has the **₹ sign (U+20B9)**, so amounts never change font mid-number. | SIL OFL 1.1 [EVIDENCE: node_modules/@fontsource/ibm-plex-sans/LICENSE] |
| Display headings, screen titles, italic emphasis | **Fraunces** variable, weight axis, roman + italic (`@fontsource-variable/fraunces` 5.3.0) | A warm serif; its italic gives the one emphasised phrase per heading, as in the concept art. Never used for ₹ amounts. | SIL OFL 1.1 [EVIDENCE: node_modules/@fontsource-variable/fraunces/LICENSE] |

**Fluid scale** (rem, 360 px → 1280 px, `clamp()`): xs 0.8125→0.875 · sm 0.875→0.9375 · md 1→1.0625 · lg 1.125→1.25 · xl 1.375→1.625 · 2xl 1.75→2.25 · 3xl 2.25→3.25 · display 2.5→4.5. Line heights: tight 1.08 · snug 1.3 · body 1.55 [EVIDENCE: packages/tokens/src/index.ts].

## 4. Colour: provenance and contrast fixes
**Provenance.** The palette was sampled with Python PIL, in the scratchpad, from the owner's private concept art `docs/product/reference/concept_hero.png` (1672×941). That folder is gitignored and nothing from the image ships: no pixels, no copy, no layout [EVIDENCE: .gitignore "docs/product/reference/"; `git check-ignore`]. The brief named the file `hero-concept.png`; the file on disk is `concept_hero.png` [GAP: name mismatch, reported to the owner].

**Dark is the only theme.** The A2 light theme (paper and ink blue) is retired. A light set derived from these tokens would double the contrast work on glass and would not be showcased [HYPOTHESIS: not cheap]; this is listed as an owner decision.

| Role | Sampled (concept) | Token v1.0 | Used for |
|---|---|---|---|
| `bg` / `bgBand` | `#0F0D0E` / `#121217` | `#0F0D0E` / `#141215` | page / showcase bands |
| `surface` / `surfaceSunken` / `surfaceRaised` | glass panel `#2D2626`–`#392E2E` | `#1E1918` / `#171314` / `#2A2321` | cards, inputs, hover |
| `text` | headline cream `#FDF5ED` | `#FDF5ED` | body text |
| `textMuted` | body grey `#B1ACAB`; pillar grey `#747172` | `#B8AFA9` | hints, sub-text |
| `accent` / `accentDeep` | button `#F7D2B0` → `#EAB88B` | `#F7D2B0` / `#E2A673` | gradient, links, italic emphasis |
| `textOnAccent` | button label `#100F0E` | `#1A1210` | primary button text |
| `rungFloor` / `sceneStone` | stone `#7F5E54` | `#B9ABA2` / `#85706A` | floor text / stone in the scene |
| `rungTarget` / `sceneCopper` | rim and icon copper `#FBCC96`, `#D99B6E` | `#EBB487` / `#E2A673` | target text / copper rim |
| `rungOpening` / `sceneGlow` | italic peach `#FFE2B5` | `#FFE2B5` | the rung of light |
| `focus` | — | `#FFD9B0` | 3 px focus ring |
| `chipBg` / `chipText` | eyebrow chip `#483932` | `#2E2622` / `#F3D9C2` | label chips |
| `plannedText` | — (the concept's purple ring is not used) | `#D9C7F0` | the "Planned" chip only |
| `border` / `borderStrong` | divider `#2A2424` | `#332B29` / `#8C7C72` | hairlines / control borders |

Glass, glow and gradient tokens: `--mb-glass-fill` (tint `#1E1918` at 0.86), `--mb-glass-fill-strong` (0.94), `--mb-glass-border` (peach at 0.16), `--mb-glass-rim` (`#FFE2B5` at 0.55, a 1 px top-edge highlight), `--mb-glass-blur` 18 px, `--mb-gradient-accent` (`#F7D2B0` → `#E2A673`, top to bottom), `--mb-glow` (28 px, `#F7B98A` at 0.32).

**Where the concept failed contrast, and the fix** [EVIDENCE: contrast computation, this session; tokens.test.ts]:
| Concept pair | Ratio | Problem | Fix (mood kept) | Now |
|---|---|---|---|---|
| pillar sub-text `#747172` on band `#121217` | 3.87:1 | body text below 4.5:1 | warm grey lifted to `#B8AFA9` | 8.64:1 |
| secondary-button / divider line `#2A2424` on `#0F0D0E` | 1.27:1 | a control border below 3:1 | control borders use `borderStrong #8C7C72`; hairlines keep the dark tone only where they are decorative | 4.83:1 |
| text on translucent glass over the bright ribbon | not measurable | could fall to near the backdrop | glass made 86 % opaque; tested over the brightest page colour (composite `#3C332D`) | text 11.4 · muted 5.7 · floor 5.5:1 |
| stone `#7F5E54` as a UI mark | 3.35:1 | passes, but reads brown not stone | greyed to `#85706A` | 4.17:1 |
| button label `#100F0E` on `#F7D2B0` | 13.5:1 | fine; the gradient's darker end needed checking | label `#1A1210` checked on both ends | 13.0 / 8.7:1 |

**Every pair in use** (41 pairs plus 7 on-glass checks, all WCAG AA): text 14.3–18.0:1 · textMuted 7.2–9.0:1 · accent 10.9–13.7:1 · rung colours 6.9–15.5:1 · chips 9.4–11.0:1 · danger 7.8–9.8:1 · focus 13.1–14.6:1 (UI) · borderStrong 4.3–4.8:1 (UI) · scene marks 4.2–15.5:1 (UI) [EVIDENCE: `npx vitest run` in packages/tokens].

## 5. Showcase visual style: stone, glass and light
**One scene model, two renderers** (A2.1). Camera, framing, geometry and shading live in one pure module; the live scene (WebGL) and the poster (SVG, projected at build time) are both drawn from it, so the poster is the live scene's first frame by construction [EVIDENCE: apps/site/src/lib/scene-model.ts, poster.ts; apps/site/test/scene-model.test.ts].
- **Framing:** the eye never moves to fit the stage; only the zoom changes (`fitZoom`). A zoomed perspective picture is the same picture scaled, so the poster's fixed viewBox with "meet" frames the scene exactly as the live canvas does at 360, 768 and 1280 px.
- **Materials** (each a small shader; the poster runs the same formula in TypeScript on raw sRGB values, with no tone mapping and no colour management, so the arithmetic is identical):

| Element | Look | Formula (scene-model.ts) |
|---|---|---|
| Stones (4) and the floor slab | faceted (seeded, jittered icosahedra with a flat base), dark body, **copper rim** at the silhouette and from a copper back light, warm top glow from the opening | `shadeStone`: key light² × stone + copper × (fresnel⁴ + back light³) |
| Rails | thin glass, rim in `sceneGlow` | `shadeGlass` (`GLASS.rail`) |
| Target rung | glass with a **fresnel edge highlight** in copper and a specular glint | `shadeGlass` (`GLASS.target`) |
| Opening rung | a bar of light, copper at its edges; an elliptical additive halo | `shadeLight`, `haloAlpha` |
| Ribbon | one glass strip sweeping round the ladder (120 segments, one full twist, so it closes without a seam), fake glass, split into a back and a front half so it passes behind and in front of the rungs | `shadeGlass` (`GLASS.ribbon`) |
| Dust motes | 120 instanced points (≤ 150), soft discs, additive, drifting upwards | `motes()` |

- **Atmosphere** (CSS, shared by poster and canvas, no post-processing): warm light behind the ladder and a copper pool on the ground (radial gradients of `sceneGlow` and `sceneCopper`), and a vignette that fades into `bg` [EVIDENCE: apps/site/src/styles/site.css `.stage`].
- **Render order = painter's order:** back half of the ribbon, rails, stones and slab, target, opening and halo, front half of the ribbon, motes. Stones that overlap a rail are placed in front of it, so both renderers agree.
- **Poster vs first live frame:** reported in the budget run as a similarity number (1 − mean absolute RGB difference over the lit pixels, at quarter size); report-only, with the proposed threshold in 08 §8.3.
- **Ambient motion:** motes render at up to 30 fps only while the stage is on screen and the tab is visible; ambient motion stops for good if frames arrive too slowly. Pointer (mouse only) and device tilt move the camera a little (eased, 220 ms half-life); nothing needs it, and under reduced motion the scene never loads [EVIDENCE: LadderScene.tsx `Ambient`, `ParallaxInput`; hero.spec.ts "drawing stops off screen"].

**Choreography** (native scroll, nothing pinned) [EVIDENCE: apps/site/src/lib/choreography.ts; tests in apps/site/test/choreography.test.ts]:
1. Scroll position 0 is the hero, with the ladder assembled exactly as the poster draws it, so the live scene takes over without a visible jump.
2. Leaving the hero, the floor settles onto the stones and the upper rungs fold into it.
3. The floor, the target and the opening then rise one at a time. Each one finishes when the middle of its caption reaches the reading line (60 % down the viewport), at any width (`anchorsFor` + `piecewise`).
4. Progress is eased with a frame-rate-independent 90 ms half-life follow (`follow`).

**Poster**: the projected SVG above. It is the first frame, and the picture under reduced motion, without WebGL, with Save-Data, and after any failure.

**Showcase components** (apps/site):

| Component | Default | States |
|---|---|---|
| **Pillar icon** (`Icon.astro`) | one inline-SVG set on a 24 px grid, stroke 1.6, round ends, `currentColor` = `accent`, on a 48 px lit tile: calculator (exact numbers), tag with a tick (every claim labelled), phone with a lock (private on your device), two speech bubbles (practise, with the Planned chip) | decorative (`aria-hidden`); the heading says it in words |
| **Kicker** (`.kicker`) | small uppercase accent label above each section heading | — |
| **Section heading** | Fraunces, from `text-3xl` up to `text-display`, italic emphasis in `accent` | — |
| **Device frame** (`.device`) | glass frame around the real app's ladder screen (`public/product/app-ladder.webp`, lazy, 41 KB), caption "The real app (example data, made up)" | rises and settles as it scrolls in (`--rise`, our scroll module); static under reduced motion or without JavaScript |
| **Reveal** (`[data-reveal]`) | sections fade and rise 1.5 rem once, when scrolled to | shown at once on keyboard focus; never hidden without JavaScript or under reduced motion |
| **Footer** | gradient band, glass rim line, wordmark, the promise line, nav, small print | — |

The product shot is made by `apps/site/scripts/product-shot.ts` from the running app's own example deal. It is not part of the build; rerun it when the ladder screen changes.

## 6. Components (apps/app/src/components)
| Component | Default | Hover | Focus-visible | Active | Disabled | Error |
|---|---|---|---|---|---|---|
| **Button: primary** (`btn-primary`) | peach-copper gradient pill, dark label, 48 px | copper glow | 3 px `focus` ring, 3 px offset | moves down 1 px | 50 % opacity, no motion | — |
| **Button: secondary** (`btn-secondary`) | transparent, `borderStrong` outline, peach label | `surfaceRaised` fill | ring | 1 px down | 50 % | — |
| **Button: quiet** (`btn-quiet`) | text only, 44 px | `surfaceRaised` fill | ring | 1 px down | 50 % | `aria-current="page"` turns it peach |
| **Button: danger** (`btn-danger`) | `danger` outline and label | `surfaceRaised` fill | ring | 1 px down | 50 % | — |
| **Glass panel** (`Glass`, `.glass`) | 86 % warm fill, hairline border, 18 px blur, copper rim on the top edge, soft shadow | — (static) | — | — | — | the danger zone uses `borderStrong` |
| **Chip** (`.chip`, `Planned`) | opaque `chipBg`, small caps-like label; "Planned" in `plannedText` | — | — | — | — | — |
| **Field** (`Field`) | label, hint (`data-rule`), 48 px sunken input row, optional ₹ prefix | border lightens | ring around the whole row | — | — | `danger` border, icon + message (`role="alert"`, `aria-describedby`) |
| **Choice** (segmented radios) | pills, real radio inputs | `surfaceRaised` | ring around the pill | — | — | checked: peach border, raised fill |
| **Quote track** (ladder screen) | a line from floor to opening (widened to include the quote), ticks for the three rungs, a dot for the quote, and the words Floor, Target, Opening under the ticks (spread so they never collide); one sentence for screen readers (`role="img"`) | — | — | — | — | below the floor: the dot turns `danger` |
| **Rung** (`Rung`) | name (Fraunces) + tagline, value with CALCULATION chip, bar; **opening**: gradient border and glow · **target**: glass with copper top rim · **floor**: stone gradient | — | — | — | — | — |
| **Disclosure** (`Disclosure`) | native `details`, closed by default, chevron | `surfaceRaised` | ring | chevron turns (200 ms) | — | — |
| **Top bar** (`TopBar`) | sticky glass (94 %), wordmark with the three-rung mark, one nav item ("Settings and privacy"): only screens that exist | — | ring | — | — | current page in peach |
| **Toast** (`Toast`) | fixed bottom pill, glass, `role="status"`; never shifts layout | — | — | — | — | — |

**Every state has a contrast pair.** Each hover, focus, active, checked and error rule that changes a colour has a row in `STATE_PAIRS` (packages/tokens/test/tokens.test.ts): the foreground token, the surface it sits on in that state, and its threshold (4.5:1 text, 3:1 UI and focus rings). A coverage test parses both stylesheets and fails if a state rule that sets `color`, `background`, `border-color`, `outline`, `box-shadow` or `opacity` has no row; rules that change no colour are listed by name. Disabled controls are exempt (WCAG 1.4.3). The app's axe e2e checks each screen with the pointer parked at (0,0), over every rung and button, and with keyboard focus on every focusable element, each after all animations have finished [EVIDENCE: tokens.test.ts "contrast (WCAG AA) in every interactive state"; apps/app/e2e/a11y.spec.ts].

A2.1 layout: on desktop the ladder screen puts the rungs and the room line in one column and the quote, working and actions in a second, sticky column, so there is no empty area under the rungs; the evidence table keeps whole words (a fixed "What" column, a wider page on desktop); the welcome's mini ladder sits on a lit panel with rails.

The screens use only these: welcome, setup (two glass groups, "Add more detail" toggle), ladder (three rungs, concession-room line, quote track, trace disclosure), evidence log (a table that stacks into cards below 40 rem), settings and privacy (what stays, what never leaves, delete everything) [EVIDENCE: apps/app/src/screens; screenshots in docs/product/screens/app-*].

## 7. Motion rules
| Token | Value | Use |
|---|---|---|
| `--mb-duration-fast` | 120 ms | hover, press, rung stagger step |
| `--mb-duration-base` | 200 ms | the app's maximum (08 intro): rung rise, toast, chevron |
| `--mb-duration-slow` | 480 ms | showcase poster/scene cross-fade |
| `--mb-duration-scene` | 1200 ms | reserved for the showcase |
| `--mb-ease-standard` / `settle` / `exit` | `cubic-bezier(0.2,0,0,1)` / `(0.16,1,0.3,1)` / `(0.4,0,1,1)` | UI / arriving / leaving |
- Only `opacity` and `transform` animate, so nothing shifts layout [EVIDENCE: apps/*/src/**/*.css; CLS 0.001 in the budget run].
- **App entrance animations move, they do not fade.** The rung rise and the toast animate `transform` only. A fade puts text below 4.5:1 for part of its duration: on CI, axe sampled the Target rung mid-fade and measured its tagline at 2.85:1 and its chip at 3.74:1 (opacity ≈ 0.5). A test fails if any app `@keyframes` animates `opacity` [EVIDENCE: tokens.test.ts "no app entrance animation fades text"]. The showcase's section reveals still fade [GAP: the site was outside this fix and was not measured mid-reveal].
- `prefers-reduced-motion: reduce` sets every duration to 0 ms, and both stylesheets disable animation and transition. In the showcase the 3D island is never hydrated, so no animation code is downloaded [EVIDENCE: apps/site/e2e/hero.spec.ts "reduced motion"].
- 3D loads only after the first scroll, wheel, touch, pointer press or key press. Pointer movement does not count, because browsers may synthesise it [EVIDENCE: apps/site/src/lib/first-interaction.ts and its tests].
- No autoplay, no scroll-jacking, no pinning, no smooth-scroll override, no preloader, no audio. Ambient motes and parallax are the only motion not driven by scroll; both stop off screen and never run under reduced motion.
- Section reveals and the product shot's rise use `--mb-duration-slow` and `--mb-ease-settle`, and animate only opacity and transform.
- Below 30 fps for 2 s while animating, or on a lost WebGL context, the scene hands back to the poster [EVIDENCE: apps/site/src/lib/fps-guard.ts; hero.spec.ts].

## 8. Spacing, radius, elevation, layers
Spacing: 0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6 rem. Radius: sm 0.5 · md 0.875 · lg 1.5 rem · pill. Elevation: `1` and `2` are deep soft shadows with a faint inset top highlight (dark only). z-layers: base 0 · raised 10 · sticky 100 · overlay 1000 · toast 1100. Touch targets ≥ 44 px (primary buttons and inputs 48 px) [EVIDENCE: 08 §6; hero.spec.ts "360 px"].

## 9. Forbidden
- Raw colours (`#hex`, `rgb()`, `hsl()`, named colours) or px font sizes in app or site CSS, `.astro` or `.tsx` [EVIDENCE: tokens.test.ts scan].
- `three`, `@react-three/*` or `gsap` imported in `apps/app` [EVIDENCE: eslint.config.js; apps/app/test/lint-rules.test.ts]. GSAP is no longer a dependency anywhere.
- Third-party requests of any kind [EVIDENCE: privacy tests].
- A number or ₹ amount without a visible label chip; numbers baked into textures or hidden by animation.
- Copy the claims register marks REMOVE or KEEP-WHEN-not-yet. From the concept art in particular: "backed by evidence", "market evidence", "real, sourced rate insights", "market data, not guesswork", any readiness score or percentage, "win negotiations", AI role-play presented as existing, a Research / Use Cases / Team nav, a personal greeting [EVIDENCE: 11_claims_register.md; hero.spec.ts "no claim the register forbids"].
- Anything not built shown without the "Planned" chip.
- Copying any other site's or the concept image's pixels, layout, assets or code.

## 10. Lock and change process
This language is **LOCKED v1.0**. To change any token:
1. Add a new row to the changelog below with the next version, the date (YYYY-MM-DD), the reason, the before/after screenshots (paths under `docs/product/screens/`), and the new hash.
2. Bump `designVersion` in `packages/tokens/src/index.ts`, run `npm run build:css -w packages/tokens`, and update the "LOCKED vX.Y" line at the top of this doc.
3. `npm test` must pass. The lock test reads the last row, so editing tokens without a new row fails.

Get the hash with: `node -e "const c=require('crypto'),fs=require('fs');console.log(c.createHash('sha256').update(fs.readFileSync('packages/tokens/src/index.ts','utf8').replace(/\r\n/g,'\n')).digest('hex'))"`.

**B1.1b contrast fix (2026-11-11): no token changed.** The rung and toast entrance animations no longer fade (§7), and every interactive state now has a tested contrast pair (§6). Only CSS and tests changed; the token source still hashes to the v1.0 row, so no new row was added.

**A2.1 polish (2026-11-11): no token changed.** The token source still hashes to the v1.0 row, so no new row was added; every new colour in A2.1 (scene shading, atmosphere, icons) is mixed from existing tokens.

Limits [GAP]: the test cannot stop someone from editing the hash in an existing row. Review catches that, because changelog rows are append-only by rule.

| Version | Date | Change and reason | Screenshots (before → after) | Token source sha256 |
|---|---|---|---|---|
| 1.0 | 2026-11-11 | Re-skin to the concept-art language (dark, cream, peach-copper, glass, stone/glass/light rungs); contrast fixes in §4; glass, glow and gradient tokens; light theme retired; lock introduced. | A2 v0.1 shots (paper/ink, replaced) → `docs/product/screens/*-{360,768,1280}.jpg` | `cd480357d1d85313c498e68041b24ccb518f1fc30343ade8c354dc5e3df3b8e8` |

## 11. Asset and licence register
| Asset | Version | Licence | Where |
|---|---|---|---|
| IBM Plex Sans (fonts) | @fontsource/ibm-plex-sans 5.3.0 | SIL OFL 1.1 | app + site |
| Fraunces (font, roman + italic) | @fontsource-variable/fraunces 5.3.0 | SIL OFL 1.1 | app + site |
| three | 0.187.0 | MIT | site (3D chunk) |
| @react-three/fiber | 9.8.2 | MIT | site (3D chunk) |
| Scroll progress | our own (`apps/site/src/lib/scroll-progress.ts`) | project code | site (3D chunk) |
| Scene model, shaders, projected poster, pillar icon set, favicon | — | made for MolBhav | site, app |
| Product shot (`app-ladder.webp`) | generated from apps/app | project output | site |

GSAP was removed in A2 (decision 3) [EVIDENCE: apps/site/package.json; package-lock.json has no `gsap`]. No models, textures, HDRIs or audio are downloaded; the only image is the product shot, loaded lazily from the same origin [EVIDENCE: apps/site/e2e/budget.spec.ts, hero.spec.ts].
