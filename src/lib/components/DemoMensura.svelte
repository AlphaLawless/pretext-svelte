<script lang="ts">
  import { onMount } from 'svelte';
  import { prepare, layout } from '@chenglou/pretext';
  import { BODY_FONT, BODY_LINE_H } from '../constants.js';
  import SectionHead from './SectionHead.svelte';

  // Don Quixote, Chapter I · Miguel de Cervantes · 1605
  const TEXT =
    'In a village of La Mancha, the name of which I have no desire to call to mind, ' +
    'there lived not long since one of those gentlemen that keep a lance in the lance-rack, ' +
    'an old buckler, a lean hack, and a greyhound for coursing. An olla of rather more beef ' +
    'than mutton, a salad on most nights, scraps on Saturdays, lentils on Fridays, and a ' +
    'pigeon or so extra on Sundays, made away with three-quarters of his income.';

  let sliderWidth = $state(400);
  let computedHeight = $state(0);
  let computedLines = $state(0);
  let prepared = $state<ReturnType<typeof prepare> | null>(null);

  // Recompute whenever sliderWidth or prepared changes.
  // No DOM reads — pure arithmetic over the cached segment widths.
  $effect(() => {
    if (!prepared) return;
    const r = layout(prepared, sliderWidth, BODY_LINE_H);
    computedHeight = r.height;
    computedLines = r.lineCount;
  });

  onMount(async () => {
    await document.fonts.ready;
    prepared = prepare(TEXT, BODY_FONT);
  });
</script>

<section>
  <SectionHead numeral="I." titleLa="De Mensura" titleEn="On Measure" />

  <p class="desc">
    <code>prepare()</code> segments the text and measures each unit via canvas — once.
    <code>layout()</code> is thereafter pure arithmetic over cached widths: no DOM reads,
    no canvas calls. Drag the slider; the height updates without touching the DOM.
  </p>

  <div class="layout">
    <div class="text-col">
      <div class="controls">
        <span class="label">Width</span>
        <input class="slider" type="range" min="180" max="500" bind:value={sliderWidth} />
        <span class="value">{sliderWidth}px</span>
      </div>

      <!--
        The text-box intentionally uses an inline width so the line breaks
        change visibly as the slider moves. overflow: hidden on the wrapper
        prevents it from blowing out the flex parent on narrow viewports.
      -->
      <div class="text-box-clip">
        <div
          class="text-box"
          style="width: {sliderWidth}px; line-height: {BODY_LINE_H}px;"
        >
          {TEXT}
        </div>
      </div>

      <p class="attr">Don Quixote · Miguel de Cervantes · 1605</p>
    </div>

    <div class="metrics" aria-live="polite">
      <div class="metric">
        <span class="metric-val">{computedHeight}<span class="unit">px</span></span>
        <span class="metric-lbl">height</span>
      </div>
      <div class="metric">
        <span class="metric-val">{computedLines}</span>
        <span class="metric-lbl">lines</span>
      </div>
      <p class="note">↑ Pure arithmetic.<br />Zero DOM reads on resize.</p>
    </div>
  </div>
</section>

<style>
  section {
    margin-bottom: 64px;
  }

  .desc {
    font-size: 16px;
    line-height: 1.65;
    color: #3d2010;
    margin-bottom: 24px;
  }

  code {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    background: rgba(0, 0, 0, 0.07);
    padding: 1px 5px;
    border-radius: 2px;
    color: #1e0f08;
  }

  /* ── Two-column layout ──────────────────────────── */
  .layout {
    display: flex;
    gap: 28px;
    align-items: flex-start;
  }

  .text-col {
    /* flex: 1 with min-width: 0 prevents the child text-box from
       blowing out the flex container. */
    flex: 1;
    min-width: 0;
  }

  .metrics {
    width: 130px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 40px;
  }

  /* Stack on narrow viewports */
  @media (max-width: 540px) {
    .layout {
      flex-direction: column;
    }

    .metrics {
      width: 100%;
      flex-direction: row;
      flex-wrap: wrap;
      padding-top: 0;
    }
  }

  /* ── Controls ───────────────────────────────────── */
  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .label {
    font-size: 13px;
    font-variant: small-caps;
    color: #7a5c14;
    white-space: nowrap;
  }

  .slider {
    flex: 1;
    accent-color: #7a5c14;
    cursor: pointer;
    min-width: 0;
  }

  .value {
    font-size: 13px;
    color: #5c3d1f;
    min-width: 46px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Text box ───────────────────────────────────── */
  .text-box-clip {
    /* Clips the text-box when it is wider than the flex column,
       keeping horizontal page scroll contained within this element. */
    overflow-x: auto;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  .text-box {
    /* Font/size must match BODY_FONT / BODY_LINE_H for pretext accuracy. */
    font-family: 'IM Fell English', Georgia, serif;
    font-size: 18px;
    word-break: normal;
    overflow-wrap: break-word;
    line-break: auto;
    background: #f0e4c0;
    border: 1px solid #c4a254;
    padding: 14px 16px;
    color: #2c1810;
    /* No transition — the metrics update instantly and a CSS width
       animation would create a visible lag between them. */
  }

  .attr {
    font-size: 12px;
    font-style: italic;
    color: #9a7a3a;
    margin-top: 6px;
  }

  /* ── Metrics ────────────────────────────────────── */
  .metric {
    background: #f0e4c0;
    border: 1px solid #c4a254;
    padding: 10px 14px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .metric-val {
    font-size: 28px;
    line-height: 1.1;
    color: #1e0f08;
    font-variant-numeric: tabular-nums;
  }

  .unit {
    font-size: 14px;
    color: #9a7a3a;
    margin-left: 2px;
  }

  .metric-lbl {
    font-size: 11px;
    font-variant: small-caps;
    color: #9a7a3a;
    letter-spacing: 0.5px;
  }

  .note {
    font-size: 12px;
    font-style: italic;
    color: #7a5c14;
    line-height: 1.5;
    text-align: center;
    border-top: 1px solid #c4a254;
    padding-top: 10px;
  }
</style>
