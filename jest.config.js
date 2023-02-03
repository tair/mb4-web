/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  roots: ['./tests'],
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src'],
}
