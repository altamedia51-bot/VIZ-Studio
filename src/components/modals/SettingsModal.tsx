/**
 * VIZ Studio - Settings & Keyboard Shortcuts Reference Modal
 */

import React from 'react';
import { Settings, Keyboard, X, Radio } from 'lucide-react';
import { FFTSize } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fftSize: FFTSize;
  onChangeFFTSize: (size: FFTSize) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  fftSize,
  onChangeFFTSize,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + S', desc: 'Simpan Proyek' },
    { key: 'Ctrl + Z', desc: 'Undo (Batalkan Perubahan)' },
    { key: 'Ctrl + Y', desc: 'Redo (Ulangi Perubahan)' },
    { key: 'Ctrl + D', desc: 'Duplikat Layer Terpilih' },
    { key: 'Ctrl + C / V', desc: 'Copy / Paste Layer' },
    { key: 'Delete', desc: 'Hapus Layer Terpilih' },
    { key: 'Space', desc: 'Play / Pause Preview' },
    { key: 'F11', desc: 'Toggle Fullscreen' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none text-xs text-gray-200">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg w-full max-w-md p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Pengaturan & Shortcut Keyboard</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FFT Size Setting */}
        <div className="space-y-1.5 bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a]">
          <label className="text-gray-200 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Resolusi Analis Audio (FFT Size)</span>
          </label>
          <select
            value={fftSize}
            onChange={(e) => onChangeFFTSize(parseInt(e.target.value) as FFTSize)}
            className="w-full p-2 bg-[#141414] border border-[#2a2a2a] rounded text-gray-200 focus:outline-none focus:border-blue-500 font-mono text-xs cursor-pointer"
          >
            {[256, 512, 1024, 2048, 4096, 8192].map((sz) => (
              <option key={sz} value={sz} className="bg-[#141414]">
                {sz} Bins (Resolusi {sz >= 2048 ? 'Tinggi' : 'Standar'})
              </option>
            ))}
          </select>
        </div>

        {/* Keyboard Shortcuts List */}
        <div className="space-y-2">
          <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-purple-400" />
            <span>Shortcut Keyboard</span>
          </label>

          <div className="bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a] space-y-1.5 font-mono text-xs">
            {shortcuts.map((sc) => (
              <div key={sc.key} className="flex justify-between items-center py-1 border-b border-[#1a1a1a] last:border-none">
                <span className="bg-[#1a1a1a] px-2 py-0.5 rounded text-blue-400 border border-[#2a2a2a] font-bold text-[11px]">{sc.key}</span>
                <span className="text-gray-400 font-sans text-xs">{sc.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
