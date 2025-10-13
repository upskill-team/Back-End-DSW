/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm', // <--- PRESET CLAVE PARA MÓDULOS ESM
  testEnvironment: 'node',
  
  // Le dice a Jest que las pruebas están en la carpeta 'src'
  roots: ['<rootDir>/src'],

  // Ignora completamente la carpeta 'dist' para todo
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  
  // Resuelve la extensión .js en los imports de TypeScript
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};