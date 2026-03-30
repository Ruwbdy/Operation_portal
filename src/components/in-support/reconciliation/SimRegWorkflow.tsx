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

interface StepFile {
  file: File | null;
  label: string;
  key: string;
  hint?: string;
}

interface DownloadableFile {
  name: string;
  url: string;
  blob: Blob;
}

type StepStatus = 'idle' | 'ready' | 'running' | 'done' | 'error';

interface StepState {
  status: StepStatus;
  message?: string;
  downloads?: DownloadableFile[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        Generated Files — Download All
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
          <span className="text-[10px] font-black text-white truncate flex-1 text-left">
            {f.name}
          </span>
          <ChevronRight size={12} className="text-gray-600 group-hover:text-[#FFCC00] transition-colors shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({
  number,
  title,
  description,
  state,
  children,
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
      {/* Header */}
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
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-black text-black uppercase tracking-wide">
              {title}
            </h3>
            {state.status === 'done' && (
              <span className="text-[8px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Complete
              </span>
            )}
          </div>
          <p className="text-[9px] font-bold text-gray-400 mt-1">{description}</p>
        </div>
      </div>

      {/* Content */}
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

// ─── Exec Button ──────────────────────────────────────────────────────────────

function ExecButton({
  onClick,
  disabled,
  loading,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full px-8 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-[.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
    >
      {loading ? (
        <><Loader2 size={16} className="animate-spin" /><span>Processing…</span></>
      ) : (
        <><Play size={16} /><span>{label}</span></>
      )}
    </button>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────

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
      headers: {
        Authorization: getAuthHeader(),
      },
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        error: text || `HTTP ${res.status}`,
      };
    }

    const contentType = res.headers.get('content-type') || '';

    // ─────────────────────────────────────────────
    // 1. Handle JSON responses
    // ─────────────────────────────────────────────
    if (contentType.includes('application/json')) {
      const json = await res.json();

      // ✅ Case: Base64 file inside JSON
      if (json?.base64String && json?.fileName) {
        try {
          const byteCharacters = atob(json.base64String);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);

          // Detect file type (default zip)
          const mimeType =
            json.fileName.endsWith('.zip')
              ? 'application/zip'
              : 'application/octet-stream';

          const blob = new Blob([byteArray], { type: mimeType });

          return {
            ok: true,
            blob,
            filename: json.fileName,
          };
        } catch (err: any) {
          return {
            ok: false,
            error: 'Failed to decode file from server response',
          };
        }
      }

      // ✅ Normal JSON response
      return { ok: true, json };
    }

    // ─────────────────────────────────────────────
    // 2. Handle Blob/file responses
    // ─────────────────────────────────────────────
    const blob = await res.blob();

    // Extract filename from headers
    const contentDisposition = res.headers.get('content-disposition') || '';
    let filename = 'download';

    const match = contentDisposition.match(
      /filename\*?=(?:UTF-8'')?["']?([^;"'\n]+)/i
    );

    if (match?.[1]) {
      filename = decodeURIComponent(match[1].trim());
    } else {
      // fallback by content type
      if (contentType.includes('zip')) filename = 'download.zip';
      else if (contentType.includes('csv')) filename = 'download.csv';
    }

    return {
      ok: true,
      blob,
      filename,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error',
    };
  }
}

// ─── Parse a zip blob into individual named files ──────────────────────────────
// Since we can't import JSZip easily, we expose the whole zip as one download.
async function blobToDownloads(blob: Blob, filename: string): Promise<DownloadableFile[]> {
  return [{ name: filename, url: '', blob }];
}

// ─── SimRegWorkflow ────────────────────────────────────────────────────────────

interface SimRegWorkflowProps {
  onBack: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function SimRegWorkflow({ onBack, onSuccess, onError }: SimRegWorkflowProps) {
  // Step 1: Initiate Sim Reg (prepaid + postpaid files → zip download)
  const [step1Files, setStep1Files] = useState<{ prepaid: File | null; postpaid: File | null }>({
    prepaid: null,
    postpaid: null,
  });
  const [step1State, setStep1State] = useState<StepState>({ status: 'idle' });

  // Step 2: Process Sim Reg (input csv + dsaImsi csv → zip download)
  const [step2Files, setStep2Files] = useState<{ input: File | null; dsaImsi: File | null }>({
    input: null,
    dsaImsi: null,
  });
  const [step2State, setStep2State] = useState<StepState>({ status: 'idle' });

  // Step 3: Replay Sim Reg (single file)
  const [step3File, setStep3File] = useState<File | null>(null);
  const [step3State, setStep3State] = useState<StepState>({ status: 'idle' });

  // ── Step 1 ─────────────────────────────────────────────────────────────────

  const runStep1 = async () => {
    if (!step1Files.prepaid || !step1Files.postpaid) return;
    setStep1State({ status: 'running' });
    const res = await postFormData(API_ENDPOINTS.INITIATE_SIM_REG, [
      { key: 'prepaid', file: step1Files.prepaid },
      { key: 'postpaid', file: step1Files.postpaid },
    ]);
    if (!res.ok) {
      setStep1State({ status: 'error', message: res.error });
      onError(res.error || 'Step 1 failed');
      return;
    }
    const downloads = res.blob
      ? await blobToDownloads(res.blob, res.filename || 'sim_reg_initiated.zip')
      : [];
    setStep1State({
      status: 'done',
      message: res.json?.message || 'Sim Reg initiated — download the output files',
      downloads,
    });
    onSuccess('Step 1: Sim Reg initiated successfully');
  };

  // ── Step 2 ─────────────────────────────────────────────────────────────────

  const runStep2 = async () => {
    if (!step2Files.input || !step2Files.dsaImsi) return;
    setStep2State({ status: 'running' });
    const res = await postFormData(API_ENDPOINTS.PROCESS_SIM_REG, [
      { key: 'input', file: step2Files.input },
      { key: 'dsaImsi', file: step2Files.dsaImsi },
    ]);
    if (!res.ok) {
      setStep2State({ status: 'error', message: res.error });
      onError(res.error || 'Step 2 failed');
      return;
    }
    const downloads = res.blob
      ? await blobToDownloads(res.blob, res.filename || 'sim_reg_processed.zip')
      : [];
    setStep2State({
      status: 'done',
      message: res.json?.message || 'Sim Reg processed — download the output files',
      downloads,
    });
    onSuccess('Step 2: Sim Reg processed');
  };

  // ── Step 3 ─────────────────────────────────────────────────────────────────

  const runStep3 = async () => {
    if (!step3File) return;
    setStep3State({ status: 'running' });
    const res = await postFormData(API_ENDPOINTS.REPLAY_SIM_REG, [
      { key: 'input', file: step3File },
    ]);
    if (!res.ok) {
      setStep3State({ status: 'error', message: res.error });
      onError(res.error || 'Step 3 failed');
      return;
    }
    const downloads = res.blob
      ? await blobToDownloads(res.blob, res.filename || 'sim_reg_replay.zip')
      : [];
    setStep3State({
      status: 'done',
      message: res.json?.message || 'Sim Reg replayed successfully',
      downloads,
    });
    onSuccess('Step 3: Sim Reg replayed');
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
              SIM Registration
            </h2>
            <p className="text-[9px] font-bold text-gray-500 mt-2">
              3-step sequential workflow · Complete each step in order
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {[step1State, step2State, step3State].map((s, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                  s.status === 'done'  ? 'bg-green-500 border-green-500 text-white' :
                  s.status === 'error' ? 'bg-red-500 border-red-500 text-white' :
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

      {/* Step 1: Initiate Sim Reg */}
      <StepCard
        number={1}
        title="Initiate Sim Reg"
        description="Upload prepaid and postpaid CSV files to initiate SIM registration"
        state={step1State}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileSlot
            label="Prepaid File"
            hint="SimRegPendingProvisioning CSV"
            file={step1Files.prepaid}
            onChange={f => setStep1Files(p => ({ ...p, prepaid: f }))}
            disabled={step1State.status === 'running' || step1State.status === 'done'}
          />
          <FileSlot
            label="Postpaid File"
            hint="PostpaidActProvisioning CSV"
            file={step1Files.postpaid}
            onChange={f => setStep1Files(p => ({ ...p, postpaid: f }))}
            disabled={step1State.status === 'running' || step1State.status === 'done'}
          />
        </div>
        {step1State.status !== 'done' && (
          <ExecButton
            onClick={runStep1}
            disabled={!step1Files.prepaid || !step1Files.postpaid}
            loading={step1State.status === 'running'}
            label="Initiate Sim Reg"
          />
        )}
      </StepCard>

      {/* Step 2: Process Sim Reg */}
      <StepCard
        number={2}
        title="Process Sim Reg (DSA IMSI)"
        description="Upload the processed sim_reg CSV and DSA IMSI file"
        state={step2State}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileSlot
            label="Sim Reg Input File"
            hint="sim_reg_pending_*.csv from Step 1 output"
            file={step2Files.input}
            onChange={f => setStep2Files(p => ({ ...p, input: f }))}
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
            disabled={!step2Files.input || !step2Files.dsaImsi}
            loading={step2State.status === 'running'}
            label="Process Sim Reg"
          />
        )}
      </StepCard>

      {/* Step 3: Replay Sim Reg */}
      <StepCard
        number={3}
        title="Replay Sim Reg"
        description="Upload the failed SIM registration replay file"
        state={step3State}
      >
        <FileSlot
          label="Replay File"
          hint="replay_sim_reg*.csv from Step 2 failed output"
          file={step3File}
          onChange={setStep3File}
          disabled={step3State.status === 'running' || step3State.status === 'done'}
        />
        {step3State.status !== 'done' && (
          <ExecButton
            onClick={runStep3}
            disabled={!step3File}
            loading={step3State.status === 'running'}
            label="Replay Sim Reg"
          />
        )}
        {step3State.status === 'done' && !step3State.downloads?.length && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-center">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm font-black text-green-700 uppercase tracking-wide">
              SIM Registration Workflow Complete
            </p>
          </div>
        )}
      </StepCard>

      {/* Reset */}
      {(step1State.status !== 'idle' || step2State.status !== 'idle') && (
        <button
          onClick={() => {
            setStep1Files({ prepaid: null, postpaid: null });
            setStep1State({ status: 'idle' });
            setStep2Files({ input: null, dsaImsi: null });
            setStep2State({ status: 'idle' });
            setStep3File(null);
            setStep3State({ status: 'idle' });
          }}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
        >
          <RotateCcw size={14} />
          <span>Reset Workflow</span>
        </button>
      )}
    </div>
  );
}