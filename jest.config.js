const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Module name mapping for absolute imports and static assets
  moduleNameMapper: {
    // Specific mock mappings - these need to come before the general @/ mapping
    '^@/lib/discount-utils$': '<rootDir>/tests/__mocks__/discount-utils.js',
    '^jose$': '<rootDir>/tests/__mocks__/jose.js',
    '^cloudinary$': '<rootDir>/tests/__mocks__/cloudinary.js',
    // General path mappings
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    // Asset mappings
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  
  // Transform ignore patterns - allow transformation of ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@next|next)/)',
  ],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 