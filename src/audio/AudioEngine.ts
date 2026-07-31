/**
 * VIZ Studio - Audio Engine (Web Audio API)
 * Handles audio decoding, frequency analysis, band energy calculation, beat detection, and BPM calculation.
 */

import { AudioBands, FFTSize } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  private buffer: AudioBuffer | null = null;
  private isPlaying: boolean = false;
  private startTime: number = 0; // audio context time when playback started
  private pauseOffset: number = 0; // accumulated playback offset in seconds

  private fftSize: FFTSize = 2048;
  private frequencyData: Uint8Array = new Uint8Array(1024);
  private timeDomainData: Uint8Array = new Uint8Array(1024);

  // Peak and smoothing state
  private peakValue: number = 0;
  private smoothedBass: number = 0;
  private smoothedMid: number = 0;
  private smoothedTreble: number = 0;

  // Listeners
  private onEndedCallback?: () => void;

  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    // Lazy AudioContext initialization
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = this.fftSize;
      this.analyserNode.smoothingTimeConstant = 0.8;

      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.analyserNode.connect(this.gainNode);

      this.mediaStreamDestination = this.ctx.createMediaStreamDestination();
      this.gainNode.connect(this.mediaStreamDestination);

      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getAudioBuffer(): AudioBuffer | null {
    return this.buffer;
  }

  public getAudioStream(): MediaStream | null {
    return this.mediaStreamDestination ? this.mediaStreamDestination.stream : null;
  }

  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    const ctx = this.initContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.buffer = audioBuffer;
    this.pauseOffset = 0;
    return audioBuffer;
  }

  public async loadAudioFromUrl(url: string): Promise<AudioBuffer> {
    const ctx = this.initContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.buffer = audioBuffer;
    this.pauseOffset = 0;
    return audioBuffer;
  }

  public setFFTSize(size: FFTSize): void {
    this.fftSize = size;
    if (this.analyserNode) {
      this.analyserNode.fftSize = size;
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount);
    }
  }

  public setVolume(val: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, val));
    }
  }

  public play(offsetSeconds: number = this.pauseOffset, loop: boolean = false): void {
    if (!this.buffer) return;
    const ctx = this.initContext();

    if (this.isPlaying) {
      this.stop();
    }

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.buffer;
    this.sourceNode.loop = loop;
    this.sourceNode.connect(this.analyserNode!);

    this.startTime = ctx.currentTime - offsetSeconds;
    this.pauseOffset = offsetSeconds;

    this.sourceNode.start(0, offsetSeconds);
    this.isPlaying = true;

    this.sourceNode.onended = () => {
      if (this.isPlaying && !loop && this.getCurrentTime() >= this.getDuration()) {
        this.isPlaying = false;
        this.pauseOffset = 0;
        if (this.onEndedCallback) this.onEndedCallback();
      }
    };
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime();
    this.stop();
    this.isPlaying = false;
  }

  public stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  public seek(seconds: number): void {
    const wasPlaying = this.isPlaying;
    this.pauseOffset = Math.max(0, Math.min(seconds, this.getDuration()));
    if (wasPlaying) {
      this.play(this.pauseOffset);
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) {
      return this.pauseOffset;
    }
    const elapsed = this.ctx.currentTime - this.startTime;
    return Math.min(elapsed, this.getDuration());
  }

  public getDuration(): number {
    return this.buffer ? this.buffer.duration : 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setOnEnded(cb: () => void): void {
    this.onEndedCallback = cb;
  }

  // -------------------------------------------------------------------------
  // Realtime Analysis Methods
  // -------------------------------------------------------------------------

  public getFrequencyData(): Uint8Array {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  public getTimeDomainData(): Uint8Array {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(this.timeDomainData);
    }
    return this.timeDomainData;
  }

  public getAudioBands(): AudioBands {
    const freqs = this.getFrequencyData();
    if (freqs.length === 0) {
      return { bass: 0, mid: 0, treble: 0, peak: 0, amplitude: 0 };
    }

    const nyquist = (this.ctx?.sampleRate || 44100) / 2;
    const binHz = nyquist / freqs.length;

    let bassSum = 0, bassCount = 0;
    let midSum = 0, midCount = 0;
    let trebleSum = 0, trebleCount = 0;
    let totalSum = 0;
    let peak = 0;

    for (let i = 0; i < freqs.length; i++) {
      const hz = i * binHz;
      const val = freqs[i] / 255;
      totalSum += val;
      if (val > peak) peak = val;

      if (hz >= 20 && hz < 250) {
        bassSum += val;
        bassCount++;
      } else if (hz >= 250 && hz < 4000) {
        midSum += val;
        midCount++;
      } else if (hz >= 4000) {
        trebleSum += val;
        trebleCount++;
      }
    }

    const rawBass = bassCount > 0 ? bassSum / bassCount : 0;
    const rawMid = midCount > 0 ? midSum / midCount : 0;
    const rawTreble = trebleCount > 0 ? trebleSum / trebleCount : 0;
    const amplitude = freqs.length > 0 ? totalSum / freqs.length : 0;

    // Smooth values for visual aesthetics
    this.smoothedBass = this.smoothedBass * 0.7 + rawBass * 0.3;
    this.smoothedMid = this.smoothedMid * 0.7 + rawMid * 0.3;
    this.smoothedTreble = this.smoothedTreble * 0.7 + rawTreble * 0.3;
    this.peakValue = Math.max(peak, this.peakValue * 0.92);

    return {
      bass: this.smoothedBass,
      mid: this.smoothedMid,
      treble: this.smoothedTreble,
      peak: this.peakValue,
      amplitude,
    };
  }

  // -------------------------------------------------------------------------
  // Offline Analysis: Beat & BPM Detection
  // -------------------------------------------------------------------------

  public detectBeatsAndBPM(): { bpm: number; beatTimes: number[] } {
    if (!this.buffer) {
      return { bpm: 120, beatTimes: [] };
    }

    const channelData = this.buffer.getChannelData(0);
    const sampleRate = this.buffer.sampleRate;
    const duration = this.buffer.duration;

    // Energy flux window (50ms chunks)
    const chunkSize = Math.floor(sampleRate * 0.05);
    const numChunks = Math.floor(channelData.length / chunkSize);
    const energies: number[] = [];

    for (let i = 0; i < numChunks; i++) {
      let sum = 0;
      const start = i * chunkSize;
      for (let j = 0; j < chunkSize; j++) {
        sum += channelData[start + j] * channelData[start + j];
      }
      energies.push(Math.sqrt(sum / chunkSize));
    }

    // Threshold detection for peaks
    const beatTimes: number[] = [];
    const thresholdWindow = 20; // 1 second window
    for (let i = thresholdWindow; i < energies.length - thresholdWindow; i++) {
      let localSum = 0;
      for (let j = i - thresholdWindow; j <= i + thresholdWindow; j++) {
        localSum += energies[j];
      }
      const localAvg = localSum / (thresholdWindow * 2 + 1);

      if (energies[i] > localAvg * 1.35 && energies[i] > 0.02) {
        const time = (i * chunkSize) / sampleRate;
        // Avoid duplicate beats within 200ms
        if (beatTimes.length === 0 || time - beatTimes[beatTimes.length - 1] > 0.22) {
          beatTimes.push(time);
        }
      }
    }

    // BPM Calculation from intervals
    let bpm = 120;
    if (beatTimes.length > 5) {
      const intervals: number[] = [];
      for (let i = 1; i < beatTimes.length; i++) {
        intervals.push(beatTimes[i] - beatTimes[i - 1]);
      }
      // Average interval
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        bpm = Math.round(60 / avgInterval);
        // Clamp to realistic song BPM
        while (bpm < 70) bpm *= 2;
        while (bpm > 180) bpm /= 2;
        bpm = Math.round(bpm);
      }
    }

    return { bpm, beatTimes };
  }

  private offlineSmoothedBass: number = 0;
  private offlineSmoothedMid: number = 0;
  private offlineSmoothedTreble: number = 0;
  private offlinePeak: number = 0;

  public getOfflineAudioBands(timeSec: number): AudioBands {
    if (!this.buffer) return { bass: 0, mid: 0, treble: 0, peak: 0, amplitude: 0 };
    
    // If time resets or goes backward, reset smoothing
    if (timeSec === 0 || timeSec < (this as any).lastOfflineTimeSec) {
      this.offlineSmoothedBass = 0;
      this.offlineSmoothedMid = 0;
      this.offlineSmoothedTreble = 0;
      this.offlinePeak = 0;
    }
    (this as any).lastOfflineTimeSec = timeSec;

    const sampleRate = this.buffer.sampleRate;
    const channelData = this.buffer.getChannelData(0);
    const startSample = Math.floor(timeSec * sampleRate);
    
    if (startSample < 0 || startSample >= channelData.length) {
      return { bass: 0, mid: 0, treble: 0, peak: 0, amplitude: 0 };
    }
    
    // Read a small window (e.g. 1024 samples)
    const windowSize = 2048;
    let sum = 0;
    let peak = 0;
    const maxIdx = Math.min(startSample + windowSize, channelData.length);
    for (let i = startSample; i < maxIdx; i++) {
      const val = Math.abs(channelData[i]);
      sum += val;
      if (val > peak) peak = val;
    }
    
    const amplitude = sum / windowSize;
    
    const rawBass = amplitude * 1.5;
    const rawMid = amplitude * 1.2;
    const rawTreble = amplitude * 0.8;

    this.offlineSmoothedBass = this.offlineSmoothedBass * 0.6 + rawBass * 0.4;
    this.offlineSmoothedMid = this.offlineSmoothedMid * 0.6 + rawMid * 0.4;
    this.offlineSmoothedTreble = this.offlineSmoothedTreble * 0.6 + rawTreble * 0.4;
    this.offlinePeak = Math.max(peak, this.offlinePeak * 0.85);

    return {
      bass: this.offlineSmoothedBass,
      mid: this.offlineSmoothedMid,
      treble: this.offlineSmoothedTreble,
      peak: this.offlinePeak,
      amplitude: amplitude,
    };
  }
  
  public getOfflineFrequencyData(timeSec: number, size: number = 1024): Uint8Array {
    const data = new Uint8Array(size);
    if (!this.buffer) return data;
    const sampleRate = this.buffer.sampleRate;
    const channelData = this.buffer.getChannelData(0);
    const startSample = Math.floor(timeSec * sampleRate);
    
    // Fill with simulated FFT based on actual waveform amplitude
    const windowSize = 2048;
    const maxIdx = Math.min(startSample + windowSize, channelData.length);
    let peak = 0;
    for (let i = startSample; i < maxIdx; i++) {
      const val = Math.abs(channelData[i]);
      if (val > peak) peak = val;
    }
    
    // Simulate frequency bins smoothly to avoid rapid flickering
    for (let i = 0; i < size; i++) {
      const curve = Math.max(0, 1 - (i / size));
      // Slower, smooth wave for visual dynamics, no random noise
      const wave = Math.sin(timeSec * 4 + i * 0.05);
      data[i] = Math.min(255, (peak * 255 * curve) * (0.8 + wave * 0.2));
    }
    return data;
  }

  // -------------------------------------------------------------------------
  // Waveform Peak Points for UI rendering
  // -------------------------------------------------------------------------

  public getWaveformPeaks(numPeaks: number = 200): number[] {
    if (!this.buffer) return new Array(numPeaks).fill(0);
    const channelData = this.buffer.getChannelData(0);
    const samplesPerPeak = Math.floor(channelData.length / numPeaks);
    const peaks: number[] = [];

    for (let i = 0; i < numPeaks; i++) {
      const start = i * samplesPerPeak;
      let max = 0;
      for (let j = 0; j < samplesPerPeak; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(max);
    }
    return peaks;
  }
}

// Global Singleton for easy cross-component audio access
export const globalAudioEngine = new AudioEngine();
