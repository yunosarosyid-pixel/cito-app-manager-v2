import React from 'react';
import { CheckCircle, Bell, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  const isDraft = message.includes('🔴') || message.toLowerCase().includes('draft') || message.toLowerCase().includes('draf');
  const isTeam = !isDraft && (message.includes('🔔') || message.toLowerCase().includes('tim'));

  const bgClass = isDraft
    ? 'bg-red-700 border-2 border-red-300 text-white'
    : isTeam
    ? 'bg-amber-600 border-2 border-amber-300 text-white'
    : 'bg-[#275d1d] border-2 border-white/40 text-white';

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 max-w-md ${bgClass}`}>
      {isDraft ? (
        <AlertCircle className="w-5 h-5 text-white shrink-0 animate-pulse" />
      ) : isTeam ? (
        <Bell className="w-5 h-5 text-white shrink-0 animate-bounce" />
      ) : (
        <CheckCircle className="w-5 h-5 text-white shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-extrabold tracking-wide leading-tight">{message}</span>
    </div>
  );
};
