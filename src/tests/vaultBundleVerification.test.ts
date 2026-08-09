import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'verify-vault-bundle.js');

interface VaultBundleVerifier {
    verifyVaultBundle(options: { projectRoot: string; pluginDir: string }): {
        ok: boolean;
        manifestVersion: string;
        files: Array<{ matches: boolean }>;
    };
    parseArgs(argv: string[]): {
        vaultPath: string;
        pluginDir: string;
    };
}

function createFixture(): { root: string; pluginDir: string; cleanup: () => void } {
    const root = fs.mkdtempSync(path.join(repoRoot, '.tmp-vault-bundle-'));
    const pluginDir = path.join(root, 'vault', '.obsidian', 'plugins', 'notemd');
    fs.mkdirSync(pluginDir, { recursive: true });

    for (const fileName of ['main.js', 'styles.css']) {
        const content = fileName === 'main.js' ? 'bundle-content' : 'body { color: red; }';
        fs.writeFileSync(path.join(root, fileName), content, 'utf8');
        fs.writeFileSync(path.join(pluginDir, fileName), content, 'utf8');
    }
    const manifest = JSON.stringify({ id: 'notemd', version: '1.9.5' });
    fs.writeFileSync(path.join(root, 'manifest.json'), manifest, 'utf8');
    fs.writeFileSync(path.join(pluginDir, 'manifest.json'), manifest, 'utf8');

    return {
        root,
        pluginDir,
        cleanup: () => fs.rmSync(root, { recursive: true, force: true })
    };
}

describe('vault bundle verification', () => {
    test('accepts matching bundle files and manifest versions', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { verifyVaultBundle } = require(scriptPath) as VaultBundleVerifier;
        const fixture = createFixture();
        try {
            const result = verifyVaultBundle({ projectRoot: fixture.root, pluginDir: fixture.pluginDir });
            expect(result.ok).toBe(true);
            expect(result.manifestVersion).toBe('1.9.5');
            expect(result.files.every((file: { matches: boolean }) => file.matches)).toBe(true);
        } finally {
            fixture.cleanup();
        }
    });

    test('fails closed when a deployed file differs', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { verifyVaultBundle } = require(scriptPath) as VaultBundleVerifier;
        const fixture = createFixture();
        try {
            fs.appendFileSync(path.join(fixture.pluginDir, 'main.js'), '\nchanged', 'utf8');
            expect(() => verifyVaultBundle({ projectRoot: fixture.root, pluginDir: fixture.pluginDir }))
                .toThrow(/main\.js/);
        } finally {
            fixture.cleanup();
        }
    });

    test('fails closed when the deployed manifest version drifts', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { verifyVaultBundle } = require(scriptPath) as VaultBundleVerifier;
        const fixture = createFixture();
        try {
            fs.writeFileSync(
                path.join(fixture.pluginDir, 'manifest.json'),
                JSON.stringify({ id: 'notemd', version: '1.9.4' }),
                'utf8'
            );
            expect(() => verifyVaultBundle({ projectRoot: fixture.root, pluginDir: fixture.pluginDir }))
                .toThrow(/manifest\.json version mismatch/);
        } finally {
            fixture.cleanup();
        }
    });

    test('fails closed when a required deployed file is missing', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { verifyVaultBundle } = require(scriptPath) as VaultBundleVerifier;
        const fixture = createFixture();
        try {
            fs.rmSync(path.join(fixture.pluginDir, 'styles.css'));
            expect(() => verifyVaultBundle({ projectRoot: fixture.root, pluginDir: fixture.pluginDir }))
                .toThrow(/Missing bundle file.*styles\.css/);
        } finally {
            fixture.cleanup();
        }
    });

    test('resolves a Vault-relative plugin path from the CLI argument', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { parseArgs } = require(scriptPath) as VaultBundleVerifier;
        const args = parseArgs(['--vault', 'E:/1Knowledge']);
        expect(args.vaultPath).toBe(path.resolve('E:/1Knowledge'));
        expect(args.pluginDir).toBe(path.resolve('E:/1Knowledge/.obsidian/plugins/notemd'));
    });
});
