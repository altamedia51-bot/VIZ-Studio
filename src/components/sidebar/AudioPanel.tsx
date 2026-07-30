/**
 * VIZ Studio - Audio Panel Component
 */

import React, { useRef } from 'react';
import { Music, Upload, Volume2, VolumeX, Repeat, Trash2, Zap, Radio, Sliders } from 'lucide-react';
import { AudioTrackInfo } from '../../types';

interface AudioPanelProps {
  trackInfo: AudioTrackInfo | null;
  volume: number;
  onVolumeChange: (v: number) => void;
  onAudioFileSelected: (file: File) => void;
  waveformPeaks: number[];
  onRemoveAudio: () => void;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({
  trackInfo,
  volume,
  onVolumeChange,
  onAudioFileSelected,
  waveformPeaks,
  onRemoveAudio,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-4 space-y-4 text-xs text-gray-300">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAudioFileSelected(file);
        }}
      />

      {/* Audio Track Header / Upload Box */}
      {!trackInfo ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-[#2a2a2a] hover:border-blue-500 rounded p-6 text-center cursor-pointer transition-colors bg-[#1a1a1a] hover:bg-[#222222] group"
        >
          <div className="w-10 h-10 rounded bg-[#2a2a2a] text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform border border-[#333]">
            <Upload className="w-5 h-5" />
          </div>
          <p className="font-bold text-white mb-1 uppercase tracking-wider text-xs">Unggah File Audio / Video</p>
          <p className="text-[#737373] text-[10px]">Mendukung MP3, WAV, AAC, FLAC, OGG, MP4, WEBM</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3.5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Music className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="font-bold text-white truncate text-xs">{trackInfo.name}</p>
                <p className="text-gray-400 text-[10px] font-mono">
                  Durasi: {Math.floor(trackInfo.duration / 60)}:
                  {String(Math.floor(trackInfo.duration % 60)).padStart(2, '0')} | BPM: {trackInfo.bpm || '--'}
                </p>
              </div>
            </div>

            <button
              onClick={onRemoveAudio}
              className="p-1.5 rounded bg-[#2a2a2a] hover:bg-rose-900/40 text-gray-400 hover:text-rose-400 border border-[#333] transition-colors"
              title="Hapus Audio"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Waveform Preview */}
          <div className="bg-[#0a0a0a] p-2 rounded border border-[#2a2a2a]">
            <div className="flex items-end gap-0.5 h-10 w-full overflow-hidden">
              {waveformPeaks.map((peak, i) => (
                <div
                  key={i}
                  className="bg-blue-500 rounded-sm transition-all"
                  style={{
                    width: `${100 / waveformPeaks.length}%`,
                    height: `${Math.max(10, peak * 100)}%`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Controls: Volume */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-gray-400 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Volume Track</span>
              </div>
              <span className="font-mono text-gray-200">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Beat Detection Info */}
          {trackInfo.bpm && (
            <div className="p-2 rounded bg-blue-950/30 border border-blue-800/40 flex items-center gap-2 text-blue-300 text-[10px]">
              <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Deteksi Beat otomatis: {trackInfo.beatTimes?.length || 0} beat ({trackInfo.bpm} BPM)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
