/**
 * VIZ Studio - Effects & Post Processing Panel
 */

import React from 'react';
import { Sparkles, Sun, Eye, Film, Aperture } from 'lucide-react';
import { PostEffectsConfig } from '../../types';

interface EffectsPanelProps {
  effects: PostEffectsConfig;
  onUpdateEffects: (partial: Partial<PostEffectsConfig>) => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  effects,
  onUpdateEffects,
}) => {
  const lutPresets = [
    { id: 'none', label: 'Normal / Default' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon' },
    { id: 'vintage', label: 'Vintage Gold' },
    { id: 'warm_cinematic', label: 'Warm Cinematic' },
    { id: 'cool_noir', label: 'Cool Noir Blue' },
    { id: 'vibrant_pop', label: 'Vibrant Pop' },
  ];

  return (
    <div className="p-4 space-y-4 text-xs text-gray-300">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3.5 space-y-3.5">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Post-Processing Special Effects</span>
        </div>

        {/* Bloom */}
        <label className="flex items-center justify-between p-2.5 bg-[#0a0a0a] rounded border border-[#2a2a2a] cursor-pointer hover:border-blue-500 transition-colors">
          <span className="font-medium text-gray-200">Bloom Glow Effect</span>
          <input
            type="checkbox"
            checked={effects.bloom}
            onChange={(e) => onUpdateEffects({ bloom: e.target.checked })}
            className="rounded border-[#2a2a2a] bg-[#141414] text-blue-600 focus:ring-blue-500"
          />
        </label>

        {/* Chromatic Aberration */}
        <label className="flex items-center justify-between p-2.5 bg-[#0a0a0a] rounded border border-[#2a2a2a] cursor-pointer hover:border-blue-500 transition-colors">
          <span className="font-medium text-gray-200">Chromatic Aberration (RGB Shift)</span>
          <input
            type="checkbox"
            checked={effects.chromaticAberration}
            onChange={(e) => onUpdateEffects({ chromaticAberration: e.target.checked })}
            className="rounded border-[#2a2a2a] bg-[#141414] text-blue-600 focus:ring-blue-500"
          />
        </label>

        {/* Film Grain */}
        <label className="flex items-center justify-between p-2.5 bg-[#0a0a0a] rounded border border-[#2a2a2a] cursor-pointer hover:border-blue-500 transition-colors">
          <span className="font-medium text-gray-200">Film Grain Texture</span>
          <input
            type="checkbox"
            checked={effects.filmGrain}
            onChange={(e) => onUpdateEffects({ filmGrain: e.target.checked })}
            className="rounded border-[#2a2a2a] bg-[#141414] text-blue-600 focus:ring-blue-500"
          />
        </label>

        {/* Lens Flare */}
        <label className="flex items-center justify-between p-2.5 bg-[#0a0a0a] rounded border border-[#2a2a2a] cursor-pointer hover:border-blue-500 transition-colors">
          <span className="font-medium text-gray-200">Lens Flare Anamorphic</span>
          <input
            type="checkbox"
            checked={effects.lensFlare}
            onChange={(e) => onUpdateEffects({ lensFlare: e.target.checked })}
            className="rounded border-[#2a2a2a] bg-[#141414] text-blue-600 focus:ring-blue-500"
          />
        </label>

        {/* LUT Color Filters */}
        <div className="space-y-1 pt-2">
          <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">LUT Color Grading Preset</label>
          <select
            value={effects.lutFilter}
            onChange={(e) => onUpdateEffects({ lutFilter: e.target.value as any })}
            className="w-full p-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer text-xs"
          >
            {lutPresets.map((lut) => (
              <option key={lut.id} value={lut.id} className="bg-[#141414]">
                {lut.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
