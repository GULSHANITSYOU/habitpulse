import React from 'react';
import { HabitProvider, useHabits } from './context/HabitContext';
import { Header } from './components/Header';
import { DailyOverview } from './components/DailyOverview';
import { HabitCard } from './components/HabitCard';
import { WeeklyMatrix } from './components/WeeklyMatrix';
import { HeatmapView } from './components/HeatmapView';
import { AnalyticsView } from './components/AnalyticsView';
import { ManageHabitsView } from './components/ManageHabitsView';
import { parseDateKey, isHabitScheduledForDate } from './utils/dateUtils';
import { Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { HabitModal } from './components/HabitModal';

const MainContent: React.FC = () => {
  const {
    habits,
    selectedDate,
    activeTab,
    filterCategory,
    filterTimeOfDay,
    searchQuery,
    getHabitLog,
  } = useHabits();

  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = React.useState(false);

  // Active (non-archived) habits
  const activeHabits = habits.filter((h) => !h.archived);

  // Filter habits for the Today view
  const targetDateObj = parseDateKey(selectedDate);
  const scheduledHabits = activeHabits.filter((h) => {
    // Check if scheduled on selected day
    const isScheduled = isHabitScheduledForDate(h, targetDateObj);
    if (!isScheduled) return false;

    // Check category filter
    if (filterCategory !== 'all' && h.category !== filterCategory) return false;

    // Check time of day filter
    if (filterTimeOfDay !== 'all' && h.timeOfDay !== filterTimeOfDay) return false;

    // Check search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = h.title.toLowerCase().includes(q);
      const matchDesc = (h.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  // Sort habits: pending/in-progress first, then completed
  const sortedScheduledHabits = [...scheduledHabits].sort((a, b) => {
    const logA = getHabitLog(a.id, selectedDate);
    const logB = getHabitLog(b.id, selectedDate);
    const doneA = Boolean(logA?.completed);
    const doneB = Boolean(logB?.completed);
    if (doneA === doneB) return 0;
    return doneA ? 1 : -1;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'today' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <DailyOverview />

            {/* Habit Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    Daily Rituals ({sortedScheduledHabits.length})
                  </h3>
                  {sortedScheduledHabits.length > 0 && (
                    <span className="text-xs text-slate-400">
                      • Tap to complete or track progress
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsNewHabitModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Habit</span>
                </button>
              </div>

              {sortedScheduledHabits.length === 0 ? (
                <div className="p-12 rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-200">No habits scheduled</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {searchQuery || filterCategory !== 'all' || filterTimeOfDay !== 'all'
                        ? 'No habits match your active filters. Try clearing filters or search keywords.'
                        : 'No habits scheduled for this day. You can take this as a rest day or create a new habit!'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNewHabitModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create a Habit</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {sortedScheduledHabits.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} dateKey={selectedDate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="animate-in fade-in duration-300">
            <WeeklyMatrix />
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="animate-in fade-in duration-300">
            <HeatmapView />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-300">
            <AnalyticsView />
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="animate-in fade-in duration-300">
            <ManageHabitsView />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>HabitPulse — Built for relentless consistency & personal growth</span>
          </div>
          <span>Offline-first • Stored securely in your browser</span>
        </div>
      </footer>

      {isNewHabitModalOpen && (
        <HabitModal
          isOpen={isNewHabitModalOpen}
          onClose={() => setIsNewHabitModalOpen(false)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <HabitProvider>
      <MainContent />
    </HabitProvider>
  );
}

export default App;
