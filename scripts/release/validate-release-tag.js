const { validateReleaseTag } = require('./publish-github-release.js');

function main(argv = process.argv.slice(2)) {
    if (argv.length !== 1 || !argv[0] || argv[0].startsWith('--')) {
        throw new Error('Usage: node scripts/release/validate-release-tag.js <tag>');
    }
    validateReleaseTag(argv[0]);
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
