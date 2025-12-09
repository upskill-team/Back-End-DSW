/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],

  // Global setup/teardown para MongoDB Memory Server
  globalSetup: '<rootDir>/src/shared/testing/setup-wrapper.ts',
  globalTeardown: '<rootDir>/src/shared/testing/teardown-wrapper.ts',

  // Timeout extendido para MongoDB Memory Server (primera ejecución descarga binarios)
  testTimeout: 30000,

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        diagnostics: {
          ignoreCodes: [1378, 151001],
        },
        tsconfig: {
          module: 'esnext',
          target: 'es2022',
        },
      },
    ],
  },

  // Patrones de tests
  testMatch: ['**/*.spec.ts', '**/*.integration.spec.ts'],

  // Configuración de cobertura
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.integration.spec.ts',
    '!src/types/**',
    '!src/migrations/**',
    '!src/shared/testing/**',
    '!src/server.ts',
    '!src/app.ts',
  ],
  
  coverageProvider: 'v8',
};
