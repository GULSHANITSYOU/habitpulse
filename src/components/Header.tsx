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
  RotateCcw,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { HabitModal } from './HabitModal';
import { ExportImportModal } from './ExportImportModal';
import { ResetSystemModal } from './ResetSystemModal';

export const Header: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    toggleSound,
    toggleTheme,
    habits,
    getHabitStats,
    resetFullSystem,
  } = useHabits();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const activeHabits = habits.filter((h) => !h.archived);
  const maxStreak = activeHabits.reduce((max, h) => {
    const stats = getHabitStats(h);
    return Math.max(max, stats.currentStreak);
  }, 0);

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
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-black/95 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black shadow-sm transition-transform hover:scale-105">
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-black dark:text-white">
                    HabitPulse
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
                    Pro
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400 font-medium">Neat & Focused Daily Routine</p>
              </div>
            </div>

            {/* Level & Streaks Minimal Pill */}
            <div className="hidden md:flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-1.5 shadow-sm">
              {/* Level & XP */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-black dark:text-white">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold gap-3">
                    <span className="text-black dark:text-white">Level {user.level}</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{xpCurrentLevel}/150 XP</span>
                  </div>
                  <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-black dark:bg-white transition-all duration-500 rounded-full"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700" />

              {/* Best Current Streak */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white">
                <Flame className="w-4 h-4 fill-black text-black dark:fill-white dark:text-white" />
                <span>{maxStreak}d Streak</span>
              </div>
            </div>

            {/* Quick Actions & Utilities */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                title={user.soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
                className="p-2 sm:p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
              >
                {user.soundEnabled ? <Volume2 className="w-4 h-4 text-black dark:text-white" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={user.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 sm:p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
              >
                {user.darkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-black" />}
              </button>

              {/* Backup & Import Button */}
              <button
                onClick={() => setIsBackupModalOpen(true)}
                title="Backup & Restore Data"
                className="p-2 sm:p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Reset Full System Button */}
              <button
                onClick={() => setIsResetModalOpen(true)}
                title="Reset Full System & Restart"
                className="p-2 sm:p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* + New Habit Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-2.5 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all duration-150"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">New Habit</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar border-t border-zinc-200 dark:border-zinc-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
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
      {isResetModalOpen && (
        <ResetSystemModal
          isOpen={isResetModalOpen}
          onConfirm={() => {
            resetFullSystem();
            setIsResetModalOpen(false);
          }}
          onCancel={() => setIsResetModalOpen(false)}
        />
      )}
    </>
  );
};
