module.exports = {
  preset: 'ts-jest', // Le dice a Jest que use ts-jest para transpilar los archivos TypeScript
  testEnvironment: 'node', // Especifica que el entorno de prueba es Node.js
  // Opcional: para que Jest entienda los módulos ESM ('import/export')
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};