// CDR Records Parser
import type { CDRRecord, CDRSummary, CategorizedCDR, CDRApiResponse } from '../../types';

export function parseCDRRecords(response: CDRApiResponse): {
  records: CDRRecord[];
  categorized: CategorizedCDR;
  summaries: Record<string, CDRSummary>;
} {
  const records = response.APIData || [];

  const categorized: CategorizedCDR = {
    all: records,
    voice: [],
    data: [],
    sms: [],
    credit: [],
    adjustment: [],
    other: [],
  };

  records.forEach((record) => {
    const type = record.record_type.toLowerCase();
    if (type.includes('voice') || type.includes('call')) {
      categorized.voice.push(record);
    } else if (type.includes('data') || type.includes('internet')) {
      categorized.data.push(record);
    } else if (type.includes('sms')) {
      categorized.sms.push(record);
    } else if (
      type.includes('credit') ||
      type.includes('recharge') ||
      type.includes('topup')
    ) {
      categorized.credit.push(record);
    } else if (type.includes('adjustment')) {
      categorized.adjustment.push(record);
    } else {
      categorized.other.push(record);
    }
  });

  const summaries: Record<string, CDRSummary> = {
    all: calculateSummary(categorized.all),
    voice: calculateVoiceSummary(categorized.voice),
    data: calculateDataSummary(categorized.data),
    sms: calculateSummary(categorized.sms),
    credit: calculateCreditSummary(categorized.credit),
    adjustment: calculateAdjustmentSummary(categorized.adjustment),
    other: calculateSummary(categorized.other),
  };

  return { records, categorized, summaries };
}

function calculateSummary(records: CDRRecord[]): CDRSummary {
  if (records.length === 0) {
    return { totalTransactions: 0, startingBalance: 0, endingBalance: 0, totalCharged: 0 };
  }
  const startingBalance = parseFloat(
    records[records.length - 1]?.balance_before_amt || '0'
  );
  const endingBalance = parseFloat(records[0]?.balance_after_amt || '0');
  const totalCharged = records.reduce(
    (sum, r) => sum + parseFloat(r.charged_amount || '0'),
    0
  );
  return { totalTransactions: records.length, startingBalance, endingBalance, totalCharged };
}

function calculateVoiceSummary(records: CDRRecord[]): CDRSummary {
  const base = calculateSummary(records);
  const totalDuration = records.reduce(
    (sum, r) => sum + parseInt(r.call_duration_qty || '0'),
    0
  );
  return {
    ...base,
    totalDuration,
    avgCallLength: records.length > 0 ? Math.round(totalDuration / records.length) : 0,
  };
}

function calculateDataSummary(records: CDRRecord[]): CDRSummary {
  const base = calculateSummary(records);
  const totalData = records.reduce(
    (sum, r) => sum + r.bytes_received_qty + r.bytes_sent_qty,
    0
  );
  return { ...base, totalData };
}

function calculateCreditSummary(records: CDRRecord[]): CDRSummary {
  return { ...calculateSummary(records), totalRecharges: records.length };
}

function calculateAdjustmentSummary(records: CDRRecord[]): CDRSummary {
  const base = calculateSummary(records);
  return { ...base, netChange: base.endingBalance - base.startingBalance };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}