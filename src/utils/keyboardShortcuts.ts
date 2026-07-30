/**
 * VIZ Studio - Global Keyboard Shortcuts Manager
 */

import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTogglePlay: () => void;
}

export function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onTogglePlay,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onDuplicate();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        onDelete();
      } else if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onUndo, onRedo, onDuplicate, onDelete, onTogglePlay]);
}
