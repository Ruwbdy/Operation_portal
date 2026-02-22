// Data Transformers for API Responses
// Converts backend API response structures to frontend TypeScript interfaces

import type {
  VoiceProfile,
  BrowsingProfile,
  VoLTEProfile,
  Offer,
  Balance,
  DedicatedAccount,
  CDRRecord,
  CamelProfile,
  GPRSProfile,
  CallerIdProfile,
  SupplementaryServices,
  ServiceStateIndicators,
} from './data_interface';

// ─── Helper ───────────────────────────────────────────────────────────────────
/** Safely coerce a value to string, returning undefined if null/undefined */
function str(v: any): string | undefined {
  return v == null ? undefined : String(v);
}
/** Coerce to string with fallback */
function strOr(v: any, fallback: string): string {
  return v == null ? fallback : String(v);
}
/** Coerce to number with fallback */
function num(v: any, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}
/** Default ServiceStatus when a barring/forwarding service is absent from API */
function defaultServiceStatus() {
  return {
    provisionState: 0,
    ts10: { activationState: 0 },
    ts20: { activationState: 0 },
    ts60: { activationState: 0 },
    bs20: { activationState: 0 },
    bs30: { activationState: 0 },
  };
}

// ─── HLR → VoiceProfile ───────────────────────────────────────────────────────
/**
 * Transform HLR getResponseSubscription to VoiceProfile.
 * Maps every parameter documented in the HLR profile reference.
 */
