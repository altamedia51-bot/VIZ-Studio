/**
 * VIZ Studio - useAudio Hook
 * Interfaces with globalAudioEngine for playback, file loading, spectrum data, and beat detection.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { globalAudioEngine } from '../audio/AudioEngine';
import { AudioTrackInfo, AudioBands, FFTSize } from '../types';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [trackInfo, setTrackInfo] = useState<AudioTrackInfo | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [audioBands, setAudioBands] = useState<AudioBands>({ bass: 0, mid: 0, treble: 0, peak: 0, amplitude: 0 });

  const animFrameRef = useRef<number | null>(null);

  // Sync state loop when playing
  useEffect(() => {
    const loop = () => {
      if (globalAudioEngine.getIsPlaying()) {
        setCurrentTime(globalAudioEngine.getCurrentTime());
        setAudioBands(globalAudioEngine.getAudioBands());
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Load Audio File
  const loadAudioFile = useCallback(async (file: File) => {
    const buffer = await globalAudioEngine.loadAudioFile(file);
    const dur = buffer.duration;

    const info: AudioTrackInfo = {
      id: 'audio-' + Date.now(),
      name: file.name,
      file,
      duration: dur,
      volume: 1.0,
      trimStart: 0,
      trimEnd: dur,
      fadeIn: 0,
      fadeOut: 0,
      loop: false,
      muted: false,
      solo: false,
      playbackSpeed: 1.0,
    };

    setTrackInfo(info);
    setDuration(dur);
    setCurrentTime(0);
    setWaveformPeaks(globalAudioEngine.getWaveformPeaks(200));

    // Auto detect beats
    const beatResult = globalAudioEngine.detectBeatsAndBPM();
    info.bpm = beatResult.bpm;
    info.beatTimes = beatResult.beatTimes;
    setTrackInfo({ ...info });

    return info;
  }, []);

  const play = useCallback((offset?: number) => {
    globalAudioEngine.play(offset ?? currentTime, trackInfo?.loop ?? false);
    setIsPlaying(true);
  }, [currentTime, trackInfo?.loop]);

  const pause = useCallback(() => {
    globalAudioEngine.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const seek = useCallback((timeSec: number) => {
    globalAudioEngine.seek(timeSec);
    setCurrentTime(timeSec);
  }, []);

  const changeVolume = useCallback((val: number) => {
    setVolume(val);
    globalAudioEngine.setVolume(val);
  }, []);

  const setFFTSize = useCallback((size: FFTSize) => {
    globalAudioEngine.setFFTSize(size);
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    trackInfo,
    waveformPeaks,
    audioBands,
    loadAudioFile,
    play,
    pause,
    togglePlay,
    seek,
    changeVolume,
    setFFTSize,
  };
}
