/**
 * VIZ Studio - Header Toolbar Component
 */

import React, { useRef } from 'react';
import {
  Video,
  FolderOpen,
  Save,
  Download,
  RotateCcw,
  RotateCw,
  Maximize2,
  Settings,
  Sparkles,
  Layers,
  Music,
  Tv,
  FileCode,
  Grid,
} from 'lucide-react';
import { ProjectData, ResolutionPreset } from '../../types';
import { RESOLUTION_PRESETS } from '../../hooks/useProject';
import { importProjectJSONFile } from '../../storage/ProjectIO';

interface HeaderToolbarProps {
  project: ProjectData;
  onUpdateProject: (p: ProjectData) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResolutionChange: (res: ResolutionPreset) => void;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenProjectModal: () => void;
  onAudioFileSelected: (file: File) => void;
  fps: number;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  project,
  onUpdateProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResolutionChange,
  onOpenExportModal,
  onOpenSettingsModal,
  onOpenProjectModal,
  onAudioFileSelected,
  fps,
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await importProjectJSONFile(file);
        onUpdateProject(imported);
      } catch (err: any) {
        alert('Gagal mengimpor file proyek: ' + err.message);
      }
    }
  };

  return (
    <header className="h-12 bg-[#141414] border-b border-[#2a2a2a] px-4 flex items-center justify-between text-gray-300 select-none text-xs shrink-0">
      {/* Hidden File Inputs */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAudioFileSelected(file);
        }}
      />
      <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />

      {/* Left Group: Logo & Project Actions */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xs shadow-md">
            V
          </div>
          <span className="font-bold text-white tracking-tight text-sm">VIZ STUDIO</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-blue-400 font-mono uppercase tracking-wider">
            v1.0
          </span>
        </div>

        <div className="h-4 w-px bg-[#2a2a2a]" />

        {/* Project Name & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProjectModal}
            className="px-2.5 py-1 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] hover:border-blue-500 text-gray-200 flex items-center gap-1.5 transition-colors text-[11px] font-medium"
            title="Kelola Proyek (Simpan/Buka)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate max-w-[120px]">{project.name}</span>
          </button>

          <button
            onClick={() => audioInputRef.current?.click()}
            className="px-2.5 py-1 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] hover:border-blue-500 text-gray-200 flex items-center gap-1.5 transition-colors text-[11px] font-medium uppercase tracking-wider"
            title="Import Audio / Video"
          >
            <Music className="w-3.5 h-3.5 text-blue-400" />
            <span>Import Audio</span>
          </button>

          <button
            onClick={() => jsonInputRef.current?.click()}
            className="p-1 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
            title="Import JSON Proyek"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Group: Undo/Redo & Resolution Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-[#2a2a2a] rounded p-0.5 gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded hover:bg-[#333] text-gray-300 disabled:opacity-40 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded hover:bg-[#333] text-gray-300 disabled:opacity-40 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#2a2a2a]" />

        {/* Resolution Dropdown */}
        <div className="flex items-center gap-2 text-[10px] bg-[#2a2a2a] px-2 py-1 rounded border border-[#333]">
          <span className="text-gray-400 uppercase font-semibold">Resolution</span>
          <select
            value={project.resolution.preset}
            onChange={(e) => onResolutionChange(e.target.value as ResolutionPreset)}
            className="bg-transparent text-white font-mono focus:outline-none cursor-pointer text-[10px]"
          >
            {Object.entries(RESOLUTION_PRESETS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-[#141414] text-gray-200">
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* FPS Indicator */}
        <div className="flex items-center gap-1.5 text-[10px] bg-[#2a2a2a] px-2 py-1 rounded border border-[#333] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-300">{fps} FPS</span>
        </div>
      </div>

      {/* Right Group: Tools, Fullscreen & Export CTA */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
          title="Mode Fullscreen (F11)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="p-1.5 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
          title="Pengaturan Studio"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenExportModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors uppercase tracking-wider flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT</span>
        </button>
      </div>
    </header>
  );
};
