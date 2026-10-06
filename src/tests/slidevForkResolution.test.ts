import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as childProcess from 'child_process';
import { createHash } from 'crypto';
import { resolveSlidevCommand } from '../slideExport/platformUtils';

jest.mock('obsidian', () => ({ Platform: { isDesktopApp: true } }));
jest.mock('../slideExport/slidevDistribution', () => ({
    ...jest.requireActual('../slideExport/slidevDistribution'),
    NOTEMD_SLIDEV_OFFLINE_ARCHIVE_INTEGRITY: 'sha512-' + jest.requireActual('crypto').createHash('sha512').update('verified fork archive').digest('base64'),
}));

describe('required Slidev fork provenance', () => {
	let root: string;
	let previous: string | undefined;
	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-fork-'));
		previous = process.env.NOTEMD_SLIDEV_BIN;
	});
	afterEach(() => {
		jest.restoreAllMocks();
		if (previous === undefined) delete process.env.NOTEMD_SLIDEV_BIN;
		else process.env.NOTEMD_SLIDEV_BIN = previous;
		fs.rmSync(root, { recursive: true, force: true });
	});
	function installed(resolved: string): string {
		const packageRoot = path.join(root, 'node_modules', '@slidev', 'cli');
		fs.mkdirSync(path.join(packageRoot, 'bin'), { recursive: true });
		const cli = path.join(packageRoot, 'bin', 'slidev.mjs');
		fs.writeFileSync(cli, '// --out --format --standalone-bundle');
		fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name: '@slidev/cli', version: '99.0.0', bin: { slidev: './bin/slidev.mjs' } }));
		fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/@slidev/cli': { version: '99.0.0', resolved, integrity: 'sha512-test' } } }));
		process.env.NOTEMD_SLIDEV_BIN = cli;
		return cli;
	}
	test('rejects official packages even when help contains all required flags', () => {
		installed('https://registry.npmjs.org/@slidev/cli/-/cli-99.0.0.tgz');
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
	});
	test('accepts future fork release assets using locked publisher provenance', () => {
		const cli = installed('https://github.com/Jacobinwwey/slidev/releases/download/future-99/slidev-cli.tgz');
		expect(resolveSlidevCommand({ roots: [root] })?.command).toBe(cli);
	});
	test('rejects the superseded release whose standalone runtime is known to fail', () => {
		installed('https://github.com/Jacobinwwey/slidev/releases/download/notemd-standalone-v52.16.0-1/slidev-cli-notemd-standalone-v52.16.0-1.tgz');
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
	});
	test('does not run npx when configured runtime is missing', () => {
		process.env.NOTEMD_SLIDEV_BIN = path.join(root, 'missing.mjs');
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
	});
	test('resolves Windows .bin shims to the verified package entry', () => {
		const cli = installed('https://github.com/Jacobinwwey/slidev/releases/download/future-99/slidev-cli.tgz');
		const shim = path.join(root, 'node_modules', '.bin', 'slidev.cmd');
		fs.mkdirSync(path.dirname(shim));
		fs.writeFileSync(shim, '@echo do not execute this shim');
		process.env.NOTEMD_SLIDEV_BIN = shim;
		expect(resolveSlidevCommand({ roots: [root] })?.command).toBe(cli);
	});
	test('does not accept another publisher or a forged repository field', () => {
		installed('https://github.com/other/slidev/releases/download/v99/slidev.tgz');
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
	});
	test('rejects stale lock versions and missing integrity metadata', () => {
		installed('https://github.com/Jacobinwwey/slidev/releases/download/future-99/slidev-cli.tgz');
		const lockPath = path.join(root, 'package-lock.json');
		const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
		lock.packages['node_modules/@slidev/cli'].version = '98.0.0';
		fs.writeFileSync(lockPath, JSON.stringify(lock));
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
		lock.packages['node_modules/@slidev/cli'].version = '99.0.0';
		delete lock.packages['node_modules/@slidev/cli'].integrity;
		fs.writeFileSync(lockPath, JSON.stringify(lock));
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
	});
	test('validates a configured checkout by Git origin, never by its folder name', () => {
		const packageRoot = path.join(root, 'packages', 'slidev');
		fs.mkdirSync(path.join(packageRoot, 'bin'), { recursive: true });
		fs.mkdirSync(path.join(root, '.git'));
		const cli = path.join(packageRoot, 'bin', 'slidev.mjs');
		fs.writeFileSync(cli, '// fork CLI');
		fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name: '@slidev/cli', bin: { slidev: './bin/slidev.mjs' } }));
		process.env.NOTEMD_SLIDEV_BIN = cli;
		const remote = jest.spyOn(childProcess, 'execFileSync').mockReturnValue('https://github.com/slidevjs/slidev.git\n');
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
		remote.mockReturnValue('git@github.com:Jacobinwwey/slidev.git\n');
		expect(resolveSlidevCommand({ roots: [root] })?.command).toBe(cli);
	});
	test('accepts only the pinned local fork archive and rejects changed or missing bytes', () => {
		const archive = path.join(root, 'fork package.tgz');
		fs.writeFileSync(archive, 'verified fork archive');
		const cli = installed('file:fork package.tgz');
		const lockPath = path.join(root, 'package-lock.json');
		const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
		lock.packages['node_modules/@slidev/cli'].integrity = 'sha512-' + createHash('sha512').update('verified fork archive').digest('base64');
		fs.writeFileSync(lockPath, JSON.stringify(lock));
		expect(resolveSlidevCommand({ roots: [root] })?.command).toBe(cli);
		fs.writeFileSync(archive, 'different archive');
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
		fs.unlinkSync(archive);
		expect(resolveSlidevCommand({ roots: [root] })).toBeNull();
	});
});
