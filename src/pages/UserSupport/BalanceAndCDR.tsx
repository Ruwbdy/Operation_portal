import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Search, Wallet, Phone, Globe, MessageSquare, CreditCard, TrendingUp, FileText } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import BalanceTab from '../../components/user-support/balance-cdr/BalanceTab';
import CDRTable from '../../components/user-support/balance-cdr/CDRTable';
import CDRSummary from '../../components/user-support/balance-cdr/CDRSummary';
import { validateMSISDN, validateDateRange } from '../../utils/validators';
import { parseCDRRecords } from '../../services/cdrParser';
import { fetchDataProfile } from '../../services/api';
import type { Balances } from '../../types/subscriber';
import type { CDRTabType, CategorizedCDR, CDRSummary as CDRSummaryType } from '../../types/cdr';

export default function BalanceAndCDR() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [msisdn, setMsisdn] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<CDRTabType>('balance');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [balances, setBalances] = useState<Balances | null>(null);
  const [categorizedCDR, setCategorizedCDR] = useState<CategorizedCDR | null>(null);
  const [summaries, setSummaries] = useState<Record<string, CDRSummaryType> | null>(null);
  
  // Toast states
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleSearch = async () => {
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

    setIsLoading(true);
    
    try {
      // Convert dates to YYYYMMDD format for API
      const formattedStartDate = startDate.replace(/-/g, '');
      const formattedEndDate = endDate.replace(/-/g, '');

      // Call the consolidated API
      const response = await fetchDataProfile(msisdn, formattedStartDate, formattedEndDate);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch data profile');
      }
      
      // Update balances
      setBalances(response.data.balances || null);
      
      // Parse and categorize CDR records
      if (response.data.cdrRecords && response.data.cdrRecords.length > 0) {
        const mockApiResponse = {
          APIStatus: {
            msisdn: msisdn,
            requestId: 'REQ-' + Date.now(),
            dateRange: [formattedStartDate, formattedEndDate],
            maxRecs: 1000,
            numRecs: response.data.cdrRecords.length,
            statusCode: 200,
            statusMsg: 'Success'
          },
          APIData: response.data.cdrRecords
        };
        
        const { categorized, summaries: parsedSummaries } = parseCDRRecords(mockApiResponse);
        setCategorizedCDR(categorized);
        setSummaries(parsedSummaries);
      } else {
        // No CDR records found
        setCategorizedCDR({
          voice: [],
          data: [],
          sms: [],
          credit: [],
          daAdjustment: [],
          other: []
        });
        setSummaries({
          voice: { totalCalls: 0, totalDuration: 0, totalCharged: 0, recordCount: 0 },
          data: { totalBytes: 0, totalCharged: 0, recordCount: 0 },
          sms: { totalMessages: 0, totalCharged: 0, recordCount: 0 },
          credit: { totalAmount: 0, recordCount: 0 },
          daAdjustment: { totalAmount: 0, recordCount: 0 },
          other: { recordCount: 0 }
        });
      }
      
      setSuccessToast('Data loaded successfully');
    } catch (error) {
      setErrorToast(error instanceof Error ? error.message : 'Failed to load data');
      console.error('Data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const tabs = [
    { id: 'balance' as CDRTabType, label: 'MA & DA Balances', icon: <Wallet size={14} />, color: 'text-green-600', count: 0 },
    { id: 'voice' as CDRTabType, label: 'Voice Record', icon: <Phone size={14} />, color: 'text-blue-600', count: categorizedCDR?.voice.length || 0 },
    { id: 'data' as CDRTabType, label: 'Data & DA Record', icon: <Globe size={14} />, color: 'text-purple-600', count: categorizedCDR?.data.length || 0 },
    { id: 'sms' as CDRTabType, label: 'SMS Record', icon: <MessageSquare size={14} />, color: 'text-cyan-600', count: categorizedCDR?.sms.length || 0 },
    { id: 'credit' as CDRTabType, label: 'Credit & Recharge', icon: <CreditCard size={14} />, color: 'text-amber-600', count: categorizedCDR?.credit.length || 0 },
    { id: 'daAdjustment' as CDRTabType, label: 'DA Adjustment', icon: <TrendingUp size={14} />, color: 'text-pink-600', count: categorizedCDR?.daAdjustment.length || 0 },
    { id: 'other' as CDRTabType, label: 'Other Record', icon: <FileText size={14} />, color: 'text-gray-600', count: categorizedCDR?.other.length || 0 }
  ];

  const hasData = balances !== null || categorizedCDR !== null;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] selection:bg-[#FFCC00] selection:text-black font-sans">
      {/* Toast Notifications */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center space-y-4 pointer-events-none">
        {errorToast && (
          <Toast type="error" message={errorToast} onClose={() => setErrorToast(null)} />
        )}
        {successToast && (
          <Toast type="success" message={successToast} onClose={() => setSuccessToast(null)} />
        )}
      </div>

      {isLoading && <LoadingSpinner message="Loading Records..." />}

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
                <span className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">
                  User Support Module
                </span>
                <div className="flex items-center space-x-2">
                  <span className="bg-black text-[#FFCC00] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Active
                  </span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-black tracking-tighter uppercase leading-none italic">
              Balance & CDR Records
            </h1>
          </div>
        </header>

        {/* Search Bar */}
        <div className="max-w-4xl mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                  MSISDN
                </label>
                <input
                  type="text"
                  value={msisdn}
                  onChange={(e) => setMsisdn(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="234XXXXXXXXXX"
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors placeholder:text-gray-300"
                  maxLength={13}
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full mt-6 px-8 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
            >
              <Search size={16} />
              <span>Search Records</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        {hasData && (
          <div className="mb-8 overflow-x-auto">
            <div className="flex space-x-3 bg-white p-3 rounded-[2rem] shadow-lg border border-gray-100 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-black text-[#FFCC00] shadow-lg'
                      : 'text-gray-400 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-[#FFCC00]' : tab.color}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? 'bg-[#FFCC00] text-black'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {hasData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'balance' && balances && (
              <BalanceTab balances={balances} />
            )}
            {activeTab === 'voice' && categorizedCDR && summaries && (
              <>
                <CDRSummary summary={summaries.voice} type="voice" />
                <CDRTable records={categorizedCDR.voice} type="voice" />
              </>
            )}
            {activeTab === 'data' && categorizedCDR && summaries && (
              <>
                <CDRSummary summary={summaries.data} type="data" />
                <CDRTable records={categorizedCDR.data} type="data" />
              </>
            )}
            {activeTab === 'sms' && categorizedCDR && summaries && (
              <>
                <CDRSummary summary={summaries.sms} type="sms" />
                <CDRTable records={categorizedCDR.sms} type="sms" />
              </>
            )}
            {activeTab === 'credit' && categorizedCDR && summaries && (
              <>
                <CDRSummary summary={summaries.credit} type="credit" />
                <CDRTable records={categorizedCDR.credit} type="credit" />
              </>
            )}
            {activeTab === 'daAdjustment' && categorizedCDR && summaries && (
              <>
                <CDRSummary summary={summaries.daAdjustment} type="daAdjustment" />
                <CDRTable records={categorizedCDR.daAdjustment} type="daAdjustment" />
              </>
            )}
            {activeTab === 'other' && categorizedCDR && summaries && (
              <>
                <CDRSummary summary={summaries.other} type="other" />
                <CDRTable records={categorizedCDR.other} type="other" />
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasData && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-16 rounded-[2.5rem] shadow-xl border border-gray-100 text-center">
              <div className="bg-gray-50 w-24 h-24 rounded-2xl mx-auto mb-8 flex items-center justify-center">
                <Search size={48} className="text-gray-300" />
              </div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-4 italic">
                Enter Search Criteria
              </h2>
              <p className="text-gray-500 text-sm font-bold leading-relaxed">
                Search for a subscriber's balance and CDR records within a specific date range to view detailed transaction history.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}