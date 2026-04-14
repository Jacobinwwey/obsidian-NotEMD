import * as fs from 'fs';
import * as path from 'path';

describe('tooling isolation config', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const jestConfigPath = path.join(repoRoot, 'jest.config.js');
    const tsconfigPath = path.join(repoRoot, 'tsconfig.json');

    test('ignores nested worktrees during test discovery and module crawling', () => {
        const jestConfig = require(jestConfigPath);

        expect(jestConfig.testPathIgnorePatterns).toEqual(
            expect.arrayContaining(['/node_modules/', '/ref/', '/.worktrees/'])
        );
        expect(jestConfig.modulePathIgnorePatterns).toEqual(
            expect.arrayContaining(['<rootDir>/.worktrees/', '<rootDir>/ref/'])
        );
    });

    test('excludes nested worktrees from the TypeScript compile scope', () => {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

        expect(tsconfig.exclude).toEqual(expect.arrayContaining(['ref', '.worktrees']));
    });
});
