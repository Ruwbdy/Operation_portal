// Input Validation Utilities

/**
 * Validate MSISDN format (13 digits starting with 234)
 */
export function validateMSISDN(msisdn: string): { valid: boolean; error?: string } {
  if (!msisdn) {
    return { valid: false, error: 'MSISDN is required' };
  }
  
  const trimmed = msisdn.trim();
  
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'MSISDN must contain only digits' };
  }
  
  if (trimmed.length !== 13) {
    return { valid: false, error: 'MSISDN must be exactly 13 digits' };
  }
  
  if (!trimmed.startsWith('234')) {
    return { valid: false, error: 'MSISDN must start with 234' };
  }
  
  return { valid: true };
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