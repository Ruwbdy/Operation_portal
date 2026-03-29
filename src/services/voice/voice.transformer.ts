// Voice & VoLTE Data Transformers
import type {
  VoiceProfile,
  VoLTEProfile,
  CamelProfile,
  CallerIdProfile,
  SupplementaryServices,
  ServiceStateIndicators,
} from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: any): string | undefined {
  return v == null ? undefined : String(v);
}

function strOr(v: any, fallback: string): string {
  return v == null ? fallback : String(v);
}

function num(v: any, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

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

export function transformHLRToVoiceProfile(
  hlrData: any,
  accountData?: any
): VoiceProfile | null {
  if (!hlrData?.moAttributes?.getResponseSubscription) return null;

  const d = hlrData.moAttributes.getResponseSubscription;
  const accDetail =
    accountData?.moAttributes?.getAccountDetailResponse?.accountDetails;

  const camel: CamelProfile | undefined = d.camel
    ? {
        eoinci: num(d.camel.eoinci),
        eoick: num(d.camel.eoick),
        etinci: num(d.camel.etinci),
        etick: num(d.camel.etick),
        gcso: num(d.camel.gcso),
        sslo: num(d.camel.sslo),
        mcso: num(d.camel.mcso),
        gc2so: num(d.camel.gc2so),
        mc2so: num(d.camel.mc2so),
        tif: num(d.camel.tif),
        gc3so: num(d.camel.gc3so),
        mc3so: num(d.camel.mc3so),
        gprsso: num(d.camel.gprsso),
        osmsso: num(d.camel.osmsso),
        tsmsso: num(d.camel.tsmsso),
        mmso: num(d.camel.mmso),
        gc4so: num(d.camel.gc4so),
        mc4so: num(d.camel.mc4so),
      }
    : undefined;

  const callerId: CallerIdProfile | undefined =
    d.clip != null || d.clir != null
      ? { clip: num(d.clip), clir: num(d.clir) }
      : undefined;

  const supplementary: SupplementaryServices | undefined =
    d.hold != null || d.mpty != null
      ? {
          hold: num(d.hold),
          mpty: num(d.mpty),
          ofa: num(d.ofa),
          prbt: num(d.prbt),
          dbsg: num(d.dbsg),
          bs26: num(d.bs26),
          bs3g: num(d.bs3g),
          cat: num(d.cat),
          rsa: num(d.rsa),
          stype: num(d.stype),
          schar: strOr(d.schar, ''),
        }
      : undefined;

  const serviceState: ServiceStateIndicators | undefined =
    d.ocsist != null || d.osmcsist != null
      ? {
          ocsist: num(d.ocsist),
          osmcsist: num(d.osmcsist),
          tcsist: num(d.tcsist),
          socb: num(d.socb),
          socfb: num(d.socfb),
          socfrc: num(d.socfrc),
          socfry: num(d.socfry),
          socfu: num(d.socfu),
          soclip: num(d.soclip),
          soclir: num(d.soclir),
          tsmo: num(d.tsmo),
        }
      : undefined;

  return {
    msisdn: strOr(d.msisdn, ''),
    imsi: strOr(d.imsi, ''),
    msisdnState: strOr(d.msisdnstate, 'UNKNOWN'),
    authd: strOr(d.authd, 'UNKNOWN'),
    pwd: strOr(d.pwd, ''),
    oick: str(d.oick),
    csp: strOr(d.csp, ''),
    firstIVRCallFlag:
      accDetail?.firstIVRCallFlag != null
        ? num(accDetail.firstIVRCallFlag)
        : undefined,
    serviceClassCurrent:
      accDetail?.serviceClassCurrent != null
        ? num(accDetail.serviceClassCurrent)
        : undefined,
    languageIDCurrent:
      accDetail?.languageIDCurrent != null
        ? num(accDetail.languageIDCurrent)
        : undefined,
    ussdEndOfCallNotificationID:
      accDetail?.ussdEndOfCallNotificationID != null
        ? num(accDetail.ussdEndOfCallNotificationID)
        : undefined,
    accountGroupID:
      accDetail?.accountGroupID != null
        ? num(accDetail.accountGroupID)
        : undefined,
    camel,
    callBlocking: {
      baic: d.baic || defaultServiceStatus(),
      baoc: d.baoc || defaultServiceStatus(),
      boic: d.boic || defaultServiceStatus(),
      bicro: d.bicro || defaultServiceStatus(),
      boiexh: d.boiexh || defaultServiceStatus(),
    },
    callForwarding: {
      cfu: d.cfu || defaultServiceStatus(),
      cfb: d.cfb || defaultServiceStatus(),
      cfnrc: d.cfnrc || defaultServiceStatus(),
      cfnry: d.cfnry || defaultServiceStatus(),
      caw: d.caw || defaultServiceStatus(),
      dcf: d.dcf || defaultServiceStatus(),
    },
    locationData: {
      vlrAddress: strOr(d.locationData?.vlrAddress, 'UNKNOWN'),
      mscNumber: strOr(d.locationData?.mscNumber, 'UNKNOWN'),
      sgsnNumber: strOr(d.locationData?.sgsnNumber, 'UNKNOWN'),
      locState: d.locationData?.locState ?? null,
    },
    vlrData: str(d.vlrData),
    callerId,
    supplementary,
    serviceState,
    ts11: num(d.ts11),
    ts21: num(d.ts21),
    ts22: num(d.ts22),
    ts62: num(d.ts62),
    smsSpam: d.smsSpam || undefined,
    mdeuee: str(d.mdeuee),
    nam: d.nam || undefined,
    obo: num(d.obo),
    obi: num(d.obi),
    obssm: num(d.obssm),
    obp: num(d.obp),
    tick: num(d.tick),
  };
}

// ─── HSS + HLR GPRS → BrowsingProfile ────────────────────────────────────────
// Re-exported from browsing transformer for backwards compat — lives in balance/
// (kept here as a thin re-export so voice.api.ts can import from one place)

// ─── VoLTE → VoLTEProfile ────────────────────────────────────────────────────

export function transformVoLTEProfile(
  volteData: any,
  msisdn: string
): VoLTEProfile | null {
  if (!volteData?.moAttributes?.getResponseSubscription) return null;

  const data = volteData.moAttributes.getResponseSubscription;
  const services = data.services || {};
  const cdivService = services.communicationDiversion?.userConfiguration;
  const cdivRules: any[] = cdivService?.ruleSet?.rules || [];

  const getConditionState = (ruleId: string): string => {
    const rule = cdivRules.find((r: any) => r.id === ruleId);
    return rule?.conditions?.ruleDeactivated === false ? 'activated' : 'deactivated';
  };

  return {
    publicId:
      data.publicId ||
      `sip:+${msisdn}@ims.mnc030.mcc621.3gppnetwork.org`,
    concurrencyControl: num(data.concurrencyControl),
    cdiv: {
      activated: cdivService?.active || false,
      userNoReplyTimer: 'activated',
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
        unconditionalCondition: getConditionState('cfu2'),
      },
    },
  };
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

  if (diagnosticsData.volteDiagnostics) push('volte', diagnosticsData.volteDiagnostics);
  if (diagnosticsData.voiceDiagnostics) push('voice', diagnosticsData.voiceDiagnostics);
  if (diagnosticsData.browsingDiagnostics) push('browsing', diagnosticsData.browsingDiagnostics);
  if (diagnosticsData.offerDiagnostics) push('offer', diagnosticsData.offerDiagnostics);

  const volteActive = diagnostics.some(
    (d) =>
      d.category === 'volte' &&
      typeof d.message === 'string' &&
      d.message.toLowerCase().includes('activated')
  );

  if (volteActive) {
    const cspEntry = diagnostics.find(
      (d) => d.category === 'voice' && d.key === 'csp'
    );
    if (cspEntry) cspEntry.message = 'Customer on Volte CSP';
  }

  return diagnostics;
}