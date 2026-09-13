'use strict';

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { spawnSyncWithCommandResolution } = require('../lib/cross-platform-command.js');
const { RELEASE_TAG_PATTERN_SOURCE, REQUIRED_RELEASE_ASSET_FILES, resolveReleaseNotesRelativePaths } = require('../lib/packaging-contract.js');

const OBSIDIAN_RELEASE_TAG_PATTERN = new RegExp(RELEASE_TAG_PATTERN_SOURCE);
const REQUIRED_RELEASE_ASSETS = [...REQUIRED_RELEASE_ASSET_FILES];
const USAGE = 'Usage: node scripts/release/publish-github-release.js <tag> [--dry-run]';

function validateReleaseTag(tag) {
    // JS `$` also matches before a final newline; require the entire argument to match.
    if (typeof tag !== 'string' || tag.match(OBSIDIAN_RELEASE_TAG_PATTERN)?.[0] !== tag) {
        throw new Error(`Invalid release tag "${tag}". Obsidian releases must use numeric x.x.x tags without a v prefix.`);
    }
}

function parseReleaseArgs(argv) {
    let tag;
    let dryRun = false;
    for (const arg of argv) {
        if (arg === '--dry-run') {
            if (dryRun) throw new Error(`Duplicate --dry-run. ${USAGE}`);
            dryRun = true;
        } else if (arg.startsWith('--')) {
            throw new Error(`Unknown option ${arg}. ${USAGE}`);
        } else if (tag !== undefined) {
            throw new Error(`Unexpected argument ${arg}. ${USAGE}`);
        } else {
            tag = arg;
        }
    }
    if (!tag) throw new Error(USAGE);
    validateReleaseTag(tag);
    return { tag, dryRun };
}

function readRequiredFile(filename) {
    if (!fs.existsSync(filename) || !fs.lstatSync(filename).isFile()) {
        throw new Error(`Missing required release file: ${filename}`);
    }
    const bytes = fs.readFileSync(filename);
    if (!bytes.length) throw new Error(`Empty required release file: ${filename}`);
    return bytes;
}

function sha256(bytes) {
    return createHash('sha256').update(bytes).digest('hex');
}

function resolveReleaseInputs(repoRoot, tag) {
    validateReleaseTag(tag);
    const readJson = relative => JSON.parse(readRequiredFile(path.join(repoRoot, relative)).toString('utf8'));
    const packageJson = readJson('package.json');
    const manifest = readJson('manifest.json');
    const lock = readJson('package-lock.json');
    const versions = readJson('versions.json');
    if ([packageJson.version, manifest.version, lock.version, lock.packages?.['']?.version].some(version => version !== tag)
        || !manifest.minAppVersion || versions[tag] !== manifest.minAppVersion) {
        throw new Error('Release version mismatch across tag, package, lockfile, manifest or versions.json');
    }
    const notesPaths = resolveReleaseNotesRelativePaths(tag);
    const notes = Object.values(notesPaths).map(relative => {
        const text = readRequiredFile(path.join(repoRoot, relative)).toString('utf8').replace(/\r\n/g, '\n').trim();
        if (!text) throw new Error(`Empty release notes: ${relative}`);
        if (!text.startsWith(`# Notemd v${tag}\n`)) throw new Error(`Release notes version mismatch: ${relative}`);
        return text;
    });
    if (!/[A-Za-z]{3}/.test(notes[0]) || !/\p{Script=Han}/u.test(notes[1])) {
        throw new Error('Release notes require complete English and Chinese sections');
    }
    const assets = Object.fromEntries(REQUIRED_RELEASE_ASSETS.map(name => [name, readRequiredFile(path.join(repoRoot, name))]));
    return { tag, title: `Notemd ${tag}`, notes: `${notes[0]}\n\n---\n\n${notes[1]}\n`, notesPaths, assets };
}

function runCommand(repoRoot, command, args, timeout = 60000) {
    const outcome = spawnSyncWithCommandResolution(command, args, {
        cwd: repoRoot, encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe']
    });
    if (outcome.error) throw outcome.error;
    if (outcome.status !== 0) {
        const details = String(outcome.stderr || outcome.stdout || '').trim();
        const error = new Error(`${command} ${args.join(' ')} failed (${outcome.status}): ${details}`);
        error.httpStatus = Number(details.match(/\(HTTP (\d{3})\)/)?.[1]) || undefined;
        throw error;
    }
    return String(outcome.stdout || '').trim();
}

