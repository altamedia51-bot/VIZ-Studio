/**
 * VIZ Studio - Bottom Status Bar
 */

import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Zap, CheckCircle2 } from 'lucide-react';
import { AudioBands } from '../../types';

interface StatusBarProps {
  fps: number;
  audioBands: AudioBands;
  lastAutoSaveTime: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ fps, audioBands, lastAutoSaveTime }) => {
  const [memoryMB, setMemoryMB] = useState<number>(0);

  useEffect(() => {
    const checkMemory = () => {
      if ((performance as any).memory) {
        const used = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
        setMemoryMB(Math.round(used));
      } else {
        setMemoryMB(128);
      }
    };
    checkMemory();
    const interval = setInterval(checkMemory, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-6 bg-[#0a0a0a] border-t border-[#2a2a2a] px-4 flex items-center justify-between text-[10px] font-mono text-gray-400 select-none shrink-0">
      {/* Left: Auto-save state */}
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>Tersimpan otomatis {lastAutoSaveTime ? `pada ${lastAutoSaveTime}` : 'lokal'}</span>
      </div>

      {/* Center: Audio VU Meter */}
      <div className="flex items-center gap-2">
        <span className="text-[#737373]">L</span>
        <div className="w-20 h-1.5 rounded bg-[#141414] overflow-hidden flex border border-[#2a2a2a]">
          <div
            className="h-full bg-emerald-500 transition-all duration-75"
            style={{ width: `${Math.min(100, audioBands.amplitude * 200)}%` }}
          />
        </div>
        <span className="text-[#737373]">R</span>
        <div className="w-20 h-1.5 rounded bg-[#141414] overflow-hidden flex border border-[#2a2a2a]">
          <div
            className="h-full bg-emerald-500 transition-all duration-75"
            style={{ width: `${Math.min(100, audioBands.peak * 100)}%` }}
          />
        </div>
      </div>

      {/* Right: FPS & Memory Monitor */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-blue-400" />
          <span>{fps} FPS</span>
        </div>
        <div className="flex items-center gap-1">
          <HardDrive className="w-3 h-3 text-purple-400" />
          <span>RAM: {memoryMB} MB</span>
        </div>
      </div>
    </footer>
  );
};
