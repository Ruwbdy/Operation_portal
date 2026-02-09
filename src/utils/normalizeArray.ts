// Normalize SOAP/JSON responses where single items aren't arrays

/**
 * Normalizes an item or array into an array.
 * Common in SOAP-to-JSON where single items aren't arrays.
 * 
 * @param input - Single item, array, or null/undefined
 * @returns Array of items (empty array if input is null/undefined)
 */
export function normalizeArray<T>(input: T | T[] | null | undefined): T[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return [input];
}