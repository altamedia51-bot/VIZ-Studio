/**
 * VIZ Studio - Contextual Inspector Panel (Right Sidebar)
 */

import React from 'react';
import { Sliders, Move, Eye, RotateCw, Palette, Sparkles, Layers } from 'lucide-react';
import { BaseLayer, VisualizerLayer, TextLayer, BackgroundLayer, BlendMode, FFTSize } from '../../types';

interface InspectorProps {
  layer: BaseLayer | null;
  onUpdateLayer: (id: string, partial: any) => void;
}

export const Inspector: React.FC<InspectorProps> = ({ layer, onUpdateLayer }) => {
  if (!layer) {
    return (
      <aside className="w-72 bg-[#141414] border-l border-[#2a2a2a] p-6 text-center text-xs text-[#737373] select-none flex flex-col items-center justify-center shrink-0">
        <Sliders className="w-8 h-8 text-[#333] mb-2" />
        <p className="font-bold text-gray-300 uppercase tracking-wider text-xs">Tidak ada layer terpilih</p>
        <p className="text-[10px] text-[#737373] mt-1">Pilih layer di timeline atau daftar layer untuk mengedit properti.</p>
      </aside>
    );
  }

  const blendModes: BlendMode[] = [
    'source-over',
    'lighter',
    'multiply',
    'screen',
    'overlay',
    'color-dodge',
    'hard-light',
  ];

  return (
    <aside className="w-72 bg-[#141414] border-l border-[#2a2a2a] p-4 space-y-4 text-xs text-gray-300 select-none overflow-y-auto custom-scrollbar shrink-0">
      {/* Layer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a]">
        <div className="truncate">
          <p className="font-bold text-white text-sm truncate">{layer.name}</p>
          <span className="text-[9px] uppercase font-mono text-blue-400 bg-blue-950/40 border border-blue-800/40 px-1.5 py-0.5 rounded">
            {layer.type}
          </span>
        </div>
      </div>

      {/* Transform Controls (X, Y, Scale, Rotation, Opacity) */}
      <div className="space-y-3 bg-[#1a1a1a] p-3 rounded border border-[#2a2a2a]">
        <p className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-blue-400" />
          <span>Transform & Posisi</span>
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-gray-400 text-[10px]">Posisi X ({layer.x}px)</label>
            <input
              type="number"
              value={layer.x}
              onChange={(e) => onUpdateLayer(layer.id, { x: parseFloat(e.target.value) || 0 })}
              className="w-full p-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded font-mono text-gray-200 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          <div>
            <label className="text-gray-400 text-[10px]">Posisi Y ({layer.y}px)</label>
            <input
              type="number"
              value={layer.y}
              onChange={(e) => onUpdateLayer(layer.id, { y: parseFloat(e.target.value) || 0 })}
              className="w-full p-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded font-mono text-gray-200 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-gray-400 text-[10px]">
            <span>Scale ({Math.round((layer.scale || 1) * 100)}%)</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.05"
            value={layer.scale || 1}
            onChange={(e) => onUpdateLayer(layer.id, { scale: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-gray-400 text-[10px]">
            <span>Rotasi ({layer.rotation || 0}°)</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={layer.rotation || 0}
            onChange={(e) => onUpdateLayer(layer.id, { rotation: parseInt(e.target.value) })}
            className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-gray-400 text-[10px]">
            <span>Opasitas ({Math.round((layer.opacity ?? 1) * 100)}%)</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={layer.opacity ?? 1}
            onChange={(e) => onUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Blend Mode</label>
          <select
            value={layer.blendMode || 'source-over'}
            onChange={(e) => onUpdateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
            className="w-full p-1.5 mt-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 font-mono text-xs cursor-pointer"
          >
            {blendModes.map((bm) => (
              <option key={bm} value={bm} className="bg-[#141414]">
                {bm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visualizer Specific Inspector */}
      {layer.type === 'visualizer' && (
        <VisualizerSpecificInspector layer={layer as VisualizerLayer} onUpdateLayer={onUpdateLayer} />
      )}
    </aside>
  );
};

const VisualizerSpecificInspector: React.FC<{
  layer: VisualizerLayer;
  onUpdateLayer: (id: string, partial: any) => void;
}> = ({ layer, onUpdateLayer }) => {
  return (
    <div className="space-y-3 bg-[#1a1a1a] p-3 rounded border border-[#2a2a2a]">
      <p className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Properti Visualizer ({layer.preset})</span>
      </p>

      {/* Primary & Secondary Color */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-[10px]">Warna Utama</label>
          <input
            type="color"
            value={layer.colorPrimary || '#3b82f6'}
            onChange={(e) => onUpdateLayer(layer.id, { colorPrimary: e.target.value })}
            className="w-full h-7 rounded border border-[#2a2a2a] bg-transparent cursor-pointer block mt-1"
          />
        </div>
        <div>
          <label className="text-gray-400 text-[10px]">Warna Kedua</label>
          <input
            type="color"
            value={layer.colorSecondary || '#ec4899'}
            onChange={(e) => onUpdateLayer(layer.id, { colorSecondary: e.target.value })}
            className="w-full h-7 rounded border border-[#2a2a2a] bg-transparent cursor-pointer block mt-1"
          />
        </div>
      </div>

      {/* Glow */}
      <div>
        <div className="flex justify-between text-gray-400 text-[10px]">
          <span>Glow Effect ({layer.glow}px)</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={layer.glow || 0}
          onChange={(e) => onUpdateLayer(layer.id, { glow: parseInt(e.target.value) })}
          className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
        />
      </div>

      {/* Sensitivity */}
      <div>
        <div className="flex justify-between text-gray-400 text-[10px]">
          <span>Sensitivitas Audio ({layer.sensitivity}x)</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.1"
          value={layer.sensitivity || 1}
          onChange={(e) => onUpdateLayer(layer.id, { sensitivity: parseFloat(e.target.value) })}
          className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
        />
      </div>

      {/* Height / Radius */}
      <div>
        <div className="flex justify-between text-gray-400 text-[10px]">
          <span>Tinggi / Radius ({layer.height || layer.radius}px)</span>
        </div>
        <input
          type="range"
          min="20"
          max="300"
          value={layer.height || layer.radius || 100}
          onChange={(e) => onUpdateLayer(layer.id, { height: parseInt(e.target.value), radius: parseInt(e.target.value) })}
          className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
        />
      </div>

      {/* Mirror & Flip Toggles */}
      <div className="flex items-center gap-4 pt-1 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
          <input
            type="checkbox"
            checked={layer.mirror || false}
            onChange={(e) => onUpdateLayer(layer.id, { mirror: e.target.checked })}
            className="rounded border-[#2a2a2a] bg-[#0a0a0a] text-blue-600 focus:ring-blue-500"
          />
          <span>Mirror</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
          <input
            type="checkbox"
            checked={layer.flip || false}
            onChange={(e) => onUpdateLayer(layer.id, { flip: e.target.checked })}
            className="rounded border-[#2a2a2a] bg-[#0a0a0a] text-blue-600 focus:ring-blue-500"
          />
          <span>Flip</span>
        </label>
      </div>
    </div>
  );
};