export function transformHLRToVoiceProfile(hlrData: any): VoiceProfile | null {
  if (!hlrData?.moAttributes?.getResponseSubscription) {
    return null;
  }

  const d = hlrData.moAttributes.getResponseSubscription;

  // ── CAMEL / IN profile ──────────────────────────────────────────────────────
  const camel: CamelProfile | undefined = d.camel ? {
    eoinci:  num(d.camel.eoinci),   // MO call IN trigger indicator
    eoick:   num(d.camel.eoick),    // MO call IN routing key
    etinci:  num(d.camel.etinci),   // Call end IN trigger indicator
    etick:   num(d.camel.etick),    // Call end IN routing key
    gcso:    num(d.camel.gcso),     // GPRS CAMEL phase 1
    sslo:    num(d.camel.sslo),     // SS CAMEL service option
    mcso:    num(d.camel.mcso),     // MO SMS CAMEL phase 1
    gc2so:   num(d.camel.gc2so),    // GPRS CAMEL phase 2
    mc2so:   num(d.camel.mc2so),    // MO SMS CAMEL phase 2
    tif:     num(d.camel.tif),      // Translation information flag
    gc3so:   num(d.camel.gc3so),    // GPRS CAMEL phase 3
    mc3so:   num(d.camel.mc3so),    // MO SMS CAMEL phase 3
    gprsso:  num(d.camel.gprsso),   // GPRS service option
    osmsso:  num(d.camel.osmsso),   // Originating SMS service option
    tsmsso:  num(d.camel.tsmsso),   // Terminating SMS service option
    mmso:    num(d.camel.mmso),     // MMS service option
    gc4so:   num(d.camel.gc4so),    // GPRS CAMEL phase 4
    mc4so:   num(d.camel.mc4so),    // MO SMS CAMEL phase 4
  } : undefined;

  // ── Caller ID ───────────────────────────────────────────────────────────────
  const callerId: CallerIdProfile | undefined =
    (d.clip != null || d.clir != null) ? {
      clip: num(d.clip),   // 1 = show caller ID to called party
      clir: num(d.clir),   // 1 = hide own number, 2 = presentation allowed
    } : undefined;

  // ── Supplementary / value-added services ────────────────────────────────────
  const supplementary: SupplementaryServices | undefined =
    (d.hold != null || d.mpty != null) ? {
      hold:   num(d.hold),           // Call hold capability
      mpty:   num(d.mpty),           // Multi-party / conference calls
      ofa:    num(d.ofa),            // Outgoing flexible alerting (group ring)
      prbt:   num(d.prbt),           // Personalized ring-back tone active
      dbsg:   num(d.dbsg),           // Data bearer service group
      bs26:   num(d.bs26),           // 2G data bearer service
      bs3g:   num(d.bs3g),           // 3G bearer service
      cat:    num(d.cat),            // Subscriber category
      rsa:    num(d.rsa),            // Radio service allowance class
      stype:  num(d.stype),          // 1 = prepaid, 2 = postpaid
      schar:  strOr(d.schar, ''),    // Tariff/service charge indicator
    } : undefined;

  // ── Service state / system access indicators ────────────────────────────────
  const serviceState: ServiceStateIndicators | undefined =
    (d.ocsist != null || d.osmcsist != null) ? {
      ocsist:   num(d.ocsist),    // OCS access allowed
      osmcsist: num(d.osmcsist),  // MSC access permitted
      tcsist:   num(d.tcsist),    // TCS active
      socb:     num(d.socb),      // Service class barring
      socfb:    num(d.socfb),     // CFB service class override
      socfrc:   num(d.socfrc),    // CFNRC service class override
      socfry:   num(d.socfry),    // CFNRY service class override
      socfu:    num(d.socfu),     // CFU service class override
      soclip:   num(d.soclip),    // CLIP override
      soclir:   num(d.soclir),    // CLIR override
      tsmo:     num(d.tsmo),      // Temporary service mode override
    } : undefined;

  return {
    // ── Identity ──────────────────────────────────────────────────────────────
    msisdn:      strOr(d.msisdn, ''),
    imsi:        strOr(d.imsi, ''),
    msisdnState: strOr(d.msisdnstate, 'UNKNOWN'),
    authd:       strOr(d.authd, 'UNKNOWN'),
    pwd:         strOr(d.pwd, ''),
    oick:        str(d.oick),
    csp:         strOr(d.csp, ''),

    // ── CAMEL / IN ────────────────────────────────────────────────────────────
    camel,

    // ── Call blocking ─────────────────────────────────────────────────────────
    callBlocking: {
      baic:   d.baic   || defaultServiceStatus(),
      baoc:   d.baoc   || defaultServiceStatus(),
      boic:   d.boic   || defaultServiceStatus(),
      bicro:  d.bicro  || defaultServiceStatus(),
      boiexh: d.boiexh || defaultServiceStatus(),
    },

    // ── Call forwarding ───────────────────────────────────────────────────────
    callForwarding: {
      cfu:   d.cfu   || defaultServiceStatus(),
      cfb:   d.cfb   || defaultServiceStatus(),
      cfnrc: d.cfnrc || defaultServiceStatus(),
      cfnry: d.cfnry || defaultServiceStatus(),
      caw:   d.caw   || defaultServiceStatus(),
      dcf:   d.dcf   || defaultServiceStatus(),   // null from API = not provisioned
    },

    // ── Location ──────────────────────────────────────────────────────────────
    locationData: {
      vlrAddress:  strOr(d.locationData?.vlrAddress,  'UNKNOWN'),
      mscNumber:   strOr(d.locationData?.mscNumber,   'UNKNOWN'),
      sgsnNumber:  strOr(d.locationData?.sgsnNumber,  'UNKNOWN'),
      locState:    d.locationData?.locState ?? null,
    },
    vlrData: str(d.vlrData),

    // ── Caller ID ─────────────────────────────────────────────────────────────
    callerId,

    // ── Supplementary services ────────────────────────────────────────────────
    supplementary,

    // ── Service state ─────────────────────────────────────────────────────────
    serviceState,

    // ── Teleservices ──────────────────────────────────────────────────────────
    ts11: num(d.ts11),   // Telephony (basic voice)
    ts21: num(d.ts21),   // Incoming SMS
    ts22: num(d.ts22),   // Outgoing SMS
    ts62: num(d.ts62),   // Call transfer

    // ── VAS / misc ────────────────────────────────────────────────────────────
    smsSpam: d.smsSpam || undefined,
    mdeuee:  str(d.mdeuee),
    nam:     d.nam || undefined,
    // "obo":1,"obi":1,"tick":217,"obssm":1,"obp":1
    obo:     num(d.obo),      // Outgoing Barring Override
    obi:     num(d.obi),      // Outgoing Barring Indicator
    obssm:   num(d.obssm),    // Outgoing Barring Supplementary Service Map
    obp:     num(d.obp),      // Outgoing Barring Profile
    tick:    num(d.tick),     // Terminating Incoming Call Key
  };
}

// ─── HSS + HLR GPRS → BrowsingProfile ────────────────────────────────────────
/**
 * Transform HSS getResponseEPSMultiSC and HLR GPRS block to BrowsingProfile.
 * Maps every parameter from the HSS profile reference.
 */
