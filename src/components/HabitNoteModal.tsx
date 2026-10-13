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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: `${habit.color}20`,
                borderColor: `${habit.color}40`,
                color: habit.color,
              }}
            >
              <HabitIcon name={habit.icon} size={16} color={habit.color} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{habit.title}</h3>
              <p className="text-xs text-slate-400">Note for {formatDisplayDate(dateKey)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Daily Reflection / Context
            </label>
            <textarea
              rows={4}
              placeholder="How did this habit feel today? Any challenges, wins, or milestones?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/25"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
