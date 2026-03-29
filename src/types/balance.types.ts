// Balance & Dedicated Account Type Definitions

export interface Balance {
  subscriberNumber: string;
  serviceClassCurrent: number;
  currency1: string;
  accountValue1: number;
  expiryDate: string;
}

export interface DedicatedAccount {
  dedicatedAccountID: string;
  dedicatedAccountValue1: number;
  expiryDate: string;
  startDate?: string;
  dedicatedAccountActiveValue1?: number;
  dedicatedAccountUnitType?: number;
  description?: string;
}