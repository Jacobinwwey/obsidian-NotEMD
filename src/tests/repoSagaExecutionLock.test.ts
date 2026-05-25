import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const helperPath = path.join(__dirname, '..', '..', 'scripts', 'lib', 'repo-saga-execution-lock.js');

describe('repo-saga execution lock helper', () => {
    const {
        acquireRepoSagaExecutionLock,
        tryRemoveStaleLock
    } = require(helperPath) as {
        acquireRepoSagaExecutionLock: (
            lockFilePath: string,
            options?: {
                processId?: number;
                startedAt?: string;
                processAlive?: (pid: number) => boolean;
            }
        ) => () => void;
        tryRemoveStaleLock: (lockFilePath: string, processAlive?: (pid: number) => boolean) => boolean;
    };

    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-repo-saga-lock-'));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('creates and releases an execution lock file', () => {
        const lockFilePath = path.join(tempDir, '.repo-saga-execution.lock');
        const release = acquireRepoSagaExecutionLock(lockFilePath, {
            processId: 1234,
            startedAt: '2026-05-13T12:00:00.000Z'
        });

        expect(fs.existsSync(lockFilePath)).toBe(true);
        expect(JSON.parse(fs.readFileSync(lockFilePath, 'utf8'))).toEqual({
            pid: 1234,
            startedAt: '2026-05-13T12:00:00.000Z'
        });

        release();

        expect(fs.existsSync(lockFilePath)).toBe(false);
    });

    test('fails fast with a clear serial-execution error when another process owns the lock', () => {
        const lockFilePath = path.join(tempDir, '.repo-saga-execution.lock');
        fs.writeFileSync(
            lockFilePath,
            JSON.stringify({ pid: 4321, startedAt: '2026-05-13T12:05:00.000Z' }),
            'utf8'
        );

        expect(() => acquireRepoSagaExecutionLock(lockFilePath, {
            processId: 1234,
            processAlive: () => true
        })).toThrow(/must run serially/i);
    });

    test('reclaims a stale lock before acquiring a new one', () => {
        const lockFilePath = path.join(tempDir, '.repo-saga-execution.lock');
        fs.writeFileSync(
            lockFilePath,
            JSON.stringify({ pid: 4321, startedAt: '2026-05-13T12:05:00.000Z' }),
            'utf8'
        );

        expect(tryRemoveStaleLock(lockFilePath, () => false)).toBe(true);
        expect(fs.existsSync(lockFilePath)).toBe(false);

        const release = acquireRepoSagaExecutionLock(lockFilePath, {
            processId: 9999,
            startedAt: '2026-05-13T12:06:00.000Z',
            processAlive: () => false
        });

        expect(JSON.parse(fs.readFileSync(lockFilePath, 'utf8'))).toEqual({
            pid: 9999,
            startedAt: '2026-05-13T12:06:00.000Z'
        });

        release();
    });
});
