export default {
  testEnvironment: 'node',
  transform: {},
  transformIgnorePatterns: [
    'node_modules/'
  ],
  moduleFileExtensions: ['js', 'mjs'],
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  setupFiles: ['./jest.setup.js']
};
