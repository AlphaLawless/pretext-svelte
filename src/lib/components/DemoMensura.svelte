<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
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

  let sliderWidth = $state(320);
  let maxSliderWidth = $state(500);
  let computedHeight = $state(0);
  let computedLines = $state(0);
  let prepared = $state<ReturnType<typeof prepare> | null>(null);
  let textColEl = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!prepared) return;
    const r = layout(prepared, sliderWidth, BODY_LINE_H);
    computedHeight = r.height;
    computedLines = r.lineCount;
  });

  let ro: ResizeObserver | null = null;

  onMount(async () => {
    await document.fonts.ready;
    prepared = prepare(TEXT, BODY_FONT);
  });

  // Separate sync onMount so it can return a cleanup function.
  onMount(() => {
    if (!textColEl) return;
    ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      maxSliderWidth = Math.min(500, w);
      if (sliderWidth > maxSliderWidth) sliderWidth = maxSliderWidth;
    });
    ro.observe(textColEl);
    return () => ro?.disconnect();
  });

  onDestroy(() => ro?.disconnect());
</script>

<section>
  <SectionHead numeral="I." titleLa="De Mensura" titleEn="On Measure" />

  <p class="desc">
    <code>prepare()</code> segments the text and measures each unit via canvas — once.
    <code>layout()</code> is thereafter pure arithmetic over cached widths: no DOM reads,
    no canvas calls. Drag the slider; the height updates without touching the DOM.
  </p>

  <div class="layout">
    <div class="text-col" bind:this={textColEl}>
      <div class="controls">
        <span class="label">Width</span>
        <input
          class="slider"
          type="range"
          min="120"
          max={maxSliderWidth}
          bind:value={sliderWidth}
        />
        <span class="value">{sliderWidth}px</span>
      </div>

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
      <div class="metrics-row">
        <div class="metric">
          <span class="metric-val">{computedHeight}<span class="unit">px</span></span>
          <span class="metric-lbl">height</span>
        </div>
        <div class="metric">
          <span class="metric-val">{computedLines}</span>
          <span class="metric-lbl">lines</span>
        </div>
      </div>
      <p class="note">↑ Pure arithmetic. Zero DOM reads on resize.</p>
    </div>
  </div>
</section>

<style>
  section {
    margin-bottom: 64px;
  }

  .desc {
    font-size: 16px;
    line-height: 1.7;
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

  @media (max-width: 480px) {
    .desc {
      font-size: 17px;
    }

    code {
      font-size: 14px;
    }
  }

  /* ── Two-column layout ───────────────────── */
  .layout {
    display: flex;
    gap: 28px;
    align-items: flex-start;
  }

  .text-col {
    flex: 1;
    min-width: 0;
  }

  .metrics {
    width: 140px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 40px;
  }

  .metrics-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Stack on narrow viewports */
  @media (max-width: 540px) {
    .layout {
      flex-direction: column;
    }

    .metrics {
      width: 100%;
      padding-top: 0;
    }

    .metrics-row {
      flex-direction: row;
    }

    .metric {
      flex: 1;
    }
  }

  /* ── Controls ────────────────────────────── */
  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .label {
    font-size: clamp(13px, 3.5vw, 14px);
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

  /* ── Text box ────────────────────────────── */
  .text-box-clip {
    overflow-x: auto;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  .text-box {
    font-family: 'IM Fell English', Georgia, serif;
    font-size: 18px;
    word-break: normal;
    overflow-wrap: break-word;
    line-break: auto;
    background: #f0e4c0;
    border: 1px solid #c4a254;
    padding: 14px 16px;
    color: #2c1810;
  }

  .attr {
    font-size: 12px;
    font-style: italic;
    color: #9a7a3a;
    margin-top: 6px;
  }

  /* ── Metrics ─────────────────────────────── */
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
    border-top: 1px solid #c4a254;
    padding-top: 10px;
    text-align: center;
  }

  @media (max-width: 540px) {
    .note {
      text-align: left;
    }
  }

  @media (max-width: 480px) {
    .attr    { font-size: 13px; }
    .note    { font-size: 13px; }
    .metric-lbl { font-size: 12px; }
  }
</style>
