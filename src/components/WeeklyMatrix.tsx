import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Minus,
  Flame,
  Calendar,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { getCurrentWeekDays, isHabitScheduledForDate } from '../utils/dateUtils';
import { HabitIcon } from './HabitIcon';

export const WeeklyMatrix: React.FC = () => {
  const { habits, logs, toggleHabitCompletion, getHabitStats, moveHabit, moveHabitStep } = useHabits();
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);

  const activeHabits = habits.filter((h) => !h.archived);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedHabitId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverHabitId !== id) {
      setDragOverHabitId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedHabitId || draggedHabitId === targetId) {
      setDraggedHabitId(null);
      setDragOverHabitId(null);
      return;
    }
    moveHabit(draggedHabitId, targetId);
    setDraggedHabitId(null);
    setDragOverHabitId(null);
  };

  const handleDragEnd = () => {
    setDraggedHabitId(null);
    setDragOverHabitId(null);
  };

  const changeWeek = (direction: number) => {
    const next = new Date(referenceDate);
    next.setDate(next.getDate() + direction * 7);
    setReferenceDate(next);
  };

  const resetToCurrentWeek = () => {
    setReferenceDate(new Date());
  };

  const weekDays = getCurrentWeekDays(referenceDate);
  const weekStartStr = weekDays[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEndStr = weekDays[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Week Navigator */}
      <div className="card-neo rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-black dark:text-white" />
            <h2 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">Weekly Consistency Matrix</h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Glance at your habit progress across {weekStartStr} – {weekEndStr} • Drag rows to reorder habits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => changeWeek(-1)}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white transition"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={resetToCurrentWeek}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-semibold text-black dark:text-white border border-zinc-200 dark:border-zinc-800 transition"
          >
            Current Week
          </button>
          <button
            onClick={() => changeWeek(1)}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white transition"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto rounded-2xl card-neo p-2">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
              <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-64">
                Habit
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.key}
                  className={`py-3 px-2 text-center text-xs font-bold transition-colors ${
                    day.isToday ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-medium">{day.shortName}</span>
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                        day.isToday ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-24">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {activeHabits.map((habit, index) => {
              const stats = getHabitStats(habit);

              let scheduledThisWeek = 0;
              let completedThisWeek = 0;

              weekDays.forEach((day) => {
                const isScheduled = isHabitScheduledForDate(habit, day.date);
                if (isScheduled) {
                  scheduledThisWeek++;
                  const log = logs.find((l) => l.habitId === habit.id && l.date === day.key);
                  if (log?.completed) {
                    completedThisWeek++;
                  }
                }
              });

              const isDraggingThis = draggedHabitId === habit.id;
              const isDragOverThis = dragOverHabitId === habit.id;

              return (
                <tr
                  key={habit.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, habit.id)}
                  onDragOver={(e) => handleDragOver(e, habit.id)}
                  onDrop={(e) => handleDrop(e, habit.id)}
                  onDragEnd={handleDragEnd}
                  className={`transition-colors cursor-grab active:cursor-grabbing ${
                    isDraggingThis
                      ? 'opacity-30 bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                  } ${
                    isDragOverThis
                      ? 'border-t-2 border-b-2 border-black dark:border-white bg-zinc-100/70 dark:bg-zinc-900/80 shadow-md'
                      : ''
                  }`}
                >
                  {/* Habit Info Cell with Drag Handle */}
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Drag Handle & Mobile Reorder Arrows */}
                      <div className="flex items-center gap-0.5 shrink-0 text-zinc-400">
                        <div
                          title="Drag row to rearrange habit order"
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition"
                        >
                          <GripVertical className="w-3.5 h-3.5 text-zinc-400 hover:text-black dark:hover:text-white" />
                        </div>
                        <div className="flex flex-col -space-y-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveHabitStep(habit.id, 'up');
                            }}
                            disabled={index === 0}
                            title="Move Up"
                            className="p-0.5 text-zinc-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveHabitStep(habit.id, 'down');
                            }}
                            disabled={index === activeHabits.length - 1}
                            title="Move Down"
                            className="p-0.5 text-zinc-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white">
                        <HabitIcon name={habit.icon} size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs sm:text-sm text-black dark:text-white truncate">
                            {habit.title}
                          </span>
                          {stats.currentStreak > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-black dark:text-white">
                              <Flame className="w-3 h-3 fill-black text-black dark:fill-white dark:text-white" />
                              {stats.currentStreak}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 capitalize">
                          {habit.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 7 Day Status Cells */}
                  {weekDays.map((day) => {
                    const isScheduled = isHabitScheduledForDate(habit, day.date);
                    const log = logs.find((l) => l.habitId === habit.id && l.date === day.key);
                    const isDone = Boolean(log?.completed);

                    if (!isScheduled) {
                      return (
                        <td key={day.key} className="py-3 px-2 text-center text-zinc-300 dark:text-zinc-600">
                          <div className="flex items-center justify-center">
                            <Minus className="w-3.5 h-3.5 opacity-40" />
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={day.key} className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => toggleHabitCompletion(habit.id, day.key)}
                            title={`${habit.title} on ${day.shortName} (${day.key}): ${
                              isDone ? 'Completed' : 'Pending'
                            }`}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 ${
                              isDone
                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
                                : 'border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-400'
                            }`}
                          >
                            {isDone ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            )}
                          </button>
                        </div>
                      </td>
                    );
                  })}

                  {/* Weekly Progress Total */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800">
                      {completedThisWeek}/{scheduledThisWeek}
                    </span>
                  </td>
                </tr>
              );
            })}
            {activeHabits.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-bold text-black dark:text-white">No habits tracked yet</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Create habits or pick blueprints to view your 7-day consistency grid.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
