/**
 * Simple test script to verify Lighthouse integration works
 * Run with: node tests/test-lighthouse-integration.js
 *
 * WARNING: This test runs actual Lighthouse audits and will take time
 * It requires Chrome/Chromium to be installed
 */

import { runLighthouseAudit } from '../src/services/lighthouse-runner.js';
import { logInfo } from '../src/lib/logger.js';

async function testLighthouseIntegration() {
  console.log('Testing Lighthouse integration...\n');
  console.log('WARNING: This will run a real Lighthouse audit on example.com');
  console.log('This may take 30-60 seconds...\n');

  try {
    // Test a simple, fast site
    const testUrl = 'https://example.com';
    const options = {
      device: 'mobile',
      timeout: 90
    };

    console.log(`Running audit on ${testUrl}...`);
    const startTime = Date.now();

    const result = await runLighthouseAudit(testUrl, options);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    if (result.success) {
      console.log(`\n✓ Audit successful! (${duration}s)`);
      console.log('\nAudit Details:');
      console.log('- Final URL:', result.url);
      console.log('- Requested URL:', result.requestedUrl);
      console.log('- Lighthouse Version:', result.lighthouseVersion);
      console.log('- Audit Duration:', result.auditDuration, 'ms');
      console.log('- Retry Attempt:', result.retryAttempt);

      console.log('\nCore Web Vitals Metrics:');
      console.log('- LCP:', result.metrics.lcp, 'ms (', result.metrics.lcpScore, ')');
      console.log('- INP:', result.metrics.inp, 'ms (', result.metrics.inpScore, ')');
      console.log('- CLS:', result.metrics.cls, '(', result.metrics.clsScore, ')');
      console.log('- TTFB:', result.metrics.ttfb, 'ms (', result.metrics.ttfbScore, ')');
      console.log('- TBT:', result.metrics.tbt, 'ms');
      console.log('- Performance Score:', result.metrics.performanceScore, '/100');

      console.log('\n✓ Lighthouse integration test passed!');
    } else {
      console.log('✗ Audit failed:', result.error.message);
      console.log('Error code:', result.error.code);
      console.log('\nThis may be due to:');
      console.log('- Chrome/Chromium not being installed');
      console.log('- Network connectivity issues');
      console.log('- Insufficient system resources');
      process.exit(1);
    }

  } catch (error) {
    console.error('Test failed with exception:', error);
    process.exit(1);
  }
}

// Only run if Chrome is likely available
console.log('Checking for Chrome/Chromium...');
console.log('If this hangs or fails, ensure Chrome/Chromium is installed.\n');

testLighthouseIntegration();
