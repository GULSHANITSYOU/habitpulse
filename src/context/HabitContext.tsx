import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Habit, HabitLog, UserProfile, HabitCategory, TimeOfDay, HabitStats } from '../types/habit';
import {
  loadHabitsFromStorage,
  saveHabitsToStorage,
  loadLogsFromStorage,
  saveLogsToStorage,
  loadUserFromStorage,
  saveUserToStorage,
  getInitialSeedData,
} from '../utils/storage';
import {
  getTodayKey,
  parseDateKey,
  isHabitScheduledForDate,
  calculateHabitStreaks,
  calculateCompletionRate,
} from '../utils/dateUtils';
import { soundFx } from '../utils/audio';

interface HabitContextType {
  habits: Habit[];
  logs: HabitLog[];
  user: UserProfile;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeTab: 'today' | 'weekly' | 'heatmap' | 'analytics' | 'manage';
  setActiveTab: (tab: 'today' | 'weekly' | 'heatmap' | 'analytics' | 'manage') => void;
  filterCategory: HabitCategory | 'all';
  setFilterCategory: (cat: HabitCategory | 'all') => void;
  filterTimeOfDay: TimeOfDay | 'all';
  setFilterTimeOfDay: (time: TimeOfDay | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleArchiveHabit: (id: string) => void;
  toggleHabitCompletion: (habitId: string, dateStr?: string) => void;
  setHabitNumericValue: (habitId: string, value: number, dateStr?: string) => void;
  incrementHabitValue: (habitId: string, delta: number, dateStr?: string) => void;
  updateHabitNotes: (habitId: string, notes: string, dateStr?: string) => void;
  
  // Settings & Storage
  resetToDefaults: () => void;
  importData: (jsonStr: string) => boolean;
  exportData: () => string;
  loadTemplate: (templates: Partial<Habit>[]) => void;
  toggleSound: () => void;
  toggleTheme: () => void;
  triggerConfetti: () => void;
  
  // Helpers & Stats
  getHabitStats: (habit: Habit) => HabitStats;
  getHabitLog: (habitId: string, dateStr?: string) => HabitLog | undefined;
  todaySummary: {
    scheduled: number;
    completed: number;
    rate: number;
  };
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabitsFromStorage());
  const [logs, setLogs] = useState<HabitLog[]>(() => loadLogsFromStorage());
  const [user, setUser] = useState<UserProfile>(() => loadUserFromStorage());

  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'heatmap' | 'analytics' | 'manage'>('today');
  const [filterCategory, setFilterCategory] = useState<HabitCategory | 'all'>('all');
  const [filterTimeOfDay, setFilterTimeOfDay] = useState<TimeOfDay | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist habits on change
  useEffect(() => {
    saveHabitsToStorage(habits);
  }, [habits]);

  // Persist logs on change
  useEffect(() => {
    saveLogsToStorage(logs);
  }, [logs]);

