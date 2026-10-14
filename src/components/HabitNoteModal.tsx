import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Habit } from '../types/habit';
import { useHabits } from '../context/HabitContext';
import { formatDisplayDate } from '../utils/dateUtils';
import { HabitIcon } from './HabitIcon';

interface HabitNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  dateKey: string;
  initialNote: string;
}

export const HabitNoteModal: React.FC<HabitNoteModalProps> = ({
  isOpen,
  onClose,
  habit,
  dateKey,
  initialNote,
}) => {
  const { updateHabitNotes } = useHabits();
  const [note, setNote] = useState(initialNote);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateHabitNotes(habit.id, note.trim(), dateKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden p-6 glow-white-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 border border-white/15 text-white">
              <HabitIcon name={habit.icon} size={16} color="#ffffff" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{habit.title}</h3>
              <p className="text-xs text-zinc-400">Note for {formatDisplayDate(dateKey)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Daily Reflection / Context
            </label>
            <textarea
              rows={4}
              placeholder="How did this habit feel today? Any challenges, wins, or milestones?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 text-sm leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl transition shadow-md shadow-white/10 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
