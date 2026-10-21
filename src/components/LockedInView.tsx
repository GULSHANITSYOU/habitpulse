import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Flame,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Timer,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Trash2,
  Search,
  Sparkles,
  BookOpen,
  Code,
  GraduationCap,
  Brain,
  History,
  X,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { soundFx } from '../utils/audio';

const TOPIC_PRESETS = [
  { name: 'Research', icon: Search },
  { name: 'Studying', icon: GraduationCap },
  { name: 'Reading', icon: BookOpen },
  { name: 'Coding', icon: Code },
  { name: 'Deep Work', icon: Brain },
  { name: 'Writing', icon: Sparkles },
];

const TIMER_PRESETS = [
  { minutes: 15, label: '15m', desc: 'Sprint' },
  { minutes: 25, label: '25m', desc: 'Pomodoro' },
  { minutes: 30, label: '30m', desc: 'Standard' },
  { minutes: 45, label: '45m', desc: 'Deep' },
  { minutes: 60, label: '60m', desc: 'Hour' },
  { minutes: 90, label: '90m', desc: 'Ultradian' },
];

export const LockedInView: React.FC = () => {
  const { focusSessions, addFocusSession, deleteFocusSession, clearFocusSessions, user } = useHabits();

  // Mode: Timer (countdown) or Stopwatch (count up)
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');

  // Topic / Reason
  const [topic, setTopic] = useState<string>('Research');
  const [customTopicInput, setCustomTopicInput] = useState<string>('');

  // Timer configuration
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);

  // Stopwatch counter
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);

  // Running state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Ambient sound state
  const [isAmbientOn, setIsAmbientOn] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Log filter / search
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilterMode, setHistoryFilterMode] = useState<'all' | 'timer' | 'stopwatch'>('all');

  // Completion note modal
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completedSessionData, setCompletedSessionData] = useState<{
    topic: string;
    mode: 'timer' | 'stopwatch';
    durationSeconds: number;
    durationMinutes: number;
    targetMinutes?: number;
    startedAt: string;
  } | null>(null);
  const [sessionNote, setSessionNote] = useState<string>('');

  // Interval reference
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeTopic = customTopicInput.trim() || topic;

  // Sync timer remaining whenever target minutes changes and timer is NOT running
  useEffect(() => {
    if (mode === 'timer' && !isRunning) {
      setSecondsRemaining(targetMinutes * 60);
    }
  }, [targetMinutes, mode, isRunning]);

  // Main tick loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (mode === 'timer') {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              // Timer finished!
              clearInterval(intervalRef.current!);
              setIsRunning(false);
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        } else {
          setStopwatchSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode]);

  // Update browser tab document title during active focus
  useEffect(() => {
    const originalTitle = document.title;
    if (isRunning) {
      if (mode === 'timer') {
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.title = `(${timeStr}) 🔥 Locked In: ${activeTopic}`;
      } else {
        const mins = Math.floor(stopwatchSeconds / 60);
        const secs = stopwatchSeconds % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.title = `(${timeStr}) ⏱️ ${activeTopic} | HabitPulse`;
      }
    } else {
      document.title = 'HabitPulse — Modern Daily Habit & Routine Tracker';
    }

    return () => {
      document.title = originalTitle;
    };
  }, [isRunning, secondsRemaining, stopwatchSeconds, mode, activeTopic]);

  // Clean up ambient sound on unmount
  useEffect(() => {
    return () => {
      soundFx.stopAmbient();
    };
  }, []);

  const toggleAmbientSound = () => {
    if (isAmbientOn) {
      soundFx.stopAmbient();
      setIsAmbientOn(false);
    } else {
      soundFx.startBrownNoise();
      setIsAmbientOn(true);
    }
  };

  const handleStart = () => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date().toISOString());
    }
    soundFx.playFocusStart(user.soundEnabled);
    setIsRunning(true);
  };

  const handlePause = () => {
    soundFx.playTap(user.soundEnabled);
    setIsRunning(false);
  };

  const handleReset = () => {
    soundFx.playTap(user.soundEnabled);
    setIsRunning(false);
    setSessionStartTime(null);
    if (mode === 'timer') {
      setSecondsRemaining(targetMinutes * 60);
    } else {
      setStopwatchSeconds(0);
    }
  };

  // Called when countdown reaches 0 naturally
  const handleTimerComplete = () => {
    soundFx.playFocusComplete(user.soundEnabled);
    const durationSeconds = targetMinutes * 60;
    const durationMinutes = targetMinutes;

    setCompletedSessionData({
      topic: activeTopic,
      mode: 'timer',
      durationSeconds,
      durationMinutes,
      targetMinutes,
      startedAt: sessionStartTime || new Date(Date.now() - durationSeconds * 1000).toISOString(),
    });
    setShowCompletionModal(true);
  };

  // Called when user clicks "Stop & Log" manually
  const handleStopAndLog = () => {
    soundFx.playTap(user.soundEnabled);
    setIsRunning(false);

    let durationSeconds = 0;
    if (mode === 'timer') {
      durationSeconds = targetMinutes * 60 - secondsRemaining;
    } else {
      durationSeconds = stopwatchSeconds;
    }

    if (durationSeconds < 10) {
      // Very short session (<10s), just reset
      handleReset();
      return;
    }

    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

    setCompletedSessionData({
      topic: activeTopic,
      mode,
      durationSeconds,
      durationMinutes,
      targetMinutes: mode === 'timer' ? targetMinutes : undefined,
      startedAt: sessionStartTime || new Date(Date.now() - durationSeconds * 1000).toISOString(),
    });

    setShowCompletionModal(true);
  };

  const handleSaveCompletedSession = (notes?: string) => {
    if (!completedSessionData) return;

    addFocusSession({
      topic: completedSessionData.topic,
      mode: completedSessionData.mode,
      durationSeconds: completedSessionData.durationSeconds,
      durationMinutes: completedSessionData.durationMinutes,
      targetMinutes: completedSessionData.targetMinutes,
      completed: true,
      notes: notes?.trim() || undefined,
      startedAt: completedSessionData.startedAt,
      completedAt: new Date().toISOString(),
    });

    setShowCompletionModal(false);
    setCompletedSessionData(null);
    setSessionNote('');
    setSessionStartTime(null);

    if (mode === 'timer') {
      setSecondsRemaining(targetMinutes * 60);
    } else {
      setStopwatchSeconds(0);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Format time helpers
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = focusSessions.filter((s) => s.completedAt.startsWith(todayStr));

  const totalMinutesToday = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalHoursTodayFormatted = `${Math.floor(totalMinutesToday / 60)}h ${totalMinutesToday % 60}m`;

  const topicCounts = todaySessions.reduce((acc, s) => {
    acc[s.topic] = (acc[s.topic] || 0) + s.durationMinutes;
    return acc;
  }, {} as Record<string, number>);

  const topTopicToday = Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a])[0] || 'None yet';

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return focusSessions
      .filter((s) => {
        if (historyFilterMode !== 'all' && s.mode !== historyFilterMode) return false;
        if (historySearch.trim()) {
          const q = historySearch.toLowerCase();
          const matchTopic = s.topic.toLowerCase().includes(q);
          const matchNotes = (s.notes || '').toLowerCase().includes(q);
          if (!matchTopic && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [focusSessions, historyFilterMode, historySearch]);

  // Timer percentage for circular/linear progress
  const timerProgress = useMemo(() => {
    if (mode === 'stopwatch') return 100;
    const total = targetMinutes * 60;
    if (total === 0) return 0;
    return Math.min(100, Math.max(0, ((total - secondsRemaining) / total) * 100));
  }, [mode, targetMinutes, secondsRemaining]);

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Stats Overview */}
      <div className="p-5 sm:p-7 rounded-3xl card-neo flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
              <Flame className="w-3 h-3 fill-current text-white dark:text-black" />
              <span>Deep Focus Protocol</span>
            </span>
            <span className="text-xs text-zinc-500 font-semibold">• High-Output Flow State</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
            LOCKED IN
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Block distractions, commit to a reason, and log your concentrated study, research, and execution sessions.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-2xl shrink-0">
          <div className="text-center px-2">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Locked Today</span>
            <span className="text-sm sm:text-base font-black text-black dark:text-white tracking-tight">
              {totalHoursTodayFormatted}
            </span>
          </div>
          <div className="text-center px-2 border-x border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Sessions</span>
            <span className="text-sm sm:text-base font-black text-black dark:text-white tracking-tight">
              {todaySessions.length}
            </span>
          </div>
          <div className="text-center px-2">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider truncate max-w-[80px]">
              Top Focus
            </span>
            <span className="text-xs sm:text-sm font-black text-black dark:text-white tracking-tight truncate block max-w-[80px]">
              {topTopicToday}
            </span>
          </div>
        </div>
      </div>

      {/* Main Focus Console */}
      <div className="p-6 sm:p-10 rounded-3xl card-neo flex flex-col items-center justify-center relative overflow-hidden space-y-6">
        {/* Top Controls: Mode Switcher & Utilities */}
        <div className="w-full flex items-center justify-between gap-3 flex-wrap">
          {/* Mode Switch (Timer vs Stopwatch) */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-xs font-bold border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                if (isRunning) return;
                setMode('timer');
              }}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
                mode === 'timer'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Countdown Timer</span>
            </button>

            <button
              onClick={() => {
                if (isRunning) return;
                setMode('stopwatch');
              }}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
                mode === 'stopwatch'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Stopwatch</span>
            </button>
          </div>

          {/* Quick Action Utilities */}
          <div className="flex items-center gap-2">
            {/* Ambient Sound Toggle */}
            <button
              onClick={toggleAmbientSound}
              title={isAmbientOn ? 'Turn Off Brown Noise' : 'Play Deep Focus Brown Noise'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                isAmbientOn
                  ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white'
              }`}
            >
              {isAmbientOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Brown Noise</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Fullscreen Immersion Mode"
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Topic / Reason Input & Selection */}
        <div className="w-full max-w-lg space-y-2.5 text-center">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            What are you locking in for?
          </label>

          <div className="relative">
            <input
              type="text"
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              disabled={isRunning}
              placeholder={`Enter topic or choose below (e.g. ${topic})`}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-center font-bold text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition disabled:opacity-75"
            />
          </div>

          {/* Quick Topic Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {TOPIC_PRESETS.map((p) => {
              const Icon = p.icon;
              const isSelected = activeTopic === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => {
                    setTopic(p.name);
                    setCustomTopicInput(p.name);
                  }}
                  disabled={isRunning}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timer Duration Selection Chips (When in Timer Mode) */}
        {mode === 'timer' && !isRunning && (
          <div className="w-full max-w-md space-y-2 text-center pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Planned Duration
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TIMER_PRESETS.map((p) => {
                const isSelected = targetMinutes === p.minutes;
                return (
                  <button
                    key={p.minutes}
                    onClick={() => {
                      setTargetMinutes(p.minutes);
                      setSecondsRemaining(p.minutes * 60);
                    }}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black">{p.label}</span>
                    <span className="text-[9px] opacity-70">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Giant Time Display with Circular / Linear Progress */}
        <div className="py-4 sm:py-8 flex flex-col items-center justify-center">
          <div
            className="font-mono text-5xl sm:text-8xl font-black text-black dark:text-white tracking-tight select-none drop-shadow-xs"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {mode === 'timer' ? formatTime(secondsRemaining) : formatTime(stopwatchSeconds)}
          </div>

          {/* Mode and Status Tag */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              {isRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Locked In: {activeTopic}</span>
                </>
              ) : (
                <span>Ready to Focus: {activeTopic}</span>
              )}
            </span>
          </div>

          {/* Progress Bar (Timer Mode) */}
          {mode === 'timer' && (
            <div className="w-64 sm:w-80 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-5">
              <div
                className="h-full bg-black dark:bg-white transition-all duration-300 rounded-full"
                style={{ width: `${timerProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 pt-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-extrabold text-sm sm:text-base transition hover:opacity-85 active:scale-95 shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START FOCUS</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white font-extrabold text-sm sm:text-base transition hover:bg-zinc-300 dark:hover:bg-zinc-700 active:scale-95 shadow-sm"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE</span>
            </button>
          )}

          {/* Stop & Log Session Button */}
          {(isRunning || (mode === 'timer' ? secondsRemaining < targetMinutes * 60 : stopwatchSeconds > 0)) && (
            <button
              onClick={handleStopAndLog}
              className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl bg-zinc-100 hover:bg-black hover:text-white dark:bg-zinc-900 dark:hover:bg-white dark:hover:text-black text-black dark:text-white border border-zinc-200 dark:border-zinc-800 font-bold text-xs sm:text-sm transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish & Log</span>
            </button>
          )}

          {/* Reset Button */}
          <button
            onClick={handleReset}
            title="Reset timer"
            className="p-3.5 rounded-2xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History & Session Log Section */}
      <div className="p-5 sm:p-7 rounded-3xl card-neo space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-black dark:text-white" />
            <h3 className="font-extrabold text-base sm:text-lg text-black dark:text-white tracking-tight">
              Focus History & Logs ({focusSessions.length})
            </h3>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search topic or note..."
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition"
              />
            </div>

            <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setHistoryFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  historyFilterMode === 'all'
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHistoryFilterMode('timer')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  historyFilterMode === 'timer'
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                Timer
              </button>
              <button
                onClick={() => setHistoryFilterMode('stopwatch')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  historyFilterMode === 'stopwatch'
                    ? 'bg-white dark:bg-black text-black dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                Stopwatch
              </button>
            </div>

            {focusSessions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all logged focus sessions?')) {
                    clearFocusSessions();
                  }
                }}
                className="text-xs text-zinc-400 hover:text-red-500 transition px-2 py-1"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* History List Table */}
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 space-y-1">
            <p>No focus sessions found.</p>
            <p className="text-[11px] opacity-75">Start a timer or stopwatch above to record your first deep work session.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-2.5 pr-4">Topic / Reason</th>
                  <th className="pb-2.5 px-4">Mode</th>
                  <th className="pb-2.5 px-4">Duration</th>
                  <th className="pb-2.5 px-4">Date & Time</th>
                  <th className="pb-2.5 px-4">Notes</th>
                  <th className="pb-2.5 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filteredHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                    <td className="py-3 pr-4 font-bold text-black dark:text-white whitespace-nowrap">
                      {s.topic}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 capitalize">
                        {s.mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-black dark:text-white whitespace-nowrap">
                      {s.durationMinutes}m ({s.durationSeconds}s)
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(s.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 max-w-xs truncate">
                      {s.notes || <span className="text-zinc-400 italic">—</span>}
                    </td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => deleteFocusSession(s.id)}
                        className="text-zinc-400 hover:text-red-500 transition p-1"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletionModal && completedSessionData && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-center animate-in fade-in duration-150"
          onClick={() => handleSaveCompletedSession()}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-black dark:text-white tracking-tight">
                    Focus Sprint Complete!
                  </h3>
                  <p className="text-xs text-zinc-500">Locked in on: {completedSessionData.topic}</p>
                </div>
              </div>
              <button
                onClick={() => handleSaveCompletedSession()}
                className="text-zinc-400 hover:text-black dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Summary Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Duration Spent</span>
                <span className="font-mono font-bold text-black dark:text-white">
                  {completedSessionData.durationMinutes} mins ({completedSessionData.durationSeconds}s)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">XP Earned</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{Math.max(15, Math.round(completedSessionData.durationMinutes * 1.5))} XP</span>
                </span>
              </div>
            </div>

            {/* Optional Reflection / Takeaway Note */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Quick Takeaway or Reflection (Optional)
              </label>
              <textarea
                rows={2}
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="What did you achieve or discover during this session? (e.g. Read 20 pages, drafted PR...)"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletedSessionData(null);
                  handleReset();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white transition"
              >
                Discard
              </button>
              <button
                onClick={() => handleSaveCompletedSession(sessionNote)}
                className="px-5 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-85 active:scale-95 transition shadow-sm"
              >
                Log to History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