function readGhJson(repoRoot, endpoint) {
    return JSON.parse(runCommand(repoRoot, 'gh', ['api', endpoint]));
}

function readRelease(repoRoot, tag) {
    let release;
    try {
        release = readGhJson(repoRoot, `repos/{owner}/{repo}/releases/tags/${tag}`);
    } catch (error) {
        if (error.httpStatus !== 404) throw error;
        // The by-tag endpoint describes published releases. Authenticated listings
        // also expose drafts, including a draft left by an interrupted upload.
        const pages = JSON.parse(runCommand(repoRoot, 'gh', ['api', 'repos/{owner}/{repo}/releases?per_page=100', '--paginate', '--slurp']));
        if (!Array.isArray(pages) || pages.some(page => !Array.isArray(page))) throw new Error('Invalid GitHub release listing');
        const matches = pages.flat().filter(candidate => candidate.tag_name === tag);
        if (matches.length > 1) throw new Error('Ambiguous GitHub releases for the same tag');
        release = matches[0];
    }
    if (!release) return null;
    if (release.tag_name !== tag || typeof release.draft !== 'boolean' || !Array.isArray(release.assets)) {
        throw new Error('Invalid GitHub release response');
    }
    return release;
}

function assertCleanTaggedSource(repoRoot, tag) {
    if (runCommand(repoRoot, 'git', ['status', '--porcelain', '--untracked-files=normal'])) {
        throw new Error('Publishing requires a clean tagged worktree');
    }
    const sourceCommit = runCommand(repoRoot, 'git', ['rev-parse', '--verify', 'HEAD']);
    const tagCommit = runCommand(repoRoot, 'git', ['rev-parse', '--verify', `refs/tags/${tag}^{commit}`]);
    if (sourceCommit !== tagCommit) throw new Error('HEAD does not match the release tag commit');
    const trackedFiles = ['package.json', 'package-lock.json', 'manifest.json', 'versions.json', 'styles.css', 'README.md', ...Object.values(resolveReleaseNotesRelativePaths(tag))];
    runCommand(repoRoot, 'git', ['ls-files', '--error-unmatch', '--', ...trackedFiles]);
    return sourceCommit;
}

function assertRemoteTag(repoRoot, tag, sourceCommit) {
    let object = readGhJson(repoRoot, `repos/{owner}/{repo}/git/ref/tags/${tag}`).object;
    for (let depth = 0; object?.type === 'tag' && depth < 8; depth++) {
        if (!/^[a-f0-9]{40}$/.test(object.sha)) throw new Error('Invalid remote tag object');
        object = readGhJson(repoRoot, `repos/{owner}/{repo}/git/tags/${object.sha}`).object;
    }
    if (object?.type !== 'commit' || object.sha !== sourceCommit) {
        throw new Error('The remote tag does not match the verified local commit');
    }
}

function previewRelease(repoRoot, tag) {
    const inputs = resolveReleaseInputs(repoRoot, tag);
    return {
        tag,
        sourceCommit: runCommand(repoRoot, 'git', ['rev-parse', '--verify', 'HEAD']),
        worktreeClean: !runCommand(repoRoot, 'git', ['status', '--porcelain', '--untracked-files=normal']),
        remoteState: 'not queried',
        assetSha256: Object.fromEntries(Object.entries(inputs.assets).map(([name, bytes]) => [name, sha256(bytes)])),
        releaseNotes: inputs.notesPaths
    };
}

function assertCandidateProvenance(release, body) {
    if (typeof release.body !== 'string' || release.body.replace(/\r\n/g, '\n').trim() !== body.trim()) {
        throw new Error('Existing release provenance or bilingual notes do not match this candidate; refusing repair');
    }
}

function downloadAndVerifyAssets(repoRoot, tag, release, expectedHashes, destination) {
    const names = Object.keys(expectedHashes);
    if (!names.length) return;
    for (const name of names) {
        const matching = release.assets.filter(asset => asset.name === name);
        if (matching.length !== 1 || matching[0].state !== 'uploaded' || matching[0].size <= 0) {
            throw new Error(`Incomplete release asset: ${name}`);
        }
    }
    fs.mkdirSync(destination);
    runCommand(repoRoot, 'gh', ['release', 'download', tag, '--dir', destination, ...names.flatMap(name => ['--pattern', name])]);
    for (const name of names) {
        if (sha256(readRequiredFile(path.join(destination, name))) !== expectedHashes[name]) {
            throw new Error(`Downloaded release asset hash mismatch: ${name}`);
        }
    }
}

