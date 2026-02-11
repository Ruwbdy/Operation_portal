// CDR Records Parser
import type { CDRRecord } from './data_interface';
import type { CDRSummary, CategorizedCDR, CDRApiResponse } from './api_definitions';

/**
 * Parse and categorize CDR records from API response
 */
export function parseCDRRecords(response: CDRApiResponse): {
  records: CDRRecord[];
  categorized: CategorizedCDR;
  summaries: Record<string, CDRSummary>;
} {
  const records = response.APIData || [];
  
  // Categorize records by type
  const categorized: CategorizedCDR = {
    all: records,
    voice: [],
    data: [],
    sms: [],
    credit: [],
    daAdjustment: [],
    other: []
  };
  
  records.forEach(record => {
    const type = record.record_type.toLowerCase();
    
    if (type.includes('voice') || type.includes('call')) {
      categorized.voice.push(record);
    } else if (type.includes('data') || type.includes('internet')) {
      categorized.data.push(record);
    } else if (type.includes('sms')) {
      categorized.sms.push(record);
    } else if (type.includes('credit') || type.includes('recharge') || type.includes('topup')) {
      categorized.credit.push(record);
    } else if (type.includes('adjustment') || type.includes('da')) {
      categorized.daAdjustment.push(record);
    } else {
      categorized.other.push(record);
    }
  });
  
  // Calculate summaries for each category
  const summaries: Record<string, CDRSummary> = {
    all: calculateSummary(categorized.all),
    voice: calculateVoiceSummary(categorized.voice),
    data: calculateDataSummary(categorized.data),
    sms: calculateSummary(categorized.sms),
    credit: calculateCreditSummary(categorized.credit),
    daAdjustment: calculateDAdjustmentSummary(categorized.daAdjustment),
    other: calculateSummary(categorized.other)
  };
  
  return { records, categorized, summaries };
}

/**
 * Calculate basic summary for any CDR category
 */
function calculateSummary(records: CDRRecord[]): CDRSummary {
  if (records.length === 0) {
    return {
      totalTransactions: 0,
      startingBalance: 0,
      endingBalance: 0,
      totalCharged: 0
    };
  }
  
  const startingBalance = parseFloat(records[records.length - 1]?.balance_before_amt || '0');
  const endingBalance = parseFloat(records[0]?.balance_after_amt || '0');
  const totalCharged = records.reduce((sum, r) => sum + parseFloat(r.charged_amount || '0'), 0);
  
  return {
    totalTransactions: records.length,
    startingBalance,
    endingBalance,
    totalCharged
  };
}

/**
 * Calculate voice-specific summary
 */
function calculateVoiceSummary(records: CDRRecord[]): CDRSummary {
  const baseSummary = calculateSummary(records);
  
  const totalDuration = records.reduce((sum, r) => {
    const duration = parseInt(r.call_duration_qty || '0');
    return sum + duration;
  }, 0);
  
  const avgCallLength = records.length > 0 ? Math.round(totalDuration / records.length) : 0;
  
  return {
    ...baseSummary,
    totalDuration,
    avgCallLength
  };
}

/**
 * Calculate data-specific summary
 */
function calculateDataSummary(records: CDRRecord[]): CDRSummary {
  const baseSummary = calculateSummary(records);
  
  const totalData = records.reduce((sum, r) => {
    return sum + r.bytes_received_qty + r.bytes_sent_qty;
  }, 0);
  
  return {
    ...baseSummary,
    totalData
  };
}

/**
 * Calculate credit/recharge summary
 */
function calculateCreditSummary(records: CDRRecord[]): CDRSummary {
  const baseSummary = calculateSummary(records);
  
  return {
    ...baseSummary,
    totalRecharges: records.length
  };
}

/**
 * Calculate DA adjustment summary
 */
function calculateDAdjustmentSummary(records: CDRRecord[]): CDRSummary {
  const baseSummary = calculateSummary(records);
  
  const netChange = baseSummary.endingBalance - baseSummary.startingBalance;
  
  return {
    ...baseSummary,
    netChange
  };
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}