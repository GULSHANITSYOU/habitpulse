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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden p-6 glow-white-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
            <Trash2 className="w-6 h-6 stroke-[2]" />
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Delete Habit?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-white">"{habitTitle}"</span>? This will permanently remove its routine logs, streak progress, and analytics.
          </p>
        </div>

        {/* Remember choice checkbox */}
        <div className="mt-5">
          <label
            onClick={() => setRememberChoice(!rememberChoice)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/25 cursor-pointer transition select-none group"
          >
            <div
              className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                rememberChoice
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'border border-zinc-600 bg-zinc-950 group-hover:border-zinc-400'
              }`}
            >
              {rememberChoice && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-zinc-200">
                Remember this choice
              </span>
              <p className="text-[10px] text-zinc-500">
                Don't ask confirmation again for future deletions
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(rememberChoice)}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Habit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
