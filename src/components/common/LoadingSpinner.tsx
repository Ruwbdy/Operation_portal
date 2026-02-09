import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({ 
  size = 48, 
  fullScreen = true,
  message = 'Loading...' 
}: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 
        size={size} 
        className="text-[#FFCC00] animate-spin" 
      />
      {message && (
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[200] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}