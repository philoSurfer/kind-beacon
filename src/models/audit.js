/**
 * Audit Model
 *
 * Represents a single Lighthouse audit run for one URL.
 * Based on data-model.md "URL Audit" entity.
 */

import { extractDomain } from '../lib/domain-extractor.js';

/**
 * Valid audit statuses
 */
export const AuditStatus = {
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
};

/**
 * Valid device modes
 */
export const DeviceMode = {
  MOBILE: 'mobile',
  DESKTOP: 'desktop'
};

/**
 * Creates a new Audit instance
 *
 * @param {Object} data - Audit data
 * @param {string} data.url - Final URL after redirects
 * @param {string} data.requestedUrl - Original URL from CSV
 * @param {string} [data.timestamp] - ISO 8601 timestamp (defaults to now)
 * @param {string} [data.domain] - Domain extracted from URL (auto-extracted if not provided)
 * @param {string} data.lighthouseVersion - Lighthouse version used
 * @param {string} data.deviceMode - Device emulation mode ('mobile' or 'desktop')
 * @param {number} data.auditDuration - Audit duration in milliseconds
 * @param {string} data.status - Audit status ('success', 'failed', or 'timeout')
 * @param {string} [data.error] - Error message if status is not 'success'
 * @param {number} [data.retryAttempt=0] - Retry attempt number (0 or 1)
 * @returns {Object} - Validated audit object
 */
export function createAudit(data) {
  const audit = {
    url: data.url,
    requestedUrl: data.requestedUrl,
    timestamp: data.timestamp || new Date().toISOString(),
    domain: data.domain || extractDomain(data.url || data.requestedUrl),
    lighthouseVersion: data.lighthouseVersion,
    deviceMode: data.deviceMode,
    auditDuration: data.auditDuration,
    status: data.status,
    error: data.error || null,
    retryAttempt: data.retryAttempt || 0
  };

  // Validate the audit
  validateAudit(audit);

  return audit;
}

/**
 * Validates an audit object
 *
 * @param {Object} audit - Audit object to validate
 * @throws {Error} - If validation fails
 */
export function validateAudit(audit) {
  // Required fields
  if (!audit.requestedUrl) {
    throw new Error('requestedUrl is required');
  }

  if (!audit.timestamp) {
    throw new Error('timestamp is required');
  }

  if (!audit.domain) {
    throw new Error('domain is required');
  }

  if (!audit.lighthouseVersion) {
    throw new Error('lighthouseVersion is required');
  }

  if (!audit.deviceMode) {
    throw new Error('deviceMode is required');
  }

  if (typeof audit.auditDuration !== 'number') {
    throw new Error('auditDuration must be a number');
  }

  if (!audit.status) {
    throw new Error('status is required');
  }

  // Validate URL format (if url is provided)
  if (audit.url) {
    try {
      new URL(audit.url);
    } catch {
      throw new Error(`Invalid URL: ${audit.url}`);
    }
  }

  try {
    new URL(audit.requestedUrl);
  } catch {
    throw new Error(`Invalid requestedUrl: ${audit.requestedUrl}`);
  }

  // Validate timestamp format (ISO 8601)
  if (isNaN(Date.parse(audit.timestamp))) {
    throw new Error(`Invalid timestamp format: ${audit.timestamp}`);
  }

  // Validate device mode
  if (!Object.values(DeviceMode).includes(audit.deviceMode)) {
    throw new Error(`Invalid deviceMode: ${audit.deviceMode}. Must be 'mobile' or 'desktop'`);
  }

  // Validate status
  if (!Object.values(AuditStatus).includes(audit.status)) {
    throw new Error(`Invalid status: ${audit.status}. Must be 'success', 'failed', or 'timeout'`);
  }

  // Validate audit duration is positive
  if (audit.auditDuration < 0) {
    throw new Error('auditDuration must be positive');
  }

  // Validate retry attempt
  if (audit.retryAttempt !== 0 && audit.retryAttempt !== 1) {
    throw new Error('retryAttempt must be 0 or 1');
  }

  // Error required if status is not success
  if (audit.status !== AuditStatus.SUCCESS && !audit.error) {
    throw new Error('error is required when status is not success');
  }
}

/**
 * Creates an audit object from a Lighthouse result
 *
 * @param {string} requestedUrl - Original URL from CSV
 * @param {Object} lhr - Lighthouse Result object
 * @param {string} deviceMode - Device mode used
 * @param {number} duration - Audit duration in milliseconds
 * @param {number} [retryAttempt=0] - Retry attempt number
 * @returns {Object} - Audit object
 */
export function createAuditFromLighthouseResult(requestedUrl, lhr, deviceMode, duration, retryAttempt = 0) {
  return createAudit({
    url: lhr.finalUrl || lhr.requestedUrl,
    requestedUrl,
    timestamp: lhr.fetchTime,
    lighthouseVersion: lhr.lighthouseVersion,
    deviceMode,
    auditDuration: duration,
    status: AuditStatus.SUCCESS,
    retryAttempt
  });
}

/**
 * Creates a failed audit object
 *
 * @param {string} requestedUrl - Original URL from CSV
 * @param {string} error - Error message
 * @param {string} deviceMode - Device mode used
 * @param {number} duration - Audit duration in milliseconds
 * @param {string} lighthouseVersion - Lighthouse version
 * @param {number} [retryAttempt=0] - Retry attempt number
 * @param {string} [status='failed'] - Status ('failed' or 'timeout')
 * @returns {Object} - Failed audit object
 */
export function createFailedAudit(requestedUrl, error, deviceMode, duration, lighthouseVersion, retryAttempt = 0, status = AuditStatus.FAILED) {
  return createAudit({
    url: null,
    requestedUrl,
    domain: extractDomain(requestedUrl),
    lighthouseVersion,
    deviceMode,
    auditDuration: duration,
    status,
    error,
    retryAttempt
  });
}

/**
 * Converts an audit object to JSON format for storage
 *
 * @param {Object} audit - Audit object
 * @returns {Object} - Audit object ready for JSON serialization
 */
export function auditToJSON(audit) {
  return {
    audit: {
      url: audit.url,
      requestedUrl: audit.requestedUrl,
      timestamp: audit.timestamp,
      domain: audit.domain,
      lighthouseVersion: audit.lighthouseVersion,
      deviceMode: audit.deviceMode,
      auditDuration: audit.auditDuration,
      status: audit.status,
      ...(audit.error && { error: audit.error }),
      retryAttempt: audit.retryAttempt
    }
  };
}
