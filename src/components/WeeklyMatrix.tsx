import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Flame,
  Calendar,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trophy,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  RotateCcw,
  Layers,
  Award,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { formatDateKey, isHabitScheduledForDate, getTodayKey } from '../utils/dateUtils';
import { HabitIcon } from './HabitIcon';

export const WeeklyMatrix: React.FC = () => {
  const {
    habits,
    logs,
    toggleHabitCompletion,
    getHabitStats,
    moveHabit,
    moveHabitStep,
  } = useHabits();

  // Active month state
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-11
  const [viewMode, setViewMode] = useState<'month_matrix' | 'week_sprint'>('month_matrix');
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const resetToCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  const monthName = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long' });
  }, [selectedYear, selectedMonth]);

  // Days in month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const todayKey = getTodayKey();

  // Generate all month days
  const monthDays = useMemo(() => {
    const list = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(selectedYear, selectedMonth, day);
      const key = formatDateKey(d);
      list.push({
        dayNum: day,
        date: d,
        key,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: key === todayKey,
        isFuture: d > today,
      });
    }
    return list;
  }, [selectedYear, selectedMonth, daysInMonth, todayKey, today]);

  // Group days into 5 Weeks matching the MESUPREME sheet (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-end)
  const weeks = useMemo(() => {
    return [
      { name: 'WEEK 1', days: monthDays.slice(0, 7) },
      { name: 'WEEK 2', days: monthDays.slice(7, 14) },
      { name: 'WEEK 3', days: monthDays.slice(14, 21) },
      { name: 'WEEK 4', days: monthDays.slice(21, 28) },
      { name: 'WEEK 5', days: monthDays.slice(28) },
    ].filter((w) => w.days.length > 0);
  }, [monthDays]);

  // Drag and drop handlers
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

  // Precompute log lookup map: "habitId_dateKey" -> boolean
  const logMap = useMemo(() => {
    const map = new Set<string>();
    logs.forEach((l) => {
      if (l.completed) {
        map.add(`${l.habitId}_${l.date}`);
      }
    });
    return map;
  }, [logs]);

  // Compute stats per day (Completed, Goal, Left, Rate)
  const dailyStats = useMemo(() => {
    return monthDays.map((day) => {
      let goal = 0;
      let completed = 0;

      activeHabits.forEach((h) => {
        if (isHabitScheduledForDate(h, day.date)) {
          goal++;
          if (logMap.has(`${h.id}_${day.key}`)) {
            completed++;
          }
        }
      });

      const left = Math.max(0, goal - completed);
      const rate = goal > 0 ? Math.round((completed / goal) * 100) : 0;
      return {
        ...day,
        goal,
        completed,
        left,
        rate,
      };
    });
  }, [monthDays, activeHabits, logMap]);

  // Compute stats per week (Weekly Progress: e.g. 15/42 - 35%)
  const weeklyStats = useMemo(() => {
    return weeks.map((w) => {
      let weekGoal = 0;
      let weekCompleted = 0;

      w.days.forEach((day) => {
        activeHabits.forEach((h) => {
          if (isHabitScheduledForDate(h, day.date)) {
            weekGoal++;
            if (logMap.has(`${h.id}_${day.key}`)) {
              weekCompleted++;
            }
          }
        });
      });

      const rate = weekGoal > 0 ? Math.round((weekCompleted / weekGoal) * 100) : 0;
      return {
        name: w.name,
        goal: weekGoal,
        completed: weekCompleted,
        rate,
      };
    });
  }, [weeks, activeHabits, logMap]);

  // Overall Month Statistics
  const monthTotals = useMemo(() => {
    let totalGoal = 0;
    let totalCompleted = 0;

    dailyStats.forEach((d) => {
      totalGoal += d.goal;
      totalCompleted += d.completed;
    });

    const rate = totalGoal > 0 ? Math.round((totalCompleted / totalGoal) * 100) : 0;
    const left = Math.max(0, totalGoal - totalCompleted);

    return {
      totalGoal,
      totalCompleted,
      rate,
      left,
    };
  }, [dailyStats]);

  // Gamified Rank & Badge
  const rankInfo = useMemo(() => {
    const rate = monthTotals.rate;
    if (rate >= 90) {
      return { rank: 'S-Tier Master', color: 'text-amber-500 border-amber-500/30 bg-amber-500/10', icon: Trophy, note: 'Phenomenal unshakeable discipline!' };
    }
    if (rate >= 75) {
      return { rank: 'A-Tier Elite', color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10', icon: Zap, note: 'Strong continuous consistency!' };
    }
    if (rate >= 50) {
      return { rank: 'B-Tier Consistent', color: 'text-blue-500 border-blue-500/30 bg-blue-500/10', icon: TrendingUp, note: 'Solid daily execution!' };
    }
    if (rate >= 25) {
      return { rank: 'C-Tier Rising', color: 'text-purple-500 border-purple-500/30 bg-purple-500/10', icon: Sparkles, note: 'Building momentum step-by-step.' };
    }
    return { rank: 'Novice Initiate', color: 'text-zinc-500 border-zinc-500/30 bg-zinc-500/10', icon: Target, note: 'Start ticking boxes to level up!' };
  }, [monthTotals.rate]);

  // Filtered view for 7-day sprint if user chooses 'week_sprint'
  const sprintDays = useMemo(() => {
    const todayIndex = monthDays.findIndex((d) => d.isToday);
    const start = Math.max(0, Math.min(todayIndex - 3, monthDays.length - 7));
    return monthDays.slice(start, start + 7);
  }, [monthDays]);

  // Habit rows stats calculation
  const habitRowsData = useMemo(() => {
    return activeHabits.map((habit, index) => {
      let habitMonthGoal = 0;
      let habitMonthCompleted = 0;

      monthDays.forEach((day) => {
        if (isHabitScheduledForDate(habit, day.date)) {
          habitMonthGoal++;
          if (logMap.has(`${habit.id}_${day.key}`)) {
            habitMonthCompleted++;
          }
        }
      });

      const habitLeft = Math.max(0, habitMonthGoal - habitMonthCompleted);
      const habitRate = habitMonthGoal > 0 ? Math.round((habitMonthCompleted / habitMonthGoal) * 100) : 0;
      const stats = getHabitStats(habit);

      return {
        habit,
        index,
        goal: habitMonthGoal,
        completed: habitMonthCompleted,
        left: habitLeft,
        rate: habitRate,
        streak: stats.currentStreak,
      };
    });
  }, [activeHabits, monthDays, logMap, getHabitStats]);

  // SVG Line Chart points for Daily Completion Curve
  const chartPoints = useMemo(() => {
    const width = 600;
    const height = 110;
    const paddingX = 15;
    const paddingY = 15;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const points = dailyStats.map((d, i) => {
      const x = paddingX + (i / Math.max(1, dailyStats.length - 1)) * chartW;
      const y = height - paddingY - (d.rate / 100) * chartH;
      return { x, y, rate: d.rate, dayNum: d.dayNum, key: d.key };
    });

    const pathD = points.length > 0 
      ? points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')
      : '';

    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : '';

    return { points, pathD, areaD, width, height };
  }, [dailyStats]);

  return (
    <div className="space-y-6">
      {/* =========================================================================
          TOP BANNER & DASHBOARD CONTROLS (MESUPREME HABIT TRACKER HEADER)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Title & Calendar Settings */}
        <div className="lg:col-span-3 card-neo rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white uppercase tracking-wider mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>Habit Tracker</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
              {monthName} {selectedYear}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Interactive 5-Week Consistency Dashboard
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 transition active:scale-95"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={resetToCurrentMonth}
                className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-black dark:text-white border border-zinc-200 dark:border-zinc-800 transition active:scale-95"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 transition active:scale-95"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode(viewMode === 'month_matrix' ? 'week_sprint' : 'month_matrix')}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition"
                title={viewMode === 'month_matrix' ? 'Switch to 7-Day Sprint' : 'Switch to 5-Week Grid'}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Daily Consistency Line/Area Chart */}
        <div className="lg:col-span-5 card-neo rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-black dark:text-white" />
              <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                Daily Completion Curve
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">
              {daysInMonth} Days Spread
            </span>
          </div>

          {/* SVG Sparkline */}
          <div className="w-full h-28 relative flex items-center justify-center">
            <svg
              viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" className="text-black dark:text-white" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" className="text-black dark:text-white" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="15" y1="15" x2="585" y2="15" stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.1" className="text-zinc-500" />
              <line x1="15" y1="57" x2="585" y2="57" stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.1" className="text-zinc-500" />
              <line x1="15" y1="95" x2="585" y2="95" stroke="currentColor" strokeOpacity="0.2" className="text-zinc-500" />

              {/* Filled Area */}
              <path d={chartPoints.areaD} fill="url(#chartGradient)" />

              {/* Stroke Line */}
              <path
                d={chartPoints.pathD}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-black dark:text-white"
              />

              {/* Circles on each day */}
              {chartPoints.points.map((p) => (
                <circle
                  key={p.dayNum}
                  cx={p.x}
                  cy={p.y}
                  r={p.rate > 0 ? (p.rate === 100 ? 3.5 : 2.5) : 1.5}
                  className={
                    p.rate === 100
                      ? 'fill-black dark:fill-white stroke-white dark:stroke-black stroke-2'
                      : p.rate > 0
                      ? 'fill-black dark:fill-white'
                      : 'fill-zinc-300 dark:fill-zinc-700'
                  }
                />
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <span>Day 1</span>
            <span>Day 15</span>
            <span>Day {daysInMonth}</span>
          </div>
        </div>

        {/* Card 3: Overview Monthly Progress (Donut & Gamification Badge) */}
        <div className="lg:col-span-4 card-neo rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-black dark:text-white" />
              <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                Monthly Mastery
              </span>
            </div>

            {/* Rank Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-extrabold ${rankInfo.color}`}>
              <rankInfo.icon className="w-3.5 h-3.5" />
              <span>{rankInfo.rank}</span>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {rankInfo.note}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="block text-[10px] uppercase font-sans text-zinc-400">Done</span>
                <span className="font-bold text-black dark:text-white">{monthTotals.totalCompleted}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="block text-[10px] uppercase font-sans text-zinc-400">Remaining</span>
                <span className="font-bold text-black dark:text-white">{monthTotals.left}</span>
              </div>
            </div>
          </div>

          {/* Donut Progress Ring */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-zinc-200 dark:text-zinc-800"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - monthTotals.rate / 100)}`}
                className="text-black dark:text-white transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black font-mono text-black dark:text-white leading-none">
                {monthTotals.rate}%
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 mt-0.5">
                Rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN SPREADSHEET MATRIX (MESUPREME 5-WEEK INTERACTIVE GRID)
         ========================================================================= */}
      <div className="rounded-2xl card-neo overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[980px] select-none">
            {/* 1. TOP HEADER: WEEK GROUPS (WEEK 1, WEEK 2, WEEK 3, WEEK 4, WEEK 5) */}
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {/* Habit Column Header */}
                <th
                  rowSpan={2}
                  className="py-3 px-4 border-r border-zinc-200 dark:border-zinc-800 w-64 bg-zinc-100/90 dark:bg-zinc-900 sticky left-0 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center justify-between">
                    <span>Habits & Rituals</span>
                    <span className="text-[10px] font-normal text-zinc-400">({activeHabits.length})</span>
                  </div>
                </th>

                {/* Goals Column */}
                <th
                  rowSpan={2}
                  className="py-3 px-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-16"
                  title="Monthly Target Days"
                >
                  Goal
                </th>

                {/* Week Columns */}
                {(viewMode === 'month_matrix' ? weeks : [{ name: '7-DAY SPRINT', days: sprintDays }]).map((w) => (
                  <th
                    key={w.name}
                    colSpan={w.days.length}
                    className="py-2.5 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 bg-zinc-200/60 dark:bg-zinc-800/60 font-black text-xs text-black dark:text-white tracking-widest"
                  >
                    {w.name}
                  </th>
                ))}

                {/* Overall Progress Summary Header */}
                <th
                  colSpan={4}
                  className="py-2.5 px-3 text-center bg-zinc-200/60 dark:bg-zinc-800/60 font-black text-xs text-black dark:text-white tracking-widest"
                >
                  Overall Progress
                </th>
              </tr>

              {/* 2. SUB-HEADER: DAY NAMES & DATE NUMBERS */}
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                {(viewMode === 'month_matrix' ? monthDays : sprintDays).map((day) => {
                  return (
                    <th
                      key={day.key}
                      className={`py-2 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 min-w-[34px] transition-colors ${
                        day.isToday ? 'bg-black text-white dark:bg-white dark:text-black font-black' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] uppercase tracking-tighter opacity-80">
                          {day.dayName.slice(0, 2)}
                        </span>
                        <span className="text-xs font-mono font-bold">{day.dayNum}</span>
                      </div>
                    </th>
                  );
                })}

                {/* Overall Progress Sub-headers */}
                <th className="py-2 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 w-12 font-mono">
                  Done
                </th>
                <th className="py-2 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 w-12 font-mono">
                  Left
                </th>
                <th className="py-2 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 w-14 font-mono">
                  % Rate
                </th>
                <th className="py-2 px-3 text-left w-28">
                  Consistency
                </th>
              </tr>
            </thead>

            {/* 3. OVERVIEW PROGRESS SUMMARY SECTION (GLOBAL DAILY STATS, COMPLETED, GOAL, LEFT) */}
            <tbody className="border-b-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/30 font-mono text-[11px]">
              {/* Row 1: Global Visual Fill Bars */}
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="py-2 px-4 border-r border-zinc-200 dark:border-zinc-800 font-sans font-bold text-black dark:text-white sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10">
                  Global Progress
                </td>
                <td className="border-r border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 text-[10px]">
                  📊
                </td>
                {(viewMode === 'month_matrix' ? dailyStats : dailyStats.filter((d) => sprintDays.some((s) => s.key === d.key))).map((d) => (
                  <td key={d.key} className="p-1 border-r border-zinc-200 dark:border-zinc-800 text-center align-bottom">
                    <div className="w-4 h-9 mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-md overflow-hidden flex flex-col justify-end p-0.5">
                      <div
                        className="w-full bg-black dark:bg-white rounded-sm transition-all duration-300"
                        style={{ height: `${d.rate}%` }}
                        title={`Day ${d.dayNum}: ${d.completed}/${d.goal} (${d.rate}%)`}
                      />
                    </div>
                  </td>
                ))}
                <td colSpan={4} className="py-2 px-3 text-center text-xs font-sans font-bold text-zinc-600 dark:text-zinc-300">
                  Daily Rhythm Barometer
                </td>
              </tr>

              {/* Row 2: Completed Counts */}
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="py-1.5 px-4 border-r border-zinc-200 dark:border-zinc-800 font-sans text-xs text-zinc-600 dark:text-zinc-400 sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10">
                  Completed
                </td>
                <td className="border-r border-zinc-200 dark:border-zinc-800 text-center text-zinc-400 font-bold">
                  {monthTotals.totalCompleted}
                </td>
                {(viewMode === 'month_matrix' ? dailyStats : dailyStats.filter((d) => sprintDays.some((s) => s.key === d.key))).map((d) => (
                  <td
                    key={d.key}
                    className={`py-1 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 text-xs font-bold ${
                      d.completed > 0 ? 'text-black dark:text-white' : 'text-zinc-400'
                    }`}
                  >
                    {d.completed}
                  </td>
                ))}
                <td colSpan={4} className="py-1 px-3 text-center text-xs font-bold text-black dark:text-white">
                  {monthTotals.totalCompleted} Total Finished
                </td>
              </tr>

              {/* Row 3: Daily Goals */}
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="py-1.5 px-4 border-r border-zinc-200 dark:border-zinc-800 font-sans text-xs text-zinc-600 dark:text-zinc-400 sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10">
                  Goal
                </td>
                <td className="border-r border-zinc-200 dark:border-zinc-800 text-center text-zinc-400">
                  {monthTotals.totalGoal}
                </td>
                {(viewMode === 'month_matrix' ? dailyStats : dailyStats.filter((d) => sprintDays.some((s) => s.key === d.key))).map((d) => (
                  <td key={d.key} className="py-1 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                    {d.goal}
                  </td>
                ))}
                <td colSpan={4} className="py-1 px-3 text-center text-xs text-zinc-400">
                  {monthTotals.totalGoal} Target Count
                </td>
              </tr>

              {/* Row 4: Left Counts */}
              <tr className="border-b-2 border-zinc-300 dark:border-zinc-700">
                <td className="py-1.5 px-4 border-r border-zinc-200 dark:border-zinc-800 font-sans text-xs text-zinc-600 dark:text-zinc-400 sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10">
                  Left
                </td>
                <td className="border-r border-zinc-200 dark:border-zinc-800 text-center text-zinc-400">
                  {monthTotals.left}
                </td>
                {(viewMode === 'month_matrix' ? dailyStats : dailyStats.filter((d) => sprintDays.some((s) => s.key === d.key))).map((d) => (
                  <td key={d.key} className="py-1 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                    {d.left}
                  </td>
                ))}
                <td colSpan={4} className="py-1 px-3 text-center text-xs font-bold text-zinc-500">
                  {monthTotals.left} Unchecked
                </td>
              </tr>

              {/* Row 5: Weekly Progress Badges */}
              {viewMode === 'month_matrix' && (
                <tr className="border-b-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-900/80">
                  <td className="py-2 px-4 border-r border-zinc-200 dark:border-zinc-800 font-sans font-bold text-xs text-black dark:text-white sticky left-0 bg-zinc-100 dark:bg-zinc-900 z-10">
                    Weekly Progress
                  </td>
                  <td className="border-r border-zinc-200 dark:border-zinc-800 text-center text-[10px] text-zinc-400">
                    📈
                  </td>
                  {weeks.map((w, wIdx) => {
                    const stats = weeklyStats[wIdx];
                    return (
                      <td
                        key={w.name}
                        colSpan={w.days.length}
                        className="py-1.5 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 font-sans font-bold text-xs text-black dark:text-white"
                      >
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 text-[11px] shadow-sm">
                          <span>{stats.completed}/{stats.goal}</span>
                          <span className="font-mono text-zinc-500">({stats.rate}%)</span>
                        </span>
                      </td>
                    );
                  })}
                  <td colSpan={4} className="py-2 px-3 text-center text-xs font-sans font-bold text-black dark:text-white">
                    {monthTotals.rate}% Overall Month
                  </td>
                </tr>
              )}
            </tbody>

            {/* 4. MAIN INTERACTIVE HABIT ROWS */}
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {habitRowsData.map(({ habit, index, goal, completed, left, rate, streak }) => {
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
                    className={`transition-colors cursor-grab active:cursor-grabbing hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 ${
                      isDraggingThis
                        ? 'opacity-30 bg-zinc-100 dark:bg-zinc-800'
                        : ''
                    } ${
                      isDragOverThis
                        ? 'border-t-2 border-b-2 border-black dark:border-white bg-zinc-100/70 dark:bg-zinc-900/80 shadow-md'
                        : ''
                    }`}
                  >
                    {/* Habit Info Cell */}
                    <td className="py-3 px-3 border-r border-zinc-200 dark:border-zinc-800 sticky left-0 bg-white dark:bg-black z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-2">
                        {/* Drag Handle & Mobile Reorder */}
                        <div className="flex items-center gap-0.5 shrink-0 text-zinc-400">
                          <div
                            title="Drag to rearrange order"
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition"
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

                        {/* Icon */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white shadow-xs">
                          <HabitIcon name={habit.icon} size={15} />
                        </div>

                        {/* Title & Streak */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-black dark:text-white truncate">
                              {habit.title}
                            </span>
                            {streak > 0 && (
                              <span
                                className="flex items-center gap-0.5 text-[10px] font-black text-black dark:text-white bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.2 rounded-full border border-zinc-200 dark:border-zinc-800"
                                title={`${streak} day active streak`}
                              >
                                <Flame className="w-3 h-3 fill-black text-black dark:fill-white dark:text-white" />
                                {streak}d
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 capitalize">
                            {habit.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Goal Days Column */}
                    <td className="py-2 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-500">
                      {goal}
                    </td>

                    {/* Checkbox Matrix Cells (Day 1 to 31) */}
                    {(viewMode === 'month_matrix' ? monthDays : sprintDays).map((day) => {
                      const isScheduled = isHabitScheduledForDate(habit, day.date);
                      const isCompleted = logMap.has(`${habit.id}_${day.key}`);

                      if (!isScheduled) {
                        return (
                          <td
                            key={day.key}
                            className={`py-2 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 ${
                              day.isToday ? 'bg-zinc-100/50 dark:bg-zinc-900/50' : ''
                            }`}
                          >
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={day.key}
                          className={`py-1.5 px-1 text-center border-r border-zinc-200 dark:border-zinc-800 ${
                            day.isToday ? 'bg-zinc-100/70 dark:bg-zinc-900/70' : ''
                          }`}
                        >
                          <button
                            onClick={() => toggleHabitCompletion(habit.id, day.key)}
                            title={`${habit.title} • ${day.dayName} ${day.dayNum} (${isCompleted ? 'Done' : 'Pending'})`}
                            className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90 ${
                              isCompleted
                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold ring-1 ring-black dark:ring-white'
                                : 'border border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-transparent'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <span className="w-2 h-2 rounded-xs opacity-0" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* Overall Progress: Completed Count */}
                    <td className="py-2 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-black dark:text-white">
                      {completed}
                    </td>

                    {/* Overall Progress: Left Count */}
                    <td className="py-2 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-400">
                      {left}
                    </td>

                    {/* Overall Progress: % Rate */}
                    <td className="py-2 px-2 text-center border-r border-zinc-200 dark:border-zinc-800 text-xs font-mono font-black text-black dark:text-white">
                      {rate}%
                    </td>

                    {/* Overall Progress: Visual Bar */}
                    <td className="py-2 px-3">
                      <div className="w-full flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-black dark:bg-white transition-all duration-300"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                          {rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Quick Action Tips */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 px-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
          <span>Tap any checkbox to check/uncheck days • Drag rows by handle (⠿) to reorder habits</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToCurrentMonth}
            className="flex items-center gap-1 hover:text-black dark:hover:text-white transition font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Jump to Current Month</span>
          </button>
        </div>
      </div>
    </div>
  );
};
