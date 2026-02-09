// SDP Timestamp Parser for Telecom Formats

/**
 * Robust date parser for telecom (SDP/IN) timestamp formats
 * Handles formats like: YYYYMMDDTHH:MM:SS, 9999-12-31, etc.
 * 
 * @param dateStr - Date string from SDP/HLR/HSS
 * @returns Formatted date string or special values
 */
export function formatTelecomDate(dateStr: string | null | any): string {
  if (!dateStr) return 'N/A';
  const str = String(dateStr).trim();
  
  // Check for permanent validity
  if (str.startsWith('9999')) return 'Permanent';
  
  // Check for historical/unset dates
  if (str.startsWith('0000')) return 'Historical';

  // Handle SDP format: YYYYMMDDTHH:MM:SS or YYYYMMDDHHMM
  if (/^\d{8}/.test(str)) {
    try {
      const year = str.substring(0, 4);
      const month = str.substring(4, 6);
      const day = str.substring(6, 8);
      
      // Extract time part (after T or just continuation)
      const timePart = str.includes('T') ? str.split('T')[1] : str.substring(8);
      const hour = timePart.length >= 2 ? timePart.substring(0, 2) : '00';
      const min = timePart.length >= 4 ? timePart.substring(2, 4) : '00';
      
      const date = new Date(`${year}-${month}-${day}T${hour}:${min}:00`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });
      }
    } catch (e) {
      console.warn("Tele-date parse failed:", str);
    }
  }

  // Try standard date parsing
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // Return as-is if all parsing fails
  return str;
}

/**
 * Format CDR event datetime (YYYYMMDDHHMMSS) to readable format
 */
export function formatCDRDateTime(eventDt: number): string {
  const str = String(eventDt);
  if (str.length !== 14) return str;
  
  try {
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);
    const hour = str.substring(8, 10);
    const minute = str.substring(10, 12);
    const second = str.substring(12, 14);
    
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {
    console.warn("CDR date parse failed:", eventDt);
  }
  
  return str;
}