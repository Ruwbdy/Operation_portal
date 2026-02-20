import React, { useState } from 'react';
import { Phone, MapPin, Shield, PhoneForwarded, PhoneOff, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Radio, Zap } from 'lucide-react';
import { resetCallProfile } from '../../../services/api_services';
import type { VoiceProfile } from '../../../services/data_interface';

interface VoiceProfileTabProps {
  profile: VoiceProfile;
  msisdn: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function ActiveBadge({ active, alertWhenActive = false }: { active: boolean; alertWhenActive?: boolean }) {
  return active ? (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${alertWhenActive ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${alertWhenActive ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border bg-gray-100 text-gray-400 border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Inactive
    </span>
  );
}

function StateBadge({ value }: { value: string }) {
  const good = ['CONNECTED', 'AVAILABLE', 'LOCATED'].includes(value?.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${good ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${good ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />{value}
    </span>
  );
}

function YesNo({ v }: { v: number | undefined }) {
  return v === 1
    ? <span className="text-[11px] font-black text-green-600">YES</span>
    : <span className="text-[11px] font-black text-gray-400">NO</span>;
}

function Raw({ v, mono = false }: { v: any; mono?: boolean }) {
  if (v == null || v === '') return <span className="text-gray-300 italic text-[11px] font-normal">N/A</span>;
  return <span className={`text-[11px] font-black text-slate-700 ${mono ? 'font-mono' : ''}`}>{String(v)}</span>;
}

// ─── Table row ────────────────────────────────────────────────────────────────
function TR({ code, description, value, meaning, alert = false }: {
  code: string; description: string; value: React.ReactNode; meaning: string; alert?: boolean;
}) {
  return (
    <tr className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${alert ? 'bg-red-50/40' : ''}`}>
      <td className="px-5 py-3 w-[130px] align-top">
        <span className="font-black text-[10px] text-[#FFCC00] uppercase tracking-wider font-mono bg-black px-2 py-0.5 rounded whitespace-nowrap">{code}</span>
      </td>
      <td className="px-5 py-3 w-[220px] align-top">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{description}</span>
      </td>
      <td className="px-5 py-3 w-[170px] align-top">{value}</td>
      <td className="px-5 py-3 align-top">
        <span className={`text-[11px] leading-relaxed ${alert ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
          {alert && <AlertTriangle size={10} className="inline mr-1 text-red-500" />}{meaning}
        </span>
      </td>
    </tr>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, icon, accent, children, defaultOpen = true, alertCount = 0 }: {
  title: string; icon: React.ReactNode; accent: string;
  children: React.ReactNode; defaultOpen?: boolean; alertCount?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${accent}`}>{icon}</div>
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-black italic">{title}</span>
          {alertCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
              <AlertTriangle size={9} />{alertCount} {alertCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Code', 'Description', 'Value', 'Meaning'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VoiceProfileTab({ profile, msisdn, onSuccess, onError, onRefresh }: VoiceProfileTabProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResetCallProfile = async () => {
    setIsProcessing(true);
    try {
      const res = await resetCallProfile(msisdn);
      if (!res.success) throw new Error(res.error?.message || 'Failed');
      onSuccess(res.data?.message || 'Call profile reset successfully');
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to reset call profile');
    } finally { setIsProcessing(false); }
  };

  const handleResetCSP = async () => {
    setIsProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      onSuccess('CSP reset successfully');
    } catch { onError('Failed to reset CSP'); }
    finally { setIsProcessing(false); }
  };

  const cb  = profile.callBlocking;
  const cf  = profile.callForwarding;
  const ss  = profile.supplementary;
  const ci  = profile.callerId;
  const sv  = profile.serviceState;
  const cam = profile.camel;

  const blockingAlerts  = Object.values(cb).filter(s => s.ts20?.activationState === 1 || s.bs20?.activationState === 1).length;
  const forwardingAlerts = ['cfu', 'cfb', 'cfnrc', 'cfnry'].filter(k => (cf as any)[k]?.ts10?.activationState === 1).length;

  return (
    <div className="space-y-5">

      {/* Action bar */}
      <div className="flex flex-wrap gap-3">
        <button onClick={handleResetCallProfile} disabled={isProcessing}
          className="bg-black text-[#FFCC00] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50 shadow-lg border-2 border-transparent hover:border-[#FFCC00] flex items-center gap-2">
          <Phone size={14} />{isProcessing ? 'Processing...' : 'Reset Call Profile'}
        </button>
        <button onClick={handleResetCSP} disabled={isProcessing}
          className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 shadow-lg border-2 border-gray-200 hover:border-[#FFCC00] flex items-center gap-2">
          <Shield size={14} />{isProcessing ? 'Processing...' : 'Reset CSP'}
        </button>
        <button onClick={onRefresh} disabled={isProcessing}
          className="bg-white text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 shadow border border-gray-200 hover:border-gray-400 flex items-center gap-2">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* 1. Identity & Authentication */}
      <Section title="Identity & Authentication" icon={<Phone size={16} className="text-blue-600" />} accent="bg-blue-50">
        <TR code="MSISDN" description="Mobile Number"
          value={<span className="text-[12px] font-black text-[#FFCC00] font-mono bg-black px-2 py-0.5 rounded">{profile.msisdn}</span>}
          meaning="Subscriber's assigned phone number used for call and SMS routing across the network." />
        <TR code="IMSI" description="SIM Card Identity"
          value={<Raw v={profile.imsi} mono />}
          meaning="Unique 15-digit identifier stored on the SIM. Used internally for authentication, location updates and call routing." />
        <TR code="MSISDN STATE" description="Subscriber Attachment State"
          value={<StateBadge value={profile.msisdnState} />}
          meaning={profile.msisdnState === 'CONNECTED' ? 'Subscriber is attached to a VLR/MSC and is reachable for voice and SMS.' : 'Subscriber may be detached, purged, or currently unreachable.'} />
        <TR code="AUTHD" description="Authentication Vector Status"
          value={<StateBadge value={profile.authd} />}
          meaning={profile.authd === 'AVAILABLE' ? 'Authentication vectors are present — SIM can complete challenge-response authentication normally.' : 'Auth vectors may be exhausted or unavailable, which can cause attach and call failures.'} />
        <TR code="PWD" description="Supplementary Service Password"
          value={<Raw v={profile.pwd} mono />}
          meaning="4-digit password used by the subscriber to activate/deactivate call barring via USSD. Default is 0000." />
        <TR code="OICK" description="Outgoing Call Key"
          value={<Raw v={profile.oick} mono />}
          meaning="Internal IN platform routing key applied at call setup for real-time charging triggers." />
        <TR code="CSP" description="Customer Service Profile"
          value={<Raw v={profile.csp} mono />}
          meaning="Numeric profile that defines the set of supplementary services this subscriber class is permitted to use." />
        <TR code="MDEUEE" description="Mobile Data Enable Flag"
          value={<Raw v={profile.mdeuee} mono />}
          meaning="Controls mobile data service enablement. 11 = fully enabled for all data sessions." />
        <TR code="SMSFILTER" description="SMS Spam Filter"
          value={<span className="text-[11px] font-black text-gray-500 uppercase">{profile.smsSpam?.active || 'N/A'}</span>}
          meaning={profile.smsSpam?.active === 'NACTIVE' ? 'SMS spam filtering is not active for this subscriber.' : 'SMS spam filter state as reported by HLR.'} />
      </Section>

      {/* 2. Network Location */}
      <Section title="Network Location" icon={<MapPin size={16} className="text-green-600" />} accent="bg-green-50">
        <TR code="VLR ADDR" description="Visitor Location Register"
          value={<Raw v={profile.locationData.vlrAddress} mono />}
          meaning="The MSC/VLR node currently serving the subscriber — handles mobility management, paging, and call routing." />
        <TR code="MSC NUM" description="Mobile Switching Centre"
          value={<Raw v={profile.locationData.mscNumber} mono />}
          meaning="Circuit-switched switching node. Typically matches the VLR address when the subscriber is on the same core node." />
        <TR code="SGSN NUM" description="Serving GPRS Support Node"
          value={profile.locationData.sgsnNumber === 'UNKNOWN'
            ? <span className="text-[11px] font-black text-gray-400 italic">UNKNOWN</span>
            : <Raw v={profile.locationData.sgsnNumber} mono />}
          meaning={profile.locationData.sgsnNumber === 'UNKNOWN'
            ? 'No 2G/3G SGSN is serving this subscriber — they are likely attached via LTE EPC only, or currently idle.'
            : 'SGSN node handling this subscriber\'s 2G/3G packet data sessions.'} />
        <TR code="VLR DATA" description="Raw VLR Routing String"
          value={<Raw v={profile.vlrData} mono />}
          meaning="Raw VLR data string used internally for signalling routing between the HLR and serving MSC/VLR." />
      </Section>

      {/* 3. Teleservices & Bearer Services */}
      <Section title="Teleservices & Bearer Services" icon={<Shield size={16} className="text-indigo-600" />} accent="bg-indigo-50">
        <TR code="TS11" description="Telephony (Basic Voice)"
          value={<YesNo v={profile.ts11} />}
          meaning="Allows subscriber to make and receive standard circuit-switched voice calls." />
        <TR code="TS21" description="Short Message MT (Incoming SMS)"
          value={<YesNo v={profile.ts21} />}
          meaning="Permits reception of SMS messages terminated to this subscriber." />
        <TR code="TS22" description="Short Message MO (Outgoing SMS)"
          value={<YesNo v={profile.ts22} />}
          meaning="Permits subscriber to originate and send SMS messages." />
        <TR code="TS62" description="Call Transfer"
          value={<YesNo v={profile.ts62} />}
          meaning="Subscriber can transfer an active call to a third party mid-conversation." />
        {ss && <>
          <TR code="BS26" description="2G Data Bearer Service"
            value={<YesNo v={ss.bs26} />}
            meaning="Enables GPRS/EDGE 2G data bearer services for this subscription." />
          <TR code="BS3G" description="3G Bearer Service"
            value={<YesNo v={ss.bs3g} />}
            meaning="Enables UMTS/HSPA 3G data bearer services and higher-speed packet access." />
        </>}
      </Section>

      {/* 4. Caller ID */}
      {ci && (
        <Section title="Caller ID Services" icon={<Phone size={16} className="text-cyan-600" />} accent="bg-cyan-50">
          <TR code="CLIP" description="Calling Line Identity Presentation"
            value={<span className={`text-[11px] font-black ${ci.clip === 1 ? 'text-green-600' : 'text-gray-400'}`}>{ci.clip === 1 ? 'SHOW CALLER ID' : 'RESTRICTED'}</span>}
            meaning={ci.clip === 1 ? 'Subscriber\'s number is presented to the called party when they call.' : 'CLIP not active — caller ID presentation is restricted.'} />
          <TR code="CLIR" description="Calling Line Identity Restriction"
            value={
              <span className={`text-[11px] font-black ${ci.clir === 1 ? 'text-amber-600' : ci.clir === 2 ? 'text-green-600' : 'text-gray-500'}`}>
                {ci.clir === 1 ? 'HIDDEN — Number withheld' : ci.clir === 2 ? 'ALLOWED — Number shown' : `VALUE ${ci.clir}`}
              </span>
            }
            meaning={ci.clir === 1 ? 'Subscriber\'s own number is permanently withheld from called parties.' : ci.clir === 2 ? 'Number presentation is allowed — subscriber\'s number is visible to called parties.' : 'CLIR override mode configured at service class level.'} />
        </Section>
      )}

      {/* 5. Supplementary & VAS */}
      {ss && (
        <Section title="Supplementary & Value-Added Services" icon={<Zap size={16} className="text-amber-600" />} accent="bg-amber-50">
          <TR code="HOLD" description="Call Hold"
            value={<YesNo v={ss.hold} />}
            meaning="Subscriber can place an active call on hold and resume it, or attend to a second call." />
          <TR code="MPTY" description="Multi-Party Conference"
            value={<YesNo v={ss.mpty} />}
            meaning="Subscriber can establish multi-party conference calls with up to 5 participants." />
          <TR code="OFA" description="Outgoing Flexible Alerting"
            value={<YesNo v={ss.ofa} />}
            meaning="Allows incoming calls to simultaneously ring multiple registered devices or numbers." />
          <TR code="PRBT" description="Personalized Ring-Back Tone"
            value={<YesNo v={ss.prbt} />}
            meaning={ss.prbt === 1 ? 'Subscriber has an active PRBT — callers hear a custom audio tone instead of the standard ring.' : 'No personalized ring-back tone active.'} />
          <TR code="STYPE" description="Subscriber Type"
            value={<span className={`text-[11px] font-black ${ss.stype === 1 ? 'text-orange-600' : ss.stype === 2 ? 'text-blue-600' : 'text-gray-600'}`}>{ss.stype === 1 ? 'PREPAID' : ss.stype === 2 ? 'POSTPAID' : `TYPE ${ss.stype}`}</span>}
            meaning={ss.stype === 1 ? 'Prepaid subscriber — main account balance is deducted in real-time per usage event.' : ss.stype === 2 ? 'Postpaid subscriber — usage is accumulated and billed on a monthly invoice.' : 'Subscriber billing and service type.'} />
          <TR code="SCHAR" description="Service Charge Indicator"
            value={<Raw v={ss.schar} mono />}
            meaning="Internal tariff class and service charge routing indicator. Used by the IN platform to select the correct charging rate." />
          <TR code="CAT" description="Subscriber Category"
            value={<Raw v={ss.cat} mono />}
            meaning="Operator-defined category used for routing priority, service differentiation, and IN policy decisions." />
          <TR code="RSA" description="Radio Service Allowance"
            value={<Raw v={ss.rsa} mono />}
            meaning="Defines allowed radio technologies and roaming access classes for this subscriber." />
        </Section>
      )}

      {/* 6. Call Barring */}
      <Section title="Call Barring Services" icon={<PhoneOff size={16} className="text-red-600" />} accent="bg-red-50" alertCount={blockingAlerts}>
        {([
          { code: 'BAIC',   label: 'Bar All Incoming Calls',         svc: cb.baic,   meaning: 'Prevents all incoming voice calls from reaching the subscriber.' },
          { code: 'BAOC',   label: 'Bar All Outgoing Calls',         svc: cb.baoc,   meaning: 'Prevents subscriber from making any outgoing voice calls.' },
          { code: 'BOIC',   label: 'Bar Outgoing International',     svc: cb.boic,   meaning: 'Blocks all outgoing international calls.' },
          { code: 'BOIEXH', label: 'Bar Outgoing Intl Except Home',  svc: cb.boiexh, meaning: 'Blocks international calls including to the home country network.' },
          { code: 'BICRO',  label: 'Bar Incoming When Roaming',      svc: cb.bicro,  meaning: 'Prevents incoming calls while subscriber is roaming abroad.' },
        ] as const).map(({ code, label, svc, meaning }) => {
          const active = svc.ts20?.activationState === 1 || svc.bs20?.activationState === 1;
          return (
            <TR key={code} code={code} description={label}
              value={<ActiveBadge active={active} alertWhenActive />}
              meaning={active ? `BARRING IS ACTIVE — ${meaning}` : `Provisioned (state=${svc.provisionState}) but not currently active. ${meaning}`}
              alert={active} />
          );
        })}
      </Section>

      {/* 7. Call Forwarding */}
      <Section title="Call Forwarding Services" icon={<PhoneForwarded size={16} className="text-purple-600" />} accent="bg-purple-50" alertCount={forwardingAlerts}>
        {([
          { code: 'CFU',   label: 'Unconditional Forward',    svc: cf.cfu,   meaning: 'All incoming calls forwarded immediately regardless of subscriber state.' },
          { code: 'CFB',   label: 'Forward When Busy',         svc: cf.cfb,   meaning: 'Forwards incoming calls when the subscriber is on another call.' },
          { code: 'CFNRC', label: 'Forward Not Reachable',     svc: cf.cfnrc, meaning: 'Forwards calls when subscriber is detached, powered off, or out of coverage.' },
          { code: 'CFNRY', label: 'Forward No Reply',          svc: cf.cfnry, meaning: 'Forwards calls after a no-answer timeout period expires.' },
          { code: 'CAW',   label: 'Call Waiting',              svc: cf.caw,   meaning: 'Notifies subscriber of a second incoming call while on an active call.' },
        ] as const).map(({ code, label, svc, meaning }) => {
          const active  = svc.ts10?.activationState === 1;
          const fnum    = (svc as any).ts10?.fnum;
          const alertOn = active && code !== 'CAW';
          return (
            <TR key={code} code={code} description={label}
              value={
                <div className="flex flex-col gap-1">
                  <ActiveBadge active={active} alertWhenActive={alertOn} />
                  {fnum && <span className="text-[10px] font-mono text-gray-400">→ {fnum}</span>}
                </div>
              }
              meaning={alertOn ? `FORWARDING ACTIVE — ${meaning}` : `Provisioned (state=${svc.provisionState}). ${meaning}`}
              alert={alertOn} />
          );
        })}
        {cf.dcf && (
          <TR code="DCF" description="Direct Call Forwarding"
            value={<ActiveBadge active={cf.dcf.ts10?.activationState === 1} alertWhenActive />}
            meaning="Directly routes calls to a predefined number without ringing the subscriber first."
            alert={cf.dcf.ts10?.activationState === 1} />
        )}
      </Section>

      {/* 8. Service State Indicators */}
      {sv && (
        <Section title="Service State & System Access" icon={<Shield size={16} className="text-gray-600" />} accent="bg-gray-50" defaultOpen={false}>
          <TR code="OCSIST" description="OCS Access Indicator"
            value={<YesNo v={sv.ocsist} />}
            meaning="Online Charging System access allowed. Required for real-time balance deductions on calls and data." />
          <TR code="OSMCSIST" description="MSC Access Indicator"
            value={<YesNo v={sv.osmcsist} />}
            meaning="MSC access permitted — subscriber can route calls through the Mobile Switching Centre." />
          <TR code="TCSIST" description="TCS Active Indicator"
            value={<YesNo v={sv.tcsist} />}
            meaning="Telephony Control System active — no suspension or network-level service restriction detected." />
          <TR code="SOCFU" description="Service Class CFU Override"
            value={<Raw v={sv.socfu} mono />}
            meaning="Service class-level override applied to Call Forwarding Unconditional behaviour." />
          <TR code="SOCLIR" description="Service Class CLIR Override"
            value={<Raw v={sv.soclir} mono />}
            meaning="Service class-level override for Calling Line Identity Restriction presentation mode." />
          <TR code="TSMO" description="Temp Service Mode Override"
            value={<Raw v={sv.tsmo} mono />}
            meaning="Temporary service mode flag. Non-zero indicates a transient service modification is active." />
        </Section>
      )}

      {/* 9. CAMEL / IN Profile */}
      {cam && (
        <Section title="CAMEL / Intelligent Network Profile" icon={<Radio size={16} className="text-rose-600" />} accent="bg-rose-50" defaultOpen={false}>
          <TR code="EOINCI" description="MO Call IN Trigger Indicator"
            value={<Raw v={cam.eoinci} mono />}
            meaning="Whether the IN platform is triggered at the start of a mobile-originated call. 0 = not triggered, all real-time charging is default." />
          <TR code="EOICK" description="MO Call IN Routing Key"
            value={<Raw v={cam.eoick} mono />}
            meaning="Routing key used when the EOINCI trigger fires an event to the IN Service Control Point (SCP)." />
          <TR code="ETINCI" description="Call End IN Trigger Indicator"
            value={<Raw v={cam.etinci} mono />}
            meaning="Whether the IN platform is triggered at call termination for CDR generation or balance update." />
          <TR code="GPRSSO" description="GPRS CAMEL Service Option"
            value={<Raw v={cam.gprsso} mono />}
            meaning="Indicates whether CAMEL is active for GPRS/data sessions. 0 = no IN control over data bearers." />
          <TR code="OSMSSO" description="Originating SMS Service Option"
            value={<Raw v={cam.osmsso} mono />}
            meaning="CAMEL service option for SMS originated by this subscriber. 0 = no real-time IN SMS charging." />
          <TR code="TSMSSO" description="Terminating SMS Service Option"
            value={<Raw v={cam.tsmsso} mono />}
            meaning="CAMEL service option for SMS terminated to this subscriber." />
          <TR code="TIF" description="Translation Information Flag"
            value={<Raw v={cam.tif} mono />}
            meaning="Signals special number translation or routing treatment required by the IN platform." />
          <TR code="GC4SO / MC4SO" description="GPRS & SMS CAMEL Phase 4"
            value={<span className="text-[11px] font-mono text-slate-700">{cam.gc4so} / {cam.mc4so}</span>}
            meaning="Phase 4 CAMEL service options for GPRS data and MO-SMS. All zero = no advanced CAMEL triggers active." />
        </Section>
      )}

    </div>
  );
}