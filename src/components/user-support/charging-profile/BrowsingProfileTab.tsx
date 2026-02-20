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
  return <span className={`text-[11px] font-black text-slate-700 ${mono ? 'font-mono' : ''} ${breakAll ? 'break-all' : ''}`}>{String(v)}</span>;
}

// ─── Table row ────────────────────────────────────────────────────────────────
function TR({ code, description, value, meaning, alert = false }: {
  code: string; description: string; value: React.ReactNode; meaning: string; alert?: boolean;
}) {
  return (
    <tr className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${alert ? 'bg-amber-50/40' : ''}`}>
      <td className="px-5 py-3 w-[160px] align-top">
        <span className="font-black text-[10px] text-[#FFCC00] uppercase tracking-wider font-mono bg-black px-2 py-0.5 rounded whitespace-nowrap">{code}</span>
      </td>
      <td className="px-5 py-3 w-[230px] align-top">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{description}</span>
      </td>
      <td className="px-5 py-3 w-[220px] align-top">{value}</td>
      <td className="px-5 py-3 align-top">
        <span className={`text-[11px] leading-relaxed ${alert ? 'text-amber-700 font-bold' : 'text-gray-500'}`}>
          {alert && <AlertTriangle size={10} className="inline mr-1 text-amber-500" />}{meaning}
        </span>
      </td>
    </tr>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, icon, accent, children, defaultOpen = true, tag }: {
  title: string; icon: React.ReactNode; accent: string;
  children: React.ReactNode; defaultOpen?: boolean; tag?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${accent}`}>{icon}</div>
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-black italic">{title}</span>
          {tag && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">{tag}</span>}
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

// ─── APN name resolution ──────────────────────────────────────────────────────
const APN_NAMES: Record<string, string> = {
  '25': 'web.gprs.mtnnigeria.net',
  '1':  'Default / Legacy APN',
};

// PDP type descriptions
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
    <div className="space-y-5">

      {/* Action bar */}
      <div className="flex flex-wrap gap-3">
        <button onClick={notYetAvailable} disabled={isProcessing}
          className="bg-black text-[#FFCC00] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50 shadow-lg border-2 border-transparent hover:border-[#FFCC00] flex items-center gap-2">
          <Smartphone size={14} />{isProcessing ? 'Processing...' : 'Reset Browsing — Mobile'}
        </button>
        <button onClick={notYetAvailable} disabled={isProcessing}
          className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 shadow-lg border-2 border-gray-200 hover:border-[#FFCC00] flex items-center gap-2">
          <Wifi size={14} />{isProcessing ? 'Processing...' : 'Reset Browsing — IoT'}
        </button>
        <button onClick={onRefresh} disabled={isProcessing}
          className="bg-white text-black px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 shadow border border-gray-200 hover:border-gray-400 flex items-center gap-2">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* 1. GPRS / HLR Data Config */}
      <Section title="GPRS Configuration (HLR)" icon={<Wifi size={16} className="text-green-600" />} accent="bg-green-50" tag="2G / 3G / LTE APN">
        <TR code="PDPID" description="PDP Context ID"
          value={<Raw v={g.pdpid} mono />}
          meaning="Primary Packet Data Protocol context identifier. Value 1 = the first/primary data context assigned to this subscriber." />
        <TR code="APNID" description="Access Point Name ID"
          value={
            <div className="flex flex-col gap-0.5">
              <Raw v={g.apnid} mono />
              <span className="text-[10px] text-gray-400 font-mono">{apnName}</span>
            </div>
          }
          meaning={`Internal APN profile identifier. Maps to "${apnName}" — the data gateway through which this subscriber's internet traffic is routed.`} />
        <TR code="PDPTY" description="PDP Type / IP Version"
          value={<Raw v={g.pdpty} />}
          meaning={PDP_DESC[g.pdpty] || 'Packet data protocol type governing how IP addresses are allocated for data sessions.'} />
        <TR code="EQOSID" description="Enhanced QoS Profile ID"
          value={<Raw v={g.eqosid} mono />}
          meaning="Quality of Service profile identifier. Controls the data session speed priority, bandwidth allocation, and traffic shaping rules." />
        <TR code="EPDPIND" description="Enhanced PDP Indicator"
          value={<span className={`text-[11px] font-black ${g.epdpind === 1 ? 'text-green-600' : 'text-gray-400'}`}>{g.epdpind === 1 ? 'EPC / LTE CAPABLE' : g.epdpind != null ? `VALUE ${g.epdpind}` : 'N/A'}</span>}
          meaning={g.epdpind === 1 ? 'SIM supports Enhanced Packet Core (LTE EPC) data sessions in addition to legacy GPRS.' : 'Enhanced PDP indicator status for this subscriber.'} />
        <TR code="VPAA" description="Visitor PLMN Address Allowed"
          value={<span className={`text-[11px] font-black ${g.vpaa === '1' ? 'text-green-600' : 'text-amber-600'}`}>{g.vpaa === '1' ? 'ALLOWED' : 'NOT ALLOWED'}</span>}
          meaning={g.vpaa === '1'
            ? 'Subscriber can obtain an IP address from the visited PLMN when roaming — enables local data breakout.'
            : 'IP address must be obtained from the home network, even when roaming. All data routes via home PGW.'} />
      </Section>

      {/* 2. HSS EPS Subscription */}
      <Section title="EPS Subscription (HSS)" icon={<Server size={16} className="text-blue-600" />} accent="bg-blue-50" tag="4G LTE">
        <TR code="EPS PROFILE" description="EPS Subscription Profile ID"
          value={<Raw v={hss.epsProfileId} mono />}
          meaning="LTE subscription profile identifier defining the allowed APNs, QoS class, and Aggregate Maximum Bit Rate (AMBR) for this subscriber." />
        <TR code="DEFAULT CTX" description="Default LTE Bearer Context ID"
          value={<Raw v={hss.epsIndividualDefaultContextId} mono />}
          meaning="Default EPS bearer context attached automatically on LTE registration. Points to the primary APN and QoS profile." />
        <TR code="ALL CTX IDs" description="All Allowed EPS Context IDs"
          value={<span className="text-[11px] font-mono text-slate-700">{hss.epsIndividualContextIds?.join(', ') || 'N/A'}</span>}
          meaning="List of all EPS bearer contexts allowed for this subscriber. Only one context provisioned indicates a single allowed APN." />
        <TR code="EPS ODB" description="Operator Determined Barring"
          value={<StateBadge state={hss.epsOdb || 'NONE'} />}
          meaning={hss.epsOdb === 'NONE' || !hss.epsOdb
            ? 'No EPS-level barring applied. Subscriber can fully attach, authenticate, and use LTE data.'
            : `EPS barring active: ${hss.epsOdb} — subscriber\'s LTE access or data may be restricted.`}
          alert={!!hss.epsOdb && hss.epsOdb !== 'NONE'} />
        <TR code="EPS ROAM" description="LTE Roaming Allowed"
          value={<YesNoBadge active={hss.epsRoamingAllowed} trueLabel="ALLOWED" falseLabel="BLOCKED" />}
          meaning={hss.epsRoamingAllowed
            ? 'Subscriber is permitted to attach to foreign LTE networks and use data while roaming.'
            : 'LTE roaming blocked — subscriber cannot attach to visited network LTE nodes.'} />
        <TR code="ROAM RESTR" description="Roaming Restriction Indicator"
          value={<span className={`text-[11px] font-black ${hss.epsRoamingRestriction ? 'text-amber-600' : 'text-gray-400'}`}>{hss.epsRoamingRestriction ? 'RESTRICTION PRESENT' : 'NONE'}</span>}
          meaning="Indicates whether roaming restriction configuration is present in the HSS profile. Actual enforcement depends on operator policy." />
      </Section>

      {/* 3. LTE Attachment & Location */}
      <Section title="LTE Attachment & Location" icon={<Globe size={16} className="text-purple-600" />} accent="bg-purple-50" tag="MME / EPC">
        <TR code="EPS STATE" description="LTE Location State"
          value={<StateBadge state={hss.epsLocationState} />}
          meaning={hss.epsLocationState === 'LOCATED'
            ? 'Subscriber is successfully registered on the LTE core network — MME has attached and location is known to HSS.'
            : 'Subscriber is not currently registered on the LTE network.'} />
        <TR code="MME ADDR" description="Serving MME Node (FQDN)"
          value={<Raw v={hss.mmeAddress} mono breakAll />}
          meaning="Fully qualified domain name of the Mobility Management Entity currently handling this subscriber's LTE session, bearer management, and handovers." />
        <TR code="MME REALM" description="EPC Domain Realm"
          value={<Raw v={hss.epsMmeRealm} mono breakAll />}
          meaning="EPC domain realm of the serving MME. Used for diameter signalling routing between HSS and MME." />
        <TR code="LAST UPDATE" description="Last Location Update"
          value={<Raw v={hss.epsLastUpdateLocationDate ? formatTelecomDate(hss.epsLastUpdateLocationDate) : null} />}
          meaning="Timestamp of the last LTE location update received from the MME and stored in the HSS. Indicates last known active session." />
        <TR code="USER IPV4" description="Allocated IPv4 Address"
          value={<Raw v={hss.epsUserIpV4Address || null} mono />}
          meaning="The IPv4 address currently allocated to the subscriber's active LTE data session by the Packet Gateway (PGW/UPF)." />
        <TR code="IMEI-SV" description="Device IMEI + Software Version"
          value={<Raw v={hss.epsImeiSv} mono />}
          meaning="Unique device hardware identifier (IMEI) including the current software version (SV). Used for device policy enforcement, VoLTE eligibility, and equipment blacklist checks." />
        <TR code="SRVCC CAP" description="SRVCC Capability"
          value={<span className={`text-[11px] font-black ${hss.epsUeSrVccCap === 1 ? 'text-green-600' : 'text-gray-400'}`}>{hss.epsUeSrVccCap === 1 ? 'SUPPORTED' : hss.epsUeSrVccCap != null ? `VALUE ${hss.epsUeSrVccCap}` : 'N/A'}</span>}
          meaning={hss.epsUeSrVccCap === 1
            ? 'Single Radio Voice Call Continuity is supported — enables seamless LTE VoLTE to 2G/3G CS voice handover.'
            : 'SRVCC not reported. VoLTE calls may drop when moving from LTE to 2G/3G coverage areas.'} />
        <TR code="STN-SR" description="Session Transfer Number (SRVCC)"
          value={<Raw v={hss.epsSessionTransferNumber} mono />}
          meaning="Session Transfer Number for SRVCC — the number dialled internally during a VoLTE to CS handover. Null means the default operator routing applies." />
        <TR code="EXT ACCESS" description="Extended Access Restriction"
          value={<span className={`text-[11px] font-black ${hss.epsExtendedAccessRestriction ? 'text-amber-600' : 'text-gray-400'}`}>{hss.epsExtendedAccessRestriction || 'NONE'}</span>}
          meaning="Access class restrictions for emergency, barred devices, or restricted subscriber groups. Null = no restrictions applied." />
      </Section>

      {/* 4. APN / PDN Routing */}
      {(pdn.apn || pdn.pgw || pdn.realm) && (
        <Section title="APN / PDN Routing Information" icon={<Globe size={16} className="text-teal-600" />} accent="bg-teal-50" tag="Active Session" defaultOpen={false}>
          <TR code="APN NAME" description="Active Access Point Name"
            value={<Raw v={pdn.apn} mono />}
            meaning="The APN currently active for this subscriber's LTE data session. Traffic is routed through this gateway." />
          <TR code="PGW / UPF" description="Packet Gateway Node"
            value={<Raw v={pdn.pgw} mono breakAll />}
            meaning="The Packet Gateway (PGW in 4G / UPF in 5G) node anchoring this subscriber's data bearer and handling IP address allocation." />
          <TR code="EPC REALM" description="EPC Routing Domain"
            value={<Raw v={pdn.realm} mono breakAll />}
            meaning="The EPC domain used for routing PDN connectivity requests and diameter signalling for this active session." />
        </Section>
      )}

    </div>
  );
}