/* eslint-disable */
export default {
  displayName: 'api-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
    '\\.(gql|graphql)$': './transform-graphql-jest-28-shim.js',
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'gql', 'graphql'],
  coverageDirectory: '../../coverage/api-e2e',
}
