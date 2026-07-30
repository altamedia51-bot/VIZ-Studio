/**
 * VIZ Studio - Preview Canvas & Realtime Renderer
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, Maximize, Grid, Volume2 } from 'lucide-react';
import { ProjectData, AudioBands, BackgroundLayer, VisualizerLayer, TextLayer } from '../../types';
import { VISUALIZER_REGISTRY } from '../../visualizer/presets';
import { BackgroundRenderer } from '../../background/BackgroundRenderer';
import { PostProcessingEngine } from '../../effects/PostProcessing';
import { globalAudioEngine } from '../../audio/AudioEngine';

interface PreviewCanvasProps {
  project: ProjectData;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioBands: AudioBands;
  onTogglePlay: () => void;
  onSeek: (timeSec: number) => void;
}

const bgRenderer = new BackgroundRenderer();
const postEngine = new PostProcessingEngine();

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  project,
  isPlaying,
  currentTime,
  duration,
  audioBands,
  onTogglePlay,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { width: renderWidth, height: renderHeight } = project.resolution;

  // Real-time Canvas Rendering Function
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const time = currentTime;
    const freqData = globalAudioEngine.getFrequencyData();
    const timeData = globalAudioEngine.getTimeDomainData();

    // Clear Canvas
    ctx.clearRect(0, 0, renderWidth, renderHeight);

    // Sort layers by Z-index
    const sortedLayers = [...project.layers].sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1.0;
      ctx.globalCompositeOperation = layer.blendMode || 'source-over';

      // 1. Background Layer
      if (layer.type === 'background') {
        bgRenderer.render(ctx, renderWidth, renderHeight, layer as BackgroundLayer, time, audioBands);
      }

      // 2. Visualizer Layer
      else if (layer.type === 'visualizer') {
        const vizLayer = layer as VisualizerLayer;
        const renderFn = VISUALIZER_REGISTRY[vizLayer.preset];
        if (renderFn) {
          renderFn({
            ctx,
            width: renderWidth,
            height: renderHeight,
            frequencyData: freqData,
            timeDomainData: timeData,
            audioBands,
            layer: vizLayer,
            time,
          });
        }
      }

      // 3. Text Layer
      else if (layer.type === 'text') {
        const textLayer = layer as TextLayer;

        const x = renderWidth / 2 + textLayer.x;
        const y = renderHeight / 2 + textLayer.y;

        ctx.translate(x, y);
        ctx.rotate((textLayer.rotation || 0) * (Math.PI / 180));
        ctx.scale(textLayer.scale || 1, textLayer.scale || 1);

        ctx.font = `${textLayer.fontStyle} ${textLayer.fontWeight} ${textLayer.fontSize}px "${textLayer.fontFamily}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Apply Text Animation Transforms
        let animOffset = 0;
        if (textLayer.animation === 'bounce') {
          animOffset = Math.sin(time * 5) * 15 * audioBands.bass;
        } else if (textLayer.animation === 'pulse') {
          const s = 1 + audioBands.bass * 0.2;
          ctx.scale(s, s);
        } else if (textLayer.animation === 'shake' && audioBands.bass > 0.4) {
          ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        }

        // Text Glow
        if (textLayer.glow) {
          ctx.shadowBlur = textLayer.glowBlur || 15;
          ctx.shadowColor = textLayer.glowColor || '#3b82f6';
        }

        // Text Shadow
        if (textLayer.shadow) {
          ctx.shadowOffsetX = textLayer.shadowOffsetX || 2;
          ctx.shadowOffsetY = textLayer.shadowOffsetY || 4;
          ctx.shadowColor = textLayer.shadowColor || 'rgba(0,0,0,0.8)';
        }

        // Text Stroke
        if (textLayer.stroke) {
          ctx.strokeStyle = textLayer.strokeColor || '#000000';
          ctx.lineWidth = textLayer.strokeWidth || 2;
          ctx.strokeText(textLayer.content, 0, animOffset);
        }

        // Text Fill / Gradient
        if (textLayer.gradientText && textLayer.gradientColors) {
          const grad = ctx.createLinearGradient(-100, 0, 100, 0);
          grad.addColorStop(0, textLayer.gradientColors[0]);
          grad.addColorStop(1, textLayer.gradientColors[1]);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = textLayer.color || '#ffffff';
        }

        ctx.fillText(textLayer.content, 0, animOffset);
      }

      ctx.restore();
    }

    // Apply Post Processing Effects
    postEngine.applyEffects(ctx, renderWidth, renderHeight, project.effects, time);
  }, [project, currentTime, audioBands, renderWidth, renderHeight]);

  // RequestAnimationFrame Render Loop
  useEffect(() => {
    const loop = () => {
      renderFrame();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [renderFrame]);

  // Format Timecode string
  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-[#050505] flex flex-col justify-between overflow-hidden relative select-none">
      {/* Canvas Viewport Centered */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
        <div className="relative shadow-2xl border border-[#2a2a2a] rounded overflow-hidden max-w-full max-h-full aspect-video bg-black">
          <canvas
            ref={canvasRef}
            width={renderWidth}
            height={renderHeight}
            className="w-full h-full object-contain block bg-black"
          />
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="h-11 bg-[#141414] border-t border-[#2a2a2a] px-5 flex items-center justify-between text-xs text-gray-300 shrink-0">
        {/* Timecode */}
        <div className="font-mono text-gray-200 font-bold tracking-wider flex items-center gap-2 text-xs">
          <span className="text-blue-400">{formatTimecode(currentTime)}</span>
          <span className="text-[#737373]">/</span>
          <span className="text-gray-400">{formatTimecode(duration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSeek(0)}
            className="p-1 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
            title="Ke Awal"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {/* Quick Seek Slider */}
          <input
            type="range"
            min="0"
            max={duration || 60}
            step="0.01"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-48 accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Aspect Ratio Badge */}
        <div className="text-[10px] font-mono text-gray-400 px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
          {renderWidth} x {renderHeight} ({project.resolution.preset})
        </div>
      </div>
    </div>
  );
};
