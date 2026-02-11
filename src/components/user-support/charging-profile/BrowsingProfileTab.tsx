import React, { useState } from 'react';
import { Globe, Smartphone, Server, Wifi } from 'lucide-react';
import ProfileCard from '../../ui/ProfileCard';
import DataRow from '../../ui/DataRow';
import { resetAPN } from '../../../services/api';
import type { BrowsingProfile } from '../../../services/data_interface';

interface BrowsingProfileTabProps {
  profile: BrowsingProfile;
  msisdn: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function BrowsingProfileTab({ profile, msisdn, onSuccess, onError }: BrowsingProfileTabProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResetAPNPhone = async () => {
    setIsProcessing(true);
    try {
      const response = await resetAPN(msisdn, false);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reset browsing profile');
      }
      
      onSuccess('Browsing profile reset successfully (Mobile)');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to reset browsing profile');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAPNIoT = async () => {
    setIsProcessing(true);
    try {
      const response = await resetAPN(msisdn, true);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reset browsing profile');
      }
      
      onSuccess('Browsing profile reset successfully (IoT)');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to reset browsing profile');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GPRS Configuration */}
        <ProfileCard
          label="GPRS Configuration"
          icon={<Wifi size={20} />}
          color="bg-green-50 text-green-600"
        >
          <DataRow label="PDP ID" value={profile.gprs.pdpid} highlight />
          <DataRow label="APN ID" value={profile.gprs.apnid} highlight />
          <DataRow label="PDP Type" value={profile.gprs.pdpty} large />
          <DataRow label="EQOS ID" value={profile.gprs.eqosid} />
          <DataRow label="VPAA" value={profile.gprs.vpaa} />
        </ProfileCard>

        {/* HSS EPS Profile */}
        <ProfileCard
          label="HSS EPS Profile"
          icon={<Server size={20} />}
          color="bg-blue-50 text-blue-600"
        >
          <DataRow label="EPS Profile ID" value={profile.hss.epsProfileId} highlight />
          <DataRow 
            label="Roaming Allowed" 
            value={profile.hss.epsRoamingAllowed ? 'YES' : 'NO'} 
            large
          />
          <DataRow 
            label="Default Context ID" 
            value={profile.hss.epsIndividualDefaultContextId} 
          />
          <DataRow label="Location State" value={profile.hss.epsLocationState} />
        </ProfileCard>

        {/* Network Information */}
        <ProfileCard
          label="Network Information"
          icon={<Globe size={20} />}
          color="bg-purple-50 text-purple-600"
        >
          <DataRow label="User IPv4 Address" value={profile.hss.epsUserIpV4Address} small />
          <DataRow label="MME Address" value={profile.hss.mmeAddress} small />
          <DataRow label="IMEI-SV" value={profile.hss.epsImeiSv} small />
        </ProfileCard>

        {/* Status Summary */}
        <ProfileCard
          label="Connection Status"
          icon={<Smartphone size={20} />}
          color="bg-cyan-50 text-cyan-600"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                GPRS Status
              </span>
              <span className="text-xs font-black text-green-600 uppercase bg-green-50 px-3 py-1 rounded-lg">
                Configured
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                EPS Status
              </span>
              <span className="text-xs font-black text-green-600 uppercase bg-green-50 px-3 py-1 rounded-lg">
                {profile.hss.epsLocationState}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                Roaming
              </span>
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${
                profile.hss.epsRoamingAllowed 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                {profile.hss.epsRoamingAllowed ? 'Allowed' : 'Blocked'}
              </span>
            </div>
          </div>
        </ProfileCard>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <button
          onClick={handleResetAPNPhone}
          disabled={isProcessing}
          className="bg-black text-[#FFCC00] p-8 rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-gray-900 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-2 border-transparent hover:border-[#FFCC00]"
        >
          <Smartphone className="mx-auto mb-3" size={24} />
          {isProcessing ? 'Processing...' : 'Reset Browsing - Mobile'}
        </button>
        <button
          onClick={handleResetAPNIoT}
          disabled={isProcessing}
          className="bg-white text-black p-8 rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-gray-50 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-2 border-gray-200 hover:border-[#FFCC00]"
        >
          <Wifi className="mx-auto mb-3" size={24} />
          {isProcessing ? 'Processing...' : 'Reset Browsing - IoT'}
        </button>
      </div>
    </div>
  );
}