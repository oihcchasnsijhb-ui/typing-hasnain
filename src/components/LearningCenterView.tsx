import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Hand, Play, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LessonCategory, LessonItem } from '../types/game';
import { FINGER_LABELS, VirtualKeyboard, type FingerId, type KeyDef } from './VirtualKeyboard';

interface LearningCenterViewProps {
  onStartLesson: (lesson: LessonItem) => void;
}

const CATEGORIES: Array<{ id: 'all' | 'guide' | LessonCategory; label: string }> = [
  { id: 'all', label: 'All Lessons' },
  { id: 'guide', label: 'Finger Tutorial' },
  { id: 'home-row', label: 'Home Row' },
  { id: 'left-hand', label: 'Left Hand' },
  { id: 'right-hand', label: 'Right Hand' },
  { id: 'alphabet', label: 'Alphabet' },
  { id: 'words', label: 'Words' },
  { id: 'sentences', label: 'Sentences' },
  { id: 'numbers-symbols', label: 'Numbers & Symbols' },
  { id: 'advanced', label: 'Advanced' },
];

export const LearningCenterView: React.FC<LearningCenterViewProps> = ({ onStartLesson }) => {
  const { lessons, activeProfile } = useApp();
  const [selectedTab, setSelectedTab] = useState<'all' | 'guide' | LessonCategory>('all');
  const [selectedGuideKey, setSelectedGuideKey] = useState<KeyDef>({
    code: 'f',
    label: 'F',
    finger: 'left-index',
  });

  const filteredLessons = useMemo(() => {
    if (selectedTab === 'all' || selectedTab === 'guide') return lessons;
    return lessons.filter((l) => l.category === selectedTab);
  }, [lessons, selectedTab]);

  const completedCount = Object.values(activeProfile.completedLessons).filter((l) => l.stars >= 1).length;

  const fingerGuideItems: Array<{ finger: FingerId; keys: string }> = [
    { finger: 'left-pinky', keys: '1, Q, A, Z, Tab, Shift' },
    { finger: 'left-ring', keys: '2, W, S, X' },
    { finger: 'left-middle', keys: '3, E, D, C' },
    { finger: 'left-index', keys: '4, 5, R, T, F (Home), G, V, B' },
    { finger: 'thumb', keys: 'Spacebar' },
    { finger: 'right-index', keys: '6, 7, Y, U, H, J (Home), N, M' },
    { finger: 'right-middle', keys: '8, I, K, ,' },
    { finger: 'right-ring', keys: '9, O, L, .' },
    { finger: 'right-pinky', keys: '0, P, ;, /, Enter, Backspace' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Structured Typing Course
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Learn Touch Typing Step by Step
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {completedCount} of {lessons.length} lessons completed · Progress from home row foundations to advanced syntax.
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const active = selectedTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedTab(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors min-h-[38px] ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Finger Placement Tutorial */}
      {(selectedTab === 'guide' || selectedTab === 'all') && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Hand className="w-4 h-4 text-violet-500" />
                <span>Interactive Finger Placement Guide</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
                Rest your left fingers on <strong>A S D F</strong> and your right fingers on <strong>J K L ;</strong>. Feel the raised bumps on <strong>F</strong> and <strong>J</strong> with your index fingers so you never have to look down. Click any key below to inspect its assigned finger.
              </p>
            </div>
            {lessons[0] && (
              <button
                type="button"
                onClick={() => onStartLesson(lessons[0])}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:from-blue-500 hover:to-violet-500 whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Lesson 1</span>
              </button>
            )}
          </div>

          <VirtualKeyboard
            showFingerColors
            selectedGuideKey={selectedGuideKey}
            onSelectGuideKey={setSelectedGuideKey}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {fingerGuideItems.map((item) => {
              const info = FINGER_LABELS[item.finger];
              return (
                <div
                  key={item.finger}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3 py-2 text-xs"
                >
                  <span className={`w-3 h-3 rounded-sm shrink-0 ${info.badgeBg}`} />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-white">{info.name}: </span>
                    <span className="font-mono-typing text-slate-600 dark:text-slate-300">{item.keys}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lessons Grid */}
      {selectedTab !== 'guide' && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((lesson, idx) => {
            const progress = activeProfile.completedLessons[lesson.id];
            const isDone = (progress?.stars ?? 0) >= 1;

            return (
              <div
                key={lesson.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1624] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Lesson {idx + 1} · {lesson.difficulty} · +{lesson.coinReward} Coins
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {lesson.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {lesson.description}
                  </p>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 px-3 py-2 font-mono-typing text-xs text-slate-600 dark:text-slate-300 truncate">
                    {lesson.text}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            (progress?.stars ?? 0) >= starIdx
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span>
                      {progress ? `${progress.bestWpm} WPM` : `Goal ${lesson.targetWpm} WPM`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartLesson(lesson)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isDone ? 'Practice Again' : 'Start Lesson'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};
