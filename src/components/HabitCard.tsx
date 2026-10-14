import React, { useState } from 'react';
import {
  Check,
  Flame,
  Plus,
  Minus,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  Clock,
} from 'lucide-react';
import type { Habit } from '../types/habit';
import { useHabits } from '../context/HabitContext';
import { HabitIcon } from './HabitIcon';
import { HabitModal } from './HabitModal';
import { HabitNoteModal } from './HabitNoteModal';

interface HabitCardProps {
  habit: Habit;
  dateKey?: string;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, dateKey }) => {
  const {
    selectedDate,
    getHabitLog,
    toggleHabitCompletion,
    incrementHabitValue,
    getHabitStats,
    deleteHabit,
    toggleArchiveHabit,
  } = useHabits();

  const targetDate = dateKey || selectedDate;
  const log = getHabitLog(habit.id, targetDate);
  const stats = getHabitStats(habit);

  const isCompleted = Boolean(log?.completed);
  const currentValue = log?.value || 0;
  const progressPercent = Math.min(100, Math.round((currentValue / habit.targetValue) * 100));

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const stepAmount = habit.habitType === 'numeric' 
    ? Math.max(1, Math.round(habit.targetValue / 5)) 
    : 1;

  const timeIcons: Record<string, React.ReactNode> = {
    morning: <Sun className="w-3 h-3 text-zinc-400" />,
    afternoon: <Sun className="w-3 h-3 text-zinc-400" />,
    evening: <Moon className="w-3 h-3 text-zinc-400" />,
    anytime: <Clock className="w-3 h-3 text-zinc-400" />,
  };

  return (
    <>
      <div
        className={`card-neo rounded-2xl p-5 relative transition-all duration-300 ${
          isCompleted ? 'card-active' : ''
        }`}
      >
        {/* Top Header: Category, Time, Streaks, Menu */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Minimalist Category Badge */}
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize bg-white/10 text-zinc-200 border border-white/15">
              {habit.category}
            </span>

            {/* Time of Day */}
            <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-white/5">
              {timeIcons[habit.timeOfDay]}
              <span className="capitalize">{habit.timeOfDay}</span>
            </span>

            {/* Frequency */}
            <span className="hidden sm:inline-block text-[11px] text-zinc-500 capitalize">
              • {habit.frequencyType.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak Flame Badge */}
            {stats.currentStreak > 0 && (
              <div
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold shadow-sm"
                title={`${stats.currentStreak} day streak (Best: ${stats.longestStreak}d)`}
              >
                <Flame className="w-3.5 h-3.5 fill-white text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                <span>{stats.currentStreak}d</span>
              </div>
            )}

            {/* Note indicator */}
            {log?.notes && (
              <button
                onClick={() => setIsNoteModalOpen(true)}
                title="View note for this date"
                className="p-1 rounded-lg text-white hover:text-zinc-200 bg-white/10 border border-white/20 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown Options */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-zinc-900 border border-white/15 shadow-2xl py-1 z-30 text-xs">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsNoteModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-300 hover:bg-white/10 hover:text-white transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                      <span>{log?.notes ? 'Edit Note' : 'Add Note'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsEditModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-300 hover:bg-white/10 hover:text-white transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-white" />
                      <span>Edit Habit</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        toggleArchiveHabit(habit.id);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-zinc-300 hover:bg-white/10 hover:text-white transition"
                    >
                      <Archive className="w-3.5 h-3.5 text-white" />
                      <span>{habit.archived ? 'Restore' : 'Archive'}</span>
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (confirm(`Delete habit "${habit.title}" permanently?`)) {
                          deleteHabit(habit.id);
                        }
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Icon, Title, Description */}
        <div className="flex items-start gap-3.5">
          {/* Minimal monochrome square icon with clean border */}
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-white/10 border border-white/15 text-white shadow-sm transition-transform group-hover:scale-105">
            <HabitIcon name={habit.icon} size={22} color="#ffffff" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-bold text-base tracking-tight truncate transition-colors ${
                isCompleted ? 'text-zinc-400 line-through decoration-zinc-500/60' : 'text-white'
              }`}
            >
              {habit.title}
            </h3>
            {habit.description && (
              <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{habit.description}</p>
            )}

            {/* Consistency & completions */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400">
              <span>{stats.completionRate30d}% consistency (30d)</span>
              <span>•</span>
              <span>{stats.totalCompletions} completions</span>
            </div>
          </div>
        </div>

        {/* Note snippet if logged today */}
        {log?.notes && (
          <div className="mt-3 p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 flex items-start gap-2 shadow-inner">
            <MessageSquare className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
            <p className="italic line-clamp-2">"{log.notes}"</p>
          </div>
        )}

        {/* Bottom: Progress Bar & Action Buttons */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-4">
          {habit.habitType === 'numeric' ? (
            /* Numeric Stepper & Progress */
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-300">
                  {currentValue} / {habit.targetValue} {habit.unit || 'units'}
                </span>
                <span className="text-white font-bold">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300 shadow-sm shadow-white/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => incrementHabitValue(habit.id, -stepAmount, targetDate)}
                  disabled={currentValue <= 0}
                  className="p-1 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-white/10 disabled:opacity-40 disabled:hover:bg-zinc-900 transition"
                  title={`Decrease by ${stepAmount}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => incrementHabitValue(habit.id, stepAmount, targetDate)}
                  className="p-1 rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-white/10 transition"
                  title={`Increase by ${stepAmount}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Quick 100% Mark Check */}
                <button
                  onClick={() => toggleHabitCompletion(habit.id, targetDate)}
                  className={`ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isCompleted
                      ? 'bg-white text-zinc-950 shadow-md shadow-white/20'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-white/15'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isCompleted ? 'Done' : 'Complete'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Boolean Checkbox Toggle */
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Daily Ritual</span>
              </span>

              <button
                onClick={() => toggleHabitCompletion(habit.id, targetDate)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-white text-zinc-950 shadow-lg shadow-white/20 scale-[1.02]'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/15'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                    isCompleted ? 'bg-zinc-950 text-white' : 'border border-zinc-500'
                  }`}
                >
                  {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit & Notes Modals */}
      {isEditModalOpen && (
        <HabitModal
          isOpen={isEditModalOpen}
          habitToEdit={habit}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      {isNoteModalOpen && (
        <HabitNoteModal
          isOpen={isNoteModalOpen}
          habit={habit}
          dateKey={targetDate}
          initialNote={log?.notes || ''}
          onClose={() => setIsNoteModalOpen(false)}
        />
      )}
    </>
  );
};
