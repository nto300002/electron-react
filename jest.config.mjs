/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],  // .tsファイルのテストを探す
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testEnvironment: 'node',
  // All imported modules in your tests should be mocked automatically
  // automock: false,
  globalSetup: '<rootDir>/src/test/globalSetups.ts',

  coverageProvider: 'v8',
};

export default config;
