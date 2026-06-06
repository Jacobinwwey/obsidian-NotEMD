const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
    REQUIRED_RELEASE_ASSET_FILES
} = require('../lib/packaging-contract.js');

const OBSIDIAN_RELEASE_TAG_PATTERN = /^\d+\.\d+\.\d+$/;
const REQUIRED_RELEASE_ASSETS = [...REQUIRED_RELEASE_ASSET_FILES];

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

function buildGhReleaseCommands({ tag, title, notesFile, assets, releaseExists }) {
    if (!notesFile) {
        throw new Error('Missing composed release notes file for gh release publish/repair');
    }

    if (releaseExists) {
        return [
            ['release', 'edit', tag, '--title', title, '--notes-file', notesFile],
            ['release', 'upload', tag, ...assets, '--clobber']
        ];
    }

    return [[
        'release',
        'create',
        tag,
        ...assets,
        '--title',
        title,
        '--notes-file',
        notesFile,
        '--verify-tag'
    ]];
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

function runGhCommands(repoRoot, commandArgsList) {
    commandArgsList.forEach((commandArgs) => runGhCommand(repoRoot, commandArgs));
}

function main(argv = process.argv.slice(2)) {
    const dryRun = argv.includes('--dry-run');
    const tag = argv.find((arg) => !arg.startsWith('--'));
    const repoRoot = path.join(__dirname, '..', '..');
    const inputs = resolveReleaseInputs(repoRoot, tag);
    let notesFile;

    try {
        const releaseExists = hasExistingRelease(repoRoot, tag);
        notesFile = composeReleaseNotesFile(inputs);

        const commandArgsList = buildGhReleaseCommands({
            ...inputs,
            notesFile,
            releaseExists
        });

        if (dryRun) {
            console.log(commandArgsList.map((commandArgs) => `gh ${commandArgs.join(' ')}`).join('\n'));
            return 0;
        }

        runGhCommands(repoRoot, commandArgsList);
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
    buildGhReleaseCommand: buildGhReleaseCommands,
    buildGhReleaseCommands,
    cleanupReleaseNotesFile,
    composeReleaseNotesFile,
    hasExistingRelease,
    main,
    resolveReleaseInputs,
    runGhCommands,
    validateReleaseTag
};
