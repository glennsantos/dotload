#!/usr/bin/env node

/**
 * ============================================================================
 * FRONTEND USER JOURNEY TEST RUNNER
 * ============================================================================
 * 
 * Runs complete frontend tests simulating user journeys:
 * 1. Authentication (Login/Register)
 * 2. Product Creation (Seller Journey)
 * 3. Purchase Flow (Buyer Journey)
 * 4. Payout Management (Seller Journey)
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Frontend User Journey Tests...\n');

const testSuites = [
  {
    name: '🔐 Authentication Flow',
    path: 'tests/frontend/auth/login.test.tsx',
    description: 'User login, registration, and session management'
  },
  {
    name: '📦 Product Creation Flow',
    path: 'tests/frontend/products/product-creation.test.tsx',
    description: 'Seller creates and publishes digital products'
  },
  {
    name: '💳 Purchase & Checkout Flow',
    path: 'tests/frontend/purchases/checkout.test.tsx',
    description: 'Buyer purchases products and completes payment'
  },
  {
    name: '💰 Payout Management Flow',
    path: 'tests/frontend/dashboard/payout.test.tsx',
    description: 'Seller manages earnings and requests payouts'
  }
];

let currentIndex = 0;
const results = [];

function runNextTest() {
  if (currentIndex >= testSuites.length) {
    printSummary();
    return;
  }

  const suite = testSuites[currentIndex];
  console.log(`\n📋 Running: ${suite.name}`);
  console.log(`📝 Description: ${suite.description}`);
  console.log(`📁 Path: ${suite.path}`);
  console.log('─'.repeat(60));

  const child = spawn('pnpm', ['test', suite.path], {
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ ${suite.name} - PASSED`);
      results.push({
        suite: suite.name,
        status: '✅ PASSED'
      });
    } else {
      console.log(`❌ ${suite.name} - FAILED`);
      results.push({
        suite: suite.name,
        status: '❌ FAILED'
      });
    }
    
    currentIndex++;
    runNextTest();
  });

  child.on('error', (error) => {
    console.log(`💥 ${suite.name} - ERROR: ${error.message}`);
    results.push({
      suite: suite.name,
      status: '💥 ERROR'
    });
    
    currentIndex++;
    runNextTest();
  });
}

function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 FRONTEND USER JOURNEY TEST SUMMARY');
  console.log('='.repeat(80));

  results.forEach(result => {
    console.log(`${result.status} ${result.suite}`);
  });

  const passed = results.filter(r => r.status.includes('PASSED')).length;
  const failed = results.filter(r => r.status.includes('FAILED') || r.status.includes('ERROR')).length;
  const total = results.length;

  console.log('\n' + '─'.repeat(80));
  console.log(`🎯 OVERALL RESULTS:`);
  console.log(`   ✅ Suites Passed: ${passed}`);
  console.log(`   ❌ Suites Failed: ${failed}`);
  console.log(`   📊 Total Suites: ${total}`);
  console.log(`   📈 Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);

  if (failed === 0) {
    console.log('\n🎉 All frontend user journey tests passed!');
    console.log('✨ Your e-commerce platform frontend is working correctly!');
  } else {
    console.log('\n⚠️  Some test suites failed. Please review the results above.');
    console.log('🔧 Fix the failing tests to ensure complete user journey coverage.');
  }

  console.log('\n' + '='.repeat(80));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Start running tests
runNextTest(); 