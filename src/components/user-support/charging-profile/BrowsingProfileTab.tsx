import React, { useState } from 'react';
import { Globe, Wifi, Server, Smartphone, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { resetAPN } from '../../../services/api_services';
import { formatTelecomDate } from '../../../utils/dateFormatter';
import type { BrowsingProfile } from '../../../services/data_interface';

interface BrowsingProfileTabProps {
  profile: BrowsingProfile;
  msisdn: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function StateBadge({ state }: { state: string }) {
  const good = ['LOCATED', 'ALLOWED', 'NONE'].includes(state?.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${good ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${good ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />{state}
    </span>
  );
}

function YesNoBadge({ active, trueLabel = 'YES', falseLabel = 'NO' }: { active: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${active ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />{active ? trueLabel : falseLabel}
    </span>
  );
}

function Raw({ v, mono = false, breakAll = false }: { v: any; mono?: boolean; breakAll?: boolean }) {
  if (v == null || v === '') return <span className="text-gray-300 italic text-[11px] font-normal">N/A</span>;
  return <span className={`text-[13px] font-black text-slate-700 ${mono ? 'font-mono' : ''} ${breakAll ? 'break-all' : ''}`}>{String(v)}</span>;
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
            <div className="absolute top-full right-3.5 border-[5px] border-transparent border-t-black" />
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
  tag?: string;
}

function Section({ title, icon, accent, children, defaultOpen = true, tag }: SectionProps) {
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
          {tag && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">{tag}</span>}
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
        <div className="p-3.5 grid grid-cols-2 gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── APN name resolution ──────────────────────────────────────────────────────
const APN_NAMES: Record<string, string> = {
  '25': 'web.gprs.mtnnigeria.net',
  '1':  'Default / Legacy APN',
};

const PDP_DESC: Record<string, string> = {
  IPV4:   'IPv4 only — standard 32-bit internet addressing.',
  IPV6:   'IPv6 only — 128-bit next-generation addressing.',
  IPV4V6: 'Dual-stack — IPv4 and IPv6 allocated simultaneously.',
};

// Parse epsDynamicPdnInformation: "apn$pgw-fqdn$realm$$$"
function parsePdnInfo(raw?: string): { apn: string; pgw: string; realm: string } {
  if (!raw) return { apn: '', pgw: '', realm: '' };
  const parts = raw.split('$');
  return { apn: parts[0] || '', pgw: parts[1] || '', realm: parts[2] || '' };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BrowsingProfileTab({ profile, msisdn, onSuccess, onError, onRefresh }: BrowsingProfileTabProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const notYetAvailable = async () => { onSuccess('Option not available'); };

  const g   = profile.gprs;
  const hss = profile.hss;
  const apnName = APN_NAMES[g.apnid] || `APN ID ${g.apnid}`;
  const pdn = parsePdnInfo(hss.epsDynamicPdnInformation);

  return (
    <div className="space-y-4">

      {/* Action bar */}
      <div className="flex flex-wrap gap-2.5">
        <button onClick={notYetAvailable} disabled={isProcessing}
          className="bg-black text-[#FFCC00] px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50 shadow-lg border-2 border-transparent hover:border-[#FFCC00] flex items-center gap-2">
          <Smartphone size={13} />{isProcessing ? 'Processing...' : 'Reset Browsing — Mobile'}
        </button>
        <button onClick={notYetAvailable} disabled={isProcessing}
          className="bg-white text-black px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 shadow-lg border-2 border-gray-200 hover:border-[#FFCC00] flex items-center gap-2">
          <Wifi size={13} />{isProcessing ? 'Processing...' : 'Reset Browsing — IoT'}
        </button>
        <button onClick={onRefresh} disabled={isProcessing}
          className="bg-white text-black px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 shadow border border-gray-200 hover:border-gray-400 flex items-center gap-2">
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* 1. GPRS / HLR Data Config */}
      <Section title="GPRS Configuration (HLR)" icon={<Wifi size={15} className="text-green-600" />} accent="bg-green-50" tag="2G / 3G / LTE APN">
        <Card code="PDPID" description="PDP Context ID"
          value={<Raw v={g.pdpid} mono />}
          meaning="Primary Packet Data Protocol context identifier. Value 1 = the first/primary data context assigned to this subscriber." />
        <Card code="APNID" description="Access Point Name ID"
          value={
            <div className="flex flex-col gap-0.5 items-end">
              <Raw v={g.apnid} mono />
              <span className="text-[9px] text-gray-400 font-mono">{apnName}</span>
            </div>
          }
          meaning={`Internal APN profile identifier. Maps to "${apnName}" — the data gateway through which this subscriber's internet traffic is routed.`} />
        <Card code="PDPTY" description="PDP Type / IP Version"
          value={<Raw v={g.pdpty} />}
          meaning={PDP_DESC[g.pdpty] || 'Packet data protocol type governing how IP addresses are allocated for data sessions.'} />
        <Card code="EQOSID" description="Enhanced QoS Profile ID"
          value={<Raw v={g.eqosid} mono />}
          meaning="Quality of Service profile identifier. Controls the data session speed, priority, bandwidth allocation and traffic shaping rules." />
        <Card code="EPDPIND" description="Enhanced PDP Indicator"
          value={<span className={`text-[11px] font-black ${g.epdpind === 1 ? 'text-green-600' : 'text-gray-400'}`}>{g.epdpind === 1 ? 'EPC / LTE CAPABLE' : g.epdpind != null ? `VALUE ${g.epdpind}` : 'N/A'}</span>}
          meaning={g.epdpind === 1 ? 'SIM supports Enhanced Packet Core (LTE EPC) data sessions in addition to legacy GPRS.' : 'Enhanced PDP indicator status for this subscriber.'} />
        <Card code="VPAA" description="Visitor PLMN Address Allowed"
          value={<span className={`text-[11px] font-black ${g.vpaa === '1' ? 'text-green-600' : 'text-amber-600'}`}>{g.vpaa === '1' ? 'ALLOWED' : 'NOT ALLOWED'}</span>}
          meaning={g.vpaa === '1'
            ? 'Subscriber can obtain an IP address from the visited PLMN when roaming — enables local data breakout.'
            : 'IP address must be obtained from the home network, even when roaming. All data routes via home PGW.'} />
      </Section>

      {/* 2. HSS EPS Subscription */}
      <Section title="EPS Subscription (HSS)" icon={<Server size={15} className="text-blue-600" />} accent="bg-blue-50" tag="4G LTE">
        <Card code="EPS PROFILE" description="EPS Subscription Profile ID"
          value={<Raw v={hss.epsProfileId} mono />}
          meaning="LTE subscription profile identifier defining the allowed APNs, QoS class and Aggregate Maximum Bit Rate (AMBR) for this subscriber." />
        <Card code="DEFAULT CTX" description="Default LTE Bearer Context ID"
          value={<Raw v={hss.epsIndividualDefaultContextId} mono />}
          meaning="Default EPS bearer context attached automatically on LTE registration. Points to the primary APN and QoS profile." />
        <Card code="ALL CTX IDs" description="All Allowed EPS Context IDs"
          value={<span className="text-[11px] font-mono text-slate-700">{hss.epsIndividualContextIds?.join(', ') || 'N/A'}</span>}
          meaning="List of all EPS bearer contexts allowed for this subscriber. Only one context provisioned indicates a single allowed APN." />
        <Card code="EPS ODB" description="Operator Determined Barring"
          value={<StateBadge state={hss.epsOdb || 'NONE'} />}
          meaning={hss.epsOdb === 'NONE' || !hss.epsOdb
            ? 'No EPS-level barring applied. Subscriber can fully attach, authenticate and use LTE data.'
            : `EPS barring active: ${hss.epsOdb} — subscriber's LTE access or data may be restricted.`}
          alert={!!hss.epsOdb && hss.epsOdb !== 'NONE'} />
        <Card code="EPS ROAM" description="LTE Roaming Allowed"
          value={<YesNoBadge active={hss.epsRoamingAllowed} trueLabel="ALLOWED" falseLabel="BLOCKED" />}
          meaning={hss.epsRoamingAllowed
            ? 'Subscriber is permitted to attach to foreign LTE networks and use data while roaming.'
            : 'LTE roaming blocked — subscriber cannot attach to visited network LTE nodes.'} />
        <Card code="ROAM RESTR" description="Roaming Restriction Indicator"
          value={<span className={`text-[11px] font-black ${hss.epsRoamingRestriction ? 'text-amber-600' : 'text-gray-400'}`}>{hss.epsRoamingRestriction ? 'RESTRICTION PRESENT' : 'NONE'}</span>}
          meaning="Indicates whether roaming restriction configuration is present in the HSS profile. Actual enforcement depends on operator policy." />
      </Section>

      {/* 3. LTE Attachment & Location */}
      <Section title="LTE Attachment & Location" icon={<Globe size={15} className="text-purple-600" />} accent="bg-purple-50" tag="MME / EPC">
        <Card code="EPS STATE" description="LTE Location State"
          value={<StateBadge state={hss.epsLocationState} />}
          meaning={hss.epsLocationState === 'LOCATED'
            ? 'Subscriber is successfully registered on the LTE core network — MME has attached and location is known to HSS.'
            : 'Subscriber is not currently registered on the LTE network.'} />
        <Card code="MME ADDR" description="Serving MME Node (FQDN)"
          value={<Raw v={hss.mmeAddress} mono breakAll />}
          meaning="Fully qualified domain name of the Mobility Management Entity currently handling this subscriber's LTE session, bearer management and handovers." />
        <Card code="MME REALM" description="EPC Domain Realm"
          value={<Raw v={hss.epsMmeRealm} mono breakAll />}
          meaning="EPC domain realm of the serving MME. Used for diameter signalling routing between HSS and MME." />
        <Card code="LAST UPDATE" description="Last Location Update"
          value={<Raw v={hss.epsLastUpdateLocationDate ? formatTelecomDate(hss.epsLastUpdateLocationDate) : null} />}
          meaning="Timestamp of the last LTE location update received from the MME and stored in the HSS. Indicates last known active session." />
        <Card code="USER IPV4" description="Allocated IPv4 Address"
          value={<Raw v={hss.epsUserIpV4Address || null} mono />}
          meaning="The IPv4 address currently allocated to the subscriber's active LTE data session by the Packet Gateway (PGW/UPF)." />
        <Card code="IMEI-SV" description="Device IMEI + Software Version"
          value={<Raw v={hss.epsImeiSv} mono />}
          meaning="Unique device hardware identifier (IMEI) including the current software version (SV). Used for device policy enforcement, VoLTE eligibility and equipment blacklist checks." />
        <Card code="SRVCC CAP" description="SRVCC Capability"
          value={<span className={`text-[11px] font-black ${hss.epsUeSrVccCap === 1 ? 'text-green-600' : 'text-gray-400'}`}>{hss.epsUeSrVccCap === 1 ? 'SUPPORTED' : hss.epsUeSrVccCap != null ? `VALUE ${hss.epsUeSrVccCap}` : 'N/A'}</span>}
          meaning={hss.epsUeSrVccCap === 1
            ? 'Single Radio Voice Call Continuity is supported — enables seamless LTE VoLTE to 2G/3G CS voice handover.'
            : 'SRVCC not reported. VoLTE calls may drop when moving from LTE to 2G/3G coverage areas.'} />
        <Card code="STN-SR" description="Session Transfer Number (SRVCC)"
          value={<Raw v={hss.epsSessionTransferNumber} mono />}
          meaning="Session Transfer Number for SRVCC — the number dialled internally during a VoLTE to CS handover. Null means the default operator routing applies." />
        <Card code="EXT ACCESS" description="Extended Access Restriction"
          value={<span className={`text-[11px] font-black ${hss.epsExtendedAccessRestriction ? 'text-amber-600' : 'text-gray-400'}`}>{hss.epsExtendedAccessRestriction || 'NONE'}</span>}
          meaning="Access class restrictions for emergency, barred devices or restricted subscriber groups. Null = no restrictions applied." />
      </Section>

      {/* 4. APN / PDN Routing */}
      {(pdn.apn || pdn.pgw || pdn.realm) && (
        <Section title="APN / PDN Routing Information" icon={<Globe size={15} className="text-teal-600" />} accent="bg-teal-50" tag="Active Session" defaultOpen={false}>
          <Card code="APN NAME" description="Active Access Point Name"
            value={<Raw v={pdn.apn} mono />}
            meaning="The APN currently active for this subscriber's LTE data session. Traffic is routed through this gateway." />
          <Card code="PGW / UPF" description="Packet Gateway Node"
            value={<Raw v={pdn.pgw} mono breakAll />}
            meaning="The Packet Gateway (PGW in 4G / UPF in 5G) node anchoring this subscriber's data bearer and handling IP address allocation." />
          <Card code="EPC REALM" description="EPC Routing Domain"
            value={<Raw v={pdn.realm} mono breakAll />}
            meaning="The EPC domain used for routing PDN connectivity requests and diameter signalling for this active session." />
        </Section>
      )}

    </div>
  );
}