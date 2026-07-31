/**
 * VIZ Studio - Export Video & Media Modal Dialog
 */

import React, { useState } from 'react';
import { Download, X, Pause, Play, AlertCircle, CheckCircle2, Loader2, Film, FileCode } from 'lucide-react';
import { ExportSettings, ExportProgress, ExportFormat, ExportQuality, ResolutionPreset } from '../../types';
import { RESOLUTION_PRESETS } from '../../hooks/useProject';
import { EncoderEngine } from '../../export/EncoderEngine';
import { globalAudioEngine } from '../../audio/AudioEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: HTMLCanvasElement | null;
  duration: number;
  renderFrameAtTime: (timeSec: number) => Promise<void> | void;
}

const encoderEngine = new EncoderEngine();

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvas,
  duration,
  renderFrameAtTime,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'mp4',
    resolutionPreset: '1080p',
    width: 1920,
    height: 1080,
    fps: 60,
    bitrateKbps: 8000,
    quality: 'high',
  });

  const [progress, setProgress] = useState<ExportProgress>({
    status: 'idle',
    currentFrame: 0,
    totalFrames: 0,
    progressPercent: 0,
    elapsedSeconds: 0,
    estimatedSecondsLeft: 0,
    activeCodec: '',
    logs: [],
  });

  if (!isOpen) return null;

  const handleStartExport = async () => {
    if (!canvas) return alert('Canvas preview belum siap.');

    setProgress({
      status: 'preparing',
      currentFrame: 0,
      totalFrames: Math.ceil(duration * settings.fps),
      progressPercent: 0,
      elapsedSeconds: 0,
      estimatedSecondsLeft: 0,
      activeCodec: 'Mengecek codec browser...',
      logs: ['Memulai proses ekspor media...'],
    });

    try {
      const audioBuffer = globalAudioEngine.getAudioBuffer();

      const blob = await encoderEngine.startExport(
        canvas,
        renderFrameAtTime,
        duration,
        settings,
        (p) => setProgress({ ...p }),
        audioBuffer
      );

      setProgress((prev) => ({
        ...prev,
        status: 'completed',
        outputBlob: blob,
      }));
    } catch (err: any) {
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        logs: [...prev.logs, `ERROR: ${err.message}`],
      }));
    }
  };

  const handleDownload = () => {
    if (!progress.outputBlob) return;
    const url = URL.createObjectURL(progress.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    
    let ext = settings.format === 'png_sequence' ? 'zip' : settings.format;
    if (progress.outputBlob.type.includes('webm')) {
      ext = 'webm';
    } else if (progress.outputBlob.type.includes('mp4')) {
      ext = 'mp4';
    }
    
    a.download = `viz_studio_export_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none text-xs text-gray-200">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg w-full max-w-xl p-6 shadow-2xl space-y-5 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Export Video & Media</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Controls if Idle */}
        {progress.status === 'idle' && (
          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-1.5">
              <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Format Output</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'mp4', label: 'MP4 Video' },
                  { id: 'webm', label: 'WebM Video' },
                  { id: 'gif', label: 'Animated GIF' },
                  { id: 'png_sequence', label: 'PNG Zip' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSettings({ ...settings, format: fmt.id as ExportFormat })}
                    className={`p-2 rounded border font-bold text-xs uppercase tracking-wider text-center transition-colors ${
                      settings.format === fmt.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow'
                        : 'bg-[#0a0a0a] border-[#2a2a2a] text-gray-400 hover:bg-[#1f1f1f] hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution & FPS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Resolusi Canvas</label>
                <select
                  value={settings.resolutionPreset}
                  onChange={(e) => {
                    const preset = e.target.value as ResolutionPreset;
                    const cfg = RESOLUTION_PRESETS[preset];
                    setSettings({
                      ...settings,
                      resolutionPreset: preset,
                      width: cfg.width,
                      height: cfg.height,
                    });
                  }}
                  className="w-full p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs"
                >
                  {Object.entries(RESOLUTION_PRESETS).map(([k, cfg]) => (
                    <option key={k} value={k} className="bg-[#141414]">
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Framerate (FPS)</label>
                <select
                  value={settings.fps}
                  onChange={(e) => setSettings({ ...settings, fps: parseInt(e.target.value) })}
                  className="w-full p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs"
                >
                  <option value={24} className="bg-[#141414]">24 FPS (Cinematic)</option>
                  <option value={30} className="bg-[#141414]">30 FPS (Standard)</option>
                  <option value={60} className="bg-[#141414]">60 FPS (Smooth)</option>
                  <option value={120} className="bg-[#141414]">120 FPS (High Speed)</option>
                </select>
              </div>
            </div>

            {/* Quality Preset */}
            <div className="space-y-1.5">
              <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Kualitas & Bitrate Video</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'low', label: 'Low (4Mbps)', bitrate: 4000 },
                  { id: 'medium', label: 'Med (8Mbps)', bitrate: 8000 },
                  { id: 'high', label: 'High (16Mbps)', bitrate: 16000 },
                  { id: 'ultra', label: 'Ultra (32Mbps)', bitrate: 32000 },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSettings({ ...settings, quality: q.id as ExportQuality, bitrateKbps: q.bitrate })}
                    className={`p-2 rounded border font-bold text-xs uppercase tracking-wider text-center transition-colors ${
                      settings.quality === q.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow'
                        : 'bg-[#0a0a0a] border-[#2a2a2a] text-gray-400 hover:bg-[#1f1f1f] hover:text-white'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartExport}
              className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Mulai Render Video</span>
            </button>
          </div>
        )}

        {/* Progress Bar & Status View */}
        {(progress.status === 'rendering' || progress.status === 'preparing') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-gray-300 text-xs">
              <span>Status: {progress.activeCodec}</span>
              <span className="font-bold text-blue-400">{progress.progressPercent}%</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-2.5 bg-[#0a0a0a] rounded border border-[#2a2a2a] overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-150"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-gray-400 font-mono text-xs bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
              <div>Frame: {progress.currentFrame} / {progress.totalFrames}</div>
              <div>Estimasi Sisa: {progress.estimatedSecondsLeft}s</div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => encoderEngine.cancelExport()}
                className="px-4 py-1.5 rounded bg-[#2a2a2a] text-rose-400 hover:bg-rose-950/40 font-bold uppercase text-[10px] tracking-wider transition-colors"
              >
                Batalkan Ekspor
              </button>
            </div>
          </div>
        )}

        {/* Completed View */}
        {progress.status === 'completed' && (
          <div className="text-center p-6 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-white text-base">Ekspor Selesai dengan Sukses!</h3>
            <p className="text-gray-400 text-xs">File video Anda telah berhasil dirender dan siap diunduh.</p>

            <button
              onClick={handleDownload}
              className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download File Video Hasil Render</span>
            </button>
          </div>
        )}

        {/* Error View */}
        {progress.status === 'error' && (
          <div className="p-4 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 space-y-3">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Ekspor Gagal</span>
            </div>
            <p className="text-xs text-rose-200">
              {progress.logs[progress.logs.length - 1] || 'Browser Anda belum mendukung konfigurasi ekspor ini.'}
            </p>
            <button
              onClick={() => setProgress({ ...progress, status: 'idle' })}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase text-[10px] tracking-wider transition-colors"
            >
              Coba Konfigurasi Lain
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
