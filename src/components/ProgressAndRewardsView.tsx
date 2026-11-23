import React, { useMemo, useState } from 'react';
import { Award, Check, Coins, Lock, Palette, Settings, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { ACHIEVEMENTS, ARENA_THEMES, getRankTitle, xpRequiredForLevel } from '../data/modes';
import { useApp } from '../context/AppContext';
import type { AppRoute } from './Header';

interface ProgressAndRewardsViewProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const ProgressAndRewardsView: React.FC<ProgressAndRewardsViewProps> = ({
  onOpenSettings,
  onOpenAuth,
  onNavigate,
}) => {
  const { activeProfile, isAuthenticated, history, modeConfigs, unlockTheme, showToast } = useApp();
  const [tab, setTab] = useState<'overview' | 'themes' | 'achievements' | 'history'>('overview');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const chartSessions = useMemo(() => [...history].slice(0, 14).reverse(), [history]);

  const currentLevelXp = xpRequiredForLevel(activeProfile.level);
  const nextLevelXp = xpRequiredForLevel(activeProfile.level + 1);
  const levelProgress =
    nextLevelXp > currentLevelXp
      ? Math.min(100, Math.round(((activeProfile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))
      : 100;

  const handleThemeAction = async (themeId: string) => {
    setUnlockingId(themeId);
    try {
      await unlockTheme(themeId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to unlock theme.', 'error');
    } finally {
      setUnlockingId(null);
    }
  };

  // SVG Chart geometry
  const chartW = 640;
  const chartH = 190;
  const padX = 28;
  const padY = 20;
  const maxWpm = Math.max(80, ...chartSessions.map((s) => s.wpm + 10));

  const points = chartSessions.map((s, idx) => {
    const x =
      chartSessions.length === 1
        ? chartW / 2
        : padX + (idx / (chartSessions.length - 1)) * (chartW - padX * 2);
    const y = chartH - padY - (s.wpm / maxWpm) * (chartH - padY * 2);
    return { x, y, session: s };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {isAuthenticated ? 'Synced Account Profile' : 'Local Guest Profile'} · {getRankTitle(activeProfile.level)}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {activeProfile.displayName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 tabular-nums">
            <span>Level {activeProfile.level}</span>
            <span aria-hidden="true">·</span>
            <span>{activeProfile.xp} XP</span>
            <span aria-hidden="true">·</span>
            <span>{activeProfile.totalTests} Tests</span>
            <span aria-hidden="true">·</span>
            <span>{activeProfile.totalWords} Words</span>
          </div>
          <div className="w-full max-w-xs pt-1">
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-2.5 flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Balance</div>
              <div className="font-mono-typing text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {activeProfile.coins}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 min-h-[44px]"
            >
              <span>Sign In to Sync</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 min-h-[44px]"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Panel</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Speed & Personal Bests' },
          { id: 'themes', label: 'Unlockable Themes' },
          { id: 'achievements', label: `Achievements (${activeProfile.achievements.length}/${ACHIEVEMENTS.length})` },
          { id: 'history', label: 'Progress History' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as typeof tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[38px] ${
              tab === item.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Chart */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Recent Speed Trend (WPM)
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Last {chartSessions.length} sessions
              </span>
            </div>

            {chartSessions.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                Complete your first typing test or lesson to visualize your WPM trend.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full min-w-[360px] h-48">
                  {[0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = chartH - padY - ratio * (chartH - padY * 2);
                    return (
                      <g key={ratio}>
                        <line
                          x1={padX}
                          y1={y}
                          x2={chartW - padX}
                          y2={y}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={4}
                          y={y + 4}
                          className="fill-slate-400 text-[10px] font-mono-typing"
                        >
                          {Math.round(maxWpm * ratio)}
                        </text>
                      </g>
                    );
                  })}
                  {points.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylinePoints}
                    />
                  )}
                  {points.map((pt, i) => (
                    <g key={pt.session.id || i}>
                      <circle cx={pt.x} cy={pt.y} r="5" className="fill-violet-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
                      <title>{`${pt.session.modeLabel}: ${pt.session.wpm} WPM (${pt.session.accuracy}%)`}</title>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Personal Best Records
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {modeConfigs.map((mode) => {
                const pb = activeProfile.personalBests[mode.id];
                return (
                  <div
                    key={mode.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {mode.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {pb ? `${pb.accuracy}% accuracy · ${new Date(pb.date).toLocaleDateString()}` : 'No record yet'}
                      </div>
                    </div>
                    <div className="font-mono-typing text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {pb ? `${pb.wpm}` : '—'} <span className="text-xs font-normal text-slate-400">WPM</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Unlockable Themes Shop */}
      {tab === 'themes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARENA_THEMES.map((theme) => {
            const unlocked = activeProfile.unlockedThemes.includes(theme.id);
            const equipped = activeProfile.settings.activeArenaTheme === theme.id;

            return (
              <div
                key={theme.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] overflow-hidden flex flex-col justify-between"
              >
                <div className={`relative h-36 ${theme.backdropClass} flex items-end p-4`}>
                  {theme.previewImage && (
                    <img
                      src={theme.previewImage}
                      alt={theme.name}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="font-display text-lg font-bold text-white">{theme.name}</span>
                    <Palette className="w-4 h-4 text-blue-300" />
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between gap-4 flex-1">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {theme.description}
                  </p>
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                      {unlocked ? (equipped ? 'Active Theme' : 'Unlocked') : `${theme.cost} Coins`}
                    </span>
                    <button
                      type="button"
                      disabled={unlockingId === theme.id || equipped}
                      onClick={() => handleThemeAction(theme.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                        equipped
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default'
                          : unlocked
                          ? 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-500'
                          : 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500'
                      }`}
                    >
                      {equipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Equipped</span>
                        </>
                      ) : unlocked ? (
                        <span>Equip Theme</span>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlock ({theme.cost})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Achievements */}
      {tab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = activeProfile.achievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-2xl border p-5 flex items-start gap-3.5 ${
                  unlocked
                    ? 'border-blue-500/40 bg-blue-500/5 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] opacity-80'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    unlocked
                      ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {unlocked ? <Award className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      {ach.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{ach.description}</p>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1">
                    {ach.requirementLabel} · +{ach.coinBonus} Coins ·{' '}
                    <strong className={unlocked ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                      {unlocked ? 'Unlocked' : 'Locked'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: History */}
      {tab === 'history' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] overflow-hidden">
          {history.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No typing sessions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Mode / Lesson</th>
                    <th className="py-3.5 px-4 text-right">Speed</th>
                    <th className="py-3.5 px-4 text-right">Accuracy</th>
                    <th className="py-3.5 px-4 text-right">Mistakes</th>
                    <th className="py-3.5 px-4 text-right">Words</th>
                    <th className="py-3.5 px-4 text-right">Coins</th>
                    <th className="py-3.5 px-4 text-right hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {item.modeLabel}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-typing font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {item.wpm} WPM
                      </td>
                      <td className="py-3 px-4 text-right font-mono-typing text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {item.accuracy}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono-typing text-rose-600 dark:text-rose-400 tabular-nums">
                        {item.mistakes}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-typing text-slate-700 dark:text-slate-300 tabular-nums">
                        {item.wordsTyped}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-typing text-amber-600 dark:text-amber-400 tabular-nums">
                        +{item.coinsEarned}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums hidden sm:table-cell">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
