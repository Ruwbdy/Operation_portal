// Mock Data for Development and Testing
import type { VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Balances } from '../types/subscriber';
import type { CDRRecord, CategorizedCDR } from '../types/cdr';
import type { ResolvedIssue } from '../types';

export const MOCK_VOICE_PROFILE: VoiceProfile = {
  msisdn: '2349162485361',
  imsi: '621300634206887',
  msisdnState: 'CONNECTED',
  authd: 'AVAILABLE',
  oick: '830',
  csp: '2',
  callBlocking: {
    baic: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts20: { activationState: 0 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    },
    baoc: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts20: { activationState: 0 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    },
    boic: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts20: { activationState: 0 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    },
    bicro: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts20: { activationState: 0 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    },
    boiexh: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts20: { activationState: 1 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    }
  },
  callForwarding: {
    cfu: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    },
    cfb: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    },
    cfnrc: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    },
    cfnry: {
      provisionState: 1,
      ts10: { activationState: 0 },
      ts60: { activationState: 0 },
      bs20: { activationState: 0 },
      bs30: { activationState: 0 }
    },
    caw: {
      provisionState: 1,
      ts10: { activationState: 1 },
      ts60: { activationState: 1 },
      bs20: { activationState: 1 },
      bs30: { activationState: 1 }
    },
    dcf: {
      provisionState: 1,
      ts10: { activationState: 1, fnum: '234612', noReplyTime: 15 },
      ts60: { activationState: 1, fnum: '234612', noReplyTime: 15 },
      bs20: { activationState: 1, fnum: '234612', noReplyTime: 15 },
      bs30: { activationState: 1, fnum: '234612', noReplyTime: 15 }
    }
  },
  locationData: {
    vlrAddress: '4-2348030093800',
    mscNumber: '4-2348030093800',
    sgsnNumber: 'UNKNOWN'
  },
  vlrData: '4-2348030093800',
  smsSpam: { active: 'NACTIVE' },
  mdeuee: '48',
  ts11: 1,
  ts21: 1,
  ts22: 1,
  ts62: 1
};

export const MOCK_BROWSING_PROFILE: BrowsingProfile = {
  gprs: {
    pdpid: '1',
    apnid: '25',
    pdpty: 'IPV4',
    eqosid: '401',
    vpaa: '0'
  },
  hss: {
    epsProfileId: '25',
    epsRoamingAllowed: true,
    epsIndividualDefaultContextId: '499',
    epsUserIpV4Address: '10.84.233.165',
    mmeAddress: 'AScMME01.epc.mnc030.mcc621.3gppnetwork.org',
    epsLocationState: 'LOCATED',
    epsImeiSv: '8609450686763055'
  }
};

export const MOCK_VOLTE_PROFILE: VoLTEProfile = {
  publicId: 'sip:+2349131278852@ims.mnc030.mcc621.3gppnetwork.org',
  concurrencyControl: 0,
  cdiv: {
    activated: true,
    userNoReplyTimer: 'activated',
    conditions: {
      anonymousCondition: 'activated',
      busyCondition: 'activated',
      identityCondition: 'activated',
      mediaCondition: 'activated',
      notRegisteredCondition: 'activated',
      noAnswerCondition: 'activated',
      presenceStatusCondition: 'activated',
      validityCondition: 'activated',
      notReachableCondition: 'activated',
      unconditionalCondition: 'activated'
    }
  }
};

export const MOCK_OFFERS: Offer[] = [
  {
    offerID: 217,
    offerType: 0,
    startDate: '2022-04-03T12:00:00+00:00',
    expiryDate: '9999-12-31T12:00:00+00:00'
  },
  {
    offerID: 666,
    offerType: 0,
    startDate: '2026-01-19T12:00:00+00:00',
    expiryDate: '9999-12-31T12:00:00+00:00'
  },
  {
    offerID: 1250,
    offerType: 0,
    startDate: '2026-02-07T12:00:00+00:00',
    expiryDate: '2026-03-08T12:00:00+00:00'
  }
];

export const MOCK_BALANCES: Balances = {
  subscriberNumber: '2349162485361',
  serviceClassCurrent: 47,
  currency1: 'NGN',
  accountValue1: 28333,
  expiryDate: '2037-12-30T12:00:00+00:00',
  dedicatedAccounts: [
    {
      dedicatedAccountID: '12',
      dedicatedAccountValue1: 0,
      expiryDate: '9999-12-31T12:00:00+00:00',
      startDate: '0000-01-01T12:00:00+00:00',
      dedicatedAccountActiveValue1: 0,
      dedicatedAccountUnitType: 1
    },
    {
      dedicatedAccountID: '61',
      dedicatedAccountValue1: 0,
      expiryDate: '9999-12-31T12:00:00+00:00',
      startDate: '0000-01-01T12:00:00+00:00',
      dedicatedAccountActiveValue1: 0,
      dedicatedAccountUnitType: 1
    }
  ]
};

export const MOCK_CDR_RECORDS: CDRRecord[] = [
  {
    record_type: 'Voice',
    number_called: '2349130699099',
    event_dt: 20260205063434,
    call_duration_qty: '42',
    charged_amount: '8.190000',
    balance_after_amt: '856.735000',
    balance_before_amt: '864.925000',
    discount_amt: 'NA',
    da_amount: '',
    da_details: [],
    country: 'Nigeria',
    operator: 'MTN',
    bytes_received_qty: 0,
    bytes_sent_qty: 0
  },
  {
    record_type: 'SMS',
    number_called: '2347013',
    event_dt: 20260204214805,
    call_duration_qty: '1',
    charged_amount: '0.000000',
    balance_after_amt: '871.945000',
    balance_before_amt: '871.945000',
    discount_amt: 'NA',
    da_amount: '',
    da_details: [],
    country: '',
    operator: '',
    bytes_received_qty: 0,
    bytes_sent_qty: 0
  },
  {
    record_type: 'DATA',
    number_called: 'INTERNET',
    event_dt: 20260204180154,
    call_duration_qty: '0',
    charged_amount: '0.010500',
    balance_after_amt: '139.450000',
    balance_before_amt: '139.450000',
    discount_amt: 'NA',
    da_amount: '5046,1791.11,1791.10,0.01',
    da_details: [
      {
        account_id: '5046',
        amount_before: 1791.11,
        amount_after: 1791.1,
        amount_charged: 0.01
      }
    ],
    country: 'Nigeria',
    operator: 'MTN',
    bytes_received_qty: 28562,
    bytes_sent_qty: 0
  }
];

export const MOCK_DIAGNOSTICS: DIAGNOSTICS[] = []

export const MOCK_OPERATION_HISTORY: ResolvedIssue[] = [
  {
    id: '1',
    type: 'RESET_CALL_PROFILE',
    label: 'Reset Call Profile',
    identifier: '2347062026931',
    details: 'Network signaling modules reset for user.',
    status: 'Success',
    timestamp: '2024-05-24 08:31',
    engineer: 'Osazuwa',
    isJob: false
  },
  {
    id: '2',
    type: 'JOB_INIT_SIM_REG',
    label: 'Initiate Sim Reg',
    identifier: 'JOB_1234',
    details: 'Batch SIM registration completed for 150 subscribers.',
    status: 'Success',
    timestamp: '2024-05-23 14:22',
    engineer: 'Osazuwa',
    isJob: true,
    resultUrl: '#'
  }
];