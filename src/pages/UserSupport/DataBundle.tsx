import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Wifi,
  Clock,
  Package,
  Database,
  Zap,
} from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import Toast from '../../components/common/Toast';
import { validateMSISDN, validateDateRange } from '../../utils/validators';
import StreamingBadge from '../../components/user-support/data-bundle/StreamingBadge';
import StatsBar from '../../components/user-support/data-bundle/StatsBar';
import EventStatusBar from '../../components/user-support/data-bundle/EventStatusBar';
import TraceCard from '../../components/user-support/data-bundle/TraceCard';
import RawDataTable from '../../components/user-support/data-bundle/RawDataTable';
import type { BundleFulfilmentRow, FulfilmentTrace } from '../../types';
import { streamBundleData } from '../../services/bundle/bundle.stream';
import { mergeCISIntoRows, mergeCCNIntoRows, mergeSDPIntoRows, buildFulfilmentTrace} from '../../services/bundle/bundle.logic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function todayLocal(): string {
  return fmtDate(new Date());
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return fmtDate(new Date(y, m - 1, d + days));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataBundle() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [msisdn,    setMsisdn]    = useState('');
  const [startDate, setStartDate] = useState(todayLocal());
  const [endDate,   setEndDate]   = useState(todayLocal());
  const [activeView, setActiveView] = useState<'trace' | 'table'>('trace');

  const [streamPhase, setStreamPhase] = useState<string>('idle');
  const [rows,   setRows]   = useState<Map<string, BundleFulfilmentRow>>(new Map());
  const [traces, setTraces] = useState<FulfilmentTrace[]>([]);
  const rowsRef = useRef<Map<string, BundleFulfilmentRow>>(new Map());

  // Per-event receipt tracking
  const [cisCount, setCisCount] = useState<number | null>(null);
  const [ccnCount, setCcnCount] = useState<number | null>(null);
  const [sdpCount, setSdpCount] = useState<number | null>(null);

  const [errorToast,   setErrorToast]   = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const abortRef = useRef<(() => void) | null>(null);

  // Rebuild traces from current row state.
  const rebuildState = useCallback((markPendingAsFailed = false) => {
    const newMap = new Map(rowsRef.current);
    setRows(newMap);
    const newTraces = Array.from(newMap.values())
      .map(buildFulfilmentTrace)
      .filter((t): t is FulfilmentTrace => t !== null)
      .map(t => {
        // When stream is complete and CCN never arrived, PENDING_CCN → FAILED
        if (markPendingAsFailed && t.fulfilmentStatus === 'PENDING_CCN') {
          return { ...t, fulfilmentStatus: 'FAILED' as const, ccnStatus: 'missing' as const };
        }
        return t;
      })
      .sort((a, b) => b.rawTimestamp - a.rawTimestamp);
    setTraces(newTraces);
  }, []);

  // ─── Date Handlers ──────────────────────────────────────────────────────────

  useEffect(() => {
    const maxEnd = addDays(startDate, 2);
    if (endDate < startDate) setEndDate(startDate);
    else if (endDate > maxEnd) setEndDate(maxEnd);
  }, [startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartDateChange = (val: string) => setStartDate(val);

  const handleEndDateChange = (val: string) => {
    const maxEnd = addDays(startDate, 2);
    if (val < startDate)     setEndDate(startDate);
    else if (val > maxEnd)   setEndDate(maxEnd);
    else                     setEndDate(val);
  };

  // ─── Search Handler ─────────────────────────────────────────────────────────

  const handleSearch = () => {
    const msisdnValidation = validateMSISDN(msisdn);
    if (!msisdnValidation.valid) {
      setErrorToast(msisdnValidation.error || 'Invalid MSISDN');
      return;
    }

    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.valid) {
      setErrorToast(dateValidation.error || 'Invalid date range');
      return;
    }

    const daysDiff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000;
    if (daysDiff > 2) {
      setErrorToast('Date range cannot exceed 2 days');
      return;
    }

    // Reset state
    if (abortRef.current) abortRef.current();
    rowsRef.current = new Map();
    setRows(new Map());
    setTraces([]);
    setStreamPhase('connecting');
    setCisCount(null);
    setCcnCount(null);
    setSdpCount(null);

    const norm = msisdnValidation.normalized!;
    const sd   = startDate.replace(/-/g, '');
    const ed   = endDate.replace(/-/g, '');

    abortRef.current = streamBundleData(norm, sd, ed, {
      onCIS: (records) => {
        records.forEach(r => mergeCISIntoRows(rowsRef.current, r));
        setCisCount(records.length);
        rebuildState();
      },
      onCCN: (records) => {
        records.forEach(r => mergeCCNIntoRows(rowsRef.current, r));
        setCcnCount(records.length);
        rebuildState();
      },
      onSDP: (records) => {
        records.forEach(r => mergeSDPIntoRows(rowsRef.current, r));
        setSdpCount(records.length);
        rebuildState();
      },
      onPhaseChange: (phase) => setStreamPhase(phase),
      onError:    (msg)  => { setErrorToast(msg); setStreamPhase('error'); },
      onComplete: ()     => {
        setStreamPhase('complete');
        setSuccessToast('Stream complete');
        // Stream is done — any trace still PENDING_CCN means CCN never arrived → FAILED
        rebuildState(true);
      },
    });
  };

  // ─── Derived ────────────────────────────────────────────────────────────────

  const hasData = rows.size > 0;
  const isStreaming =
    streamPhase === 'connecting' ||
    streamPhase === 'cis' ||
    streamPhase === 'ccn' ||
    streamPhase === 'sdp';

  const pendingCount = traces.filter(t => t.fulfilmentStatus === 'PENDING_CCN').length;

  const sortedRows = Array.from(rows.values()).sort((a, b) => {
    const ta = a.cis?.transaction_date_time ?? 0;
    const tb = b.cis?.transaction_date_time ?? 0;
    return tb - ta;
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-[#FFCC00] selection:text-black font-sans">

      {/* Toasts */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center space-y-4 pointer-events-none">
        {errorToast   && <Toast type="error"   message={errorToast}   onClose={() => setErrorToast(null)} />}
        {successToast && <Toast type="success" message={successToast} onClose={() => setSuccessToast(null)} />}
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

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
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
                <span className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">User Support Module</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-black text-[#FFCC00] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Active</span>
                  <StreamingBadge phase={streamPhase} />
                  {pendingCount > 0 && streamPhase === 'complete' && (
                    <span className="flex items-center gap-1 text-[8px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                      {pendingCount} Pending CCN
                    </span>
                  )}
                </div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter uppercase leading-none italic">
              Bundle Fulfilment
            </h1>
            <p className="text-sm font-bold text-gray-400 max-w-xl">
              Subscription history (CIS) traced against bundle provisioning (PAM CDR).
              CCN consulted as arbiter when PAM is absent and charge status is ambiguous.
            </p>
          </div>
        </header>

        {/* Search */}
        <div className="max-w-4xl mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">MSISDN</label>
                <input
                  type="text"
                  value={msisdn}
                  onChange={e => setMsisdn(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="234XXXXXXXXXX or 09XXXXXXXXX"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => handleStartDateChange(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                  End Date{' '}
                  <span className="text-gray-300 normal-case tracking-normal font-bold">(max 2 days)</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={addDays(startDate, 2)}
                  onChange={e => handleEndDateChange(e.target.value)}
                  onBlur={e => handleEndDateChange(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors"
                />
              </div>

            </div>

            <button
              onClick={handleSearch}
              disabled={isStreaming}
              className="w-full mt-6 px-8 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
            >
              {isStreaming ? (
                <>
                  <Wifi size={16} className="animate-pulse" />
                  <span>Streaming…</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Fetch Fulfilment Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Event receipt status */}
        {streamPhase !== 'idle' && (
          <EventStatusBar
            streamPhase={streamPhase}
            cisCount={cisCount}
            ccnCount={ccnCount}
            sdpCount={sdpCount}
          />
        )}

        {/* Stats */}
        {hasData && <StatsBar traces={traces} />}

        {/* View Toggle */}
        {hasData && (
          <div className="flex space-x-3 bg-white p-2.5 rounded-[1.5rem] shadow border border-gray-100 max-w-fit mb-8">
            {[
              { id: 'trace', label: 'Fulfilment Trace', icon: <Zap size={13} /> },
              { id: 'table', label: 'Raw Data Table',   icon: <Database size={13} /> },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id as 'trace' | 'table')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                  activeView === v.id
                    ? 'bg-black text-[#FFCC00] shadow'
                    : 'text-gray-400 hover:text-black hover:bg-gray-50'
                }`}
              >
                <span className={activeView === v.id ? 'text-[#FFCC00]' : 'text-gray-400'}>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {hasData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeView === 'trace' && (
              <div className="space-y-3 max-w-5xl">
                {traces.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
                    <Clock size={40} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-400">
                      No subscription events found in the loaded CIS records
                    </p>
                  </div>
                ) : (
                  traces.map(t => <TraceCard key={t.correlationId} trace={t} />)
                )}
              </div>
            )}
            {activeView === 'table' && <RawDataTable rows={sortedRows} />}
          </div>
        )}

        {/* Empty state */}
        {!hasData && streamPhase === 'idle' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-16 rounded-[2.5rem] shadow-xl border border-gray-100 text-center">
              <div className="bg-gray-50 w-24 h-24 rounded-2xl mx-auto mb-8 flex items-center justify-center">
                <Package size={48} className="text-gray-200" />
              </div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-4 italic">
                Enter Subscriber Details
              </h2>
              <p className="text-gray-400 text-sm font-bold leading-relaxed">
                Enter an MSISDN and date range to stream CIS subscription history and PAM bundle
                fulfilment records. CCN is fetched as a secondary arbiter for unresolved traces.
              </p>
            </div>
          </div>
        )}

        {!hasData && isStreaming && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-16 rounded-[2.5rem] shadow-xl border border-[#FFCC00] text-center">
              <Wifi size={48} className="text-[#FFCC00] mx-auto mb-6 animate-pulse" />
              <h2 className="text-xl font-black text-black uppercase tracking-tight mb-2 italic">
                Streaming Data…
              </h2>
              <p className="text-gray-400 text-sm font-bold">Waiting for CIS · PAM · CCN events</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}