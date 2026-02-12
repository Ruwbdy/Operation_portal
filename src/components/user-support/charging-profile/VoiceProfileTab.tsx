import React, { useState } from 'react';
import { Phone, MapPin, Shield, PhoneForwarded, PhoneIncoming, PhoneOff, AlertCircle } from 'lucide-react';
import ProfileCard from '../../ui/ProfileCard';
import DataRow from '../../ui/DataRow';
import { resetCallProfile } from '../../../services/api_services';
import type { VoiceProfile } from '../../../services/data_interface';

interface VoiceProfileTabProps {
  profile: VoiceProfile;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function VoiceProfileTab({ profile, onSuccess, onError }: VoiceProfileTabProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResetCallProfile = async () => {
    setIsProcessing(true);
    try {
      const response = await resetCallProfile(profile.msisdn);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reset call profile');
      }
      
      onSuccess('Call profile reset successfully');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to reset call profile');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetCSP = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      onSuccess('CSP reset successfully');
    } catch (error) {
      onError('Failed to reset CSP');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for issues
  const hasCallBlockingIssues = Object.values(profile.callBlocking).some(
    service => service.ts20?.activationState === 1 || service.bs20?.activationState === 1
  );

  const hasForwardingActive = Object.values(profile.callForwarding).some(
    service => service.ts10?.activationState === 1
  );

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <button
          onClick={handleResetCallProfile}
          disabled={isProcessing}
          className="bg-black text-[#FFCC00] p-8 rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-gray-900 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-2 border-transparent hover:border-[#FFCC00]"
        >
          <Phone className="mx-auto mb-3" size={24} />
          {isProcessing ? 'Processing...' : 'Reset Call Profile'}
        </button>
        <button
          onClick={handleResetCallProfile}
          disabled={isProcessing}
          className="bg-white text-black p-8 rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-gray-50 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-2 border-gray-200 hover:border-[#FFCC00]"
        >
          <Shield className="mx-auto mb-3" size={24} />
          {isProcessing ? 'Processing...' : 'Reset CSP'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Identity & Authentication */}
        <ProfileCard
          label="Identity & Authentication"
          icon={<Phone size={20} />}
          color="bg-blue-50 text-blue-600"
        >
          <DataRow label="MSISDN" value={profile.msisdn} highlight />
          <DataRow label="IMSI" value={profile.imsi} highlight />
          <DataRow label="MSISDN State" value={profile.msisdnState} />
          <DataRow label="Auth Status" value={profile.authd} />
          <DataRow label="OICK" value={profile.oick} />
          <DataRow label="CSP" value={profile.csp} large />
        </ProfileCard>

        {/* Location Data */}
        <ProfileCard
          label="Network Location"
          icon={<MapPin size={20} />}
          color="bg-green-50 text-green-600"
        >
          <DataRow label="VLR Address" value={profile.locationData.vlrAddress} small />
          <DataRow label="MSC Number" value={profile.locationData.mscNumber} small />
          <DataRow label="SGSN Number" value={profile.locationData.sgsnNumber} small />
          <DataRow label="SMS Spam Filter" value={profile.smsSpam?.active || 'N/A'} />
        </ProfileCard>

        {/* Call Blocking Services */}
        <ProfileCard
          label="Call Blocking Services"
          icon={<PhoneOff size={20} />}
          color="bg-red-50 text-red-600"
        >
          <DataRow 
            label="BAIC (Incoming Calls)" 
            value={`Prov: ${profile.callBlocking.baic.provisionState} | Act: ${profile.callBlocking.baic.ts20?.activationState || 0}`} 
          />
          <DataRow 
            label="BAOC (Outgoing Calls)" 
            value={`Prov: ${profile.callBlocking.baoc.provisionState} | Act: ${profile.callBlocking.baoc.ts20?.activationState || 0}`} 
          />
          <DataRow 
            label="BOIC (Outgoing Int'l)" 
            value={`Prov: ${profile.callBlocking.boic.provisionState} | Act: ${profile.callBlocking.boic.ts20?.activationState || 0}`} 
          />
          <DataRow 
            label="BICRO (Incoming Roaming)" 
            value={`Prov: ${profile.callBlocking.bicro.provisionState} | Act: ${profile.callBlocking.bicro.ts20?.activationState || 0}`} 
          />
          <DataRow 
            label="BOIEXH (Outgoing ex-Home)" 
            value={`Prov: ${profile.callBlocking.boiexh.provisionState} | Act: ${profile.callBlocking.boiexh.ts20?.activationState || 0}`} 
          />
        </ProfileCard>

        {/* Call Forwarding Services */}
        <ProfileCard
          label="Call Forwarding Services"
          icon={<PhoneForwarded size={20} />}
          color="bg-purple-50 text-purple-600"
        >
          <DataRow 
            label="CFU (Unconditional)" 
            value={`Prov: ${profile.callForwarding.cfu.provisionState} | Act: ${profile.callForwarding.cfu.ts10?.activationState || 0}`} 
          />
          <DataRow 
            label="CFB (Busy)" 
            value={`Prov: ${profile.callForwarding.cfb.provisionState} | Act: ${profile.callForwarding.cfb.ts10?.activationState || 0}`} 
          />
          <DataRow 
            label="CFNRC (Not Reachable)" 
            value={`Prov: ${profile.callForwarding.cfnrc.provisionState} | Act: ${profile.callForwarding.cfnrc.ts10?.activationState || 0}`} 
          />
          <DataRow 
            label="CFNRY (No Reply)" 
            value={`Prov: ${profile.callForwarding.cfnry.provisionState} | Act: ${profile.callForwarding.cfnry.ts10?.activationState || 0}`} 
          />
          <DataRow 
            label="CAW (Call Waiting)" 
            value={`Prov: ${profile.callForwarding.caw.provisionState} | Act: ${profile.callForwarding.caw.ts10?.activationState || 0}`} 
          />
          {profile.callForwarding.dcf && (
            <DataRow 
              label="DCF (Direct Call Forwarding)" 
              value={`Prov: ${profile.callForwarding.dcf.provisionState} | Act: ${profile.callForwarding.dcf.ts10?.activationState || 0} | Fwd: ${profile.callForwarding.dcf.ts10?.fnum || 'N/A'}`} 
            />
          )}
        </ProfileCard>

        {/* Additional Services */}
        <ProfileCard
          label="Additional Services"
          icon={<Shield size={20} />}
          color="bg-gray-50 text-gray-600"
        >
          <DataRow label="MDEUEE" value={profile.mdeuee} />
          <DataRow label="TS11 (Allow Incoming Calls)" value={profile.ts11} />
          <DataRow label="TS21 (Allow Incoming SMS)" value={profile.ts21} />
          <DataRow label="TS22 (Allow Outgoing SMS)" value={profile.ts22} />
          <DataRow label="TS62" value={profile.ts62} />
        </ProfileCard>
      </div>
    </div>
  );
}