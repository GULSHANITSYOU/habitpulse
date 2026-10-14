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

  const totalHeatmapCompletions = useMemo(() => {
    return cellData.reduce((acc, curr) => acc + curr.completed, 0);
  }, [cellData]);

  const perfectDaysCount = useMemo(() => {
    return cellData.filter((c) => c.total > 0 && c.completed === c.total).length;
  }, [cellData]);

  // Clean bright shadow monochrome mapping
  const getLevelColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-white border-white shadow-md shadow-white/30';
      case 3:
        return 'bg-zinc-300 border-zinc-200';
      case 2:
        return 'bg-zinc-500/80 border-zinc-500/40';
      case 1:
        return 'bg-zinc-800 border-zinc-700';
      default:
        return 'bg-zinc-950 border-white/5 hover:border-white/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Card: Filter & Summary */}
      <div className="card-neo rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Consistency Heatmap</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visualize your activity density over the past 14 weeks
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-white font-medium"
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
      <div className="card-neo rounded-3xl p-6 sm:p-8">
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

            {/* Legend & Labels */}
            <div className="flex items-center justify-between mt-6 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white" />
                <span>14-week window</span>
              </span>

              {/* Monochrome Legend */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">Less</span>
                <span className="w-3 h-3 rounded bg-zinc-950 border border-white/10" />
                <span className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700" />
                <span className="w-3 h-3 rounded bg-zinc-500/80 border border-zinc-500/40" />
                <span className="w-3 h-3 rounded bg-zinc-300 border border-zinc-200" />
                <span className="w-3 h-3 rounded bg-white border-white shadow-xs shadow-white/50" />
                <span className="text-[11px] text-zinc-500">More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Details Panel */}
        <div className="mt-4 pt-4 border-t border-white/10 min-h-[50px] flex items-center justify-between">
          {hoveredDate ? (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-white">
                {formatDisplayDate(hoveredDate.date)}:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-semibold border border-white/20">
                {hoveredDate.completed} of {hoveredDate.total} rituals completed
              </span>
              {hoveredDate.habitsDone.length > 0 && (
                <span className="text-zinc-400 truncate max-w-md">
                  ({hoveredDate.habitsDone.join(', ')})
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-zinc-500 italic">
              Hover or click any square on the matrix to inspect date details
            </span>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-neo p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{totalHeatmapCompletions}</div>
            <div className="text-xs text-zinc-400 font-medium">Check-ins Logged (14w)</div>
          </div>
        </div>

        <div className="card-neo p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{perfectDaysCount}</div>
            <div className="text-xs text-zinc-400 font-medium">100% Perfect Days</div>
          </div>
        </div>

        <div className="card-neo p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{activeHabits.length}</div>
            <div className="text-xs text-zinc-400 font-medium">Active Habits Tracked</div>
          </div>
        </div>
      </div>
    </div>
  );
};
