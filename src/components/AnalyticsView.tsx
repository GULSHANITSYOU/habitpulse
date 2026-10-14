import React from 'react';
import {
  Trophy,
  Flame,
  Award,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { HabitIcon } from './HabitIcon';

export const AnalyticsView: React.FC = () => {
  const { habits, logs, user, getHabitStats } = useHabits();

  const activeHabits = habits.filter((h) => !h.archived);

  const habitStatsList = activeHabits.map((habit) => ({
    habit,
    stats: getHabitStats(habit),
  }));

  const sortedByStreak = [...habitStatsList].sort(
    (a, b) => b.stats.currentStreak - a.stats.currentStreak
  );

  const sortedByRate = [...habitStatsList].sort(
    (a, b) => b.stats.completionRate30d - a.stats.completionRate30d
  );

  const overallRate =
    habitStatsList.length > 0
      ? Math.round(
          habitStatsList.reduce((acc, h) => acc + h.stats.completionRate30d, 0) /
            habitStatsList.length
        )
      : 0;

  const totalCompletionsAllTime = logs.filter((l) => l.completed).length;

  const categoryCounts: Record<string, number> = {};
  activeHabits.forEach((h) => {
    categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1;
  });

  const achievements = [
    {
      id: 'first_step',
      title: 'First Step Taken',
      desc: 'Log your first completed habit',
      unlocked: totalCompletionsAllTime >= 1,
      icon: Zap,
    },
    {
      id: 'week_warrior',
      title: '7-Day Warrior',
      desc: 'Maintain a 7-day streak on any habit',
      unlocked: habitStatsList.some((h) => h.stats.currentStreak >= 7 || h.stats.longestStreak >= 7),
      icon: Flame,
    },
    {
      id: 'century_club',
      title: 'Century Club',
      desc: 'Complete 100 habit check-ins all time',
      unlocked: totalCompletionsAllTime >= 100,
      icon: Trophy,
    },
    {
      id: 'habit_architect',
      title: 'Habit Architect',
      desc: 'Track 5 or more active habits concurrently',
      unlocked: activeHabits.length >= 5,
      icon: Target,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-neo card-active p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Consistency (30d)</span>
            <TrendingUp className="w-4 h-4 text-black dark:text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-white tracking-tight">{overallRate}%</span>
            <span className="text-xs text-zinc-500">average</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${overallRate}%` }} />
          </div>
        </div>

        <div className="card-neo p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Check-ins</span>
            <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-white tracking-tight">{totalCompletionsAllTime}</span>
            <span className="text-xs text-zinc-500">rituals</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 font-medium">Lifelong habit repetitions</p>
        </div>

        <div className="card-neo p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Player Level</span>
            <Award className="w-4 h-4 text-black dark:text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-white tracking-tight">Lvl {user.level}</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold">({user.xp} XP)</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 font-medium">{150 - (user.xp % 150)} XP to next level</p>
        </div>

        <div className="card-neo p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Top Streak</span>
            <Flame className="w-4 h-4 fill-black text-black dark:fill-white dark:text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-black dark:text-white tracking-tight">
              {sortedByStreak[0]?.stats.currentStreak || 0}d
            </span>
            <span className="text-xs text-zinc-500">
              Best: {sortedByStreak[0]?.stats.longestStreak || 0}d
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 truncate font-medium">
            {sortedByStreak[0]?.habit.title || 'None active'}
          </p>
        </div>
      </div>

      {/* Grid: Consistency Ranking & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Habit Consistency Ranking */}
        <div className="lg:col-span-8 p-6 rounded-2xl card-neo space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-black dark:text-white tracking-tight">Consistency Ranking</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Habits ranked by 30-day completion reliability</p>
            </div>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>

          <div className="space-y-3 pt-2">
            {sortedByRate.map(({ habit, stats }) => (
              <div key={habit.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white">
                      <HabitIcon name={habit.icon} size={15} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-black dark:text-white">{habit.title}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-2 capitalize">({habit.category})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold">
                    {stats.currentStreak > 0 && (
                      <span className="flex items-center gap-1 text-black dark:text-white font-bold">
                        <Flame className="w-3.5 h-3.5 fill-black text-black dark:fill-white dark:text-white" />
                        {stats.currentStreak}d
                      </span>
                    )}
                    <span className="text-black dark:text-white font-black">{stats.completionRate30d}%</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-black dark:bg-white transition-all duration-300"
                    style={{ width: `${stats.completionRate30d}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution & Gamification Badges */}
        <div className="lg:col-span-4 space-y-6">
          {/* Categories */}
          <div className="p-6 rounded-2xl card-neo space-y-4">
            <h3 className="font-bold text-base text-black dark:text-white tracking-tight">Life Dimensions</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Distribution across routine dimensions</p>

            <div className="space-y-3 pt-2">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / activeHabits.length) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="capitalize text-zinc-700 dark:text-zinc-200">{cat}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{count} habits ({percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-black dark:bg-white"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges */}
          <div className="p-6 rounded-2xl card-neo space-y-4">
            <h3 className="font-bold text-base text-black dark:text-white tracking-tight">Milestones</h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border text-center transition ${
                      ach.unlocked
                        ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-black dark:text-white shadow-xs'
                        : 'bg-zinc-100/40 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                        ach.unlocked ? 'bg-black text-white dark:bg-white dark:text-black font-bold' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold leading-tight truncate text-black dark:text-white">{ach.title}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{ach.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
