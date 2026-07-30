/**
 * VIZ Studio - Background & Image/Video Media Panel
 */

import React, { useRef } from 'react';
import { Image as ImageIcon, Video as VideoIcon, Upload, Sparkles, Sliders, Palette } from 'lucide-react';
import { BackgroundLayer, BackgroundType } from '../../types';

interface BackgroundPanelProps {
  bgLayer: BackgroundLayer | null;
  onUpdateBgLayer: (partial: Partial<BackgroundLayer>) => void;
}

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  bgLayer,
  onUpdateBgLayer,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!bgLayer) return null;

  const bgTypes: { id: BackgroundType; label: string }[] = [
    { id: 'cyber', label: 'Cyber Grid' },
    { id: 'particle', label: 'Particle Starfield' },
    { id: 'animated_gradient', label: 'Animated Gradient' },
    { id: 'grid', label: 'Minimal Grid' },
    { id: 'solid', label: 'Solid Color' },
    { id: 'gradient', label: 'Linear Gradient' },
    { id: 'image', label: 'Image Background' },
    { id: 'video', label: 'Video Background' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateBgLayer({ bgType: 'image', imageUrl: url });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const videoEl = document.createElement('video');
      videoEl.src = url;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.play();
      onUpdateBgLayer({ bgType: 'video', videoUrl: url, videoElement: videoEl });
    }
  };

  return (
    <div className="p-4 space-y-4 text-xs text-gray-300">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

      {/* Background Type Selector */}
      <div className="space-y-2">
        <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-blue-400" />
          <span>Tipe Background</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {bgTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                onUpdateBgLayer({ bgType: type.id });
                if (type.id === 'image' && !bgLayer.imageUrl) {
                  setTimeout(() => imageInputRef.current?.click(), 100);
                }
                if (type.id === 'video' && !bgLayer.videoUrl) {
                  setTimeout(() => videoInputRef.current?.click(), 100);
                }
              }}
              className={`p-2 rounded border text-left font-bold text-[11px] transition-colors ${
                bgLayer.bgType === type.id
                  ? 'bg-blue-950/40 border-blue-500 text-white'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:bg-[#222222] hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Media Upload Buttons if Image or Video Selected */}
      {bgLayer.bgType === 'image' && (
        <button
          onClick={() => imageInputRef.current?.click()}
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{bgLayer.imageUrl ? 'Ganti Gambar' : 'Upload Gambar Background'}</span>
        </button>
      )}

      {bgLayer.bgType === 'video' && (
        <button
          onClick={() => videoInputRef.current?.click()}
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
        >
          <VideoIcon className="w-3.5 h-3.5" />
          <span>{bgLayer.videoUrl ? 'Ganti Video' : 'Upload Video Background'}</span>
        </button>
      )}

      {/* Visual Adjustments & Filters */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3.5 space-y-3.5">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>Filter & Efek Background</span>
        </div>

        {/* Blur */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-400 text-[11px]">
            <span>Blur Background</span>
            <span className="font-mono text-gray-200">{bgLayer.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={bgLayer.blur}
            onChange={(e) => onUpdateBgLayer({ blur: parseInt(e.target.value) })}
            className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-400 text-[11px]">
            <span>Kecerahan (Brightness)</span>
            <span className="font-mono text-gray-200">{Math.round(bgLayer.brightness * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={bgLayer.brightness}
            onChange={(e) => onUpdateBgLayer({ brightness: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-400 text-[11px]">
            <span>Kontras (Contrast)</span>
            <span className="font-mono text-gray-200">{Math.round(bgLayer.contrast * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={bgLayer.contrast}
            onChange={(e) => onUpdateBgLayer({ contrast: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Vignette */}
        <div className="space-y-1">
          <div className="flex justify-between text-gray-400 text-[11px]">
            <span>Vignette Border</span>
            <span className="font-mono text-gray-200">{Math.round(bgLayer.vignette * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bgLayer.vignette}
            onChange={(e) => onUpdateBgLayer({ vignette: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
