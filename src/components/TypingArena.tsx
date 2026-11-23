import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Eye,
  EyeOff,
  Flag,
  Keyboard as KeyboardIcon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ACHIEVEMENTS, ARENA_THEMES } from '../data/modes';
import { useApp, type SessionSubmissionResult } from '../context/AppContext';
import type { GameModeConfig, GameModeId, LessonItem } from '../types/game';
import { soundEngine } from '../utils/sound';
import { VirtualKeyboard } from './VirtualKeyboard';

interface TypingArenaProps {
  initialMode: GameModeId;
  initialLesson?: LessonItem | null;
  onExitToDashboard: () => void;
  onSelectLesson?: (lesson: LessonItem) => void;
}

type ArenaPhase = 'READY' | 'RUNNING' | 'PAUSED' | 'FINISHED';

export const TypingArena: React.FC<TypingArenaProps> = ({
  initialMode,
  initialLesson = null,
  onExitToDashboard,
  onSelectLesson,
}) => {
  const {
    modeConfigs,
    wordPools,
    lessons,
    dailyDate,
    settings,
    updateSettings,
    submitSession,
  } = useApp();

  const [activeMode, setActiveMode] = useState<GameModeId>(initialLesson ? 'lesson' : initialMode);
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(initialLesson);
  const [phase, setPhase] = useState<ArenaPhase>('READY');
  const [focusClean, setFocusClean] = useState(false);

  const [targetText, setTargetText] = useState<string>('');
  const [typedText, setTypedText] = useState<string>('');
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [missedKeys, setMissedKeys] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [lastKeyFlash, setLastKeyFlash] = useState<{ char: string; correct: boolean } | null>(null);
  const [resultSummary, setResultSummary] = useState<SessionSubmissionResult | null>(null);
  const [savingResult, setSavingResult] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastTickRef = useRef<number | null>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  const modeConfig: GameModeConfig | undefined = useMemo(
    () => modeConfigs.find((m) => m.id === activeMode),
    [modeConfigs, activeMode]
  );

  const isTimedMode = activeMode !== 'lesson' && (modeConfig?.durationSeconds ?? 0) > 0;
  const timedDurationSec = modeConfig?.durationSeconds ?? 60;

  const generatePromptForMode = useCallback(
    (mode: GameModeId, lesson: LessonItem | null): string => {
      if (mode === 'lesson' && lesson) {
        return lesson.text;
      }

      const poolKey =
        mode === 'beginner'
          ? 'beginner'
          : mode === 'intermediate'
          ? 'intermediate'
          : mode === 'advanced'
          ? 'advanced'
          : mode === 'daily-challenge'
          ? 'daily'
          : 'speed';

      let matching = wordPools.filter((w) => w.pool === poolKey);
      if (!matching.length) {
        matching = wordPools;
      }

      if (mode === 'daily-challenge') {
        const seedNum = dailyDate.split('-').reduce((acc, n) => acc + Number(n), 0);
        const first = matching[seedNum % matching.length]?.text || '';
        const second = matching[(seedNum + 1) % matching.length]?.text || '';
        return `${first} ${second} ${first}`.trim();
      }

      const shuffled = [...matching].sort(() => Math.random() - 0.5);
      if (mode === '1-minute' || mode === '2-minute' || mode === '5-minute' || mode === 'speed-challenge' || mode === 'endless') {
        const chunks: string[] = [];
        const repeatCount = mode === '5-minute' ? 14 : mode === '2-minute' ? 7 : 4;
        for (let i = 0; i < repeatCount; i++) {
          const poolItem = shuffled[i % shuffled.length] || wordPools[i % wordPools.length];
          chunks.push(poolItem.text);
        }
        return chunks.join(' ');
      }

      return shuffled[0]?.text || 'The quick brown fox jumps over the lazy dog.';
    },
    [wordPools, dailyDate]
  );

  const resetRun = useCallback(
    (nextMode = activeMode, nextLesson = activeLesson) => {
      setTargetText(generatePromptForMode(nextMode, nextLesson));
      setTypedText('');
      setTotalKeystrokes(0);
      setMistakes(0);
      setMissedKeys({});
      setStreak(0);
      setElapsedMs(0);
      setLastKeyFlash(null);
      setResultSummary(null);
      setPhase('READY');
      lastTickRef.current = null;
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    },
    [activeMode, activeLesson, generatePromptForMode]
  );

  useEffect(() => {
    const modeToUse = initialLesson ? 'lesson' : initialMode;
    setActiveMode(modeToUse);
    setActiveLesson(initialLesson);
    resetRun(modeToUse, initialLesson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, initialLesson?.id]);

  // Append extra text automatically in Endless / Long Timed runs if user nears the end
  useEffect(() => {
    if (
      (activeMode === 'endless' || isTimedMode) &&
      targetText.length > 0 &&
      targetText.length - typedText.length < 70
    ) {
      const pool = wordPools.filter((w) => w.pool === 'speed' || w.pool === 'intermediate');
      const pick = pool[Math.floor(Math.random() * pool.length)] || wordPools[0];
      if (pick) {
        setTargetText((prev) => `${prev} ${pick.text}`);
      }
    }
  }, [activeMode, isTimedMode, targetText.length, typedText.length, wordPools]);

  // Live metrics calculation
  const metrics = useMemo(() => {
    const minutes = Math.max(elapsedMs / 60000, 1 / 60);
    let correctChars = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === targetText[i]) correctChars++;
    }
    const rawWpm = elapsedMs > 500 ? Math.round(typedText.length / 5 / minutes) : 0;
    const netWpm = elapsedMs > 500 ? Math.max(0, Math.round(correctChars / 5 / minutes)) : 0;
    const accuracy =
      totalKeystrokes > 0
        ? Math.max(0, Math.min(100, Math.round(((totalKeystrokes - mistakes) / totalKeystrokes) * 100)))
        : 100;
    const wordsTyped = typedText.trim() ? typedText.trim().split(/\s+/).length : 0;
    const remainingSec = isTimedMode ? Math.max(0, timedDurationSec - Math.floor(elapsedMs / 1000)) : Math.floor(elapsedMs / 1000);

    return {
      wpm: netWpm,
      rawWpm,
      accuracy,
      wordsTyped,
      correctChars,
      remainingSec,
    };
  }, [elapsedMs, typedText, targetText, totalKeystrokes, mistakes, isTimedMode, timedDurationSec]);

  const finishRun = useCallback(async () => {
    if (phase === 'FINISHED' || savingResult) return;
    setPhase('FINISHED');
    soundEngine.playComplete(settings.soundProfile);
    setSavingResult(true);

    const durationSec = Math.max(1, Math.round(elapsedMs / 1000));
    const modeLabel =
      activeMode === 'lesson' && activeLesson
        ? activeLesson.title
        : modeConfig?.title || 'Typing Practice';

    try {
      const summary = await submitSession({
        mode: activeMode,
        modeLabel,
        lessonId: activeLesson?.id,
        wpm: metrics.wpm,
        rawWpm: metrics.rawWpm,
        accuracy: metrics.accuracy,
        mistakes,
        wordsTyped: metrics.wordsTyped,
        charsTyped: typedText.length,
        durationSeconds: durationSec,
        missedKeys,
      });
      setResultSummary(summary);
    } finally {
      setSavingResult(false);
    }
  }, [
    phase,
    savingResult,
    settings.soundProfile,
    elapsedMs,
    activeMode,
    activeLesson,
    modeConfig?.title,
    submitSession,
    metrics,
    mistakes,
    typedText.length,
    missedKeys,
  ]);

  // Accurate high-frequency timer loop
  useEffect(() => {
    if (phase !== 'RUNNING') {
      lastTickRef.current = null;
      return;
    }
    lastTickRef.current = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = lastTickRef.current ? now - lastTickRef.current : 100;
      lastTickRef.current = now;
      setElapsedMs((prev) => {
        const next = prev + delta;
        if (isTimedMode && next >= timedDurationSec * 1000) {
          return timedDurationSec * 1000;
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [phase, isTimedMode, timedDurationSec]);

  // Auto-finish timed runs when clock hits 0
  useEffect(() => {
    if (phase === 'RUNNING' && isTimedMode && elapsedMs >= timedDurationSec * 1000) {
      finishRun();
    }
  }, [phase, isTimedMode, elapsedMs, timedDurationSec, finishRun]);

  // Keep active character centered in scrollable prompt window
  useEffect(() => {
    if (activeCharRef.current) {
      activeCharRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [typedText.length]);

  // Global keyboard shortcuts (Escape to restart)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resetRun();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resetRun]);

  const processInputDelta = useCallback(
    (nextValue: string) => {
      if (phase === 'FINISHED' || phase === 'PAUSED') return;

      if (phase === 'READY' && nextValue.length > 0) {
        setPhase('RUNNING');
      }

      if (nextValue.length > typedText.length) {
        const added = nextValue.slice(typedText.length);
        let currentIndex = typedText.length;
        let newMistakes = 0;
        let newStreak = streak;
        const nextMissed = { ...missedKeys };
        let lastChar = '';
        let lastOk = true;

        for (const ch of added) {
          const expected = targetText[currentIndex];
          if (expected === undefined) break;
          const isCorrect = ch === expected;
          lastChar = ch;
          lastOk = isCorrect;
          if (isCorrect) {
            newStreak += 1;
          } else {
            newMistakes += 1;
            newStreak = 0;
            const keyLabel = expected === ' ' ? 'Space' : expected;
            nextMissed[keyLabel] = (nextMissed[keyLabel] || 0) + 1;
          }
          currentIndex += 1;
        }

        soundEngine.playKey(settings.soundProfile, lastOk);
        setTotalKeystrokes((k) => k + added.length);
        if (newMistakes > 0) {
          setMistakes((m) => m + newMistakes);
          setMissedKeys(nextMissed);
        }
        setStreak(newStreak);
        if (lastChar) {
          setLastKeyFlash({ char: lastChar, correct: lastOk });
        }
      }

      const clamped = nextValue.slice(0, targetText.length);
      setTypedText(clamped);

      if (!isTimedMode && activeMode !== 'endless' && clamped.length >= targetText.length && targetText.length > 0) {
        window.setTimeout(() => {
          finishRun();
        }, 40);
      }
    },
    [phase, typedText, streak, missedKeys, targetText, settings.soundProfile, isTimedMode, activeMode, finishRun]
  );

  const handleVirtualKey = (keyVal: string) => {
    inputRef.current?.focus();
    if (keyVal === 'Backspace') {
      processInputDelta(typedText.slice(0, -1));
    } else {
      processInputDelta(typedText + keyVal);
    }
  };

  const activeTheme = useMemo(
    () => ARENA_THEMES.find((t) => t.id === settings.activeArenaTheme) || ARENA_THEMES[0],
    [settings.activeArenaTheme]
  );

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const expectedChar = targetText[typedText.length] || '';
  const progressPct = targetText.length > 0 ? Math.min(100, Math.round((typedText.length / targetText.length) * 100)) : 0;

  const nextLessonItem = useMemo(() => {
    if (!activeLesson) return null;
    const idx = lessons.findIndex((l) => l.id === activeLesson.id);
    if (idx >= 0 && idx < lessons.length - 1) return lessons[idx + 1];
    return null;
  }, [activeLesson, lessons]);

  const topMissedList = useMemo(() => {
    const entries = resultSummary?.session.missedKeys || missedKeys;
    return Object.entries(entries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [resultSummary, missedKeys]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Mode Switcher Bar (hidden in clean focus mode) */}
      {!focusClean && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {modeConfigs
              .filter((m) => m.enabled)
              .map((m) => {
                const isSelected = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveMode(m.id);
                      setActiveLesson(null);
                      resetRun(m.id, null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[36px] ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m.shortTitle}
                  </button>
                );
              })}
          </div>

          <button
            type="button"
            onClick={onExitToDashboard}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Arena Title & Mode Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {activeMode === 'lesson' && activeLesson ? activeLesson.title : modeConfig?.title || 'Typing Practice'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {activeMode === 'lesson' && activeLesson
              ? `${activeLesson.difficulty} · Target ${activeLesson.targetWpm} WPM · ${activeLesson.targetAccuracy}% Accuracy`
              : modeConfig?.description}
          </p>
        </div>

        {/* Quick Arena Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              updateSettings({
                soundProfile: settings.soundProfile === 'off' ? 'mechanical' : 'off',
              })
            }
            aria-label="Toggle keyboard sound"
            className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            {settings.soundProfile === 'off' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-500" />}
            <span className="hidden sm:inline">{settings.soundProfile === 'off' ? 'Muted' : 'Sound On'}</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ showKeyboard: !settings.showKeyboard })}
            aria-label="Toggle virtual keyboard"
            className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <KeyboardIcon className={`w-4 h-4 ${settings.showKeyboard ? 'text-violet-500' : ''}`} />
            <span className="hidden sm:inline">Keyboard</span>
          </button>

          <button
            type="button"
            onClick={() => setFocusClean((f) => !f)}
            aria-label="Toggle focus mode"
            className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            {focusClean ? <Eye className="w-4 h-4 text-blue-500" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{focusClean ? 'Show Nav' : 'Focus'}</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry HUD */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] px-3.5 py-2.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Speed</div>
          <div className="font-mono-typing text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {metrics.wpm} <span className="text-xs font-normal text-slate-400">WPM</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] px-3.5 py-2.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Accuracy</div>
          <div className="font-mono-typing text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {metrics.accuracy}%
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] px-3.5 py-2.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {isTimedMode ? 'Remaining' : 'Elapsed'}
          </div>
          <div className="font-mono-typing text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatTime(metrics.remainingSec)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] px-3.5 py-2.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Mistakes</div>
          <div className="font-mono-typing text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {mistakes}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] px-3.5 py-2.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Words</div>
          <div className="font-mono-typing text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {metrics.wordsTyped}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] px-3.5 py-2.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Streak</div>
          <div className="font-mono-typing text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
            {streak}
          </div>
        </div>
      </div>

      {/* Main Typing Stage or Final Summary */}
      {phase !== 'FINISHED' ? (
        <div
          onClick={() => inputRef.current?.focus()}
          className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 ${activeTheme.backdropClass} p-5 sm:p-8 cursor-text transition-colors`}
        >
          {activeTheme.previewImage && (
            <>
              <img
                src={activeTheme.previewImage}
                alt={activeTheme.name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
              />
              <div className="absolute inset-0 bg-slate-950/70 pointer-events-none" />
            </>
          )}

          {/* Hidden cross-device input capture for desktop, iOS Safari, and Android virtual keyboards */}
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={(e) => processInputDelta(e.target.value)}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Typing input field"
            className="absolute opacity-0 pointer-events-none w-px h-px"
          />

          <div className="relative z-10 space-y-5">
            {/* Progress hairline */}
            <div className="flex items-center justify-between text-xs opacity-75">
              <span>
                {phase === 'READY'
                  ? 'Tap here or begin typing on your keyboard to start'
                  : phase === 'PAUSED'
                  ? 'Paused — Press Resume to continue'
                  : 'Keep your eyes on the upcoming words'}
              </span>
              <span className="tabular-nums font-medium">
                {activeMode === 'endless' ? `${metrics.wordsTyped} words typed` : `${progressPct}%`}
              </span>
            </div>

            <div className="h-1 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-150"
                style={{ width: `${activeMode === 'endless' ? Math.min(100, (metrics.wordsTyped % 50) * 2) : progressPct}%` }}
              />
            </div>

            {/* Rendered Typing Passage */}
            <div
              className={`font-mono-typing text-lg sm:text-2xl leading-[1.85] tracking-wide max-h-[210px] sm:max-h-[240px] overflow-y-auto pr-2 select-none ${
                phase === 'PAUSED' ? 'blur-sm opacity-40' : ''
              }`}
            >
              {targetText.split('').map((char, idx) => {
                const isTyped = idx < typedText.length;
                const isCurrent = idx === typedText.length;
                const isCorrect = isTyped && typedText[idx] === char;
                const isWrong = isTyped && typedText[idx] !== char;

                let charClass = activeTheme.previewImage || activeTheme.id !== 'obsidian-core'
                  ? 'text-slate-400/80'
                  : 'text-slate-400 dark:text-slate-500';

                if (isCorrect) {
                  charClass = activeTheme.previewImage || activeTheme.id !== 'obsidian-core'
                    ? 'text-emerald-300'
                    : 'text-emerald-600 dark:text-emerald-400';
                } else if (isWrong) {
                  charClass =
                    'text-rose-600 dark:text-rose-400 bg-rose-500/15 underline decoration-rose-500 decoration-2 underline-offset-4 rounded-xs';
                } else if (isCurrent) {
                  charClass = activeTheme.previewImage || activeTheme.id !== 'obsidian-core'
                    ? 'text-white'
                    : 'text-slate-900 dark:text-white';
                }

                const displayChar = char === ' ' && isWrong ? '·' : char;

                return (
                  <span
                    key={idx}
                    ref={isCurrent ? activeCharRef : undefined}
                    className={`relative ${charClass} ${
                      isCurrent && settings.caretStyle === 'block'
                        ? 'bg-blue-600/25 rounded-xs'
                        : isCurrent && settings.caretStyle === 'underline'
                        ? 'border-b-2 border-blue-500'
                        : ''
                    }`}
                  >
                    {isCurrent && settings.caretStyle === 'line' && (
                      <span className="typing-caret absolute -left-[1px] top-1 bottom-1 w-[2px] bg-blue-500 rounded-full" />
                    )}
                    {displayChar}
                  </span>
                );
              })}
            </div>

            {/* Stage Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetRun();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart (Esc)</span>
                </button>

                {phase === 'RUNNING' || phase === 'PAUSED' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (phase === 'RUNNING') {
                        setPhase('PAUSED');
                      } else {
                        setPhase('RUNNING');
                        inputRef.current?.focus();
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
                  >
                    {phase === 'PAUSED' ? (
                      <>
                        <Play className="w-3.5 h-3.5 text-blue-500" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>

              {(activeMode === 'endless' || (phase === 'RUNNING' && typedText.length >= 15)) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    finishRun();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:from-blue-500 hover:to-violet-500 transition-all min-h-[40px]"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Finish &amp; Save Score</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Session Complete</span>
                {resultSummary?.isPersonalBest && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-violet-600 dark:text-violet-400">New Personal Best</span>
                  </>
                )}
                {resultSummary?.leveledUp && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Level Up</span>
                  </>
                )}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics.wpm} WPM · {metrics.accuracy}% Accuracy
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Final Score: <strong className="text-slate-900 dark:text-white tabular-nums">{resultSummary?.session.score ?? Math.round(metrics.wpm * 10 * (metrics.accuracy / 100))}</strong> pts
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Coins Earned</div>
                  <div className="font-mono-typing text-base font-bold text-slate-900 dark:text-white tabular-nums">
                    +{resultSummary?.session.coinsEarned ?? 0}
                  </div>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">XP Gained</div>
                  <div className="font-mono-typing text-base font-bold text-slate-900 dark:text-white tabular-nums">
                    +{resultSummary?.session.xpEarned ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Raw Speed</div>
              <div className="font-mono-typing text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {metrics.rawWpm} WPM
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Words Typed</div>
              <div className="font-mono-typing text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {metrics.wordsTyped}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Mistakes</div>
              <div className="font-mono-typing text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                {mistakes}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Time</div>
              <div className="font-mono-typing text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatTime(Math.max(1, Math.round(elapsedMs / 1000)))}
              </div>
            </div>
          </div>

          {topMissedList.length > 0 && (
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Keys to practice: </span>
              {topMissedList.map(([key, count], i) => (
                <span key={key}>
                  {i > 0 && <span className="mx-1.5 text-slate-400">·</span>}
                  <span className="font-mono-typing font-semibold text-rose-600 dark:text-rose-400">{key}</span> ({count})
                </span>
              ))}
            </div>
          )}

          {resultSummary?.newlyUnlockedAchievements && resultSummary.newlyUnlockedAchievements.length > 0 && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
                <Trophy className="w-4 h-4" />
                <span>Achievements Unlocked</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-700 dark:text-slate-200">
                {resultSummary.newlyUnlockedAchievements.map((id) => {
                  const def = ACHIEVEMENTS.find((a) => a.id === id);
                  return def ? (
                    <span key={id} className="font-medium">
                      {def.title} (+{def.coinBonus} coins)
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => resetRun()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-violet-500 transition-all min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            {activeMode === 'lesson' && nextLessonItem && onSelectLesson && (
              <button
                type="button"
                onClick={() => onSelectLesson(nextLessonItem)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                <span>Next Lesson: {nextLessonItem.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onExitToDashboard}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
            >
              <span>Dashboard</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Interactive Virtual Keyboard & Finger Guide */}
      {settings.showKeyboard && phase !== 'FINISHED' && (
        <VirtualKeyboard
          expectedChar={expectedChar}
          lastPressedKey={lastKeyFlash}
          showFingerColors={settings.showFingerColors}
          onVirtualKeyPress={handleVirtualKey}
        />
      )}
    </div>
  );
};
