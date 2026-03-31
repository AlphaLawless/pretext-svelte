import { INK } from '../constants.js';

/**
 * Draws a woodcut-style astrolabe / compass rose onto the given context.
 *
 * The astrolabe is split into two layers that rotate independently —
 * matching how a real instrument works:
 *
 *   - Outer layer (fixed): disc fill, outer ring, degree tick marks, cardinal labels.
 *   - Inner rete (rotates): the two inner rings and the 8-point compass rose.
 *
 * @param ctx       2D canvas context
 * @param cx        Centre X in CSS pixels
 * @param cy        Centre Y in CSS pixels
 * @param r         Outer radius in CSS pixels
 * @param rotation  Rete rotation in radians (default 0)
 */
export function drawAstrolabe(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rotation = 0,
): void {
  ctx.save();

  // ── Fixed outer layer ────────────────────────────
  // Disc fill
  ctx.fillStyle = '#e4d09a';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = INK;

  // Outer ring
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Degree tick marks on the limb (fixed — they mark absolute positions)
  ctx.lineWidth = 0.6;
  for (let deg = 0; deg < 360; deg += 5) {
    const a = (deg * Math.PI) / 180;
    const inner = deg % 30 === 0 ? r * 0.68 : r * 0.73;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
    ctx.stroke();
  }

  // Cardinal labels (fixed)
  ctx.font = 'bold 8px "IM Fell English"';
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  const lr = r * 0.88;
  ctx.fillText('N', cx, cy - lr + 3);
  ctx.fillText('S', cx, cy + lr + 3);
  ctx.fillText('E', cx + lr, cy + 3);
  ctx.fillText('O', cx - lr, cy + 3);

  // ── Rotating rete ────────────────────────────────
  // Pivot around the centre point before drawing the inner parts.
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);

  // Inner rings
  ctx.strokeStyle = INK;
  for (const [scale, lw] of [
    [0.78, 0.7],
    [0.42, 0.7],
  ] as [number, number][]) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 8-point compass rose
  ctx.fillStyle = INK;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8 - Math.PI / 2;
    const pa = a + Math.PI / 2;
    const tipR = r * (i % 2 === 0 ? 0.72 : 0.62);
    const baseR = r * 0.44;
    const sideR = r * 0.055;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * tipR, cy + Math.sin(a) * tipR);
    ctx.lineTo(
      cx + Math.cos(pa) * sideR + Math.cos(a) * baseR,
      cy + Math.sin(pa) * sideR + Math.sin(a) * baseR,
    );
    ctx.lineTo(
      cx - Math.cos(pa) * sideR + Math.cos(a) * baseR,
      cy - Math.sin(pa) * sideR + Math.sin(a) * baseR,
    );
    ctx.closePath();
    ctx.fill();
  }

  // Centre dot (on top of everything)
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
