/**
 * VIZ Studio - AI Tools & Smart Automation Panel
 */

import React, { useState } from 'react';
import { Sparkles, Palette, MessageSquare, Zap, Loader2 } from 'lucide-react';

interface AiToolsPanelProps {
  onApplyPalette: (colors: string[]) => void;
  onApplySubtitles: (subtitles: { start: number; end: number; text: string }[]) => void;
  duration: number;
}

export const AiToolsPanel: React.FC<AiToolsPanelProps> = ({
  onApplyPalette,
  onApplySubtitles,
  duration,
}) => {
  const [genre, setGenre] = useState('Cyberpunk EDM');
  const [style, setStyle] = useState('Dark Neon');
  const [loadingPalette, setLoadingPalette] = useState(false);
  const [generatedColors, setGeneratedColors] = useState<string[]>([]);

  const [lyricText, setLyricText] = useState('');
  const [loadingSubtitles, setLoadingSubtitles] = useState(false);

  // Generate Color Palette via Gemini Server API
  const generatePalette = async () => {
    setLoadingPalette(true);
    try {
      const res = await fetch('/api/ai/palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, style }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.colors)) {
        setGeneratedColors(data.colors);
      } else {
        alert('Gagal menghasilkan palet AI: ' + (data.error || 'Respon tidak valid'));
      }
    } catch (e: any) {
      alert('Gagal memanggil AI Palette: ' + e.message);
    } finally {
      setLoadingPalette(false);
    }
  };

  // Generate Subtitles / Lyrics Sync via Gemini Server API
  const generateSubtitles = async () => {
    if (!lyricText.trim()) return alert('Masukkan lirik lagu terlebih dahulu!');
    setLoadingSubtitles(true);
    try {
      const res = await fetch('/api/ai/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lyricText, durationSeconds: Math.ceil(duration || 60) }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.subtitles)) {
        onApplySubtitles(data.subtitles);
        alert(`Berhasil sinkronisasi ${data.subtitles.length} baris subtitel!`);
      } else {
        alert('Gagal membuat subtitel AI: ' + (data.error || 'Respon tidak valid'));
      }
    } catch (e: any) {
      alert('Gagal memanggil AI Subtitle: ' + e.message);
    } finally {
      setLoadingSubtitles(false);
    }
  };

  return (
    <div className="p-4 space-y-4 text-xs text-gray-300">
      {/* 1. AI Color Palette Generator */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3.5 space-y-3">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Color Palette Generator</span>
        </div>
        <p className="text-[#737373] text-[10px]">
          Biarkan Gemini AI menganalisis genre & suasana lagu untuk menghasilkan palet warna harmonis.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Genre (e.g. Synthwave)"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="p-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-purple-500 text-xs"
          />
          <input
            type="text"
            placeholder="Gaya (e.g. Neon Cyber)"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="p-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-purple-500 text-xs"
          />
        </div>

        <button
          onClick={generatePalette}
          disabled={loadingPalette}
          className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
        >
          {loadingPalette ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>Buat Palet AI</span>
        </button>

        {generatedColors.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#2a2a2a]">
            <div className="flex gap-1.5 h-7 rounded overflow-hidden border border-[#2a2a2a]">
              {generatedColors.map((hex, i) => (
                <div key={i} className="flex-1 h-full" style={{ backgroundColor: hex }} title={hex} />
              ))}
            </div>
            <button
              onClick={() => onApplyPalette(generatedColors)}
              className="w-full py-1.5 rounded bg-[#2a2a2a] text-purple-300 hover:bg-[#333] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Terapkan Palet ke Visualizer
            </button>
          </div>
        )}
      </div>

      {/* 2. AI Subtitle Generator & Lyric Sync */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3.5 space-y-3">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>AI Subtitle & Lyric Sync</span>
        </div>
        <p className="text-[#737373] text-[10px]">
          Tempel lirik lagu, AI akan membagi dan menyinkronkan timestamp ke timeline.
        </p>

        <textarea
          rows={3}
          placeholder="Tempel teks lirik lagu di sini..."
          value={lyricText}
          onChange={(e) => setLyricText(e.target.value)}
          className="w-full p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 resize-none text-xs font-medium"
        />

        <button
          onClick={generateSubtitles}
          disabled={loadingSubtitles}
          className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
        >
          {loadingSubtitles ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          <span>Sinkronkan Lirik Otomatis</span>
        </button>
      </div>
    </div>
  );
};
