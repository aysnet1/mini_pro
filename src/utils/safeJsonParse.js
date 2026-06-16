/**
 * Safely parse a JSON string with fallback value
 * @param {string|null|undefined} value - The value to parse
 * @param {any} fallback - The fallback value if parsing fails
 * @returns {any} Parsed value or fallback
 */
export function safeJsonParse(value, fallback = null) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}
