import React from 'react';
import { Award, BookOpen, Home, Keyboard, Play, Trophy, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type AppRoute = 'dashboard' | 'play' | 'learn' | 'leaderboard' | 'progress' | 'admin';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate, onOpenAuth }) => {
  const { activeProfile, isAuthenticated } = useApp();

  const navItems: Array<{ id: AppRoute; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'play', label: 'Play' },
    { id: 'learn', label: 'Learn' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'progress', label: 'Progress' },
  ];

  const mobileTabs: Array<{ id: AppRoute; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'play', label: 'Play', icon: <Play className="w-5 h-5" /> },
    { id: 'learn', label: 'Learn', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'Ranks', icon: <Trophy className="w-5 h-5" /> },
    { id: 'progress', label: 'Profile', icon: <Award className="w-5 h-5" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#090D16]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md px-1"
          >
            Hasnain Typing
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => {
              const active = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded ${
                    active
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-[19px] h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[40px]"
            >
              {isAuthenticated ? (
                <>
                  <User className="w-4 h-4 shrink-0" />
                  <span className="max-w-[110px] truncate">{activeProfile.displayName}</span>
                </>
              ) : (
                <>
                  <Keyboard className="w-4 h-4 shrink-0" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md pb-safe"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {mobileTabs.map((tab) => {
            const active = currentRoute === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-medium tracking-tight mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
