/**
 * Escape HTML special characters to prevent XSS
 * @param {string|null|undefined} value - The value to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(value) {
  return `${value || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
