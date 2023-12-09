/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>/tests/'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '.*\\.(ts)$': 'ts-jest',
  },
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
}
