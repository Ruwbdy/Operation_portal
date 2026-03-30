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

type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface StepState {
  status: StepStatus;
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

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({
  number, title, description, state, children,
}: {
  number: number;
  title: string;
  description: string;
  state: StepState;
  children: React.ReactNode;
}) {
  const borderCls =
    state.status === 'done'    ? 'border-green-300' :
    state.status === 'running' ? 'border-[#FFCC00]' :
    state.status === 'error'   ? 'border-red-300'   :
                                 'border-gray-200';

  return (
    <div className={`rounded-[2rem] border-2 ${borderCls} bg-white p-8 transition-all`}>
      <div className="flex items-start space-x-4 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
          state.status === 'done'    ? 'bg-green-500 text-white' :
          state.status === 'running' ? 'bg-[#FFCC00] text-black animate-pulse' :
          state.status === 'error'   ? 'bg-red-500 text-white' :
                                       'bg-black text-[#FFCC00]'
        }`}>
          {state.status === 'done' ? <CheckCircle size={18} /> :
           state.status === 'running' ? <Loader2 size={18} className="animate-spin" /> :
           state.status === 'error' ? <AlertCircle size={18} /> :
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
): Promise<{
  ok: boolean;
  blob?: Blob;
  json?: any;
  error?: string;
  filename?: string;
}> {
  const fd = new FormData();
  fields.forEach(({ key, file }) => fd.append(key, file));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: getAuthHeader() },
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `HTTP ${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';

    // ─────────────────────────────────────────────
    // 1. JSON response (may contain base64 file)
    // ─────────────────────────────────────────────
    if (contentType.includes('application/json')) {
      const json = await res.json();

      // ✅ Handle base64 file response
      if (json?.base64String && json?.fileName) {
        try {
          const byteCharacters = atob(json.base64String);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);

          // ✅ Detect file type dynamically
          let mimeType = 'application/octet-stream';

          if (json.fileName.endsWith('.zip')) {
            mimeType = 'application/zip';
          } else if (json.fileName.endsWith('.csv')) {
            mimeType = 'text/csv';
          }

          const blob = new Blob([byteArray], { type: mimeType });

          return {
            ok: true,
            blob,
            filename: json.fileName,
          };
        } catch {
          return { ok: false, error: 'Failed to decode file from server response' };
        }
      }

      return { ok: true, json };
    }

    // ─────────────────────────────────────────────
    // 2. Direct file (Blob) response
    // ─────────────────────────────────────────────
    const blob = await res.blob();

    const contentDisposition = res.headers.get('content-disposition') || '';
    let filename = 'download';

    const match = contentDisposition.match(
      /filename\*?=(?:UTF-8'')?["']?([^;"'\n]+)/i
    );

    if (match?.[1]) {
      filename = decodeURIComponent(match[1].trim());
    } else {
      // fallback by type
      if (contentType.includes('zip')) filename = 'download.zip';
      else if (contentType.includes('csv')) filename = 'download.csv';
    }

    return { ok: true, blob, filename };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

// ─── SimSwapWorkflow ──────────────────────────────────────────────────────────

interface SimSwapWorkflowProps {
  onBack: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function SimSwapWorkflow({ onBack, onSuccess, onError }: SimSwapWorkflowProps) {
  // Step 1: Initiate Sim Swap (simSwap file → zip)
  const [step1File, setStep1File] = useState<File | null>(null);
  const [step1State, setStep1State] = useState<StepState>({ status: 'idle' });

  // Step 2: Process Sim Swap IMSI (simSwap + dsaImsi → zip)
  const [step2Files, setStep2Files] = useState<{ simSwap: File | null; dsaImsi: File | null }>({
    simSwap: null,
    dsaImsi: null,
  });
  const [step2State, setStep2State] = useState<StepState>({ status: 'idle' });

  const runStep1 = async () => {
    if (!step1File) return;
    setStep1State({ status: 'running' });
    const res = await postFormData(API_ENDPOINTS.INITIATE_SIM_SWAP, [
      { key: 'simSwap', file: step1File },
    ]);
    if (!res.ok) {
      setStep1State({ status: 'error', message: res.error });
      onError(res.error || 'Step 1 failed');
      return;
    }
    const downloads = res.blob ? [{ name: res.filename || 'sim_swap_initiated.zip', blob: res.blob }] : [];
    setStep1State({
      status: 'done',
      message: res.json?.message || 'Sim Swap initiated — download output files',
      downloads,
    });
    onSuccess('Step 1: Sim Swap initiated');
  };

  const runStep2 = async () => {
    if (!step2Files.simSwap || !step2Files.dsaImsi) return;
    setStep2State({ status: 'running' });
    const res = await postFormData(API_ENDPOINTS.PROCESS_SIM_SWAP_IMSI, [
      { key: 'simSwap', file: step2Files.simSwap },
      { key: 'dsaImsi', file: step2Files.dsaImsi },
    ]);
    if (!res.ok) {
      setStep2State({ status: 'error', message: res.error });
      onError(res.error || 'Step 2 failed');
      return;
    }
    const downloads = res.blob ? [{ name: res.filename || 'sim_swap_processed.zip', blob: res.blob }] : [];
    setStep2State({
      status: 'done',
      message: res.json?.message || 'Sim Swap processed successfully',
      downloads,
    });
    onSuccess('Step 2: Sim Swap processed');
  };

  const reset = () => {
    setStep1File(null);
    setStep1State({ status: 'idle' });
    setStep2Files({ simSwap: null, dsaImsi: null });
    setStep2State({ status: 'idle' });
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
              SIM Swap
            </h2>
            <p className="text-[9px] font-bold text-gray-500 mt-2">
              2-step sequential workflow · Complete each step in order
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {[step1State, step2State].map((s, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                  s.status === 'done'    ? 'bg-green-500 border-green-500 text-white' :
                  s.status === 'error'   ? 'bg-red-500 border-red-500 text-white' :
                  s.status === 'running' ? 'bg-[#FFCC00] border-[#FFCC00] text-black' :
                  i === 0 ? 'bg-transparent border-[#FFCC00] text-[#FFCC00]' :
                  'bg-transparent border-gray-700 text-gray-600'
                }`}
              >
                {s.status === 'done' ? '✓' : i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1 */}
      <StepCard
        number={1}
        title="Initiate Sim Swap"
        description="Upload the SIM swap pending provisioning CSV"
        state={step1State}
      >
        <FileSlot
          label="Sim Swap File"
          hint="SwapPendingProvisioning CSV"
          file={step1File}
          onChange={setStep1File}
          disabled={step1State.status === 'running' || step1State.status === 'done'}
        />
        {step1State.status !== 'done' && (
          <ExecButton
            onClick={runStep1}
            disabled={!step1File}
            loading={step1State.status === 'running'}
            label="Initiate Sim Swap"
          />
        )}
      </StepCard>

      {/* Step 2 */}
      <StepCard
        number={2}
        title="Process Sim Swap IMSI"
        description="Upload the processed swap CSV and DSA IMSI file"
        state={step2State}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileSlot
            label="Sim Swap File"
            hint="unique_swaps_*.csv from Step 1 output"
            file={step2Files.simSwap}
            onChange={f => setStep2Files(p => ({ ...p, simSwap: f }))}
            disabled={step2State.status === 'running' || step2State.status === 'done'}
          />
          <FileSlot
            label="DSA IMSI File"
            hint="dsa_imsi *.csv"
            file={step2Files.dsaImsi}
            onChange={f => setStep2Files(p => ({ ...p, dsaImsi: f }))}
            disabled={step2State.status === 'running' || step2State.status === 'done'}
          />
        </div>
        {step2State.status !== 'done' && (
          <ExecButton
            onClick={runStep2}
            disabled={!step2Files.simSwap || !step2Files.dsaImsi}
            loading={step2State.status === 'running'}
            label="Process Sim Swap IMSI"
          />
        )}
        {step2State.status === 'done' && !step2State.downloads?.length && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-center">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm font-black text-green-700 uppercase tracking-wide">
              SIM Swap Workflow Complete
            </p>
          </div>
        )}
      </StepCard>

      {step1State.status !== 'idle' && (
        <button
          onClick={reset}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
        >
          <RotateCcw size={14} />
          <span>Reset Workflow</span>
        </button>
      )}
    </div>
  );
}