import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Terminal, ClipboardList } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import BatchJobUpload from '../../components/in-support/BatchJobUpload';
import SimRegWorkflow from '../../components/in-support/reconciliation/SimRegWorkflow';
import SimSwapWorkflow from '../../components/in-support/reconciliation/SimSwapWorkflow';
import PostPaidActWorkflow from '../../components/in-support/reconciliation/PostPaidActWorkflow';

interface Job {
  id: string;
  label: string;
  description: string;
  expectedColumns: string[];
  section: 'bash' | 'recon';
  filesNeeded?: number;
  fileLabels?: string[];
  hideTextInput?: boolean;
  workflowComponent?: 'sim-reg' | 'sim-swap' | 'postpaid-act';
}

const BASH_JOBS: Job[] = [
  {
    id: 'ADD_OFFER',
    label: 'Add Offer',
    description: 'Bulk add an offer to subscribers.',
    expectedColumns: ['msisdn', 'offer_id'],
    section: 'bash'
  },
  {
    id: 'REMOVE_OFFER',
    label: 'Remove Offer',
    description: 'Bulk remove an offer from subscribers.',
    expectedColumns: ['msisdn', 'offer_id'],
    section: 'bash'
  },
  {
    id: 'ACTIVATE_SIM_BASH',
    label: 'Activate SIM',
    description: 'Bulk activate subscriber SIMs.',
    expectedColumns: ['msisdn'],
    section: 'bash'
  },
  {
    id: 'DEACTIVATE_SIM',
    label: 'Deactivate SIM',
    description: 'Bulk deactivate subscriber SIMs.',
    expectedColumns: ['msisdn'],
    section: 'bash'
  },
  {
    id: 'ACTIVATE_AF_AIR',
    label: 'Activate AF-AIR',
    description: 'Bulk activation of AF-AIR records for subscribers.',
    expectedColumns: ['msisdn'],
    section: 'bash'
  }
];

const RECON_JOBS: Job[] = [
  {
    id: 'SIMREG_PENDING_PROV',
    label: 'SimReg Pending Provisioning',
    description: '4-step sequential workflow: Initiate → Activate → Process → Replay.',
    expectedColumns: [],
    section: 'recon',
    hideTextInput: true,
    workflowComponent: 'sim-reg',
  },
  {
    id: 'SIMSWAP_PENDING_PROV',
    label: 'SimSwap Pending Provisioning',
    description: '2-step sequential workflow: Initiate → Process IMSI.',
    expectedColumns: [],
    section: 'recon',
    hideTextInput: true,
    workflowComponent: 'sim-swap',
  },
  {
    id: 'POSTPAID_ACT_PROV',
    label: 'Postpaid Act Provisioning',
    description: '2 independent jobs: Act PreToPost and Credit Limit Change.',
    expectedColumns: [],
    section: 'recon',
    hideTextInput: true,
    workflowComponent: 'postpaid-act',
  },
  {
    id: 'POSTPAID_PENDING_ORDERS',
    label: 'Postpaid Pending Orders',
    description: 'Upload postpaid pending order records for processing.',
    expectedColumns: [],
    section: 'recon',
    filesNeeded: 1,
    hideTextInput: true
  },
  {
    id: 'SUSPEND_REVOKE',
    label: 'Suspend and Revoke',
    description: 'Upload subscriber records for bulk suspension and revocation.',
    expectedColumns: [],
    section: 'recon',
    filesNeeded: 1,
    hideTextInput: true
  }
];

type ActiveView =
  | { type: 'list' }
  | { type: 'bash-job'; job: Job }
  | { type: 'workflow'; component: 'sim-reg' | 'sim-swap' | 'postpaid-act' };

