/**
 * Simple test script to verify CSV parsing works
 * Run with: node tests/test-csv-parsing.js
 */

import { readCsv } from '../src/services/csv-reader.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testCsvParsing() {
  console.log('Testing CSV parsing...\n');

  try {
    // Test 1: Simple CSV with valid URLs
    console.log('Test 1: Parsing sample-urls.csv');
    const samplePath = join(__dirname, 'fixtures/sample-urls.csv');
    const result1 = await readCsv(samplePath);

    console.log('URLs found:', result1.urls.length);
    console.log('Metadata:', result1.metadata);
    console.log('Valid URLs:', result1.urls);
    console.log('✓ Test 1 passed\n');

    // Test 2: CSV with mixed valid and invalid URLs
    console.log('Test 2: Parsing mixed-urls.csv');
    const mixedPath = join(__dirname, 'fixtures/mixed-urls.csv');
    const result2 = await readCsv(mixedPath);

    console.log('URLs found:', result2.urls.length);
    console.log('Metadata:', result2.metadata);
    console.log('Valid URLs:', result2.urls);
    console.log('Invalid URLs:', result2.metadata.invalidUrlDetails);
    console.log('✓ Test 2 passed\n');

    // Test 3: Non-existent file
    console.log('Test 3: Non-existent file error handling');
    try {
      await readCsv('/nonexistent/file.csv');
      console.log('✗ Test 3 failed - should have thrown error');
    } catch (error) {
      console.log('Expected error:', error.message);
      console.log('✓ Test 3 passed\n');
    }

    console.log('All tests passed!');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testCsvParsing();
