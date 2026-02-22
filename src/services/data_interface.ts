// Subscriber Profile Type Definitions

export interface ServiceStatus {
  provisionState: number;
  ts10?: { activationState: number; fnum?: string; noReplyTime?: number };
  ts20?: { activationState: number; fnum?: string; noReplyTime?: number };
  ts60?: { activationState: number; fnum?: string; noReplyTime?: number };
  bs20?: { activationState: number; fnum?: string; noReplyTime?: number };
  bs30?: { activationState: number; fnum?: string; noReplyTime?: number };
}

// CAMEL / Intelligent Network parameters (all IN triggers and service options)
export interface CamelProfile {
  eoinci: number;   // Event Occurrence IN Capability Indicator (MO call trigger)
  eoick: number;    // Event Occurrence IN Capability Key
  etinci: number;   // Event Termination IN Capability Indicator
  etick: number;    // Event Termination IN Capability Key
  gcso: number;     // GPRS CAMEL Service Option (phase 1)
  sslo: number;     // SS CAMEL Service Option
  mcso: number;     // MO SMS CAMEL Service Option
  gc2so: number;    // GPRS CAMEL phase 2 service option
  mc2so: number;    // MO SMS CAMEL phase 2
  tif: number;      // Translation Information Flag
  gc3so: number;    // GPRS CAMEL phase 3
  mc3so: number;    // MO SMS CAMEL phase 3
  gprsso: number;   // GPRS CAMEL service option
  osmsso: number;   // Originating SMS service option
  tsmsso: number;   // Terminating SMS service option
  mmso: number;     // Multimedia messaging service option
  gc4so: number;    // GPRS CAMEL phase 4
  mc4so: number;    // MO SMS CAMEL phase 4
}

// GPRS / HLR data profile
export interface GPRSProfile {
  pdpid: string;       // PDP Context ID (primary = 1)
  apnid: string;       // APN identifier (internal ID, e.g. 25 = web.gprs.mtnnigeria.net)
  pdpty: string;       // PDP Type: IPV4 | IPV6 | IPV4V6
  eqosid?: string;     // Enhanced QoS profile ID
  vpaa?: string;       // Visitor PLMN Address Allowed (0 = no, 1 = yes)
  epdpind?: number;    // Enhanced PDP indicator (1 = EPC/LTE capable)
  mc4so?: number | null; // MO SMS CAMEL phase 4 (GPRS context)
}

// Caller ID / CLIP / CLIR
export interface CallerIdProfile {
  clip: number;   // Calling Line Identity Presentation (1 = show caller ID)
  clir: number;   // Calling Line Identity Restriction (1 = hidden, 2 = allowed, 0 = default)
}

// Supplementary / value-added services
export interface SupplementaryServices {
  hold: number;   // Call Hold (1 = enabled)
  mpty: number;   // Multi-party / conference calls (1 = enabled)
  ofa: number;    // Outgoing Flexible Alerting (group ringing)
  prbt: number;   // Personalized Ring Back Tone (1 = active)
  dbsg: number;   // Data Bearer Service Group
  bs26: number;   // Data bearer service (2G)
  bs3g: number;   // 3G bearer services
  cat: number;    // Category (operator-defined subscriber category)
  rsa: number;    // Radio Service Allowance (roaming/tech class)
  stype: number;  // Subscriber type (1 = prepaid, 2 = postpaid)
  schar: string;  // Service charge class / tariff indicator
}

// Service state / system access indicators
export interface ServiceStateIndicators {
  ocsist: number;    // Online Charging System access (1 = allowed)
  osmcsist: number;  // MSC access permitted (1 = allowed)
  tcsist: number;    // Telephony Control System active (1 = allowed)
  socb: number;      // Service class barring status
  socfb: number;     // Service class CFB status
  socfrc: number;    // Service class CFNRC status
  socfry: number;    // Service class CFNRY status
  socfu: number;     // Service class CFU status
  soclip: number;    // Service class CLIP override
  soclir: number;    // Service class CLIR override
  tsmo: number;      // Temporary service mode override
}

export interface VoiceProfile {
  // ── Core identity ──────────────────────────────────────────────────────────
  msisdn: string;
  imsi: string;
  msisdnState: string;    // CONNECTED | DETACHED | BARRED
  authd: string;          // AVAILABLE | NOTAVAILABLE
  pwd: string;            // Supplementary service password (default: 0000)
  oick?: string;          // Outgoing Call Key
  csp: string;            // Customer Service Profile number

  // ── CAMEL / IN ─────────────────────────────────────────────────────────────
  camel?: CamelProfile;

  // ── Call blocking ──────────────────────────────────────────────────────────
  callBlocking: {
    baic: ServiceStatus;    // Bar All Incoming Calls
    baoc: ServiceStatus;    // Bar All Outgoing Calls
    boic: ServiceStatus;    // Bar Outgoing International Calls
    bicro: ServiceStatus;   // Bar Incoming Calls when Roaming
    boiexh: ServiceStatus;  // Bar Outgoing International Except Home
  };

  // ── Call forwarding ────────────────────────────────────────────────────────
  callForwarding: {
    cfu: ServiceStatus;    // Call Forwarding Unconditional
    cfb: ServiceStatus;    // Call Forwarding Busy
    cfnrc: ServiceStatus;  // Call Forwarding Not Reachable
    cfnry: ServiceStatus;  // Call Forwarding No Reply
    caw: ServiceStatus;    // Call Waiting
    dcf?: ServiceStatus;   // Direct Call Forwarding
  };

  // ── Location ───────────────────────────────────────────────────────────────
  locationData: {
    vlrAddress: string;   // MSC/VLR serving node
    mscNumber: string;    // Mobile Switching Centre number
    sgsnNumber: string;   // SGSN number (UNKNOWN when on LTE only)
    locState?: string | null; // Location state flag
  };
  vlrData?: string;       // Raw VLR data string

