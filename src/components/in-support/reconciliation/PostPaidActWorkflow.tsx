import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Play,
  Download,
  ChevronRight,
  Loader2,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { getAuthHeader } from '../../../services/auth.service';
import { API_ENDPOINTS } from '../../../services/endpoints';

interface DownloadableFile {
  name: string;
  blob: Blob;
}

type JobStatus = 'idle' | 'running' | 'done' | 'error';

interface JobState {
  status: JobStatus;
  message?: string;
  downloads?: DownloadableFile[];
}

// ─── File Slot ────────────────────────────────────────────────────────────────

function FileSlot({
  label,
  hint,
  file,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  file: File | null;
  onChange: (f: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      {hint && <p className="text-[9px] font-bold text-gray-300 mb-2">{hint}</p>}
      <label
        className={`block cursor-pointer ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {file ? (
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
            <FileText size={18} className="text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-black truncate">{file.name}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <CheckCircle size={16} className="text-green-500 shrink-0" />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#FFCC00] transition-colors">
            <Upload size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Click to upload CSV
            </p>
          </div>
        )}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        disabled={disabled}
        onChange={e => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function DownloadGroup({ files }: { files: DownloadableFile[] }) {
  return (
    <div className="space-y-2 mt-4">
      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">
        Generated Files — Download
      </p>
      {files.map((f, i) => (
        <button
          key={i}
          onClick={() => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(f.blob);
            a.download = f.name;
            a.click();
          }}
          className="w-full flex items-center space-x-3 p-3 bg-black rounded-xl hover:bg-gray-900 transition-colors group"
        >
          <Download size={14} className="text-[#FFCC00] shrink-0" />
          <span className="text-[10px] font-black text-white truncate flex-1 text-left">{f.name}</span>
          <ChevronRight size={12} className="text-gray-600 group-hover:text-[#FFCC00] transition-colors shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ─── Job Card (independent — no locking) ─────────────────────────────────────

function JobCard({
  number, title, description, state, children,
}: {
  number: number;
  title: string;
  description: string;
  state: JobState;
  children: React.ReactNode;
}) {
  const borderCls =
    state.status === 'done'    ? 'border-green-300' :
    state.status === 'running' ? 'border-[#FFCC00]' :
    state.status === 'error'   ? 'border-red-300'   :
                                 'border-gray-200';

  return (
    <div className={`bg-white rounded-[2rem] border-2 ${borderCls} p-8 transition-all`}>
      <div className="flex items-start space-x-4 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
          state.status === 'done'    ? 'bg-green-500 text-white' :
          state.status === 'running' ? 'bg-[#FFCC00] text-black animate-pulse' :
          state.status === 'error'   ? 'bg-red-500 text-white' :
                                       'bg-black text-[#FFCC00]'
        }`}>
          {state.status === 'done'    ? <CheckCircle size={18} /> :
           state.status === 'running' ? <Loader2 size={18} className="animate-spin" /> :
           state.status === 'error'   ? <AlertCircle size={18} /> :
           number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h3 className="text-sm font-black text-black uppercase tracking-wide">{title}</h3>
            {state.status === 'done' && (
              <span className="text-[8px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Complete</span>
            )}
          </div>
          <p className="text-[9px] font-bold text-gray-400 mt-1">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {children}
        {state.status === 'error' && state.message && (
          <div className="flex items-center space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-600">{state.message}</p>
          </div>
        )}
        {state.status === 'done' && state.message && !state.downloads?.length && (
          <div className="flex items-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <CheckCircle size={16} className="text-green-500 shrink-0" />
            <p className="text-xs font-bold text-green-700">{state.message}</p>
          </div>
        )}
        {state.status === 'done' && state.downloads && state.downloads.length > 0 && (
          <DownloadGroup files={state.downloads} />
        )}
      </div>
    </div>
  );
}

function ExecButton({ onClick, disabled, loading, label }: {
  onClick: () => void; disabled: boolean; loading: boolean; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full px-8 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-[.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
    >
      {loading
        ? <><Loader2 size={16} className="animate-spin" /><span>Processing…</span></>
        : <><Play size={16} /><span>{label}</span></>}
    </button>
  );
}

async function postFormData(
  url: string,
  fields: { key: string; file: File }[]
): Promise<{ ok: boolean; blob?: Blob; json?: any; error?: string; filename?: string }> {
  const fd = new FormData();
  fields.forEach(({ key, file }) => fd.append(key, file));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: getAuthHeader() },
      body: fd,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => `HTTP ${res.status}`);
      return { ok: false, error: txt || `HTTP ${res.status}` };
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return { ok: true, json: await res.json() };
    }
    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^;"'\n]+)/i);
    const filename = match?.[1]?.trim() || 'download.zip';
    return { ok: true, blob, filename };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Request failed' };
  }
}

// ─── PostPaidActWorkflow ──────────────────────────────────────────────────────

