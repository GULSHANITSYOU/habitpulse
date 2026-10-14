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
  "Small disciplines repeated with consistency every day lead to great achievements. — John C. Maxwell",
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

  const changeDate = (days: number) => {
    const current = parseDateKey(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDateKey(current));
  };

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
    { id: 'morning', label: 'Morning', icon: <Sunrise className="w-3.5 h-3.5" /> },
    { id: 'afternoon', label: 'Afternoon', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'evening', label: 'Evening', icon: <Sunset className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Date Switcher & Search Bar */}
      <div className="card-neo rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 shadow-sm">
            <CalendarIcon className="w-4 h-4 text-white" />
            <span className="font-bold text-sm sm:text-base text-white tracking-tight">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayKey())}
              className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition shadow-sm"
            >
              Today
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition shadow-inner"
          />
        </div>
      </div>

      {/* Hero Stats Card: Minimalist Bright-Shadow Card */}
      <div className="card-neo card-active rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle glowing ambient light in the corner */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Progress & Counter */}
          <div className="md:col-span-5 flex items-center gap-6">
            {/* Radial Ring */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-white transition-all duration-700 ease-out"
                  strokeDasharray={`${todaySummary.rate}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-white tracking-tight">{todaySummary.rate}%</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Done</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {todaySummary.completed} / {todaySummary.scheduled}
                </h2>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                {todaySummary.rate === 100
                  ? "Flawless execution! All rituals completed today."
                  : todaySummary.rate >= 50
                  ? "Strong momentum. Keep the focus sharp."
                  : "Every small step compounds. Keep showing up."}
              </p>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="md:col-span-7 md:border-l md:border-white/10 md:pl-8">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Daily Principle</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 italic font-normal leading-relaxed">
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                filterTimeOfDay === tf.id
                  ? 'bg-white text-zinc-950 shadow-md shadow-white/10 font-bold'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {tf.icon}
              <span>{tf.label}</span>
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                filterCategory === cat.id
                  ? 'bg-white text-zinc-950 shadow-sm font-bold'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5'
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
