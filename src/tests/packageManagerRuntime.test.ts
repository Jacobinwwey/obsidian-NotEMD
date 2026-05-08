import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const {
    buildPackageManagerRuntime,
    packageManagerCandidates
} = require('../../scripts/lib/package-manager-runtime.js');

describe('package manager runtime helper', () => {
    function createTempWorkspace(): string {
        return fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-package-manager-runtime-'));
    }

    test('prefers native pnpm before fallback wrappers', () => {
        expect(packageManagerCandidates()).toEqual([
            { command: 'pnpm', versionArgs: ['--version'], prefix: [] },
            { command: 'corepack', versionArgs: ['pnpm', '--version'], prefix: ['pnpm'] },
            { command: 'bun', versionArgs: ['x', 'pnpm', '--version'], prefix: ['x', 'pnpm'] }
        ]);
    });

    test('keeps PATH unchanged when native pnpm is already available', () => {
        const tempRoot = createTempWorkspace();

        try {
            const runtime = buildPackageManagerRuntime(
                { command: 'pnpm', versionArgs: ['--version'], prefix: [] },
                tempRoot
            );

            expect(runtime.command).toBe('pnpm');
            expect(runtime.prefix).toEqual([]);
            expect(runtime.shimDir).toBeNull();
            expect(runtime.env.PATH).toBe(process.env.PATH);
            expect(fs.existsSync(path.join(tempRoot, '.notemd-package-manager-bin', 'pnpm'))).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test.each([
        {
            candidate: { command: 'corepack', versionArgs: ['pnpm', '--version'], prefix: ['pnpm'] },
            expectedSnippet: 'exec corepack pnpm "$@"'
        },
        {
            candidate: { command: 'bun', versionArgs: ['x', 'pnpm', '--version'], prefix: ['x', 'pnpm'] },
            expectedSnippet: 'exec bun x pnpm "$@"'
        }
    ])('creates an inheritable pnpm shim for $candidate.command fallbacks', ({ candidate, expectedSnippet }) => {
        const tempRoot = createTempWorkspace();

        try {
            const runtime = buildPackageManagerRuntime(candidate, tempRoot);
            const shimDir = path.join(tempRoot, '.notemd-package-manager-bin');
            const shimPath = path.join(shimDir, 'pnpm');

            expect(runtime.command).toBe(candidate.command);
            expect(runtime.prefix).toEqual(candidate.prefix);
            expect(runtime.shimDir).toBe(shimDir);
            expect(runtime.env.PATH?.split(path.delimiter)[0]).toBe(shimDir);
            expect(fs.existsSync(shimPath)).toBe(true);
            expect(fs.readFileSync(shimPath, 'utf8')).toContain(expectedSnippet);
            expect(fs.statSync(shimPath).mode & 0o111).not.toBe(0);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });
});
