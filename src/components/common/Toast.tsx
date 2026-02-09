import React, { useEffect } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 6000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-green-600',
      border: 'border-green-500',
      icon: <ShieldCheck className="text-white shrink-0" size={20} />,
      subtitle: 'Operation Verified'
    },
    error: {
      bg: 'bg-red-600',
      border: 'border-red-500',
      icon: <AlertTriangle className="text-white shrink-0" size={20} />,
      subtitle: 'Critical Core Error'
    },
    warning: {
      bg: 'bg-amber-600',
      border: 'border-amber-500',
      icon: <AlertTriangle className="text-white shrink-0" size={20} />,
      subtitle: 'Warning Notice'
    }
  };

  const { bg, border, icon, subtitle } = config[type];

  return (
    <div className={`${bg} shadow-2xl px-6 py-4 rounded-xl flex items-center justify-between space-x-3 border ${border} animate-in slide-in-from-top-4 pointer-events-auto`}>
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {icon}
        <div className="flex flex-col min-w-0">
          <span className="text-white font-black text-xs uppercase tracking-wider truncate">
            {message}
          </span>
          <span className="text-[9px] text-white/70 uppercase tracking-widest font-black mt-0.5">
            {subtitle}
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}