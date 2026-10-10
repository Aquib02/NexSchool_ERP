import mongoose from 'mongoose';
import { globalSearch } from '../controllers/searchController.js';

console.log('----------------------------------------------------');
console.log('School ERP - Global Search Controller Unit Tests');
console.log('----------------------------------------------------');

let passed = 0;
let failed = 0;

const assert = (condition, title) => {
  if (condition) {
    console.log(`  ✓ PASS: ${title}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${title}`);
    failed++;
  }
};

const runSearchTests = async () => {
  try {
    // Test 1: Empty query returns empty arrays without error
    let mockStatus = 200;
    let mockResponse = null;

    const mockRes = {
      status: (code) => {
        mockStatus = code;
        return mockRes;
      },
      json: (data) => {
        mockResponse = data;
        return mockRes;
      },
    };

    await globalSearch({ query: { q: '' } }, mockRes);
    assert(mockResponse && mockResponse.success === true, 'Empty query returns success: true');
    assert(
      Array.isArray(mockResponse.data.students) && mockResponse.data.students.length === 0,
      'Empty query returns empty students array'
    );
    assert(
      Array.isArray(mockResponse.data.staff) && mockResponse.data.staff.length === 0,
      'Empty query returns empty staff array'
    );
    assert(
      Array.isArray(mockResponse.data.admissions) && mockResponse.data.admissions.length === 0,
      'Empty query returns empty admissions array'
    );

    // Test 2: Query with special regex characters doesn't throw or crash
    let specialQuerySuccess = false;
    try {
      await globalSearch({ query: { q: '[test](special.*+?)' } }, mockRes);
      specialQuerySuccess = mockResponse && mockResponse.success === true;
    } catch (e) {
      specialQuerySuccess = false;
    }
    assert(specialQuerySuccess, 'Special regex characters are safely escaped');

    console.log(`\n====================================================`);
    console.log(`SEARCH TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================\n`);

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Fatal search test error:', err);
    process.exit(1);
  }
};

runSearchTests();
