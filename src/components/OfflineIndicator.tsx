import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/95 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-lg backdrop-blur-sm">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode — Local practice &amp; cached lessons active</span>
    </div>
  );
};
