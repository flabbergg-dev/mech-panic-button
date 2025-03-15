import type { Config } from 'jest'
import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './'
})
 
// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  moduleNameMapper: {
    // ...
    '^@/components/(.*)$': '<rootDir>/components/$1',
  },
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Set up test environment variables
  setupFiles: ['<rootDir>/.env.test'],
  setupFilesAfterEnv: ['<rootDir>/singleton.ts'],
}
 
// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)