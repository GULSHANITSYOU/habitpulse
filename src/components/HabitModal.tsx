import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Habit, HabitCategory, HabitFrequencyType, HabitType, TimeOfDay } from '../types/habit';
import { useHabits } from '../context/HabitContext';
import { HabitIcon, POPULAR_ICONS } from './HabitIcon';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  habitToEdit,
}) => {
  const { addHabit, updateHabit } = useHabits();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('productivity');
  const [color, setColor] = useState('#ffffff');
  const [icon, setIcon] = useState('Sparkles');
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('anytime');

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category);
      setColor(habitToEdit.color || '#ffffff');
      setIcon(habitToEdit.icon);
      setHabitType(habitToEdit.habitType);
      setTargetValue(habitToEdit.targetValue);
      setUnit(habitToEdit.unit || '');
      setFrequencyType(habitToEdit.frequencyType);
      setCustomDays(habitToEdit.customDays || [1, 2, 3, 4, 5]);
      setTimeOfDay(habitToEdit.timeOfDay);
    } else {
      setTitle('');
      setDescription('');
      setCategory('productivity');
      setColor('#ffffff');
      setIcon('Sparkles');
      setHabitType('boolean');
      setTargetValue(1);
      setUnit('');
      setFrequencyType('daily');
      setCustomDays([1, 2, 3, 4, 5]);
      setTimeOfDay('anytime');
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      color,
      icon,
      habitType,
      targetValue: habitType === 'numeric' ? Number(targetValue) || 1 : 1,
      unit: habitType === 'numeric' ? unit.trim() || 'units' : undefined,
      frequencyType,
      customDays: frequencyType === 'custom_days' ? customDays : undefined,
      timeOfDay,
    };

    if (habitToEdit) {
      updateHabit(habitToEdit.id, payload);
    } else {
      addHabit(payload);
    }

    onClose();
  };

  const toggleDay = (dayIndex: number) => {
    setCustomDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const daysLabels = [
    { idx: 0, label: 'Sun' },
    { idx: 1, label: 'Mon' },
    { idx: 2, label: 'Tue' },
    { idx: 3, label: 'Wed' },
    { idx: 4, label: 'Thu' },
    { idx: 5, label: 'Fri' },
    { idx: 6, label: 'Sat' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col glow-white-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 text-white">
              <HabitIcon name={icon} size={20} color="#ffffff" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {habitToEdit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <p className="text-xs text-zinc-400">Define your daily ritual and target</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Habit Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Read Non-Fiction, Drink 2L Water, Morning Run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition text-sm font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Motivation / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="Why does this habit matter to you?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition text-sm font-medium"
            />
          </div>

          {/* Category & Time of Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-white text-sm capitalize font-medium"
              >
                <option value="health">Health</option>
                <option value="fitness">Fitness</option>
                <option value="productivity">Productivity</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="learning">Learning</option>
                <option value="finance">Finance</option>
                <option value="lifestyle">Lifestyle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Time of Day
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-white text-sm capitalize font-medium"
              >
                <option value="anytime">Anytime</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>

          {/* Habit Type (Checkbox vs Numeric) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Measurement Goal
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHabitType('boolean')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  habitType === 'boolean'
                    ? 'bg-white text-zinc-950 font-bold border-white shadow-sm'
                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                Yes / No Checkbox
              </button>
              <button
                type="button"
                onClick={() => setHabitType('numeric')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  habitType === 'numeric'
                    ? 'bg-white text-zinc-950 font-bold border-white shadow-sm'
                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                Measurable Target
              </button>
            </div>

            {habitType === 'numeric' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Target Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Unit (e.g. ml, pages, mins)</label>
                  <input
                    type="text"
                    placeholder="e.g. ml, mins, pages"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Frequency
            </label>
            <select
              value={frequencyType}
              onChange={(e) => setFrequencyType(e.target.value as HabitFrequencyType)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-white text-sm capitalize font-medium"
            >
              <option value="daily">Every Day</option>
              <option value="weekdays">Weekdays (Mon - Fri)</option>
              <option value="weekends">Weekends (Sat - Sun)</option>
              <option value="custom_days">Custom Days of Week</option>
            </select>

            {frequencyType === 'custom_days' && (
              <div className="flex items-center justify-between gap-1 mt-3">
                {daysLabels.map((d) => (
                  <button
                    key={d.idx}
                    type="button"
                    onClick={() => toggleDay(d.idx)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      customDays.includes(d.idx)
                        ? 'bg-white text-zinc-950 font-bold border-white'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1.5 bg-zinc-900 rounded-xl border border-white/10">
              {POPULAR_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-2 rounded-lg flex items-center justify-center transition ${
                    icon === iconName
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <HabitIcon name={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-950 bg-white hover:bg-zinc-200 shadow-lg shadow-white/20 transition active:scale-95"
            >
              {habitToEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
