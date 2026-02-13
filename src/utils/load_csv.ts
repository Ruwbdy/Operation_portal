/**
 * Load and parse CSV file
 */
export async function loadCSV(path: string): Promise<Record<string, any>[]> {
  const response = await fetch(path);
  const text = await response.text();
  
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i];
      return obj;
    }, {} as Record<string, any>);
  });
}