import React from 'react';

export type FingerId =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky';

export interface KeyDef {
  code: string;
  label: string;
  shiftLabel?: string;
  finger: FingerId;
  width?: 'normal' | 'tab' | 'caps' | 'shift' | 'space' | 'enter' | 'backspace';
}

export const FINGER_LABELS: Record<FingerId, { name: string; colorClass: string; badgeBg: string }> = {
  'left-pinky': {
    name: 'Left Pinky',
    colorClass: 'border-violet-400/50 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    badgeBg: 'bg-violet-500',
  },
  'left-ring': {
    name: 'Left Ring Finger',
    colorClass: 'border-blue-400/50 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-500',
  },
  'left-middle': {
    name: 'Left Middle Finger',
    colorClass: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-500',
  },
  'left-index': {
    name: 'Left Index Finger',
    colorClass: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-500',
  },
  thumb: {
    name: 'Either Thumb',
    colorClass: 'border-slate-300 dark:border-slate-600 bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200',
    badgeBg: 'bg-slate-500',
  },
  'right-index': {
    name: 'Right Index Finger',
    colorClass: 'border-amber-400/50 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-500',
  },
  'right-middle': {
    name: 'Right Middle Finger',
    colorClass: 'border-sky-400/50 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    badgeBg: 'bg-sky-500',
  },
  'right-ring': {
    name: 'Right Ring Finger',
    colorClass: 'border-indigo-400/50 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-500',
  },
  'right-pinky': {
    name: 'Right Pinky',
    colorClass: 'border-fuchsia-400/50 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
    badgeBg: 'bg-fuchsia-500',
  },
};

export const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { code: '`', label: '`', shiftLabel: '~', finger: 'left-pinky' },
    { code: '1', label: '1', shiftLabel: '!', finger: 'left-pinky' },
    { code: '2', label: '2', shiftLabel: '@', finger: 'left-ring' },
    { code: '3', label: '3', shiftLabel: '#', finger: 'left-middle' },
    { code: '4', label: '4', shiftLabel: '$', finger: 'left-index' },
    { code: '5', label: '5', shiftLabel: '%', finger: 'left-index' },
    { code: '6', label: '6', shiftLabel: '^', finger: 'right-index' },
    { code: '7', label: '7', shiftLabel: '&', finger: 'right-index' },
    { code: '8', label: '8', shiftLabel: '*', finger: 'right-middle' },
    { code: '9', label: '9', shiftLabel: '(', finger: 'right-ring' },
    { code: '0', label: '0', shiftLabel: ')', finger: 'right-pinky' },
    { code: '-', label: '-', shiftLabel: '_', finger: 'right-pinky' },
    { code: '=', label: '=', shiftLabel: '+', finger: 'right-pinky' },
    { code: 'Backspace', label: 'Back', finger: 'right-pinky', width: 'backspace' },
  ],
  [
    { code: 'Tab', label: 'Tab', finger: 'left-pinky', width: 'tab' },
    { code: 'q', label: 'Q', finger: 'left-pinky' },
    { code: 'w', label: 'W', finger: 'left-ring' },
    { code: 'e', label: 'E', finger: 'left-middle' },
    { code: 'r', label: 'R', finger: 'left-index' },
    { code: 't', label: 'T', finger: 'left-index' },
    { code: 'y', label: 'Y', finger: 'right-index' },
    { code: 'u', label: 'U', finger: 'right-index' },
    { code: 'i', label: 'I', finger: 'right-middle' },
    { code: 'o', label: 'O', finger: 'right-ring' },
    { code: 'p', label: 'P', finger: 'right-pinky' },
    { code: '[', label: '[', shiftLabel: '{', finger: 'right-pinky' },
    { code: ']', label: ']', shiftLabel: '}', finger: 'right-pinky' },
    { code: '\\', label: '\\', shiftLabel: '|', finger: 'right-pinky' },
  ],
  [
    { code: 'Caps', label: 'Caps', finger: 'left-pinky', width: 'caps' },
    { code: 'a', label: 'A', finger: 'left-pinky' },
    { code: 's', label: 'S', finger: 'left-ring' },
    { code: 'd', label: 'D', finger: 'left-middle' },
    { code: 'f', label: 'F', finger: 'left-index' },
    { code: 'g', label: 'G', finger: 'left-index' },
    { code: 'h', label: 'H', finger: 'right-index' },
    { code: 'j', label: 'J', finger: 'right-index' },
    { code: 'k', label: 'K', finger: 'right-middle' },
    { code: 'l', label: 'L', finger: 'right-ring' },
    { code: ';', label: ';', shiftLabel: ':', finger: 'right-pinky' },
    { code: "'", label: "'", shiftLabel: '"', finger: 'right-pinky' },
    { code: 'Enter', label: 'Enter', finger: 'right-pinky', width: 'enter' },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', finger: 'left-pinky', width: 'shift' },
    { code: 'z', label: 'Z', finger: 'left-pinky' },
    { code: 'x', label: 'X', finger: 'left-ring' },
    { code: 'c', label: 'C', finger: 'left-middle' },
    { code: 'v', label: 'V', finger: 'left-index' },
    { code: 'b', label: 'B', finger: 'left-index' },
    { code: 'n', label: 'N', finger: 'right-index' },
    { code: 'm', label: 'M', finger: 'right-index' },
    { code: ',', label: ',', shiftLabel: '<', finger: 'right-middle' },
    { code: '.', label: '.', shiftLabel: '>', finger: 'right-ring' },
    { code: '/', label: '/', shiftLabel: '?', finger: 'right-pinky' },
    { code: 'ShiftRight', label: 'Shift', finger: 'right-pinky', width: 'shift' },
  ],
  [{ code: ' ', label: 'Space', finger: 'thumb', width: 'space' }],
];

