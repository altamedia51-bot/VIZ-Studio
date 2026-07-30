/**
 * VIZ Studio - Background Renderer
 * Supports Solid, Gradients, Images, Videos, Particle, Noise, Aurora, Galaxy, Grid, Cyber background types
 * plus real-time visual filter adjustments (Blur, Brightness, Contrast, Saturation, Hue, Vignette, Grain).
 */

import { BackgroundLayer, AudioBands } from '../types';

export class BackgroundRenderer {
  private particleArray: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
  private imageCache = new Map<string, HTMLImageElement>();
  private videoCache = new Map<string, HTMLVideoElement>();

  constructor() {
    this.initParticles();
  }

  private initParticles() {
    this.particleArray = [];
    for (let i = 0; i < 60; i++) {
      this.particleArray.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        r: 1 + Math.random() * 3,
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    layer: BackgroundLayer,
    time: number,
    audioBands?: AudioBands
  ) {
    if (!layer.visible) return;

    ctx.save();

    // Apply CSS Filter Effects
    const filterParts: string[] = [];
    if (layer.blur > 0) filterParts.push(`blur(${layer.blur}px)`);
    if (layer.brightness !== 1) filterParts.push(`brightness(${layer.brightness})`);
    if (layer.contrast !== 1) filterParts.push(`contrast(${layer.contrast})`);
    if (layer.saturation !== 1) filterParts.push(`saturate(${layer.saturation})`);
    if (layer.hue > 0) filterParts.push(`hue-rotate(${layer.hue}deg)`);

    if (filterParts.length > 0) {
      ctx.filter = filterParts.join(' ');
    }

    // Render background depending on type
    switch (layer.bgType) {
      case 'solid':
        ctx.fillStyle = layer.colorSolid || '#0f172a';
        ctx.fillRect(0, 0, width, height);
        break;

      case 'gradient': {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        const colors = layer.gradientColors?.length ? layer.gradientColors : ['#0f172a', '#1e1b4b'];
        colors.forEach((c, idx) => grad.addColorStop(idx / Math.max(1, colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'animated_gradient': {
        const speed = layer.gradientSpeed || 1;
        const shift = Math.sin(time * speed) * width * 0.3;
        const grad = ctx.createLinearGradient(shift, 0, width + shift, height);
        const colors = layer.gradientColors?.length ? layer.gradientColors : ['#0284c7', '#7c3aed', '#db2777'];
        colors.forEach((c, idx) => grad.addColorStop(idx / Math.max(1, colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'image':
        if (layer.imageUrl) {
          if (!this.imageCache.has(layer.imageUrl)) {
            const img = new Image();
            img.src = layer.imageUrl;
            this.imageCache.set(layer.imageUrl, img);
          }
          const cachedImg = this.imageCache.get(layer.imageUrl);
          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            ctx.drawImage(cachedImg, 0, 0, width, height);
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);
          }
        }
        break;

      case 'video':
        if (layer.videoUrl || layer.videoElement) {
          let vEl = layer.videoElement;
          if (!vEl && layer.videoUrl) {
            if (!this.videoCache.has(layer.videoUrl)) {
              const video = document.createElement('video');
              video.src = layer.videoUrl;
              video.loop = true;
              video.muted = true;
              video.playsInline = true;
              video.play().catch(() => {});
              this.videoCache.set(layer.videoUrl, video);
            }
            vEl = this.videoCache.get(layer.videoUrl);
          }
          if (vEl && vEl.readyState >= 2) {
            ctx.drawImage(vEl, 0, 0, width, height);
          } else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
          }
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, width, height);
        }
        break;

      case 'particle': {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = layer.tintColor || '#38bdf8';
        for (const p of this.particleArray) {
          p.x = (p.x + p.vx + width) % width;
          p.y = (p.y + p.vy + height) % height;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + (audioBands?.bass || 0) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'grid': {
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = layer.tintColor || 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        break;
      }

      case 'cyber': {
        ctx.fillStyle = '#05050a';
        ctx.fillRect(0, 0, width, height);

        // Perspective grid floor
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        const horizon = height * 0.5;

        for (let x = -width; x < width * 2; x += 80) {
          ctx.beginPath();
          ctx.moveTo(x, height);
          ctx.lineTo(width / 2 + (x - width / 2) * 0.1, horizon);
          ctx.stroke();
        }
        break;
      }

      default:
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        break;
    }

    ctx.filter = 'none';

    // Apply Vignette overlay
    if (layer.vignette > 0) {
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.max(width, height) * 0.3,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
      );
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, `rgba(0, 0, 0, ${Math.min(1, layer.vignette)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // Apply Grain overlay
    if (layer.grain > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 300; i++) {
        const gx = Math.random() * width;
        const gy = Math.random() * height;
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
    }

    // Apply Tint overlay
    if (layer.tintOpacity > 0 && layer.tintColor) {
      ctx.fillStyle = layer.tintColor;
      ctx.globalAlpha = layer.tintOpacity;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }
}
