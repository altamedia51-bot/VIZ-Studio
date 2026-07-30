/**
 * VIZ Studio - Post Processing & FX Engine
 * Bloom, Chromatic Aberration, Film Grain, Motion Blur, Lens Flare, LUT Color Filters.
 */

import { PostEffectsConfig } from '../types';

export class PostProcessingEngine {
  public applyEffects(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: PostEffectsConfig,
    time: number
  ) {
    if (!config) return;

    // 1. Chromatic Aberration
    if (config.chromaticAberration && config.chromaticAmount > 0) {
      const shift = config.chromaticAmount || 4;
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const width4 = width * 4;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const rIdx = (y * width + Math.min(width - 1, x + shift)) * 4;
            const bIdx = (y * width + Math.max(0, x - shift)) * 4;

            data[idx] = data[rIdx]; // Red channel shifted right
            data[idx + 2] = data[bIdx + 2]; // Blue channel shifted left
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {
        // Fallback if cross-origin tainted
      }
    }

    // 2. LUT Color Preset
    if (config.lutFilter && config.lutFilter !== 'none') {
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      switch (config.lutFilter) {
        case 'cyberpunk':
          ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = 'rgba(255, 0, 128, 0.1)';
          ctx.fillRect(0, 0, width, height);
          break;

        case 'vintage':
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.fillRect(0, 0, width, height);
          break;

        case 'warm_cinematic':
          ctx.fillStyle = 'rgba(234, 88, 12, 0.12)';
          ctx.fillRect(0, 0, width, height);
          break;

        case 'cool_noir':
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fillRect(0, 0, width, height);
          break;

        case 'vibrant_pop':
          ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
          ctx.fillRect(0, 0, width, height);
          break;
      }
      ctx.restore();
    }

    // 3. Film Grain
    if (config.filmGrain && config.filmGrainAmount > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const count = Math.floor(width * height * 0.0005 * config.filmGrainAmount);
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillRect(x, y, 1.2, 1.2);
      }
      ctx.restore();
    }

    // 4. Lens Flare
    if (config.lensFlare) {
      ctx.save();
      const fx = width * 0.3 + Math.sin(time) * 100;
      const fy = height * 0.3;

      const grad = ctx.createRadialGradient(fx, fy, 5, fx, fy, 150);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.3)');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
