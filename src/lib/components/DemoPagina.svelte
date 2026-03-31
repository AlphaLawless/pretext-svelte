<script lang="ts">
  import { onMount } from 'svelte';
  import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';
  import { setupCanvas, parchmentBg, doubleBorder } from '../canvas/canvas-helpers.js';
  import { INK } from '../constants.js';
  import SectionHead from './SectionHead.svelte';

  // Os Lusíadas, Canto I, est. 1 · Luís Vaz de Camões · Lisboa, MDLXXII
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

    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = 'small-caps 14px "IM Fell English"';
    ctx.fillText('Os Lusíadas · Luís Vaz de Camões · Lisboa, MDLXXII', W / 2, 44);

    ctx.font = '18px serif';
    ctx.fillText('❧  ✦  ❧', W / 2, 66);

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

  <div class="canvas-wrap">
    <div class="canvas-scroll">
      <canvas bind:this={canvas}></canvas>
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
    .desc { font-size: 17px; }
    code  { font-size: 14px; }
  }

  /* Outer wrapper: block-level, caps width, pushes overflow inward */
  .canvas-wrap {
    width: 100%;
    max-width: 560px;
  }

  /* Scroll container: sits inside the wrapper, scrolls if canvas overflows */
  .canvas-scroll {
    display: block;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    /* Shadow here so it never gets clipped by the canvas overflow */
    box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.12);
    border: 1px solid #c4a254;
    line-height: 0;
    /* Stacking context so shadow renders correctly */
    position: relative;
  }

  canvas {
    display: block;
    /* Scale canvas down to fit on narrow viewports while preserving aspect
       ratio. The canvas pixel resolution stays unchanged; only the CSS display
       size shrinks. Works because browsers use the canvas width/height
       attributes as the intrinsic aspect ratio for height: auto. */
    max-width: 100%;
    height: auto;
  }
</style>
