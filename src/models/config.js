/**
 * Config Model
 *
 * Manages configuration with cosmiconfig.
 * Supports CLI args > config file > defaults precedence.
 * Based on data-model.md "Configuration" entity and contracts/cli-interface.md.
 */

import { cosmiconfigSync } from 'cosmiconfig';
import { DeviceMode } from './audit.js';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  concurrency: 3,
  timeout: 60,
  device: DeviceMode.MOBILE,
  dataDir: './data',
  reportsDir: './reports'
};

/**
 * Loads configuration from file using cosmiconfig
 *
 * @param {string} [configPath] - Optional path to config file
 * @returns {Object|null} - Config from file or null if not found
 */
function loadConfigFile(configPath) {
  const explorer = cosmiconfigSync('kindbeacon');

  try {
    if (configPath) {
      // Load from specific path
      const result = explorer.load(configPath);
      return result?.config || null;
    } else {
      // Search for config file
      const result = explorer.search();
      return result?.config || null;
    }
  } catch (error) {
    // Config file not found or invalid - return null
    return null;
  }
}

/**
 * Creates a configuration object with proper precedence:
 * CLI args > config file > defaults
 *
 * @param {Object} [cliOptions={}] - Options from CLI arguments
 * @param {string} [configPath] - Optional path to config file
 * @returns {Object} - Merged configuration
 */
export function createConfig(cliOptions = {}, configPath = null) {
  // Load config file
  const fileConfig = loadConfigFile(configPath);

  // Merge with precedence: CLI > file > defaults
  const config = {
    ...DEFAULT_CONFIG,
    ...(fileConfig || {}),
    ...cliOptions
  };

  // Validate the config
  validateConfig(config);

  return config;
}

/**
 * Validates a configuration object
 *
 * @param {Object} config - Configuration to validate
 * @throws {Error} - If validation fails
 */
export function validateConfig(config) {
  // Validate concurrency
  if (typeof config.concurrency !== 'number') {
    throw new Error('concurrency must be a number');
  }

  if (config.concurrency < 1 || config.concurrency > 10) {
    throw new Error('concurrency must be between 1 and 10');
  }

  // Validate timeout
  if (typeof config.timeout !== 'number') {
    throw new Error('timeout must be a number');
  }

  if (config.timeout <= 0) {
    throw new Error('timeout must be positive');
  }

  // Validate device mode
  if (!Object.values(DeviceMode).includes(config.device)) {
    throw new Error(`device must be '${DeviceMode.MOBILE}' or '${DeviceMode.DESKTOP}'`);
  }

  // Validate directory paths (basic validation)
  if (typeof config.dataDir !== 'string' || config.dataDir.length === 0) {
    throw new Error('dataDir must be a non-empty string');
  }

  if (typeof config.reportsDir !== 'string' || config.reportsDir.length === 0) {
    throw new Error('reportsDir must be a non-empty string');
  }
}

/**
 * Parses CLI options and converts them to the correct types
 *
 * @param {Object} rawOptions - Raw options from Commander.js
 * @returns {Object} - Parsed options with correct types
 */
export function parseCliOptions(rawOptions) {
  const parsed = {};

  // Parse concurrency
  if (rawOptions.concurrency !== undefined) {
    const concurrency = parseInt(rawOptions.concurrency, 10);
    if (isNaN(concurrency)) {
      throw new Error(`Invalid concurrency value: ${rawOptions.concurrency}`);
    }
    parsed.concurrency = concurrency;
  }

  // Parse timeout
  if (rawOptions.timeout !== undefined) {
    const timeout = parseInt(rawOptions.timeout, 10);
    if (isNaN(timeout)) {
      throw new Error(`Invalid timeout value: ${rawOptions.timeout}`);
    }
    parsed.timeout = timeout;
  }

  // Parse device
  if (rawOptions.device !== undefined) {
    parsed.device = rawOptions.device.toLowerCase();
  }

  // Parse directories
  if (rawOptions.dataDir !== undefined) {
    parsed.dataDir = rawOptions.dataDir;
  }

  if (rawOptions.reportsDir !== undefined) {
    parsed.reportsDir = rawOptions.reportsDir;
  }

  return parsed;
}

/**
 * Gets the effective configuration for display/logging
 *
 * @param {Object} config - Configuration object
 * @returns {Object} - Configuration formatted for display
 */
export function getConfigSummary(config) {
  return {
    'Concurrency': config.concurrency,
    'Timeout': `${config.timeout}s`,
    'Device': config.device,
    'Data Directory': config.dataDir,
    'Reports Directory': config.reportsDir
  };
}

/**
 * Searches for a config file and returns its path
 *
 * @returns {string|null} - Path to config file or null if not found
 */
export function findConfigFile() {
  const explorer = cosmiconfigSync('kindbeacon');

  try {
    const result = explorer.search();
    return result?.filepath || null;
  } catch {
    return null;
  }
}

/**
 * Checks if a config file exists at the given path
 *
 * @param {string} configPath - Path to check
 * @returns {boolean} - True if config file exists and is valid
 */
export function isValidConfigFile(configPath) {
  try {
    const explorer = cosmiconfigSync('kindbeacon');
    const result = explorer.load(configPath);
    return result !== null && result.config !== null;
  } catch {
    return false;
  }
}
