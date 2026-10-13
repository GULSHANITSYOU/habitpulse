import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Sparkles,
  TrendingUp,
  Sun,
  Sunrise,
  Sunset,
  Clock,
  Filter,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { formatDisplayDate, formatDateKey, parseDateKey, getTodayKey } from '../utils/dateUtils';
import type { HabitCategory, TimeOfDay } from '../types/habit';

const MOTIVATIONAL_QUOTES = [
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Will Durant",
  "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time. — John C. Maxwell",
  "You do not rise to the level of your goals. You fall to the level of your systems. — James Clear",
  "The secret of your future is hidden in your daily routine. — Mike Murdock",
  "Motivation is what gets you started. Habit is what keeps you going. — Jim Ryun",
  "Success is the product of daily habits—not once-in-a-lifetime transformations. — Atomic Habits",
];

export const DailyOverview: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    filterCategory,
    setFilterCategory,
    filterTimeOfDay,
    setFilterTimeOfDay,
    searchQuery,
    setSearchQuery,
    todaySummary,
  } = useHabits();

  const isToday = selectedDate === getTodayKey();

  // Navigate date backwards/forwards
  const changeDate = (days: number) => {
    const current = parseDateKey(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDateKey(current));
  };

  // Daily quote selection based on selected day index
  const quote = useMemo(() => {
    const dateNum = parseDateKey(selectedDate).getDate();
    return MOTIVATIONAL_QUOTES[dateNum % MOTIVATIONAL_QUOTES.length];
  }, [selectedDate]);

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

  const timeFilters: { id: TimeOfDay | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Day', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'morning', label: 'Morning', icon: <Sunrise className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'afternoon', label: 'Afternoon', icon: <Sun className="w-3.5 h-3.5 text-orange-400" /> },
    { id: 'evening', label: 'Evening', icon: <Sunset className="w-3.5 h-3.5 text-indigo-400" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar: Date Switcher & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
        
        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-sm sm:text-base text-slate-100">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayKey())}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition"
            >
              Back to Today
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Hero Stats Card: Progress Ring & Motivation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 border border-slate-800/80 p-6 sm:p-8 shadow-xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Progress & Counter */}
          <div className="md:col-span-4 flex items-center gap-5">
            {/* Radial Ring */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-500 transition-all duration-700 ease-out"
                  strokeDasharray={`${todaySummary.rate}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-100">{todaySummary.rate}%</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Done</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">
                  {todaySummary.completed} of {todaySummary.scheduled}
                </h2>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {todaySummary.rate === 100
                  ? "🎉 Incredible! All rituals completed for today!"
                  : todaySummary.rate >= 50
                  ? "Great momentum! Keep pushing through."
                  : "Every small step compounds. Let's make it count."}
              </p>
            </div>
          </div>

          {/* Motivational Quote & Focus */}
          <div className="md:col-span-8 md:border-l md:border-slate-800 md:pl-8">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Wisdom</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              "{quote}"
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs: Time of Day & Categories */}
      <div className="space-y-3">
        {/* Time of Day Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {timeFilters.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setFilterTimeOfDay(tf.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                filterTimeOfDay === tf.id
                  ? 'bg-slate-100 text-slate-900 shadow-sm font-semibold'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tf.icon}
              <span>{tf.label}</span>
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterCategory === cat.id
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
