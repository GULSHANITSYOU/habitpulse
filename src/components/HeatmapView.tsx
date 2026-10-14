import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  Award,
  Flame,
  Check,
  Plus,
  Layers,
  Filter,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { getHeatmapDates, formatDisplayDate, isHabitScheduledForDate, getTodayKey } from '../utils/dateUtils';
import { HabitIcon } from './HabitIcon';
import { HabitModal } from './HabitModal';
import type { Habit, HabitCategory } from '../types/habit';

interface SingleHabitHeatmapProps {
  habit: Habit;
  dateSlots: { date: Date; key: string }[];
}

const SingleHabitHeatmapCard: React.FC<SingleHabitHeatmapProps> = ({ habit, dateSlots }) => {
  const { logs, getHabitStats, toggleHabitCompletion } = useHabits();
  const stats = getHabitStats(habit);
  const todayKey = getTodayKey();

  const [hoveredCell, setHoveredCell] = useState<{
    date: Date;
    key: string;
    isScheduled: boolean;
    completed: boolean;
    value: number;
    notes?: string;
  } | null>(null);

  // Calculate 14-week cell data for this specific habit
  const habitCells = useMemo(() => {
    return dateSlots.map((slot) => {
      const isScheduled = isHabitScheduledForDate(habit, slot.date);
      const log = logs.find((l) => l.habitId === habit.id && l.date === slot.key);
      const completed = Boolean(log?.completed);
      const value = log?.value || 0;

      let level = 0;
      if (completed) {
        level = 4;
      } else if (habit.habitType === 'numeric' && value > 0) {
        const ratio = value / habit.targetValue;
        if (ratio >= 0.75) level = 3;
        else if (ratio >= 0.35) level = 2;
        else level = 1;
      }

      return {
        date: slot.date,
        key: slot.key,
        isScheduled,
        completed,
        value,
        notes: log?.notes,
        level,
      };
    });
  }, [habit, dateSlots, logs]);

  const habitCompletionsInWindow = useMemo(() => {
    return habitCells.filter((c) => c.completed).length;
  }, [habitCells]);

  const scheduledInWindow = useMemo(() => {
    return habitCells.filter((c) => c.isScheduled).length;
  }, [habitCells]);

  const windowRate = scheduledInWindow > 0
    ? Math.round((habitCompletionsInWindow / scheduledInWindow) * 100)
    : 0;

  const todayCell = habitCells.find((c) => c.key === todayKey);
  const isDoneToday = Boolean(todayCell?.completed);

  const getCellColor = (c: typeof habitCells[0]) => {
    if (!c.isScheduled) {
      return 'bg-transparent border border-dashed border-zinc-200 dark:border-zinc-800 opacity-40 hover:opacity-100 hover:border-zinc-400';
    }

    switch (c.level) {
      case 4:
        return 'bg-black dark:bg-white border border-black dark:border-white shadow-xs';
      case 3:
        return 'bg-zinc-700 dark:bg-zinc-300 border border-zinc-700 dark:border-zinc-300';
      case 2:
        return 'bg-zinc-400 dark:bg-zinc-500 border border-zinc-400 dark:border-zinc-500';
      case 1:
        return 'bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700';
      default:
        return 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white';
    }
  };

  return (
    <div className="card-neo rounded-2xl p-5 sm:p-6 space-y-4">
      {/* Habit Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white">
            <HabitIcon name={habit.icon} size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-black dark:text-white tracking-tight">
                {habit.title}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800">
                {habit.category}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span className="capitalize">{habit.frequencyType.replace('_', ' ')}</span>
              <span>•</span>
              <span className="capitalize">{habit.timeOfDay}</span>
              {habit.habitType === 'numeric' && (
                <>
                  <span>•</span>
                  <span>Target: {habit.targetValue} {habit.unit || 'units'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {stats.currentStreak > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-xs font-bold shadow-xs"
              title={`${stats.currentStreak} day streak (Longest: ${stats.longestStreak}d)`}
            >
              <Flame className="w-3.5 h-3.5 fill-black text-black dark:fill-white dark:text-white" />
              <span>{stats.currentStreak}d</span>
            </div>
          )}

          <div
            className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white text-xs font-bold shadow-xs"
            title="30-day consistency score"
          >
            <span>{stats.completionRate30d}% 30d</span>
          </div>

          <div
            className="hidden sm:block px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium"
            title="14-week consistency rate"
          >
            <span>{habitCompletionsInWindow}/{scheduledInWindow} ({windowRate}%)</span>
          </div>

          <button
            onClick={() => toggleHabitCompletion(habit.id, todayKey)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all duration-150 ${
              isDoneToday
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-800'
            }`}
            title="Toggle today's completion status"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{isDoneToday ? 'Done Today' : 'Mark Today'}</span>
          </button>
        </div>
      </div>

      {/* Individual Habit Heatmap Grid */}
      <div className="overflow-x-auto pb-2 pt-1 no-scrollbar">
        <div className="min-w-[640px] flex items-center gap-2">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between h-[116px] py-0.5 text-[10px] font-semibold text-zinc-400 select-none pr-1">
            <span>Sun</span>
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>

          {/* 7 rows x 14 columns grid */}
          <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1.5 sm:gap-2">
            {habitCells.map((cell) => (
              <button
                key={cell.key}
                onMouseEnter={() => setHoveredCell(cell)}
                onClick={() => setHoveredCell(cell)}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md transition-all duration-150 transform hover:scale-125 hover:z-20 ${getCellColor(
                  cell
                )}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Details / Hover Strip */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="min-h-[20px] flex items-center gap-2">
          {hoveredCell ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-black dark:text-white">
                {formatDisplayDate(hoveredCell.date)}:
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  hoveredCell.completed
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                    : hoveredCell.isScheduled
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                    : 'bg-transparent text-zinc-400 border-dashed border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {hoveredCell.completed
                  ? habit.habitType === 'numeric'
                    ? `Completed (${hoveredCell.value} ${habit.unit || 'units'})`
                    : 'Completed'
                  : hoveredCell.isScheduled
                  ? 'Missed / Not completed'
                  : 'Rest day (Not scheduled)'}
              </span>
              {hoveredCell.notes && (
                <span className="text-zinc-500 italic max-w-sm truncate">
                  "{hoveredCell.notes}"
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 text-xs italic">
              Hover over any square to inspect date progress
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-transparent border border-dashed border-zinc-300 dark:border-zinc-700" />
            <span>Rest Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-black dark:bg-white border border-black dark:border-white shadow-xs" />
            <span>Done</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HeatmapView: React.FC = () => {
  const { habits, logs } = useHabits();
  const [viewMode, setViewMode] = useState<'individual' | 'combined'>('individual');
  const [filterCategory, setFilterCategory] = useState<HabitCategory | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeHabits = habits.filter((h) => !h.archived);
  const displayedHabits = filterCategory === 'all'
    ? activeHabits
    : activeHabits.filter((h) => h.category === filterCategory);

  // 14 weeks = 98 days
  const dateSlots = useMemo(() => getHeatmapDates(98), []);

  // Combined system-wide cell data
  const combinedCellData = useMemo(() => {
    return dateSlots.map((slot) => {
      let totalScheduled = 0;
      let completedCount = 0;
      const habitsDone: string[] = [];

      activeHabits.forEach((habit) => {
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
  }, [dateSlots, activeHabits, logs]);

  const [hoveredCombinedDate, setHoveredCombinedDate] = useState<typeof combinedCellData[0] | null>(null);

  const totalHeatmapCompletions = useMemo(() => {
    return combinedCellData.reduce((acc, curr) => acc + curr.completed, 0);
  }, [combinedCellData]);

  const perfectDaysCount = useMemo(() => {
    return combinedCellData.filter((c) => c.total > 0 && c.completed === c.total).length;
  }, [combinedCellData]);

  const getCombinedLevelColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-black dark:bg-white border border-black dark:border-white shadow-xs';
      case 3:
        return 'bg-zinc-700 dark:bg-zinc-300 border border-zinc-700 dark:border-zinc-300';
      case 2:
        return 'bg-zinc-400 dark:bg-zinc-500 border border-zinc-400 dark:border-zinc-500';
      case 1:
        return 'bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700';
      default:
        return 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white';
    }
  };

  const categories: { id: HabitCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Habits' },
    { id: 'health', label: 'Health' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'learning', label: 'Learning' },
    { id: 'finance', label: 'Finance' },
    { id: 'lifestyle', label: 'Lifestyle' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Controls, View Mode & Filters */}
      <div className="card-neo rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black dark:text-white" />
            <h2 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">
              Habit Consistency Heatmaps
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Dedicated 14-week consistency matrices for each individual habit
          </p>
        </div>

        {/* View Mode Switcher & Add Habit */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'individual'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Every Habit ({activeHabits.length})
            </button>
            <button
              onClick={() => setViewMode('combined')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'combined'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Combined Matrix
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Add Habit</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills (in Individual view) */}
      {viewMode === 'individual' && activeHabits.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                filterCategory === cat.id
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold'
                  : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* MAIN VIEW: Individual Heatmaps List */}
      {viewMode === 'individual' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {displayedHabits.length === 0 ? (
            <div className="p-12 rounded-2xl card-neo text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-black dark:text-white">
                  {filterCategory === 'all' ? 'No habits found' : `No habits in "${filterCategory}"`}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                  Create a habit to begin tracking your consistency and generating individual activity graphs.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold transition shadow-xs hover:opacity-85 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create a Habit</span>
              </button>
            </div>
          ) : (
            displayedHabits.map((habit) => (
              <SingleHabitHeatmapCard key={habit.id} habit={habit} dateSlots={dateSlots} />
            ))
          )}
        </div>
      )}

      {/* ALTERNATIVE VIEW: Combined Overview Heatmap */}
      {viewMode === 'combined' && (
        <div className="card-neo rounded-2xl p-6 sm:p-8 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-black dark:text-white">System Activity Matrix</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total completion density across all scheduled rituals combined</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white">
              {activeHabits.length} habits combined
            </span>
          </div>

          <div className="overflow-x-auto pb-4 no-scrollbar">
            <div className="min-w-[640px]">
              {/* 7 rows x 14 columns grid */}
              <div className="grid grid-flow-col grid-rows-7 gap-1.5 sm:gap-2">
                {combinedCellData.map((cell) => (
                  <button
                    key={cell.key}
                    onMouseEnter={() => setHoveredCombinedDate(cell)}
                    onClick={() => setHoveredCombinedDate(cell)}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md transition-all duration-150 transform hover:scale-125 hover:z-20 ${getCombinedLevelColor(
                      cell.level
                    )}`}
                  />
                ))}
              </div>

              {/* Legend & Labels */}
              <div className="flex items-center justify-between mt-6 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>14-week window</span>
                </span>

                {/* Legend scale */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">Less</span>
                  <span className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                  <span className="w-3 h-3 rounded bg-zinc-200 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-700" />
                  <span className="w-3 h-3 rounded bg-zinc-400 dark:bg-zinc-500 border border-zinc-400 dark:border-zinc-500" />
                  <span className="w-3 h-3 rounded bg-zinc-700 dark:bg-zinc-300 border border-zinc-700 dark:border-zinc-300" />
                  <span className="w-3 h-3 rounded bg-black dark:bg-white border border-black dark:border-white shadow-xs" />
                  <span className="text-[11px]">More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hover Details Panel */}
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 min-h-[46px] flex items-center justify-between">
            {hoveredCombinedDate ? (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-black dark:text-white">
                  {formatDisplayDate(hoveredCombinedDate.date)}:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-semibold border border-zinc-200 dark:border-zinc-800">
                  {hoveredCombinedDate.completed} of {hoveredCombinedDate.total} rituals completed
                </span>
                {hoveredCombinedDate.habitsDone.length > 0 && (
                  <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                    ({hoveredCombinedDate.habitsDone.join(', ')})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-zinc-400 italic">
                Hover or click any square on the matrix to inspect date details
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overall Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-neo p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-black dark:text-white">
            <Flame className="w-5 h-5 fill-black text-black dark:fill-white dark:text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-black dark:text-white tracking-tight">{totalHeatmapCompletions}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Check-ins Logged (14w)</div>
          </div>
        </div>

        <div className="card-neo p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-black dark:text-white">
            <Award className="w-5 h-5 text-black dark:text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-black dark:text-white tracking-tight">{perfectDaysCount}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">100% Perfect Days</div>
          </div>
        </div>

        <div className="card-neo p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-black dark:text-white">
            <Sparkles className="w-5 h-5 text-black dark:text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-black dark:text-white tracking-tight">{activeHabits.length}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Active Habits Tracked</div>
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {isAddModalOpen && (
        <HabitModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};
