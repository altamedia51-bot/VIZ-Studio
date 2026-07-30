/**
 * VIZ Studio - Project Management Modal
 */

import React, { useState, useEffect } from 'react';
import { FolderOpen, Save, Download, FileCode, Plus, Trash2, X } from 'lucide-react';
import { ProjectData } from '../../types';
import { dbStorage } from '../../storage/IndexedDBStorage';
import { createNewDefaultProject, exportProjectJSON } from '../../storage/ProjectIO';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectData;
  onSelectProject: (p: ProjectData) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onSelectProject,
}) => {
  const [projectList, setProjectList] = useState<ProjectData[]>([]);

  useEffect(() => {
    if (isOpen) {
      dbStorage.getAllProjects().then(setProjectList);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = async () => {
    await dbStorage.saveProject(currentProject);
    const updated = await dbStorage.getAllProjects();
    setProjectList(updated);
    alert(`Proyek "${currentProject.name}" berhasil disimpan ke IndexedDB!`);
  };

  const handleCreateNew = () => {
    const name = prompt('Masukkan nama proyek baru:', 'New Visualizer Project');
    if (name) {
      const newProj = createNewDefaultProject(name);
      onSelectProject(newProj);
      onClose();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus proyek ini dari memori lokal?')) {
      await dbStorage.deleteProject(id);
      const updated = await dbStorage.getAllProjects();
      setProjectList(updated);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none text-xs text-gray-200">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg w-full max-w-lg p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Manajer Proyek VIZ Studio</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleSaveCurrent}
            className="py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Proyek</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="py-2 px-3 rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#2a2a2a] hover:border-blue-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Proyek Baru</span>
          </button>

          <button
            onClick={() => exportProjectJSON(currentProject)}
            className="py-2 px-3 rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#2a2a2a] hover:border-blue-500 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-400" />
            <span>Export JSON</span>
          </button>
        </div>

        {/* Project History List */}
        <div className="space-y-2">
          <label className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Daftar Proyek Lokal ({projectList.length})</label>
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {projectList.length === 0 ? (
              <p className="text-[#737373] p-4 text-center bg-[#0a0a0a] rounded border border-[#2a2a2a] text-xs">
                Belum ada proyek tersimpan. Simpan proyek saat ini untuk melihat daftar di sini.
              </p>
            ) : (
              projectList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    onClose();
                  }}
                  className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                    p.id === currentProject.id
                      ? 'bg-blue-950/40 border-blue-500 text-white shadow'
                      : 'bg-[#0a0a0a] border-[#2a2a2a] text-gray-300 hover:bg-[#1f1f1f]'
                  }`}
                >
                  <div>
                    <p className="font-bold text-gray-200 text-xs">{p.name}</p>
                    <p className="text-[9px] text-[#737373] font-mono">
                      Diperbarui: {new Date(p.updatedAt).toLocaleString()} | {p.layers.length} Layer
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    className="p-1 rounded hover:bg-rose-950/40 text-[#737373] hover:text-rose-400 transition-colors"
                    title="Hapus Proyek"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
