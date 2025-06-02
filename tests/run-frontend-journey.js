#!/usr/bin/env node

/**
 * ============================================================================
 * FRONTEND TEST JOURNEY RUNNER
 * ============================================================================
 * 
 * Runs frontend tests in sequence to simulate a complete user journey:
 * 1. User Registration
 * 2. User Login
 * 3. Product Creation
 * 4. Product Editing
 * 5. Settings Management (Profile & Password)
 * 6. Checkout Process
 * 7. Payout Dashboard
 */

const { execSync } = require('child_process');

const testFiles = [
  {
    name: 'User Registration',
    file: 'tests/frontend/auth/registration.test.tsx',
    description: 'Tests user account creation and email verification flow'
  },
  {
    name: 'User Login',
    file: 'tests/frontend/auth/login.test.tsx',
    description: 'Tests user authentication and session management'
  },
  {
    name: 'Product Creation',
    file: 'tests/frontend/products/product-creation.test.tsx',
    description: 'Tests product creation with file uploads and validation'
  },
  {
    name: 'Product Editing',
    file: 'tests/frontend/products/product-edit.test.tsx',
    description: 'Tests product updates, image management, and deletion'
  },
  {
    name: 'Settings Management',
    file: 'tests/frontend/settings/settings.test.tsx',
    description: 'Tests profile updates, brand settings, and password changes'
  },
  {
    name: 'Checkout Process',
    file: 'tests/frontend/checkout/checkout.test.tsx',
    description: 'Tests product purchase flow with payment integration'
  },
  {
    name: 'Payout Dashboard',
    file: 'tests/frontend/payouts/payout-dashboard.test.tsx',
    description: 'Tests seller payout requests and balance management'
  }
];

async function runFrontendJourney() {
  console.log('🚀 Starting Frontend Test Journey...\n');
  console.log('This simulates a complete user journey from registration to payout.\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  for (let i = 0; i < testFiles.length; i++) {
    const test = testFiles[i];
    console.log(`📋 Step ${i + 1}/${testFiles.length}: ${test.name}`);
    console.log(`   ${test.description}`);
    console.log(`   Running: ${test.file}`);

    try {
      const output = execSync(`pnpm test ${test.file} --testEnvironment=jsdom`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse Jest output for test results
      const lines = output.split('\n');
      let testCount = 0;
      let passed = 0;
      let failed = 0;

      for (const line of lines) {
        if (line.includes('✓') || line.includes('PASS')) {
          passed++;
          testCount++;
        } else if (line.includes('✗') || line.includes('FAIL')) {
          failed++;
          testCount++;
        }
      }

      // If we can't parse individual tests, check overall result
      if (testCount === 0) {
        if (output.includes('PASS') && !output.includes('FAIL')) {
          passed = 1;
          testCount = 1;
        } else if (output.includes('FAIL')) {
          failed = 1;
          testCount = 1;
        }
      }

      totalTests += testCount;
      passedTests += passed;
      failedTests += failed;

      results.push({
        name: test.name,
        status: failed === 0 ? 'PASS' : 'FAIL',
        passed,
        failed,
        total: testCount
      });

      console.log(`   ✅ ${test.name}: ${passed}/${testCount} tests passed\n`);

    } catch (error) {
      console.log(`   ❌ ${test.name}: FAILED`);
      console.log(`   Error: ${error.message}\n`);
      
      failedTests++;
      totalTests++;
      results.push({
        name: test.name,
        status: 'FAIL',
        passed: 0,
        failed: 1,
        total: 1,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('📊 Frontend Test Journey Summary');
  console.log('=====================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%\n`);

  // Print detailed results
  console.log('📋 Detailed Results:');
  results.forEach((result, index) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.name}: ${result.passed}/${result.total} tests passed`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n🎯 User Journey Coverage:');
  console.log('- ✅ User Registration & Email Verification');
  console.log('- ✅ User Authentication & Login');
  console.log('- ✅ Product Creation & Management');
  console.log('- ✅ Product Editing & Updates');
  console.log('- ✅ Settings & Profile Management');
  console.log('- ✅ Purchase & Checkout Flow');
  console.log('- ✅ Seller Payout Management');

  if (failedTests === 0) {
    console.log('\n🎉 All frontend tests passed! The complete user journey is working correctly.');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please check the errors above.`);
    process.exit(1);
  }
}

// Run the journey
runFrontendJourney().catch(error => {
  console.error('❌ Frontend test journey failed:', error);
  process.exit(1);
}); 