interface PostPaidActWorkflowProps {
  onBack: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function PostPaidActWorkflow({ onBack, onSuccess, onError }: PostPaidActWorkflowProps) {
  // Job 1: Act PreToPost (single file)
  const [job1File, setJob1File] = useState<File | null>(null);
  const [job1State, setJob1State] = useState<JobState>({ status: 'idle' });

  // Job 2: Act Credit Limit Change (single file)
  const [job2File, setJob2File] = useState<File | null>(null);
  const [job2State, setJob2State] = useState<JobState>({ status: 'idle' });

  const runJob1 = async () => {
    if (!job1File) return;
    setJob1State({ status: 'running' });
    const res = await postFormData(API_ENDPOINTS.PROCESS_PRE_TO_POST, [
      { key: 'file', file: job1File },
    ]);
    if (!res.ok) {
      setJob1State({ status: 'error', message: res.error });
      onError(res.error || 'Act PreToPost failed');
      return;
    }
    const downloads = res.blob ? [{ name: res.filename || 'pre_to_post_result.zip', blob: res.blob }] : [];
    setJob1State({
      status: 'done',
      message: res.json?.message || 'PreToPost activation completed successfully',
      downloads,
    });
    onSuccess('Act PreToPost: Completed');
  };

  const runJob2 = async () => {
    if (!job2File) return;
    setJob2State({ status: 'running' });
    const res = await postFormData(API_ENDPOINTS.PROCESS_CREDIT_LIMITS, [
      { key: 'file', file: job2File },
    ]);
    if (!res.ok) {
      setJob2State({ status: 'error', message: res.error });
      onError(res.error || 'Credit Limit Change failed');
      return;
    }
    const downloads = res.blob ? [{ name: res.filename || 'credit_limits_result.zip', blob: res.blob }] : [];
    setJob2State({
      status: 'done',
      message: res.json?.message || 'Credit limit changes applied successfully',
      downloads,
    });
    onSuccess('Act Credit Limit Change: Completed');
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-xs font-black text-gray-400 uppercase tracking-wider hover:text-black transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Job Selection</span>
      </button>

      {/* Header */}
      <div className="bg-black p-8 rounded-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">
              Pending Reconciliation
            </p>
            <h2 className="text-2xl font-black text-[#FFCC00] uppercase italic tracking-tighter">
              Postpaid Activation
            </h2>
            <p className="text-[9px] font-bold text-gray-500 mt-2">
              2 independent jobs · Run in any order
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {[job1State, job2State].map((s, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                  s.status === 'done'    ? 'bg-green-500 border-green-500 text-white' :
                  s.status === 'error'   ? 'bg-red-500 border-red-500 text-white' :
                  s.status === 'running' ? 'bg-[#FFCC00] border-[#FFCC00] text-black' :
                  'bg-transparent border-[#FFCC00] text-[#FFCC00]'
                }`}
              >
                {s.status === 'done' ? '✓' : i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner - jobs are independent */}
      <div className="flex items-center space-x-3 p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-black text-blue-600">ℹ</span>
        </div>
        <p className="text-[10px] font-bold text-blue-700">
          These two jobs are <span className="font-black">independent</span> — they can be run in any order or separately.
        </p>
      </div>

      {/* Job 1: Act PreToPost */}
      <JobCard
        number={1}
        title="Act PreToPost"
        description="Activate prepaid-to-postpaid migration for subscribers"
        state={job1State}
      >
        <FileSlot
          label="PostpaidActProvisioning File"
          hint="PostpaidActProvisioning CSV"
          file={job1File}
          onChange={setJob1File}
          disabled={job1State.status === 'running' || job1State.status === 'done'}
        />
        {job1State.status !== 'done' && (
          <ExecButton
            onClick={runJob1}
            disabled={!job1File}
            loading={job1State.status === 'running'}
            label="Run Act PreToPost"
          />
        )}
        {job1State.status === 'done' && (
          <button
            onClick={() => { setJob1File(null); setJob1State({ status: 'idle' }); }}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Run Again</span>
          </button>
        )}
      </JobCard>

      {/* Job 2: Credit Limit Change */}
      <JobCard
        number={2}
        title="Act Credit Limit Change"
        description="Apply credit limit changes for postpaid subscribers"
        state={job2State}
      >
        <FileSlot
          label="PostpaidOrders File"
          hint="PostpaidOrders CSV"
          file={job2File}
          onChange={setJob2File}
          disabled={job2State.status === 'running' || job2State.status === 'done'}
        />
        {job2State.status !== 'done' && (
          <ExecButton
            onClick={runJob2}
            disabled={!job2File}
            loading={job2State.status === 'running'}
            label="Run Credit Limit Change"
          />
        )}
        {job2State.status === 'done' && (
          <button
            onClick={() => { setJob2File(null); setJob2State({ status: 'idle' }); }}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Run Again</span>
          </button>
        )}
      </JobCard>
    </div>
  );
}