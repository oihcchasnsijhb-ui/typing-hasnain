import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[44px]"
      >
        <Download className="w-4 h-4" />
        <span>{compact ? 'Install' : 'Install App'}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
      >
        <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>{isIOS ? 'Install on iOS' : compact ? 'Install App' : 'Install Desktop / Mobile'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Install Hasnain Typing
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isIOS ? (
              <div className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <p>Install Hasnain Typing directly onto your iPhone or iPad home screen:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-800 dark:text-slate-200">
                  <li>Tap the <strong>Share</strong> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner.</li>
                </ol>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <p>Install Hasnain Typing as a standalone app with offline practice support:</p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-800 dark:text-slate-200">
                  <li><strong>Windows / Mac (Chrome or Edge):</strong> Click the install icon in the browser address bar or Browser Menu &rarr; Install Hasnain Typing.</li>
                  <li><strong>Android (Chrome):</strong> Tap the browser menu (&vellip;) and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full rounded-xl bg-slate-900 dark:bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
