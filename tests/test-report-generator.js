#!/usr/bin/env node

/**
 * ============================================================================
 * AUTOMATED TEST REPORT GENERATOR
 * ============================================================================
 * 
 * This script runs the test suite and generates a comprehensive findings report
 * including test results, coverage analysis, and recommendations.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestReportGenerator {
  constructor() {
    this.reportData = {
      timestamp: new Date().toISOString(),
      summary: {},
      testResults: {},
      coverage: {},
      issues: [],
      recommendations: [],
      codebaseAnalysis: {}
    };
  }

  async generateReport() {
    console.log('🧪 Generating Test Report...\n');
    
    try {
      // Analyze codebase structure
      await this.analyzeCodebase();
      
      // Run tests and capture results
      await this.runTests();
      
      // Generate coverage report
      await this.generateCoverage();
      
      // Analyze test issues
      await this.analyzeIssues();
      
      // Generate recommendations
      await this.generateRecommendations();
      
      // Save report
      await this.saveReport();
      
      console.log('✅ Test report generated successfully!');
      
    } catch (error) {
      console.error('❌ Error generating test report:', error.message);
      this.reportData.summary.status = 'FAILED';
      this.reportData.summary.error = error.message;
      await this.saveReport();
    }
  }

  async analyzeCodebase() {
    console.log('📁 Analyzing codebase structure...');
    
    const analysis = {
      components: this.countFiles('components', ['.tsx', '.jsx']),
      pages: this.countFiles('app', ['.tsx', '.jsx']),
      utils: this.countFiles('lib', ['.ts', '.js']),
      tests: this.countFiles('tests', ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx']),
      totalLines: 0
    };
    
    // Count total lines of code
    try {
      const result = execSync('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .next | xargs wc -l | tail -1', { encoding: 'utf8' });
      analysis.totalLines = parseInt(result.trim().split(' ')[0]) || 0;
    } catch (error) {
      analysis.totalLines = 'Unable to calculate';
    }
    
    this.reportData.codebaseAnalysis = analysis;
  }

  countFiles(directory, extensions) {
    try {
      if (!fs.existsSync(directory)) return 0;
      
      let count = 0;
      const files = fs.readdirSync(directory, { recursive: true });
      
      for (const file of files) {
        if (extensions.some(ext => file.endsWith(ext))) {
          count++;
        }
      }
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  async runTests() {
    console.log('🧪 Running test suite...');
    
    try {
      // Run tests with JSON output
      const result = execSync('npm test -- --json --passWithNoTests', { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const testResults = JSON.parse(result);
      this.reportData.testResults = testResults;
      this.reportData.summary.status = testResults.success ? 'PASSED' : 'FAILED';
      
    } catch (error) {
      // Parse error output for test failures
      this.reportData.summary.status = 'FAILED';
      this.reportData.testResults = {
        success: false,
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        testResults: [],
        error: error.message
      };
      
      // Extract test failures from stderr
      if (error.stdout) {
        this.parseTestFailures(error.stdout);
      }
    }
  }

  parseTestFailures(output) {
    const lines = output.split('\n');
    const failures = [];
    
    let currentFailure = null;
    
    for (const line of lines) {
      if (line.includes('FAIL ')) {
        if (currentFailure) failures.push(currentFailure);
        currentFailure = {
          file: line.replace('FAIL ', '').trim(),
          errors: []
        };
      } else if (line.includes('●') && currentFailure) {
        currentFailure.errors.push(line.trim());
      }
    }
    
    if (currentFailure) failures.push(currentFailure);
    this.reportData.testResults.failures = failures;
  }

  async generateCoverage() {
    console.log('📊 Generating coverage report...');
    
    try {
      const result = execSync('npm run test:coverage -- --passWithNoTests --silent', { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10
      });
      
      // Parse coverage from output
      this.parseCoverageOutput(result);
      
    } catch (error) {
      this.reportData.coverage = {
        status: 'FAILED',
        error: error.message,
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      };
    }
  }

  parseCoverageOutput(output) {
    const lines = output.split('\n');
    const coverage = {
      status: 'SUCCESS',
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
      files: []
    };
    
    // Look for coverage summary
    for (const line of lines) {
      if (line.includes('All files')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 5) {
          coverage.statements = parseFloat(parts[1]) || 0;
          coverage.branches = parseFloat(parts[2]) || 0;
          coverage.functions = parseFloat(parts[3]) || 0;
          coverage.lines = parseFloat(parts[4]) || 0;
        }
      }
    }
    
    this.reportData.coverage = coverage;
  }

  async analyzeIssues() {
    console.log('🔍 Analyzing test issues...');
    
    const issues = [];
    
    // Check for common issues
    if (this.reportData.testResults.failures) {
      for (const failure of this.reportData.testResults.failures) {
        if (failure.errors.some(e => e.includes('Request is not defined'))) {
          issues.push({
            type: 'ENVIRONMENT_ISSUE',
            severity: 'HIGH',
            description: 'NextRequest/Request not available in test environment',
            file: failure.file,
            solution: 'Need to mock Web APIs or use different test environment'
          });
        }
        
        if (failure.errors.some(e => e.includes('Cannot find module'))) {
          issues.push({
            type: 'MISSING_MODULE',
            severity: 'HIGH',
            description: 'Test trying to import non-existent component',
            file: failure.file,
            solution: 'Update test imports to match actual component structure'
          });
        }
      }
    }
    
    // Check test coverage
    if (this.reportData.coverage.lines < 70) {
      issues.push({
        type: 'LOW_COVERAGE',
        severity: 'MEDIUM',
        description: `Line coverage is ${this.reportData.coverage.lines}%, below 70% threshold`,
        solution: 'Add more comprehensive tests for uncovered code paths'
      });
    }
    
    // Check for missing test files
    const componentCount = this.reportData.codebaseAnalysis.components;
    const testCount = this.reportData.codebaseAnalysis.tests;
    
    if (testCount < componentCount * 0.5) {
      issues.push({
        type: 'INSUFFICIENT_TESTS',
        severity: 'MEDIUM',
        description: `Only ${testCount} test files for ${componentCount} components`,
        solution: 'Create more test files to cover existing components'
      });
    }
    
    this.reportData.issues = issues;
  }

  async generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    const recommendations = [];
    
    // Environment setup recommendations
    if (this.reportData.issues.some(i => i.type === 'ENVIRONMENT_ISSUE')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Environment Setup',
        title: 'Fix Test Environment Configuration',
        description: 'Configure Jest to properly mock Web APIs and Next.js server components',
        steps: [
          'Add global mocks for Request, Response, and other Web APIs',
          'Configure test environment to use node environment for API tests',
          'Set up proper Next.js test configuration'
        ]
      });
    }
    
    // Component structure recommendations
    if (this.reportData.issues.some(i => i.type === 'MISSING_MODULE')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Test Structure',
        title: 'Update Test Imports',
        description: 'Align test imports with actual component structure',
        steps: [
          'Audit existing components and their file paths',
          'Update test imports to match actual component locations',
          'Create missing components or remove invalid tests'
        ]
      });
    }
    
    // Coverage improvements
    if (this.reportData.coverage.lines < 80) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Test Coverage',
        title: 'Improve Test Coverage',
        description: 'Increase test coverage to meet quality standards',
        steps: [
          'Identify uncovered code paths using coverage report',
          'Add unit tests for utility functions',
          'Add integration tests for critical user flows',
          'Add edge case testing for error scenarios'
        ]
      });
    }
    
    // Performance recommendations
    recommendations.push({
      priority: 'LOW',
      category: 'Performance',
      title: 'Optimize Test Performance',
      description: 'Improve test execution speed and reliability',
      steps: [
        'Use test.concurrent for independent tests',
        'Implement proper test cleanup and teardown',
        'Mock external dependencies consistently',
        'Use test.each for parameterized tests'
      ]
    });
    
    this.reportData.recommendations = recommendations;
  }

  async saveReport() {
    const reportDir = path.join(process.cwd(), 'tests', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFile = path.join(reportDir, `test-report-${timestamp}.json`);
    const mdFile = path.join(reportDir, `test-report-${timestamp}.md`);
    const latestFile = path.join(reportDir, 'latest-test-report.json');
    
    // Save JSON report
    fs.writeFileSync(jsonFile, JSON.stringify(this.reportData, null, 2));
    fs.writeFileSync(latestFile, JSON.stringify(this.reportData, null, 2));
    
    // Generate Markdown report
    const mdContent = this.generateMarkdownReport();
    fs.writeFileSync(mdFile, mdContent);
    
    console.log(`📄 Reports saved:`);
    console.log(`   JSON: ${jsonFile}`);
    console.log(`   Markdown: ${mdFile}`);
    console.log(`   Latest: ${latestFile}`);
  }

  generateMarkdownReport() {
    const { summary, codebaseAnalysis, testResults, coverage, issues, recommendations } = this.reportData;
    
    return `# Test Report

**Generated:** ${this.reportData.timestamp}
**Status:** ${summary.status || 'UNKNOWN'}

## 📊 Summary

- **Total Components:** ${codebaseAnalysis.components}
- **Total Test Files:** ${codebaseAnalysis.tests}
- **Lines of Code:** ${codebaseAnalysis.totalLines}
- **Test Status:** ${summary.status}

## 🧪 Test Results

${testResults.failures ? `
### Failed Tests
${testResults.failures.map(f => `
- **${f.file}**
  ${f.errors.map(e => `  - ${e}`).join('\n')}
`).join('\n')}
` : 'No test failures detected.'}

## 📈 Coverage Report

- **Lines:** ${coverage.lines}%
- **Functions:** ${coverage.functions}%
- **Branches:** ${coverage.branches}%
- **Statements:** ${coverage.statements}%

## ⚠️ Issues Found

${issues.length > 0 ? issues.map(issue => `
### ${issue.type} (${issue.severity})
**Description:** ${issue.description}
${issue.file ? `**File:** ${issue.file}` : ''}
**Solution:** ${issue.solution}
`).join('\n') : 'No issues found.'}

## 💡 Recommendations

${recommendations.map(rec => `
### ${rec.title} (${rec.priority})
**Category:** ${rec.category}
**Description:** ${rec.description}

**Steps:**
${rec.steps.map(step => `- ${step}`).join('\n')}
`).join('\n')}

## 🔧 Next Steps

1. **Fix High Priority Issues:** Address environment setup and missing modules
2. **Improve Coverage:** Add tests for uncovered components and functions
3. **Enhance Test Quality:** Add edge cases and error scenario testing
4. **Optimize Performance:** Implement test performance improvements

---
*Report generated automatically by Test Report Generator*
`;
  }
}

// Run the report generator
if (require.main === module) {
  const generator = new TestReportGenerator();
  generator.generateReport().catch(console.error);
}

module.exports = TestReportGenerator; 