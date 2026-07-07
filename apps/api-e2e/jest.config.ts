/* eslint-disable */
import { readFileSync } from 'fs'
import { join } from 'path'
import { pathsToModuleNameMapper } from 'ts-jest'

// The e2e spec imports the real Express app (`~api/main`) and drives it with
// supertest, which pulls in the whole api dependency graph (the `auth` lib,
// every resolver, `~common`, …). Jest does not read tsconfig `paths`, so those
// aliases must be mapped here or the imports won't resolve at runtime.
const { compilerOptions } = JSON.parse(
  readFileSync(join(__dirname, '../../tsconfig.base.json'), 'utf-8'),
)

export default {
  displayName: 'api-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  transform: {
    // isolatedModules = transpile only; don't type-check the entire api graph
    // through this project's tsconfig (that's `api:typecheck`'s job).
    '^.+\\.[tj]s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json', isolatedModules: true },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../../',
  }),
  coverageDirectory: '../../coverage/apps/api-e2e',
}