function publishRelease(repoRoot, tag) {
    // Preflight precedes both remote access and rebuilding the ignored bundle.
    resolveReleaseInputs(repoRoot, tag);
    const cacheRoot = path.join(repoRoot, '.cache');
    fs.mkdirSync(cacheRoot, { recursive: true });
    const lockPath = path.join(cacheRoot, `.release-${tag}.lock`);
    const lock = fs.openSync(lockPath, 'wx');
    let scratch;
    try {
        fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, tag }));
        const sourceCommit = assertCleanTaggedSource(repoRoot, tag);
        assertRemoteTag(repoRoot, tag, sourceCommit);
        let release = readRelease(repoRoot, tag);

        // A clean tree cannot establish the origin of gitignored main.js. Rebuild here,
        // then freeze the exact upload bytes so a later local build cannot replace them.
        runCommand(repoRoot, 'npm', ['run', 'build'], 10 * 60 * 1000);
        if (assertCleanTaggedSource(repoRoot, tag) !== sourceCommit) throw new Error('Source changed during release build');
        const inputs = resolveReleaseInputs(repoRoot, tag);
        const assetSha256 = Object.fromEntries(Object.entries(inputs.assets).map(([name, bytes]) => [name, sha256(bytes)]));
        const provenance = { schema: 1, tag, sourceCommit, assetSha256, notesSha256: sha256(inputs.notes) };
        const body = `${inputs.notes}\n<!-- notemd-release-candidate ${JSON.stringify(provenance)} -->\n`;
        if (release) assertCandidateProvenance(release, body);

        scratch = fs.mkdtempSync(path.join(cacheRoot, `release-${tag}-`));
        const notesFile = path.join(scratch, 'notes.md');
        fs.writeFileSync(notesFile, body, 'utf8');
        for (const [name, bytes] of Object.entries(inputs.assets)) fs.writeFileSync(path.join(scratch, name), bytes);
        assertRemoteTag(repoRoot, tag, sourceCommit);

        if (!release) {
            runCommand(repoRoot, 'gh', ['release', 'create', tag, '--draft', '--verify-tag', '--target', sourceCommit, '--title', inputs.title, '--notes-file', notesFile]);
            release = readRelease(repoRoot, tag);
            if (!release?.draft) throw new Error('GitHub did not create the expected draft');
            assertCandidateProvenance(release, body);
        }

        if (release.draft) {
            runCommand(repoRoot, 'gh', ['release', 'upload', tag, ...REQUIRED_RELEASE_ASSETS.map(name => path.join(scratch, name)), '--clobber']);
        } else {
            // A published asset is immutable. A retry may only fill missing assets,
            // after proving every existing byte still belongs to the same candidate.
            const present = Object.fromEntries(Object.entries(assetSha256).filter(([name]) => release.assets.some(asset => asset.name === name)));
            downloadAndVerifyAssets(repoRoot, tag, release, present, path.join(scratch, 'existing'));
            const missing = REQUIRED_RELEASE_ASSETS.filter(name => !Object.hasOwn(present, name));
            if (missing.length) runCommand(repoRoot, 'gh', ['release', 'upload', tag, ...missing.map(name => path.join(scratch, name))]);
        }
        release = readRelease(repoRoot, tag);
        if (!release) throw new Error('Release disappeared during upload');
        assertCandidateProvenance(release, body);
        downloadAndVerifyAssets(repoRoot, tag, release, assetSha256, path.join(scratch, 'verified'));
        assertRemoteTag(repoRoot, tag, sourceCommit);
        if (release.draft) runCommand(repoRoot, 'gh', ['release', 'edit', tag, '--draft=false', '--latest']);
        const published = readRelease(repoRoot, tag);
        if (!published || published.draft) throw new Error('Release is not public after publication');
        assertCandidateProvenance(published, body);
        return provenance;
    } finally {
        if (scratch) fs.rmSync(scratch, { recursive: true, force: true });
        fs.closeSync(lock);
        fs.unlinkSync(lockPath);
    }
}

function main(argv = process.argv.slice(2)) {
    const { tag, dryRun } = parseReleaseArgs(argv);
    const repoRoot = path.join(__dirname, '..', '..');
    const report = dryRun ? previewRelease(repoRoot, tag) : publishRelease(repoRoot, tag);
    console.log(JSON.stringify(report, null, 2));
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

module.exports = { OBSIDIAN_RELEASE_TAG_PATTERN, REQUIRED_RELEASE_ASSETS, main, parseReleaseArgs, previewRelease, publishRelease, resolveReleaseInputs, validateReleaseTag };
