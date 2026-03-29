// Offer & Diagnostics Type Definitions

export interface Offer {
  offerID: number;
  offerType: number;
  startDate: string;
  expiryDate: string;
}

export interface Diagnostics {
  category: 'voice' | 'browsing' | 'offer' | 'volte';
  key: string;
  message: string;
}

export interface DiagnosticsData {
  voiceDiagnostics?: Record<string, string>;
  browsingDiagnostics?: Record<string, string>;
  offerDiagnostics?: Record<string, string>;
  volteDiagnostics?: Record<string, string>;
}