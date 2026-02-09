import React from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, Database } from 'lucide-react';
import { formatBytes } from '../../../services/parsers/cdrParser';
import type { CDRSummary as CDRSummaryType, CDRTabType } from '../../../types/cdr';

interface CDRSummaryProps {
  summary: CDRSummaryType;
  type: CDRTabType;
}

export default function CDRSummary({ summary, type }: CDRSummaryProps) {
  const formatCurrency = (amount: number) => `₦${amount.toFixed(2)}`;
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
        <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-100">
          <div className="bg-blue-500 p-3 rounded-xl">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black uppercase tracking-wide">
              Summary Statistics
            </h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
              Aggregated metrics for selected records
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {/* Total Transactions */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Database size={14} className="text-gray-400" />
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                Total Transactions
              </p>
            </div>
            <p className="text-2xl font-black text-black italic">
              {summary.totalTransactions}
            </p>
          </div>

          {/* Starting Balance */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={14} className="text-green-500" />
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                Starting Balance
              </p>
            </div>
            <p className="text-2xl font-black text-green-600 italic">
              {formatCurrency(summary.startingBalance)}
            </p>
          </div>

          {/* Ending Balance */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown size={14} className="text-blue-500" />
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                Ending Balance
              </p>
            </div>
            <p className="text-2xl font-black text-blue-600 italic">
              {formatCurrency(summary.endingBalance)}
            </p>
          </div>

          {/* Total Charged */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Activity size={14} className="text-red-500" />
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                Total Charged
              </p>
            </div>
            <p className="text-2xl font-black text-red-600 italic">
              {formatCurrency(summary.totalCharged)}
            </p>
          </div>

          {/* Voice-specific: Total Duration */}
          {type === 'voice' && summary.totalDuration !== undefined && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={14} className="text-purple-500" />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                  Total Duration
                </p>
              </div>
              <p className="text-2xl font-black text-purple-600 italic">
                {formatDuration(summary.totalDuration)}
              </p>
            </div>
          )}

          {/* Voice-specific: Avg Call Length */}
          {type === 'voice' && summary.avgCallLength !== undefined && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={14} className="text-cyan-500" />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                  Avg Call Length
                </p>
              </div>
              <p className="text-2xl font-black text-cyan-600 italic">
                {formatDuration(summary.avgCallLength)}
              </p>
            </div>
          )}

          {/* Data-specific: Total Data */}
          {type === 'data' && summary.totalData !== undefined && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Database size={14} className="text-purple-500" />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                  Total Data Used
                </p>
              </div>
              <p className="text-2xl font-black text-purple-600 italic">
                {formatBytes(summary.totalData)}
              </p>
            </div>
          )}

          {/* Credit-specific: Total Recharges */}
          {type === 'credit' && summary.totalRecharges !== undefined && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp size={14} className="text-green-500" />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                  Total Recharges
                </p>
              </div>
              <p className="text-2xl font-black text-green-600 italic">
                {summary.totalRecharges}
              </p>
            </div>
          )}

          {/* DA Adjustment-specific: Net Change */}
          {type === 'daAdjustment' && summary.netChange !== undefined && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Activity size={14} className={summary.netChange >= 0 ? 'text-green-500' : 'text-red-500'} />
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">
                  Net Change
                </p>
              </div>
              <p className={`text-2xl font-black italic ${summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netChange)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}