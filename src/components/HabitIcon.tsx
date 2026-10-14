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
  health: { bg: 'bg-zinc-100 dark:bg-zinc-900', text: 'text-black dark:text-white', border: 'border-zinc-200 dark:border-zinc-800', accent: '#000000' },
  fitness: { bg: 'bg-zinc-100 dark:bg-zinc-900', text: 'text-black dark:text-white', border: 'border-zinc-200 dark:border-zinc-800', accent: '#000000' },
  productivity: { bg: 'bg-zinc-100 dark:bg-zinc-900', text: 'text-black dark:text-white', border: 'border-zinc-200 dark:border-zinc-800', accent: '#000000' },
  mindfulness: { bg: 'bg-zinc-100 dark:bg-zinc-900', text: 'text-black dark:text-white', border: 'border-zinc-200 dark:border-zinc-800', accent: '#000000' },
  learning: { bg: 'bg-zinc-100 dark:bg-zinc-900', text: 'text-black dark:text-white', border: 'border-zinc-200 dark:border-zinc-800', accent: '#000000' },
  finance: { bg: 'bg-zinc-100 dark:bg-zinc-900', text: 'text-black dark:text-white', border: 'border-zinc-200 dark:border-zinc-800', accent: '#000000' },
  lifestyle: { bg: 'bg-zinc-100 dark:bg-zinc-900', text: 'text-black dark:text-white', border: 'border-zinc-200 dark:border-zinc-800', accent: '#000000' },
};

export const COLOR_OPTIONS = [
  '#000000',
  '#27272a',
  '#52525b',
  '#71717a',
  '#a1a1aa',
  '#d4d4d8',
  '#ffffff',
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
