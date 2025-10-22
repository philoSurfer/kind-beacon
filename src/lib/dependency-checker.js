/**
 * Dependency Checker
 *
 * Detects if Lighthouse is installed and offers auto-install prompt.
 * Based on research.md section 7 implementation pattern.
 * Implements FR-018: Lighthouse dependency detection.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createInterface } from 'readline';

const execAsync = promisify(exec);

/**
 * Checks if Lighthouse is installed
 *
 * @returns {Promise<boolean>} - True if Lighthouse is available
 */
export async function isLighthouseInstalled() {
  try {
    // Try to import lighthouse module
    // This works in both development (node_modules) and production (global install)
    await import('lighthouse');
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the installed Lighthouse version
 *
 * @returns {string|null} - Version string or null if not installed
 */
export async function getLighthouseVersion() {
  try {
    // Import lighthouse and get version
    const lighthouse = await import('lighthouse');
    // Version might be in different locations depending on how it's packaged
    return lighthouse.default?.version || lighthouse.version || 'unknown';
  } catch {
    return null;
  }
}

/**
 * Prompts user for input via readline
 *
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User's answer
 */
function getUserInput(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Attempts to auto-install Lighthouse via npm
 *
 * @returns {Promise<boolean>} - True if installation succeeded
 */
export async function autoInstallLighthouse() {
  try {
    console.log('\nLighthouse not found.');
    console.log('Kind Beacon requires Lighthouse to run audits.\n');

    const answer = await getUserInput('Install Lighthouse now? (y/n): ');

    if (answer.toLowerCase() !== 'y') {
      console.log('\nInstallation cancelled.');
      console.log('To install manually, run: npm install lighthouse\n');
      return false;
    }

    console.log('\nInstalling lighthouse...');
    console.log('This may take a few minutes...\n');

    // Install lighthouse
    await execAsync('npm install lighthouse');

    console.log('✓ Lighthouse installed successfully!\n');
    return true;
  } catch (error) {
    console.error('\n✗ Installation failed:', error.message);
    console.log('\nPlease install Lighthouse manually:');
    console.log('  npm install lighthouse\n');
    return false;
  }
}

/**
 * Checks Lighthouse dependency and prompts for installation if missing
 * This is the main function to call at CLI startup
 *
 * @param {boolean} [autoInstall=true] - Whether to prompt for auto-install
 * @returns {Promise<boolean>} - True if Lighthouse is available (or was installed)
 */
export async function checkLighthouseDependency(autoInstall = true) {
  if (await isLighthouseInstalled()) {
    return true;
  }

  if (!autoInstall) {
    console.error('\nError: Lighthouse not found.');
    console.error('Install it with: npm install lighthouse\n');
    return false;
  }

  // Attempt auto-install
  const installed = await autoInstallLighthouse();

  if (!installed) {
    return false;
  }

  // Verify installation
  if (!(await isLighthouseInstalled())) {
    console.error('\n✗ Verification failed: Lighthouse still not found.');
    console.error('Please install Lighthouse manually and try again.\n');
    return false;
  }

  return true;
}

/**
 * Gets information about all dependencies for --version command
 *
 * @returns {Promise<Object>} - Dependency information
 */
export async function getDependencyInfo() {
  const info = {
    lighthouse: null,
    node: process.version
  };

  // HIGH FIX #16: More robust error handling for version retrieval
  try {
    const version = await getLighthouseVersion();
    info.lighthouse = version || 'not installed';
  } catch (error) {
    // Handle any unexpected errors during version detection
    info.lighthouse = 'error detecting version';
    console.error('[Warning] Error detecting Lighthouse version:', error.message);
  }

  return info;
}

/**
 * Validates that all required dependencies are available
 * Returns detailed error messages if any are missing
 *
 * @returns {Promise<Object>} - Validation result with status and missing dependencies
 */
export async function validateDependencies() {
  const missing = [];

  if (!(await isLighthouseInstalled())) {
    missing.push({
      name: 'lighthouse',
      installCommand: 'npm install lighthouse'
    });
  }

  return {
    valid: missing.length === 0,
    missing
  };
}
