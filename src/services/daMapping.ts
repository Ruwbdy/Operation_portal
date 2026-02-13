import { loadCSV } from '../utils/load_csv';

export type BalanceType = 'voice' | 'data' | 'money' | 'sms' | 'bonus';

export interface DAMapping {
  [daId: string]: {
    description: string;
    balanceType: BalanceType;
  };
}

const NAIRA_PER_GB = 524.29;
let DA_MAPPING: DAMapping = {};

/**
 * Initialize DA mapping from CSV
 */
export async function initializeDAMapping(): Promise<void> {
  try {
    const rows = await loadCSV('/da_mapping.csv');
    DA_MAPPING = rows.reduce((map, row) => {
      map[row.da_id] = {
        description: row.description,
        balanceType: row.balance_type as BalanceType
      };
      return map;
    }, {} as DAMapping);
  } catch (error) {
    console.error('Failed to load DA mapping:', error);
  }
}

export function isDataDA(daId: string): boolean {
  return DA_MAPPING[daId]?.balanceType === 'data';
}

export function getBalanceType(daId: string): BalanceType {
  return DA_MAPPING[daId]?.balanceType || 'money';
}

export function formatDAAmount(daId: string, amountNaira: number): string {
  if (getBalanceType(daId) === 'data') {
    const gb = amountNaira / NAIRA_PER_GB;
    const mb = gb * 1024;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(mb * 1024).toFixed(2)} KB`;
  }
  return `₦${amountNaira.toFixed(2)}`;
}

export function getDADescription(daId: string): string {
  return DA_MAPPING[daId]?.description || 'Unknown DA';
}

export function getDAInfo(daId: string): { description: string; balanceType: BalanceType } {
  return DA_MAPPING[daId] || { description: 'Unknown DA', balanceType: 'money' };
}

export function isDAMappingInitialized(): boolean {
  return Object.keys(DA_MAPPING).length > 0;
}

export function getAllDAIds(): string[] {
  return Object.keys(DA_MAPPING).sort((a, b) => parseInt(a) - parseInt(b));
}

export function getDAsByType(balanceType: BalanceType): string[] {
  return Object.keys(DA_MAPPING)
    .filter(id => DA_MAPPING[id].balanceType === balanceType)
    .sort((a, b) => parseInt(a) - parseInt(b));
}