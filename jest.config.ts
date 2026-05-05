export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['**/backend/src/tests/*.test.ts'],
    testTimeout: 30000,
    setupFiles: ['<rootDir>/backend/src/tests/setup.ts']
};