export function transformHSSToBrowsingProfile(
  hssData: any,
  hlrData: any,
): BrowsingProfile | null {
  const hss = hssData?.moAttributes?.getResponseEPSMultiSC;
  const hlr = hlrData?.moAttributes?.getResponseSubscription;

  if (!hss && !hlr?.gprs) {
    return null;
  }

  const g = hlr?.gprs || {};

  // ── GPRS / HLR data block ──────────────────────────────────────────────────
  const gprs: GPRSProfile = {
    pdpid:    strOr(g.pdpid, '0'),      // Primary PDP context ID
    apnid:    strOr(g.apnid, '0'),      // APN identifier
    pdpty:    strOr(g.pdpty, 'IPV4'),   // PDP type: IPV4 | IPV6 | IPV4V6
    eqosid:   str(g.eqosid),            // Enhanced QoS profile ID
    vpaa:     strOr(g.vpaa, '0'),       // Visitor PLMN address allowed
    epdpind:  g.epdpind != null ? num(g.epdpind) : undefined,  // EPC/LTE capable SIM
    mc4so:    g.mc4so != null ? num(g.mc4so) : undefined,      // GPRS CAMEL phase 4
  };

  // ── HSS EPS subscription block ────────────────────────────────────────────
  return {
    gprs,
    hss: {
      epsProfileId:                  strOr(hss?.epsProfileId, '0'),
      epsOdb:                        strOr(hss?.epsOdb, 'NONE'),
      epsRoamingAllowed:             hss?.epsRoamingAllowed === true,
      epsRoamingRestriction:         hss?.epsRoamingRestriction === true,
      epsIndividualDefaultContextId: strOr(hss?.epsIndividualDefaultContextId, '0'),
      epsIndividualContextIds:       Array.isArray(hss?.epsIndividualContextId)
                                       ? hss.epsIndividualContextId
                                       : (hss?.epsIndividualContextId != null
                                           ? [num(hss.epsIndividualContextId)]
                                           : []),
      epsUserIpV4Address:            strOr(hss?.epsUserIpV4Address, ''),
      mmeAddress:                    strOr(hss?.mmeAddress, ''),
      epsMmeRealm:                   strOr(hss?.epsMmeRealm, ''),
      epsLocationState:              strOr(hss?.epsLocationState, 'UNKNOWN'),
      epsLastUpdateLocationDate:     str(hss?.epsLastUpdateLocationDate),
      epsImeiSv:                     str(hss?.epsImeiSv),
      epsDynamicPdnInformation:      str(hss?.epsDynamicPdnInformation),
      epsUeSrVccCap:                 hss?.epsUeSrVccCap != null
                                       ? num(hss.epsUeSrVccCap)
                                       : undefined,
      epsSessionTransferNumber:      hss?.epsSessionTransferNumber ?? null,
      epsExtendedAccessRestriction:  hss?.epsExtendedAccessRestriction ?? null,
    },
  };
}

// ─── VoLTE profile ────────────────────────────────────────────────────────────
export function transformVoLTEProfile(volteData: any, msisdn: string): VoLTEProfile | null {
  if (!volteData?.moAttributes?.getResponseSubscription) {
    return null;
  }

  const data = volteData.moAttributes.getResponseSubscription;
  const services = data.services || {};
  const cdivService = services.communicationDiversion?.userConfiguration;
  const cdivRules: any[] = cdivService?.ruleSet?.rules || [];

  const getConditionState = (ruleId: string): string => {
    const rule = cdivRules.find((r: any) => r.id === ruleId);
    return rule?.conditions?.ruleDeactivated === false ? 'activated' : 'deactivated';
  };

  return {
    publicId: data.publicId || `sip:+${msisdn}@ims.mnc030.mcc621.3gppnetwork.org`,
    concurrencyControl: num(data.concurrencyControl),
    cdiv: {
      activated: cdivService?.active || false,
      userNoReplyTimer: 'activated',
      conditions: {
        anonymousCondition:     'activated',
        busyCondition:          getConditionState('cfb'),
        identityCondition:      'activated',
        mediaCondition:         'activated',
        notRegisteredCondition: getConditionState('cfnl'),
        noAnswerCondition:      getConditionState('cfnr'),
        presenceStatusCondition:'activated',
        validityCondition:      'activated',
        notReachableCondition:  getConditionState('cfnrc'),
        unconditionalCondition: getConditionState('cfu2'),
      },
    },
  };
}

