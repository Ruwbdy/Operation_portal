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

function isNo(v?: number) {
  return v !== 1; // TS/BS are NO when value ≠ 1
}

function Raw({ v, mono = false }: { v: any; mono?: boolean }) {
  if (v == null || v === '') return <span className="text-gray-300 italic text-[11px] font-normal">N/A</span>;
  return <span className={`text-[13px] font-black text-slate-700 ${mono ? 'font-#' : ''}`}>{String(v)}</span>;
}

// ─── Card component ───────────────────────────────────────────────────────────
interface CardProps {
  code: string;
  description: string;
  value: React.ReactNode;
  meaning: string;
  alert?: boolean;
}

function Card({ code, description, value, meaning, alert = false }: CardProps) {
  return (
    <div className={`group relative bg-white rounded-2xl border-[2.5px] p-3.5 flex items-center justify-between gap-3 cursor-default transition-all duration-200 overflow-visible ${
      alert 
        ? 'border-red-200 bg-red-50/30 hover:border-red-500 hover:bg-red-50/50 hover:shadow-lg' 
        : 'border-gray-200 hover:border-[#FFCC00] hover:bg-yellow-50/30 hover:shadow-lg'
    }`}>
      {/* LEFT: Code + Description */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <span className="font-mono text-[15px] font-black text-black px-1.0 py-0.5 rounded uppercase tracking-wide w-fit">
          {code}
        </span>
        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wide">
          {description}
        </span>
      </div>

      {/* RIGHT: Value */}
      <div className="relative flex items-center justify-end">
        <div className="group-hover:opacity-30 transition-opacity duration-150">
          {value}
        </div>

        {/* Tooltip tag — appears above value on hover */}
        <div className="absolute bottom-[calc(100%+8px)] right-0 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-200 z-30">
          <div className={`bg-black text-gray-200 text-[10px] font-semibold leading-tight py-1 px-3 rounded-lg shadow-xl min-w-[280px] max-w-[320px] whitespace-normal border-b-[3px] ${
            alert ? 'border-b-red-500 text-red-300' : 'border-b-[#FFCC00]'
          }`}>
            {meaning}
            {/* Down arrow */}
            <div className={`absolute top-full right-3.5 border-[5px] border-transparent ${
              alert ? 'border-t-black' : 'border-t-black'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  alertCount?: number;
}

function Section({ title, icon, accent, children, defaultOpen = true, alertCount = 0 }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-[22px] border border-gray-100 shadow-sm overflow-hidden">
      <button 
        onClick={() => setOpen(o => !o)} 
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors border-l-4 border-l-[#FFCC00]"
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${accent} flex items-center justify-center shrink-0`}>{icon}</div>
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-black italic">{title}</span>
          {alertCount > 0 && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-600 border border-red-200">
              <AlertTriangle size={8} />{alertCount} {alertCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            Hover for meaning
          </span>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="p-3.5 grid grid-cols-3 gap-2.5">
          {children}
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

  const blockingAlerts  = Object.values(cb).filter(s => s.ts20?.activationState === 1 || s.bs20?.activationState === 1).length
    + (profile.obo === 1 ? 1 : 0)
    + (profile.obi === 1 ? 1 : 0)
    + (profile.obssm === 1 ? 1 : 0)
    + (profile.obp === 1 ? 1 : 0);
  const forwardingAlerts = ['cfu', 'cfb', 'cfnrc', 'cfnry'].filter(k => (cf as any)[k]?.ts10?.activationState === 1).length
    + (cf.dcf?.ts10?.activationState === 1 ? 1 : 0);
  // alert count for TS and BS here

  return (
    <div className="space-y-4">

      {/* Action bar */}
      <div className="flex flex-wrap gap-2.5">
        <button onClick={handleResetCallProfile} disabled={isProcessing}
          className="bg-black text-[#FFCC00] px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50 shadow-lg border-2 border-transparent hover:border-[#FFCC00] flex items-center gap-2">
          <Phone size={13} />{isProcessing ? 'Processing...' : 'Reset Call Profile'}
        </button>
        {/* <button onClick={handleResetCSP} disabled={isProcessing}
          className="bg-white text-black px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 shadow-lg border-2 border-gray-200 hover:border-[#FFCC00] flex items-center gap-2">
          <Shield size={13} />{isProcessing ? 'Processing...' : 'Reset CSP'}
        </button> */}
        {/* <button onClick={onRefresh} disabled={isProcessing}
          className="bg-white text-black px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 shadow border border-gray-200 hover:border-gray-400 flex items-center gap-2">
          <RefreshCw size={13} />Refresh
        </button> */}
      </div>

      {/* 1. Identity & Authentication */}
      <Section title="Identity & Authentication" icon={<Phone size={15} className="text-blue-600" />} accent="bg-blue-50">
        <Card code="MSISDN" description="Mobile Number"
          value={<span className="text-[12px] font-black text-[#FFCC00] font-mono bg-black px-2 py-0.5 rounded">{profile.msisdn}</span>}
          meaning="Subscriber's assigned phone number used for call and SMS routing across the network." />
        <Card code="IMSI" description="SIM Card Identity"
          value={<Raw v={profile.imsi} mono />}
          meaning="Unique 15-digit identifier stored on the SIM used internally for authentication, location updates and routing." />
        <Card code="MSISDN STATE" description="Subscriber Attachment"
          value={<StateBadge value={profile.msisdnState} />}
          meaning={profile.msisdnState === 'CONNECTED' ? 'Attached to VLR/MSC and fully reachable for voice calls and SMS.' : 'Subscriber may be detached, purged, or currently unreachable.'} />
        <Card code="CSP" description="Customer Service Profile"
          value={<Raw v={profile.csp} mono />}
          meaning="Numeric profile that defines the set of supplementary services this subscriber class is permitted to activate and use." />
        <Card code="OICK" description="Outgoing Call Key"
          value={<Raw v={profile.oick} mono />}
          meaning="The outgoing call key (OICK) is a 4-digit code used to control outgoing call permissions for this subscriber." />
        <Card code="TICK" description="Terminating Incoming Call Key"
          value={<Raw v={profile.tick} mono />}
          meaning="TICK is a routing key / template identifier used to manage incoming call treatment. It does for incoming calls what OICK does for outgoing calls." />  
        {ss && (
          <Card code="STYPE" description="Subscriber Type"
            value={<span className={`text-[11px] font-black ${ss.stype === 1 ? 'text-orange-600' : ss.stype === 2 ? 'text-blue-600' : 'text-gray-600'}`}>{ss.stype === 1 ? 'PREPAID' : ss.stype === 2 ? 'POSTPAID' : `TYPE ${ss.stype}`}</span>}
            meaning={ss.stype === 1 ? 'Prepaid subscriber — balance deducted in real-time per usage event via the Online Charging System.' : ss.stype === 2 ? 'Postpaid subscriber — usage accumulated and billed on a monthly invoice.' : 'Subscriber billing and service type.'} />
        )}
      </Section>

      {/* 2. Call Barring */}
      <Section title="Call Barring Services" icon={<PhoneOff size={15} className="text-red-600" />} accent="bg-red-50" alertCount={blockingAlerts}>
        {([
          { code: 'BAIC',   label: 'Bar All Incoming',         svc: cb.baic,   meaning: 'Prevents all incoming voice calls from reaching the subscriber.' },
          { code: 'BAOC',   label: 'Bar All Outgoing',         svc: cb.baoc,   meaning: 'Prevents subscriber from making any outgoing voice calls.' },
          { code: 'BOIC',   label: 'Bar Outgoing International', svc: cb.boic,   meaning: 'Blocks all outgoing international calls.' },
          { code: 'BOIEXH', label: 'Bar Outgoing Intl ex-Home', svc: cb.boiexh, meaning: 'Blocks international calls including to the home country network.' },
          { code: 'BICRO',  label: 'Bar Incoming Roaming',      svc: cb.bicro,  meaning: 'Prevents incoming calls while subscriber is roaming abroad.' },
        ] as const).map(({ code, label, svc, meaning }) => {
          const active = svc.ts10?.activationState === 1 || svc.ts20?.activationState === 1 || svc.ts60?.activationState === 1 || svc.bs20?.activationState === 1 || svc.bs30?.activationState === 1;
          return (
            <Card key={code} code={code} description={label}
              value={<ActiveBadge active={active} alertWhenActive />}
              meaning={active ? `⚠ BARRING ACTIVE — ${meaning}` : `Provisioned (state=${svc.provisionState}) but not active. ${meaning}`}
              alert={active} />
          );
        })}
        <Card code="OBO" description="Outgoing Barring Override"
          value={<ActiveBadge active={profile.obo === 1} alertWhenActive />}
          meaning={profile.obo === 1 ? '⚠ BARRING ACTIVE — OBO (Outgoing Barring Override) is used to force override of the normal call‑barring behavior.' : 'OBO (Outgoing Barring Override) is used to force override of the normal call‑barring behavior.'}
          alert={profile.obo === 1} />
        <Card code="OBI" description="Outgoing Barring Indicator"
          value={<ActiveBadge active={profile.obi === 1} alertWhenActive />}
          meaning={profile.obi === 1 ? '⚠ BARRING ACTIVE — OBI (Outgoing Barring Indicator) is used to indicate the current outgoing call barring state.' : 'OBI (Outgoing Barring Indicator) is used to indicate the current outgoing call barring state.'}
          alert={profile.obi === 1} />
        <Card code="OBSSM" description="Outgoing Barring Supplementary Service Map"
          value={<ActiveBadge active={profile.obssm === 1} alertWhenActive />}
          meaning={profile.obssm === 1 ? '⚠ BARRING ACTIVE — OBSSM (Outgoing Barring Supplementary Service Map) is used to define the supplementary services that are barred.' : 'OBSSM (Outgoing Barring Supplementary Service Map) is used to define the supplementary services that are barred.'}
          alert={profile.obssm === 1} />
        <Card code="OBP" description="Outgoing Barring Password"
          value={<ActiveBadge active={profile.obp === 1} alertWhenActive />}
          meaning={profile.obp === 1 ? '⚠ BARRING ACTIVE — OBP (Outgoing Barring Password) is used to define the password for outgoing call barring.' : 'OBP (Outgoing Barring Password) is used to define the password for outgoing call barring.'}
          alert={profile.obp === 1} />
      </Section>

      {/* 3. Call Forwarding */}
      <Section title="Call Forwarding Services" icon={<PhoneForwarded size={15} className="text-purple-600" />} accent="bg-purple-50" alertCount={forwardingAlerts}>
        {([
          { code: 'CFU',   label: 'Unconditional Forward', svc: cf.cfu,   meaning: 'All incoming calls forwarded immediately regardless of subscriber state.' },
          { code: 'CFB',   label: 'Forward When Busy',      svc: cf.cfb,   meaning: 'Forwards incoming calls when the subscriber is on another call.' },
          { code: 'CFNRC', label: 'Forward Not Reachable',  svc: cf.cfnrc, meaning: 'Forwards calls when subscriber is detached, powered off, or out of coverage.' },
          { code: 'CFNRY', label: 'Forward No Reply',       svc: cf.cfnry, meaning: 'Forwards calls after a no-answer timeout period expires.' },
          { code: 'CAW',   label: 'Call Waiting',           svc: cf.caw,   meaning: 'Notifies subscriber of a second incoming call while on an active call.' },
        ] as const).map(({ code, label, svc, meaning }) => {
          const active  = svc.ts10?.activationState === 1;
          const alertOn = active && code !== 'CAW';
          return (
            <Card key={code} code={code} description={label}
              value={<ActiveBadge active={active} alertWhenActive={alertOn} />}
              meaning={alertOn ? `⚠ FORWARDING ACTIVE — ${meaning}` : `Provisioned (state=${svc.provisionState}). ${meaning}`}
              alert={alertOn} />
          );
        })}
        {cf.dcf && (
          <Card code="DCF" description="Direct Call Forwarding"
            value={<ActiveBadge active={cf.dcf.ts10?.activationState === 1} alertWhenActive={cf.dcf.ts10?.activationState === 1} />}
            meaning={cf.dcf.ts10?.activationState === 1 ? '⚠ DIRECT FORWARDING ACTIVE — Directly routes incoming calls to a predefined number without ringing the subscriber first.' : 'Directly routes incoming calls to a predefined number without ringing the subscriber first.'}
            alert={cf.dcf.ts10?.activationState === 1} />
        )}
      </Section>

      {/* 4. Network Location */}
      <Section title="Network Location" icon={<MapPin size={15} className="text-green-600" />} accent="bg-green-50">
        <Card code="VLR ADDR" description="Visitor Location Register"
          value={<Raw v={profile.locationData.vlrAddress} mono />}
          meaning="The MSC/VLR node currently serving the subscriber — handles mobility management, paging and call routing." />
        <Card code="MSC NUM" description="Mobile Switching Centre"
          value={<Raw v={profile.locationData.mscNumber} mono />}
          meaning="Circuit-switched switching node. Typically matches VLR address when subscriber is on the same core node." />
        <Card code="SGSN NUM" description="Serving GPRS Support Node"
          value={profile.locationData.sgsnNumber === 'UNKNOWN' 
            ? <span className="text-[11px] font-black text-gray-400 italic">UNKNOWN</span>
            : <Raw v={profile.locationData.sgsnNumber} mono />}
          meaning={profile.locationData.sgsnNumber === 'UNKNOWN' 
            ? 'No 2G/3G SGSN serving this subscriber — likely attached via LTE EPC only, or currently idle.'
            : 'SGSN node currently handling this subscriber\'s GPRS/3G data sessions.'} />
        <Card code="VLR DATA" description="Raw VLR Routing String"
          value={<Raw v={profile.vlrData} mono />}
          meaning="Raw VLR data string used internally for signalling routing between the HLR and serving MSC/VLR." />
      </Section>

      {/* 5. Teleservices */}
      <Section title="Teleservices & Bearer Services" icon={<Shield size={15} className="text-indigo-600" />} accent="bg-indigo-50">
        <Card code="TS11" description="Telephony (Basic Voice)"
          value={<YesNo v={profile.ts11} />}
          meaning="Allows subscriber to make and receive standard voice calls."
          alert={isNo(profile.ts11)}
        />
        <Card code="TS21" description="Short Message MT"
          value={<YesNo v={profile.ts21} />}
          meaning="Allows subscriber to receive SMS messages."
          alert={isNo(profile.ts21)}
        />
        <Card code="TS22" description="Short Message MO"
          value={<YesNo v={profile.ts22} />}
          meaning="Allows subscriber to send SMS messages."
          alert={isNo(profile.ts22)}
        />
        <Card code="TS62" description="Call Transfer"
          value={<YesNo v={profile.ts62} />}
          meaning="Subscriber can transfer an active call."
          alert={isNo(profile.ts62)}
        />
        {ss && (
          <>
            <Card code="BS26" description="2G Data Bearer"
              value={<YesNo v={ss.bs26} />}
              meaning="Enables GPRS/EDGE 2G data bearer services."
              alert={isNo(ss.bs26)}
            />
            <Card code="BS3G" description="3G Bearer Service"
              value={<YesNo v={ss.bs3g} />}
              meaning="Enables UMTS/HSPA 3G packet data access."
              alert={isNo(ss.bs3g)}
            />
          </>
        )}
      </Section>

      {/* 6. Caller ID */}
      {ci && (
        <Section title="Caller ID Services" icon={<Phone size={15} className="text-cyan-600" />} accent="bg-cyan-50" defaultOpen={false}>
          <Card code="CLIP" description="Calling Line ID Presentation"
            value={<span className={`text-[11px] font-black ${ci.clip === 1 ? 'text-green-600' : 'text-gray-400'}`}>{ci.clip === 1 ? 'SHOW CALLER ID' : 'RESTRICTED'}</span>}
            meaning={ci.clip === 1 ? 'Caller\'s number is presented to the called party when this subscriber calls.' : 'CLIP not active — caller ID presentation is restricted.'} />
          <Card code="CLIR" description="Calling Line ID Restriction"
            value={
              <span className={`text-[11px] font-black ${ci.clir === 1 ? 'text-amber-600' : ci.clir === 2 ? 'text-green-600' : 'text-gray-500'}`}>
                {ci.clir === 1 ? 'HIDDEN' : ci.clir === 2 ? 'ALLOWED' : `VALUE ${ci.clir}`}
              </span>
            }
            meaning={ci.clir === 1 ? 'Subscriber\'s own number is permanently withheld from called parties.' : ci.clir === 2 ? 'Number presentation is allowed — subscriber\'s number is visible to called parties.' : 'CLIR override mode configured at service class level.'} />
        </Section>
      )}

      {/* 7. Supplementary Services */}
      {ss && (
        <Section title="Supplementary & Value-Added Services" icon={<Zap size={15} className="text-amber-600" />} accent="bg-amber-50" defaultOpen={false}>
          <Card code="HOLD" description="Call Hold"
            value={<YesNo v={ss.hold} />}
            meaning="Subscriber can place an active call on hold and resume it, or attend to a second call." />
          <Card code="MPTY" description="Multi-Party Conference"
            value={<YesNo v={ss.mpty} />}
            meaning="Subscriber can establish multi-party conference calls with up to 5 participants." />
          <Card code="OFA" description="Outgoing Flexible Alerting"
            value={<YesNo v={ss.ofa} />}
            meaning="Allows incoming calls to simultaneously ring multiple registered devices or numbers." />
          <Card code="PRBT" description="Personalized Ring-Back Tone"
            value={<YesNo v={ss.prbt} />}
            meaning={ss.prbt === 1 ? 'Subscriber has an active PRBT — callers hear a custom audio tone instead of the standard ring.' : 'No personalized ring-back tone active.'} />
          <Card code="SCHAR" description="Service Charge Indicator"
            value={<Raw v={ss.schar} mono />}
            meaning="Internal tariff class and service charge routing indicator used by the IN billing platform to select the correct rate." />
          <Card code="CAT" description="Subscriber Category"
            value={<Raw v={ss.cat} mono />}
            meaning="Operator-defined category used for routing priority, service differentiation, and IN policy decisions." />
          <Card code="RSA" description="Radio Service Allowance"
            value={<Raw v={ss.rsa} mono />}
            meaning="Defines the radio technologies and roaming access classes permitted for this subscriber." />
          <Card code="AUTHD" description="Auth Vector Status"
            value={<StateBadge value={profile.authd} />}
            meaning={profile.authd === 'AVAILABLE' ? 'Authentication vectors present — SIM can complete challenge-response authentication normally on the network.' : 'Auth vectors may be exhausted or unavailable, causing attach and call failures.'} />
          <Card code="PWD" description="Supplementary Svc Password"
            value={<Raw v={profile.pwd} mono />}
            meaning="4-digit password used by subscriber to manage call barring and forwarding via USSD. Default is 0000." />
          <Card code="MDEUEE" description="Mobile Data Enable Flag"
            value={<Raw v={profile.mdeuee} mono />}
            meaning="Controls mobile data service enablement. Value 11 = fully enabled for all data services." />
          <Card code="SMSFILTER" description="SMS Spam Filter"
            value={<span className="text-[11px] font-black text-gray-500 uppercase">{profile.smsSpam?.active || 'N/A'}</span>}
            meaning={profile.smsSpam?.active === 'NACTIVE' ? 'SMS spam filtering is not active for this subscriber.' : 'SMS spam filter state as reported by HLR.'} />
        </Section>
      )}

      {/* 8. Service State */}
      {sv && (
        <Section title="Service State & System Access" icon={<Shield size={15} className="text-gray-600" />} accent="bg-gray-50" defaultOpen={false}>
          <Card code="OCSIST" description="OCS Access"
            value={<YesNo v={sv.ocsist} />}
            meaning="Online Charging System access allowed. Required for real-time balance deductions on calls and data." />
          <Card code="OSMCSIST" description="MSC Access"
            value={<YesNo v={sv.osmcsist} />}
            meaning="MSC access permitted — subscriber can route calls through the Mobile Switching Centre." />
          <Card code="TCSIST" description="TCS Active"
            value={<YesNo v={sv.tcsist} />}
            meaning="Telephony Control System active — no suspension or network-level service restriction detected." />
          <Card code="SOCFU" description="Service Class CFU Override"
            value={<Raw v={sv.socfu} mono />}
            meaning="Service class-level override applied to Call Forwarding Unconditional behaviour." />
          <Card code="SOCLIR" description="Service Class CLIR Override"
            value={<Raw v={sv.soclir} mono />}
            meaning="Service class-level override for Calling Line Identity Restriction presentation mode." />
          <Card code="TSMO" description="Temp Service Mode Override"
            value={<Raw v={sv.tsmo} mono />}
            meaning="Temporary service mode flag. Non-zero indicates a transient service modification is active." />
        </Section>
      )}

      {/* 9. CAMEL */}
      {cam && (
        <Section title="CAMEL / Intelligent Network" icon={<Radio size={15} className="text-rose-600" />} accent="bg-rose-50" defaultOpen={false}>
          <Card code="EOINCI" description="MO Call IN Trigger"
            value={<Raw v={cam.eoinci} mono />}
            meaning="Whether the IN platform is triggered at the start of a mobile-originated call. 0 = not triggered, default OCS charging applies." />
          <Card code="EOICK" description="MO Call IN Routing Key"
            value={<Raw v={cam.eoick} mono />}
            meaning="Routing key used when the EOINCI trigger fires an event to the IN Service Control Point (SCP)." />
          <Card code="ETINCI" description="Call End IN Trigger"
            value={<Raw v={cam.etinci} mono />}
            meaning="Whether the IN platform is triggered at call termination for CDR generation or balance updates." />
          <Card code="GPRSSO" description="GPRS CAMEL Service Option"
            value={<Raw v={cam.gprsso} mono />}
            meaning="Indicates whether CAMEL is active for GPRS/data sessions. 0 = no IN control over data bearers." />
          <Card code="OSMSSO" description="Originating SMS Service Option"
            value={<Raw v={cam.osmsso} mono />}
            meaning="CAMEL service option for SMS originated by this subscriber. 0 = no real-time IN SMS charging." />
          <Card code="TSMSSO" description="Terminating SMS Service Option"
            value={<Raw v={cam.tsmsso} mono />}
            meaning="CAMEL service option for SMS terminated to this subscriber." />
          <Card code="TIF" description="Translation Info Flag"
            value={<Raw v={cam.tif} mono />}
            meaning="Signals special number translation or routing treatment required by the IN platform." />
          <Card code="GC4SO / MC4SO" description="GPRS & SMS CAMEL Phase 4"
            value={<span className="text-[11px] font-mono text-slate-700">{cam.gc4so} / {cam.mc4so}</span>}
            meaning="Phase 4 CAMEL service options for GPRS data and MO-SMS. All zero = no advanced CAMEL triggers active." />
        </Section>
      )}

    </div>
  );
}