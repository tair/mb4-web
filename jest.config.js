/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  roots: ["<rootDir>/tests/"],
  testMatch: [
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  transform: {
    ".*\\.(vue)$": "vue-jest",
    ".*\\.(ts)$": "ts-jest"
  },
}
