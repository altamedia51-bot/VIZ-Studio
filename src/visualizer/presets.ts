/**
 * VIZ Studio - 50+ Audio Visualizer Presets Engine
 * High-performance 2D Canvas rendering routines for all 50 presets.
 */

import { VisualizerLayer, AudioBands } from '../types';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  audioBands: AudioBands;
  layer: VisualizerLayer;
  time: number; // elapsed time in seconds
}

export type VisualizerRenderFn = (rc: RenderContext) => void;

// Helper to create color gradient or solid color
function getColorStyle(
  ctx: CanvasRenderingContext2D,
  layer: VisualizerLayer,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string | CanvasGradient {
  if (layer.useGradient) {
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, layer.colorPrimary || '#3b82f6');
    grad.addColorStop(1, layer.colorSecondary || '#ec4899');
    return grad;
  }
  return layer.colorPrimary || '#3b82f6';
}

// ---------------------------------------------------------------------------
// Preset 1: Linear Bars
// ---------------------------------------------------------------------------
export function renderBars({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const bars = Math.min(frequencyData.length, 128);
  const totalGap = layer.gap * (bars - 1);
  const barWidth = Math.max(2, (width * (layer.scale || 1) - totalGap) / bars);
  const startX = (width - (bars * barWidth + totalGap)) / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);

  ctx.save();
  if (layer.glow > 0) {
    ctx.shadowBlur = layer.glow;
    ctx.shadowColor = layer.glowColor || layer.colorPrimary;
  }

  for (let i = 0; i < bars; i++) {
    const val = (frequencyData[i] / 255) * layer.sensitivity * layer.height;
    const h = Math.max(4, val);
    const x = startX + i * (barWidth + layer.gap);
    const y = layer.flip ? centerY : centerY - h;

    const fill = getColorStyle(ctx, layer, x, y, x, y + h);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, barWidth, h);

    if (layer.mirror) {
      const mirrorY = layer.flip ? centerY - h : centerY;
      ctx.fillRect(x, mirrorY, barWidth, h);
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 2: Radial Circle
// ---------------------------------------------------------------------------
export function renderCircle({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const centerX = width / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);
  const radius = layer.radius || 120;
  const bars = Math.min(frequencyData.length, 120);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((layer.rotation || 0) * (Math.PI / 180));

  if (layer.glow > 0) {
    ctx.shadowBlur = layer.glow;
    ctx.shadowColor = layer.glowColor || layer.colorPrimary;
  }

  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2;
    const val = (frequencyData[i] / 255) * layer.sensitivity * layer.height;
    const barLen = Math.max(2, val);

    const x1 = Math.cos(angle) * radius;
    const y1 = Math.sin(angle) * radius;
    const x2 = Math.cos(angle) * (radius + barLen);
    const y2 = Math.sin(angle) * (radius + barLen);

    ctx.strokeStyle = getColorStyle(ctx, layer, x1, y1, x2, y2);
    ctx.lineWidth = layer.thickness || 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (layer.mirror) {
      const mx2 = Math.cos(angle) * (radius - barLen);
      const my2 = Math.sin(angle) * (radius - barLen);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(mx2, my2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 3: Double Circle
// ---------------------------------------------------------------------------
export function renderDoubleCircle({ ctx, width, height, frequencyData, layer, audioBands }: RenderContext) {
  const centerX = width / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);
  const r1 = (layer.radius || 100) + audioBands.bass * 20;
  const r2 = r1 + 40;
  const bars = 80;

  ctx.save();
  ctx.translate(centerX, centerY);

  for (let i = 0; i < bars; i++) {
    const angle = (i / bars) * Math.PI * 2;
    const val = (frequencyData[i] / 255) * layer.sensitivity * layer.height;

    // Outer ring
    const x1 = Math.cos(angle) * r2;
    const y1 = Math.sin(angle) * r2;
    const x2 = Math.cos(angle) * (r2 + val);
    const y2 = Math.sin(angle) * (r2 + val);

    ctx.strokeStyle = layer.colorPrimary || '#3b82f6';
    ctx.lineWidth = layer.thickness || 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Inner ring (pointing inward)
    const ix1 = Math.cos(angle) * r1;
    const iy1 = Math.sin(angle) * r1;
    const ix2 = Math.cos(angle) * (r1 - val * 0.6);
    const iy2 = Math.sin(angle) * (r1 - val * 0.6);

    ctx.strokeStyle = layer.colorSecondary || '#ec4899';
    ctx.beginPath();
    ctx.moveTo(ix1, iy1);
    ctx.lineTo(ix2, iy2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 4: Spectrum Smooth Curve
// ---------------------------------------------------------------------------
export function renderSpectrum({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const count = Math.min(frequencyData.length, 100);
  const sliceWidth = (width * (layer.scale || 1)) / count;
  const centerY = height / 2 + (layer.y || 0);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, centerY);

  for (let i = 0; i < count; i++) {
    const val = (frequencyData[i] / 255) * layer.sensitivity * layer.height;
    const x = i * sliceWidth;
    const y = centerY - val;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.lineTo(width, centerY);
  ctx.closePath();

  const fill = getColorStyle(ctx, layer, 0, centerY - 150, 0, centerY);
  ctx.fillStyle = fill;
  ctx.globalAlpha = layer.opacity || 0.8;
  ctx.fill();

  ctx.strokeStyle = layer.colorPrimary || '#60a5fa';
  ctx.lineWidth = layer.thickness || 3;
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 5: Circular Spectrum
// ---------------------------------------------------------------------------
export function renderCircularSpectrum({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const centerX = width / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);
  const radius = layer.radius || 120;
  const count = 90;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((layer.rotation || 0) * (Math.PI / 180));

  ctx.beginPath();
  for (let i = 0; i <= count; i++) {
    const idx = i % count;
    const angle = (idx / count) * Math.PI * 2;
    const val = (frequencyData[idx] / 255) * layer.sensitivity * layer.height;
    const r = radius + val;

    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.strokeStyle = getColorStyle(ctx, layer, -radius, -radius, radius, radius);
  ctx.lineWidth = layer.thickness || 3;
  ctx.stroke();

  ctx.fillStyle = layer.colorSecondary || '#3b82f6';
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 6: Symmetrical Mirror
// ---------------------------------------------------------------------------
export function renderMirror({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const bars = 64;
  const barWidth = Math.max(3, (width / 2) / bars - layer.gap);
  const centerX = width / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);

  ctx.save();
  for (let i = 0; i < bars; i++) {
    const val = (frequencyData[i] / 255) * layer.sensitivity * layer.height;
    const h = Math.max(2, val);

    // Right side
    const rx = centerX + i * (barWidth + layer.gap);
    const ry = centerY - h / 2;
    ctx.fillStyle = getColorStyle(ctx, layer, rx, ry, rx, ry + h);
    ctx.fillRect(rx, ry, barWidth, h);

    // Left side (mirror)
    const lx = centerX - (i + 1) * (barWidth + layer.gap);
    ctx.fillRect(lx, ry, barWidth, h);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 7: Neon Synth Lines
// ---------------------------------------------------------------------------
export function renderNeon({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const count = 80;
  const sliceWidth = width / count;
  const centerY = height / 2 + (layer.y || 0);

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = layer.colorPrimary || '#00f0ff';

  ctx.strokeStyle = layer.colorPrimary || '#00f0ff';
  ctx.lineWidth = layer.thickness || 4;

  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const val = (frequencyData[i] / 255) * layer.sensitivity * layer.height;
    const x = i * sliceWidth;
    const y = centerY - val;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Bottom Reflection
  ctx.strokeStyle = layer.colorSecondary || '#ff007f';
  ctx.shadowColor = layer.colorSecondary || '#ff007f';
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const val = (frequencyData[i] / 255) * layer.sensitivity * layer.height;
    const x = i * sliceWidth;
    const y = centerY + val;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 8: Glowing Frequency Orbs
// ---------------------------------------------------------------------------
export function renderGlow({ ctx, width, height, frequencyData, layer, audioBands }: RenderContext) {
  const centerX = width / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);
  const orbs = 16;

  ctx.save();
  for (let i = 0; i < orbs; i++) {
    const val = (frequencyData[i * 4] / 255) * layer.sensitivity;
    const r = Math.max(10, val * 80);
    const angle = (i / orbs) * Math.PI * 2;
    const dist = (layer.radius || 150) + audioBands.bass * 30;

    const x = centerX + Math.cos(angle) * dist;
    const y = centerY + Math.sin(angle) * dist;

    const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
    grad.addColorStop(0, layer.colorPrimary || '#f43f5e');
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 9: Pulsating Bass Rings
// ---------------------------------------------------------------------------
export function renderPulse({ ctx, width, height, layer, audioBands }: RenderContext) {
  const centerX = width / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);
  const baseR = layer.radius || 80;
  const numRings = 5;

  ctx.save();
  ctx.lineWidth = layer.thickness || 3;

  for (let i = 0; i < numRings; i++) {
    const bassScale = 1 + audioBands.bass * (i + 1) * 0.4 * layer.sensitivity;
    const r = baseR * (i + 1) * 0.5 * bassScale;

    ctx.strokeStyle = i % 2 === 0 ? layer.colorPrimary || '#38bdf8' : layer.colorSecondary || '#a855f7';
    ctx.globalAlpha = Math.max(0.1, 1 - i * 0.18);
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 10: Multi Sine Waves
// ---------------------------------------------------------------------------
export function renderWave({ ctx, width, height, timeDomainData, layer, time }: RenderContext) {
  const centerY = height / 2 + (layer.y || 0);
  const waves = 3;

  ctx.save();
  ctx.lineWidth = layer.thickness || 2;

  for (let w = 0; w < waves; w++) {
    ctx.beginPath();
    ctx.strokeStyle = w === 0 ? layer.colorPrimary || '#06b6d4' : layer.colorSecondary || '#ec4899';
    ctx.globalAlpha = 0.8 - w * 0.2;

    const step = width / timeDomainData.length;
    for (let i = 0; i < timeDomainData.length; i++) {
      const v = (timeDomainData[i] - 128) / 128.0;
      const x = i * step;
      const y = centerY + Math.sin(i * 0.05 + time * (2 + w)) * 10 + v * layer.height * layer.sensitivity;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 11: Particle Explosions
// ---------------------------------------------------------------------------
const particlesCache: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

export function renderParticle({ ctx, width, height, audioBands, layer }: RenderContext) {
  const centerX = width / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);

  // Spawn new particles on bass threshold
  if (audioBands.bass > 0.45 && particlesCache.length < 200) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 6) * audioBands.bass * layer.sensitivity;
      particlesCache.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: Math.random() > 0.5 ? layer.colorPrimary || '#f59e0b' : layer.colorSecondary || '#ef4444',
      });
    }
  }

  ctx.save();
  for (let i = particlesCache.length - 1; i >= 0; i--) {
    const p = particlesCache[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;

    if (p.life <= 0) {
      particlesCache.splice(i, 1);
      continue;
    }

    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 12: Galaxy Starfield
// ---------------------------------------------------------------------------
export function renderGalaxy({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const centerX = width / 2 + (layer.x || 0);
  const centerY = height / 2 + (layer.y || 0);
  const stars = 120;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time * 0.2);

  for (let i = 0; i < stars; i++) {
    const angle = (i / stars) * Math.PI * 8;
    const r = (i * 3) + audioBands.bass * 40 * layer.sensitivity;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    ctx.fillStyle = i % 2 === 0 ? layer.colorPrimary || '#8b5cf6' : layer.colorSecondary || '#38bdf8';
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 13: Fire Columns
// ---------------------------------------------------------------------------
export function renderFire({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const cols = 40;
  const colWidth = width / cols;
  const baseY = height + (layer.y || 0);

  ctx.save();
  for (let i = 0; i < cols; i++) {
    const val = (frequencyData[i * 2] / 255) * layer.sensitivity * layer.height;
    const x = i * colWidth;
    const flameH = val * 1.5;

    const grad = ctx.createLinearGradient(x, baseY, x, baseY - flameH);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.5, '#f97316');
    grad.addColorStop(1, '#facc15');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + colWidth / 2, baseY - flameH);
    ctx.lineTo(x + colWidth, baseY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 14: Rain Ripples
// ---------------------------------------------------------------------------
const rainRipples: { x: number; y: number; r: number; alpha: number }[] = [];

export function renderRain({ ctx, width, height, audioBands, layer }: RenderContext) {
  if (audioBands.bass > 0.4 && rainRipples.length < 30) {
    rainRipples.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 5,
      alpha: 1.0,
    });
  }

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#38bdf8';
  ctx.lineWidth = 2;

  for (let i = rainRipples.length - 1; i >= 0; i--) {
    const rip = rainRipples[i];
    rip.r += 2 * layer.sensitivity;
    rip.alpha -= 0.02;

    if (rip.alpha <= 0) {
      rainRipples.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = rip.alpha;
    ctx.beginPath();
    ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 15: Digital Matrix Rain
// ---------------------------------------------------------------------------
const matrixCols: number[] = Array(50).fill(0);

export function renderMatrix({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const numCols = 40;
  const colWidth = width / numCols;

  ctx.save();
  ctx.fillStyle = layer.colorPrimary || '#10b981';
  ctx.font = '14px monospace';

  for (let i = 0; i < numCols; i++) {
    const freqVal = (frequencyData[i % 32] / 255) * layer.sensitivity;
    const y = matrixCols[i] || 0;
    const char = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));

    ctx.fillText(char, i * colWidth, y);

    if (y > height || Math.random() > 0.95 - freqVal * 0.1) {
      matrixCols[i] = 0;
    } else {
      matrixCols[i] = y + 16 + freqVal * 10;
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset 16: VUMeter Stacked Block Grid
// ---------------------------------------------------------------------------
export function renderEqualizer({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const cols = 24;
  const rows = 12;
  const colW = (width * (layer.scale || 1)) / cols - layer.gap;
  const blockH = 8;
  const startX = (width - cols * (colW + layer.gap)) / 2 + (layer.x || 0);
  const startY = height / 2 + 100 + (layer.y || 0);

  ctx.save();
  for (let c = 0; c < cols; c++) {
    const val = (frequencyData[c * 2] / 255) * layer.sensitivity;
    const activeBlocks = Math.floor(val * rows);

    for (let r = 0; r < rows; r++) {
      const x = startX + c * (colW + layer.gap);
      const y = startY - r * (blockH + 3);

      if (r < activeBlocks) {
        ctx.fillStyle = r > rows - 3 ? '#ef4444' : r > rows - 6 ? '#f59e0b' : layer.colorPrimary || '#10b981';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      }
      ctx.fillRect(x, y, colW, blockH);
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Presets 17-50 Concise High Performance Visualizer Modules
// ---------------------------------------------------------------------------

export function renderHexagon({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2 + (layer.x || 0);
  const cy = height / 2 + (layer.y || 0);
  const r = (layer.radius || 100) + audioBands.bass * 50 * layer.sensitivity;

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#ec4899';
  ctx.lineWidth = layer.thickness || 4;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function renderPolygon({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const cx = width / 2 + (layer.x || 0);
  const cy = height / 2 + (layer.y || 0);
  const sides = 8;
  const baseR = layer.radius || 120;

  ctx.save();
  ctx.strokeStyle = layer.colorSecondary || '#8b5cf6';
  ctx.lineWidth = layer.thickness || 3;
  ctx.beginPath();

  for (let i = 0; i <= sides; i++) {
    const idx = i % sides;
    const a = (idx / sides) * Math.PI * 2;
    const v = (frequencyData[idx * 8] / 255) * layer.sensitivity * 50;
    const x = cx + Math.cos(a) * (baseR + v);
    const y = cy + Math.sin(a) * (baseR + v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function renderSpiral({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const cx = width / 2 + (layer.x || 0);
  const cy = height / 2 + (layer.y || 0);

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#06b6d4';
  ctx.lineWidth = layer.thickness || 3;
  ctx.beginPath();

  for (let i = 0; i < 100; i++) {
    const angle = i * 0.2;
    const val = (frequencyData[i % 32] / 255) * layer.sensitivity * 30;
    const r = i * 2 + val;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function renderTunnel({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const cx = width / 2 + (layer.x || 0);
  const cy = height / 2 + (layer.y || 0);
  const rings = 8;

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#3b82f6';
  ctx.lineWidth = 2;

  for (let i = 0; i < rings; i++) {
    const z = ((i + time * 2) % rings) / rings;
    const r = z * (width / 2) * (1 + audioBands.bass * layer.sensitivity);
    ctx.globalAlpha = z;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderLightning({ ctx, width, height, audioBands, layer }: RenderContext) {
  if (audioBands.bass < 0.3) return;
  const startX = width * 0.2;
  const endX = width * 0.8;
  const cy = height / 2 + (layer.y || 0);

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#60a5fa';
  ctx.shadowColor = '#60a5fa';
  ctx.shadowBlur = 15;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(startX, cy);
  let curX = startX;
  while (curX < endX) {
    curX += 15 + Math.random() * 20;
    const curY = cy + (Math.random() - 0.5) * 60 * audioBands.bass * layer.sensitivity;
    ctx.lineTo(curX, curY);
  }
  ctx.stroke();
  ctx.restore();
}

export function renderSmoke({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2 + (layer.x || 0);
  const cy = height / 2 + (layer.y || 0);
  const r = (layer.radius || 100) + audioBands.mid * 40;

  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
  grad.addColorStop(0, layer.colorPrimary || 'rgba(168, 85, 247, 0.4)');
  grad.addColorStop(1, 'transparent');

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderInk({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2 + (layer.x || 0);
  const cy = height / 2 + (layer.y || 0);
  const blobs = 6;

  ctx.save();
  ctx.fillStyle = layer.colorPrimary || '#1e1b4b';

  for (let i = 0; i < blobs; i++) {
    const angle = (i / blobs) * Math.PI * 2;
    const dist = audioBands.bass * 60 * layer.sensitivity;
    const r = 20 + audioBands.amplitude * 40;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function renderAurora({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const cy = height / 2 + (layer.y || 0);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, cy);

  for (let x = 0; x < width; x += 20) {
    const y = cy + Math.sin(x * 0.01 + time) * 40 + Math.cos(x * 0.02 - time) * 30 * (1 + audioBands.mid);
    ctx.lineTo(x, y);
  }

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, cy - 50, 0, height);
  grad.addColorStop(0, layer.colorPrimary || 'rgba(52, 211, 153, 0.6)');
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

export function renderCyber({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const bars = 32;
  const barW = width / bars;

  ctx.save();
  for (let i = 0; i < bars; i++) {
    const v = (frequencyData[i * 2] / 255) * layer.sensitivity * layer.height;
    const x = i * barW;
    const y = height - v;

    ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ff0055';
    ctx.fillRect(x, y, barW - 2, v);
  }
  ctx.restore();
}

export function renderRetro({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const cx = width / 2;
  const cy = height * 0.6;

  ctx.save();
  // Synthwave Sun
  const sunR = 70 + audioBands.bass * 20;
  const grad = ctx.createLinearGradient(cx, cy - sunR, cx, cy + sunR);
  grad.addColorStop(0, '#facc15');
  grad.addColorStop(1, '#ec4899');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Perspective Horizon Grid
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 1;

  for (let x = -width; x < width * 2; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(cx + (x - cx) * 0.1, cy);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderDNA({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const cx = width / 2;
  const points = 30;

  ctx.save();
  for (let i = 0; i < points; i++) {
    const y = (height / points) * i;
    const angle = i * 0.3 + time * 3;
    const amp = 80 + audioBands.mid * 40 * layer.sensitivity;

    const x1 = cx + Math.sin(angle) * amp;
    const x2 = cx - Math.sin(angle) * amp;

    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(x1, y, 4, 0, Math.PI * 2);
    ctx.arc(x2, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function renderFloatingBubbles({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const num = 20;
  ctx.save();
  for (let i = 0; i < num; i++) {
    const v = (frequencyData[i * 4] / 255) * layer.sensitivity;
    const x = (width / num) * i + 20;
    const y = height - v * (height * 0.7);

    ctx.strokeStyle = layer.colorPrimary || '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 10 + v * 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderLaserBeam({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const cx = width / 2;
  const topY = 0;
  const beams = 12;

  ctx.save();
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#06b6d4';

  for (let i = 0; i < beams; i++) {
    const sweep = Math.sin(time * 2 + i) * (width * 0.4);
    const targetX = cx + sweep;

    ctx.strokeStyle = i % 2 === 0 ? '#06b6d4' : '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(targetX, height);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderHeartbeat({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cy = height / 2;
  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#ef4444';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(width * 0.4, cy);

  // EKG Pulse
  const pulseH = audioBands.bass * 120 * layer.sensitivity;
  ctx.lineTo(width * 0.45, cy - pulseH);
  ctx.lineTo(width * 0.5, cy + pulseH * 0.8);
  ctx.lineTo(width * 0.55, cy - pulseH * 0.4);
  ctx.lineTo(width * 0.6, cy);
  ctx.lineTo(width, cy);

  ctx.stroke();
  ctx.restore();
}

export function renderCompass({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const r = layer.radius || 100;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(audioBands.bass * Math.PI);

  ctx.strokeStyle = layer.colorPrimary || '#f59e0b';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();
  ctx.restore();
}

export function renderStarburst({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const rays = 32;

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const len = 40 + audioBands.bass * 150 * layer.sensitivity;

    ctx.strokeStyle = layer.colorPrimary || '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderSoundWaveRings({ ctx, width, height, timeDomainData, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const count = 60;

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#a855f7';
  ctx.lineWidth = 2;

  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const val = (timeDomainData[i * 4] - 128) / 128;
    const r = (layer.radius || 100) + val * 40 * layer.sensitivity;

    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function renderVinylDisc({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const r = layer.radius || 120;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 1.5);

  // Black vinyl disc
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Grooves
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
  ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  // Center label
  ctx.fillStyle = layer.colorPrimary || '#ef4444';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderCassetteTape({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const w = 240;
  const h = 150;

  ctx.save();
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);

  // Reels
  ctx.fillStyle = '#f3f4f6';
  ctx.beginPath();
  ctx.arc(cx - 50, cy, 25, 0, Math.PI * 2);
  ctx.arc(cx + 50, cy, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderOscilloscope({ ctx, width, height, timeDomainData, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#10b981';
  ctx.lineWidth = 2;

  ctx.beginPath();
  for (let i = 0; i < timeDomainData.length / 2; i++) {
    const xVal = (timeDomainData[i * 2] - 128) / 128;
    const yVal = (timeDomainData[i * 2 + 1] - 128) / 128;

    const x = cx + xVal * 150 * layer.sensitivity;
    const y = cy + yVal * 150 * layer.sensitivity;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function renderWaveformRibbon({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#ec4899';
  ctx.lineWidth = 3;

  ctx.beginPath();
  for (let i = 0; i < 50; i++) {
    const val = (frequencyData[i] / 255) * layer.sensitivity * 80;
    const x = cx - 250 + i * 10;
    const y = cy + Math.sin(i * 0.2) * 30 - val;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function renderCubes({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const cols = 10;
  const w = 24;

  ctx.save();
  for (let i = 0; i < cols; i++) {
    const v = (frequencyData[i * 4] / 255) * layer.sensitivity * 120;
    const x = width / 2 - 120 + i * 26;
    const y = height / 2 + 50 - v;

    ctx.fillStyle = layer.colorPrimary || '#3b82f6';
    ctx.fillRect(x, y, w, v);
  }
  ctx.restore();
}

export function renderDiamondPulse({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const s = 60 + audioBands.bass * 80 * layer.sensitivity;

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#38bdf8';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s, cy);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function renderMandala({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const petals = 12;

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.rotate(a);

    ctx.strokeStyle = layer.colorPrimary || '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(50, 0, 30 + audioBands.bass * 20, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderVortexRing({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 2);

  ctx.strokeStyle = layer.colorPrimary || '#8b5cf6';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0, 0, 80 + audioBands.bass * 40, 0, Math.PI * 1.5);
  ctx.stroke();
  ctx.restore();
}

export function renderShockwave({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const r = audioBands.bass * 180 * layer.sensitivity;

  ctx.save();
  ctx.strokeStyle = layer.colorPrimary || '#00f0ff';
  ctx.lineWidth = 4;
  ctx.globalAlpha = Math.max(0, 1 - audioBands.bass);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function renderCyberRing({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 6;

  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * (0.5 + audioBands.mid));
  ctx.stroke();
  ctx.restore();
}

export function renderNeonWave({ ctx, width, height, timeDomainData, layer }: RenderContext) {
  const cy = height / 2;

  ctx.save();
  ctx.strokeStyle = '#ff007f';
  ctx.lineWidth = 5;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ff007f';

  ctx.beginPath();
  for (let i = 0; i < timeDomainData.length; i += 4) {
    const v = (timeDomainData[i] - 128) / 128;
    const x = (width / timeDomainData.length) * i * 4;
    const y = cy + v * 60;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function renderCosmicDust({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.fillStyle = '#facc15';

  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const dist = Math.random() * (200 * audioBands.bass * layer.sensitivity);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function renderDotGrid({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const cols = 12;
  const rows = 8;
  const stepX = width / cols;
  const stepY = height / rows;

  ctx.save();
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const v = (frequencyData[(c + r) * 2] / 255) * layer.sensitivity;
      ctx.fillStyle = layer.colorPrimary || '#10b981';
      ctx.beginPath();
      ctx.arc(c * stepX + stepX / 2, r * stepY + stepY / 2, 2 + v * 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function renderEqualizerBarsRounded({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const bars = 24;
  const barW = (width * 0.8) / bars;
  const startX = width * 0.1;
  const cy = height / 2;

  ctx.save();
  for (let i = 0; i < bars; i++) {
    const v = (frequencyData[i * 2] / 255) * layer.sensitivity * 100;
    const x = startX + i * barW;

    ctx.fillStyle = layer.colorPrimary || '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(x, cy - v / 2, barW - 4, Math.max(8, v), 8);
    ctx.fill();
  }
  ctx.restore();
}

export function renderOrbitingPlanets({ ctx, width, height, audioBands, layer, time }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 1; i <= 3; i++) {
    const r = i * 50;
    const a = time * (1 / i);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;

    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = i === 1 ? '#ef4444' : i === 2 ? '#3b82f6' : '#10b981';
    ctx.beginPath();
    ctx.arc(x, y, 8 + audioBands.bass * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function renderLiquidPlasma({ ctx, width, height, audioBands, layer }: RenderContext) {
  const cx = width / 2;
  const cy = height / 2;
  const r = (layer.radius || 100) + audioBands.bass * 40;

  ctx.save();
  ctx.fillStyle = layer.colorPrimary || '#ec4899';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderSoundPeakMountain({ ctx, width, height, frequencyData, layer }: RenderContext) {
  const points = 60;
  const step = width / points;
  const cy = height * 0.7;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, cy);

  for (let i = 0; i < points; i++) {
    const v = (frequencyData[i] / 255) * layer.sensitivity * 120;
    ctx.lineTo(i * step, cy - v);
  }

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();

  ctx.fillStyle = layer.colorPrimary || '#3b82f6';
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Preset Dispatch Registry
// ---------------------------------------------------------------------------
export const VISUALIZER_REGISTRY: Record<string, VisualizerRenderFn> = {
  bars: renderBars,
  circle: renderCircle,
  double_circle: renderDoubleCircle,
  spectrum: renderSpectrum,
  circular_spectrum: renderCircularSpectrum,
  mirror: renderMirror,
  neon: renderNeon,
  glow: renderGlow,
  pulse: renderPulse,
  wave: renderWave,
  particle: renderParticle,
  galaxy: renderGalaxy,
  fire: renderFire,
  rain: renderRain,
  matrix: renderMatrix,
  equalizer: renderEqualizer,
  hexagon: renderHexagon,
  polygon: renderPolygon,
  spiral: renderSpiral,
  tunnel: renderTunnel,
  lightning: renderLightning,
  smoke: renderSmoke,
  ink: renderInk,
  aurora: renderAurora,
  cyber: renderCyber,
  retro: renderRetro,
  dna: renderDNA,
  floating_bubbles: renderFloatingBubbles,
  laser_beam: renderLaserBeam,
  heartbeat: renderHeartbeat,
  compass: renderCompass,
  starburst: renderStarburst,
  sound_wave_rings: renderSoundWaveRings,
  vinyl_disc: renderVinylDisc,
  cassette_tape: renderCassetteTape,
  oscilloscope: renderOscilloscope,
  waveform_ribbon: renderWaveformRibbon,
  cubes: renderCubes,
  diamond_pulse: renderDiamondPulse,
  mandala: renderMandala,
  vortex_ring: renderVortexRing,
  shockwave: renderShockwave,
  cyber_ring: renderCyberRing,
  neon_wave: renderNeonWave,
  cosmic_dust: renderCosmicDust,
  dot_grid: renderDotGrid,
  equalizer_bars_rounded: renderEqualizerBarsRounded,
  orbiting_planets: renderOrbitingPlanets,
  liquid_plasma: renderLiquidPlasma,
  sound_peak_mountain: renderSoundPeakMountain,
};

// Friendly Preset List Metadata for UI
export const VISUALIZER_PRESETS_LIST = [
  { id: 'bars', name: 'Linear Bars', category: 'Spectrum' },
  { id: 'circle', name: 'Radial Circle', category: 'Circular' },
  { id: 'double_circle', name: 'Double Circle Ring', category: 'Circular' },
  { id: 'spectrum', name: 'Smooth Curve', category: 'Spectrum' },
  { id: 'circular_spectrum', name: 'Circular Spectrum', category: 'Circular' },
  { id: 'mirror', name: 'Symmetrical Mirror', category: 'Spectrum' },
  { id: 'neon', name: 'Neon Synthwave', category: 'Cyber' },
  { id: 'glow', name: 'Frequency Orbs', category: 'Orbs & Glow' },
  { id: 'pulse', name: 'Bass Pulse Rings', category: 'Circular' },
  { id: 'wave', name: 'Multi Sine Waves', category: 'Waves' },
  { id: 'particle', name: 'Particle Explosion', category: 'Particles' },
  { id: 'galaxy', name: 'Spiral Galaxy', category: 'Particles' },
  { id: 'fire', name: 'Flames Column', category: 'Elements' },
  { id: 'rain', name: 'Rain Ripples', category: 'Elements' },
  { id: 'matrix', name: 'Digital Matrix Rain', category: 'Cyber' },
  { id: 'equalizer', name: 'LED VU Equalizer', category: 'Spectrum' },
  { id: 'hexagon', name: 'Pulsating Hexagon', category: 'Geometric' },
  { id: 'polygon', name: 'Morphing Polygon', category: 'Geometric' },
  { id: 'spiral', name: 'Archimedean Spiral', category: 'Circular' },
  { id: 'tunnel', name: '3D Cyber Tunnel', category: 'Cyber' },
  { id: 'lightning', name: 'Plasma Lightning', category: 'FX' },
  { id: 'smoke', name: 'Audio Smoke Fog', category: 'FX' },
  { id: 'ink', name: 'Expanding Ink Drop', category: 'FX' },
  { id: 'aurora', name: 'Northern Lights', category: 'Elements' },
  { id: 'cyber', name: 'Glitch Cyberpunk', category: 'Cyber' },
  { id: 'retro', name: '80s Retro Horizon', category: 'Retro' },
  { id: 'dna', name: 'Rotating DNA Helix', category: '3D & Motion' },
  { id: 'floating_bubbles', name: 'Bouncing Bubbles', category: 'Orbs & Glow' },
  { id: 'laser_beam', name: 'Laser Beam Array', category: 'FX' },
  { id: 'heartbeat', name: 'EKG Heartbeat', category: 'Waves' },
  { id: 'compass', name: 'Radial Compass', category: 'Circular' },
  { id: 'starburst', name: 'Explosive Starburst', category: 'Particles' },
  { id: 'sound_wave_rings', name: 'Concentric Wave Disks', category: 'Circular' },
  { id: 'vinyl_disc', name: 'Spinning Vinyl Record', category: 'Retro' },
  { id: 'cassette_tape', name: 'Vintage Cassette Deck', category: 'Retro' },
  { id: 'oscilloscope', name: 'Lissajous Oscilloscope', category: 'Waves' },
  { id: 'waveform_ribbon', name: 'Waveform Ribbon', category: 'Waves' },
  { id: 'cubes', name: 'Equalizer Cubes', category: 'Spectrum' },
  { id: 'diamond_pulse', name: 'Expanding Diamond', category: 'Geometric' },
  { id: 'mandala', name: 'Mandala Kaleidoscope', category: 'Geometric' },
  { id: 'vortex_ring', name: 'Swirling Vortex', category: 'Circular' },
  { id: 'shockwave', name: 'Bass Shockwave', category: 'FX' },
  { id: 'cyber_ring', name: 'HUD Cyber Gauge', category: 'Cyber' },
  { id: 'neon_wave', name: 'Neon Tube Wave', category: 'Cyber' },
  { id: 'cosmic_dust', name: 'Supernova Cosmic Dust', category: 'Particles' },
  { id: 'dot_grid', name: 'Matrix Dot Grid', category: 'Geometric' },
  { id: 'equalizer_bars_rounded', name: 'Rounded Pill LED Bars', category: 'Spectrum' },
  { id: 'orbiting_planets', name: 'Orbiting Planets', category: '3D & Motion' },
  { id: 'liquid_plasma', name: 'Liquid Audio Plasma', category: 'FX' },
  { id: 'sound_peak_mountain', name: 'Topographical Peaks', category: 'Spectrum' },
];
