const path = require('path');
const { spawnSync } = require('child_process');

const CHRONICLE_PATHS = ['README.md', 'README_*.md', 'docs/repo-saga/*.svg'];
const DEFAULT_TARGET_BRANCH = 'main';
const DEFAULT_PUSH_MAX_ATTEMPTS = 5;
const DEFAULT_PUSH_RETRY_BASE_DELAY_MS = 3000;
const DEFAULT_COMMIT_AUTHOR_NAME = 'Jacobinwwey';
const DEFAULT_COMMIT_AUTHOR_EMAIL = 'jacob.hxx.cn@outlook.com';

function normalizeCommandOutput(result = {}) {
    return [result.stdout, result.stderr]
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .join('\n')
        .trim();
}

function createGitCommandError(args, result = {}) {
    const output = normalizeCommandOutput(result);
    const suffix = output ? `\n${output}` : '';
    return new Error(`git ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}${suffix}`);
}

function runGit(repoRoot, args, { allowFailure = false } = {}) {
    const result = spawnSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8'
    });

    if (result.error) {
        throw result.error;
    }

    if (!allowFailure && result.status !== 0) {
        throw createGitCommandError(args, result);
    }

    return result;
}

function sleep(milliseconds) {
    if (milliseconds <= 0) {
        return;
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function buildBackoffDelayMs(attempt, baseDelayMs = DEFAULT_PUSH_RETRY_BASE_DELAY_MS) {
    return Math.min(baseDelayMs * attempt, 15000);
}

function hasChronicleChanges(repoRoot, gitRunner = runGit) {
    const result = gitRunner(repoRoot, [
        'status',
        '--porcelain=v1',
        '--untracked-files=all',
        '--',
        ...CHRONICLE_PATHS
    ]);

    return result.stdout.trim().length > 0;
}

function stageChronicleFiles(repoRoot, gitRunner = runGit) {
    gitRunner(repoRoot, ['add', '--', ...CHRONICLE_PATHS]);
}

function hasStagedChronicleChanges(repoRoot, gitRunner = runGit) {
    const result = gitRunner(repoRoot, ['diff', '--cached', '--quiet', '--', ...CHRONICLE_PATHS], {
        allowFailure: true
    });

    if (result.status === 0) {
        return false;
    }

    if (result.status === 1) {
        return true;
    }

    throw createGitCommandError(['diff', '--cached', '--quiet', '--', ...CHRONICLE_PATHS], result);
}

function configureCommitIdentity(repoRoot, gitRunner = runGit) {
    gitRunner(repoRoot, ['config', 'user.name', DEFAULT_COMMIT_AUTHOR_NAME]);
    gitRunner(repoRoot, ['config', 'user.email', DEFAULT_COMMIT_AUTHOR_EMAIL]);
}

function revParseHead(repoRoot, gitRunner = runGit) {
    return gitRunner(repoRoot, ['rev-parse', 'HEAD']).stdout.trim();
}

function fetchRemoteBranch(repoRoot, branch, gitRunner = runGit) {
    return gitRunner(repoRoot, ['fetch', 'origin', branch], { allowFailure: true });
}

function remoteContainsCommit(repoRoot, commitSha, remoteRef, gitRunner = runGit) {
    const result = gitRunner(repoRoot, ['merge-base', '--is-ancestor', commitSha, remoteRef], {
        allowFailure: true
    });

    if (result.status === 0) {
        return true;
    }

    if (result.status === 1) {
        return false;
    }

    throw createGitCommandError(['merge-base', '--is-ancestor', commitSha, remoteRef], result);
}

function rebaseOntoRemote(repoRoot, remoteRef, gitRunner = runGit) {
    const result = gitRunner(repoRoot, ['rebase', remoteRef], { allowFailure: true });
    if (result.status === 0) {
        return;
    }

    gitRunner(repoRoot, ['rebase', '--abort'], { allowFailure: true });
    throw createGitCommandError(['rebase', remoteRef], result);
}

function pushChronicleCommitWithRetries(
    repoRoot,
    targetBranch = DEFAULT_TARGET_BRANCH,
    {
        gitRunner = runGit,
        log = console.log,
        maxAttempts = DEFAULT_PUSH_MAX_ATTEMPTS,
        sleepFn = sleep
    } = {}
) {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
        throw new Error(`Invalid maxAttempts "${maxAttempts}". Expected a positive integer.`);
    }

    let commitSha = revParseHead(repoRoot, gitRunner);
    const remoteRef = `origin/${targetBranch}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const pushResult = gitRunner(repoRoot, ['push', 'origin', `HEAD:${targetBranch}`], {
            allowFailure: true
        });

        if (pushResult.status === 0) {
            return {
                attempts: attempt,
                pushed: true,
                alreadyPresent: false,
                commitSha
            };
        }

        const pushOutput = normalizeCommandOutput(pushResult);
        const fetchResult = fetchRemoteBranch(repoRoot, targetBranch, gitRunner);
        const fetchOutput = normalizeCommandOutput(fetchResult);

        if (fetchResult.status === 0 && remoteContainsCommit(repoRoot, commitSha, remoteRef, gitRunner)) {
            log(
                `Chronicle commit ${commitSha} is already reachable from ${remoteRef}; treating the failed push response as recovered.`
            );
            return {
                attempts: attempt,
                pushed: false,
                alreadyPresent: true,
                commitSha
            };
        }

        if (attempt >= maxAttempts) {
            const detailLines = [
                `Chronicle push failed after ${attempt} attempt(s).`,
                pushOutput ? `Push output:\n${pushOutput}` : 'Push output: <empty>',
                fetchOutput ? `Fetch output:\n${fetchOutput}` : null
            ].filter(Boolean);
            throw new Error(detailLines.join('\n\n'));
        }

        if (fetchResult.status === 0) {
            rebaseOntoRemote(repoRoot, remoteRef, gitRunner);
            commitSha = revParseHead(repoRoot, gitRunner);
        } else {
            log(
                `Chronicle push attempt ${attempt}/${maxAttempts} failed and fetch ${remoteRef} also failed; retrying without rebase after backoff.`
            );
        }

        const delayMs = buildBackoffDelayMs(attempt);
        log(`Chronicle push attempt ${attempt}/${maxAttempts} failed; retrying in ${delayMs}ms.`);
        sleepFn(delayMs);
    }

    throw new Error('Chronicle push retry loop exited unexpectedly.');
}

function commitChronicleRefresh(
    repoRoot,
    tag,
    {
        gitRunner = runGit,
        log = console.log,
        targetBranch = DEFAULT_TARGET_BRANCH,
        maxAttempts = DEFAULT_PUSH_MAX_ATTEMPTS,
        sleepFn = sleep
    } = {}
) {
    if (!tag) {
        throw new Error('Usage: node scripts/release/commit-chronicle-refresh.js <tag>');
    }

    if (!hasChronicleChanges(repoRoot, gitRunner)) {
        log('Chronicle already up to date.');
        return {
            changed: false,
            committed: false,
            pushed: false,
            alreadyPresent: false
        };
    }

    configureCommitIdentity(repoRoot, gitRunner);
    stageChronicleFiles(repoRoot, gitRunner);

    if (!hasStagedChronicleChanges(repoRoot, gitRunner)) {
        log('Chronicle status changed, but no staged chronicle file delta remained after path filtering.');
        return {
            changed: true,
            committed: false,
            pushed: false,
            alreadyPresent: false
        };
    }

    gitRunner(repoRoot, ['commit', '-m', `docs: refresh quarterly chronicle for ${tag}`]);
    const pushResult = pushChronicleCommitWithRetries(repoRoot, targetBranch, {
        gitRunner,
        log,
        maxAttempts,
        sleepFn
    });

    return {
        changed: true,
        committed: true,
        pushed: pushResult.pushed,
        alreadyPresent: pushResult.alreadyPresent,
        attempts: pushResult.attempts,
        commitSha: pushResult.commitSha
    };
}

function main(argv = process.argv.slice(2)) {
    const tag = argv.find((arg) => !arg.startsWith('--'));
    const repoRoot = path.join(__dirname, '..', '..');
    commitChronicleRefresh(repoRoot, tag);
    return 0;
}

if (require.main === module) {
    try {
        process.exitCode = main();
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}

module.exports = {
    CHRONICLE_PATHS,
    DEFAULT_COMMIT_AUTHOR_EMAIL,
    DEFAULT_COMMIT_AUTHOR_NAME,
    DEFAULT_PUSH_MAX_ATTEMPTS,
    DEFAULT_PUSH_RETRY_BASE_DELAY_MS,
    buildBackoffDelayMs,
    commitChronicleRefresh,
    configureCommitIdentity,
    createGitCommandError,
    fetchRemoteBranch,
    hasChronicleChanges,
    hasStagedChronicleChanges,
    main,
    normalizeCommandOutput,
    pushChronicleCommitWithRetries,
    rebaseOntoRemote,
    remoteContainsCommit,
    revParseHead,
    runGit,
    sleep,
    stageChronicleFiles
};
