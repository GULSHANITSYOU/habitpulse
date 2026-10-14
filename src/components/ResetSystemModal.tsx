import React, { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface ResetSystemModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetSystemModal: React.FC<ResetSystemModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'RESET';

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm();
    setConfirmText('');
  };

  const handleClose = () => {
    setConfirmText('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white flex items-center justify-center">
            <RotateCcw className="w-5 h-5 stroke-[2.2]" />
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Warning */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800">
              Danger Zone
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Irreversible Action</span>
          </div>
          <h3 className="text-lg font-bold text-black dark:text-white tracking-tight mt-1">
            Reset Full System & Restart?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
            This will permanently erase all your data so you can restart completely from scratch:
          </p>
        </div>

        {/* Detailed Impact Breakdown */}
        <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
            <span>Deletes <strong>all active and archived habits</strong></span>
          </div>
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
            <span>Wipes <strong>all daily completion history & notes</strong></span>
          </div>
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
            <span>Resets player level to <strong>Level 1 (0 XP)</strong></span>
          </div>
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
            <span>Resets <strong>all active streaks & statistics</strong></span>
          </div>
        </div>

        {/* Type "RESET" Safety Field */}
        <div className="mt-5 space-y-1.5">
          <label className="block text-xs font-semibold text-black dark:text-white">
            Type <span className="font-mono font-bold underline">RESET</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isConfirmed) {
                handleConfirm();
              }
            }}
            placeholder="Type RESET"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-mono text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition uppercase"
            autoFocus
          />
        </div>

        {/* Buttons */}
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition active:scale-95 shadow-sm ${
              isConfirmed
                ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-85 cursor-pointer'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Wipe All & Restart System</span>
          </button>
        </div>
      </div>
    </div>
  );
};
