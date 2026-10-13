import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Plus,
  Download,
  Calendar,
  Grid,
  BarChart3,
  ListTodo,
  Flame,
  Award,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { HabitModal } from './HabitModal';
import { ExportImportModal } from './ExportImportModal';

export const Header: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    toggleSound,
    toggleTheme,
    habits,
    getHabitStats,
  } = useHabits();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Calculate highest current streak across active habits
  const activeHabits = habits.filter((h) => !h.archived);
  const maxStreak = activeHabits.reduce((max, h) => {
    const stats = getHabitStats(h);
    return Math.max(max, stats.currentStreak);
  }, 0);

  // XP Progress towards next level
  const xpCurrentLevel = user.xp % 150;
  const xpPercent = Math.min(100, Math.round((xpCurrentLevel / 150) * 100));

  const navItems = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'weekly', label: 'Weekly Grid', icon: Grid },
    { id: 'heatmap', label: 'Heatmap', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'manage', label: 'All Habits', icon: ListTodo },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                    HabitPulse
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Pro
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-slate-400">Master Your Daily Rituals</p>
              </div>
            </div>

            {/* Gamification & Streaks Pill */}
            <div className="hidden md:flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3.5 py-1.5 shadow-inner">
              {/* Level & XP */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold gap-2">
                    <span className="text-slate-200">Level {user.level}</span>
                    <span className="text-[11px] text-indigo-400">{xpCurrentLevel}/150 XP</span>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-800" />

              {/* Best Current Streak */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
                <span>{maxStreak}d Streak</span>
              </div>
            </div>

            {/* Quick Actions & Utilities */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                title={user.soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition"
              >
                {user.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={user.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition"
              >
                {user.darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Backup & Import Button */}
              <button
                onClick={() => setIsBackupModalOpen(true)}
                title="Backup & Restore Data"
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* + New Habit Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">New Habit</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar border-t border-slate-900/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Modals */}
      {isAddModalOpen && <HabitModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />}
      {isBackupModalOpen && <ExportImportModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />}
    </>
  );
};
