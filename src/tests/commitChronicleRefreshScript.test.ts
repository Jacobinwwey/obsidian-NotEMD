import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync, spawnSync } from 'child_process';
const packagingContract = require('../../scripts/lib/packaging-contract.js');

const repoRoot = path.join(__dirname, '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'release', 'commit-chronicle-refresh.js');

function prependPathEnv(tempRoot: string): NodeJS.ProcessEnv {
    const nextPath = `${tempRoot}${path.delimiter}${process.env.Path || process.env.PATH || ''}`;
    return { ...process.env, PATH: nextPath, Path: nextPath };
}

type GitResult = {
    status: number;
    stdout?: string;
    stderr?: string;
};

type GitRunner = (repoRoot: string, args: string[], options?: { allowFailure?: boolean }) => GitResult;

function ok(stdout = '', stderr = ''): GitResult {
    return { status: 0, stdout, stderr };
}

function fail(status: number, stderr: string, stdout = ''): GitResult {
    return { status, stdout, stderr };
}

function writeFakeGit(
    tempRoot: string,
    body: string
): { scriptPath: string; argsPath: string } {
    const scriptPath = path.join(tempRoot, 'git');
    const cmdScriptPath = path.join(tempRoot, 'git.cmd');
    const argsPath = path.join(tempRoot, 'git-args.jsonl');
    const scriptSource = `#!/usr/bin/env node
const fs = require('fs');
const argsPath = ${JSON.stringify(argsPath)};
const args = process.argv.slice(2);
fs.appendFileSync(argsPath, JSON.stringify(args) + '\\n');
${body}
`;
    fs.writeFileSync(scriptPath, scriptSource, { encoding: 'utf8', mode: 0o755 });
    fs.writeFileSync(cmdScriptPath, `@echo off\r\n"${process.execPath}" "${scriptPath}" %*\r\n`, 'utf8');
    return { scriptPath, argsPath };
}

describe('chronicle refresh release helper', () => {
    const {
        CHRONICLE_PATHS,
        DEFAULT_CHRONICLE_TARGET_BRANCH,
        DEFAULT_PUSH_RETRY_BASE_DELAY_MS,
        commitChronicleRefresh,
        hasChronicleChanges,
        parseChronicleRefreshArgs,
        pushChronicleCommitWithRetries
    } = require(scriptPath) as {
        CHRONICLE_PATHS: string[];
        DEFAULT_CHRONICLE_TARGET_BRANCH: string;
        DEFAULT_PUSH_RETRY_BASE_DELAY_MS: number;
        commitChronicleRefresh: (
            repoRoot: string,
            tag: string,
            options?: {
                gitRunner?: GitRunner;
                log?: (message: string) => void;
                sleepFn?: (milliseconds: number) => void;
                maxAttempts?: number;
            }
        ) => {
            changed: boolean;
            committed: boolean;
            pushed: boolean;
            alreadyPresent: boolean;
            attempts?: number;
            commitSha?: string;
        };
        hasChronicleChanges: (repoRoot: string, gitRunner?: GitRunner) => boolean;
        parseChronicleRefreshArgs: (argv?: string[]) => {
            tag: string | undefined;
            targetBranch: string;
        };
        pushChronicleCommitWithRetries: (
            repoRoot: string,
            targetBranch?: string,
            options?: {
                gitRunner?: GitRunner;
                log?: (message: string) => void;
                sleepFn?: (milliseconds: number) => void;
                maxAttempts?: number;
            }
        ) => {
            attempts: number;
            pushed: boolean;
            alreadyPresent: boolean;
            commitSha: string;
        };
    };

    test('detects untracked chronicle artifacts instead of relying only on tracked diff output', () => {
        const gitRunner = jest.fn<GitResult, [string, string[], { allowFailure?: boolean } | undefined]>()
            .mockReturnValue(ok('?? docs/repo-saga/notemd-development-history.xx.svg\n'));

        expect(hasChronicleChanges('/tmp/notemd', gitRunner)).toBe(true);
        expect(gitRunner).toHaveBeenCalledWith(
            '/tmp/notemd',
            ['status', '--porcelain=v1', '--untracked-files=all', '--', ...CHRONICLE_PATHS]
        );
    });

    test('derives the default chronicle push target from the shared packaging contract', () => {
        expect(DEFAULT_CHRONICLE_TARGET_BRANCH).toBe(packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH);
    });

    test('real helper entrypoint prints a clean no-op message when no chronicle files changed', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-chronicle-noop-'));
        const fakeGit = writeFakeGit(
            tempRoot,
            `if (args[0] === 'status') { process.stdout.write(''); process.exit(0); }
process.stderr.write('Unexpected git command: ' + args.join(' '));
process.exit(9);
`
        );

        try {
            const output = execFileSync(process.execPath, [scriptPath, '1.8.7'], {
                cwd: repoRoot,
                encoding: 'utf8',
                env: prependPathEnv(tempRoot)
            });

            expect(output).toContain('Chronicle already up to date.');
            const calls = fs.readFileSync(fakeGit.argsPath, 'utf8')
                .trim()
                .split('\n')
                .map((line) => JSON.parse(line));
            expect(calls).toEqual([
                ['status', '--porcelain=v1', '--untracked-files=all', '--', ...CHRONICLE_PATHS]
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('real helper entrypoint honors explicit target-branch overrides through the checked-in script', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-chronicle-branch-'));
        const fakeGit = writeFakeGit(
            tempRoot,
            `switch (args[0]) {
case 'status':
  process.stdout.write('?? docs/repo-saga/notemd-development-history.xx.svg\\n');
  process.exit(0);
case 'config':
case 'add':
  process.exit(0);
case 'diff':
  process.exit(1);
case 'commit':
  process.stdout.write('[main abc123] docs: refresh quarterly chronicle for 1.8.7\\n');
  process.exit(0);
case 'rev-parse':
  process.stdout.write('abc123\\n');
  process.exit(0);
case 'push':
  process.exit(0);
default:
  process.stderr.write('Unexpected git command: ' + args.join(' '));
  process.exit(9);
}
`
        );

        try {
            const result = spawnSync(process.execPath, [scriptPath, '1.8.7', '--target-branch', 'release-maint'], {
                cwd: repoRoot,
                encoding: 'utf8',
                env: prependPathEnv(tempRoot)
            });

            expect(result.status).toBe(0);
            expect(result.stderr).toBe('');
            const calls = fs.readFileSync(fakeGit.argsPath, 'utf8')
                .trim()
                .split('\n')
                .map((line) => JSON.parse(line));
            expect(calls).toContainEqual(['push', 'origin', 'HEAD:release-maint']);
            expect(calls).toContainEqual(['config', 'user.name', 'Jacobinwwey']);
            expect(calls).toContainEqual(['config', 'user.email', 'jacob.hxx.cn@outlook.com']);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('real helper entrypoint fails fast on missing target-branch value before invoking git', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-chronicle-missing-branch-'));
        const fakeGit = writeFakeGit(
            tempRoot,
            `process.stderr.write('git should not be invoked'); process.exit(9);`
        );

        try {
            const result = spawnSync(process.execPath, [scriptPath, '1.8.7', '--target-branch'], {
                cwd: repoRoot,
                encoding: 'utf8',
                env: prependPathEnv(tempRoot)
            });

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain('Missing value for --target-branch');
            expect(fs.existsSync(fakeGit.argsPath)).toBe(false);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('real helper entrypoint surfaces git status failures with the checked-in error formatting', () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-chronicle-git-fail-'));
        const fakeGit = writeFakeGit(
            tempRoot,
            `if (args[0] === 'status') {
  process.stderr.write('fatal: fake git status failure\\n');
  process.exit(128);
}
process.stderr.write('Unexpected git command: ' + args.join(' '));
process.exit(9);
`
        );

        try {
            const result = spawnSync(process.execPath, [scriptPath, '1.8.7'], {
                cwd: repoRoot,
                encoding: 'utf8',
                env: prependPathEnv(tempRoot)
            });

            expect(result.status).toBe(1);
            expect(result.stdout).toBe('');
            expect(result.stderr).toContain(
                'git status --porcelain=v1 --untracked-files=all -- README.md README_*.md docs/repo-saga/*.svg failed with exit code 128'
            );
            expect(result.stderr).toContain('fatal: fake git status failure');
            const calls = fs.readFileSync(fakeGit.argsPath, 'utf8')
                .trim()
                .split('\n')
                .map((line) => JSON.parse(line));
            expect(calls).toEqual([
                ['status', '--porcelain=v1', '--untracked-files=all', '--', ...CHRONICLE_PATHS]
            ]);
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true });
        }
    });

    test('returns cleanly when no chronicle changes exist', () => {
        const logs: string[] = [];
        const gitRunner: GitRunner = () => ok('');

        expect(
            commitChronicleRefresh('/tmp/notemd', '1.8.7', {
                gitRunner,
                log: (message) => logs.push(message)
            })
        ).toEqual({
            changed: false,
            committed: false,
            pushed: false,
            alreadyPresent: false
        });
        expect(logs).toContain('Chronicle already up to date.');
    });

    test('stages and commits detected chronicle changes before pushing', () => {
        const calls: string[] = [];
        let head = 'abc123';
        const gitRunner: GitRunner = (_repoRoot, args) => {
            calls.push(args.join(' '));
            switch (args[0]) {
                case 'status':
                    return ok('?? docs/repo-saga/notemd-development-history.xx.svg\n');
                case 'config':
                    return ok();
                case 'add':
                    return ok();
                case 'diff':
                    return fail(1, '');
                case 'commit':
                    return ok('[main abc123] docs: refresh quarterly chronicle for 1.8.7');
                case 'rev-parse':
                    return ok(`${head}\n`);
                case 'push':
                    return ok();
                default:
                    throw new Error(`Unexpected git command: ${args.join(' ')}`);
            }
        };

        const result = commitChronicleRefresh('/tmp/notemd', '1.8.7', {
            gitRunner,
            log: () => undefined
        });

        expect(result).toMatchObject({
            changed: true,
            committed: true,
            pushed: true,
            alreadyPresent: false,
            attempts: 1,
            commitSha: head
        });
        expect(calls).toContain('config user.name Jacobinwwey');
        expect(calls).toContain('config user.email jacob.hxx.cn@outlook.com');
        expect(calls).toContain(`add -- ${CHRONICLE_PATHS.join(' ')}`);
        expect(calls).toContain('commit -m docs: refresh quarterly chronicle for 1.8.7');
        expect(calls).toContain(`push origin HEAD:${packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH}`);
    });

    test('parses explicit target-branch override for manual repair runs', () => {
        expect(parseChronicleRefreshArgs(['1.8.7', '--target-branch', 'release-maint'])).toEqual({
            tag: '1.8.7',
            targetBranch: 'release-maint'
        });
        expect(parseChronicleRefreshArgs(['1.8.7'])).toEqual({
            tag: '1.8.7',
            targetBranch: packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH
        });
        expect(() => parseChronicleRefreshArgs(['1.8.7', '--target-branch'])).toThrow('Missing value for --target-branch');
    });

    test('retries chronicle push after transient failure by fetching and rebasing onto main', () => {
        const calls: string[] = [];
        const sleeps: number[] = [];
        const logs: string[] = [];
        let head = 'abc123';
        let pushAttempts = 0;

        const gitRunner: GitRunner = (_repoRoot, args) => {
            calls.push(args.join(' '));
            switch (args[0]) {
                case 'rev-parse':
                    return ok(`${head}\n`);
                case 'push':
                    pushAttempts += 1;
                    if (pushAttempts === 1) {
                        return fail(128, "remote: Internal Server Error\nfatal: unable to access 'https://github.com/example/repo': The requested URL returned error: 500");
                    }
                    return ok();
                case 'fetch':
                    return ok();
                case 'merge-base':
                    return fail(1, '');
                case 'rebase':
                    head = 'def456';
                    return ok('Successfully rebased and updated detached HEAD.');
                default:
                    throw new Error(`Unexpected git command: ${args.join(' ')}`);
            }
        };

        const result = pushChronicleCommitWithRetries('/tmp/notemd', packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH, {
            gitRunner,
            log: (message) => logs.push(message),
            sleepFn: (milliseconds) => sleeps.push(milliseconds),
            maxAttempts: 3
        });

        expect(result).toEqual({
            attempts: 2,
            pushed: true,
            alreadyPresent: false,
            commitSha: 'def456'
        });
        expect(calls).toContain(`fetch origin ${packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH}`);
        expect(calls).toContain(`rebase origin/${packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH}`);
        expect(sleeps).toEqual([DEFAULT_PUSH_RETRY_BASE_DELAY_MS]);
        expect(logs.some((message) => message.includes('retrying in'))).toBe(true);
    });

    test('treats remote-containing commit as recovered success after a failed push response', () => {
        const calls: string[] = [];
        let head = 'abc123';

        const gitRunner: GitRunner = (_repoRoot, args) => {
            calls.push(args.join(' '));
            switch (args[0]) {
                case 'rev-parse':
                    return ok(`${head}\n`);
                case 'push':
                    return fail(128, "remote: Internal Server Error\nfatal: unable to access 'https://github.com/example/repo': The requested URL returned error: 500");
                case 'fetch':
                    return ok();
                case 'merge-base':
                    return ok();
                default:
                    throw new Error(`Unexpected git command: ${args.join(' ')}`);
            }
        };

        const result = pushChronicleCommitWithRetries('/tmp/notemd', packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH, {
            gitRunner,
            log: () => undefined,
            sleepFn: () => undefined,
            maxAttempts: 3
        });

        expect(result).toEqual({
            attempts: 1,
            pushed: false,
            alreadyPresent: true,
            commitSha: head
        });
        expect(calls).not.toContain(`rebase origin/${packagingContract.RELEASE_CHRONICLE_REFRESH_TARGET_BRANCH}`);
    });
});
