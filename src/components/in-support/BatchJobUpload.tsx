import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { validateCSVFile } from '../../utils/validators';

interface BatchJobUploadProps {
  jobType: string;
  jobLabel: string;
  filesNeeded: number;
  expectedColumns: string[];
  fileLabels?: string[]; // Optional labels for each file slot
  onExecute: (files: File[]) => Promise<void>;
  isProcessing: boolean;
  hideTextInput?: boolean; // For reconciliation jobs that only take files
}

function textToCSVFile(text: string, filename: string): File {
  const blob = new Blob([text], { type: 'text/csv' });
  return new File([blob], filename, { type: 'text/csv' });
}

export default function BatchJobUpload({
  jobType,
  jobLabel,
  filesNeeded,
  expectedColumns,
  fileLabels,
  onExecute,
  isProcessing,
  hideTextInput = false
}: BatchJobUploadProps) {
  const [files, setFiles] = useState<(File | null)[]>(Array(filesNeeded).fill(null));
  const [textInputs, setTextInputs] = useState<string[]>(Array(filesNeeded).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [activeInputMode, setActiveInputMode] = useState<'text' | 'file'>('text');
  const [expandedSections, setExpandedSections] = useState<boolean[]>(Array(filesNeeded).fill(true));

  const toggleSection = (index: number) => {
    setExpandedSections(prev => prev.map((v, i) => i === index ? !v : v));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);

    const validation = validateCSVFile(selected);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setFiles(prev => prev.map((f, i) => i === index ? selected : f));
  };

  const handleTextChange = (value: string, index: number) => {
    setTextInputs(prev => prev.map((t, i) => i === index ? value : t));
    setError(null);
  };

  const handleExecute = async () => {
    setError(null);
    const finalFiles: File[] = [];

    for (let i = 0; i < filesNeeded; i++) {
      if (activeInputMode === 'text' && !hideTextInput) {
        const text = textInputs[i].trim();
        if (!text) {
          setError(`Please provide data for ${fileLabels?.[i] || `file ${i + 1}`}`);
          return;
        }
        finalFiles.push(textToCSVFile(text, `${jobType.toLowerCase()}_input_${i + 1}.csv`));
      } else {
        const f = files[i];
        if (!f) {
          setError(`Please upload ${fileLabels?.[i] || `file ${i + 1}`}`);
          return;
        }
        finalFiles.push(f);
      }
    }

    try {
      await onExecute(finalFiles);
      setFiles(Array(filesNeeded).fill(null));
      setTextInputs(Array(filesNeeded).fill(''));
      setError(null);
    } catch {
      setError('Failed to execute job');
    }
  };

  const exampleRow = expectedColumns.join(',');
  const allReady = activeInputMode === 'text' && !hideTextInput
    ? textInputs.every(t => t.trim().length > 0)
    : files.every(f => f !== null);

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-100">
        <div className="bg-black p-3 rounded-xl shrink-0">
          <Play size={20} className="text-[#FFCC00]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-black uppercase tracking-wide">
            {jobLabel}
          </h3>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
            {hideTextInput
              ? `Upload ${filesNeeded} CSV file${filesNeeded > 1 ? 's' : ''}`
              : `Paste data or upload ${filesNeeded} CSV file${filesNeeded > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Expected columns hint */}
      {expectedColumns.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Expected columns
          </p>
          <code className="text-[10px] font-bold text-black">
            {exampleRow}
          </code>
        </div>
      )}

      {/* Input Mode Toggle (only when text input is allowed) */}
      {!hideTextInput && (
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveInputMode('text')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeInputMode === 'text'
                ? 'bg-black text-[#FFCC00]'
                : 'bg-gray-50 text-gray-400 hover:text-black border border-gray-100'
            }`}
          >
            Input Data
          </button>
          <button
            onClick={() => setActiveInputMode('file')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeInputMode === 'file'
                ? 'bg-black text-[#FFCC00]'
                : 'bg-gray-50 text-gray-400 hover:text-black border border-gray-100'
            }`}
          >
            Upload CSV File
          </button>
        </div>
      )}

      {/* Per-file inputs */}
      <div className="space-y-4 mb-6">
        {Array.from({ length: filesNeeded }).map((_, i) => {
          const label = fileLabels?.[i] || (filesNeeded > 1 ? `File ${i + 1}` : 'Input');
          const isExpanded = expandedSections[i];

          return (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
              {/* Section header (only show toggle when >1 file) */}
              {filesNeeded > 1 && (
                <button
                  onClick={() => toggleSection(i)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                    {label}
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>
              )}

              {(filesNeeded === 1 || isExpanded) && (
                <div className="p-4">
                  {/* TEXT MODE */}
                  {(activeInputMode === 'text' && !hideTextInput) && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          {filesNeeded === 1 ? 'Paste or type CSV data' : `Data for ${label}`}
                        </span>
                        {textInputs[i].trim() && (
                          <span className="text-[8px] font-black text-green-600 uppercase tracking-wider">
                            ✓ {textInputs[i].trim().split('\n').length} row(s)
                          </span>
                        )}
                      </div>
                      <textarea
                        value={textInputs[i]}
                        onChange={e => handleTextChange(e.target.value, i)}
                        placeholder={`${exampleRow}\n234XXXXXXXXXX,...`}
                        rows={6}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-black font-mono text-xs focus:outline-none focus:border-[#FFCC00] transition-colors resize-y placeholder:text-gray-300"
                      />
                    </div>
                  )}

                  {/* FILE MODE */}
                  {(activeInputMode === 'file' || hideTextInput) && (
                    <label className="block cursor-pointer">
                      {files[i] ? (
                        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-100">
                          <FileText size={20} className="text-[#FFCC00] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-black truncate">{files[i]!.name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                              {(files[i]!.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <CheckCircle size={18} className="text-green-500 shrink-0" />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#FFCC00] transition-colors">
                          <Upload size={32} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
                            {filesNeeded > 1 ? label : 'Click to upload CSV'}
                          </p>
                          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-wider">
                            CSV only · max 10MB
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".csv"
                        onChange={e => handleFileChange(e, i)}
                        className="hidden"
                        disabled={isProcessing}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center space-x-3">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <p className="text-xs font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* Execute */}
      <button
        onClick={handleExecute}
        disabled={!allReady || isProcessing}
        className="w-full px-8 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-[.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
      >
        <Play size={16} />
        <span>{isProcessing ? 'Processing...' : 'Execute Batch Job'}</span>
      </button>
    </div>
  );
}