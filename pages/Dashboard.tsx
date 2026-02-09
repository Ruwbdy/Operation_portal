import React, { useState, useEffect, useCallback } from 'react';
import { ResolvedIssue, ManualOperationType, JobOperationType, CallResolutionItem } from '../types';
import { analyzeOperationalHistory } from '../services/geminiService';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  TowerControl as Tower, 
  Activity, 
  CircleCheck as CheckCircle, 
  Zap,
  Phone,
  Globe,
  MessageSquare,
  History,
  Terminal,
  Layers,
  ChevronRight,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  AlertTriangle,
  Loader2,
  Check,
  ShieldCheck,
  FileText,
  Upload,
  FileArchive,
  Play,
  Trash2,
  Monitor,
  Search,
  User,
  Tag,
  Code,
  CreditCard,
  MapPin,
  Clock,
  Info,
  Server,
  Wallet,
  CalendarDays,
  PackageCheck,
  Coins,
  RefreshCw,
  Send,
  AlignLeft
} from 'lucide-react';

const INITIAL_RESOLUTIONS: ResolvedIssue[] = [
  { id: '1', type: 'RESOLVE_CALL', label: "Resolve can't call", identifier: '2347062026931', details: 'Network signaling modules reset for user.', status: 'Success', timestamp: '2024-05-24 08:31', engineer: 'Osazuwa', isJob: false },
];

/**
 * Normalizes an item or array into an array.
 * Common in SOAP-to-JSON where single items aren't arrays.
 */
function normalizeArray(input: any) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return [input];
}

