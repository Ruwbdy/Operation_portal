import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Search, Phone, Globe, Radio, Gift } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import VoiceProfileTab from '../../components/user-support/charging-profile/VoiceProfileTab';
import BrowsingProfileTab from '../../components/user-support/charging-profile/BrowsingProfileTab';
import VoLTEProfileTab from '../../components/user-support/charging-profile/VolteProfileTab';
import OffersTab from '../../components/user-support/charging-profile/OffersTab';
import { validateMSISDN } from '../../utils/validators';
import { fetchChargingProfile } from '../../services/api';
import type { VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Diagnostics } from '../../services/data_interface';

type TabType = 'voice' | 'browsing' | 'volte' | 'offers';

export default function ChargingProfile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [msisdn, setMsisdn] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('voice');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile data states
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [browsingProfile, setBrowsingProfile] = useState<BrowsingProfile | null>(null);
  const [volteProfile, setVolteProfile] = useState<VoLTEProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  
  // Toast states
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleSearch = async () => {
    const validation = validateMSISDN(msisdn);
    if (!validation.valid) {
      setErrorToast(validation.error || 'Invalid MSISDN');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the consolidated API
      const response = await fetchChargingProfile(msisdn);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch charging profile');
      }
      
      // Update states with response data
      setVoiceProfile(response.data.voice || null);
      setBrowsingProfile(response.data.browsing || null);
      setVolteProfile(response.data.volte || null);
      setOffers(response.data.offers || []);
      
      setSuccessToast('Profile data loaded successfully');
    } catch (error) {
      setErrorToast(error instanceof Error ? error.message : 'Failed to load profile data');
      console.error('Profile fetch error:', error);
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
    { id: 'voice' as TabType, label: 'Voice Profile', icon: <Phone size={14} />, color: 'text-blue-600' },
    { id: 'browsing' as TabType, label: 'Browsing Profile', icon: <Globe size={14} />, color: 'text-green-600' },
    { id: 'volte' as TabType, label: 'VoLTE Profile', icon: <Radio size={14} />, color: 'text-purple-600' },
    { id: 'offers' as TabType, label: 'Offers', icon: <Gift size={14} />, color: 'text-amber-600' }
  ];

  const hasData = voiceProfile !== null;

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

      {isLoading && <LoadingSpinner message="Loading Profile Data..." />}

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
              Charging Profile
            </h1>
          </div>
        </header>

        {/* Search Bar */}
        <div className="max-w-2xl mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
              MSISDN Lookup
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="234XXXXXXXXXX"
                className="flex-1 px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] transition-colors placeholder:text-gray-300"
                maxLength={13}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-8 py-4 bg-black text-[#FFCC00] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {hasData && (
          <div className="mb-8">
            <div className="flex space-x-3 bg-white p-3 rounded-[2rem] shadow-lg border border-gray-100 max-w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'bg-black text-[#FFCC00] shadow-lg'
                      : 'text-gray-400 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-[#FFCC00]' : tab.color}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {hasData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'voice' && voiceProfile && (
              <VoiceProfileTab 
                profile={voiceProfile} 
                onSuccess={(msg) => setSuccessToast(msg)}
                onError={(msg) => setErrorToast(msg)}
              />
            )}
            {activeTab === 'browsing' && browsingProfile && (
              <BrowsingProfileTab 
                profile={browsingProfile}
                msisdn={msisdn}
                onSuccess={(msg) => setSuccessToast(msg)}
                onError={(msg) => setErrorToast(msg)}
              />
            )}
            {activeTab === 'volte' && volteProfile && (
              <VoLTEProfileTab 
                profile={volteProfile}
                msisdn={msisdn}
                onSuccess={(msg) => setSuccessToast(msg)}
                onError={(msg) => setErrorToast(msg)}
              />
            )}
            {activeTab === 'offers' && (
              <OffersTab offers={offers} />
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
                Enter MSISDN to Begin
              </h2>
              <p className="text-gray-500 text-sm font-bold leading-relaxed">
                Search for a subscriber to view their charging profile, voice settings, browsing configuration, VoLTE status, and active offers.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}