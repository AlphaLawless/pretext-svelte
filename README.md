# Pretext in Svelte

A demonstration app built with **SvelteKit 5** and **[@chenglou/pretext](https://github.com/chenglou/pretext)** — a JavaScript/TypeScript library for measuring and computing multiline text layout **without ever touching the DOM**.

The project presents four interactive demos styled after 16th–17th century manuscripts, each illuminating a different facet of the pretext API.

---

## The problem pretext solves

In the browser, the traditional way to know the height of a text block is to read it from the DOM:

```js
const height = element.getBoundingClientRect().height;
```

This looks harmless, but carries a hidden cost. Every time you read a geometric measurement from the DOM (`getBoundingClientRect`, `offsetHeight`, `scrollHeight`, etc.), the browser must guarantee the layout is up to date. If you wrote to the DOM before this read — added text, changed a style, resized a container — the browser must execute a full **layout reflow** before it can give you the correct number.

A layout reflow walks the entire DOM tree and recalculates the position and size of every element. In pages with hundreds of independent components measuring text (virtualised lists, chat panels, rich editors), this cost compounds. A screen that should render in 8ms can easily take 50–200ms, causing visible jank.

### pretext's solution: two stages, clearly separated

pretext splits the work into two phases with distinct responsibilities:

```
Phase 1 — prepare()    → expensive, run ONCE per text + font combination
Phase 2 — layout()     → cheap, run EVERY TIME the container changes width
```

**`prepare(text, font)`** does all the heavy lifting up front:
- Normalises spaces and line breaks according to CSS rules (`white-space: normal`)
- Segments text into break units using `Intl.Segmenter` (works in any language: Arabic, CJK, Thai, etc.)
- Applies "glue" rules — punctuation that cannot detach from the preceding word, soft hyphens, non-breaking spaces (`&nbsp;`), zero-width spaces, etc.
- Measures the width of each segment using `canvas.measureText()`, which goes directly to the browser's font engine without touching the DOM
- Stores everything in a cache keyed by `Map<font, Map<segment, metrics>>`

**`layout(prepared, maxWidth, lineHeight)`** is pure arithmetic:
- Walks the already-measured segments
- Accumulates widths until `maxWidth` is exceeded, recording each line break
- Counts lines, multiplies by `lineHeight`
- Returns `{ height, lineCount }` — **zero DOM, zero canvas, zero extra allocations**

On resize, you only call `layout()`. At 60fps with hundreds of text blocks, this is practical.

---

## Demos

### I. De Mensura — *On Measure*

Demonstrates the core use case: predicting the height of a paragraph without any DOM read.

A slider controls the width of a text block. On every movement, `layout()` instantly recomputes height and line count. The displayed text is an ordinary HTML `<div>` — but the numbers shown in the metrics panel come exclusively from pretext, with no DOM reads involved.

**API used:**
```ts
import { prepare, layout } from '@chenglou/pretext';

const prepared = prepare(text, '18px "IM Fell English"');

// On every resize:
const { height, lineCount } = layout(prepared, widthInPx, 30);
```

**Why this matters:** enables precise virtualisation of long lists, scroll-anchor preservation when new content loads, and compile-time verification that labels won't overflow their containers.

---

### II. De Pagina — *On the Page*

Demonstrates canvas text rendering with manual layout, including a drop cap that uses the same flow logic as Demo III.

The text is the opening stanza of *Os Lusíadas* by Luís de Camões (1572). The initial letter "A" is rendered in a large font on the left; the first few lines of the poem flow through the space to its right, then expand to full width — all driven by `layoutNextLine()`.

**API used:**
```ts
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';

const prepared = prepareWithSegments(text, font, { whiteSpace: 'pre-wrap' });
let cursor = { segmentIndex: 0, graphemeIndex: 0 };

while (true) {
  // Width varies: narrow for the drop-cap rows, full width after
  const maxW = lineIndex < dropCapLines ? narrowWidth : fullWidth;
  const x    = lineIndex < dropCapLines ? dropCapRight : margin;

  const line = layoutNextLine(prepared, cursor, maxW);
  if (line === null) break;

  ctx.fillText(line.text, x, y);
  cursor = line.end;
  y += lineHeight;
}
```

**Why `layoutNextLine()` instead of `layoutWithLines()`:** per-line width variation (drop cap) is precisely the case `layoutNextLine()` was designed for. `layoutWithLines()` only accepts a single fixed width for all lines.

---

### III. De Fluxu — *On Flow*

Demonstrates pretext's most expressive capability: **text that reflows around a moving obstacle**, recomputed on every animation frame.

An astrolabe (drawn with canvas paths) orbits in an ellipse across the canvas. On each animation frame, the lines of Hamlet's soliloquy are re-broken around wherever the astrolabe currently sits — without any additional `prepare()` call.

```ts
while (true) {
  const vertOverlap = y > obsTop && (y - lineH) < obsBottom;

  let x: number, maxW: number;

  if (vertOverlap) {
    if (orbCx >= W / 2) {
      // Obstacle on the right → text runs from left margin to obstacle
      x = PAD; maxW = obsLeft - PAD;
    } else {
      // Obstacle on the left → text starts after the obstacle
      x = obsRight; maxW = W - PAD - obsRight;
    }
  } else {
    x = PAD; maxW = W - PAD * 2; // free row, full width
  }

  const line = layoutNextLine(prepared, cursor, maxW);
  if (line === null) break;

  ctx.fillText(line.text, x, y);
  cursor = line.end;
  y += lineH;
}
```

`layoutNextLine()` only needs the `maxW` for each row. The rendering code decides where on the canvas to paint the text. `prepared` was computed exactly once in `onMount`.

#### "Reset" button — shortest-path return

On reset, the animation finds the shortest arc back to the origin (`angle = 0`) on the circular orbit:

```
angle < π  →  reverse direction (decrement angle back to 0)
angle ≥ π  →  complete the orbit (increment angle forward to 2π → wraps to 0)
```

The return uses a linear ease-out: it starts at full speed and decelerates proportionally to the remaining distance, never overshooting the origin.

---

### IV. De Compressione — *On Compression*

Demonstrates `walkLineRanges()` — the multiline equivalent of CSS `fit-content`, which CSS itself has never provided.

For each quote (Latin, Chinese, Arabic, etc.), the code finds the **minimum width** that still accommodates the text with the fewest possible line breaks:

```ts
import { walkLineRanges, layoutWithLines } from '@chenglou/pretext';

const prepared = prepareWithSegments(text, font);

// walkLineRanges returns the real width of each line WITHOUT building strings.
// The tightest container = the widest of those line widths.
let maxLineW = 0;
walkLineRanges(prepared, 300, (line) => {
  if (line.width > maxLineW) maxLineW = line.width;
});

const shrinkW = Math.ceil(maxLineW) + 20;
const { lines } = layoutWithLines(prepared, shrinkW, lineHeight);
```

**`walkLineRanges` vs `layoutWithLines`:** `walkLineRanges` never builds the text strings for each line (geometry only), making it ideal for iterative width search. Once you have the ideal width, call `layoutWithLines` once to get the actual line strings.

---

## Project structure

```
src/
├── lib/
│   ├── constants.ts                    ← shared typography constants
│   │                                      (BODY_FONT, BODY_LINE_H, INK, PARCHMENT)
│   ├── canvas/
│   │   ├── canvas-helpers.ts           ← canvas utilities (setupCanvas, parchmentBg, doubleBorder)
│   │   └── draw-astrolabe.ts           ← astrolabe drawing, Svelte-agnostic
│   └── components/
│       ├── SectionHead.svelte          ← reusable section header
│       ├── DemoMensura.svelte          ← Demo I
│       ├── DemoPagina.svelte           ← Demo II
│       ├── DemoFluxu.svelte            ← Demo III
│       └── DemoCompressione.svelte     ← Demo IV
└── routes/
    ├── +layout.svelte                  ← global CSS reset, Google Fonts, body styles
    └── +page.svelte                    ← orchestrator (~50 lines), no business logic
```

### Design principles

**`constants.ts` as single source of truth:** the typography constants that pretext uses (`BODY_FONT`, `BODY_LINE_H`) must be identical to the corresponding CSS declarations in the component that displays the text. Centralising them in one file eliminates the possibility of silent divergence.

**Canvas utilities in plain `.ts`:** `canvas-helpers.ts` and `draw-astrolabe.ts` import nothing from Svelte. They are ordinary TypeScript modules, independently testable, importable from any context.

**Local `onMount` per component:** each component awaits `document.fonts.ready` independently. Since `fonts.ready` resolves immediately once fonts are loaded, multiple calls carry no overhead.

**Surgical reactivity:** in `DemoFluxu`, `angle` and `phase` are `$state` because the template reads them (button `disabled` state, button labels). The animation loop calls `draw()` imperatively — no `$effect` in the critical path, no unnecessary reconciliation at 60fps.

---

## Getting started

```sh
# Install dependencies
bun install

# Development server at http://localhost:5173
bun dev

# Type-check + lint
bun run check

# Production build
bun run build
```

---

## pretext API quick reference

| Function | When to use |
|---|---|
| `prepare(text, font)` | Use case 1: you only need height. Returns an opaque handle for `layout()`. |
| `layout(prepared, maxWidth, lineHeight)` | Resize hot path. Returns `{ height, lineCount }`. Zero DOM, zero canvas. |
| `prepareWithSegments(text, font)` | Use case 2: you need to render lines manually (canvas, SVG, WebGL). |
| `layoutWithLines(prepared, maxWidth, lineHeight)` | Fixed width for all lines. Returns `{ lines: [{ text, width, start, end }] }`. |
| `walkLineRanges(prepared, maxWidth, onLine)` | Geometry without strings. Ideal for width search, shrink-wrap, line counting. |
| `layoutNextLine(prepared, cursor, maxWidth)` | One line at a time with variable width. The only way to flow around obstacles. |
| `clearCache()` | Releases the internal cache. Useful if the app cycles through many fonts. |
| `setLocale(locale)` | Changes the `Intl.Segmenter` locale for future `prepare()` calls. Clears cache automatically. |

### Whitespace modes

| Option | Behaviour |
|---|---|
| *(default)* | `white-space: normal` — spaces collapse, no explicit line breaks. |
| `{ whiteSpace: 'pre-wrap' }` | Spaces, tabs, and `\n` are preserved. Suited for editors and textareas. |

### Unicode script support

pretext uses `Intl.Segmenter` as its base (full Unicode coverage) and adds preprocessing layers for cases the standard segmenter alone does not handle correctly:

- **CJK:** grapheme-level splitting + kinsoku rules (characters prohibited at line start/end)
- **Arabic / Urdu:** space-free punctuation clusters, combining diacritic marks
- **Thai / Khmer / Lao / Myanmar:** relies on `Intl.Segmenter` with diagnostic adjustments
- **Emoji:** automatic width correction per font size (canvas measures differently from the DOM)
- **Mixed bidi:** bidi level metadata available via `prepareWithSegments()`, for manual canvas rendering

### Known limitations

- `system-ui` is inaccurate on macOS — canvas and DOM resolve to different font variants at certain sizes. Use a named font instead.
- CSS target is `white-space: normal`, `word-break: normal`, `overflow-wrap: break-word`, `line-break: auto`. Other combinations are untested.
- No automatic hyphenation — only manual soft hyphens (`&shy;`) are supported.
- Server-side rendering requires `OffscreenCanvas` or a compatible canvas implementation.

---

## Credits

- **[@chenglou/pretext](https://github.com/chenglou/pretext)** — text layout library
- **[IM Fell English](https://fonts.google.com/specimen/IM+Fell+English)** — typeface based on the types of Dr. John Fell, 17th century, via Google Fonts
- Content: *Os Lusíadas* (Camões, 1572), *Hamlet* (Shakespeare, c. 1601), *Don Quixote* (Cervantes, 1605)
