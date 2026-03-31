<script lang="ts">
  import { onMount } from 'svelte';
  import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';
  import { setupCanvas, parchmentBg, doubleBorder } from '../canvas/canvas-helpers.js';
  import { INK } from '../constants.js';
  import SectionHead from './SectionHead.svelte';

  // Os Lusíadas, Canto I, est. 1 · Luís Vaz de Camões · Lisboa, MDLXXII
  // Leading 'A' is rendered separately as a drop cap.
  const TEXT_DROPCAP = 'A';
  const TEXT_BODY =
    's armas e os barões assinalados,\n' +
    'Que da ocidental praia Lusitana,\n' +
    'Por mares nunca dantes navegados\n' +
    'Passaram ainda além da Taprobana,\n' +
    'Em perigos e guerras esforçados,\n' +
    'Mais do que prometia a força humana,\n' +
    'E entre gente remota edificaram\n' +
    'Novo Reino, que tanto sublimaram;';

  const W = 560;
  const H = 460;
  const PAD = 44;

  let canvas = $state<HTMLCanvasElement | null>(null);

  onMount(async () => {
    await document.fonts.ready;
    draw();
  });

  function draw() {
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    parchmentBg(ctx, W, H);
    doubleBorder(ctx, W, H);

    const textW = W - PAD * 2;

    // ── Header ─────────────────────────────────────
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = 'small-caps 12px "IM Fell English"';
    ctx.fillText('Os Lusíadas · Luís Vaz de Camões · Lisboa, MDLXXII', W / 2, 44);

    ctx.font = '18px serif';
    ctx.fillText('❧  ✦  ❧', W / 2, 66);

    // ── Drop cap ────────────────────────────────────
    const dropFont = '68px "IM Fell English"';
    const poemFont = '19px "IM Fell English"';
    const poemLineH = 31;

    ctx.font = dropFont;
    const dropW = ctx.measureText(TEXT_DROPCAP).width;
    const dropH = 68;
    const dropLines = Math.ceil(dropH / poemLineH);

    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.fillText(TEXT_DROPCAP, PAD, 86 + dropH * 0.78);

    // ── Poem body — flows around drop cap via layoutNextLine ──
    // The first `dropLines` rows are narrow (offset past the drop cap);
    // remaining rows use the full text width.
    const prepared = prepareWithSegments(TEXT_BODY, poemFont, { whiteSpace: 'pre-wrap' });
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = 86 + 12;
    let lineIdx = 0;

    ctx.font = poemFont;
    ctx.fillStyle = INK;

    while (true) {
      const narrow = lineIdx < dropLines;
      const maxW = narrow ? textW - dropW - 8 : textW;
      const x = narrow ? PAD + dropW + 8 : PAD;

      const line = layoutNextLine(prepared, cursor, maxW);
      if (line === null) break;

      ctx.fillText(line.text, x, y);
      cursor = line.end;
      y += poemLineH;
      lineIdx++;

      if (y > H - 40) break;
    }

    // ── Footer ornaments ────────────────────────────
    ctx.font = 'italic 11px "IM Fell English"';
    ctx.fillStyle = '#6b4b1a';
    ctx.textAlign = 'left';
    ctx.fillText('Canto I', 30, H - 26);
    ctx.textAlign = 'right';
    ctx.fillText('Fol. I', W - 30, H - 26);
    ctx.textAlign = 'center';
    ctx.font = '13px serif';
    ctx.fillText('⁂', W / 2, H - 26);
  }
</script>

<section>
  <SectionHead numeral="II." titleLa="De Pagina" titleEn="On the Page" />

  <p class="desc">
    <code>prepareWithSegments()</code> + <code>layoutNextLine()</code> place each line
    individually on canvas, SVG, or WebGL. The drop cap here uses a narrower available
    width for the first rows, then widens automatically — all via the same streaming cursor.
  </p>

  <div class="canvas-scroll">
    <canvas bind:this={canvas}></canvas>
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

  /* Scroll-container keeps the 560px canvas from breaking page layout
     on narrow viewports. position: relative establishes a stacking context
     so box-shadow renders predictably over sibling content. */
  .canvas-scroll {
    position: relative;
    display: inline-block;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    /* Shadow on the scroll-container rather than the canvas so it is
       never clipped by overflow: hidden on the canvas itself. */
    box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.12);
    border: 1px solid #c4a254;
    line-height: 0;
  }

  canvas {
    display: block;
  }
</style>