export default function Dashboard() {
  const [history, setHistory] = useState<ResolvedIssue[]>(INITIAL_RESOLUTIONS);
  const [activeTab, setActiveTab] = useState<'overview' | 'manual' | 'jobs' | 'misc' | 'replay'>('overview');
  const [aiAnalysis, setAiAnalysis] = useState<{ summary: string, suggestions: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [manualModal, setManualModal] = useState<{ type: ManualOperationType, label: string } | null>(null);
  const [jobModal, setJobModal] = useState<{ type: JobOperationType, label: string, filesNeeded: number } | null>(null);
  
  const [primaryInput, setPrimaryInput] = useState(''); // MSISDN or Transaction ID
  const [secondaryInput, setSecondaryInput] = useState(''); // Failure Reason or MSISDN (for DSA) or ID
  const [jobFiles, setJobFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  const [callResult, setCallResult] = useState<any | null>(null);
  const [activeMiscType, setActiveMiscType] = useState<ManualOperationType | null>(null);

  // Replay State
  const [xmlInput, setXmlInput] = useState('');
  const [xmlOutput, setXmlOutput] = useState('');

  const OPERATIONAL_STAFF = "Osazuwa";
  const OPERATIONAL_TOKEN = "Osazuwa@123456";

  const API_BASE = (process.env as any).API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  /**
   * Improved XML Pretty Printer
   */
  const formatXmlString = (xml: string) => {
    if (!xml) return '';
    try {
      let formatted = '';
      let reg = /(>)(<)(\/*)/g;
      let transition = xml.replace(reg, '$1\r\n$2$3');
      let pad = 0;
      transition.split('\r\n').forEach((node) => {
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
          indent = 0;
        } else if (node.match(/^<\/\w/)) {
          if (pad !== 0) pad -= 1;
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
          indent = 1;
        } else {
          indent = 0;
        }
        let padding = '';
        for (let i = 0; i < pad; i++) padding += '  ';
        formatted += padding + node + '\r\n';
        pad += indent;
      });
      return formatted.trim();
    } catch (e) {
      return xml;
    }
  };

  const handleManualFix = async (type: ManualOperationType, label: string, pVal: string, sVal?: string) => {
    if (!pVal) return;
    setIsProcessing(true);
    setCallResult(null);
    setActiveMiscType(null);

    try {
      let url = '';
      if (type === 'SEND_FAILURE') {
        url = `${API_BASE}/soap/send-failure?transactionId=${encodeURIComponent(pVal)}&failureReason=${encodeURIComponent(sVal || '')}`;
      } else if (type === 'SEND_SUCCESS') {
        url = `${API_BASE}/soap/send-success?transactionId=${encodeURIComponent(pVal)}`;
      } else if (type === 'SEND_DSA') {
        url = `${API_BASE}/soap/send-dsa-response?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&transactionId=${encodeURIComponent(pVal)}&msisdn=${encodeURIComponent(sVal || '')}`;
      } else if (type === 'ACTIVATE_SPKA') {
        url = `${API_BASE}/soap/activate-sim?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}`;
      } else if (type === 'CREATE_AF_AIR') {
        url = `${API_BASE}/soap/activate-monitor?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}`;
      } else if (type === 'GET_HLR') {
        url = `${API_BASE}/misc/get-hlr?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}`;
      } else if (type === 'GET_ACCOUNT_DETAILS') {
        url = `${API_BASE}/misc/get-account-details?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}`;
      } else if (type === 'GET_OFFERS') {
        url = `${API_BASE}/misc/get-offers?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}`;
      } else if (type === 'SET_SERVICE_CLASS') {
        url = `${API_BASE}/soap/set-sc?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}&serviceClassId=${encodeURIComponent(sVal || '')}`;
      } else if (type === 'ADD_OFFER') {
        url = `${API_BASE}/soap/set-offer?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}&offerId=${encodeURIComponent(sVal || '')}`;
      } else {
        url = `${API_BASE}/soap/process-call-issue?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}`;
      }

      const response = await fetch(url);
      if (!response.ok && !(type === 'ACTIVATE_SPKA' && response.status === 500)) {
        throw new Error(`Operational Node Rejected Request: ${response.status}`);
      }

      if (type === 'CREATE_AF_AIR') {
        setSuccessToast("AF AIR Created. Finalizing SPKA activation...");
        const spkaUrl = `${API_BASE}/soap/activate-sim?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(pVal)}`;
        const spkaResponse = await fetch(spkaUrl);
        if (!spkaResponse.ok && spkaResponse.status !== 500) {
          throw new Error("AF AIR success, but automatic SPKA activation failed.");
        }
        setSuccessToast("AF AIR Sequence & SPKA Activation Complete");
        const newIssue: ResolvedIssue = {
          id: Date.now().toString(), type, label, identifier: pVal, details: `Sequential AF AIR creation and SPKA activation for ${pVal}.`, status: 'Success', timestamp: new Date().toLocaleString(), engineer: OPERATIONAL_STAFF, isJob: false
        };
        setHistory(prev => [newIssue, ...prev]);
        setManualModal(null); setPrimaryInput(''); setSecondaryInput('');
        return;
      }

      const directSuccessTypes: ManualOperationType[] = ['SEND_FAILURE', 'SEND_SUCCESS', 'SEND_DSA', 'ACTIVATE_SPKA', 'SET_SERVICE_CLASS', 'ADD_OFFER'];
      if (directSuccessTypes.includes(type)) {
        setSuccessToast(`${label} processed successfully`);
        const newIssue: ResolvedIssue = {
          id: Date.now().toString(), type, label, identifier: pVal, details: `${label} sequence triggered for identifier: ${pVal}.`, status: 'Success', timestamp: new Date().toLocaleString(), engineer: OPERATIONAL_STAFF, isJob: false
        };
        setHistory(prev => [newIssue, ...prev]);
        setManualModal(null); setPrimaryInput(''); setSecondaryInput('');
        return;
      }

      const data = await response.json();
      if (data) {
        setActiveMiscType(['GET_HLR', 'GET_ACCOUNT_DETAILS', 'GET_OFFERS'].includes(type) ? type : null);
        setCallResult(data);
        const newIssue: ResolvedIssue = {
          id: Date.now().toString(), type, label, identifier: pVal, details: `${label} query completed for ${pVal}`, status: 'Success', timestamp: new Date().toLocaleString(), engineer: OPERATIONAL_STAFF, isJob: false
        };
        setHistory(prev => [newIssue, ...prev]);
        setManualModal(null); setPrimaryInput(''); setSecondaryInput('');
      } else {
        throw new Error("Subscriber identity mismatch in Intelligent Network.");
      }
    } catch (err: any) {
      setErrorToast(err.message || "Failed to establish signaling session with the core network.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReplayExecution = async () => {
    if (!xmlInput.trim()) return;
    setIsProcessing(true);
    setXmlOutput('Initializing protocol relay to target node...\nWaiting for response data stream...');
    
    try {
      const url = `${API_BASE}/misc/replay-xml`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: xmlInput
      });
      
      const responseText = await response.text();
      setXmlOutput(formatXmlString(responseText) || "Server returned empty protocol body.");
      
      if (response.ok) {
        setSuccessToast("Protocol replay executed successfully");
        const newIssue: ResolvedIssue = {
          id: Date.now().toString(), type: 'SEND_DSA', label: "XML Replay", identifier: "RAW_XML", details: "Manual XML payload replayed through proxy.", status: 'Success', timestamp: new Date().toLocaleString(), engineer: OPERATIONAL_STAFF, isJob: false
        };
        setHistory(prev => [newIssue, ...prev]);
      } else {
        setErrorToast(`Replay Node Rejected Payload: ${response.status}`);
      }
    } catch (err: any) {
      setXmlOutput(`CRITICAL FAULT:\n${err.message || "Could not establish connection to Replay Node."}`);
      setErrorToast("Core connection interrupted during relay.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveVolte = async (msisdn: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE}/soap/remove-volte?username=${encodeURIComponent(OPERATIONAL_STAFF)}&password=${encodeURIComponent(OPERATIONAL_TOKEN)}&msisdn=${encodeURIComponent(msisdn)}`);
      if (!response.ok) throw new Error(`VoLTE Node Error: ${response.status}`);
      setSuccessToast("Volte has been deactivated");
      const newIssue: ResolvedIssue = {
        id: Date.now().toString(), type: 'SEND_DSA', label: "VoLTE Termination", identifier: msisdn, details: 'VoLTE service successfully removed from subscriber profile.', status: 'Success', timestamp: new Date().toLocaleString(), engineer: OPERATIONAL_STAFF, isJob: false
      };
      setHistory(prev => [newIssue, ...prev]);
      setCallResult((prev: any) => {
        if (!prev || activeMiscType) return prev;
        const result = Array.isArray(prev) ? prev[0] : prev;
        const nextResolutions = { ...result.resolutions };
        Object.keys(nextResolutions).forEach(key => {
          if (key.toLowerCase().includes('volte')) {
            nextResolutions[key] = { ...nextResolutions[key], passed: true, 'action-taken': true };
          }
        });
        return Array.isArray(prev) ? [{ ...result, resolutions: nextResolutions }] : { ...result, resolutions: nextResolutions };
      });
    } catch (err: any) {
      setErrorToast(err.message || "Manual VoLTE deactivation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunJob = (type: JobOperationType, label: string) => {
    if (jobFiles.filter(Boolean).length < (jobModal?.filesNeeded || 0)) return;
    setIsProcessing(true);
    setTimeout(() => {
      const newIssue: ResolvedIssue = {
        id: Date.now().toString(), type, label, identifier: `JOB_${Date.now().toString().slice(-4)}`, details: `Bulk transaction sequence finished. Output logs generated.`, status: 'Success', timestamp: new Date().toLocaleString(), engineer: OPERATIONAL_STAFF, isJob: true, resultUrl: '#' 
      };
      setHistory(prev => [newIssue, ...prev]);
      setIsProcessing(false); setJobModal(null); setJobFiles([]);
    }, 3000);
  };

  const runAnalysis = useCallback(async () => {
    if (history.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeOperationalHistory(history);
      setAiAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [history]);

  useEffect(() => {
    if (activeTab !== 'manual' && activeTab !== 'misc' && activeTab !== 'replay') runAnalysis();
  }, [runAnalysis, activeTab]);

  const stats = [
    { name: 'Manual Fixes', count: history.filter(h => !h.isJob).length, color: '#FFCC00' },
    { name: 'Bulk Jobs', count: history.filter(h => h.isJob).length, color: '#000000' },
  ];

  const isItemResolved = (item: CallResolutionItem) => item.passed || item['action-taken'] === true;
  const diagnosticResult = !activeMiscType && Array.isArray(callResult) ? callResult[0] : null;
  const allResolved = diagnosticResult 
    ? Object.values(diagnosticResult.resolutions as Record<string, CallResolutionItem>).every(r => isItemResolved(r))
    : false;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-[#FFCC00] selection:text-black font-sans">
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center space-y-4 pointer-events-none">
        {errorToast && (
          <div className="bg-red-600 shadow-2xl px-6 py-4 rounded-xl flex items-center space-x-3 border border-red-500 animate-in slide-in-from-top-4 pointer-events-auto">
            <AlertTriangle className="text-white shrink-0" size={20} />
            <div className="flex flex-col min-w-0">
              <span className="text-white font-black text-xs uppercase tracking-wider">{errorToast}</span>
              <span className="text-[9px] text-white/70 uppercase tracking-widest font-black mt-0.5">Critical Core Error</span>
            </div>
          </div>
        )}
        {successToast && (
          <div className="bg-green-600 shadow-2xl px-6 py-4 rounded-xl flex items-center space-x-3 border border-green-500 animate-in slide-in-from-top-4 pointer-events-auto">
            <ShieldCheck className="text-white shrink-0" size={20} />
            <div className="flex flex-col min-w-0">
              <span className="text-white font-black text-xs uppercase tracking-wider">{successToast}</span>
              <span className="text-[9px] text-white/70 uppercase tracking-widest font-black mt-0.5">Operation Verified</span>
            </div>
          </div>
        )}
      </div>

      {callResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
              <div className="flex items-center space-x-4">
                <div className="bg-black p-3 rounded-xl shadow-lg shrink-0">
                  {activeMiscType ? <Search size={24} className="text-[#FFCC00]" /> : <Activity size={24} className="text-[#FFCC00]" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-black uppercase italic tracking-tighter leading-none">
                    {activeMiscType ? "Subscriber Profile Report" : `Diagnostic Result: ${diagnosticResult?.msisdn}`}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1.5">
                    {activeMiscType ? "High-Level Service Overview" : "Subscriber Profile Diagnosis Complete"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest border border-green-500/20 flex items-center">
                  <ShieldCheck size={14} className="mr-1.5" /> Core Sync Authenticated
                </div>
                <button onClick={() => { setCallResult(null); setActiveMiscType(null); }} className="bg-black text-white hover:bg-gray-800 p-2.5 rounded-full transition-all group">
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-gray-50/10">
              {activeMiscType ? (
                <div className="space-y-12 max-w-[1200px] mx-auto pb-20">
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SubscriberProfileHumanView data={callResult} type={activeMiscType} />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center space-x-3">
                        <Code size={18} className="text-gray-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Technical Data Protocol Dump</h4>
                      </div>
                      <span className="text-[9px] font-bold text-gray-300 uppercase italic">application/json stream</span>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 font-mono text-[11px] overflow-x-auto shadow-2xl relative group">
                      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <pre className="text-blue-300 leading-relaxed whitespace-pre scrollbar-thin scrollbar-thumb-white/10">
                        {JSON.stringify(callResult, null, 4)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {allResolved && (
                    <div className="mb-8 p-6 bg-green-50 rounded-2xl border-2 border-green-100 flex items-center space-x-5 animate-in slide-in-from-left-4">
                      <div className="bg-green-500 text-white p-3 rounded-xl shadow-xl shrink-0"><CheckCircle size={28} /></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xl font-black text-green-800 uppercase italic tracking-tight leading-none mb-1">Normalization Sequence Complete</h4>
                        <p className="text-[10px] font-bold text-green-700 opacity-80 uppercase tracking-widest leading-relaxed whitespace-normal break-words">Subscriber record is now fully synchronized with HLR/VLR and SDP nodes. All services normalized.</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {diagnosticResult && Object.entries(diagnosticResult.resolutions as Record<string, CallResolutionItem>).map(([key, value]) => {
                      const resolved = isItemResolved(value);
                      const actionTaken = value['action-taken'] === true;
                      const isFail = !resolved;
                      const isVolteKey = key.toLowerCase().includes('volte');

                      return (
                        <div key={key} className={`flex flex-col justify-between p-4 rounded-xl border-2 transition-all hover:bg-white group ${isFail ? 'bg-red-50 border-red-100' : actionTaken ? 'bg-amber-50 border-amber-100' : 'bg-gray-50/50 border-gray-100'}`}>
                           <div className="flex justify-between items-start mb-3">
                             <div className="flex-1 min-w-0 pr-2 overflow-hidden">
                                <h4 className="text-[10px] font-black text-black uppercase tracking-wider mb-1 break-all leading-tight">{key}</h4>
                                <p className="text-[9px] text-gray-400 font-bold italic uppercase tracking-tighter break-words leading-tight">{value.action}</p>
                             </div>
                             <div className={`flex items-center shrink-0 mt-0.5 space-x-1 px-2 py-1 rounded-md bg-white font-black text-[8px] uppercase tracking-widest shadow-sm border border-black/5 ${isFail ? 'text-red-600' : actionTaken ? 'text-amber-600' : 'text-green-600'}`}>
                                {isFail ? <X size={10} /> : actionTaken ? <Zap size={10} /> : <Check size={10} />}
                                <span>{isFail ? 'FAIL' : actionTaken ? 'FIXED' : 'PASS'}</span>
                             </div>
                           </div>
                           {isVolteKey && isFail && (
                             <button onClick={(e) => { e.stopPropagation(); handleRemoveVolte(diagnosticResult.msisdn); }} className="mt-2 w-full py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center space-x-2 hover:bg-red-700 shadow-lg active:scale-95 transition-all">
                               <Trash2 size={12} /> <span>Deactivate VoLTE</span>
                             </button>
                           )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="p-8 border-t border-gray-100 shrink-0 flex justify-end bg-gray-50/30">
              <button onClick={() => { setCallResult(null); setActiveMiscType(null); }} className="px-10 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                Terminate Review session
              </button>
            </div>
          </div>
        </div>
      )}

      {manualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 p-10 relative overflow-hidden">
            <button onClick={() => { setManualModal(null); setPrimaryInput(''); setSecondaryInput(''); }} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            <div className="flex flex-col items-center text-center">
              <div className="bg-black text-[#FFCC00] p-5 rounded-2xl mb-6 shadow-lg shrink-0"><Terminal size={28} /></div>
              <h3 className="text-2xl font-black text-black uppercase italic tracking-tighter mb-2 leading-none">{manualModal.label}</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-8">Node Command Authorization</p>
              <div className="w-full space-y-4 mb-8">
                <input 
                  autoFocus 
                  type="text" 
                  value={primaryInput} 
                  onChange={(e) => setPrimaryInput(e.target.value)} 
                  placeholder={
                    (manualModal.type === 'SEND_FAILURE' || manualModal.type === 'SEND_SUCCESS' || manualModal.type === 'SEND_DSA') 
                    ? "Transaction ID (e.g. KYC168_KYC168)" 
                    : "Enter MSISDN (e.g. 234...)"
                  } 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-base font-bold tracking-tight outline-none focus:border-[#FFCC00] transition-all text-center placeholder:text-gray-300" 
                />
                {(manualModal.type === 'SEND_FAILURE' || manualModal.type === 'SEND_DSA' || manualModal.type === 'SET_SERVICE_CLASS' || manualModal.type === 'ADD_OFFER') && (
                  <input 
                    type="text" 
                    value={secondaryInput} 
                    onChange={(e) => setSecondaryInput(e.target.value)} 
                    placeholder={
                      manualModal.type === 'SEND_FAILURE' ? "Failure Reason (e.g. ACTIVE_BARRING)" : 
                      manualModal.type === 'SEND_DSA' ? "Target MSISDN (e.g. 234...)" :
                      manualModal.type === 'SET_SERVICE_CLASS' ? "Service Class ID (Integer)" :
                      "Offer ID (Integer)"
                    } 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-base font-bold tracking-tight outline-none focus:border-[#FFCC00] transition-all text-center placeholder:text-gray-300" 
                  />
                )}
              </div>
              <button onClick={() => handleManualFix(manualModal.type, manualModal.label, primaryInput, secondaryInput)} disabled={isProcessing || primaryInput.length < 3} className="w-full bg-black text-[#FFCC00] py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center disabled:opacity-20 hover:scale-[1.02] active:scale-95 transition-all">
                {isProcessing ? <Loader2 className="animate-spin mr-3" /> : <Zap className="mr-3" />}
                {isProcessing ? 'Executing Core Protocol...' : 'Confirm Command Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {jobModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 p-10 relative">
            <button onClick={() => { setJobModal(null); setJobFiles([]); }} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            <div className="flex flex-col items-center text-center">
              <div className="bg-black text-[#FFCC00] p-5 rounded-2xl mb-6 shadow-lg shrink-0"><Layers size={28} /></div>
              <h3 className="text-2xl font-black text-black uppercase italic tracking-tighter mb-2 leading-none">{jobModal.label}</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-8">Global Batch Operations</p>
              <div className="w-full space-y-3 mb-8">
                {[...Array(jobModal.filesNeeded)].map((_, i) => (
                  <label key={i} className="flex items-center justify-between p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#FFCC00] hover:bg-white transition-all group">
                    <div className="flex items-center space-x-3 text-left overflow-hidden min-w-0">
                      <div className="bg-white p-2.5 rounded-lg shadow-sm shrink-0"><Upload size={16} className="text-gray-400 group-hover:text-[#FFCC00]" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black uppercase text-gray-500 mb-0.5 tracking-wider">CSV Data Set {i + 1}</p>
                        <p className="text-xs font-bold text-gray-400 truncate w-full">{jobFiles[i] ? jobFiles[i].name : 'Select local source...'}</p>
                      </div>
                    </div>
                    <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const newFiles = [...jobFiles];
                        newFiles[i] = file;
                        setJobFiles(newFiles);
                      }
                    }} />
                  </label>
                ))}
              </div>
              <button onClick={() => handleRunJob(jobModal.type, jobModal.label)} disabled={isProcessing || jobFiles.filter(Boolean).length < jobModal.filesNeeded} className="w-full bg-black text-[#FFCC00] py-4 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-md">
                {isProcessing ? <Loader2 className="animate-spin mr-3" /> : <Play size={18} className="mr-3" />}
                {isProcessing ? 'Initializing Batch...' : 'Begin Automation Process'}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`bg-black flex flex-col h-screen sticky top-0 z-50 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden opacity-0'}`}>
        <div className="p-10 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
             <div className="bg-[#FFCC00] p-1.5 rounded-lg shrink-0"><Tower className="w-5 h-5 text-black" /></div>
             <span className="text-xl font-black text-[#FFCC00] tracking-tighter uppercase italic">MTN IN</span>
          </div>
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Command Hub</p>
        </div>
        <nav className="flex-1 px-6 space-y-2 mt-4">
          <SidebarTab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<History size={16}/>} label="Operations Feed" />
          <SidebarTab active={activeTab === 'manual'} onClick={() => { setActiveTab('manual'); setCallResult(null); setActiveMiscType(null); }} icon={<Terminal size={16}/>} label="User Support" />
          <SidebarTab active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon={<Layers size={16}/>} label="Mass Tasks" />
          <SidebarTab active={activeTab === 'misc'} onClick={() => { setActiveTab('misc'); setCallResult(null); setActiveMiscType(null); }} icon={<ShieldCheck size={16}/>} label="Miscellaneous" />
          <SidebarTab active={activeTab === 'replay'} onClick={() => { setActiveTab('replay'); setCallResult(null); setActiveMiscType(null); }} icon={<RefreshCw size={16}/>} label="Replay Request" />
        </nav>
        <div className="p-8 border-t border-white/5 mt-auto text-center">
           <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Node Op: {OPERATIONAL_STAFF}</span>
        </div>
      </aside>

      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="fixed bottom-8 left-8 z-[60] bg-black text-[#FFCC00] p-4 rounded-xl shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/10"><PanelLeftOpen size={24} /></button>
      )}

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto transition-all duration-500 no-scrollbar">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center space-x-4 mb-1">
               {isSidebarOpen && (
                 <button onClick={() => setIsSidebarOpen(false)} className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#FFCC00] transition-colors shrink-0"><PanelLeftClose size={20} /></button>
               )}
               <div className="flex flex-col min-w-0">
                  <span className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">Operational Status</span>
                  <div className="flex items-center space-x-2">
                    <span className="bg-black text-[#FFCC00] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">v5.4 PROD</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  </div>
               </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter uppercase leading-none italic truncate">
              {activeTab === 'overview' && "Operational Center"}
              {activeTab === 'manual' && "Subscriber Diagnostics"}
              {activeTab === 'jobs' && "Automation Hub"}
              {activeTab === 'misc' && "Auxiliary Queries"}
              {activeTab === 'replay' && "Protocol Replayer"}
            </h1>
          </div>
          <div className="bg-white px-8 py-5 rounded-3xl shadow-xl border border-gray-100 flex items-center space-x-10 shrink-0">
            <div className="flex flex-col items-center">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Throughput</p>
                <p className="text-3xl font-black text-black leading-none">{history.length}</p>
            </div>
            <div className="w-px h-10 bg-gray-100"></div>
            <div className="text-right">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Core Health</p>
                <p className="text-xl font-black text-green-500 uppercase italic leading-none">Optimal</p>
            </div>
          </div>
        </header>

        <div className={`grid grid-cols-1 ${activeTab === 'manual' || activeTab === 'misc' || activeTab === 'replay' ? 'xl:grid-cols-1' : 'xl:grid-cols-12'} gap-8 max-w-[1600px] mx-auto`}>
          <div className={activeTab === 'manual' || activeTab === 'misc' || activeTab === 'replay' ? '' : 'xl:col-span-8'}>
            <div className="space-y-10">
              {activeTab === 'overview' && (
                <section className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-50">
                    <h2 className="text-xl font-black text-black uppercase tracking-tight italic">Audit Activity Log</h2>
                    <button onClick={runAnalysis} className="px-5 py-2.5 bg-black text-[#FFCC00] font-black rounded-xl text-[9px] uppercase flex items-center hover:scale-105 active:scale-95 transition-all shadow-lg group border border-white/5">
                      <Activity size={12} className="mr-2 group-hover:animate-pulse" /> AI Insight
                    </button>
                  </div>
                  <div className="space-y-2 no-scrollbar max-h-[600px] overflow-y-auto pr-2">
                    {history.map(issue => (
                      <div key={issue.id} className="flex items-center p-4 bg-gray-50 rounded-xl border-2 border-transparent hover:border-[#FFCC00] hover:bg-white transition-all group shadow-sm">
                         <div className={`p-4 rounded-lg mr-6 transition-all group-hover:rotate-3 shrink-0 ${issue.isJob ? 'bg-black text-[#FFCC00]' : 'bg-white text-black border border-gray-100 shadow-sm'}`}>
                           {issue.isJob ? <Layers size={18} /> : <Terminal size={18} />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-black text-[#FFCC00] uppercase tracking-widest mb-0.5 truncate">{issue.label}</p>
                            <p className="text-xl font-black text-black leading-none truncate tracking-tighter italic">{issue.identifier}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase tracking-widest truncate">{issue.timestamp} • {issue.engineer}</p>
                         </div>
                         <div className="text-right shrink-0 ml-4">
                            {issue.resultUrl && (
                               <div className="flex items-center justify-end text-[#FFCC00] bg-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 shadow-sm cursor-pointer hover:bg-gray-800 transition-colors border border-white/5">
                                  <FileArchive size={12} className="mr-1.5" /> Output
                               </div>
                            )}
                            <span className="flex items-center justify-end text-green-600 font-black text-[8px] uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                               <CheckCircle size={10} className="mr-1" /> Verified
                            </span>
                         </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'manual' && (
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DiagnosticGridItem label="Resolve can't call" icon={<Phone/>} onClick={() => setManualModal({ type: 'RESOLVE_CALL', label: "Resolve can't call" })} />
                    <DiagnosticGridItem label="Resolve can't browse" icon={<Globe/>} onClick={() => setManualModal({ type: 'RESOLVE_BROWSE', label: "Resolve can't browse" })} />
                    <DiagnosticGridItem label="Resolve can't send sms" icon={<MessageSquare/>} onClick={() => setManualModal({ type: 'RESOLVE_SMS', label: "Resolve can't send sms" })} />
                    <DiagnosticGridItem label="Send Failure Response" icon={<X size={20}/>} onClick={() => setManualModal({ type: 'SEND_FAILURE', label: "Send Failure Response" })} />
                    <DiagnosticGridItem label="Send Success Response" icon={<CheckCircle size={20}/>} onClick={() => setManualModal({ type: 'SEND_SUCCESS', label: "Send Success Response" })} />
                    <DiagnosticGridItem label="Send DSA Response" icon={<FileText size={20}/>} onClick={() => setManualModal({ type: 'SEND_DSA', label: "Send DSA Response" })} />
                    <DiagnosticGridItem label="Activate SPKA" icon={<Zap size={20}/>} onClick={() => setManualModal({ type: 'ACTIVATE_SPKA', label: "Activate SPKA" })} />
                    <DiagnosticGridItem label="Create AF AIR" icon={<Monitor size={20}/>} onClick={() => setManualModal({ type: 'CREATE_AF_AIR', label: "Create AF AIR" })} />
                    <DiagnosticGridItem label="Set Service Class" icon={<Layers size={20}/>} onClick={() => setManualModal({ type: 'SET_SERVICE_CLASS', label: "Set Service Class" })} />
                    <DiagnosticGridItem label="Add Offer" icon={<Tag size={20}/>} onClick={() => setManualModal({ type: 'ADD_OFFER', label: "Add Offer" })} />
                  </div>
                </section>
              )}

              {activeTab === 'replay' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col min-h-[700px]">
                      <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
                        <div className="flex items-center space-x-4">
                          <div className="bg-black p-3 rounded-xl shadow-lg shrink-0">
                            <RefreshCw size={24} className="text-[#FFCC00]" />
                          </div>
                          <div>
                            <h2 className="text-xl font-black text-black uppercase tracking-tight italic leading-none">Advanced Node Relay</h2>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1.5">Direct XML Injection Layer</p>
                          </div>
                        </div>
                        <button 
                          onClick={handleReplayExecution} 
                          disabled={isProcessing || !xmlInput.trim()}
                          className="px-8 py-3.5 bg-black text-[#FFCC00] rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-20 flex items-center group"
                        >
                          {isProcessing ? <Loader2 className="animate-spin mr-2" size={14} /> : <Send className="mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={14} />}
                          Execute Replay Sequence
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                        <div className="flex flex-col space-y-3 h-full">
                          <div className="flex items-center justify-between px-2">
                             <div className="flex items-center space-x-2">
                               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Protocol Payload (XML)</span>
                               <button 
                                 onClick={() => setXmlInput(formatXmlString(xmlInput))}
                                 title="Pretty print input"
                                 className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors"
                               >
                                 <AlignLeft size={12} />
                               </button>
                             </div>
                             <span className="text-[9px] font-bold text-[#FFCC00] bg-black px-2 py-0.5 rounded uppercase tracking-tighter">application/xml</span>
                          </div>
                          <textarea 
                            value={xmlInput}
                            onChange={(e) => setXmlInput(e.target.value)}
                            placeholder="<soapenv:Envelope>...</soapenv:Envelope>"
                            className="flex-1 w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-6 font-mono text-[11px] outline-none focus:border-[#FFCC00] focus:ring-4 focus:ring-[#FFCC00]/5 transition-all resize-none shadow-inner text-gray-700 leading-relaxed scrollbar-thin scrollbar-thumb-gray-200"
                          />
                        </div>

                        <div className="flex flex-col space-y-3 h-full">
                          <div className="flex items-center justify-between px-2">
                             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Core Response Output</span>
                             <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${xmlOutput.startsWith('CRITICAL') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                               Status Output
                             </span>
                          </div>
                          <div className="flex-1 w-full bg-slate-900 border border-white/5 rounded-2xl p-6 font-mono text-[11px] overflow-auto shadow-2xl relative group">
                            <div className="absolute top-4 right-4 text-white/5 font-black uppercase text-[40px] select-none pointer-events-none group-hover:text-white/10 transition-colors">TERMINAL</div>
                            <pre className="text-blue-300 leading-relaxed whitespace-pre-wrap break-all relative z-10 scrollbar-thin scrollbar-thumb-white/10">
                              {xmlOutput || "Protocol Listener Standby...\nWaiting for relay execution signal."}
                            </pre>
                          </div>
                        </div>
                      </div>
                   </div>
                </section>
              )}

              {activeTab === 'misc' && (
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DiagnosticGridItem label="Get HLR Profile" icon={<Search/>} onClick={() => setManualModal({ type: 'GET_HLR', label: "Get HLR Profile" })} />
                    <DiagnosticGridItem label="Get Account Details" icon={<User/>} onClick={() => setManualModal({ type: 'GET_ACCOUNT_DETAILS', label: "Get Account Details" })} />
                    <DiagnosticGridItem label="Get Offers" icon={<Tag/>} onClick={() => setManualModal({ type: 'GET_OFFERS', label: "Get Offers" })} />
                  </div>
                </section>
              )}

              {activeTab === 'jobs' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100">
                      <h2 className="text-xl font-black text-black uppercase tracking-tight mb-10 italic">Process Automation Layer</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <AutomationMatrixBlock label="Resolve call Issues" files={1} onClick={() => setJobModal({ type: 'JOB_CALL_ISSUES', label: 'Resolve call Issues', filesNeeded: 1 })} />
                         <AutomationMatrixBlock label="Resolve credit limit issue" files={1} onClick={() => setJobModal({ type: 'JOB_CREDIT_LIMIT', label: 'Resolve credit limit issue', filesNeeded: 1 })} />
                         <AutomationMatrixBlock label="Initiate sim reg" files={2} onClick={() => setJobModal({ type: 'JOB_INIT_SIM_REG', label: 'Initiate sim reg', filesNeeded: 2 })} />
                         <AutomationMatrixBlock label="Get Sim Reg imsi" files={2} onClick={() => setJobModal({ type: 'JOB_GET_SIM_REG_IMSI', label: 'Get Sim Reg imsi', filesNeeded: 2 })} />
                         <AutomationMatrixBlock label="Automation Air Delete" files={1} onClick={() => setJobModal({ type: 'JOB_DELETE_AIR', label: 'Delete Air (Sim Reg)', filesNeeded: 1 })} />
                         <AutomationMatrixBlock label="Deact PostPaid Hub" files={1} onClick={() => setJobModal({ type: 'JOB_DEACT_POSTPAID', label: 'Deact PostPaid', filesNeeded: 1 })} />
                         <AutomationMatrixBlock label="Sim Reg Replayer" files={1} onClick={() => setJobModal({ type: 'JOB_REPLAY_SIM_REG', label: 'Replay SIm Reg', filesNeeded: 1 })} />
                         <AutomationMatrixBlock label="Bulk Sim Reg End" files={1} onClick={() => setJobModal({ type: 'JOB_COMPLETE_SIM_REG', label: 'Complete sim reg', filesNeeded: 1 })} />
                         <AutomationMatrixBlock label="Swap Initialization" files={1} onClick={() => setJobModal({ type: 'JOB_INIT_SIM_SWAP', label: 'Initiate sim swap', filesNeeded: 1 })} />
                         <AutomationMatrixBlock label="Swap IMSI Grabber" files={2} onClick={() => setJobModal({ type: 'JOB_GET_SWAP_IMSI', label: 'Get Sim Swap Imsi', filesNeeded: 2 })} />
                         <AutomationMatrixBlock label="Swap Finalization" files={1} onClick={() => setJobModal({ type: 'JOB_COMPLETE_SIM_SWAP', label: 'Complete sim swap', filesNeeded: 1 })} />
                      </div>
                   </div>
                </section>
              )}
            </div>
          </div>

          {(activeTab !== 'manual' && activeTab !== 'misc' && activeTab !== 'replay') && (
            <div className="xl:col-span-4 space-y-10">
              <section className="bg-black text-white p-8 lg:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-[6px] border-[#FFCC00]">
                <div className="absolute top-0 left-0 w-full h-full bg-ops-grid opacity-5"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-[#FFCC00] p-2.5 rounded-xl shadow-lg shrink-0"><Activity className="text-black" size={20}/></div>
                    <div className="flex flex-col min-w-0">
                      <h2 className="text-xl font-black uppercase tracking-tighter italic leading-none text-[#FFCC00]">Architect Engine</h2>
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-1">Operational Analytics Active</span>
                    </div>
                  </div>
                  {isAnalyzing ? (
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-800 rounded-lg w-3/4 animate-pulse"></div>
                      <div className="h-16 bg-gray-900 rounded-xl w-full animate-pulse"></div>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-md shadow-inner relative">
                        <p className="text-[#FFCC00] text-sm font-black tracking-tight leading-tight italic">"{aiAnalysis.summary}"</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 pl-2">Optimization Vectors</p>
                        {aiAnalysis.suggestions.map((s, i) => (
                          <div key={i} className="group flex items-start space-x-3 text-sm bg-white/10 p-4 rounded-xl border border-white/5 hover:border-[#FFCC00]/30 transition-all cursor-default">
                            <span className="text-[#FFCC00] font-black text-base leading-none italic">0{i+1}</span>
                            <span className="font-bold text-gray-400 leading-tight text-[9px] uppercase tracking-tight group-hover:text-white transition-colors">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl">
                      <Zap className="mx-auto mb-3 text-gray-800 opacity-20 shrink-0" size={32}/>
                      <p className="text-gray-700 text-[9px] font-black uppercase tracking-[0.4em]">Engine Standby</p>
                    </div>
                  )}
                </div>
              </section>
              <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                <h2 className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.4em] text-center italic">Load Capacity Distribution</h2>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats}>
                      <CartesianGrid strokeDasharray="1 1" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: '#bbb'}} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#fcfcfc' }} contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                      <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={45}>
                        {stats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Enhanced Human-Readable View for Subscriber Profiles
 */
function SubscriberProfileHumanView({ data, type }: { data: any, type: ManualOperationType }) {
  if (type === 'GET_HLR') {
    const hlr = data?.moAttributes?.getResponseSubscription;
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProfileCard label="Identity & Auth" icon={<User size={20}/>} color="bg-blue-50 text-blue-600">
            <DataRow label="MSISDN" value={hlr?.msisdn} />
            <DataRow label="IMSI" value={hlr?.imsi} />
            <DataRow label="State" value={hlr?.msisdnstate} highlight={hlr?.msisdnstate === 'CONNECTED'} />
            <DataRow label="Auth Status" value={hlr?.authd} />
            <DataRow label="CSP Index" value={hlr?.csp} />
          </ProfileCard>

          <ProfileCard label="Network Location" icon={<MapPin size={20}/>} color="bg-amber-50 text-amber-600">
            <DataRow label="VLR Address" value={hlr?.locationData?.vlrAddress} />
            <DataRow label="MSC Number" value={hlr?.locationData?.mscNumber} />
            <DataRow label="SGSN Number" value={hlr?.locationData?.sgsnNumber} />
            <DataRow label="VLR Data" value={hlr?.vlrData} />
          </ProfileCard>

          <ProfileCard label="GPRS Data Connectivity" icon={<Globe size={20}/>} color="bg-emerald-50 text-emerald-600">
            <DataRow label="PDP ID" value={hlr?.gprs?.pdpid} />
            <DataRow label="APN ID" value={hlr?.gprs?.apnid} />
            <DataRow label="QoS ID" value={hlr?.gprs?.eqosid} />
            <DataRow label="PDP Type" value={hlr?.gprs?.pdpty} />
            <DataRow label="VPAA" value={hlr?.gprs?.vpaa} />
          </ProfileCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <ProfileCard label="CAMEL Intelligent Network" icon={<Server size={20}/>} color="bg-rose-50 text-rose-600">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                 {Object.entries(hlr?.camel || {}).map(([k, v]) => (
                   <DataRow key={k} label={k.toUpperCase()} value={v} small />
                 ))}
              </div>
           </ProfileCard>

           <ProfileCard label="Network Indicators" icon={<Info size={20}/>} color="bg-slate-100 text-slate-700">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-3">
                 {[
                   'mdeuee', 'bs26', 'bs3g', 'cat', 'clip', 'clir', 'dbsg', 'hold', 'mpty', 'oick', 
                   'ofa', 'obo', 'obi', 'tick', 'obssm', 'obp', 'pwd', 'socb', 'socfb', 'socfrc', 
                   'socfry', 'socfu', 'soclip', 'soclir', 'stype', 'ts11', 'ts21', 'ts22', 'ts62', 
                   'tsmo', 'rsa', 'schar', 'ocsist', 'osmcsist', 'tcsist'
                 ].map(key => (
                   <DataRow key={key} label={key.toUpperCase()} value={hlr?.[key]} small />
                 ))}
                 <DataRow label="Spam Active" value={hlr?.smsSpam?.active} small />
              </div>
           </ProfileCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <ProfileCard label="Call Barring States" icon={<ShieldAlert size={20}/>} color="bg-red-50 text-red-600">
              <div className="space-y-6">
                 {['baic', 'baoc', 'boic', 'bicro', 'boiexh'].map(type => (
                   <div key={type} className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">{type.toUpperCase()}</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-black rounded uppercase">Prov: {hlr?.[type]?.provisionState}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(hlr?.[type] || {}).filter(([k]) => k !== 'provisionState').map(([k, v]: [any, any]) => (
                          <div key={k} className={`px-2 py-1 rounded text-[8px] font-bold border transition-colors ${v?.activationState === 1 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            {k.toUpperCase()}: {v?.activationState ?? 'N/A'}
                          </div>
                        ))}
                      </div>
                   </div>
                 ))}
              </div>
           </ProfileCard>

           <ProfileCard label="Forwarding & Waiting" icon={<Phone size={20}/>} color="bg-cyan-50 text-cyan-600">
              <div className="space-y-6">
                 {['cfu', 'cfb', 'cfnrc', 'cfnry', 'caw', 'dcf'].map(type => (
                   <div key={type} className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">{type.toUpperCase()}</span>
                        <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-[8px] font-black rounded uppercase">Prov: {hlr?.[type]?.provisionState ?? (hlr?.[type] ? 1 : 0)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hlr?.[type] && Object.entries(hlr?.[type] || {}).filter(([k]) => k !== 'provisionState').map(([k, v]: [any, any]) => (
                          <div key={k} className={`px-2 py-1 rounded text-[8px] font-bold border transition-colors ${v?.activationState === 1 ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            {k.toUpperCase()}: {v?.activationState ?? 'N/A'}
                          </div>
                        ))}
                        {!hlr?.[type] && <span className="text-[8px] text-gray-300 italic">Not Populated</span>}
                      </div>
                   </div>
                 ))}
              </div>
           </ProfileCard>
        </div>
      </div>
    );
  }

  if (type === 'GET_ACCOUNT_DETAILS' || type === 'GET_OFFERS') {
    const root = type === 'GET_ACCOUNT_DETAILS' ? data?.moAttributes?.getAccountDetailResponse : data?.moAttributes?.getOfferResponse;
    const balance = root?.balanceAndDate;
    
    // Check multiple possible paths for offers, but only if type is GET_OFFERS
    const rawOffers = type === 'GET_OFFERS' 
      ? (root?.offerInformation || root?.offerInformationList || root?.accountDetails?.offerInformation || []) 
      : [];
    const offers = normalizeArray(rawOffers);
    
    const rawDA = root?.dedicatedAccountInformation || root?.dedicatedAccountInformationList || [];
    const dedicatedAccounts = normalizeArray(rawDA);

    return (
      <div className="space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ProfileCard label="Financial Status" icon={<Wallet size={20}/>} color="bg-purple-50 text-purple-600">
            <DataRow label="Main Wallet" value={root?.subscriberNumber} />
            {balance && <DataRow label="Primary Balance" value={`${balance.accountValue1} ${balance.currency1}`} large highlight />}
            <DataRow label="Lifecycle End" value={formatDate(balance?.expiryDate)} />
          </ProfileCard>
          
          <ProfileCard label="Lifecycle Phase" icon={<CalendarDays size={20}/>} color="bg-blue-50 text-blue-600">
            <DataRow label="Service Class" value={root?.accountDetails?.serviceClassCurrent || balance?.serviceClassCurrent} highlight />
            <DataRow label="Status" value={root?.accountDetails?.accountStatus || 'ACTIVE'} />
            <DataRow label="Trans-ID" value={root?.originTransactionID} small />
          </ProfileCard>

          <ProfileCard label="Core Properties" icon={<ShieldCheck size={20}/>} color="bg-green-50 text-green-600">
            <DataRow label="Preferred Language" value={root?.accountDetails?.languageIDCurrent} />
            <DataRow label="USSD Notifications" value={root?.accountDetails?.ussdEndOfCallNotificationID === 0 ? 'Disabled' : 'Enabled'} />
            <div className="pt-2">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Node Privileges</span>
              <div className="flex flex-wrap gap-1">
                {root?.availableServerCapabilities?.map((cap: string) => (
                  <span key={cap} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[8px] font-black text-gray-500 uppercase">{cap}</span>
                ))}
              </div>
            </div>
          </ProfileCard>
        </div>

        {dedicatedAccounts.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center space-x-4 px-2">
              <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700 shadow-sm"><CreditCard size={20} /></div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter italic leading-none">Sub-Wallets (Dedicated Balances)</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dedicatedAccounts.map((da: any, idx: number) => (
                <ProfileCard key={idx} label={`Wallet: ${da.dedicatedAccountID}`} icon={<Coins size={20}/>} color="bg-amber-50 text-amber-600">
                   <DataRow label="Credit Amount" value={da.dedicatedAccountValue1} large highlight />
                   <DataRow label="Validity Phase" value={formatDate(da.expiryDate)} />
                </ProfileCard>
              ))}
            </div>
          </div>
        )}

        {type === 'GET_OFFERS' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-6 px-2">
              <div className="flex items-center space-x-4">
                <div className="bg-[#FFCC00] p-2.5 rounded-xl text-black shadow-lg"><Tag size={20} /></div>
                <h3 className="text-2xl font-black text-black uppercase tracking-tighter italic leading-none">Bundle Subscription Inventory</h3>
              </div>
              <span className="px-4 py-1.5 bg-black text-[#FFCC00] text-[10px] font-black rounded-full uppercase tracking-widest">{offers.length} ACTIVE BUNDLES</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {offers.map((offer: any, idx: number) => (
                <ProfileCard key={idx} label={`ID: ${offer.offerID}`} icon={<PackageCheck size={20}/>} color={offer.offerType === 0 ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}>
                  <DataRow label="Bundle Status" value={offer.offerType === 0 ? 'Standard' : 'Specialized'} />
                  <DataRow label="Activation" value={formatDate(offer.startDate)} />
                  <DataRow label="Expiration" value={formatDate(offer.expiryDate)} highlight={formatDate(offer.expiryDate) === 'Permanent'} />
                </ProfileCard>
              ))}
              {offers.length === 0 && (
                <div className="col-span-full py-16 bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-50">
                  <Tag className="text-gray-200 mb-4" size={48} />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Zero active bundles found on profile</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

/**
 * Robust date parser for telecom (SDP/IN) timestamp formats
 */
function formatDate(dateStr: string | null | any) {
  if (!dateStr) return 'N/A';
  const str = String(dateStr).trim();
  
  if (str.startsWith('9999')) return 'Permanent';
  if (str.startsWith('0000')) return 'Historical';

  // Handle SDP format: YYYYMMDDTHH:MM:SS
  if (/^\d{8}/.test(str)) {
    try {
      const year = str.substring(0, 4);
      const month = str.substring(4, 6);
      const day = str.substring(6, 8);
      
      const timePart = str.includes('T') ? str.split('T')[1] : str.substring(8);
      const hour = timePart.length >= 2 ? timePart.substring(0, 2) : '00';
      const min = timePart.length >= 4 ? timePart.substring(2, 4) : '00';
      
      const date = new Date(`${year}-${month}-${day}T${hour}:${min}:00`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) {
      console.warn("Tele-date parse failed:", str);
    }
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return str;
}

function ProfileCard({ label, icon, color, children }: { label: string, icon: React.ReactNode, color: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4 mb-8">
        <div className={`p-3 rounded-2xl shadow-sm ${color} shrink-0`}>{icon}</div>
        <h4 className="text-[12px] font-black text-black uppercase tracking-[0.2em] italic leading-none truncate">{label}</h4>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function DataRow({ label, value, highlight = false, small = false, large = false }: { label: string, value: any, highlight?: boolean, small?: boolean, large?: boolean }) {
  return (
    <div className="flex flex-col border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</span>
      <span className={`font-black tracking-tight leading-none ${highlight ? 'text-[#FFCC00]' : 'text-slate-800'} ${small ? 'text-[10px] break-all text-slate-500 font-bold' : large ? 'text-2xl italic uppercase' : 'text-[13px]'}`}>
        {value === null || value === undefined || value === 'UNKNOWN' ? <span className="text-gray-300 italic opacity-50">N/A</span> : String(value)}
      </span>
    </div>
  );
}

function SidebarTab({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center px-5 py-4 text-[10px] font-black rounded-xl transition-all group ${active ? 'bg-[#FFCC00] text-black shadow-lg shadow-[#FFCC00]/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
      <span className={`${active ? 'text-black' : 'text-gray-500 group-hover:text-[#FFCC00]'} mr-3.5 transition-transform group-hover:scale-110 shrink-0`}>{icon}</span>
      <span className="tracking-widest uppercase leading-none">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>}
    </button>
  );
}

function DiagnosticGridItem({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-[#FFCC00] hover:shadow-xl transition-all group items-center text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-full -mr-8 -mt-8 group-hover:bg-[#FFCC00]/5 transition-colors"></div>
      <div className="p-4 rounded-xl mb-4 bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-[#FFCC00] transition-all shadow-inner relative z-10 shrink-0">{icon}</div>
      <span className="text-[11px] font-black text-black uppercase tracking-tight leading-tight italic relative z-10">{label}</span>
      <div className="mt-3 flex items-center text-gray-300 group-hover:text-black transition-colors relative z-10"><ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></div>
    </button>
  );
}

function AutomationMatrixBlock({ label, files, onClick }: { label: string, files: number, onClick: () => void }) {
  return (
    <div className="group bg-gray-50 p-6 rounded-2xl border-2 border-transparent hover:border-black hover:bg-white transition-all shadow-sm flex flex-col items-center text-center min-w-0">
      <div className="p-3.5 bg-white rounded-xl shadow-inner mb-5 text-gray-400 group-hover:text-black transition-all border border-gray-100 shrink-0"><Layers size={18} /></div>
      <h3 className="text-[13px] font-black text-black mb-1 uppercase tracking-tight italic leading-none truncate w-full">{label}</h3>
      <p className="text-[9px] text-gray-400 font-bold uppercase mb-6 tracking-widest">{files} CSV Source File{files > 1 ? 's' : ''}</p>
      <button onClick={onClick} className="w-full py-3.5 bg-black text-[#FFCC00] rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-md">Select Source</button>
    </div>
  );
}
