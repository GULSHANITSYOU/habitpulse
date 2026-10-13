# ⚡ HabitPulse — Modern Habit & Routine Tracker

A high-performance, offline-first web application designed for consistency, daily rituals, and habit gamification.

Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Vite**, **Lucide Icons**, and the **Web Audio API**.

---

## ✨ Features

- 🎯 **Multi-type Habit Tracking**:
  - **Boolean Checklists** (Yes / No simple checkoffs)
  - **Numeric & Measurable Goals** (with units, e.g., 2,500 ml water, 90 mins deep work, 20 pages read) with increment/decrement steppers (`+`, `-`) and progress bars.
- 📅 **Flexible Frequencies & Schedules**:
  - Daily, Weekdays, Weekends, or Custom Days (e.g. Mon, Wed, Fri)
  - Time-of-day filters (Morning 🌅, Afternoon ☀️, Evening 🌙, Anytime ⏱️)
- 🔥 **Streak Engine & Gamification**:
  - Dynamic streak tracking with flame indicators (`🔥 12d`) and best streak records.
  - XP & Player Leveling system (+30 XP per habit completion, level-ups, celebratory fanfare).
  - Triumphant confetti explosions upon habit completion!
- 🔊 **Synthesized Audio Feedback**:
  - Web Audio API synthesizer for tactile button clicks, arpeggio chimes, and fanfare sounds (no external audio files needed; toggleable).
- 📊 **5 Interactive Views**:
  1. **Today Dashboard**: Date switcher, circular completion ring, daily motivational quotes, search, and category pills.
  2. **Weekly Consistency Matrix**: Interactive 7-day Monday–Sunday table with one-click toggles.
  3. **Activity Heatmap (GitHub-Style)**: 14-week visual density matrix with hover inspection tooltips for all habits or individual rituals.
  4. **Analytics & Insights**: 30-day consistency rates, life balance category breakdown, streak leaderboards, and milestone trophies.
  5. **Habit Catalog & Blueprint Packs**: Manage, archive, and one-click import curated routine packs (Morning Routine, Peak Fitness, Mental Sharpness).
- 📝 **Daily Journal Notes**: Add reflection notes and thoughts to any habit check-in.
- 💾 **Offline-first & Persistence**: Fully saved in `localStorage` with JSON export & restore capabilities.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Build for Production
```bash
npm run build
```
Creates an optimized production bundle inside the `dist/` directory.