// ─── Account → Offers ─────────────────────────────────────────────────────────
export function transformAccountDetailToOffers(accountData: any): Offer[] {
  const offers =
    accountData?.moAttributes?.getAccountDetailResponse?.accountDetails?.offerInformation;

  if (!Array.isArray(offers)) return [];

  return offers.map((offer: any) => ({
    offerID:    parseInt(offer.offerID) || 0,
    offerType:  num(offer.offerType),
    startDate:  offer.startDate || '',
    expiryDate: offer.expiryDate || '',
  }));
}

// ─── Account → Main Account Balance ──────────────────────────────────────────
export function transformAccountDetailToMABalance(accountData: any): Balance | null {
  const accDetails = accountData?.moAttributes?.getAccountDetailResponse;
  if (!accDetails) return null;

  const balanceData =
    accDetails.balanceAndDate || accDetails.accountDetails?.balanceAndDate;

  return {
    subscriberNumber:    strOr(accDetails.subscriberNumber, ''),
    serviceClassCurrent: num(balanceData?.serviceClassCurrent),
    currency1:           strOr(balanceData?.currency1, 'NGN'),
    accountValue1:       num(balanceData?.accountValue1),
    expiryDate:          strOr(balanceData?.expiryDate, ''),
  };
}

// ─── Account → Dedicated Account Balances ────────────────────────────────────
export function transformAccountDetailToDABalances(accountData: any): DedicatedAccount[] {
  const dedicatedAcc =
    accountData?.moAttributes?.getAccountDetailResponse?.balanceAndDate
      ?.dedicatedAccountInformation;

  if (!Array.isArray(dedicatedAcc)) return [];

  return dedicatedAcc.map((da: any) => ({
    dedicatedAccountID:          strOr(da.dedicatedAccountID, '0'),
    dedicatedAccountValue1:      num(da.dedicatedAccountValue1),
    expiryDate:                  strOr(da.expiryDate, ''),
    startDate:                   str(da.startDate),
    dedicatedAccountActiveValue1:da.dedicatedAccountActiveValue1 != null
                                   ? num(da.dedicatedAccountActiveValue1)
                                   : undefined,
    dedicatedAccountUnitType:    da.dedicatedAccountUnitType != null
                                   ? num(da.dedicatedAccountUnitType)
                                   : undefined,
    description: undefined, // Populated by DA mapping service
  }));
}

// ─── CDR records ──────────────────────────────────────────────────────────────
export function transformCDRToCDRRecords(cdrData: any): CDRRecord[] {
  if (!Array.isArray(cdrData)) return [];

  return cdrData.map((record: any) => ({
    record_type:         strOr(record.record_type, ''),
    number_called:       strOr(record.number_called, ''),
    event_dt:            num(record.event_dt),
    call_duration_qty:   strOr(record.call_duration_qty, '0'),
    charged_amount:      strOr(record.charged_amount, '0'),
    balance_after_amt:   strOr(record.balance_after_amt, '0'),
    balance_before_amt:  strOr(record.balance_before_amt, '0'),
    discount_amt:        strOr(record.discount_amt, '0'),
    da_amount:           strOr(record.da_amount, '0'),
    da_details: Array.isArray(record.da_details)
      ? record.da_details.map((da: any) => ({
          account_id:     strOr(da.account_id, ''),
          amount_before:  num(da.amount_before),
          amount_after:   num(da.amount_after),
          amount_charged: num(da.amount_charged),
        }))
      : [],
    country:           strOr(record.country, ''),
    operator:          strOr(record.operator, ''),
    bytes_received_qty: num(record.bytes_received_qty),
    bytes_sent_qty:     num(record.bytes_sent_qty),
  }));
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────
export function extractDiagnostics(diagnosticsData: any): any[] {
  if (!diagnosticsData) return [];

  const diagnostics: any[] = [];

  const push = (category: string, entries: Record<string, any>) => {
    Object.entries(entries).forEach(([key, value]) => {
      if (value) diagnostics.push({ category, key, message: value });
    });
  };

  if (diagnosticsData.voiceDiagnostics)   push('voice',   diagnosticsData.voiceDiagnostics);
  if (diagnosticsData.browsingDiagnostics) push('browsing', diagnosticsData.browsingDiagnostics);
  if (diagnosticsData.offerDiagnostics)   push('offer',   diagnosticsData.offerDiagnostics);

  return diagnostics;
}