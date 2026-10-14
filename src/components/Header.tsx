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

  // Highest streak across active habits
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
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/80 border-b border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-white/20 transition-transform hover:scale-105">
                <Sparkles className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                    HabitPulse
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/15">
                    Minimal
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-zinc-400 font-medium">Neat & Focused Daily Routine</p>
              </div>
            </div>

            {/* Level & Streaks Minimal Pill */}
            <div className="hidden md:flex items-center gap-4 bg-zinc-900/80 border border-white/10 rounded-2xl px-4 py-1.5 shadow-md shadow-black/40">
              {/* Level & XP */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold gap-3">
                    <span className="text-zinc-200">Level {user.level}</span>
                    <span className="text-[11px] text-zinc-400">{xpCurrentLevel}/150 XP</span>
                  </div>
                  <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-white transition-all duration-500 rounded-full shadow-sm shadow-white/50"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="w-px h-5 bg-white/10" />

              {/* Best Current Streak */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Flame className="w-4 h-4 fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                <span>{maxStreak}d Streak</span>
              </div>
            </div>

            {/* Quick Actions & Utilities */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                title={user.soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
                className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition"
              >
                {user.soundEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={user.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition"
              >
                {user.darkMode ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-zinc-900" />}
              </button>

              {/* Backup & Import Button */}
              <button
                onClick={() => setIsBackupModalOpen(true)}
                title="Backup & Restore Data"
                className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* + New Habit Button (Stark white with bright shadow) */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-white/15 active:scale-95 transition-all duration-200 hover:shadow-white/25"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">New Habit</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar border-t border-white/5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-md shadow-white/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950 stroke-[2.5]' : 'text-zinc-400'}`} />
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
