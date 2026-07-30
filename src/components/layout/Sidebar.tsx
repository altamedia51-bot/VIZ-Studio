/**
 * VIZ Studio - Tabbed Sidebar Navigation
 */

import React, { useState } from 'react';
import {
  Music,
  Radio,
  Type,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';
import { AudioPanel } from '../sidebar/AudioPanel';
import { VisualizerPanel } from '../sidebar/VisualizerPanel';
import { TextPanel } from '../sidebar/TextPanel';
import { BackgroundPanel } from '../sidebar/BackgroundPanel';
import { EffectsPanel } from '../sidebar/EffectsPanel';
import { LayerPanel } from '../sidebar/LayerPanel';
import { AiToolsPanel } from '../sidebar/AiToolsPanel';

import {
  ProjectData,
  AudioTrackInfo,
  VisualizerLayer,
  TextLayer,
  BackgroundLayer,
  PostEffectsConfig,
  VisualizerPresetType,
  BaseLayer,
} from '../../types';

interface SidebarProps {
  project: ProjectData;
  trackInfo: AudioTrackInfo | null;
  volume: number;
  onVolumeChange: (v: number) => void;
  onAudioFileSelected: (file: File) => void;
  waveformPeaks: number[];
  onRemoveAudio: () => void;
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, partial: any) => void;
  onAddVisualizerLayer: (preset: VisualizerPresetType) => void;
  onAddTextLayer: (content?: string, font?: string) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
  onUpdateEffects: (partial: Partial<PostEffectsConfig>) => void;
  onApplyPalette: (colors: string[]) => void;
  onApplySubtitles: (subs: any[]) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  project,
  trackInfo,
  volume,
  onVolumeChange,
  onAudioFileSelected,
  waveformPeaks,
  onRemoveAudio,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onAddVisualizerLayer,
  onAddTextLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onReorderLayer,
  onUpdateEffects,
  onApplyPalette,
  onApplySubtitles,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'visualizer' | 'text' | 'background' | 'effects' | 'layers' | 'ai'>('visualizer');

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);
  const activeVisualizerLayer = selectedLayer?.type === 'visualizer' ? (selectedLayer as VisualizerLayer) : null;
  const activeTextLayer = selectedLayer?.type === 'text' ? (selectedLayer as TextLayer) : null;
  const bgLayer = (project.layers.find((l) => l.type === 'background') as BackgroundLayer) || null;

  const tabs = [
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'visualizer', label: 'Visualizer', icon: Radio },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'background', label: 'Background', icon: ImageIcon },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'layers', label: 'Layers', icon: Layers },
    { id: 'ai', label: 'AI Studio', icon: Zap },
  ];

  return (
    <aside className="w-80 bg-[#141414] border-r border-[#2a2a2a] flex flex-col shrink-0 select-none text-gray-300">
      {/* Navigation Tabs Header */}
      <div className="flex items-center bg-[#0f0f0f] border-b border-[#2a2a2a] overflow-x-auto scrollbar-none shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-2 flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider transition-colors border-b-2 whitespace-nowrap min-w-[60px] ${
                isActive
                  ? 'border-blue-500 text-white bg-[#141414]'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'audio' && (
          <AudioPanel
            trackInfo={trackInfo}
            volume={volume}
            onVolumeChange={onVolumeChange}
            onAudioFileSelected={onAudioFileSelected}
            waveformPeaks={waveformPeaks}
            onRemoveAudio={onRemoveAudio}
          />
        )}

        {activeTab === 'visualizer' && (
          <VisualizerPanel
            activeLayer={activeVisualizerLayer}
            onSelectPreset={(preset) => {
              if (activeVisualizerLayer) onUpdateLayer(activeVisualizerLayer.id, { preset });
              else onAddVisualizerLayer(preset);
            }}
            onAddVisualizerLayer={onAddVisualizerLayer}
          />
        )}

        {activeTab === 'text' && (
          <TextPanel
            activeLayer={activeTextLayer}
            onAddTextLayer={onAddTextLayer}
            onUpdateTextLayer={(partial) => {
              if (activeTextLayer) onUpdateLayer(activeTextLayer.id, partial);
            }}
          />
        )}

        {activeTab === 'background' && (
          <BackgroundPanel
            bgLayer={bgLayer}
            onUpdateBgLayer={(partial) => {
              if (bgLayer) onUpdateLayer(bgLayer.id, partial);
            }}
          />
        )}

        {activeTab === 'effects' && (
          <EffectsPanel effects={project.effects} onUpdateEffects={onUpdateEffects} />
        )}

        {activeTab === 'layers' && (
          <LayerPanel
            layers={project.layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onUpdateLayer={onUpdateLayer}
            onDuplicateLayer={onDuplicateLayer}
            onDeleteLayer={onDeleteLayer}
            onReorderLayer={onReorderLayer}
          />
        )}

        {activeTab === 'ai' && (
          <AiToolsPanel
            onApplyPalette={onApplyPalette}
            onApplySubtitles={onApplySubtitles}
            duration={project.duration}
          />
        )}
      </div>
    </aside>
  );
};
