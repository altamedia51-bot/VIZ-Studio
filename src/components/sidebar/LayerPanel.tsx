/**
 * VIZ Studio - Layer Manager Panel
 */

import React from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { BaseLayer } from '../../types';

interface LayerPanelProps {
  layers: BaseLayer[];
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, partial: Partial<BaseLayer>) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onReorderLayer,
}) => {
  // Sort layers by Z-index descending for visual stack view
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="p-4 space-y-3 text-xs text-gray-300">
      <div className="flex items-center justify-between font-bold text-white uppercase tracking-wider text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Layer Stack ({layers.length})</span>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 custom-scrollbar">
        {sortedLayers.map((layer, idx) => {
          const isSelected = layer.id === selectedLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`p-2 rounded border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#222222]'
              }`}
            >
              {/* Left: Name & Type Badge */}
              <div className="flex items-center gap-2 truncate">
                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-[#2a2a2a] text-gray-400">
                  {layer.type}
                </span>
                <input
                  type="text"
                  value={layer.name}
                  onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent text-gray-200 font-medium truncate focus:outline-none focus:border-b focus:border-blue-400 text-xs"
                />
              </div>

              {/* Right: Quick Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'up');
                  }}
                  disabled={idx === 0}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                  title="Naikkan Layer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'down');
                  }}
                  disabled={idx === sortedLayers.length - 1}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                  title="Turunkan Layer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                  title={layer.visible ? 'Sembunyikan Layer' : 'Tampilkan Layer'}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-gray-600" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { locked: !layer.locked });
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                  title={layer.locked ? 'Buka Kunci' : 'Kunci Layer'}
                >
                  {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-gray-600" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateLayer(layer.id);
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Duplikat Layer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="p-1 text-gray-400 hover:text-rose-400"
                    title="Hapus Layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
