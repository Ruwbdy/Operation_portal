// DA Mapping Service - Loads DA ID to Description mapping from CSV

export interface DAMapping {
  [daId: string]: string;
}

let daMappingCache: DAMapping | null = null;

/**
 * Load DA mapping from CSV file
 */
export async function loadDAMapping(csvContent: string): Promise<DAMapping> {
  const mapping: DAMapping = {};
  
  // Split into lines and skip header
  const lines = csvContent.trim().split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles quotes)
    const match = line.match(/^(\d+),(.+)$/);
    if (match) {
      const daId = match[1];
      let description = match[2];
      
      // Remove surrounding quotes if present
      description = description.replace(/^"(.*)"$/, '$1');
      
      mapping[daId] = description;
    }
  }
  
  daMappingCache = mapping;
  return mapping;
}

/**
 * Get DA description by ID
 */
export function getDADescription(daId: string): string {
  if (!daMappingCache) {
    return 'Unknown DA';
  }
  
  return daMappingCache[daId] || 'Unknown DA';
}

/**
 * Initialize DA mapping from a CSV file path or content
 */
export async function initializeDAMapping(csvPath?: string): Promise<void> {
  // Default DA mapping if no CSV is provided
  const defaultMapping = `DA_ID,Description
1,Blast event bundle
10,BBM on BB10
100,Xtratime
101,Convergence
102,True Postpaid Credit Limit (Convergence overflow1)
103,True Postpaid Unsecured Credit
104,"DA104 (DOLA Bonus, DYA Airtime Offer1)"
105,Shared Account
106,BizLife Bonus (National)
61,DA 61
64,DA 64
128,Monthly Data Bundle
211,DA 211
213,DA 213
214,DA 214
240,Rollover Data
254,DA 254
1557,Weekly Data Bundle
1565,Weekly Data Bundle
4699,Special Bonus
4720,DA 4720
4747,Weekly Special
4824,Daily Bonus
4860,DA 4860
4874,Voice Bundle
4950,SMS Bundle
5046,Social Media Bundle
5047,Video Streaming Bundle
5060,Night Data Bundle
7513,Weekend Bundle
8232,DA 8232
8242,DA 8242
8252,DA 8252`;

  try {
    if (csvPath) {
      // In a real implementation, you would fetch from the server
      // const response = await fetch(csvPath);
      // const csvContent = await response.text();
      // await loadDAMapping(csvContent);
      console.warn('CSV path provided but file loading not implemented. Using default mapping.');
      await loadDAMapping(defaultMapping);
    } else {
      await loadDAMapping(defaultMapping);
    }
  } catch (error) {
    console.error('Failed to load DA mapping:', error);
    await loadDAMapping(defaultMapping);
  }
}

/**
 * Check if DA mapping is initialized
 */
export function isDAMappingInitialized(): boolean {
  return daMappingCache !== null;
}