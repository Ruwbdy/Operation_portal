// Data Transformers for API Responses
// Converts backend API response structures to frontend TypeScript interfaces

import type { VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Balance, DedicatedAccount, CDRRecord } from './data_interface';

/**
 * Transform HLR profile from API response to VoiceProfile interface
 */
export function transformHLRToVoiceProfile(hlrData: any): VoiceProfile | null {
  if (!hlrData?.moAttributes?.getResponseSubscription) {
    return null;
  }

  const data = hlrData.moAttributes.getResponseSubscription;

  return {
    msisdn: data.msisdn || '',
    imsi: data.imsi || '',
    msisdnState: data.msisdnstate || 'UNKNOWN',
    authd: data.authd || 'UNKNOWN',
    oick: data.oick?.toString() || '',
    csp: data.csp?.toString() || '',
    callBlocking: {
      baic: data.baic || { provisionState: 0, ts10: { activationState: 0 }, ts20: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      baoc: data.baoc || { provisionState: 0, ts10: { activationState: 0 }, ts20: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      boic: data.boic || { provisionState: 0, ts10: { activationState: 0 }, ts20: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      bicro: data.bicro || { provisionState: 0, ts10: { activationState: 0 }, ts20: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      boiexh: data.boiexh || { provisionState: 0, ts10: { activationState: 0 }, ts20: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } }
    },
    callForwarding: {
      cfu: data.cfu || { provisionState: 0, ts10: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      cfb: data.cfb || { provisionState: 0, ts10: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      cfnrc: data.cfnrc || { provisionState: 0, ts10: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      cfnry: data.cfnry || { provisionState: 0, ts10: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      caw: data.caw || { provisionState: 0, ts10: { activationState: 0 }, ts60: { activationState: 0 }, bs20: { activationState: 0 }, bs30: { activationState: 0 } },
      dcf: data.dcf || {
        provisionState: 0,
        ts10: { activationState: 0, fnum: '', noReplyTime: 15 },
        ts60: { activationState: 0, fnum: '', noReplyTime: 15 },
        bs20: { activationState: 0, fnum: '', noReplyTime: 15 },
        bs30: { activationState: 0, fnum: '', noReplyTime: 15 }
      }
    },
    locationData: {
      vlrAddress: data.locationData?.vlrAddress || 'UNKNOWN',
      mscNumber: data.locationData?.mscNumber || 'UNKNOWN',
      sgsnNumber: data.locationData?.sgsnNumber || 'UNKNOWN'
    },
    vlrData: data.vlrData || undefined,
    smsSpam: data.smsSpam || undefined,
    mdeuee: data.mdeuee?.toString() || undefined,
    ts11: data.ts11 || 0,
    ts21: data.ts21 || 0,
    ts22: data.ts22 || 0,
    ts62: data.ts62 || 0
  };
}

/**
 * Transform HSS and HLR GPRS data to BrowsingProfile interface
 */
export function transformHSSToBrowsingProfile(hssData: any, hlrData: any): BrowsingProfile | null {
  const hss = hssData?.moAttributes?.getResponseEPSMultiSC;
  const hlr = hlrData?.moAttributes?.getResponseSubscription;

  if (!hss && !hlr?.gprs) {
    return null;
  }

  const gprsData = hlr?.gprs || {};

  return {
    gprs: {
      pdpid: gprsData.pdpid?.toString() || '0',
      apnid: gprsData.apnid?.toString() || '0',
      pdpty: gprsData.pdpty || 'IPV4',
      eqosid: gprsData.eqosid?.toString() || undefined,
      vpaa: gprsData.vpaa?.toString() || '0'
    },
    hss: {
      epsProfileId: hss?.epsProfileId?.toString() || '0',
      epsRoamingAllowed: hss?.epsRoamingAllowed || false,
      epsIndividualDefaultContextId: hss?.epsIndividualDefaultContextId?.toString() || '0',
      epsUserIpV4Address: hss?.epsUserIpV4Address || '',
      mmeAddress: hss?.mmeAddress || '',
      epsLocationState: hss?.epsLocationState || 'UNKNOWN',
      epsImeiSv: hss?.epsImeiSv || undefined
    }
  };
}

/**
 * Transform VoLTE profile from complex nested structure to simplified interface
 */
export function transformVoLTEProfile(volteData: any, msisdn: string): VoLTEProfile | null {
  if (!volteData?.moAttributes?.getResponseSubscription) {
    return null;
  }

  const data = volteData.moAttributes.getResponseSubscription;
  const services = data.services || {};
  const cdivService = services.communicationDiversion?.userConfiguration;
  const cdivRules = cdivService?.ruleSet?.rules || [];

  // Extract condition states from rules
  const getConditionState = (ruleId: string): string => {
    const rule = cdivRules.find((r: any) => r.id === ruleId);
    return rule?.conditions?.ruleDeactivated === false ? 'activated' : 'deactivated';
  };

  return {
    publicId: data.publicId || `sip:+${msisdn}@ims.mnc030.mcc621.3gppnetwork.org`,
    concurrencyControl: data.concurrencyControl || 0,
    cdiv: {
      activated: cdivService?.active || false,
      userNoReplyTimer: 'activated', // Default value
      conditions: {
        anonymousCondition: 'activated',
        busyCondition: getConditionState('cfb'),
        identityCondition: 'activated',
        mediaCondition: 'activated',
        notRegisteredCondition: getConditionState('cfnl'),
        noAnswerCondition: getConditionState('cfnr'),
        presenceStatusCondition: 'activated',
        validityCondition: 'activated',
        notReachableCondition: getConditionState('cfnrc'),
        unconditionalCondition: getConditionState('cfu2')
      }
    }
  };
}

/**
 * Transform offers from account details
 */
export function transformAccountDetailToOffers(accountData: any): Offer[] {
  const offers = accountData?.moAttributes?.getAccountDetailResponse?.accountDetails?.offerInformation;
  
  if (!Array.isArray(offers)) {
    return [];
  }

  return offers.map((offer: any) => ({
    offerID: parseInt(offer.offerID) || 0,
    offerType: offer.offerType || 0,
    startDate: offer.startDate || '',
    expiryDate: offer.expiryDate || ''
  }));
}

/**
 * Transform balances from account details
 */
export function transformAccountDetailToMABalance(accountData: any): Balance | null {
  const accDetails = accountData?.moAttributes?.getAccountDetailResponse;
  
  if (!accDetails) {
    return null;
  }

  const balanceData = accDetails.balanceAndDate || accDetails.accountDetails?.balanceAndDate;

  return {
    subscriberNumber: accDetails.subscriberNumber || '',
    serviceClassCurrent: balanceData?.serviceClassCurrent || 0,
    currency1: balanceData?.currency1 || 'NGN',
    accountValue1: balanceData?.accountValue1 || 0,
    expiryDate: balanceData?.expiryDate || ''
  };
}

/**
 * Transform dedicated accounts from account details
 */
export function transformAccountDetailToDABalances(accountData: any): DedicatedAccount[] {
  const dedicatedAcc = accountData?.moAttributes?.getAccountDetailResponse?.balanceAndDate?.dedicatedAccountInformation;
  
  if (!Array.isArray(dedicatedAcc)) {
    return [];
  }

  return dedicatedAcc.map((da: any) => ({
      dedicatedAccountID: da.dedicatedAccountID?.toString() || '0',
      dedicatedAccountValue1: da.dedicatedAccountValue1 || 0,
      expiryDate: da.expiryDate || '',
      startDate: da.startDate || undefined,
      dedicatedAccountActiveValue1: da.dedicatedAccountActiveValue1 || undefined,
      dedicatedAccountUnitType: da.dedicatedAccountUnitType || undefined,
      description: undefined // Will be populated by DA mapping service
  }));
}

/**
 * Transform raw CDR API response to CDRRecord array
 */
export function transformCDRToCDRRecords(cdrData: any): CDRRecord[] {
  if (!Array.isArray(cdrData)) {
    return [];
  }

  return cdrData.map((record: any) => ({
    record_type: record.record_type || '',
    number_called: record.number_called || '',
    event_dt: record.event_dt || 0,
    call_duration_qty: record.call_duration_qty || '0',
    charged_amount: record.charged_amount || '0',
    balance_after_amt: record.balance_after_amt || '0',
    balance_before_amt: record.balance_before_amt || '0',
    discount_amt: record.discount_amt || '0',
    da_amount: record.da_amount || '0',
    da_details: Array.isArray(record.da_details) ? record.da_details.map((da: any) => ({
      account_id: da.account_id || '',
      amount_before: da.amount_before || 0,
      amount_after: da.amount_after || 0,
      amount_charged: da.amount_charged || 0
    })) : [],
    country: record.country || '',
    operator: record.operator || '',
    bytes_received_qty: record.bytes_received_qty || 0,
    bytes_sent_qty: record.bytes_sent_qty || 0
  }));
}

/**
 * Extract diagnostics information
 */
export function extractDiagnostics(diagnosticsData: any): any[] {
  if (!diagnosticsData) {
    return [];
  }

  const diagnostics: any[] = [];

  // Add voice diagnostics
  if (diagnosticsData.voiceDiagnostics) {
    Object.entries(diagnosticsData.voiceDiagnostics).forEach(([key, value]) => {
      if (value) {
        diagnostics.push({
          category: 'voice',
          key,
          message: value
        });
      }
    });
  }

  // Add browsing diagnostics
  if (diagnosticsData.browsingDiagnostics) {
    Object.entries(diagnosticsData.browsingDiagnostics).forEach(([key, value]) => {
      if (value) {
        diagnostics.push({
          category: 'browsing',
          key,
          message: value
        });
      }
    });
  }

  // Add offer diagnostics
  if (diagnosticsData.offerDiagnostics) {
    Object.entries(diagnosticsData.offerDiagnostics).forEach(([key, value]) => {
      if (value) {
        diagnostics.push({
          category: 'offer',
          key,
          message: value
        });
      }
    });
  }

  return diagnostics;
}