import * as path from 'path';

const repoRoot = path.join(__dirname, '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'release', 'commit-chronicle-refresh.js');

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

describe('chronicle refresh release helper', () => {
    const {
        CHRONICLE_PATHS,
        DEFAULT_PUSH_RETRY_BASE_DELAY_MS,
        commitChronicleRefresh,
        hasChronicleChanges,
        pushChronicleCommitWithRetries
    } = require(scriptPath) as {
        CHRONICLE_PATHS: string[];
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
        expect(calls).toContain('push origin HEAD:main');
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

        const result = pushChronicleCommitWithRetries('/tmp/notemd', 'main', {
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
        expect(calls).toContain('fetch origin main');
        expect(calls).toContain('rebase origin/main');
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

        const result = pushChronicleCommitWithRetries('/tmp/notemd', 'main', {
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
        expect(calls).not.toContain('rebase origin/main');
    });
});