  // ── Caller ID ──────────────────────────────────────────────────────────────
  callerId?: CallerIdProfile;

  // ── Supplementary services ─────────────────────────────────────────────────
  supplementary?: SupplementaryServices;

  // ── Service state indicators ───────────────────────────────────────────────
  serviceState?: ServiceStateIndicators;

  // ── Teleservices / bearer services ────────────────────────────────────────
  ts11?: number;  // Telephony (basic voice call)
  ts21?: number;  // Short Message MT (incoming SMS)
  ts22?: number;  // Short Message MO (outgoing SMS)
  ts62?: number;  // Call Transfer

  // ── Misc / VAS ─────────────────────────────────────────────────────────────
  smsSpam?: { active: string };  // SMS spam filter state
  mdeuee?: string;               // Mobile data enable/usage flag (11 = enabled)
  nam?: { prov: number };        // Number Portability / NAM provisioning
  obo?: number;                 // Outgoing Barring Override
  obi?: number;                 // Outgoing Barring Indicator
  obssm?: number;               // Outgoing Barring Supplementary Service Map
  obp?: number;                 // Outgoing Barring Profile
  tick?: number;                // Terminating Incoming Call Key

  [key: string]: any; // Safety escape for any unlisted HLR fields
}

export interface BrowsingProfile {
  // ── HLR GPRS data config ───────────────────────────────────────────────────
  gprs: GPRSProfile;

  // ── HSS EPS subscription ───────────────────────────────────────────────────
  hss: {
    epsProfileId: string;                   // EPS subscription profile ID
    epsOdb: string;                         // Operator Determined Barring (NONE = no bar)
    epsRoamingAllowed: boolean;             // LTE roaming allowed
    epsRoamingRestriction: boolean;         // Roaming restriction indicator present
    epsIndividualDefaultContextId: string;  // Default LTE bearer/APN context ID
    epsIndividualContextIds: number[];      // All allowed EPS context IDs
    epsUserIpV4Address: string;             // Currently allocated IPv4 address
    mmeAddress: string;                     // Serving MME FQDN
    epsMmeRealm: string;                    // EPC domain realm of serving MME
    epsLocationState: string;               // LOCATED | NOT_LOCATED
    epsLastUpdateLocationDate?: string;     // Last LTE location update timestamp
    epsImeiSv?: string;                     // Device IMEI + software version
    epsDynamicPdnInformation?: string;      // APN + PGW routing string
    epsUeSrVccCap?: number;                 // SRVCC capability (1 = supported)
    epsSessionTransferNumber?: string | null; // STN-SR for VoLTE continuity
    epsExtendedAccessRestriction?: string | null; // Access class restrictions
  };
}

export interface VoLTEProfile {
  publicId: string;
  concurrencyControl: number;
  cdiv: {
    activated: boolean;
    userNoReplyTimer: string;
    conditions: {
      anonymousCondition: string;
      busyCondition: string;
      identityCondition: string;
      mediaCondition: string;
      notRegisteredCondition: string;
      noAnswerCondition: string;
      presenceStatusCondition: string;
      validityCondition: string;
      notReachableCondition: string;
      unconditionalCondition: string;
    };
  };
}

export interface Offer {
  offerID: number;
  offerType: number;
  startDate: string;
  expiryDate: string;
}

export interface Diagnostics {
  category: 'voice' | 'browsing' | 'offer';
  key: string;
  message: string;
}

export interface DiagnosticsData {
  voiceDiagnostics?: Record<string, string>;
  browsingDiagnostics?: Record<string, string>;
  offerDiagnostics?: Record<string, string>;
}

export interface DedicatedAccount {
  dedicatedAccountID: string;
  dedicatedAccountValue1: number;
  expiryDate: string;
  startDate?: string;
  dedicatedAccountActiveValue1?: number;
  dedicatedAccountUnitType?: number;
  description?: string;
}

export interface Balance {
  subscriberNumber: string;
  serviceClassCurrent: number;
  currency1: string;
  accountValue1: number;
  expiryDate: string;
}

// CDR Record Type Definitions

export interface DADetail {
  account_id: string;
  amount_before: number;
  amount_after: number;
  amount_charged: number;
}

export interface CDRRecord {
  record_type: string;
  number_called: string;
  event_dt: number; // YYYYMMDDHHMMSS
  call_duration_qty: string;
  charged_amount: string;
  balance_after_amt: string;
  balance_before_amt: string;
  discount_amt: string;
  da_amount: string;
  da_details: DADetail[];
  country: string;
  operator: string;
  bytes_received_qty: number;
  bytes_sent_qty: number;
}

export interface CDRSummary {
  totalTransactions: number;
  startingBalance: number;
  endingBalance: number;
  totalCharged: number;
  totalDuration?: number;
  totalData?: number;
  avgCallLength?: number;
  totalRecharges?: number;
  netChange?: number;
}

export interface CategorizedCDR {
  all: CDRRecord[];
  voice: CDRRecord[];
  data: CDRRecord[];
  sms: CDRRecord[];
  credit: CDRRecord[];
  daAdjustment: CDRRecord[];
  other: CDRRecord[];
}

export type CDRTabType = 'balance' | 'voice' | 'data' | 'sms' | 'credit' | 'daAdjustment' | 'other';

export interface CDRApiResponse {
  APIStatus: {
    msisdn: string;
    requestId: string;
    dateRange: string[];
    maxRecs: number;
    numRecs: number;
    statusCode: number;
    statusMsg: string;
  };
  APIData: CDRRecord[];
}