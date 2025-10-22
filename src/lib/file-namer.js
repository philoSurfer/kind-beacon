/**
 * File Naming Utility
 *
 * Generates standardized filenames for reports and data files.
 * Feature 002: Updated format to include timestamps for chronological sorting
 * Format: {domain}_{YYYY-MM-DD-HHmmss}_{device}.{extension}
 * Uses domain from domain-extractor and ISO 8601 timestamp format (UTC).
 */

import { extractDomain } from './domain-extractor.js';

/**
 * T025: Generates an ISO 8601 timestamp for filename (UTC timezone)
 * Format: YYYY-MM-DD-HHmmss (no colons for Windows compatibility)
 *
 * @param {Date} [date=new Date()] - Date to format (defaults to now)
 * @returns {string} - Timestamp in format YYYY-MM-DD-HHmmss
 *
 * @example
 * generateTimestamp(new Date('2025-10-22T14:30:52.000Z'))
 * // returns '2025-10-22-143052'
 */
export function generateTimestamp(date = new Date()) {
  // Use UTC to avoid timezone ambiguity
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * T026, T027: Generates a filename with timestamp and device mode (Feature 002)
 * Format: {domain}_{timestamp}_{device}.{extension}
 *
 * @param {string} url - The URL that was audited
 * @param {string} extension - File extension (e.g., 'json', 'html')
 * @param {string} [device='mobile'] - Device mode ('mobile' or 'desktop')
 * @param {Date} [date=new Date()] - Optional date to use (defaults to now)
 * @returns {string} - Filename in format: {domain}_{YYYY-MM-DD-HHmmss}_{device}.{extension}
 *
 * @example
 * generateFilename('https://example.com', 'html', 'mobile', new Date('2025-10-22T14:30:52.000Z'))
 * // returns 'example-com_2025-10-22-143052_mobile.html'
 *
 * generateFilename('https://192.168.1.1', 'json', 'desktop')
 * // returns '192-168-1-1_2025-10-22-143052_desktop.json'
 */
export function generateFilename(url, extension, device = 'mobile', date = new Date()) {
  const domain = extractDomain(url);

  if (!domain) {
    throw new Error(`Invalid URL: ${url}`);
  }

  // T025: Generate timestamp
  const timestamp = generateTimestamp(date);

  // Remove leading dot from extension if present
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;

  // T027: Updated filename format with timestamp
  return `${domain}_${timestamp}_${device}.${ext}`;
}

/**
 * Formats a date as YYYY-MM-DD for filenames (legacy function, still used for backward compatibility)
 *
 * @param {Date} date - Date to format
 * @returns {string} - Date in YYYY-MM-DD format
 *
 * @example
 * formatDateForFilename(new Date('2025-10-22'))
 * // returns '2025-10-22'
 */
export function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * T028: Generates a JSON data filename with timestamp and device mode (Feature 002)
 *
 * @param {string} url - The URL that was audited
 * @param {string} [device='mobile'] - Device mode ('mobile' or 'desktop')
 * @param {Date} [date=new Date()] - Optional date to use (defaults to now)
 * @returns {string} - Filename in format: {domain}_{YYYY-MM-DD-HHmmss}_{device}.json
 *
 * @example
 * generateDataFilename('https://example.com', 'mobile', new Date('2025-10-22T14:30:52.000Z'))
 * // returns 'example-com_2025-10-22-143052_mobile.json'
 */
export function generateDataFilename(url, device = 'mobile', date = new Date()) {
  return generateFilename(url, 'json', device, date);
}

/**
 * T028: Generates an HTML report filename with timestamp and device mode (Feature 002)
 *
 * @param {string} url - The URL that was audited
 * @param {string} [device='mobile'] - Device mode ('mobile' or 'desktop')
 * @param {Date} [date=new Date()] - Optional date to use (defaults to now)
 * @returns {string} - Filename in format: {domain}_{YYYY-MM-DD-HHmmss}_{device}.html
 *
 * @example
 * generateReportFilename('https://example.com', 'mobile', new Date('2025-10-22T14:30:52.000Z'))
 * // returns 'example-com_2025-10-22-143052_mobile.html'
 */
export function generateReportFilename(url, device = 'mobile', date = new Date()) {
  return generateFilename(url, 'html', device, date);
}

/**
 * Parses a report filename to extract metadata
 *
 * @param {string} filename - Filename to parse
 * @returns {Object|null} - Object with domain, date, and extension, or null if invalid
 *
 * @example
 * parseFilename('example.com-2025-10-22-report.json')
 * // returns { domain: 'example.com', date: '2025-10-22', extension: 'json' }
 */
export function parseFilename(filename) {
  // Pattern: {domain}-{YYYY-MM-DD}-report.{extension}
  const pattern = /^(.+)-(\d{4}-\d{2}-\d{2})-report\.(\w+)$/;
  const match = filename.match(pattern);

  if (!match) {
    return null;
  }

  return {
    domain: match[1],
    date: match[2],
    extension: match[3]
  };
}
