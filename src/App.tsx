import React, { useState } from 'react';
import { AccountAndSettingsModal } from './components/AccountAndSettingsModal';
import { AdminPanelView } from './components/AdminPanelView';
import { DashboardView } from './components/DashboardView';
import { Header, type AppRoute } from './components/Header';
import { LeaderboardView } from './components/LeaderboardView';
import { LearningCenterView } from './components/LearningCenterView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProgressAndRewardsView } from './components/ProgressAndRewardsView';
import { TypingArena } from './components/TypingArena';
import { AppProvider, useApp } from './context/AppContext';
import type { GameModeId, LessonItem } from './types/game';

const AppShell: React.FC = () => {
  const { toast } = useApp();
  const [route, setRoute] = useState<AppRoute>('dashboard');
  const [playMode, setPlayMode] = useState<GameModeId>('1-minute');
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'account' | 'settings'>('account');

  const handleLaunchMode = (mode: GameModeId) => {
    setSelectedLesson(null);
    setPlayMode(mode);
    setRoute('play');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartLesson = (lesson: LessonItem) => {
    setSelectedLesson(lesson);
    setPlayMode('lesson');
    setRoute('play');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (nextRoute: AppRoute) => {
    if (nextRoute === 'play' && route !== 'play') {
      setSelectedLesson(null);
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openModal = (tab: 'account' | 'settings') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 pb-16 md:pb-0 transition-colors">
      <Header
        currentRoute={route}
        onNavigate={handleNavigate}
        onOpenAuth={() => openModal('account')}
      />

      <main className="flex-1">
        {route === 'dashboard' && (
          <DashboardView
            onLaunchMode={handleLaunchMode}
            onNavigate={handleNavigate}
            onOpenSettings={() => openModal('settings')}
          />
        )}

        {route === 'play' && (
          <TypingArena
            initialMode={playMode}
            initialLesson={selectedLesson}
            onExitToDashboard={() => handleNavigate('dashboard')}
            onSelectLesson={handleStartLesson}
          />
        )}

        {route === 'learn' && <LearningCenterView onStartLesson={handleStartLesson} />}

        {route === 'leaderboard' && <LeaderboardView />}

        {route === 'progress' && (
          <ProgressAndRewardsView
            onOpenSettings={() => openModal('settings')}
            onOpenAuth={() => openModal('account')}
            onNavigate={handleNavigate}
          />
        )}

        {route === 'admin' && <AdminPanelView />}
      </main>

      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800/80 py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Hasnain Typing · Cross-Platform Touch Typing &amp; Speed Training</span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('learn')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Typing Course
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('leaderboard')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Leaderboard
            </button>
            <button
              type="button"
              onClick={() => openModal('settings')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Admin Console
            </button>
          </div>
        </div>
      </footer>

      <AccountAndSettingsModal
        isOpen={modalOpen}
        initialTab={modalTab}
        onClose={() => setModalOpen(false)}
        onNavigate={handleNavigate}
      />

      <OfflineIndicator />

      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 md:bottom-6 right-4 z-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xl border backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
