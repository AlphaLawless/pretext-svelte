<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';
  import { setupCanvas, parchmentBg, doubleBorder } from '../canvas/canvas-helpers.js';
  import { drawAstrolabe } from '../canvas/draw-astrolabe.js';
  import { INK } from '../constants.js';
  import SectionHead from './SectionHead.svelte';

  // Hamlet, Act III Scene I · William Shakespeare · c. 1601
  const TEXT =
    "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer " +
    "the slings and arrows of outrageous fortune, or to take arms against a sea of troubles " +
    "and by opposing end them. To die—to sleep, no more; and by a sleep to say we end the " +
    "heartache and the thousand natural shocks that flesh is heir to: 'tis a consummation " +
    "devoutly to be wish'd. To die, to sleep; to sleep, perchance to dream—ay, there's the " +
    "rub, for in that sleep of death what dreams may come when we have shuffled off this mortal coil.";

  const FONT = '17px "IM Fell English"';
  const LINE_H = 27;
  const W = 560;
  const H = 380;
  const PAD = 28;
  const TEXT_START_Y = 88;

  const ORBIT_CX = W / 2;
  const ORBIT_CY = (TEXT_START_Y + H - PAD) / 2;
  const ORBIT_RX = 148;
  const ORBIT_RY = 82;
  const ORB_R = 56;
  const GAP = 14;

  const ORBIT_SPEED = 0.008; // radians per frame
  const RETE_FACTOR = 2.5;

  // ── State ──────────────────────────────────────────────────────────────────
  let canvas = $state<HTMLCanvasElement | null>(null);

  // Both `angle` and `phase` are read in the template, so they need $state.
  let angle = $state(0);
  type Phase = 'idle' | 'orbiting' | 'returning';
  let phase = $state<Phase>('idle');

  // Mutable vars used only in the animation loop — no DOM dependency.
  let rafId: number | null = null;
  // Total distance of the current return trip (for the ease-out calculation).
  let returnDistance = 0;
  // +1 = go forward to complete the orbit; -1 = go backward to origin.
  let returnDir: 1 | -1 = 1;

  let prepared: ReturnType<typeof prepareWithSegments> | null = null;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount(async () => {
    await document.fonts.ready;
    prepared = prepareWithSegments(TEXT, FONT);
    draw(angle);
  });

  onDestroy(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
  });

  // ── Draw ───────────────────────────────────────────────────────────────────
  function draw(a: number) {
    if (!canvas || !prepared) return;

    const orbCx = ORBIT_CX + ORBIT_RX * Math.cos(a);
    const orbCy = ORBIT_CY + ORBIT_RY * Math.sin(a);
    const reteAngle = a * RETE_FACTOR;

    const obsLeft  = orbCx - ORB_R - GAP;
    const obsRight = orbCx + ORB_R + GAP;
    const obsTop    = orbCy - ORB_R - GAP;
    const obsBottom = orbCy + ORB_R + GAP;

    const ctx = setupCanvas(canvas, W, H);
    parchmentBg(ctx, W, H);
    doubleBorder(ctx, W, H);

    drawAstrolabe(ctx, orbCx, orbCy, ORB_R, reteAngle);

    // Header
    ctx.font = 'small-caps 12px "IM Fell English"';
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.fillText('Hamlet, Prince of Denmark · Act III, Scene I · c. 1601', PAD, 36);

    // Flowing text
    ctx.font = FONT;
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';

    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = TEXT_START_Y;

    while (true) {
      const vertOverlap = y > obsTop && (y - LINE_H) < obsBottom;

      let x: number;
      let maxW: number;

      if (vertOverlap) {
        if (orbCx >= W / 2) {
          x = PAD;
          maxW = obsLeft - PAD;
        } else {
          x = obsRight;
          maxW = W - PAD - obsRight;
        }
      } else {
        x = PAD;
        maxW = W - PAD * 2;
      }

      if (maxW < 60) {
        y += LINE_H;
        if (y > H - PAD) break;
        continue;
      }

      const line = layoutNextLine(prepared, cursor, maxW);
      if (line === null) break;

      ctx.fillText(line.text, x, y);
      cursor = line.end;
      y += LINE_H;
      if (y > H - PAD) break;
    }

    ctx.font = 'italic 10px "IM Fell English"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b4b1a';
    ctx.fillText('Astrolabium', orbCx, orbCy + ORB_R + 14);
  }

  // ── Normal orbit ───────────────────────────────────────────────────────────
  function startAnimation() {
    if (phase === 'returning') return;
    cancelRaf();
    phase = 'orbiting';
    stepOrbit();
  }

  function stepOrbit() {
    if (phase !== 'orbiting') return;
    angle = (angle + ORBIT_SPEED) % (Math.PI * 2);
    draw(angle);
    rafId = requestAnimationFrame(stepOrbit);
  }

  function stopAnimation() {
    if (phase === 'returning') return;
    cancelRaf();
    phase = 'idle';
  }

  // ── Smart return ───────────────────────────────────────────────────────────
  // Shortest-path rule (on a circle, origin = 0):
  //   · Going backward costs `angle`      → shortest when angle < π
  //   · Going forward costs  `2π − angle` → shortest when angle ≥ π
  function reset() {
    if (phase === 'returning') return;
    if (angle === 0) return;

    cancelRaf();

    const backward = angle;           // cost going back to 0
    const forward  = Math.PI * 2 - angle; // cost going forward to 2π (= 0)

    if (backward <= forward) {
      returnDir = -1;
      returnDistance = backward;
    } else {
      returnDir = 1;
      returnDistance = forward;
    }

    phase = 'returning';
    stepReturn();
  }

  function stepReturn() {
    if (phase !== 'returning') return;

    // Remaining distance to origin from the current angle.
    const distToOrigin = returnDir === -1 ? angle : (Math.PI * 2 - angle);

    // Snap to origin when close enough.
    if (distToOrigin <= 0.005) {
      angle = 0;
      draw(0);
      phase = 'idle';
      return;
    }

    // Ease-out: linear interpolation from full speed down to 20% as we approach.
    // t goes from 1 (just started) to 0 (at origin).
    const t = distToOrigin / returnDistance;
    const speed = ORBIT_SPEED * (0.2 + 0.8 * t);
    // Never overshoot the origin.
    const step = Math.min(speed, distToOrigin);

    if (returnDir === -1) {
      angle = angle - step;
    } else {
      angle = angle + step;
      // When going forward and we've completed the circle, snap to origin.
      if (angle >= Math.PI * 2) {
        angle = 0;
        draw(0);
        phase = 'idle';
        return;
      }
    }

    draw(angle);
    rafId = requestAnimationFrame(stepReturn);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function cancelRaf() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
</script>

<section>
  <SectionHead numeral="III." titleLa="De Fluxu" titleEn="On Flow" />

  <p class="desc">
    <code>layoutNextLine()</code> lays out one row at a time, letting each line's
    available width change independently. As the astrolabe orbits, each line is
    re-broken around wherever the obstacle happens to be — left, right, or centre.
  </p>

  <div class="canvas-scroll">
    <canvas bind:this={canvas}></canvas>
  </div>

  <div class="controls">
    {#if phase === 'orbiting'}
      <button class="btn btn-stop" onclick={stopAnimation}>⏸ Parar</button>
    {:else}
      <button class="btn btn-spin" onclick={startAnimation} disabled={phase === 'returning'}>
        ↻ Girar
      </button>
    {/if}

    <button
      class="btn"
      class:btn-returning={phase === 'returning'}
      onclick={reset}
      disabled={angle === 0 || phase === 'returning'}
    >
      {phase === 'returning' ? '⟲ Retornando…' : '⟳ Reiniciar'}
    </button>
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

  .canvas-scroll {
    position: relative;
    display: inline-block;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.12);
    border: 1px solid #c4a254;
    line-height: 0;
  }

  canvas {
    display: block;
  }

  /* ── Controls ─────────────────────────────────────── */
  .controls {
    display: flex;
    gap: 10px;
    margin-top: 14px;
  }

  .btn {
    font-family: 'IM Fell English', Georgia, serif;
    font-size: 14px;
    padding: 6px 18px;
    border: 1px solid #c4a254;
    background: #f0e4c0;
    color: #2c1810;
    cursor: pointer;
    position: relative;
    transition: background 0.12s;
  }

  .btn:hover:not(:disabled) {
    background: #e2d0a0;
  }

  .btn:active:not(:disabled) {
    background: #d4bc84;
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .btn:focus-visible {
    outline: 2px solid #7a5c14;
    outline-offset: 2px;
  }

  .btn-stop {
    border-color: #8b3a1a;
    color: #8b3a1a;
  }

  .btn-stop:hover:not(:disabled) {
    background: #f5e0d4;
  }

  /* Subtle pulsing border while the astrolabe is finding its way home */
  .btn-returning {
    border-color: #7a5c14;
    color: #7a5c14;
    animation: pulse-border 1.2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%, 100% { opacity: 0.45; }
    50%       { opacity: 0.7; }
  }
</style>
