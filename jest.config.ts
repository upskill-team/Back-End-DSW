/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],

  // Global setup/teardown para MongoDB Memory Server
  globalSetup: '<rootDir>/src/shared/testing/setup-wrapper.ts',
  globalTeardown: '<rootDir>/src/shared/testing/teardown-wrapper.ts',

  // ESTA ES LA CLAVE: Carga reflect-metadata antes que nada
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
        // Usamos la config del tsconfig para evitar conflictos
        tsconfig: 'tsconfig.json', 
      },
    ],
  },

  testMatch: ['**/*.spec.ts', '**/*.integration.spec.ts'],
  
  coverageProvider: 'v8',
};