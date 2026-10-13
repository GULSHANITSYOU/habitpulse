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
import { HabitIcon, CATEGORY_COLORS } from './HabitIcon';
import { HabitModal } from './HabitModal';
import { HABIT_TEMPLATES } from '../utils/storage';

export const ManageHabitsView: React.FC = () => {
  const {
    habits,
    deleteHabit,
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
    setTemplateLoadedMsg(`Loaded "${pack.name}" template pack!`);
    setTimeout(() => setTemplateLoadedMsg(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Habit Catalog & Rituals</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize, customize, archive, or batch-import proven routine packs
          </p>
        </div>

        <button
          onClick={() => {
            setHabitToEdit(undefined);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Habit</span>
        </button>
      </div>

      {/* Routine Templates Shelf */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-200">Pre-Built Routine Blueprint Packs</h3>
          </div>
          {templateLoadedMsg && (
            <span className="text-xs font-semibold text-emerald-400 animate-fade-in flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {templateLoadedMsg}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HABIT_TEMPLATES.map((pack) => (
            <div
              key={pack.name}
              className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between gap-4"
            >
              <div>
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  {pack.category}
                </span>
                <h4 className="font-bold text-base text-slate-100 mt-1">{pack.name}</h4>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                  {pack.habits.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{h.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleLoadTemplate(pack)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600/20 text-slate-200 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40 text-xs font-semibold transition"
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
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'active'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Habits ({habits.filter((h) => !h.archived).length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'archived'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Archived ({habits.filter((h) => h.archived).length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Habit Items Table / List */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-xl">
          {displayedHabits.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No habits found matching your filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {displayedHabits.map((habit) => {
                const stats = getHabitStats(habit);
                const categoryStyle = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.productivity;

                return (
                  <div
                    key={habit.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/25 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${habit.color}15`,
                          borderColor: `${habit.color}35`,
                          color: habit.color,
                        }}
                      >
                        <HabitIcon name={habit.icon} size={20} color={habit.color} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-100">{habit.title}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                          >
                            {habit.category}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
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
                          <span className="text-indigo-400 font-semibold">{stats.completionRate30d}% consistency</span>
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
                        className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
                        title="Edit Habit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleArchiveHabit(habit.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
                        title={habit.archived ? 'Restore Habit' : 'Archive Habit'}
                      >
                        {habit.archived ? <RefreshCw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${habit.title}"?`)) {
                            deleteHabit(habit.id);
                          }
                        }}
                        className="p-2 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
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
