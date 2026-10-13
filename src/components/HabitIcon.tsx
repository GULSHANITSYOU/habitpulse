import React from 'react';
import {
  Sparkles,
  Droplets,
  Dumbbell,
  BookOpen,
  Flame,
  Moon,
  Sun,
  Heart,
  Brain,
  Activity,
  Footprints,
  Coffee,
  Laptop,
  Code,
  DollarSign,
  Salad,
  Smile,
  Timer,
  Target,
  CheckCircle,
  Feather,
  Trophy,
  Zap,
  Music,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number; color?: string }>> = {
  Sparkles,
  Droplets,
  Dumbbell,
  BookOpen,
  Flame,
  Moon,
  Sun,
  Heart,
  Brain,
  Activity,
  Footprints,
  Coffee,
  Laptop,
  Code,
  DollarSign,
  Salad,
  Smile,
  Timer,
  Target,
  CheckCircle,
  Feather,
  Trophy,
  Zap,
  Music,
};

export const POPULAR_ICONS = Object.keys(ICON_MAP);

export const CATEGORY_COLORS: { [key: string]: { bg: string; text: string; border: string; accent: string } } = {
  health: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', accent: '#10b981' },
  fitness: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', accent: '#f43f5e' },
  productivity: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', accent: '#6366f1' },
  mindfulness: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', accent: '#a855f7' },
  learning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', accent: '#f59e0b' },
  finance: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', accent: '#14b8a6' },
  lifestyle: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', accent: '#0ea5e9' },
};

export const COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#3b82f6', // Blue
];

interface HabitIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const HabitIcon: React.FC<HabitIconProps> = ({ name, className = 'w-5 h-5', size, color }) => {
  const IconComponent = ICON_MAP[name] || Sparkles;
  return <IconComponent className={className} size={size} color={color} />;
};
