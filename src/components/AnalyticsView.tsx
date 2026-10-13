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
import { HabitIcon, CATEGORY_COLORS } from './HabitIcon';

export const AnalyticsView: React.FC = () => {
  const { habits, logs, user, getHabitStats } = useHabits();

  const activeHabits = habits.filter((h) => !h.archived);

  // Compute all stats
  const habitStatsList = activeHabits.map((habit) => ({
    habit,
    stats: getHabitStats(habit),
  }));

  // Sort by highest streak
  const sortedByStreak = [...habitStatsList].sort(
    (a, b) => b.stats.currentStreak - a.stats.currentStreak
  );

  // Sort by completion rate
  const sortedByRate = [...habitStatsList].sort(
    (a, b) => b.stats.completionRate30d - a.stats.completionRate30d
  );

  // Overall 30-day average rate
  const overallRate =
    habitStatsList.length > 0
      ? Math.round(
          habitStatsList.reduce((acc, h) => acc + h.stats.completionRate30d, 0) /
            habitStatsList.length
        )
      : 0;

  // Total check-ins logged all time
  const totalCompletionsAllTime = logs.filter((l) => l.completed).length;

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  activeHabits.forEach((h) => {
    categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1;
  });

  // Gamification achievements
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
      {/* Top Banner: Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-slate-900/50 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-indigo-400">Consistency (30d)</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">{overallRate}%</span>
            <span className="text-xs text-slate-400">average</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${overallRate}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-amber-400">Total Check-ins</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">{totalCompletionsAllTime}</span>
            <span className="text-xs text-slate-400">rituals logged</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Lifelong habit repetitions</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-400">Player Level</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">Lvl {user.level}</span>
            <span className="text-xs text-emerald-400 font-semibold">{user.xp} XP</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{150 - (user.xp % 150)} XP to next level</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-rose-400">Top Streak</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">
              {sortedByStreak[0]?.stats.currentStreak || 0}d
            </span>
            <span className="text-xs text-slate-400">
              Best: {sortedByStreak[0]?.stats.longestStreak || 0}d
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 truncate">
            {sortedByStreak[0]?.habit.title || 'None active'}
          </p>
        </div>
      </div>

      {/* Grid: Consistency Ranking & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Habit Consistency Ranking */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-100">Consistency Ranking</h3>
              <p className="text-xs text-slate-400">Habits ranked by 30-day completion reliability</p>
            </div>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>

          <div className="space-y-3.5 pt-2">
            {sortedByRate.map(({ habit, stats }) => (
              <div key={habit.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center border"
                      style={{
                        backgroundColor: `${habit.color}15`,
                        borderColor: `${habit.color}35`,
                        color: habit.color,
                      }}
                    >
                      <HabitIcon name={habit.icon} size={15} color={habit.color} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200">{habit.title}</span>
                      <span className="text-[11px] text-slate-500 ml-2 capitalize">({habit.category})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold">
                    {stats.currentStreak > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {stats.currentStreak}d
                      </span>
                    )}
                    <span className="text-indigo-400 font-bold">{stats.completionRate30d}%</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.completionRate30d}%`,
                      backgroundColor: habit.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution & Gamification Badges */}
        <div className="lg:col-span-4 space-y-6">
          {/* Categories */}
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-slate-100">Life Balance Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution across routine dimensions</p>

            <div className="space-y-3 pt-2">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / activeHabits.length) * 100);
                const style = CATEGORY_COLORS[cat] || CATEGORY_COLORS.productivity;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="capitalize text-slate-300">{cat}</span>
                      <span className="text-slate-400">{count} habits ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: style.accent,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges */}
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-slate-100">Milestone Trophies</h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {achievements.map((ach) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-2xl border text-center transition ${
                      ach.unlocked
                        ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-600 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                        ach.unlocked ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold leading-tight truncate">{ach.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{ach.desc}</div>
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
