import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Wrench } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import BatchJobUpload from '../../components/in-support/BatchJobUpload';

type JobType = 'CALL_PROFILE' | 'CREDIT_LIMIT' | 'DELETE_AIR' | 'DEACT_POSTPAID';

interface Job {
  id: JobType;
  label: string;
  description: string;
  filesNeeded: number;
}

const JOBS: Job[] = [
  {
    id: 'CALL_PROFILE',
    label: 'Reset Call Profile',
    description: 'Bulk reset of call profiles for resolving network signaling issues',
    filesNeeded: 1
  },
  {
    id: 'CREDIT_LIMIT',
    label: 'Resolve Credit Limit Issue',
    description: 'Batch resolution of credit limit problems for subscribers',
    filesNeeded: 1
  },
  {
    id: 'DELETE_AIR',
    label: 'Automation AIR Delete',
    description: 'Automated deletion of AIR records for cleanup operations',
    filesNeeded: 1
  },
  {
    id: 'DEACT_POSTPAID',
    label: 'Deactivate PostPaid Hub',
    description: 'Bulk deactivation of postpaid hub services',
    filesNeeded: 1
  }
];

export default function ServiceDesk() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeJob, setActiveJob] = useState<JobType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleExecuteJob = async (files: File[]) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setSuccessToast(`Job executed successfully: ${files.length} file(s) processed`);
      setActiveJob(null);
    } catch (error) {
      setErrorToast('Failed to execute batch job');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-[#FFCC00] selection:text-black font-sans">
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center space-y-4 pointer-events-none">
        {errorToast && (
          <Toast type="error" message={errorToast} onClose={() => setErrorToast(null)} />
        )}
        {successToast && (
          <Toast type="success" message={successToast} onClose={() => setSuccessToast(null)} />
        )}
      </div>

      {isProcessing && <LoadingSpinner message="Executing Batch Job..." />}

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
                  IN Support Module
                </span>
                <div className="flex items-center space-x-2">
                  <span className="bg-black text-[#FFCC00] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Active
                  </span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter uppercase leading-none italic">
              IN-Service Desk
            </h1>
            <p className="text-sm font-bold text-gray-500 leading-relaxed max-w-2xl">
              Batch profile reset automation for resolving call issues, credit limit problems, AIR deletions, and postpaid hub deactivations.
            </p>
          </div>
        </header>

        {activeJob === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {JOBS.map((job) => (
              <button
                key={job.id}
                onClick={() => setActiveJob(job.id)}
                className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-gray-100 hover:border-[#FFCC00] transition-all text-left group"
              >
                <div className="bg-black p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform">
                  <Wrench size={24} className="text-[#FFCC00]" />
                </div>
                <h3 className="text-sm font-black text-black uppercase tracking-wide mb-3">
                  {job.label}
                </h3>
                <p className="text-xs font-bold text-gray-500 leading-relaxed mb-4">
                  {job.description}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Files needed:
                  </span>
                  <span className="bg-[#FFCC00] text-black text-[9px] font-black px-2 py-1 rounded uppercase">
                    {job.filesNeeded}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl">
            <button
              onClick={() => setActiveJob(null)}
              className="mb-6 text-xs font-black text-gray-400 uppercase tracking-wider hover:text-black transition-colors"
            >
              ← Back to Job Selection
            </button>
            <BatchJobUpload
              jobType={activeJob}
              jobLabel={JOBS.find(j => j.id === activeJob)?.label || ''}
              filesNeeded={JOBS.find(j => j.id === activeJob)?.filesNeeded || 1}
              onExecute={handleExecuteJob}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </main>
    </div>
  );
}