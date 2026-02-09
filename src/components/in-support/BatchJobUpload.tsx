import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { validateCSVFile } from '../../utils/validators';

interface BatchJobUploadProps {
  jobType: string;
  jobLabel: string;
  filesNeeded: number;
  onExecute: (files: File[]) => Promise<void>;
  isProcessing: boolean;
}

export default function BatchJobUpload({
  jobType,
  jobLabel,
  filesNeeded,
  onExecute,
  isProcessing
}: BatchJobUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setError(null);

    // Validate each file
    for (const file of selectedFiles) {
      const validation = validateCSVFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }
    }

    if (selectedFiles.length !== filesNeeded) {
      setError(`Please upload exactly ${filesNeeded} file${filesNeeded > 1 ? 's' : ''}`);
      return;
    }

    setFiles(selectedFiles);
  };

  const handleExecute = async () => {
    if (files.length !== filesNeeded) {
      setError(`Please upload ${filesNeeded} file${filesNeeded > 1 ? 's' : ''}`);
      return;
    }

    try {
      await onExecute(files);
      setFiles([]);
      setError(null);
    } catch (err) {
      setError('Failed to execute job');
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
      <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-100">
        <div className="bg-black p-3 rounded-xl">
          <Upload size={20} className="text-[#FFCC00]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-black uppercase tracking-wide">
            {jobLabel}
          </h3>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
            Upload {filesNeeded} CSV file{filesNeeded > 1 ? 's' : ''} to execute batch job
          </p>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <label className="block">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-[#FFCC00] transition-colors cursor-pointer">
            <Upload size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-black text-gray-600 uppercase tracking-wide mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              CSV files only, max 10MB each
            </p>
            <input
              type="file"
              multiple={filesNeeded > 1}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
          </div>
        </label>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-3">
            Selected Files ({files.length})
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              <FileText size={20} className="text-[#FFCC00]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-black truncate">{file.name}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <CheckCircle size={20} className="text-green-500" />
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center space-x-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-xs font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={files.length !== filesNeeded || isProcessing}
        className="w-full px-8 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
      >
        <Download size={16} />
        <span>{isProcessing ? 'Processing...' : 'Execute Batch Job'}</span>
      </button>
    </div>
  );
}