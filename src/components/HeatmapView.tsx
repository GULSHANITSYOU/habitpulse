import React, { useState, useMemo } from 'react';
import { Sparkles, Calendar, Award, Flame } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { getHeatmapDates, formatDisplayDate, isHabitScheduledForDate } from '../utils/dateUtils';

export const HeatmapView: React.FC = () => {
  const { habits, logs } = useHabits();
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [hoveredDate, setHoveredDate] = useState<{
    key: string;
    date: Date;
    completed: number;
    total: number;
    habitsDone: string[];
  } | null>(null);

  const activeHabits = habits.filter((h) => !h.archived);
  const targetHabits = selectedHabitId === 'all'
    ? activeHabits
    : activeHabits.filter((h) => h.id === selectedHabitId);

  // 14 weeks = 98 days
  const dateSlots = useMemo(() => getHeatmapDates(98), []);

  // Compute log density for each date slot
  const cellData = useMemo(() => {
    return dateSlots.map((slot) => {
      let totalScheduled = 0;
      let completedCount = 0;
      const habitsDone: string[] = [];

      targetHabits.forEach((habit) => {
        if (isHabitScheduledForDate(habit, slot.date)) {
          totalScheduled++;
          const log = logs.find((l) => l.habitId === habit.id && l.date === slot.key);
          if (log?.completed) {
            completedCount++;
            habitsDone.push(habit.title);
          }
        }
      });

      const ratio = totalScheduled > 0 ? completedCount / totalScheduled : 0;
      let level = 0;
      if (completedCount > 0) {
        if (ratio >= 0.85) level = 4;
        else if (ratio >= 0.6) level = 3;
        else if (ratio >= 0.35) level = 2;
        else level = 1;
      }

      return {
        key: slot.key,
        date: slot.date,
        total: totalScheduled,
        completed: completedCount,
        ratio,
        level,
        habitsDone,
      };
    });
  }, [dateSlots, targetHabits, logs]);

  // Total check-ins in the heatmap window
  const totalHeatmapCompletions = useMemo(() => {
    return cellData.reduce((acc, curr) => acc + curr.completed, 0);
  }, [cellData]);

  // Perfect days (100% completion)
  const perfectDaysCount = useMemo(() => {
    return cellData.filter((c) => c.total > 0 && c.completed === c.total).length;
  }, [cellData]);

  // Color mappings for levels
  const getLevelColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-emerald-500 border-emerald-400/50 shadow-sm shadow-emerald-500/20';
      case 3:
        return 'bg-emerald-600/80 border-emerald-500/40';
      case 2:
        return 'bg-emerald-700/50 border-emerald-600/30';
      case 1:
        return 'bg-emerald-950/60 border-emerald-900/50';
      default:
        return 'bg-slate-900 border-slate-800/80 hover:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Card: Filter & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Consistency Heatmap</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize your activity density over the past 14 weeks
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Habits Combined</option>
            {activeHabits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmap Matrix Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm shadow-xl">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[680px]">
            {/* 7 rows x 14 columns grid */}
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 sm:gap-2">
              {cellData.map((cell) => (
                <button
                  key={cell.key}
                  onMouseEnter={() => setHoveredDate(cell)}
                  onClick={() => setHoveredDate(cell)}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border transition-all duration-150 transform hover:scale-125 hover:z-20 ${getLevelColor(
                    cell.level
                  )}`}
                />
              ))}
            </div>

            {/* Legend & Day labels */}
            <div className="flex items-center justify-between mt-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>14-week window</span>
              </span>

              {/* Legend scale */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Less</span>
                <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800" />
                <span className="w-3 h-3 rounded bg-emerald-950/60 border border-emerald-900/50" />
                <span className="w-3 h-3 rounded bg-emerald-700/50 border border-emerald-600/30" />
                <span className="w-3 h-3 rounded bg-emerald-600/80 border border-emerald-500/40" />
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400/50" />
                <span className="text-[11px] text-slate-500">More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Details Panel */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 min-h-[50px] flex items-center justify-between">
          {hoveredDate ? (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-200">
                {formatDisplayDate(hoveredDate.date)}:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                {hoveredDate.completed} of {hoveredDate.total} rituals completed
              </span>
              {hoveredDate.habitsDone.length > 0 && (
                <span className="text-slate-400 truncate max-w-md">
                  ({hoveredDate.habitsDone.join(', ')})
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">
              Hover or click any square on the matrix to inspect date details
            </span>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Flame className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">{totalHeatmapCompletions}</div>
            <div className="text-xs text-slate-400">Check-ins Logged (14w)</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">{perfectDaysCount}</div>
            <div className="text-xs text-slate-400">100% Perfect Days</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-100">{activeHabits.length}</div>
            <div className="text-xs text-slate-400">Active Habits Tracked</div>
          </div>
        </div>
      </div>
    </div>
  );
};
