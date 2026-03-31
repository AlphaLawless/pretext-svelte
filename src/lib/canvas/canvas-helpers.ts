import { PARCHMENT } from '../constants.js';

export function setupCanvas(
  el: HTMLCanvasElement,
  w: number,
  h: number
): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  el.width = w * dpr;
  el.height = h * dpr;
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  const ctx = el.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return ctx;
}

export function parchmentBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  ctx.fillStyle = PARCHMENT;
  ctx.fillRect(0, 0, w, h);
  // Subtle grain — fixed seed isn't available in JS, but density is low enough
  // that the noise looks consistent across redraws.
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
}

export function doubleBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  ctx.strokeStyle = '#7a5c14';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.lineWidth = 0.6;
  ctx.strokeRect(19, 19, w - 38, h - 38);
}