export function findKeyForChar(char: string): { key: KeyDef | null; needsShift: boolean } {
  if (!char) return { key: null, needsShift: false };
  if (char === ' ') {
    return { key: KEYBOARD_ROWS[4][0], needsShift: false };
  }
  for (const row of KEYBOARD_ROWS) {
    for (const key of row) {
      if (key.code === char) {
        return { key, needsShift: false };
      }
      if (key.code.length === 1 && key.code.toUpperCase() === char && char !== char.toLowerCase()) {
        return { key, needsShift: true };
      }
      if (key.shiftLabel === char) {
        return { key, needsShift: true };
      }
    }
  }
  return { key: null, needsShift: false };
}

interface VirtualKeyboardProps {
  expectedChar?: string;
  lastPressedKey?: { char: string; correct: boolean } | null;
  showFingerColors?: boolean;
  onVirtualKeyPress?: (char: string) => void;
  selectedGuideKey?: KeyDef | null;
  onSelectGuideKey?: (key: KeyDef) => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  expectedChar = '',
  lastPressedKey,
  showFingerColors = true,
  onVirtualKeyPress,
  selectedGuideKey,
  onSelectGuideKey,
}) => {
  const target = findKeyForChar(expectedChar);
  const activeGuide = selectedGuideKey || target.key;

  const getWidthClass = (width?: KeyDef['width']) => {
    switch (width) {
      case 'backspace':
        return 'flex-[1.7]';
      case 'tab':
        return 'flex-[1.4]';
      case 'caps':
        return 'flex-[1.65]';
      case 'enter':
        return 'flex-[1.85]';
      case 'shift':
        return 'flex-[2.2]';
      case 'space':
        return 'w-full max-w-[340px] mx-auto';
      default:
        return 'flex-1';
    }
  };

  const handleTap = (key: KeyDef) => {
    if (onSelectGuideKey) {
      onSelectGuideKey(key);
    }
    if (!onVirtualKeyPress) return;
    if (key.code === 'Backspace') {
      onVirtualKeyPress('Backspace');
      return;
    }
    if (key.code === ' ') {
      onVirtualKeyPress(' ');
      return;
    }
    if (key.code.length === 1) {
      const charToEmit = target.needsShift && key.code === target.key?.code ? (key.shiftLabel || key.code.toUpperCase()) : key.code;
      onVirtualKeyPress(charToEmit);
    }
  };

  return (
    <div className="w-full select-none">
      {activeGuide && (
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 px-1">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${FINGER_LABELS[activeGuide.finger].badgeBg}`} />
            <span className="font-medium">
              {selectedGuideKey ? 'Selected Key:' : 'Next Key:'}{' '}
              <strong className="font-mono-typing text-slate-900 dark:text-white">
                {activeGuide.code === ' ' ? 'Space' : target.needsShift ? `${activeGuide.shiftLabel || activeGuide.label} (Shift + ${activeGuide.label})` : activeGuide.label}
              </strong>
            </span>
          </div>
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Finger: <strong className="text-slate-800 dark:text-slate-200">{FINGER_LABELS[activeGuide.finger].name}</strong>
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-[#0D1422] p-2 sm:p-3 space-y-1.5">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const isTarget = target.key?.code === key.code;
              const isSelected = selectedGuideKey?.code === key.code;
              const isShiftNeeded =
                target.needsShift &&
                ((key.code === 'ShiftLeft' && target.key?.finger.startsWith('right')) ||
                  (key.code === 'ShiftRight' && target.key?.finger.startsWith('left')));
              const isLastPressed =
                lastPressedKey &&
                (lastPressedKey.char.toLowerCase() === key.code.toLowerCase() ||
                  (key.shiftLabel && lastPressedKey.char === key.shiftLabel));

              const isHomeBump = key.code === 'f' || key.code === 'j';

              let keyStyle =
                'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200';
              if (showFingerColors) {
                keyStyle = FINGER_LABELS[key.finger].colorClass;
              }
              if (isTarget || isShiftNeeded || isSelected) {
                keyStyle =
                  'border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-400/50 scale-[1.03]';
              } else if (isLastPressed) {
                keyStyle = lastPressedKey.correct
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-500 bg-rose-500/20 text-rose-700 dark:text-rose-300';
              }

              return (
                <button
                  key={key.code}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleTap(key);
                  }}
                  className={`relative flex flex-col items-center justify-center rounded-lg border text-[11px] sm:text-xs font-semibold h-9 sm:h-11 transition-all duration-100 active:scale-95 ${getWidthClass(
                    key.width
                  )} ${keyStyle}`}
                >
                  {key.shiftLabel && (
                    <span className="text-[9px] opacity-60 leading-none mb-0.5 hidden sm:inline">
                      {key.shiftLabel}
                    </span>
                  )}
                  <span className="leading-none">{key.label}</span>
                  {isHomeBump && (
                    <span className="absolute bottom-1 w-3 h-0.5 rounded-full bg-current opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
