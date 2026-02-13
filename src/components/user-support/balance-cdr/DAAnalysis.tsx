import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Database, Filter, BarChart3, X, Maximize2 } from 'lucide-react';
import { formatCDRDateTime } from '../../../utils/dateFormatter';
import { formatDAAmount, getDADescription, getAllDAIds, isDataDA } from '../../../services/daMapping';
import type { CDRRecord } from '../../../services/data_interface';

interface DAAnalysisProps {
  records: CDRRecord[];
}

interface DAUsage {
  daId: string;
  description: string;
  totalUsage: number;
  totalCharged: number;
  transactionCount: number;
  isDataDA: boolean;
  transactions: {
    date: string;
    amountCharged: number;
    balanceBefore: number;
    balanceAfter: number;
  }[];
}

interface DailyUsage {
  date: string;
  totalUsage: number;
  transactionCount: number;
  transactions: {
    daId: string;
    description: string;
    amountCharged: number;
  }[];
}

export default function DAAnalysis({ records }: DAAnalysisProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDA, setSelectedDA] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // Calculate DA usage statistics
  const daUsageMap = useMemo(() => {
    const usageMap = new Map<string, DAUsage>();

    records.forEach(record => {
      if (record.da_details && record.da_details.length > 0) {
        record.da_details.forEach(da => {
          const daId = da.account_id;
          const amountCharged = da.amount_charged;
          
          if (!usageMap.has(daId)) {
            usageMap.set(daId, {
              daId,
              description: getDADescription(daId),
              totalUsage: 0,
              totalCharged: 0,
              transactionCount: 0,
              isDataDA: isDataDA(daId),
              transactions: []
            });
          }

          const usage = usageMap.get(daId)!;
          usage.totalUsage += amountCharged;
          usage.totalCharged += amountCharged;
          usage.transactionCount++;
          usage.transactions.push({
            date: formatCDRDateTime(record.event_dt),
            amountCharged: amountCharged,
            balanceBefore: da.amount_before,
            balanceAfter: da.amount_after
          });
        });
      }
    });

    return usageMap;
  }, [records]);

  // Calculate daily usage statistics
  const dailyUsageMap = useMemo(() => {
    const dailyMap = new Map<string, DailyUsage>();

    records.forEach(record => {
      const dateStr = formatCDRDateTime(record.event_dt).split(',')[0]; // Extract date part

      if (record.da_details && record.da_details.length > 0) {
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, {
            date: dateStr,
            totalUsage: 0,
            transactionCount: 0,
            transactions: []
          });
        }

        const daily = dailyMap.get(dateStr)!;
        
        record.da_details.forEach(da => {
          const daId = da.account_id;
          const amountCharged = da.amount_charged;
          
          daily.totalUsage += amountCharged;
          daily.transactionCount++;
          daily.transactions.push({
            daId,
            description: getDADescription(daId),
            amountCharged
          });
        });
      }
    });

    return dailyMap;
  }, [records]);

  // Get sorted DA IDs and dates
  const sortedDAIds = useMemo(() => {
    return Array.from(daUsageMap.keys()).sort((a, b) => {
      const usageA = daUsageMap.get(a)!.totalUsage;
      const usageB = daUsageMap.get(b)!.totalUsage;
      return usageB - usageA; // Sort by usage descending
    });
  }, [daUsageMap]);

  const sortedDates = useMemo(() => {
    return Array.from(dailyUsageMap.keys()).sort((a, b) => {
      // Sort dates chronologically
      const dateA = new Date(a.split(' ').reverse().join('-'));
      const dateB = new Date(b.split(' ').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  }, [dailyUsageMap]);

  // Filter data based on selection
  const filteredData = useMemo(() => {
    if (selectedDA !== 'all' && selectedDay !== 'all') {
      // Both DA and day selected
      const usage = daUsageMap.get(selectedDA);
      if (!usage) return null;
      
      const transactions = usage.transactions.filter(t => 
        t.date.split(',')[0] === selectedDay
      );
      
      return {
        type: 'specific' as const,
        daId: selectedDA,
        description: usage.description,
        date: selectedDay,
        transactions,
        totalUsage: transactions.reduce((sum, t) => sum + t.amountCharged, 0),
        transactionCount: transactions.length,
        isDataDA: usage.isDataDA
      };
    } else if (selectedDA !== 'all') {
      // Only DA selected
      const usage = daUsageMap.get(selectedDA);
      if (!usage) return null;
      
      return {
        type: 'da' as const,
        ...usage
      };
    } else if (selectedDay !== 'all') {
      // Only day selected
      const daily = dailyUsageMap.get(selectedDay);
      if (!daily) return null;
      
      return {
        type: 'day' as const,
        ...daily
      };
    } else {
      // All data
      return {
        type: 'all' as const,
        totalDAs: daUsageMap.size,
        totalDays: dailyUsageMap.size,
        totalTransactions: records.filter(r => r.da_details && r.da_details.length > 0).length
      };
    }
  }, [selectedDA, selectedDay, daUsageMap, dailyUsageMap, records]);

  return (
    <>
      {/* DA Overview Cards - Always visible */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 mb-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-500 p-3 rounded-xl">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-black uppercase tracking-wide">
                DA Usage Overview
              </h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                All Dedicated Account Activity
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-black text-[#FFCC00] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all shadow-lg"
          >
            <Maximize2 size={16} />
            <span>Detailed Analysis</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {sortedDAIds.map(daId => {
            const usage = daUsageMap.get(daId)!;
            return (
              <div
                key={daId}
                className="p-4 rounded-xl border-2 bg-gray-50 border-gray-100 hover:border-purple-300 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedDA(daId);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-purple-600">DA {daId}</span>
                  <Database size={12} className="text-purple-400" />
                </div>
                <p className="text-lg font-black text-black mb-1">
                  {formatDAAmount(daId, usage.totalUsage)}
                </p>
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider truncate">
                  {usage.description}
                </p>
                <p className="text-[8px] font-bold text-gray-400 mt-2">
                  {usage.transactionCount} transactions
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Detailed Analysis */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-[#FFCC00] w-full max-w-7xl max-h-[90vh] overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-500 p-3 rounded-xl">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-wide">
                    Detailed DA Analysis
                  </h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                    Filter and analyze dedicated account usage
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDA('all');
                  setSelectedDay('all');
                }}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Filters */}
              <div className="bg-gray-50 rounded-[2rem] border border-gray-100 p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      Filter by DA
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDA}
                        onChange={(e) => setSelectedDA(e.target.value)}
                        className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="all">All DAs</option>
                        {sortedDAIds.map(daId => {
                          const usage = daUsageMap.get(daId)!;
                          return (
                            <option key={daId} value={daId}>
                              DA {daId} - {usage.description}
                            </option>
                          );
                        })}
                      </select>
                      <Filter size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      Filter by Day
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="all">All Days</option>
                        {sortedDates.map(date => {
                          const daily = dailyUsageMap.get(date)!;
                          return (
                            <option key={date} value={date}>
                              {date}
                            </option>
                          );
                        })}
                      </select>
                      <Calendar size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {(selectedDA !== 'all' || selectedDay !== 'all') && (
                  <button
                    onClick={() => {
                      setSelectedDA('all');
                      setSelectedDay('all');
                    }}
                    className="mt-4 text-xs font-black text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Detailed Analysis Section */}
              {filteredData && (
                <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-100">
                    <div className="bg-blue-500 p-3 rounded-xl">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black uppercase tracking-wide">
                        Analysis Results
                      </h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                        {filteredData.type === 'all' ? 'Overall Summary' :
                         filteredData.type === 'da' ? `DA ${selectedDA} Analysis` :
                         filteredData.type === 'day' ? `${selectedDay} Analysis` :
                         `DA ${selectedDA} on ${selectedDay}`}
                      </p>
                    </div>
                  </div>

                  {filteredData.type === 'all' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-100">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                          Total DAs Used
                        </p>
                        <p className="text-4xl font-black text-purple-600 italic">
                          {filteredData.totalDAs}
                        </p>
                      </div>
                      <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                          Days with Activity
                        </p>
                        <p className="text-4xl font-black text-blue-600 italic">
                          {filteredData.totalDays}
                        </p>
                      </div>
                      <div className="p-6 bg-green-50 rounded-xl border-2 border-green-100">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                          Total Transactions
                        </p>
                        <p className="text-4xl font-black text-green-600 italic">
                          {filteredData.totalTransactions}
                        </p>
                      </div>
                    </div>
                  )}

                  {filteredData.type === 'da' && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-100">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                            Total Usage
                          </p>
                          <p className="text-3xl font-black text-purple-600 italic">
                            {formatDAAmount(filteredData.daId, filteredData.totalUsage)}
                          </p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                            Transactions
                          </p>
                          <p className="text-3xl font-black text-blue-600 italic">
                            {filteredData.transactionCount}
                          </p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-xl border-2 border-green-100">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                            Avg per Transaction
                          </p>
                          <p className="text-3xl font-black text-green-600 italic">
                            {formatDAAmount(filteredData.daId, filteredData.totalUsage / filteredData.transactionCount)}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Date/Time
                              </th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Amount Charged
                              </th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Balance Before
                              </th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Balance After
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredData.transactions.map((txn, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{txn.date}</td>
                                <td className="px-6 py-4 text-sm font-bold text-red-600">
                                  {formatDAAmount(filteredData.daId, txn.amountCharged)}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-600">
                                  {formatDAAmount(filteredData.daId, txn.balanceBefore)}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-green-600">
                                  {formatDAAmount(filteredData.daId, txn.balanceAfter)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {filteredData.type === 'day' && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                            Total Usage
                          </p>
                          <p className="text-3xl font-black text-blue-600 italic">
                            {filteredData.totalUsage.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-xl border-2 border-green-100">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                            Transactions
                          </p>
                          <p className="text-3xl font-black text-green-600 italic">
                            {filteredData.transactionCount}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                DA ID
                              </th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Amount Charged
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredData.transactions.map((txn, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-black text-purple-600">DA {txn.daId}</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{txn.description}</td>
                                <td className="px-6 py-4 text-sm font-bold text-red-600">
                                  {formatDAAmount(txn.daId, txn.amountCharged)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {filteredData.type === 'specific' && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-100">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                            Total Usage
                          </p>
                          <p className="text-3xl font-black text-purple-600 italic">
                            {formatDAAmount(filteredData.daId, filteredData.totalUsage)}
                          </p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-100">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                            Transactions
                          </p>
                          <p className="text-3xl font-black text-blue-600 italic">
                            {filteredData.transactionCount}
                          </p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-xl border-2 border-green-100">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">
                            DA Description
                          </p>
                          <p className="text-sm font-black text-green-600">
                            {filteredData.description}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Time
                              </th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Amount Charged
                              </th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Balance Before
                              </th>
                              <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Balance After
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredData.transactions.map((txn, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{txn.date}</td>
                                <td className="px-6 py-4 text-sm font-bold text-red-600">
                                  {formatDAAmount(filteredData.daId, txn.amountCharged)}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-600">
                                  {formatDAAmount(filteredData.daId, txn.balanceBefore)}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-green-600">
                                  {formatDAAmount(filteredData.daId, txn.balanceAfter)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}