  // Persist user and apply dark/light class
  useEffect(() => {
    saveUserToStorage(user);
    if (user.darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [user]);

  // Confetti helper
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
      });
    } catch {
      // Ignored
    }
  }, []);

  // Award XP and calculate levels (100 XP per level)
  const addXp = useCallback((amount: number) => {
    setUser((prev) => {
      const newXp = Math.max(0, prev.xp + amount);
      const newLevel = Math.floor(newXp / 150) + 1;
      const leveledUp = newLevel > prev.level;

      if (leveledUp) {
        soundFx.playLevelUp(prev.soundEnabled);
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
      }
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
    });
  }, []);

  // Get log for specific habit and date
  const getHabitLog = useCallback((habitId: string, dateStr?: string): HabitLog | undefined => {
    const targetDate = dateStr || selectedDate;
    return logs.find((l) => l.habitId === habitId && l.date === targetDate);
  }, [logs, selectedDate]);

  // Toggle habit completion (checkbox style or marks full target)
  const toggleHabitCompletion = useCallback((habitId: string, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    soundFx.playTap(user.soundEnabled);

    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex((l) => l.habitId === habitId && l.date === targetDate);
      const wasCompleted = existingIndex >= 0 ? prevLogs[existingIndex].completed : false;
      const willBeCompleted = !wasCompleted;

      let updated: HabitLog[];

      if (existingIndex >= 0) {
        const existing = prevLogs[existingIndex];
        const newLog: HabitLog = {
          ...existing,
          completed: willBeCompleted,
          value: willBeCompleted ? (habit.habitType === 'numeric' ? habit.targetValue : 1) : 0,
          completedAt: willBeCompleted ? new Date().toISOString() : undefined,
        };
        updated = [...prevLogs];
        updated[existingIndex] = newLog;
      } else {
        const newLog: HabitLog = {
          id: `log-${habitId}-${targetDate}`,
          habitId,
          date: targetDate,
          completed: willBeCompleted,
          value: willBeCompleted ? (habit.habitType === 'numeric' ? habit.targetValue : 1) : 0,
          completedAt: willBeCompleted ? new Date().toISOString() : undefined,
        };
        updated = [...prevLogs, newLog];
      }

      if (willBeCompleted) {
        soundFx.playCompletion(user.soundEnabled);
        triggerConfetti();
        addXp(30);
      } else {
        addXp(-30);
      }

      return updated;
    });
  }, [habits, selectedDate, user.soundEnabled, triggerConfetti, addXp]);

  // Set numeric value directly (for counter / progress habits)
  const setHabitNumericValue = useCallback((habitId: string, val: number, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const clampedValue = Math.max(0, val);
    const isCompleted = clampedValue >= habit.targetValue;

    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex((l) => l.habitId === habitId && l.date === targetDate);
      const wasCompleted = existingIndex >= 0 ? prevLogs[existingIndex].completed : false;

      let updated: HabitLog[];

      if (existingIndex >= 0) {
        const existing = prevLogs[existingIndex];
        updated = [...prevLogs];
        updated[existingIndex] = {
          ...existing,
          value: clampedValue,
          completed: isCompleted,
          completedAt: isCompleted ? (existing.completedAt || new Date().toISOString()) : undefined,
        };
      } else {
        const newLog: HabitLog = {
          id: `log-${habitId}-${targetDate}`,
          habitId,
          date: targetDate,
          value: clampedValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
        };
        updated = [...prevLogs, newLog];
      }

      if (isCompleted && !wasCompleted) {
        soundFx.playCompletion(user.soundEnabled);
        triggerConfetti();
        addXp(30);
      } else if (!isCompleted && wasCompleted) {
        addXp(-30);
      } else {
        soundFx.playTap(user.soundEnabled);
      }

      return updated;
    });
  }, [habits, selectedDate, user.soundEnabled, triggerConfetti, addXp]);

  // Increment or decrement habit numeric progress
  const incrementHabitValue = useCallback((habitId: string, delta: number, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    const currentLog = getHabitLog(habitId, targetDate);
    const currentValue = currentLog?.value || 0;
    setHabitNumericValue(habitId, currentValue + delta, targetDate);
  }, [selectedDate, getHabitLog, setHabitNumericValue]);

  // Update note on habit log
  const updateHabitNotes = useCallback((habitId: string, notes: string, dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    setLogs((prevLogs) => {
      const existingIndex = prevLogs.findIndex((l) => l.habitId === habitId && l.date === targetDate);
      if (existingIndex >= 0) {
        const updated = [...prevLogs];
        updated[existingIndex] = { ...updated[existingIndex], notes };
        return updated;
      } else {
        const newLog: HabitLog = {
          id: `log-${habitId}-${targetDate}`,
          habitId,
          date: targetDate,
          completed: false,
          value: 0,
          notes,
        };
        return [...prevLogs, newLog];
      }
    });
  }, [selectedDate]);

  // Create habit
  const addHabit = useCallback((data: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => {
    const newHabit: Habit = {
      ...data,
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setHabits((prev) => [newHabit, ...prev]);
    soundFx.playTap(user.soundEnabled);
    addXp(15);
  }, [user.soundEnabled, addXp]);

  // Update habit
  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Delete habit and associated logs
  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Toggle archive status
  const toggleArchiveHabit = useCallback((id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, archived: !h.archived } : h)));
    soundFx.playTap(user.soundEnabled);
  }, [user.soundEnabled]);

  // Load preset templates
  const loadTemplate = useCallback((templates: Partial<Habit>[]) => {
    const newHabits: Habit[] = templates.map((tpl) => ({
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: tpl.title || 'New Habit',
      description: tpl.description || '',
      category: tpl.category || 'productivity',
      color: tpl.color || '#6366f1',
      icon: tpl.icon || 'Sparkles',
      frequencyType: tpl.frequencyType || 'daily',
      customDays: tpl.customDays,
      habitType: tpl.habitType || 'boolean',
      targetValue: tpl.targetValue || 1,
      unit: tpl.unit,
      timeOfDay: tpl.timeOfDay || 'anytime',
      archived: false,
      createdAt: new Date().toISOString(),
    }));

    setHabits((prev) => [...newHabits, ...prev]);
    soundFx.playLevelUp(user.soundEnabled);
    triggerConfetti();
  }, [user.soundEnabled, triggerConfetti]);

  // Reset all data to rich seed demo
  const resetToDefaults = useCallback(() => {
    const initial = getInitialSeedData();
    setHabits(initial.habits);
    setLogs(initial.logs);
    setUser(initial.user);
    soundFx.playTap(true);
  }, []);

  // Export JSON
  const exportData = useCallback((): string => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      logs,
      user,
    };
    return JSON.stringify(data, null, 2);
  }, [habits, logs, user]);

  // Import JSON
  const importData = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.habits)) {
        setHabits(parsed.habits);
      }
      if (Array.isArray(parsed.logs)) {
        setLogs(parsed.logs);
      }
      if (parsed.user) {
        setUser(parsed.user);
      }
      soundFx.playLevelUp(user.soundEnabled);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }, [user.soundEnabled]);

  const toggleSound = useCallback(() => {
    setUser((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleTheme = useCallback(() => {
    setUser((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  // Compute stats for any habit
  const getHabitStats = useCallback((habit: Habit): HabitStats => {
    const { currentStreak, longestStreak } = calculateHabitStreaks(habit, logs);
    const completionRate30d = calculateCompletionRate(habit, logs, 30);
    const weeklyRate = calculateCompletionRate(habit, logs, 7);
    const todayLog = logs.find((l) => l.habitId === habit.id && l.date === getTodayKey());
    const totalCompletions = logs.filter((l) => l.habitId === habit.id && l.completed).length;

    return {
      currentStreak,
      longestStreak,
      totalCompletions,
      completionRate30d,
      weeklyRate,
      isCompletedToday: Boolean(todayLog?.completed),
      todayValue: todayLog?.value || 0,
    };
  }, [logs]);

  // Summary of selected day
  const todaySummary = useMemo(() => {
    const targetDateObj = parseDateKey(selectedDate);
    const activeHabits = habits.filter((h) => !h.archived);
    const scheduled = activeHabits.filter((h) => isHabitScheduledForDate(h, targetDateObj));
    const completed = scheduled.filter((h) => {
      const log = logs.find((l) => l.habitId === h.id && l.date === selectedDate);
      return Boolean(log?.completed);
    }).length;

    const rate = scheduled.length > 0 ? Math.round((completed / scheduled.length) * 100) : 0;
    return {
      scheduled: scheduled.length,
      completed,
      rate,
    };
  }, [habits, logs, selectedDate]);

  return (
    <HabitContext.Provider
      value={{
        habits,
        logs,
        user,
        selectedDate,
        setSelectedDate,
        activeTab,
        setActiveTab,
        filterCategory,
        setFilterCategory,
        filterTimeOfDay,
        setFilterTimeOfDay,
        searchQuery,
        setSearchQuery,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleArchiveHabit,
        toggleHabitCompletion,
        setHabitNumericValue,
        incrementHabitValue,
        updateHabitNotes,
        resetToDefaults,
        importData,
        exportData,
        loadTemplate,
        toggleSound,
        toggleTheme,
        triggerConfetti,
        getHabitStats,
        getHabitLog,
        todaySummary,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
