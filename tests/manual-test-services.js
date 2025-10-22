/**
 * Manual Test Script for Phase 4 & Phase 5
 *
 * Tests report generator and data storage services
 * Run with: node tests/manual-test-services.js
 */

import { createAudit, createFailedAudit, AuditStatus, DeviceMode } from '../src/models/audit.js';
import { createMetrics } from '../src/models/metrics.js';
import { generateAndSaveReport, generateAndSaveErrorReport } from '../src/services/report-generator.js';
import { saveAuditData, loadAuditData, listAuditDataFiles } from '../src/services/data-storage.js';
import fs from 'fs/promises';
import path from 'path';

const TEST_REPORTS_DIR = './test-reports';
const TEST_DATA_DIR = './test-data';

// Mock Lighthouse Result object
const mockLHR = {
  finalUrl: 'https://example.com/',
  requestedUrl: 'https://example.com',
  fetchTime: '2025-10-22T14:30:00.000Z',
  lighthouseVersion: '11.3.0',
  categories: {
    performance: { score: 0.92 }
  },
  audits: {
    'largest-contentful-paint': { numericValue: 1800 },
    'interaction-to-next-paint': { numericValue: 150 },
    'cumulative-layout-shift': { numericValue: 0.05 },
    'server-response-time': { numericValue: 200 },
    'total-blocking-time': { numericValue: 150 }
  }
};

async function cleanup() {
  console.log('Cleaning up test directories...');
  try {
    await fs.rm(TEST_REPORTS_DIR, { recursive: true, force: true });
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors if directories don't exist
  }
}

