/**
 * VIZ Studio - Visualizer Presets Panel
 * Displays 50+ Visualizer Presets with category filters, search, and instant activation.
 */

import React, { useState } from 'react';
import { Search, Radio, Sparkles, Sliders } from 'lucide-react';
import { VISUALIZER_PRESETS_LIST } from '../../visualizer/presets';
import { VisualizerLayer, VisualizerPresetType } from '../../types';

interface VisualizerPanelProps {
  activeLayer: VisualizerLayer | null;
  onSelectPreset: (presetId: VisualizerPresetType) => void;
  onAddVisualizerLayer: (presetId: VisualizerPresetType) => void;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  activeLayer,
  onSelectPreset,
  onAddVisualizerLayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Spectrum', 'Circular', 'Cyber', 'Particles', 'Waves', 'Geometric', 'Retro', 'FX'];

  const filteredPresets = VISUALIZER_PRESETS_LIST.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 space-y-3.5 text-xs text-gray-300">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
        <input
          type="text"
          placeholder="Cari preset visualizer (50+ preset)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 text-xs"
        />
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded whitespace-nowrap text-[10px] uppercase font-bold tracking-wider transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] hover:text-white border border-[#2a2a2a]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
        {filteredPresets.map((preset) => {
          const isActive = activeLayer?.preset === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => {
                if (activeLayer) onSelectPreset(preset.id as VisualizerPresetType);
                else onAddVisualizerLayer(preset.id as VisualizerPresetType);
              }}
              className={`p-2.5 rounded border text-left cursor-pointer transition-all relative group overflow-hidden ${
                isActive
                  ? 'bg-blue-950/40 border-blue-500 shadow'
                  : 'bg-[#1a1a1a] hover:bg-[#222222] border-[#2a2a2a] hover:border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-200 text-xs truncate group-hover:text-blue-400 transition-colors">
                  {preset.name}
                </span>
                {isActive && <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />}
              </div>
              <span className="text-[9px] text-[#737373] uppercase tracking-wider">{preset.category}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
