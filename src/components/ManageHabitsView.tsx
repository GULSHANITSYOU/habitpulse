import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import type { Habit } from '../types/habit';
import { HabitIcon } from './HabitIcon';
import { HabitModal } from './HabitModal';
import { HABIT_TEMPLATES } from '../utils/storage';

export const ManageHabitsView: React.FC = () => {
  const {
    habits,
    requestDeleteHabit,
    toggleArchiveHabit,
    loadTemplate,
    getHabitStats,
  } = useHabits();

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [templateLoadedMsg, setTemplateLoadedMsg] = useState<string | null>(null);

  const displayedHabits = habits
    .filter((h) => (activeTab === 'active' ? !h.archived : h.archived))
    .filter((h) =>
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleLoadTemplate = (pack: typeof HABIT_TEMPLATES[0]) => {
    loadTemplate(pack.habits);
    setTemplateLoadedMsg(`Loaded "${pack.name}" blueprint pack!`);
    setTimeout(() => setTemplateLoadedMsg(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="card-neo rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-black dark:text-white" />
            <h2 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">Habit Catalog & Blueprints</h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Organize, customize, archive, or batch-import proven routine packs
          </p>
        </div>

        <button
          onClick={() => {
            setHabitToEdit(undefined);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create New Habit</span>
        </button>
      </div>

      {/* Routine Templates Shelf */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black dark:text-white" />
            <h3 className="font-bold text-sm text-black dark:text-white">Pre-Built Routine Blueprint Packs</h3>
          </div>
          {templateLoadedMsg && (
            <span className="text-xs font-semibold text-black dark:text-white flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {templateLoadedMsg}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HABIT_TEMPLATES.map((pack) => (
            <div
              key={pack.name}
              className="p-5 rounded-2xl card-neo flex flex-col justify-between gap-4"
            >
              <div>
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  {pack.category}
                </span>
                <h4 className="font-bold text-base text-black dark:text-white mt-1">{pack.name}</h4>
                <ul className="mt-3 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  {pack.habits.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                      <span>{h.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleLoadTemplate(pack)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-black hover:text-white dark:bg-zinc-900 dark:hover:bg-white dark:hover:text-black text-black dark:text-white border border-zinc-200 dark:border-zinc-800 text-xs font-semibold transition-all duration-150"
              >
                + Add Routine Pack
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Habits List Section */}
      <div className="space-y-4">
        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'active'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Active ({habits.filter((h) => !h.archived).length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'archived'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Archived ({habits.filter((h) => h.archived).length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white font-medium"
            />
          </div>
        </div>

        {/* Habit Items Table / List */}
        <div className="rounded-2xl card-neo overflow-hidden">
          {displayedHabits.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-sm">
              No habits found matching your filter.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {displayedHabits.map((habit) => {
                const stats = getHabitStats(habit);

                return (
                  <div
                    key={habit.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white">
                        <HabitIcon name={habit.icon} size={20} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-black dark:text-white">{habit.title}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800">
                            {habit.category}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          <span className="capitalize">{habit.frequencyType.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="capitalize">{habit.timeOfDay}</span>
                          <span>•</span>
                          <span>
                            {habit.habitType === 'numeric'
                              ? `Target: ${habit.targetValue} ${habit.unit || 'units'}`
                              : 'Checkoff'}
                          </span>
                          <span>•</span>
                          <span className="text-black dark:text-white font-semibold">{stats.completionRate30d}% consistency</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setHabitToEdit(habit);
                          setIsAddModalOpen(true);
                        }}
                        className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
                        title="Edit Habit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleArchiveHabit(habit.id)}
                        className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition"
                        title={habit.archived ? 'Restore Habit' : 'Archive Habit'}
                      >
                        {habit.archived ? <RefreshCw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => requestDeleteHabit(habit.id, habit.title)}
                        className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition font-semibold"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <HabitModal
          isOpen={isAddModalOpen}
          habitToEdit={habitToEdit}
          onClose={() => {
            setIsAddModalOpen(false);
            setHabitToEdit(undefined);
          }}
        />
      )}
    </div>
  );
};
