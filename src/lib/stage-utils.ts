/**
 * Stage utility functions
 * Adapted from prospektweb/calcconfig
 * Only includes extractLogicJsonString needed for calculation logic
 */

/**
 * Interface for LOGIC_JSON property structure from Bitrix
 */
export interface BitrixPropertyValue {
  "~VALUE"?: string | { TEXT?: string }
  VALUE?: string | { TEXT?: string }
  [key: string]: any
}

/**
 * Extract LOGIC_JSON string from property value
 * Handles both string and object with TEXT field formats
 * 
 * @param logicJsonProp - The LOGIC_JSON property value from Bitrix
 * @returns The extracted JSON string or null if not found
 */
export function extractLogicJsonString(logicJsonProp: BitrixPropertyValue | null | undefined): string | null {
  if (!logicJsonProp) return null

  const rawValue = logicJsonProp["~VALUE"];
  
  // Variant 1: rawValue = { TEXT: "..." }
  if (typeof rawValue === 'object' && rawValue !== null && typeof rawValue.TEXT === 'string') {
    return rawValue.TEXT;
  }
  
  // Variant 2: rawValue = "..."
  if (typeof rawValue === 'string') {
    return rawValue;
  }
  
  // Variant 3: Check VALUE property
  const value = logicJsonProp.VALUE;
  if (typeof value === 'object' && value !== null && typeof value.TEXT === 'string') {
    return value.TEXT;
  }
  if (typeof value === 'string') {
    return value;
  }
  
  return null;
}
