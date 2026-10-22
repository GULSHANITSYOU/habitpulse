import React, { useState } from 'react';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/react';
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
  CheckSquare,
  LogIn,
  Cloud,
  HardDrive,
  Crown,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  SlidersHorizontal,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import type { ActiveTabType } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { HabitModal } from './HabitModal';
import { ExportImportModal } from './ExportImportModal';
import { ResetSystemModal } from './ResetSystemModal';
import { TabReorderModal } from './TabReorderModal';

const DEFAULT_TAB_ORDER: ActiveTabType[] = [
  'today',
  'locked_in',
  'weekly',
  'heatmap',
  'todos',
  'ideas',
  'analytics',
  'manage',
];

export const Header: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    toggleSound,
    toggleTheme,
    habits,
    todos,
    ideas,
    getHabitStats,
    resetFullSystem,
  } = useHabits();

  const {
    isPremium,
    isLifetime,
    cloudSyncStatus,
    openPricingModal,
  } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isTabReorderModalOpen, setIsTabReorderModalOpen] = useState(false);

  const [tabOrder, setTabOrder] = useState<ActiveTabType[]>(() => {
    try {
      const saved = localStorage.getItem('habitpulse_tab_order_v1');
      if (saved) {
        const parsed: ActiveTabType[] = JSON.parse(saved);
        const valid = parsed.filter((id) => DEFAULT_TAB_ORDER.includes(id));
        const missing = DEFAULT_TAB_ORDER.filter((id) => !valid.includes(id));
        return [...valid, ...missing];
      }
    } catch {}
    return DEFAULT_TAB_ORDER;
  });

  const saveTabOrder = (newOrder: ActiveTabType[]) => {
    setTabOrder(newOrder);
    try {
      localStorage.setItem('habitpulse_tab_order_v1', JSON.stringify(newOrder));
    } catch {}
  };

  const resetTabOrder = () => {
    saveTabOrder(DEFAULT_TAB_ORDER);
  };

  // Drag and Drop for Tabs
  const [draggedTabId, setDraggedTabId] = useState<ActiveTabType | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<ActiveTabType | null>(null);

  const handleTabDragStart = (e: React.DragEvent, id: ActiveTabType) => {
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleTabDragOver = (e: React.DragEvent, id: ActiveTabType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTabId !== id) {
      setDragOverTabId(id);
    }
  };

  const handleTabDrop = (e: React.DragEvent, targetId: ActiveTabType) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetId) {
      setDraggedTabId(null);
      setDragOverTabId(null);
      return;
    }

    const currentList = [...tabOrder];
    const sourceIndex = currentList.indexOf(draggedTabId);
    const targetIndex = currentList.indexOf(targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [moved] = currentList.splice(sourceIndex, 1);
      currentList.splice(targetIndex, 0, moved);
      saveTabOrder(currentList);
    }

    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const handleTabDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const activeHabits = habits.filter((h) => !h.archived);
  const activeTodosCount = todos.filter((t) => !t.completed).length;

  const maxStreak = activeHabits.reduce((max, h) => {
    const stats = getHabitStats(h);
    return Math.max(max, stats.currentStreak);
  }, 0);

  const xpCurrentLevel = user.xp % 150;
  const xpPercent = Math.min(100, Math.round((xpCurrentLevel / 150) * 100));

  const allNavMap: Record<
    ActiveTabType,
    { id: ActiveTabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }
  > = {
    today: { id: 'today', label: 'Today', icon: Calendar },
    locked_in: { id: 'locked_in', label: 'Locked In', icon: Flame },
    weekly: { id: 'weekly', label: 'Weekly Grid', icon: Grid },
    heatmap: { id: 'heatmap', label: 'Heatmap', icon: Sparkles },
    todos: { id: 'todos', label: 'To-Dos', icon: CheckSquare, badge: activeTodosCount > 0 ? activeTodosCount : undefined },
    ideas: { id: 'ideas', label: 'Ideas Vault', icon: Lightbulb, badge: ideas.length > 0 ? ideas.length : undefined },
    analytics: { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    manage: { id: 'manage', label: 'All Habits', icon: ListTodo },
  };

  const orderedNavItems = tabOrder.map((id) => allNavMap[id]).filter(Boolean);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-black/95 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-2 sm:gap-4">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black shadow-sm transition-transform hover:scale-105 shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-sm sm:text-xl tracking-tight text-black dark:text-white">
                    HabitPulse
                  </span>
                  {isLifetime ? (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] uppercase font-black tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                      <span>Lifetime</span>
                    </span>
                  ) : isPremium ? (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] uppercase font-black tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                      <span>Pro</span>
                    </span>
                  ) : (
                    <button
                      onClick={openPricingModal}
                      className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition"
                    >
                      <span>Free</span>
                      <span className="text-[9px] opacity-70">• Upgrade</span>
                    </button>
                  )}
                </div>
                <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400 font-medium">Neat & Focused Daily Routine</p>
              </div>
            </div>

            {/* Level & Streaks Minimal Pill (Desktop) */}
            <div className="hidden lg:flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-1.5 shadow-sm">
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

            {/* Right Side: Storage/Cloud Status, Quick Utilities, Auth & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

              {/* Cloud Sync Status Indicator */}
              {isPremium ? (
                <div
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white"
                  title="Your data is synchronized with your Supabase database in the cloud"
                >
                  {cloudSyncStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-500 dark:text-zinc-400" />
                      <span className="text-[11px]">Syncing...</span>
                    </>
                  ) : cloudSyncStatus === 'error' ? (
                    <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                      <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-[11px]">Syncing</span>
                    </div>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 fill-black text-black dark:fill-white dark:text-white" />
                      <span className="text-[11px]">{isLifetime ? 'Lifetime Cloud' : 'Cloud Synced'}</span>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={openPricingModal}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition"
                  title="Stored in browser. Upgrade to cloud sync to access across devices."
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Local Storage</span>
                </button>
              )}

              {/* Upgrade to Pro Button (Only for free tier users) */}
              {!isPremium && !isLifetime && (
                <button
                  onClick={openPricingModal}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:opacity-85 transition active:scale-95 shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  <span>Pro</span>
                </button>
              )}

              {/* Sound Toggle (hidden on mobile) */}
              <button
                onClick={toggleSound}
                title={user.soundEnabled ? 'Disable Sounds' : 'Enable Sounds'}
                className="hidden sm:flex p-2 sm:p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
              >
                {user.soundEnabled ? <Volume2 className="w-4 h-4 text-black dark:text-white" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={user.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-1.5 sm:p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition shrink-0"
              >
                {user.darkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-black" />}
              </button>

              {/* Backup & Import Button */}
              <button
                onClick={() => setIsBackupModalOpen(true)}
                title="Backup & Restore Data"
                className="hidden sm:flex p-2 sm:p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Reset Full System Button */}
              <button
                onClick={() => setIsResetModalOpen(true)}
                title="Reset Full System & Restart"
                className="hidden sm:flex p-2 sm:p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Clerk Auth Controls */}
              <Show when="signed-out">
                <div className="flex items-center gap-1 shrink-0">
                  <SignInButton mode="modal">
                    <button className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition active:scale-95 shrink-0">
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-85 transition active:scale-95 shrink-0">
                      <span>Sign Up</span>
                    </button>
                  </SignUpButton>
                </div>
              </Show>

              <Show when="signed-in">
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'w-7 h-7 sm:w-8 sm:h-8 rounded-xl ring-2 ring-zinc-200 dark:ring-zinc-800',
                      },
                    }}
                  />
                </div>
              </Show>

              {/* + New Habit Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                aria-label="New Habit"
                className="flex items-center justify-center p-2 sm:px-4 sm:py-2.5 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all duration-150 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline sm:ml-1.5">New Habit</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 sm:py-2.5 no-scrollbar border-t border-zinc-200 dark:border-zinc-800 -mx-3 px-3 sm:mx-0 sm:px-0">
            {orderedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDragging = draggedTabId === item.id;
              const isDragOver = dragOverTabId === item.id;

              return (
                <button
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleTabDragStart(e, item.id)}
                  onDragOver={(e) => handleTabDragOver(e, item.id)}
                  onDrop={(e) => handleTabDrop(e, item.id)}
                  onDragEnd={handleTabDragEnd}
                  onClick={() => setActiveTab(item.id)}
                  title={`${item.label} (Drag to rearrange)`}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  } ${
                    isDragging ? 'opacity-30 scale-95 border-dashed border-zinc-400 dark:border-zinc-600' : ''
                  } ${
                    isDragOver ? 'ring-2 ring-black dark:ring-white scale-105 shadow-md' : ''
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Rearrange / Customize Tabs Modal Trigger */}
            <button
              onClick={() => setIsTabReorderModalOpen(true)}
              title="Rearrange / Customize Navigation Tabs"
              className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition ml-1 shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </header>

      {/* Modals */}
      {isAddModalOpen && <HabitModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />}
      {isBackupModalOpen && <ExportImportModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />}
      {isTabReorderModalOpen && (
        <TabReorderModal
          isOpen={isTabReorderModalOpen}
          onClose={() => setIsTabReorderModalOpen(false)}
          tabOrder={tabOrder}
          onReorder={saveTabOrder}
          onReset={resetTabOrder}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsTabReorderModalOpen(false);
          }}
        />
      )}
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
