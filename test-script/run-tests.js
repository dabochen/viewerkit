#!/usr/bin/env node
/**
 * ViewerKit Test Runner
 * Runs all test suites and reports results
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 ViewerKit Test Suite Runner');
console.log('==============================\n');

function runTest(testFile, testName) {
  return new Promise((resolve) => {
    console.log(`▶️  Running ${testName}...`);
    
    const child = spawn('node', [testFile], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testName} passed\n`);
        resolve(true);
      } else {
        console.log(`❌ ${testName} failed with exit code ${code}\n`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.log(`❌ ${testName} failed to run:`, error.message);
      resolve(false);
    });
  });
}

async function runAllTests() {
  const tests = [
    {
      file: 'feature-tests.js',
      name: 'Feature Module Tests'
    },
    {
      file: 'integration-test.js', 
      name: 'Integration Tests'
    },
    {
      file: 'phase4-tests.js',
      name: 'Phase 4: React Hooks & UI Components'
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  console.log(`🚀 Starting ${total} test suites...\n`);
  
  for (const test of tests) {
    const testPath = path.join(__dirname, test.file);
    const success = await runTest(testPath, test.name);
    if (success) passed++;
  }
  
  console.log('='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! ViewerKit is ready for production.');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
}); 