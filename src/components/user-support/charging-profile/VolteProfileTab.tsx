import React, { useState } from 'react';
import { Radio, PhoneCall, Power, Trash2 } from 'lucide-react';
import ProfileCard from '../../ui/ProfileCard';
import DataRow from '../../ui/DataRow';
import { activateVoLTE, deactivateVoLTE, deleteVoLTE } from '../../../services/api';
import type { VoLTEProfile } from '../../../services/data_interface';

interface VoLTEProfileTabProps {
  profile: VoLTEProfile;
  msisdn: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function VoLTEProfileTab({ profile, msisdn, onSuccess, onError }: VoLTEProfileTabProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActivateVoLTE = async () => {
    setIsProcessing(true);
    try {
      const response = await activateVoLTE(msisdn);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to activate VoLTE');
      }
      
      onSuccess('VoLTE activated successfully');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to activate VoLTE');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivateVoLTE = async () => {
    setIsProcessing(true);
    try {
      const response = await deactivateVoLTE(msisdn);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to deactivate VoLTE');
      }
      
      onSuccess('VoLTE deactivated successfully');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to deactivate VoLTE');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteVoLTE = async () => {
    setIsProcessing(true);
    try {
      const response = await deleteVoLTE(msisdn);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete VoLTE configuration');
      }
      
      onSuccess('VoLTE configuration deleted successfully');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to delete VoLTE configuration');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* VoLTE Identity */}
        <ProfileCard
          label="VoLTE Identity"
          icon={<Radio size={20} />}
          color="bg-purple-50 text-purple-600"
        >
          <DataRow label="Public ID" value={profile.publicId} small />
          <DataRow label="Concurrency Control" value={profile.concurrencyControl} />
        </ProfileCard>

        {/* CDIV Configuration */}
        <ProfileCard
          label="Call Diversion (CDIV)"
          icon={<PhoneCall size={20} />}
          color="bg-blue-50 text-blue-600"
        >
          <DataRow 
            label="CDIV Status" 
            value={profile.cdiv.activated ? 'ACTIVATED' : 'DEACTIVATED'} 
            large
          />
          <DataRow 
            label="No Reply Timer" 
            value={profile.cdiv.userNoReplyTimer} 
          />
        </ProfileCard>

        {/* Primary Conditions */}
        <ProfileCard
          label="Primary Conditions"
          icon={<PhoneCall size={20} />}
          color="bg-green-50 text-green-600"
        >
          <DataRow 
            label="Anonymous Condition" 
            value={profile.cdiv.conditions.anonymousCondition} 
          />
          <DataRow 
            label="Unconditional" 
            value={profile.cdiv.conditions.unconditionalCondition} 
          />
          <DataRow 
            label="Busy Condition" 
            value={profile.cdiv.conditions.busyCondition} 
          />
          <DataRow 
            label="No Answer" 
            value={profile.cdiv.conditions.noAnswerCondition} 
          />
          <DataRow 
            label="Not Reachable" 
            value={profile.cdiv.conditions.notReachableCondition} 
          />
        </ProfileCard>

        {/* Additional Conditions */}
        <ProfileCard
          label="Additional Conditions"
          icon={<PhoneCall size={20} />}
          color="bg-amber-50 text-amber-600"
        >
          <DataRow 
            label="Identity Condition" 
            value={profile.cdiv.conditions.identityCondition} 
          />
          <DataRow 
            label="Media Condition" 
            value={profile.cdiv.conditions.mediaCondition} 
          />
          <DataRow 
            label="Not Registered" 
            value={profile.cdiv.conditions.notRegisteredCondition} 
          />
          <DataRow 
            label="Presence Status" 
            value={profile.cdiv.conditions.presenceStatusCondition} 
          />
          <DataRow 
            label="Validity" 
            value={profile.cdiv.conditions.validityCondition} 
          />
        </ProfileCard>
      </div>

      {/* Status Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-[2rem] border-2 border-purple-100">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-6">
          Service Readiness
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">
              CDIV Status
            </p>
            <p className={`text-xl font-black uppercase italic ${
              profile.cdiv.activated ? 'text-green-600' : 'text-red-600'
            }`}>
              {profile.cdiv.activated ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">
              Unconditional
            </p>
            <p className={`text-xl font-black uppercase italic ${
              profile.cdiv.conditions.unconditionalCondition === 'activated' 
                ? 'text-green-600' 
                : 'text-gray-400'
            }`}>
              {profile.cdiv.conditions.unconditionalCondition}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">
              Anonymous
            </p>
            <p className={`text-xl font-black uppercase italic ${
              profile.cdiv.conditions.anonymousCondition === 'activated' 
                ? 'text-green-600' 
                : 'text-gray-400'
            }`}>
              {profile.cdiv.conditions.anonymousCondition}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <button
          onClick={handleActivateVoLTE}
          disabled={isProcessing}
          className="bg-black text-[#FFCC00] p-8 rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-gray-900 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-2 border-transparent hover:border-[#FFCC00]"
        >
          <Power className="mx-auto mb-3" size={24} />
          {isProcessing ? 'Processing...' : 'Activate VoLTE'}
        </button>
        <button
          onClick={handleDeactivateVoLTE}
          disabled={isProcessing}
          className="bg-white text-black p-8 rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-gray-50 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-2 border-gray-200 hover:border-amber-500"
        >
          <Power className="mx-auto mb-3" size={24} />
          {isProcessing ? 'Processing...' : 'Deactivate VoLTE'}
        </button>
        <button
          onClick={handleDeleteVoLTE}
          disabled={isProcessing}
          className="bg-red-600 text-white p-8 rounded-[2rem] font-black text-sm uppercase tracking-wider hover:bg-red-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-2 border-transparent hover:border-red-500"
        >
          <Trash2 className="mx-auto mb-3" size={24} />
          {isProcessing ? 'Processing...' : 'Delete VoLTE'}
        </button>
      </div>
    </div>
  );
}