export default function InOps() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'list' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleExecuteJob = async (_files: File[]) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      setSuccessToast('Job executed successfully');
      setActiveView({ type: 'list' });
    } catch {
      setErrorToast('Failed to execute batch job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJobClick = (job: Job) => {
    if (job.workflowComponent) {
      setActiveView({ type: 'workflow', component: job.workflowComponent });
    } else {
      setActiveView({ type: 'bash-job', job });
    }
  };

  const JobCard = ({ job }: { job: Job }) => (
    <button
      onClick={() => handleJobClick(job)}
      className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-gray-100 hover:border-[#FFCC00] transition-all text-left group"
    >
      <div className={`p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform ${
        job.section === 'bash' ? 'bg-black' : 'bg-gray-800'
      }`}>
        {job.section === 'bash'
          ? <Terminal size={22} className="text-[#FFCC00]" />
          : <ClipboardList size={22} className="text-[#FFCC00]" />
        }
      </div>
      <h3 className="text-sm font-black text-black uppercase tracking-wide mb-3">{job.label}</h3>
      <p className="text-xs font-bold text-gray-500 leading-relaxed mb-5">{job.description}</p>

      {job.expectedColumns.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {job.expectedColumns.map(col => (
            <span key={col} className="bg-gray-100 text-gray-600 text-[8px] font-black px-2 py-1 rounded uppercase tracking-wider">
              {col}
            </span>
          ))}
        </div>
      )}

      {job.workflowComponent && (
        <span className="text-[8px] font-black text-[#FFCC00] uppercase tracking-wider bg-black px-2 py-1 rounded">
          {job.workflowComponent === 'sim-reg'      ? '4-Step Workflow' :
           job.workflowComponent === 'sim-swap'     ? '2-Step Workflow' :
           job.workflowComponent === 'postpaid-act' ? '2 Independent Jobs' : ''}
        </span>
      )}

      {job.section === 'recon' && !job.workflowComponent && (
        <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded">
          File upload only
        </span>
      )}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-[#FFCC00] selection:text-black font-sans">
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center space-y-4 pointer-events-none">
        {errorToast && <Toast type="error" message={errorToast} onClose={() => setErrorToast(null)} />}
        {successToast && <Toast type="success" message={successToast} onClose={() => setSuccessToast(null)} />}
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
                <span className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">IN Support Module</span>
                <span className="bg-black text-[#FFCC00] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest w-fit mt-1">Active</span>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter uppercase leading-none italic">IN‑Ops</h1>
            <p className="text-sm font-bold text-gray-500 leading-relaxed max-w-2xl">
              General bash operations and pending reconciliation workflows — offers, SIM activations, and provisioning jobs.
            </p>
          </div>
        </header>

        {/* ── Job List ── */}
        {activeView.type === 'list' && (
          <div className="space-y-12">
            <section>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-black p-2 rounded-lg">
                  <Terminal size={16} className="text-[#FFCC00]" />
                </div>
                <h2 className="text-xs font-black text-black uppercase tracking-widest">General Bash Jobs</h2>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {BASH_JOBS.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            </section>

            <section>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gray-800 p-2 rounded-lg">
                  <ClipboardList size={16} className="text-[#FFCC00]" />
                </div>
                <h2 className="text-xs font-black text-black uppercase tracking-widest">Pending Reconciliation Jobs</h2>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {RECON_JOBS.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            </section>
          </div>
        )}

        {/* ── Bash Job Upload ── */}
        {activeView.type === 'bash-job' && (
          <div className="max-w-2xl">
            <button
              onClick={() => setActiveView({ type: 'list' })}
              className="mb-6 text-xs font-black text-gray-400 uppercase tracking-wider hover:text-black transition-colors"
            >
              ← Back to Job Selection
            </button>
            <BatchJobUpload
              jobType={activeView.job.id}
              jobLabel={activeView.job.label}
              filesNeeded={activeView.job.filesNeeded ?? 1}
              expectedColumns={activeView.job.expectedColumns}
              fileLabels={activeView.job.fileLabels}
              hideTextInput={activeView.job.hideTextInput}
              onExecute={handleExecuteJob}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* ── Workflow Views ── */}
        {activeView.type === 'workflow' && activeView.component === 'sim-reg' && (
          <div className="max-w-3xl">
            <SimRegWorkflow
              onBack={() => setActiveView({ type: 'list' })}
              onSuccess={msg => setSuccessToast(msg)}
              onError={msg => setErrorToast(msg)}
            />
          </div>
        )}

        {activeView.type === 'workflow' && activeView.component === 'sim-swap' && (
          <div className="max-w-3xl">
            <SimSwapWorkflow
              onBack={() => setActiveView({ type: 'list' })}
              onSuccess={msg => setSuccessToast(msg)}
              onError={msg => setErrorToast(msg)}
            />
          </div>
        )}

        {activeView.type === 'workflow' && activeView.component === 'postpaid-act' && (
          <div className="max-w-3xl">
            <PostPaidActWorkflow
              onBack={() => setActiveView({ type: 'list' })}
              onSuccess={msg => setSuccessToast(msg)}
              onError={msg => setErrorToast(msg)}
            />
          </div>
        )}
      </main>
    </div>
  );
}