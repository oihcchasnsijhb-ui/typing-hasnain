import React from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Coins,
  Flame,
  Gauge,
  Keyboard,
  Play,
  Settings,
  Shield,
  Sparkles,
  Timer,
  Trophy,
  Zap,
import { getRankTitle, xpRequiredForLevel } from '../data/nodes';
import { useApp } from '../context/AppContext';
import type { GameModeId } from '../types/game';
import type { AppRoute } from './Header';
import { PWAInstallButton } from './PWAInstallButton';

interface DashboardViewProps {
  onLaunchMode: (mode: GameModeId) => void;
  onNavigate: (route: AppRoute) => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onLaunchMode,
  onNavigate,
  onOpenSettings,
}) => {
  const { activeProfile, modeConfigs, dailyDate } = useApp();

  const currentLevelXp = xpRequiredForLevel(activeProfile.level);
  const nextLevelXp = xpRequiredForLevel(activeProfile.level + 1);
  const levelProgress =
    nextLevelXp > currentLevelXp
      ? Math.min(100, Math.round(((activeProfile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))
      : 100;

  const bestWpmOverall = Object.values(activeProfile.personalBests).reduce(
    (max, item) => Math.max(max, item?.wpm ?? 0),
    0
  );

  const dailyDoneToday = activeProfile.lastDailyDate === dailyDate;

  const quickActions: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      id: 'start-game',
      title: 'Start Game',
      subtitle: 'Jump straight into typing action',
      icon: <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      onClick: () => onLaunchMode('1-minute'),
    },
    {
      id: 'learn-typing',
      title: 'Learn Typing',
      subtitle: 'Guided finger placement & courses',
      icon: <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      onClick: () => onNavigate('learn'),
    },
    {
      id: 'practice-typing',
      title: 'Practice Typing',
      subtitle: 'Endless adaptive word & phrase flow',
      icon: <Keyboard className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      onClick: () => onLaunchMode('endless'),
    },
    {
      id: 'speed-test',
      title: 'Speed Test',
      subtitle: '45-second high-tempo burst sprint',
      icon: <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      onClick: () => onLaunchMode('speed-challenge'),
    },
    {
      id: 'daily-challenge',
      title: 'Daily Challenge',
      subtitle: dailyDoneToday ? 'Completed today · Play again' : 'Bonus +40 coins & streak',
      icon: <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      onClick: () => onLaunchMode('daily-challenge'),
    },
    {
      id: 'my-progress',
      title: 'My Progress',
      subtitle: 'History, achievements & theme shop',
      icon: <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      onClick: () => onNavigate('progress'),
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      subtitle: 'Top global WPM & accuracy ranks',
      icon: <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      onClick: () => onNavigate('leaderboard'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Themes, audio, keyboard & account',
      icon: <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />,
      onClick: onOpenSettings,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Cross-Platform Typing Studio</span>
              <span aria-hidden="true">·</span>
              <span>Level {activeProfile.level} ({getRankTitle(activeProfile.level)})</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              Build effortless speed and precision on every key.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Master touch typing from home row foundations to 100+ WPM sprints. Practice smoothly across Windows PC, iPhone, Android, and tablets with live telemetry, sound feedback, and persistent progression.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onLaunchMode('1-minute')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[46px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start 1-Min Speed Test</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('learn')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 min-h-[46px]"
            >
              <BookOpen className="w-4 h-4 text-violet-500" />
              <span>Open Typing Course</span>
            </button>

            <PWAInstallButton compact />

            {activeProfile.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 transition-colors whitespace-nowrap shrink-0 min-h-[46px]"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[220px]">
          <img
            src="/src/assets/images/hero_typing_desk_1795433703167.jpg"
            alt="Mechanical keyboard with subtle blue and violet lighting"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover lg:h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-6">
            <div className="text-xs font-medium text-blue-300">
              Daily Typing Challenge · {dailyDate}
            </div>
            <div className="font-display text-xl font-bold text-white mt-1">
              {dailyDoneToday ? 'Daily Challenge Cleared' : 'Earn Double Coins Today'}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => onLaunchMode('daily-challenge')}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/25 transition-colors min-h-[40px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>{dailyDoneToday ? 'Replay Daily Challenge' : 'Play Daily Challenge'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Player Metrics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Personal Best</span>
            <Gauge className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-mono-typing text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1.5">
            {bestWpmOverall} <span className="text-sm font-normal text-slate-400">WPM</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Level &amp; XP</span>
            <Sparkles className="w-4 h-4 text-violet-500" />
          </div>
          <div className="font-mono-typing text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1.5">
            Lv. {activeProfile.level}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Coin Vault</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-mono-typing text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1.5">
            {activeProfile.coins}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Daily Streak</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="font-mono-typing text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1.5">
            {activeProfile.streakDays} <span className="text-sm font-normal text-slate-400">days</span>
          </div>
        </div>
      </section>

      {/* Dashboard Quick Hub (All 8 Required Sections) */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Quick Access
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Jump directly to any mode, course module, or analytics view.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="group text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-4 sm:p-5 hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:bg-slate-50/70 dark:hover:bg-slate-900 transition-all min-h-[88px] flex items-start gap-3.5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/90 group-hover:scale-105 transition-transform">
                {action.icon}
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                  {action.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {action.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* All 9 Game Modes Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Game Modes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose a structured skill tier, timed sprint, daily challenge, or endless practice stream.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modeConfigs
            .filter((m) => m.enabled)
            .map((mode) => {
              const personalBest = activeProfile.personalBests[mode.id];
              return (
                <div
                  key={mode.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {mode.difficulty} · {mode.durationSeconds > 0 ? `${mode.durationSeconds}s` : 'Untimed'} · {mode.coinMultiplier}x Coins
                      </span>
                      <Timer className="w-4 h-4 text-blue-500 shrink-0" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {mode.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {personalBest ? (
                        <>
                          Best: <strong className="text-slate-900 dark:text-white">{personalBest.wpm} WPM</strong> ({personalBest.accuracy}%)
                        </>
                      ) : (
                        <>Target: {mode.targetWpm} WPM</>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onLaunchMode(mode.id)}
                      className="rounded-xl bg-slate-900 dark:bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                    >
                      Play Mode
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
};
