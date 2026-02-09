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
    dcf?: ServiceStatus;
  };
  callWaiting: ServiceStatus;
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