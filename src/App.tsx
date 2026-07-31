/**
 * VIZ Studio - Main Application Container
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useProject } from './hooks/useProject';
import { useAudio } from './hooks/useAudio';
import { useKeyboardShortcuts } from './utils/keyboardShortcuts';
import { HeaderToolbar } from './components/layout/HeaderToolbar';
import { Sidebar } from './components/layout/Sidebar';
import { PreviewCanvas, PreviewCanvasRef } from './components/layout/PreviewCanvas';
import { Inspector } from './components/layout/Inspector';
import { Timeline } from './components/layout/Timeline';
import { StatusBar } from './components/layout/StatusBar';
import { ExportModal } from './components/modals/ExportModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { VisualizerLayer, TextLayer, VisualizerPresetType, FFTSize } from './types';
import { dbStorage } from './storage/IndexedDBStorage';

export default function App() {
  const previewCanvasRef = useRef<PreviewCanvasRef>(null);

  const {
    project,
    updateProject,
    selectedLayer,
    selectedLayerId,
    setSelectedLayerId,
    updateLayer,
    addLayer,
    deleteLayer,
    duplicateLayer,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAutoSaveTime,
    setResolution,
  } = useProject();

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    trackInfo,
    waveformPeaks,
    audioBands,
    loadAudioFile,
    togglePlay,
    seek,
    changeVolume,
    setFFTSize,
  } = useAudio();

  // Modal States
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fftSize, setFftSizeState] = useState<FFTSize>(2048);

  // FPS Monitor State
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animId: number;
    const calcFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onSave: () => {
      dbStorage.saveProject(project).then(() => {
        alert(`Proyek "${project.name}" disimpan!`);
      });
    },
    onUndo: undo,
    onRedo: redo,
    onDuplicate: () => {
      if (selectedLayerId) duplicateLayer(selectedLayerId);
    },
    onDelete: () => {
      if (selectedLayerId && project.layers.length > 1) deleteLayer(selectedLayerId);
    },
    onTogglePlay: togglePlay,
  });

  // Add Visualizer Layer
  const handleAddVisualizerLayer = (preset: VisualizerPresetType) => {
    const newLayer: VisualizerLayer = {
      id: 'viz-' + Date.now(),
      name: `${preset.toUpperCase()} Visualizer`,
      type: 'visualizer',
      visible: true,
      locked: false,
      zIndex: project.layers.length + 1,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      blendMode: 'source-over',
      keyframes: [],
      preset,
      colorPrimary: '#3b82f6',
      colorSecondary: '#ec4899',
      useGradient: true,
      gradientAngle: 90,
      glow: 15,
      glowColor: '#3b82f6',
      thickness: 3,
      sensitivity: 1.2,
      fftSize: 2048,
      smoothing: 0.8,
      radius: 120,
      gap: 4,
      height: 120,
      mirror: true,
      flip: false,
      shadow: true,
      shadowColor: '#000000',
      blur: 0,
    };
    addLayer(newLayer);
  };

  // Add Text Layer
  const handleAddTextLayer = (content: string = 'VIZ STUDIO', font: string = 'Montserrat') => {
    const newLayer: TextLayer = {
      id: 'text-' + Date.now(),
      name: 'Text Layer',
      type: 'text',
      visible: true,
      locked: false,
      zIndex: project.layers.length + 1,
      x: 0,
      y: -150,
      scale: 1,
      rotation: 0,
      opacity: 1,
      blendMode: 'source-over',
      keyframes: [],
      content,
      fontFamily: font,
      fontSize: 48,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#ffffff',
      gradientText: true,
      gradientColors: ['#ffffff', '#60a5fa'],
      stroke: false,
      strokeColor: '#000000',
      strokeWidth: 2,
      glow: true,
      glowColor: '#3b82f6',
      glowBlur: 10,
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 10,
      shadowOffsetX: 2,
      shadowOffsetY: 4,
      emboss: false,
      letterSpacing: 4,
      lineHeight: 1.2,
      padding: 10,
      borderRadius: 8,
      animation: 'pulse',
      animationSpeed: 1,
    };
    addLayer(newLayer);
  };

  // Reorder Layer Position
  const handleReorderLayer = (id: string, direction: 'up' | 'down') => {
    const layers = [...project.layers];
    const idx = layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;

    // Swap Z-Index
    const tempZ = layers[idx].zIndex;
    layers[idx].zIndex = layers[targetIdx].zIndex;
    layers[targetIdx].zIndex = tempZ;

    updateProject({ ...project, layers });
  };

  // Handle Audio File Selection
  const handleAudioSelected = async (file: File) => {
    const info = await loadAudioFile(file);
    updateProject({
      ...project,
      audioTrack: info,
      duration: Math.max(30, info.duration),
    });
  };

  // Handle AI Subtitles application
  const handleApplySubtitles = (subs: { start: number; end: number; text: string }[]) => {
    subs.forEach((s, idx) => {
      const textLayer: TextLayer = {
        id: `subtitle-${Date.now()}-${idx}`,
        name: `Sub: "${s.text.slice(0, 15)}..."`,
        type: 'text',
        visible: true,
        locked: false,
        zIndex: project.layers.length + 1 + idx,
        x: 0,
        y: 200,
        scale: 1,
        rotation: 0,
        opacity: 1,
        blendMode: 'source-over',
        keyframes: [],
        content: s.text,
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#fef08a',
        gradientText: false,
        gradientColors: ['#ffffff', '#ffffff'],
        stroke: true,
        strokeColor: '#000000',
        strokeWidth: 4,
        glow: true,
        glowColor: '#000000',
        glowBlur: 6,
        shadow: true,
        shadowColor: '#000000',
        shadowBlur: 8,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        emboss: false,
        letterSpacing: 2,
        lineHeight: 1.2,
        padding: 8,
        borderRadius: 4,
        animation: 'fade',
        animationSpeed: 1,
      };
      addLayer(textLayer);
    });
  };

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] text-gray-100 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Header Toolbar */}
      <HeaderToolbar
        project={project}
        onUpdateProject={updateProject}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onResolutionChange={setResolution}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onOpenProjectModal={() => setIsProjectOpen(true)}
        onAudioFileSelected={handleAudioSelected}
        fps={fps}
      />

      {/* 2. Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          project={project}
          trackInfo={trackInfo}
          volume={volume}
          onVolumeChange={changeVolume}
          onAudioFileSelected={handleAudioSelected}
          waveformPeaks={waveformPeaks}
          onRemoveAudio={() => updateProject({ ...project, audioTrack: undefined })}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={updateLayer}
          onAddVisualizerLayer={handleAddVisualizerLayer}
          onAddTextLayer={handleAddTextLayer}
          onDuplicateLayer={duplicateLayer}
          onDeleteLayer={deleteLayer}
          onReorderLayer={handleReorderLayer}
          onUpdateEffects={(partial) => updateProject({ ...project, effects: { ...project.effects, ...partial } })}
          onApplyPalette={(colors) => {
            const viz = project.layers.find((l) => l.type === 'visualizer');
            if (viz) {
              updateLayer(viz.id, {
                colorPrimary: colors[0] || '#3b82f6',
                colorSecondary: colors[1] || '#ec4899',
              });
            }
          }}
          onApplySubtitles={handleApplySubtitles}
        />

        {/* Center Preview Canvas Player */}
        <PreviewCanvas
          ref={previewCanvasRef}
          project={project}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration || project.duration}
          audioBands={audioBands}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onUpdateLayer={updateLayer}
        />

        {/* Right Contextual Inspector */}
        <Inspector layer={selectedLayer || null} onUpdateLayer={updateLayer} />
      </div>

      {/* 3. Bottom Multi-Track Timeline */}
      <Timeline
        project={project}
        currentTime={currentTime}
        duration={duration || project.duration}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onSeek={seek}
        onUpdateProject={updateProject}
      />

      {/* 4. Bottom Status Bar */}
      <StatusBar fps={fps} audioBands={audioBands} lastAutoSaveTime={lastAutoSaveTime} />

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvas={document.querySelector('canvas')}
        duration={duration || project.duration}
        renderFrameAtTime={(t) => previewCanvasRef.current?.renderFrameSync(t)}
      />

      <ProjectModal
        isOpen={isProjectOpen}
        onClose={() => setIsProjectOpen(false)}
        currentProject={project}
        onSelectProject={(p) => updateProject(p)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        fftSize={fftSize}
        onChangeFFTSize={(sz) => {
          setFftSizeState(sz);
          setFFTSize(sz);
        }}
      />
    </div>
  );
}
