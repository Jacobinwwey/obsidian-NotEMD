const { validateReleaseTag } = require('./publish-github-release.js');

function main(argv = process.argv.slice(2)) {
    const tag = argv.find((arg) => !arg.startsWith('--'));
    if (!tag) {
        throw new Error('Usage: node scripts/release/validate-release-tag.js <tag>');
    }

    validateReleaseTag(tag);
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
    main
};
