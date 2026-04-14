module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/ref/', '/.worktrees/'],
  modulePathIgnorePatterns: ['<rootDir>/.worktrees/', '<rootDir>/ref/'],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/src/__mocks__/obsidian.ts',
    '^mermaid$': '<rootDir>/src/__mocks__/mermaid.ts'
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false
      }
    ]
  }
};
