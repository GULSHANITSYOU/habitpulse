import React, { useState } from 'react';
import { Trash2, X, Check } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  habitTitle: string;
  onConfirm: (rememberChoice: boolean) => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  habitTitle,
  onConfirm,
  onCancel,
}) => {
  const [rememberChoice, setRememberChoice] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white flex items-center justify-center">
            <Trash2 className="w-5 h-5 stroke-[2]" />
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-black dark:text-white tracking-tight">
            Delete Habit?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-black dark:text-white">"{habitTitle}"</span>? This will permanently remove its routine logs, streak progress, and analytics.
          </p>
        </div>

        {/* Remember choice checkbox */}
        <div className="mt-5">
          <label
            onClick={() => setRememberChoice(!rememberChoice)}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white cursor-pointer transition select-none group"
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                rememberChoice
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold'
                  : 'border border-zinc-400 dark:border-zinc-600 group-hover:border-black dark:group-hover:border-white'
              }`}
            >
              {rememberChoice && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-black dark:text-white">
                Remember this choice
              </span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Don't ask confirmation again for future deletions
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(rememberChoice)}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-sm transition active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Habit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
