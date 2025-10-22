#!/usr/bin/env node

/**
 * CLI Entry Point
 *
 * Handles command-line argument parsing and delegates to command implementations.
 * Initializes Commander.js with version, help, and available commands.
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { checkLighthouseDependency, getDependencyInfo } from '../lib/dependency-checker.js';
import { auditCommand } from './commands.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

/**
 * Main CLI function
 * Sets up Commander.js and handles command routing
 */
export default async function main() {
  // Handle version flag before Commander.js parses it
  if (process.argv.includes('-v') || process.argv.includes('--version')) {
    const deps = await getDependencyInfo();
    console.log(`kind-beacon v${packageJson.version}`);
    console.log(`Lighthouse v${deps.lighthouse || 'not installed'}`);
    console.log(`Node.js ${deps.node}`);
    process.exit(0);
  }

  const program = new Command();

  program
    .name('kind-beacon')
    .description('Kind Beacon - Core Web Vitals Auditing Tool')
    .addHelpText('after', `
Examples:
  $ kind-beacon audit urls.csv
  $ kind-beacon audit urls.csv --device desktop --concurrency 5
  $ kind-beacon audit urls.csv -c 3 -t 90 -d mobile

For more information: https://github.com/kind-beacon/kind-beacon
    `);

  // Audit command
  program
    .command('audit')
    .description('Run Core Web Vitals audit on URLs from CSV file')
    .argument('<csv-file>', 'path to CSV file containing URLs')
    .option('-c, --concurrency <number>', 'max simultaneous audits (1-10)', '3')
    .option('-t, --timeout <seconds>', 'audit timeout in seconds', '60')
    .option('-d, --device <type>', 'device emulation: mobile or desktop', 'mobile')
    .option('--data-dir <path>', 'output directory for JSON data', './data')
    .option('--reports-dir <path>', 'output directory for HTML reports', './reports')
    .option('--config <file>', 'path to config file')
    .action(async (csvFile, options) => {
      try {
        // Check Lighthouse dependency before running audit
        const lighthouseAvailable = await checkLighthouseDependency();

        if (!lighthouseAvailable) {
          console.error('\nCannot proceed without Lighthouse.');
          process.exit(4); // Exit code 4: Dependency missing
        }

        // Run audit command
        await auditCommand(csvFile, options);
      } catch (error) {
        console.error(`\nError: ${error.message}`);
        process.exit(5); // Exit code 5: Fatal error
      }
    });

  // Parse arguments
  await program.parseAsync(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(5);
  });
}
