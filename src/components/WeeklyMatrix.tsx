import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Minus, Flame, Calendar } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { getCurrentWeekDays, isHabitScheduledForDate } from '../utils/dateUtils';
import { HabitIcon } from './HabitIcon';

export const WeeklyMatrix: React.FC = () => {
  const { habits, logs, toggleHabitCompletion, getHabitStats } = useHabits();
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  const activeHabits = habits.filter((h) => !h.archived);

  // Navigate week forward or backward
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Weekly Consistency Matrix</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Glance at your habit progress across {weekStartStr} – {weekEndStr}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => changeWeek(-1)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={resetToCurrentWeek}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Current Week
          </button>
          <button
            onClick={() => changeWeek(1)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/60">
              <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-400 w-64">
                Habit
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.key}
                  className={`py-3 px-2 text-center text-xs font-bold transition-colors ${
                    day.isToday ? 'bg-indigo-600/10 text-indigo-300' : 'text-slate-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-medium">{day.shortName}</span>
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                        day.isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-200'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 w-24">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {activeHabits.map((habit) => {
              const stats = getHabitStats(habit);

              // Calculate weekly completed count for this habit
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

              return (
                <tr key={habit.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Habit Info Cell */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${habit.color}15`,
                          borderColor: `${habit.color}35`,
                          color: habit.color,
                        }}
                      >
                        <HabitIcon name={habit.icon} size={18} color={habit.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs sm:text-sm text-slate-200 truncate">
                            {habit.title}
                          </span>
                          {stats.currentStreak > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                              <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {stats.currentStreak}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 capitalize">
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
                        <td key={day.key} className="py-3 px-2 text-center text-slate-600">
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
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
                              isDone
                                ? 'shadow-md ring-1'
                                : 'border border-slate-700/80 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800'
                            }`}
                            style={{
                              backgroundColor: isDone ? habit.color : undefined,
                              color: isDone ? '#ffffff' : '#64748b',
                              boxShadow: isDone ? `0 0 12px ${habit.color}50` : undefined,
                            }}
                          >
                            {isDone ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-700" />
                            )}
                          </button>
                        </div>
                      </td>
                    );
                  })}

                  {/* Weekly Progress Total */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800/80 text-slate-300">
                      {completedThisWeek}/{scheduledThisWeek}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
