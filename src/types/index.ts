/**
 * VIZ Studio - Core TypeScript Interface & Type Definitions
 */

export type ResolutionPreset = '720p' | '1080p' | '1440p' | '4K' | 'Square' | 'Portrait' | 'Custom';

export interface AspectRatioConfig {
  name: ResolutionPreset;
  width: number;
  height: number;
  label: string;
}

export type BlendMode =
  | 'source-over'
  | 'lighter'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

// ---------------------------------------------------------------------------
// Layer & Keyframe Types
// ---------------------------------------------------------------------------

export type LayerType = 'audio' | 'visualizer' | 'text' | 'background' | 'image' | 'video' | 'effect';

export interface Keyframe {
  id: string;
  time: number; // in seconds
  properties: {
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    opacity?: number;
    sensitivity?: number;
  };
}

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  x: number; // percentage or px
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blendMode: BlendMode;
  keyframes: Keyframe[];
}

// ---------------------------------------------------------------------------
// Audio Engine Types
// ---------------------------------------------------------------------------

export interface AudioTrackInfo {
  id: string;
  name: string;
  file?: File;
  url?: string;
  buffer?: AudioBuffer;
  duration: number; // seconds
  volume: number; // 0 to 1
  trimStart: number; // seconds
  trimEnd: number;
  fadeIn: number; // seconds
  fadeOut: number;
  loop: boolean;
  muted: boolean;
  solo: boolean;
  playbackSpeed: number;
  bpm?: number;
  beatTimes?: number[];
}

export interface AudioBands {
  bass: number; // 0 to 1
  mid: number;
  treble: number;
  peak: number;
  amplitude: number;
}

export type FFTSize = 256 | 512 | 1024 | 2048 | 4096 | 8192;

// ---------------------------------------------------------------------------
// Visualizer Engine & 50 Presets
// ---------------------------------------------------------------------------

export type VisualizerPresetType =
  | 'bars'
  | 'circle'
  | 'double_circle'
  | 'spectrum'
  | 'circular_spectrum'
  | 'mirror'
  | 'neon'
  | 'glow'
  | 'pulse'
  | 'wave'
  | 'particle'
  | 'galaxy'
  | 'fire'
  | 'rain'
  | 'matrix'
  | 'equalizer'
  | 'hexagon'
  | 'polygon'
  | 'spiral'
  | 'tunnel'
  | 'lightning'
  | 'smoke'
  | 'ink'
  | 'aurora'
  | 'cyber'
  | 'retro'
  | 'dna'
  | 'floating_bubbles'
  | 'laser_beam'
  | 'heartbeat'
  | 'compass'
  | 'starburst'
  | 'sound_wave_rings'
  | 'vinyl_disc'
  | 'cassette_tape'
  | 'oscilloscope'
  | 'waveform_ribbon'
  | 'cubes'
  | 'diamond_pulse'
  | 'mandala'
  | 'vortex_ring'
  | 'shockwave'
  | 'cyber_ring'
  | 'neon_wave'
  | 'cosmic_dust'
  | 'dot_grid'
  | 'equalizer_bars_rounded'
  | 'orbiting_planets'
  | 'liquid_plasma'
  | 'sound_peak_mountain';

export interface VisualizerLayer extends BaseLayer {
  type: 'visualizer';
  preset: VisualizerPresetType;
  colorPrimary: string;
  colorSecondary: string;
  useGradient: boolean;
  gradientAngle: number;
  glow: number; // 0 to 50
  glowColor: string;
  thickness: number;
  sensitivity: number; // 0.1 to 3
  fftSize: FFTSize;
  smoothing: number; // 0.1 to 0.99
  radius: number; // for circular presets
  gap: number;
  height: number;
  mirror: boolean;
  flip: boolean;
  shadow: boolean;
  shadowColor: string;
  blur: number;
}

// ---------------------------------------------------------------------------
// Text Engine Types
// ---------------------------------------------------------------------------

export type TextAnimationType =
  | 'none'
  | 'fade'
  | 'zoom'
  | 'bounce'
  | 'typing'
  | 'slide'
  | 'rotate'
  | 'wave'
  | 'glitch'
  | 'shake'
  | 'pulse'
  | 'neon';

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number; // px
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  color: string;
  gradientText: boolean;
  gradientColors: [string, string];
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
  glow: boolean;
  glowColor: string;
  glowBlur: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  emboss: boolean;
  letterSpacing: number; // px
  lineHeight: number;
  backgroundColor?: string;
  padding: number;
  borderRadius: number;
  animation: TextAnimationType;
  animationSpeed: number;
}

// ---------------------------------------------------------------------------
// Background Engine Types
// ---------------------------------------------------------------------------

export type BackgroundType =
  | 'solid'
  | 'gradient'
  | 'animated_gradient'
  | 'image'
  | 'video'
  | 'particle'
  | 'noise'
  | 'aurora'
  | 'galaxy'
  | 'grid'
  | 'cyber';

export interface BackgroundLayer extends BaseLayer {
  type: 'background';
  bgType: BackgroundType;
  colorSolid: string;
  gradientColors: string[];
  gradientSpeed: number;
  imageUrl?: string;
  videoUrl?: string;
  videoElement?: HTMLVideoElement;
  blur: number;
  brightness: number; // 0 to 2
  contrast: number; // 0 to 2
  hue: number; // 0 to 360
  saturation: number; // 0 to 2
  vignette: number; // 0 to 1
  grain: number; // 0 to 1
  tintColor: string;
  tintOpacity: number;
}

// ---------------------------------------------------------------------------
// Effects / Post Processing Types
// ---------------------------------------------------------------------------

export interface PostEffectsConfig {
  bloom: boolean;
  bloomIntensity: number;
  motionBlur: boolean;
  motionBlurSamples: number;
  lensFlare: boolean;
  chromaticAberration: boolean;
  chromaticAmount: number;
  filmGrain: boolean;
  filmGrainAmount: number;
  lutFilter: 'none' | 'cyberpunk' | 'vintage' | 'warm_cinematic' | 'cool_noir' | 'vibrant_pop' | 'sepia';
}

// ---------------------------------------------------------------------------
// Timeline & Clip Types
// ---------------------------------------------------------------------------

export interface TimelineClip {
  id: string;
  layerId: string;
  trackId: string;
  startTime: number; // seconds on timeline
  duration: number; // length in seconds
  mediaOffset: number; // offset within media
  name: string;
  color?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: LayerType;
  muted: boolean;
  locked: boolean;
  height: number;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Project State
// ---------------------------------------------------------------------------

export interface ProjectData {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  resolution: {
    width: number;
    height: number;
    preset: ResolutionPreset;
  };
  fps: number;
  duration: number;
  audioTrack?: AudioTrackInfo;
  layers: (VisualizerLayer | TextLayer | BackgroundLayer | BaseLayer)[];
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  markers: TimelineMarker[];
  effects: PostEffectsConfig;
  theme: {
    accentColor: string;
    darkCanvas: boolean;
  };
}

// ---------------------------------------------------------------------------
// Export Configuration & State
// ---------------------------------------------------------------------------

export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'png_sequence';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra' | 'auto';

export interface ExportSettings {
  format: ExportFormat;
  resolutionPreset: ResolutionPreset;
  width: number;
  height: number;
  fps: number;
  bitrateKbps: number;
  quality: ExportQuality;
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'paused' | 'completed' | 'error';
  currentFrame: number;
  totalFrames: number;
  progressPercent: number; // 0 to 100
  elapsedSeconds: number;
  estimatedSecondsLeft: number;
  activeCodec: string;
  logs: string[];
  outputBlob?: Blob;
}
