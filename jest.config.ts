/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],

  globalSetup: '<rootDir>/src/shared/testing/setup-wrapper.ts',
  globalTeardown: '<rootDir>/src/shared/testing/teardown-wrapper.ts',

  setupFiles: ['<rootDir>/src/shared/testing/jest-setup.ts'],

  testTimeout: 30000,

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  testMatch: ['**/*.spec.ts', '**/*.integration.spec.ts'],

  coverageProvider: 'v8',
  
  coverageDirectory: '<rootDir>/coverage',
  
  coverageReporters: ['text', 'lcov', 'clover', 'json'],
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.integration.spec.ts',
    '!src/shared/testing/**',
    '!src/server.ts',
  ],
};

export default config;
