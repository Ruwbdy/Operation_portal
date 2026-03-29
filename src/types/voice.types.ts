// Voice Profile Type Definitions

export interface ServiceStatus {
  provisionState: number;
  ts10?: { activationState: number; fnum?: string; noReplyTime?: number };
  ts20?: { activationState: number; fnum?: string; noReplyTime?: number };
  ts60?: { activationState: number; fnum?: string; noReplyTime?: number };
  bs20?: { activationState: number; fnum?: string; noReplyTime?: number };
  bs30?: { activationState: number; fnum?: string; noReplyTime?: number };
}

export interface CamelProfile {
  eoinci: number;
  eoick: number;
  etinci: number;
  etick: number;
  gcso: number;
  sslo: number;
  mcso: number;
  gc2so: number;
  mc2so: number;
  tif: number;
  gc3so: number;
  mc3so: number;
  gprsso: number;
  osmsso: number;
  tsmsso: number;
  mmso: number;
  gc4so: number;
  mc4so: number;
}

export interface CallerIdProfile {
  clip: number;
  clir: number;
}

export interface SupplementaryServices {
  hold: number;
  mpty: number;
  ofa: number;
  prbt: number;
  dbsg: number;
  bs26: number;
  bs3g: number;
  cat: number;
  rsa: number;
  stype: number;
  schar: string;
}

export interface ServiceStateIndicators {
  ocsist: number;
  osmcsist: number;
  tcsist: number;
  socb: number;
  socfb: number;
  socfrc: number;
  socfry: number;
  socfu: number;
  soclip: number;
  soclir: number;
  tsmo: number;
}

export interface VoiceProfile {
  msisdn: string;
  imsi: string;
  msisdnState: string;
  authd: string;
  pwd: string;
  oick?: string;
  csp: string;
  firstIVRCallFlag?: number;
  serviceClassCurrent?: number;
  languageIDCurrent?: number;
  ussdEndOfCallNotificationID?: number;
  accountGroupID?: number;
  camel?: CamelProfile;
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
    locState?: string | null;
  };
  vlrData?: string;
  callerId?: CallerIdProfile;
  supplementary?: SupplementaryServices;
  serviceState?: ServiceStateIndicators;
  ts11?: number;
  ts21?: number;
  ts22?: number;
  ts62?: number;
  smsSpam?: { active: string };
  mdeuee?: string;
  nam?: { prov: number };
  obo?: number;
  obi?: number;
  obssm?: number;
  obp?: number;
  tick?: number;
  [key: string]: any;
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