/**
 * VIZ Studio - Text Editor Panel
 */

import React, { useRef } from 'react';
import { Type, Plus, Upload, Sparkles, Move, Palette } from 'lucide-react';
import { TextLayer, TextAnimationType } from '../../types';
import { POPULAR_GOOGLE_FONTS, loadGoogleFont, loadCustomFontFile } from '../../utils/fontList';

interface TextPanelProps {
  activeLayer: TextLayer | null;
  onAddTextLayer: (content?: string, font?: string) => void;
  onUpdateTextLayer: (partial: Partial<TextLayer>) => void;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  activeLayer,
  onAddTextLayer,
  onUpdateTextLayer,
}) => {
  const customFontInputRef = useRef<HTMLInputElement>(null);

  const animations: { id: TextAnimationType; label: string }[] = [
    { id: 'none', label: 'Tanpa Animasi' },
    { id: 'fade', label: 'Fade In' },
    { id: 'zoom', label: 'Zoom Pulse' },
    { id: 'bounce', label: 'Bounce' },
    { id: 'typing', label: 'Typing Effect' },
    { id: 'slide', label: 'Slide In' },
    { id: 'rotate', label: '3D Rotate' },
    { id: 'wave', label: 'Text Wave' },
    { id: 'glitch', label: 'Cyber Glitch' },
    { id: 'shake', label: 'Shake / Bass Hit' },
    { id: 'pulse', label: 'Glow Pulse' },
    { id: 'neon', label: 'Flicker Neon' },
  ];

  const handleFontChange = (fontName: string) => {
    loadGoogleFont(fontName);
    if (activeLayer) {
      onUpdateTextLayer({ fontFamily: fontName });
    }
  };

  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const customFontName = await loadCustomFontFile(file);
        if (activeLayer) {
          onUpdateTextLayer({ fontFamily: customFontName });
        }
      } catch (err: any) {
        alert('Gagal mengunggah font custom: ' + err.message);
      }
    }
  };

  return (
    <div className="p-4 space-y-3.5 text-xs text-gray-300">
      <input
        ref={customFontInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={handleCustomFontUpload}
      />

      {/* Add Text Layer Button */}
      <button
        onClick={() => onAddTextLayer('VIZ STUDIO TEXT')}
        className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Tambah Layer Teks Baru</span>
      </button>

      {/* Active Text Inspector or Prompt */}
      {!activeLayer ? (
        <div className="text-center p-6 bg-[#1a1a1a] rounded border border-[#2a2a2a] text-gray-500 text-xs">
          Pilih layer teks untuk mengedit properti, font, dan animasi.
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3.5 space-y-3.5">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span>Edit Layer Teks ({activeLayer.name})</span>
          </div>

          {/* Text Content Input */}
          <div className="space-y-1">
            <label className="text-gray-400 font-medium text-[11px]">Isi Teks</label>
            <textarea
              rows={2}
              value={activeLayer.content}
              onChange={(e) => onUpdateTextLayer({ content: e.target.value })}
              className="w-full p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 resize-none font-medium text-xs"
            />
          </div>

          {/* Font Family Selector & Custom Upload */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-gray-400 font-medium text-[11px]">Font Family (Google Fonts)</label>
              <button
                onClick={() => customFontInputRef.current?.click()}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono uppercase"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Font</span>
              </button>
            </div>
            <select
              value={activeLayer.fontFamily}
              onChange={(e) => handleFontChange(e.target.value)}
              className="w-full p-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
            >
              {POPULAR_GOOGLE_FONTS.map((font) => (
                <option key={font.name} value={font.name} className="bg-[#141414]">
                  {font.name} ({font.category})
                </option>
              ))}
            </select>
          </div>

          {/* Text Size & Spacing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-gray-400 text-[11px]">Ukuran Font ({activeLayer.fontSize}px)</label>
              <input
                type="range"
                min="12"
                max="200"
                value={activeLayer.fontSize}
                onChange={(e) => onUpdateTextLayer({ fontSize: parseInt(e.target.value) })}
                className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-gray-400 text-[11px]">Letter Spacing ({activeLayer.letterSpacing}px)</label>
              <input
                type="range"
                min="0"
                max="30"
                value={activeLayer.letterSpacing}
                onChange={(e) => onUpdateTextLayer({ letterSpacing: parseInt(e.target.value) })}
                className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Text Color & Gradient */}
          <div className="space-y-2">
            <label className="text-gray-400 font-medium text-[11px]">Warna & Gradient Teks</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={activeLayer.color}
                onChange={(e) => onUpdateTextLayer({ color: e.target.value })}
                className="w-7 h-7 rounded border border-[#2a2a2a] bg-transparent cursor-pointer"
              />
              <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-xs">
                <input
                  type="checkbox"
                  checked={activeLayer.gradientText}
                  onChange={(e) => onUpdateTextLayer({ gradientText: e.target.checked })}
                  className="rounded border-[#2a2a2a] bg-[#0a0a0a] text-blue-600 focus:ring-blue-500"
                />
                <span>Gunakan Gradient Teks</span>
              </label>
            </div>
          </div>

          {/* Text Animations */}
          <div className="space-y-1">
            <label className="text-gray-400 font-medium text-[11px]">Animasi Teks</label>
            <select
              value={activeLayer.animation}
              onChange={(e) => onUpdateTextLayer({ animation: e.target.value as TextAnimationType })}
              className="w-full p-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
            >
              {animations.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#141414]">
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
