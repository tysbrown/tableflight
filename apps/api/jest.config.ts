/* eslint-disable */
export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '\\.(gql|graphql)$': './transform-graphql-jest-28-shim.js',
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'gql', 'graphql'],
  coverageDirectory: '../../coverage/apps/api',
}
