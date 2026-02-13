// Input Validation Utilities

/**
 * Validate and normalize MSISDN format
 * Accepts: 2349066756790, 09066756790, 9066756790
 * Normalizes to: 2349066756790 (13 digits starting with 234)
 */
export function validateMSISDN(msisdn: string): { valid: boolean; error?: string; normalized?: string } {
  if (!msisdn) {
    return { valid: false, error: 'MSISDN is required' };
  }
  
  let trimmed = msisdn.trim();
  
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'MSISDN must contain only digits' };
  }
  
  // Normalize different formats to 234XXXXXXXXXX
  if (trimmed.startsWith('0') && trimmed.length === 11) {
    // 09066756790 -> 2349066756790
    trimmed = '234' + trimmed.substring(1);
  } else if (!trimmed.startsWith('234') && !trimmed.startsWith('0') && trimmed.length === 10) {
    // 9066756790 -> 2349066756790
    trimmed = '234' + trimmed;
  } else if (trimmed.startsWith('234') && trimmed.length === 13) {
    // Already in correct format
    trimmed = trimmed;
  } else if (trimmed.startsWith('0')) {
    return { valid: false, error: 'MSISDN starting with 0 must be 11 digits (e.g., 09066756790)' };
  } else if (!trimmed.startsWith('234')) {
    return { valid: false, error: 'MSISDN must start with 234, 0, or be 10 digits' };
  }
  
  if (trimmed.length !== 13) {
    return { valid: false, error: 'MSISDN must normalize to 13 digits (234XXXXXXXXXX)' };
  }
  
  if (!trimmed.startsWith('234')) {
    return { valid: false, error: 'Normalized MSISDN must start with 234' };
  }
  
  return { valid: true, normalized: trimmed };
}

/**
 * Validate date range (start < end)
 */
export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start and end dates are required' };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  return { valid: true };
}

/**
 * Validate CSV file
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'File is required' };
  }
  
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }
  
  // Max 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must not exceed 10MB' };
  }
  
  return { valid: true };
}