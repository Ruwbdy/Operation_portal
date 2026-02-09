import React, { useState, useEffect } from 'react';
import { 
  PanelLeftClose, 
  PanelLeftOpen,
  Activity,
  Zap,
  Terminal,
  Layers,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '../components/common/Sidebar';
import Toast from '../components/common/Toast';
import { MOCK_OPERATION_HISTORY } from '../data/mockData';
import type { ResolvedIssue, AIAnalysis } from '../types';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<ResolvedIssue[]>(MOCK_OPERATION_HISTORY);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const stats = [
    { name: 'Manual Fixes', count: history.filter(h => !h.isJob).length, color: '#FFCC00' },
    { name: 'Bulk Jobs', count: history.filter(h => h.isJob).length, color: '#000000' },
  ];

  // Mock AI analysis
  useEffect(() => {
    setTimeout(() => {
      setAiAnalysis({
        summary: "Network operations stable. Recent call profile resets show consistent signaling improvements.",
        suggestions: [
          "Monitor VoLTE activation rates for potential infrastructure optimization",
          "Schedule batch SIM registration during off-peak hours for improved throughput",
          "Review credit limit resolution patterns to identify common subscriber issues"
        ]
      });
    }, 1500);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-[#FFCC00] selection:text-black font-sans">
      {/* Toast Notifications */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center space-y-4 pointer-events-none">
        {errorToast && (
          <Toast
            type="error"
            message={errorToast}
            onClose={() => setErrorToast(null)}
          />
        )}
        {successToast && (
          <Toast
            type="success"
            message={successToast}
            onClose={() => setSuccessToast(null)}
          />
        )}
      </div>

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
                  Operational Status
                </span>
                <div className="flex items-center space-x-2">
                  <span className="bg-black text-[#FFCC00] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                    v5.4 PROD
                  </span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter uppercase leading-none italic truncate">
              Operational Center
            </h1>
          </div>
          <div className="bg-white px-8 py-5 rounded-3xl shadow-xl border border-gray-100 flex items-center space-x-10 shrink-0">
            <div className="flex flex-col items-center">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">
                Throughput
              </p>
              <p className="text-3xl font-black text-black leading-none">{history.length}</p>
            </div>
            <div className="w-px h-10 bg-gray-100"></div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">
                Core Health
              </p>
              <p className="text-xl font-black text-green-500 uppercase italic leading-none">
                Optimal
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
          {/* Activity Log */}
          <div className="xl:col-span-8">
            <section className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-50">
                <h2 className="text-xl font-black text-black uppercase tracking-tight italic">
                  Audit Activity Log
                </h2>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {history.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-[#FFCC00] hover:bg-white transition-all group shadow-sm"
                  >
                    <div
                      className={`p-4 rounded-lg mr-6 transition-all group-hover:rotate-3 shrink-0 ${
                        issue.isJob
                          ? 'bg-black text-[#FFCC00]'
                          : 'bg-white text-black border border-gray-100 shadow-sm'
                      }`}
                    >
                      {issue.isJob ? <Layers size={18} /> : <Terminal size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-[#FFCC00] uppercase tracking-widest mb-0.5 truncate">
                        {issue.label}
                      </p>
                      <p className="text-xl font-black text-black leading-none truncate tracking-tighter italic">
                        {issue.identifier}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest truncate">
                        {issue.timestamp} • {issue.engineer}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="flex items-center justify-end text-green-600 font-black text-[8px] uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                        <CheckCircle size={10} className="mr-1" /> Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar - AI Analysis & Stats */}
          <div className="xl:col-span-4 space-y-10">
            {/* AI Analysis */}
            <section className="bg-black text-white p-8 lg:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-[6px] border-[#FFCC00]">
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="bg-[#FFCC00] p-2.5 rounded-xl shadow-lg shrink-0">
                    <Activity className="text-black" size={20} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h2 className="text-xl font-black uppercase tracking-tighter italic leading-none text-[#FFCC00]">
                      Architect Engine
                    </h2>
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-1">
                      Operational Analytics Active
                    </span>
                  </div>
                </div>
                {isAnalyzing ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-800 rounded-lg w-3/4 animate-pulse"></div>
                    <div className="h-16 bg-gray-900 rounded-xl w-full animate-pulse"></div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
                      <p className="text-[#FFCC00] text-sm font-black tracking-tight leading-tight italic">
                        "{aiAnalysis.summary}"
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 pl-2">
                        Optimization Vectors
                      </p>
                      {aiAnalysis.suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="group flex items-start space-x-3 text-sm bg-white/10 p-4 rounded-xl border border-white/5 hover:border-[#FFCC00]/30 transition-all cursor-default"
                        >
                          <span className="text-[#FFCC00] font-black text-base leading-none italic">
                            0{i + 1}
                          </span>
                          <span className="font-bold text-gray-400 leading-tight text-[9px] uppercase tracking-tight group-hover:text-white transition-colors">
                            {s}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl">
                    <Zap className="mx-auto mb-3 text-gray-800 opacity-20 shrink-0" size={32} />
                    <p className="text-gray-700 text-[9px] font-black uppercase tracking-[0.4em]">
                      Engine Standby
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Load Distribution Chart */}
            <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
              <h2 className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.4em] text-center italic">
                Load Capacity Distribution
              </h2>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%" >
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="1 1" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 8, fontWeight: 900, fill: '#bbb' }}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: '#fcfcfc' }}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={45}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}