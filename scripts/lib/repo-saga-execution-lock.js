'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_REPO_SAGA_LOCK_FILENAME = '.repo-saga-execution.lock';

function isProcessRunning(pid) {
    if (!Number.isInteger(pid) || pid <= 0) {
        return false;
    }

    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        if (error && typeof error === 'object' && error.code === 'EPERM') {
            return true;
        }
        return false;
    }
}

function readLockMetadata(lockFilePath) {
    try {
        const raw = fs.readFileSync(lockFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return {};
        }
        return parsed;
    } catch (_error) {
        return {};
    }
}

function createRepoSagaSerialExecutionError(lockFilePath, metadata = {}) {
    const details = [];
    if (metadata.pid) {
        details.push(`pid ${metadata.pid}`);
    }
    if (metadata.startedAt) {
        details.push(`started ${metadata.startedAt}`);
    }

    const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
    return new Error(
        `repo-saga chronicle commands share ${path.dirname(lockFilePath)} and must run serially. `
        + `Detected another active repo-saga execution lock at ${lockFilePath}${detailText}. `
        + 'Wait for the active run to finish, or remove the lock only after verifying that no repo-saga sync/update process is still running.'
    );
}

function tryRemoveStaleLock(lockFilePath, processAlive = isProcessRunning) {
    if (!fs.existsSync(lockFilePath)) {
        return false;
    }

    const metadata = readLockMetadata(lockFilePath);
    if (processAlive(Number(metadata.pid))) {
        return false;
    }

    fs.rmSync(lockFilePath, { force: true });
    return true;
}

function acquireRepoSagaExecutionLock(
    lockFilePath,
    {
        processId = process.pid,
        startedAt = new Date().toISOString(),
        processAlive = isProcessRunning
    } = {}
) {
    fs.mkdirSync(path.dirname(lockFilePath), { recursive: true });

    if (fs.existsSync(lockFilePath) && !tryRemoveStaleLock(lockFilePath, processAlive)) {
        throw createRepoSagaSerialExecutionError(lockFilePath, readLockMetadata(lockFilePath));
    }

    let fileDescriptor;
    try {
        fileDescriptor = fs.openSync(lockFilePath, 'wx');
    } catch (error) {
        if (error && typeof error === 'object' && error.code === 'EEXIST') {
            if (tryRemoveStaleLock(lockFilePath, processAlive)) {
                return acquireRepoSagaExecutionLock(lockFilePath, {
                    processId,
                    startedAt,
                    processAlive
                });
            }
            throw createRepoSagaSerialExecutionError(lockFilePath, readLockMetadata(lockFilePath));
        }
        throw error;
    }

    try {
        fs.writeFileSync(
            fileDescriptor,
            JSON.stringify(
                {
                    pid: processId,
                    startedAt
                },
                null,
                2
            ),
            'utf8'
        );
    } catch (error) {
        fs.closeSync(fileDescriptor);
        fs.rmSync(lockFilePath, { force: true });
        throw error;
    }

    fs.closeSync(fileDescriptor);

    let released = false;
    return () => {
        if (released) {
            return;
        }
        released = true;
        fs.rmSync(lockFilePath, { force: true });
    };
}

module.exports = {
    DEFAULT_REPO_SAGA_LOCK_FILENAME,
    acquireRepoSagaExecutionLock,
    createRepoSagaSerialExecutionError,
    isProcessRunning,
    tryRemoveStaleLock
};
