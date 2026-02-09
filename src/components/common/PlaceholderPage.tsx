import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Package } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-[#FFCC00] selection:text-black font-sans">
      <Sidebar isOpen={isSidebarOpen} />

      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-8 left-8 z-[60] bg-black text-[#FFCC00] p-4 rounded-xl shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/10"
        >
          <PanelLeftOpen size={24} />
        </button>
      )}

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto transition-all duration-500">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center space-x-4 mb-1">
              {isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#FFCC00] transition-colors shrink-0"
                >
                  <PanelLeftClose size={20} />
                </button>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">
                  Module Status
                </span>
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                    IN DEVELOPMENT
                  </span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter uppercase leading-none italic">
              {title}
            </h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-16 rounded-[2.5rem] shadow-xl border border-gray-100 text-center">
            <div className="bg-gray-50 w-24 h-24 rounded-2xl mx-auto mb-8 flex items-center justify-center">
              <Package size={48} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-4 italic">
              Coming Soon
            </h2>
            <p className="text-gray-500 text-sm font-bold leading-relaxed mb-8">
              {description}
            </p>
            <div className="inline-block bg-[#FFCC00]/10 border-2 border-[#FFCC00] px-6 py-3 rounded-xl">
              <p className="text-[10px] font-black text-black uppercase tracking-widest">
                Module Under Active Development
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}