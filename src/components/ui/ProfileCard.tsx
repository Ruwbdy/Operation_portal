import React from 'react';

interface ProfileCardProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}

export default function ProfileCard({ label, icon, color, children }: ProfileCardProps) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4 mb-8">
        <div className={`p-3 rounded-2xl shadow-sm ${color} shrink-0`}>
          {icon}
        </div>
        <h4 className="text-[12px] font-black text-black uppercase tracking-[0.2em] italic leading-none truncate">
          {label}
        </h4>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}