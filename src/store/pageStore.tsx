import React, { createContext, useContext, useRef, useCallback } from 'react';
import type {
  VoiceProfile, BrowsingProfile, VoLTEProfile, Offer, Diagnostics,
  Balance, DedicatedAccount, CategorizedCDR, CDRSummary,
  BundleFulfilmentRow, FulfilmentTrace,
} from '../types';

// ─── Page State Shapes ────────────────────────────────────────────────────────

export interface ChargingProfilePageState {
  msisdn: string;
  normalizedMsisdn: string;
  isLoading: boolean;
  activeTab: 'voice' | 'browsing' | 'volte' | 'offers';
  voiceProfile: VoiceProfile | null;
  browsingProfile: BrowsingProfile | null;
  volteProfile: VoLTEProfile | null;
  offers: Offer[];
  diagnostics: Diagnostics[];
}

export interface BalancePageState {
  msisdn: string;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  activeTab: string;
  balance: Balance | null;
  dabalances: DedicatedAccount[];
  categorizedCDR: CategorizedCDR | null;
  summaries: Record<string, CDRSummary> | null;
}

export interface BundlePageState {
  msisdn: string;
  startDate: string;
  endDate: string;
  streamPhase: string;
  rows: Map<string, BundleFulfilmentRow>;
  traces: FulfilmentTrace[];
  cisCount: number | null;
  ccnCount: number | null;
  sdpCount: number | null;
  activeView: 'trace' | 'table';
}

interface PageStore {
  chargingProfile: ChargingProfilePageState;
  balance: BalancePageState;
  bundle: BundlePageState;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoLocal(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_STORE: PageStore = {
  chargingProfile: {
    msisdn: '', normalizedMsisdn: '', isLoading: false, activeTab: 'voice',
    voiceProfile: null, browsingProfile: null, volteProfile: null,
    offers: [], diagnostics: [],
  },
  balance: {
    msisdn: '', startDate: daysAgoLocal(3), endDate: todayLocal(),
    isLoading: false, activeTab: 'balance',
    balance: null, dabalances: [], categorizedCDR: null, summaries: null,
  },
  bundle: {
    msisdn: '', startDate: todayLocal(), endDate: todayLocal(),
    streamPhase: 'idle', rows: new Map(), traces: [],
    cisCount: null, ccnCount: null, sdpCount: null, activeView: 'trace',
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

type Listener = () => void;

interface PageStoreContextValue {
  getState: () => PageStore;
  setChargingProfile: (patch: Partial<ChargingProfilePageState>) => void;
  setBalance: (patch: Partial<BalancePageState>) => void;
  setBundle: (patch: Partial<BundlePageState>) => void;
  subscribe: (listener: Listener) => () => void;
}

const PageStoreContext = createContext<PageStoreContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PageStoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<PageStore>(structuredClone({
    ...DEFAULT_STORE,
    bundle: { ...DEFAULT_STORE.bundle, rows: new Map() },
  }));
  const listenersRef = useRef<Set<Listener>>(new Set());

  const notify = useCallback(() => {
    listenersRef.current.forEach(fn => fn());
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const getState = useCallback(() => storeRef.current, []);

  const setChargingProfile = useCallback((patch: Partial<ChargingProfilePageState>) => {
    storeRef.current = {
      ...storeRef.current,
      chargingProfile: { ...storeRef.current.chargingProfile, ...patch },
    };
    notify();
  }, [notify]);

  const setBalance = useCallback((patch: Partial<BalancePageState>) => {
    storeRef.current = {
      ...storeRef.current,
      balance: { ...storeRef.current.balance, ...patch },
    };
    notify();
  }, [notify]);

  const setBundle = useCallback((patch: Partial<BundlePageState>) => {
    storeRef.current = {
      ...storeRef.current,
      bundle: { ...storeRef.current.bundle, ...patch },
    };
    notify();
  }, [notify]);

  return (
    <PageStoreContext.Provider value={{ getState, setChargingProfile, setBalance, setBundle, subscribe }}>
      {children}
    </PageStoreContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function usePageStoreContext() {
  const ctx = useContext(PageStoreContext);
  if (!ctx) throw new Error('usePageStore must be used within PageStoreProvider');
  return ctx;
}

/** Subscribes to a slice of the store and re-renders when it changes */
function useStoreSlice<T>(selector: (s: PageStore) => T): T {
  const { getState, subscribe } = usePageStoreContext();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    return subscribe(forceUpdate);
  }, [subscribe]);

  return selector(getState());
}

export function useChargingProfileStore() {
  const state = useStoreSlice(s => s.chargingProfile);
  const { setChargingProfile } = usePageStoreContext();
  return [state, setChargingProfile] as const;
}

export function useBalanceStore() {
  const state = useStoreSlice(s => s.balance);
  const { setBalance } = usePageStoreContext();
  return [state, setBalance] as const;
}

export function useBundleStore() {
  const state = useStoreSlice(s => s.bundle);
  const { setBundle } = usePageStoreContext();
  return [state, setBundle] as const;
}

/** Returns loading states for all pages — used by sidebar to show activity badges */
export function usePageActivity() {
  return useStoreSlice(s => ({
    chargingProfileLoading: s.chargingProfile.isLoading,
    balanceLoading: s.balance.isLoading,
    bundleStreaming: s.bundle.streamPhase !== 'idle' && s.bundle.streamPhase !== 'complete' && s.bundle.streamPhase !== 'error',
    bundleHasData: s.bundle.rows.size > 0,
    chargingHasData: s.chargingProfile.voiceProfile !== null,
    balanceHasData: s.balance.balance !== null || s.balance.categorizedCDR !== null,
  }));
}