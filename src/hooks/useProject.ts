/**
 * VIZ Studio - useProject Hook
 * State manager for current project, unlimited undo/redo stack, layer manipulations, and IndexedDB auto-save.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectData, BaseLayer, TimelineClip, ResolutionPreset, AspectRatioConfig } from '../types';
import { createNewDefaultProject, exportProjectJSON } from '../storage/ProjectIO';
import { dbStorage } from '../storage/IndexedDBStorage';

export const RESOLUTION_PRESETS: Record<ResolutionPreset, AspectRatioConfig> = {
  '720p': { name: '720p', width: 1280, height: 720, label: '720p HD (16:9)' },
  '1080p': { name: '1080p', width: 1920, height: 1080, label: '1080p Full HD (16:9)' },
  '1440p': { name: '1440p', width: 2560, height: 1440, label: '2160p 2K (16:9)' },
  '4K': { name: '4K', width: 3840, height: 2160, label: '4K Ultra HD (16:9)' },
  Square: { name: 'Square', width: 1080, height: 1080, label: 'Square (1:1 Instagram/Feed)' },
  Portrait: { name: 'Portrait', width: 1080, height: 1920, label: 'Portrait (9:16 TikTok/Reels)' },
  Custom: { name: 'Custom', width: 1920, height: 1080, label: 'Custom Canvas' },
};

export function useProject() {
  const [project, setProjectState] = useState<ProjectData>(() => createNewDefaultProject());
  const [selectedLayerId, setSelectedLayerId] = useState<string>('viz-1');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);

  // Unlimited Undo / Redo history stacks
  const undoStackRef = useRef<ProjectData[]>([]);
  const redoStackRef = useRef<ProjectData[]>([]);

  // Update project state with history tracking
  const updateProject = useCallback((newProject: ProjectData | ((prev: ProjectData) => ProjectData), pushHistory = true) => {
    setProjectState((prev) => {
      const next = typeof newProject === 'function' ? newProject(prev) : newProject;
      if (pushHistory) {
        undoStackRef.current.push(JSON.parse(JSON.stringify(prev)));
        redoStackRef.current = []; // Clear redo stack on new modification
      }
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }, []);

  // Undo action
  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current.pop()!;
    setProjectState((current) => {
      redoStackRef.current.push(JSON.parse(JSON.stringify(current)));
      return previous;
    });
  }, []);

  // Redo action
  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    setProjectState((current) => {
      undoStackRef.current.push(JSON.parse(JSON.stringify(current)));
      return next;
    });
  }, []);

  // Auto-save timer (Every 30 seconds)
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const timer = setInterval(() => {
      dbStorage.saveProject(project).then(() => {
        setLastAutoSaveTime(new Date().toLocaleTimeString());
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [project, autoSaveEnabled]);

  // Load project from IndexedDB
  const loadProjectFromStorage = useCallback(async (id: string) => {
    const loaded = await dbStorage.getProject(id);
    if (loaded) {
      setProjectState(loaded);
      if (loaded.layers.length > 0) setSelectedLayerId(loaded.layers[0].id);
    }
  }, []);

  // Selected Layer
  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);

  // Update a specific layer
  const updateLayer = useCallback((layerId: string, partial: Partial<BaseLayer> | any) => {
    updateProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, ...partial } : l)),
    }));
  }, [updateProject]);

  // Add a layer
  const addLayer = useCallback((layer: BaseLayer) => {
    updateProject((prev) => {
      const updatedLayers = [...prev.layers, layer];
      const newClip: TimelineClip = {
        id: 'clip-' + Date.now(),
        layerId: layer.id,
        trackId: prev.tracks.find((t) => t.type === layer.type)?.id || prev.tracks[0].id,
        startTime: 0,
        duration: prev.duration,
        mediaOffset: 0,
        name: layer.name,
      };
      return {
        ...prev,
        layers: updatedLayers,
        clips: [...prev.clips, newClip],
      };
    });
    setSelectedLayerId(layer.id);
  }, [updateProject]);

  // Delete layer
  const deleteLayer = useCallback((layerId: string) => {
    updateProject((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== layerId),
      clips: prev.clips.filter((c) => c.layerId !== layerId),
    }));
  }, [updateProject]);

  // Duplicate layer
  const duplicateLayer = useCallback((layerId: string) => {
    const target = project.layers.find((l) => l.id === layerId);
    if (!target) return;
    const newId = 'layer-' + Date.now();
    const cloned: BaseLayer = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name} (Copy)`,
      y: target.y + 20,
    };
    addLayer(cloned);
  }, [project.layers, addLayer]);

  // Change Resolution
  const setResolution = useCallback((preset: ResolutionPreset) => {
    const cfg = RESOLUTION_PRESETS[preset];
    updateProject((prev) => ({
      ...prev,
      resolution: {
        preset,
        width: cfg.width,
        height: cfg.height,
      },
    }));
  }, [updateProject]);

  return {
    project,
    setProjectState,
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
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    autoSaveEnabled,
    setAutoSaveEnabled,
    lastAutoSaveTime,
    setResolution,
    exportJSON: () => exportProjectJSON(project),
  };
}