async function testReportGenerator() {
  console.log('\n=== Testing Report Generator Service ===\n');

  // Test 1: Generate HTML report for successful audit
  console.log('Test 1: Generate HTML report for successful audit');
  try {
    const filePath = await generateAndSaveReport(
      mockLHR,
      'https://example.com',
      TEST_REPORTS_DIR
    );
    console.log(`✓ HTML report saved to: ${filePath}`);

    // Verify file exists and has content
    const stats = await fs.stat(filePath);
    console.log(`  File size: ${Math.round(stats.size / 1024)} KB`);

    if (stats.size < 1000) {
      throw new Error('HTML file seems too small');
    }
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`);
    return false;
  }

  // Test 2: Generate error report for failed audit
  console.log('\nTest 2: Generate error report for failed audit');
  try {
    const failedAudit = createFailedAudit(
      'https://slow-site.example.com',
      'Network timeout after 60 seconds',
      DeviceMode.MOBILE,
      120500,
      '11.3.0',
      1,
      AuditStatus.TIMEOUT
    );

    const filePath = await generateAndSaveErrorReport(
      failedAudit,
      TEST_REPORTS_DIR
    );
    console.log(`✓ Error report saved to: ${filePath}`);

    // Verify file exists and contains error message
    const content = await fs.readFile(filePath, 'utf-8');
    if (!content.includes('Network timeout')) {
      throw new Error('Error message not found in report');
    }
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`);
    return false;
  }

  // Test 3: Verify multiple reports have separate files
  console.log('\nTest 3: Verify multiple reports create separate files');
  try {
    await generateAndSaveReport(
      mockLHR,
      'https://another-site.com',
      TEST_REPORTS_DIR
    );

    const files = await fs.readdir(TEST_REPORTS_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    console.log(`✓ Found ${htmlFiles.length} HTML files`);

    if (htmlFiles.length < 3) {
      throw new Error('Expected at least 3 HTML files');
    }

    console.log(`  Files: ${htmlFiles.join(', ')}`);
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`);
    return false;
  }

  return true;
}

async function testDataStorage() {
  console.log('\n=== Testing Data Storage Service ===\n');

  // Test 1: Save successful audit data
  console.log('Test 1: Save successful audit data with metrics');
  try {
    const audit = createAudit({
      url: 'https://example.com/',
      requestedUrl: 'https://example.com',
      timestamp: '2025-10-22T14:30:00.000Z',
      lighthouseVersion: '11.3.0',
      deviceMode: DeviceMode.MOBILE,
      auditDuration: 45230,
      status: AuditStatus.SUCCESS,
      retryAttempt: 0
    });

    const metrics = createMetrics({
      lcp: 1800,
      inp: 150,
      cls: 0.05,
      ttfb: 200,
      tbt: 150,
      performanceScore: 92
    });

    const filePath = await saveAuditData(audit, metrics, TEST_DATA_DIR);
    console.log(`✓ JSON data saved to: ${filePath}`);

    // Verify file exists
    const stats = await fs.stat(filePath);
    console.log(`  File size: ${stats.size} bytes`);
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`);
    return false;
  }

  // Test 2: Save failed audit data (metrics = null)
  console.log('\nTest 2: Save failed audit data (no metrics)');
  try {
    const failedAudit = createFailedAudit(
      'https://slow-site.example.com',
      'Network timeout after 60 seconds',
      DeviceMode.MOBILE,
      120500,
      '11.3.0',
      1,
      AuditStatus.TIMEOUT
    );

    const filePath = await saveAuditData(failedAudit, null, TEST_DATA_DIR);
    console.log(`✓ Failed audit JSON saved to: ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`);
    return false;
  }

  // Test 3: Load audit data
  console.log('\nTest 3: Load audit data from file');
  try {
    const files = await listAuditDataFiles(TEST_DATA_DIR);
    console.log(`✓ Found ${files.length} data files`);

    if (files.length < 2) {
      throw new Error('Expected at least 2 data files');
    }

    const filePath = path.join(TEST_DATA_DIR, files[0]);
    const data = await loadAuditData(filePath);

    if (!data || !data.audit) {
      throw new Error('Failed to load audit data');
    }

    console.log(`✓ Loaded audit data for: ${data.audit.requestedUrl}`);
    console.log(`  Status: ${data.audit.status}`);
    console.log(`  Timestamp: ${data.audit.timestamp}`);
    console.log(`  Domain: ${data.audit.domain}`);

    if (data.metrics) {
      console.log(`  LCP: ${data.metrics.lcp}ms (${data.metrics.lcpScore})`);
      console.log(`  INP: ${data.metrics.inp}ms (${data.metrics.inpScore})`);
      console.log(`  CLS: ${data.metrics.cls} (${data.metrics.clsScore})`);
    } else {
      console.log(`  Metrics: null (failed audit)`);
    }
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`);
    return false;
  }

  // Test 4: Verify JSON structure matches data-model.md
  console.log('\nTest 4: Verify JSON structure matches data-model.md');
  try {
    const files = await listAuditDataFiles(TEST_DATA_DIR);
    const filePath = path.join(TEST_DATA_DIR, files[0]);
    const data = await loadAuditData(filePath);

    // Check required fields per data-model.md
    const requiredAuditFields = [
      'url', 'requestedUrl', 'timestamp', 'domain',
      'lighthouseVersion', 'deviceMode', 'auditDuration',
      'status', 'retryAttempt'
    ];

    for (const field of requiredAuditFields) {
      if (!(field in data.audit)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    console.log('✓ All required audit fields present');

    if (data.metrics) {
      const requiredMetricsFields = [
        'lcp', 'lcpScore', 'inp', 'inpScore',
        'cls', 'clsScore', 'ttfb', 'ttfbScore',
        'tbt', 'performanceScore'
      ];

      for (const field of requiredMetricsFields) {
        if (!(field in data.metrics)) {
          throw new Error(`Missing required metrics field: ${field}`);
        }
      }

      console.log('✓ All required metrics fields present');
    }
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`);
    return false;
  }

  // Test 5: Multiple runs create separate files
  console.log('\nTest 5: Multiple runs create separate files');
  try {
    const audit = createAudit({
      url: 'https://another-site.com/',
      requestedUrl: 'https://another-site.com',
      timestamp: new Date().toISOString(),
      lighthouseVersion: '11.3.0',
      deviceMode: DeviceMode.DESKTOP,
      auditDuration: 52100,
      status: AuditStatus.SUCCESS,
      retryAttempt: 0
    });

    const metrics = createMetrics({
      lcp: 3200,
      inp: 450,
      cls: 0.15,
      ttfb: 1200,
      tbt: 580,
      performanceScore: 58
    });

    await saveAuditData(audit, metrics, TEST_DATA_DIR);

    const files = await listAuditDataFiles(TEST_DATA_DIR);
    console.log(`✓ Found ${files.length} data files`);

    if (files.length < 3) {
      throw new Error('Expected at least 3 data files');
    }

    console.log(`  Files: ${files.join(', ')}`);
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`);
    return false;
  }

  return true;
}

async function main() {
  console.log('Phase 4 & 5 Manual Test Suite\n');
  console.log('This script tests:');
  console.log('  - HTML report generation (Phase 4)');
  console.log('  - JSON data storage (Phase 5)');
  console.log('  - Directory creation');
  console.log('  - File naming conventions');
  console.log('  - Error handling\n');

  try {
    // Clean up previous test runs
    await cleanup();

    // Run tests
    const reportSuccess = await testReportGenerator();
    const storageSuccess = await testDataStorage();

    console.log('\n=== Test Summary ===\n');
    console.log(`Report Generator: ${reportSuccess ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Data Storage: ${storageSuccess ? '✓ PASS' : '✗ FAIL'}`);

    if (reportSuccess && storageSuccess) {
      console.log('\n✓ All tests passed!\n');
      console.log('Test files created in:');
      console.log(`  - ${TEST_REPORTS_DIR}/`);
      console.log(`  - ${TEST_DATA_DIR}/`);
      console.log('\nYou can manually inspect these files to verify:');
      console.log('  - HTML reports are self-contained and open in browser');
      console.log('  - JSON files match the structure in data-model.md');
      process.exit(0);
    } else {
      console.log('\n✗ Some tests failed\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Test suite failed with error:', error);
    process.exit(1);
  }
}

main();
