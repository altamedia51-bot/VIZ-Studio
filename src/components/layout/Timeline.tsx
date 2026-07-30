/**
 * VIZ Studio - Professional Multi-Track Timeline Editor
 */

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Scissors,
  Bookmark,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Trash2,
} from 'lucide-react';
import { ProjectData, TimelineTrack, TimelineClip, TimelineMarker } from '../../types';

interface TimelineProps {
  project: ProjectData;
  currentTime: number;
  duration: number;
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onSeek: (timeSec: number) => void;
  onUpdateProject: (p: ProjectData) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentTime,
  duration,
  selectedLayerId,
  onSelectLayer,
  onSeek,
  onUpdateProject,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x to 10x
  const timelineRulerRef = useRef<HTMLDivElement>(null);

  const pixelsPerSecond = 20 * zoomLevel;
  const totalTimelineWidth = Math.max(800, duration * pixelsPerSecond);

  // Handle Timeline Ruler Click to seek
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRulerRef.current) return;
    const rect = timelineRulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(clickX / pixelsPerSecond, duration));
    onSeek(newTime);
  };

  // Add Marker at Playhead
  const handleAddMarker = () => {
    const newMarker: TimelineMarker = {
      id: 'marker-' + Date.now(),
      time: currentTime,
      label: `Marker ${project.markers.length + 1}`,
      color: '#ec4899',
    };
    onUpdateProject({
      ...project,
      markers: [...project.markers, newMarker],
    });
  };

  // Split Clip at Playhead
  const handleSplitClipAtPlayhead = () => {
    const targetClip = project.clips.find(
      (c) => c.layerId === selectedLayerId && currentTime > c.startTime && currentTime < c.startTime + c.duration
    );

    if (!targetClip) {
      alert('Pilih clip di timeline untuk melakukan split pada posisi playhead.');
      return;
    }

    const firstDuration = currentTime - targetClip.startTime;
    const secondDuration = targetClip.duration - firstDuration;

    const clip1: TimelineClip = { ...targetClip, duration: firstDuration };
    const clip2: TimelineClip = {
      ...targetClip,
      id: 'clip-' + Date.now(),
      startTime: currentTime,
      duration: secondDuration,
      mediaOffset: targetClip.mediaOffset + firstDuration,
      name: `${targetClip.name} (Part 2)`,
    };

    onUpdateProject({
      ...project,
      clips: project.clips.map((c) => (c.id === targetClip.id ? clip1 : c)).concat(clip2),
    });
  };

  return (
    <div className="h-60 bg-[#141414] border-t border-[#2a2a2a] flex flex-col select-none text-xs text-gray-300 shrink-0">
      {/* Timeline Controls Header */}
      <div className="h-8 bg-[#0f0f0f] border-b border-[#2a2a2a] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSplitClipAtPlayhead}
            className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 border border-[#2a2a2a] hover:border-blue-500 flex items-center gap-1.5 transition-colors text-[10px] uppercase font-bold tracking-wider"
            title="Bagi (Split) Clip di Playhead"
          >
            <Scissors className="w-3.5 h-3.5 text-blue-400" />
            <span>Split Clip</span>
          </button>

          <button
            onClick={handleAddMarker}
            className="px-2 py-0.5 rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 border border-[#2a2a2a] hover:border-blue-500 flex items-center gap-1.5 transition-colors text-[10px] uppercase font-bold tracking-wider"
            title="Tambah Marker Penanda"
          >
            <Bookmark className="w-3.5 h-3.5 text-pink-400" />
            <span>Tambah Marker</span>
          </button>
        </div>

        {/* Timeline Zoom Slider */}
        <div className="flex items-center gap-2 text-gray-400 text-[10px]">
          <ZoomOut className="w-3.5 h-3.5" />
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-24 accent-blue-500 bg-[#2a2a2a] h-1.5 rounded appearance-none cursor-pointer"
          />
          <ZoomIn className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Main Multi-Track Canvas Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers Column */}
        <div className="w-48 bg-[#0f0f0f] border-r border-[#2a2a2a] shrink-0 overflow-y-auto custom-scrollbar">
          {/* Header Spacer */}
          <div className="h-6 border-b border-[#2a2a2a] px-3 flex items-center text-[9px] font-mono text-[#737373] uppercase tracking-wider font-bold">
            TRACK MANAJER
          </div>

          {/* Track List */}
          {project.tracks.map((track) => (
            <div
              key={track.id}
              className="h-11 border-b border-[#2a2a2a] px-3 flex items-center justify-between bg-[#141414] hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="truncate font-bold text-gray-200 text-xs">{track.name}</div>
              <div className="flex items-center gap-1 text-gray-500">
                <button
                  onClick={() =>
                    onUpdateProject({
                      ...project,
                      tracks: project.tracks.map((t) => (t.id === track.id ? { ...t, muted: !t.muted } : t)),
                    })
                  }
                  className="p-1 hover:text-white"
                >
                  {track.muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Tracks & Clips Scrollable Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar bg-[#0a0a0a]">
          {/* Timeline Time Ruler */}
          <div
            ref={timelineRulerRef}
            onClick={handleRulerClick}
            className="h-6 border-b border-[#2a2a2a] bg-[#0f0f0f] relative cursor-pointer font-mono text-[9px] text-[#737373] select-none"
            style={{ width: `${totalTimelineWidth}px` }}
          >
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, sec) => (
              <div
                key={sec}
                className="absolute top-0 bottom-0 border-l border-[#2a2a2a] pl-1 pt-0.5"
                style={{ left: `${sec * pixelsPerSecond}px` }}
              >
                {sec % 5 === 0 ? `${sec}s` : ''}
              </div>
            ))}

            {/* Markers */}
            {project.markers.map((m) => (
              <div
                key={m.id}
                className="absolute top-0 bottom-0 border-l-2 border-pink-500 z-10 font-bold text-[9px] text-pink-400 pl-0.5"
                style={{ left: `${m.time * pixelsPerSecond}px` }}
                title={m.label}
              >
                ▼ {m.label}
              </div>
            ))}

            {/* Playhead Indicator Line */}
            <div
              className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-30 pointer-events-none"
              style={{ left: `${currentTime * pixelsPerSecond}px` }}
            >
              <div className="w-2.5 h-2.5 bg-blue-500 transform -translate-x-1.25 rotate-45 -mt-1 shadow" />
            </div>
          </div>

          {/* Track Clips Rows */}
          <div className="relative" style={{ width: `${totalTimelineWidth}px` }}>
            {project.tracks.map((track) => {
              const trackClips = project.clips.filter((c) => c.trackId === track.id);
              return (
                <div key={track.id} className="h-11 border-b border-[#2a2a2a] relative bg-[#0a0a0a]">
                  {trackClips.map((clip) => {
                    const isSelected = clip.layerId === selectedLayerId;
                    const left = clip.startTime * pixelsPerSecond;
                    const clipWidth = clip.duration * pixelsPerSecond;

                    return (
                      <div
                        key={clip.id}
                        onClick={() => onSelectLayer(clip.layerId)}
                        className={`absolute top-1 bottom-1 rounded border px-2 flex items-center justify-between text-xs font-bold cursor-pointer truncate transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-400 text-white ring-1 ring-blue-400'
                            : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-300 hover:border-blue-500 hover:text-white'
                        }`}
                        style={{ left: `${left}px`, width: `${clipWidth}px` }}
                      >
                        <span className="truncate text-xs">{clip.name}</span>
                        <span className="font-mono text-[9px] text-gray-400 ml-1">
                          {Math.round(clip.duration)}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
