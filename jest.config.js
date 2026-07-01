module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'txt'],
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/ref/', '/.worktrees/', '/.cache/', '/.tmp_repo_saga_tool/'],
  modulePathIgnorePatterns: ['<rootDir>/.worktrees/', '<rootDir>/.cache/', '<rootDir>/.tmp_repo_saga_tool/', '<rootDir>/ref/'],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/src/__mocks__/obsidian.ts',
    '^mermaid$': '<rootDir>/src/__mocks__/mermaid.ts'
  },
  transform: {
    '^.+\\.txt$': '<rootDir>/jest-txt-transform.js',
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false
      }
    ]
  }
};
