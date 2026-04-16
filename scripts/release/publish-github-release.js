const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const OBSIDIAN_RELEASE_TAG_PATTERN = /^\d+\.\d+\.\d+$/;
const REQUIRED_RELEASE_ASSETS = ['main.js', 'manifest.json', 'styles.css', 'README.md'];

function ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing required release file: ${filePath}`);
    }
}

function validateReleaseTag(tag) {
    if (!OBSIDIAN_RELEASE_TAG_PATTERN.test(tag)) {
        throw new Error(
            `Invalid release tag "${tag}". Obsidian releases must use numeric x.x.x tags without a v prefix.`
        );
    }
}

function resolveReleaseInputs(repoRoot, tag) {
    if (!tag) {
        throw new Error('Usage: node scripts/release/publish-github-release.js <tag> [--dry-run]');
    }

    validateReleaseTag(tag);

    const assets = REQUIRED_RELEASE_ASSETS.map((assetName) => path.join(repoRoot, assetName));
    assets.forEach(ensureFileExists);

    const englishNotesFile = path.join(repoRoot, 'docs', 'releases', `${tag}.md`);
    const chineseNotesFile = path.join(repoRoot, 'docs', 'releases', `${tag}.zh-CN.md`);
    ensureFileExists(englishNotesFile);
    ensureFileExists(chineseNotesFile);

    return {
        tag,
        title: `Notemd ${tag}`,
        englishNotesFile,
        chineseNotesFile,
        assets
    };
}

function composeReleaseNotesFile({ tag, englishNotesFile, chineseNotesFile }) {
    const englishNotes = fs.readFileSync(englishNotesFile, 'utf8').trim();
    const chineseNotes = fs.readFileSync(chineseNotesFile, 'utf8').trim();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `notemd-release-notes-${tag}-`));
    const notesFile = path.join(tempDir, `${tag}.md`);
    const combinedNotes = `${englishNotes}\n\n---\n\n${chineseNotes}\n`;

    fs.writeFileSync(notesFile, combinedNotes, 'utf8');
    return notesFile;
}

function cleanupReleaseNotesFile(notesFile) {
    if (!notesFile) {
        return;
    }

    fs.rmSync(path.dirname(notesFile), { recursive: true, force: true });
}

function buildGhReleaseCommand({ tag, title, notesFile, assets, releaseExists }) {
    if (releaseExists) {
        return ['release', 'upload', tag, ...assets, '--clobber'];
    }

    if (!notesFile) {
        throw new Error('Missing composed release notes file for gh release create');
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
    let notesFile;

    try {
        const releaseExists = hasExistingRelease(repoRoot, tag);
        if (!releaseExists) {
            notesFile = composeReleaseNotesFile(inputs);
        }

        const commandArgs = buildGhReleaseCommand({
            ...inputs,
            notesFile,
            releaseExists
        });

        if (dryRun) {
            console.log(`gh ${commandArgs.join(' ')}`);
            return 0;
        }

        runGhCommand(repoRoot, commandArgs);
        return 0;
    } finally {
        cleanupReleaseNotesFile(notesFile);
    }
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
    OBSIDIAN_RELEASE_TAG_PATTERN,
    REQUIRED_RELEASE_ASSETS,
    buildGhReleaseCommand,
    cleanupReleaseNotesFile,
    composeReleaseNotesFile,
    hasExistingRelease,
    main,
    resolveReleaseInputs,
    validateReleaseTag
};
