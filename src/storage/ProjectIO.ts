/**
 * VIZ Studio - Project IO & Default Factory
 */

import { ProjectData, VisualizerLayer, TextLayer, BackgroundLayer } from '../types';

export function createNewDefaultProject(name: string = 'Untitled Visualizer Project'): ProjectData {
  const bgLayer: BackgroundLayer = {
    id: 'bg-1',
    name: 'Cyber Grid Background',
    type: 'background',
    visible: true,
    locked: false,
    zIndex: 0,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    blendMode: 'source-over',
    keyframes: [],
    bgType: 'cyber',
    colorSolid: '#090d16',
    gradientColors: ['#0f172a', '#1e1b4b'],
    gradientSpeed: 1,
    blur: 0,
    brightness: 1,
    contrast: 1,
    hue: 0,
    saturation: 1,
    vignette: 0.4,
    grain: 0.1,
    tintColor: '#38bdf8',
    tintOpacity: 0.05,
  };

  const vizLayer: VisualizerLayer = {
    id: 'viz-1',
    name: 'Linear Bars Visualizer',
    type: 'visualizer',
    visible: true,
    locked: false,
    zIndex: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    blendMode: 'source-over',
    keyframes: [],
    preset: 'bars',
    colorPrimary: '#3b82f6',
    colorSecondary: '#ec4899',
    useGradient: true,
    gradientAngle: 90,
    glow: 15,
    glowColor: '#3b82f6',
    thickness: 4,
    sensitivity: 1.2,
    fftSize: 2048,
    smoothing: 0.8,
    radius: 120,
    gap: 4,
    height: 150,
    mirror: true,
    flip: false,
    shadow: true,
    shadowColor: '#000000',
    blur: 0,
  };

  const textLayer: TextLayer = {
    id: 'text-1',
    name: 'Title Text Layer',
    type: 'text',
    visible: true,
    locked: false,
    zIndex: 2,
    x: 0,
    y: -180,
    scale: 1,
    rotation: 0,
    opacity: 1,
    blendMode: 'source-over',
    keyframes: [],
    content: 'VIZ STUDIO',
    fontFamily: 'Montserrat',
    fontSize: 52,
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
    letterSpacing: 6,
    lineHeight: 1.2,
    padding: 10,
    borderRadius: 8,
    animation: 'pulse',
    animationSpeed: 1,
  };

  return {
    id: 'proj-' + Date.now(),
    name,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolution: {
      preset: '1080p',
      width: 1920,
      height: 1080,
    },
    fps: 60,
    duration: 60, // 60 seconds default
    layers: [bgLayer, vizLayer, textLayer],
    tracks: [
      { id: 'track-audio', name: 'Master Audio Track', type: 'audio', muted: false, locked: false, height: 48 },
      { id: 'track-bg', name: 'Background Track', type: 'background', muted: false, locked: false, height: 44 },
      { id: 'track-viz', name: 'Visualizer Track', type: 'visualizer', muted: false, locked: false, height: 44 },
      { id: 'track-text', name: 'Text & Titles Track', type: 'text', muted: false, locked: false, height: 44 },
    ],
    clips: [
      { id: 'clip-bg', layerId: 'bg-1', trackId: 'track-bg', startTime: 0, duration: 60, mediaOffset: 0, name: 'Background' },
      { id: 'clip-viz', layerId: 'viz-1', trackId: 'track-viz', startTime: 0, duration: 60, mediaOffset: 0, name: 'Visualizer Bars' },
      { id: 'clip-text', layerId: 'text-1', trackId: 'track-text', startTime: 0, duration: 60, mediaOffset: 0, name: 'Title Text' },
    ],
    markers: [],
    effects: {
      bloom: true,
      bloomIntensity: 0.5,
      motionBlur: false,
      motionBlurSamples: 4,
      lensFlare: false,
      chromaticAberration: false,
      chromaticAmount: 2,
      filmGrain: true,
      filmGrainAmount: 0.2,
      lutFilter: 'none',
    },
    theme: {
      accentColor: '#3b82f6',
      darkCanvas: true,
    },
  };
}

export function exportProjectJSON(project: ProjectData): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/ /g, '_')}_vizstudio.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export async function importProjectJSONFile(file: File): Promise<ProjectData> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed.id || !parsed.layers) {
    throw new Error('Invalid VIZ Studio project JSON structure');
  }
  return parsed as ProjectData;
}
