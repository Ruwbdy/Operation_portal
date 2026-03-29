// Browsing Profile Type Definitions

export interface GPRSProfile {
  pdpid: string;
  apnid: string;
  pdpty: string;
  eqosid?: string;
  vpaa?: string;
  epdpind?: number;
  mc4so?: number | null;
}

export interface BrowsingProfile {
  gprs: GPRSProfile;
  hss: {
    epsProfileId: string;
    epsOdb: string;
    epsRoamingAllowed: boolean;
    epsRoamingRestriction: boolean;
    epsIndividualDefaultContextId: string;
    epsIndividualContextIds: number[];
    epsUserIpV4Address: string;
    mmeAddress: string;
    epsMmeRealm: string;
    epsLocationState: string;
    epsLastUpdateLocationDate?: string;
    epsImeiSv?: string;
    epsDynamicPdnInformation?: string;
    epsUeSrVccCap?: number;
    epsSessionTransferNumber?: string | null;
    epsExtendedAccessRestriction?: string | null;
  };
}