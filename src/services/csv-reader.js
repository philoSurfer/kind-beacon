/**
 * CSV Reader Service
 *
 * Parses CSV files containing URLs using PapaParse.
 * Handles both header and no-header formats, validates URLs,
 * and provides metadata about the CSV input.
 */

import Papa from 'papaparse';
import fs from 'fs';
import { logWarning } from '../lib/logger.js';

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 *
 * @param {string} urlString - String to validate
 * @returns {boolean} - True if valid HTTP/HTTPS URL
 */
function isValidUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts URL from a CSV row
 * Tries common column names first, then falls back to first column
 *
 * @param {Object} row - Parsed CSV row object
 * @returns {string|null} - Extracted URL or null
 */
function extractUrlFromRow(row) {
  // Try common column names (case-insensitive)
  const commonNames = ['url', 'URL', 'link', 'Link', 'website', 'Website', 'address', 'Address'];

  for (const name of commonNames) {
    if (row[name]) {
      return row[name].trim();
    }
  }

  // Fallback to first column
  const keys = Object.keys(row);
  if (keys.length > 0) {
    const firstValue = row[keys[0]];
    return firstValue ? firstValue.trim() : null;
  }

  return null;
}

/**
 * Reads and parses a CSV file containing URLs
 *
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Object>} - Object containing urls array and metadata
 * @throws {Error} - If file cannot be read or parsed
 */
export async function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    const file = fs.createReadStream(filePath);
    const urls = [];
    const invalidUrls = [];
    let totalRows = 0;
    let hasHeaders = false;
    let urlColumn = null;

    file.on('error', (error) => {
      reject(new Error(`Error reading CSV file: ${error.message}`));
    });

    Papa.parse(file, {
      header: true,  // Auto-detect headers per FR-002
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Store original header name
        return header.trim();
      },
      step: (result) => {
        totalRows++;

        // Check if we have headers on first row
        if (totalRows === 1 && result.meta.fields && result.meta.fields.length > 0) {
          hasHeaders = true;
        }

        // Extract URL from row
        const urlString = extractUrlFromRow(result.data);

        if (!urlString) {
          invalidUrls.push({ row: totalRows, reason: 'Empty or missing URL' });
          return;
        }

        // Validate URL (T016)
        if (isValidUrl(urlString)) {
          urls.push(urlString);

          // Detect URL column name on first valid URL
          if (!urlColumn && hasHeaders && result.meta.fields) {
            // Find which field contained this URL
            for (const field of result.meta.fields) {
              if (result.data[field] && result.data[field].trim() === urlString) {
                urlColumn = field;
                break;
              }
            }
          }
        } else {
          invalidUrls.push({ row: totalRows, url: urlString, reason: 'Invalid URL format (must be HTTP/HTTPS)' });
          logWarning(`Invalid URL on row ${totalRows}: ${urlString}`);
        }
      },
      complete: () => {
        // Log invalid URLs summary per FR-010
        if (invalidUrls.length > 0) {
          logWarning(`Found ${invalidUrls.length} invalid URLs in CSV (skipped)`);
        }

        // Extract metadata (T017)
        const metadata = {
          filePath,
          totalUrls: totalRows,
          validUrls: urls.length,
          invalidUrls: invalidUrls.length,
          hasHeaders,
          urlColumn: urlColumn || (hasHeaders ? 'Unknown' : null),
          invalidUrlDetails: invalidUrls
        };

        resolve({
          urls,
          metadata
        });
      },
      error: (error) => {
        reject(new Error(`Error parsing CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Validates CSV file format before parsing
 * Quick check to ensure file is readable and has correct format
 *
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<boolean>} - True if valid
 */
export async function validateCsvFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return false;
    }

    // Check if file has .csv extension
    if (!filePath.toLowerCase().endsWith('.csv')) {
      return false;
    }

    // Check if file is readable
    fs.accessSync(filePath, fs.constants.R_OK);

    return true;
  } catch {
    return false;
  }
}
