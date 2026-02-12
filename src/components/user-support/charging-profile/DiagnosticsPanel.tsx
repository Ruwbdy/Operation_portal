import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { Diagnostics } from '../../../services/data_interface';

interface DiagnosticsPanelProps {
  diagnostics: Diagnostics[];
}

export default function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  if (!diagnostics || diagnostics.length === 0) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'voice':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'browsing':
        return 'bg-green-50 border-green-200 text-green-700';  
      case 'offer':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) { 
      case 'voice':
        return <AlertTriangle size={16} />;
      case 'browsing':
        return <CheckCircle size={16} />;  
      case 'offer':
        return <Info size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'voice':
        return 'Voice';
      case 'browsing':
        return 'Browsing';  
      case 'offer':
        return 'Offer';
      default:
        return 'Info';
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
            Diagnostics & Alerts
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagnostics.map((diagnostic, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 ${getCategoryColor(diagnostic.category)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  {getCategoryIcon(diagnostic.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-70">
                      {getCategoryLabel(diagnostic.category)}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-50">
                      •
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-70">
                      {diagnostic.key}
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    {diagnostic.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}