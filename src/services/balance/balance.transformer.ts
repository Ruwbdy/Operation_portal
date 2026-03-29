// Balance, DA, CDR & Browsing Data Transformers
import type {
  BrowsingProfile,
  GPRSProfile,
  Balance,
  DedicatedAccount,
  CDRRecord,
  Offer,
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

// ─── HSS + HLR GPRS → BrowsingProfile ────────────────────────────────────────

export function transformHSSToBrowsingProfile(
  hssData: any,
  hlrData: any
): BrowsingProfile | null {
  const hss = hssData?.moAttributes?.getResponseEPSMultiSC;
  const hlr = hlrData?.moAttributes?.getResponseSubscription;

  if (!hss && !hlr?.gprs) return null;

  const g = hlr?.gprs || {};

  const gprs: GPRSProfile = {
    pdpid: strOr(g.pdpid, '0'),
    apnid: strOr(g.apnid, '0'),
    pdpty: strOr(g.pdpty, 'IPV4'),
    eqosid: str(g.eqosid),
    vpaa: strOr(g.vpaa, '0'),
    epdpind: g.epdpind != null ? num(g.epdpind) : undefined,
    mc4so: g.mc4so != null ? num(g.mc4so) : undefined,
  };

  return {
    gprs,
    hss: {
      epsProfileId: strOr(hss?.epsProfileId, '0'),
      epsOdb: strOr(hss?.epsOdb, 'NONE'),
      epsRoamingAllowed: hss?.epsRoamingAllowed === true,
      epsRoamingRestriction: hss?.epsRoamingRestriction === true,
      epsIndividualDefaultContextId: strOr(hss?.epsIndividualDefaultContextId, '0'),
      epsIndividualContextIds: Array.isArray(hss?.epsIndividualContextId)
        ? hss.epsIndividualContextId
        : hss?.epsIndividualContextId != null
        ? [num(hss.epsIndividualContextId)]
        : [],
      epsUserIpV4Address: strOr(hss?.epsUserIpV4Address, ''),
      mmeAddress: strOr(hss?.mmeAddress, ''),
      epsMmeRealm: strOr(hss?.epsMmeRealm, ''),
      epsLocationState: strOr(hss?.epsLocationState, 'UNKNOWN'),
      epsLastUpdateLocationDate: str(hss?.epsLastUpdateLocationDate),
      epsImeiSv: str(hss?.epsImeiSv),
      epsDynamicPdnInformation: str(hss?.epsDynamicPdnInformation),
      epsUeSrVccCap:
        hss?.epsUeSrVccCap != null ? num(hss.epsUeSrVccCap) : undefined,
      epsSessionTransferNumber: hss?.epsSessionTransferNumber ?? null,
      epsExtendedAccessRestriction: hss?.epsExtendedAccessRestriction ?? null,
    },
  };
}

// ─── Account → Offers ─────────────────────────────────────────────────────────

export function transformAccountDetailToOffers(accountData: any): Offer[] {
  const offers =
    accountData?.moAttributes?.getAccountDetailResponse?.accountDetails
      ?.offerInformation;
  if (!Array.isArray(offers)) return [];
  return offers.map((offer: any) => ({
    offerID: parseInt(offer.offerID) || 0,
    offerType: num(offer.offerType),
    startDate: offer.startDate || '',
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
    subscriberNumber: strOr(accDetails.subscriberNumber, ''),
    serviceClassCurrent: num(balanceData?.serviceClassCurrent),
    currency1: strOr(balanceData?.currency1, 'NGN'),
    accountValue1: num(balanceData?.accountValue1),
    expiryDate: strOr(balanceData?.expiryDate, ''),
  };
}

// ─── Account → Dedicated Account Balances ────────────────────────────────────

export function transformAccountDetailToDABalances(
  accountData: any
): DedicatedAccount[] {
  const dedicatedAcc =
    accountData?.moAttributes?.getAccountDetailResponse?.balanceAndDate
      ?.dedicatedAccountInformation;
  if (!Array.isArray(dedicatedAcc)) return [];
  return dedicatedAcc.map((da: any) => ({
    dedicatedAccountID: strOr(da.dedicatedAccountID, '0'),
    dedicatedAccountValue1: num(da.dedicatedAccountValue1),
    expiryDate: strOr(da.expiryDate, ''),
    startDate: str(da.startDate),
    dedicatedAccountActiveValue1:
      da.dedicatedAccountActiveValue1 != null
        ? num(da.dedicatedAccountActiveValue1)
        : undefined,
    dedicatedAccountUnitType:
      da.dedicatedAccountUnitType != null
        ? num(da.dedicatedAccountUnitType)
        : undefined,
    description: undefined,
  }));
}

// ─── CDR records ──────────────────────────────────────────────────────────────

export function transformCDRToCDRRecords(cdrData: any): CDRRecord[] {
  if (!Array.isArray(cdrData)) return [];
  return cdrData.map((record: any) => ({
    record_type: strOr(record.record_type, ''),
    number_called: strOr(record.number_called, ''),
    event_dt: num(record.event_dt),
    call_duration_qty: strOr(record.call_duration_qty, '0'),
    charged_amount: strOr(record.charged_amount, '0'),
    balance_after_amt: strOr(record.balance_after_amt, '0'),
    balance_before_amt: strOr(record.balance_before_amt, '0'),
    discount_amt: strOr(record.discount_amt, '0'),
    da_amount: strOr(record.da_amount, '0'),
    da_details: Array.isArray(record.da_details)
      ? record.da_details.map((da: any) => ({
          account_id: strOr(da.account_id, ''),
          amount_before: num(da.amount_before),
          amount_after: num(da.amount_after),
          amount_charged: num(da.amount_charged),
        }))
      : [],
    country: strOr(record.country, ''),
    operator: strOr(record.operator, ''),
    bytes_received_qty: num(record.bytes_received_qty),
    bytes_sent_qty: num(record.bytes_sent_qty),
  }));
}