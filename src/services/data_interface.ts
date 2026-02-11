// Subscriber Profile Type Definitions

export interface ServiceStatus {
  provisionState: number;
  ts10?: { activationState: number; fnum?: string; noReplyTime?: number };
  ts20?: { activationState: number; fnum?: string; noReplyTime?: number };
  ts60?: { activationState: number; fnum?: string; noReplyTime?: number };
  bs20?: { activationState: number; fnum?: string; noReplyTime?: number };
  bs30?: { activationState: number; fnum?: string; noReplyTime?: number };
}

export interface VoiceProfile {
  msisdn: string;
  imsi: string;
  msisdnState: string;
  authd: string;
  oick?: string;
  csp: string;
  callBlocking: {
    baic: ServiceStatus;
    baoc: ServiceStatus;
    boic: ServiceStatus;
    bicro: ServiceStatus;
    boiexh: ServiceStatus;
  };
  callForwarding: {
    cfu: ServiceStatus;
    cfb: ServiceStatus;
    cfnrc: ServiceStatus;
    cfnry: ServiceStatus;
    caw: ServiceStatus;
    dcf?: ServiceStatus;
  };
  locationData: {
    vlrAddress: string;
    mscNumber: string;
    sgsnNumber: string;
  };
  vlrData?: string;
  smsSpam?: { active: string };
  // Additional HLR fields
  mdeuee?: string;
  ts11?: number;
  ts21?: number;
  ts22?: number;
  ts62?: number;
  [key: string]: any; // For additional fields from HLR
}

export interface BrowsingProfile {
  gprs: {
    pdpid: string;
    apnid: string;
    pdpty: string;
    eqosid?: string;
    vpaa?: string;
  };
  hss: {
    epsProfileId: string;
    epsRoamingAllowed: boolean;
    epsIndividualDefaultContextId: string;
    epsUserIpV4Address: string;
    mmeAddress: string;
    epsLocationState: string;
    epsImeiSv?: string;
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

export interface Diagnostics{
  diagnostics: any;
}

export interface DedicatedAccount {
  dedicatedAccountID: string;
  dedicatedAccountValue1: number;
  expiryDate: string;
  startDate?: string;
  dedicatedAccountActiveValue1?: number;
  dedicatedAccountUnitType?: number;
}

export interface Balances {
  subscriberNumber: string;
  serviceClassCurrent: number;
  currency1: string;
  accountValue1: number;
  expiryDate: string;
  dedicatedAccounts: DedicatedAccount[];
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