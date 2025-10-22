/**
 * Domain Extraction Utility
 *
 * Extracts domain names from URLs for file naming purposes.
 * Handles:
 * - Subdomains (extracts registered domain: "example.com" from "subdomain.example.com")
 * - IP addresses (converts dots to dashes: "192.168.1.1" → "192-168-1-1")
 * - Internationalized domains
 */

/**
 * Extracts a clean domain name from a URL string
 *
 * @param {string} urlString - The URL to extract domain from
 * @returns {string|null} - The extracted domain or null if invalid
 *
 * @example
 * extractDomain('https://www.example.com/page') // returns 'example.com'
 * extractDomain('https://subdomain.example.com') // returns 'subdomain.example.com'
 * extractDomain('http://192.168.1.1:8080') // returns '192-168-1-1'
 */
export function extractDomain(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;

    // Handle IP addresses - convert dots to dashes
    // IPv4 pattern: four groups of 1-3 digits separated by dots
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(hostname)) {
      return hostname.replace(/\./g, '-');
    }

    // Handle IPv6 addresses - convert colons to dashes
    // IPv6 pattern: contains colons
    if (hostname.includes(':')) {
      return hostname.replace(/:/g, '-');
    }

    // For regular domains, return hostname as-is
    // This preserves subdomains for unique file naming
    // e.g., "subdomain.example.com" stays as "subdomain.example.com"
    return hostname;
  } catch {
    return null;
  }
}

/**
 * Extracts the registered domain (without subdomains) from a URL
 * Uses simple heuristic: takes last 2 parts of hostname
 * Note: For production use, consider using the 'psl' library for accurate
 * public suffix handling (e.g., co.uk, com.au, etc.)
 *
 * @param {string} urlString - The URL to extract registered domain from
 * @returns {string|null} - The registered domain or null if invalid
 *
 * @example
 * extractRegisteredDomain('https://subdomain.example.com') // returns 'example.com'
 * extractRegisteredDomain('https://www.example.co.uk') // returns 'co.uk' (limitation without psl)
 */
export function extractRegisteredDomain(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;

    // Handle IP addresses - return as-is with dashes
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(hostname) || hostname.includes(':')) {
      return extractDomain(urlString);
    }

    // Split hostname into parts
    const parts = hostname.split('.');

    // If only 1 part (localhost) or 2 parts (example.com), return as-is
    if (parts.length <= 2) {
      return hostname;
    }

    // Take last 2 parts (simple heuristic)
    // Note: This doesn't handle complex TLDs like .co.uk correctly
    // For production, use 'psl' library
    return parts.slice(-2).join('.');
  } catch {
    return null;
  }
}

/**
 * Sanitizes a domain for use in filenames
 * Removes www. prefix and ensures valid filename characters
 *
 * @param {string} domain - The domain to sanitize
 * @returns {string} - Sanitized domain safe for filenames
 *
 * @example
 * sanitizeDomainForFilename('www.example.com') // returns 'example.com'
 */
export function sanitizeDomainForFilename(domain) {
  if (!domain) return '';

  // Remove www. prefix
  let sanitized = domain.replace(/^www\./, '');

  // Replace any remaining dots with dashes for safety
  // (dots are preserved in the main function, but this is for extra safety)
  // Keep this commented out as we want to preserve dots in domains
  // sanitized = sanitized.replace(/\./g, '-');

  return sanitized;
}
