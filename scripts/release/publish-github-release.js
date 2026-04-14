const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REQUIRED_RELEASE_ASSETS = ['main.js', 'manifest.json', 'styles.css', 'README.md'];

function ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing required release file: ${filePath}`);
    }
}

function resolveReleaseInputs(repoRoot, tag) {
    if (!tag) {
        throw new Error('Usage: node scripts/release/publish-github-release.js <tag> [--dry-run]');
    }

    const assets = REQUIRED_RELEASE_ASSETS.map((assetName) => path.join(repoRoot, assetName));
    assets.forEach(ensureFileExists);

    const notesFile = path.join(repoRoot, 'docs', 'releases', `${tag}.md`);
    ensureFileExists(notesFile);

    return {
        tag,
        title: `Notemd ${tag}`,
        notesFile,
        assets
    };
}

function buildGhReleaseCommand({ tag, title, notesFile, assets, releaseExists }) {
    if (releaseExists) {
        return ['release', 'upload', tag, ...assets, '--clobber'];
    }

    return ['release', 'create', tag, ...assets, '--title', title, '--notes-file', notesFile, '--verify-tag'];
}

function hasExistingRelease(repoRoot, tag) {
    const result = spawnSync('gh', ['release', 'view', tag], {
        cwd: repoRoot,
        stdio: 'ignore'
    });

    if (result.error) {
        throw result.error;
    }

    return result.status === 0;
}

function runGhCommand(repoRoot, commandArgs) {
    const result = spawnSync('gh', commandArgs, {
        cwd: repoRoot,
        stdio: 'inherit'
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`gh ${commandArgs.join(' ')} failed with exit code ${result.status}`);
    }
}

function main(argv = process.argv.slice(2)) {
    const dryRun = argv.includes('--dry-run');
    const tag = argv.find((arg) => !arg.startsWith('--'));
    const repoRoot = path.join(__dirname, '..', '..');
    const inputs = resolveReleaseInputs(repoRoot, tag);
    const commandArgs = buildGhReleaseCommand({
        ...inputs,
        releaseExists: hasExistingRelease(repoRoot, tag)
    });

    if (dryRun) {
        console.log(`gh ${commandArgs.join(' ')}`);
        return 0;
    }

    runGhCommand(repoRoot, commandArgs);
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
    REQUIRED_RELEASE_ASSETS,
    buildGhReleaseCommand,
    hasExistingRelease,
    main,
    resolveReleaseInputs
};
