'use strict';

const BOT_IDENTITY_PATTERN = /\[bot\]/i;

function parseContributorIdentityEntries(identitySource) {
    return String(identitySource)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const match = line.match(/^(?:(\d+)\s+)?(.+?)\s+<([^>]+)>$/);
            if (!match) {
                return null;
            }

            return {
                commits: Number(match[1] || 0),
                name: match[2].trim(),
                email: match[3].trim(),
            };
        })
        .filter(Boolean);
}

function isBotContributorEntry(entry) {
    if (!entry) {
        return false;
    }

    return BOT_IDENTITY_PATTERN.test(entry.name) || BOT_IDENTITY_PATTERN.test(entry.email);
}

function canonicalContributorKey(entry) {
    if (!entry) {
        return '';
    }

    const email = String(entry.email || '').trim().toLowerCase();
    if (email) {
        return email;
    }

    return String(entry.name || '').trim().toLowerCase();
}

function countCanonicalHumanContributorsFromShortlog(shortlogSource) {
    const identities = new Set();
    for (const entry of parseContributorIdentityEntries(shortlogSource)) {
        if (isBotContributorEntry(entry)) {
            continue;
        }

        const key = canonicalContributorKey(entry);
        if (key) {
            identities.add(key);
        }
    }

    return identities.size;
}

function countCanonicalHumanContributorsFromIdentityLines(identitySource) {
    return countCanonicalHumanContributorsFromShortlog(identitySource);
}

function rewriteRepoSagaContributorCountsInSvg(svgSource, stats) {
    if (!stats || !stats.summary || !Array.isArray(stats.quarters)) {
        throw new Error('Missing repo-saga contributor stats for SVG rewrite.');
    }

    let next = String(svgSource);

    next = rewriteSummaryContributorCount(next, stats.summary);
    for (const quarter of stats.quarters) {
        next = rewriteQuarterContributorCount(next, quarter);
    }

    return next;
}

function rewriteSummaryContributorCount(svgSource, summary) {
    const summaryPattern = new RegExp(
        `(${escapeRegex(summary.rangeStartLabel)}\\s*[—-]\\s*${escapeRegex(summary.rangeEndLabel)}[^<]*?[·•]\\s*[^<]*?[·•]\\s*)(\\d+)(\\s*[^<]*?[·•]\\s*${escapeRegex(formatNumber(summary.tagCount))}[^<]*</text>)`
    );

    if (!summaryPattern.test(svgSource)) {
        throw new Error(`Could not locate repo-saga summary contributor count for ${summary.rangeStartLabel} — ${summary.rangeEndLabel}.`);
    }

    return svgSource.replace(summaryPattern, `$1${summary.contributorCount}$3`);
}

function rewriteQuarterContributorCount(svgSource, quarter) {
    const quarterPattern = new RegExp(
        `(${escapeRegex(quarter.label)}\\s*[：:]\\s*[^<]*?[，、,]\\s*)(\\d+)(\\s*[^<]*</text>)`
    );

    if (!quarterPattern.test(svgSource)) {
        throw new Error(`Could not locate repo-saga quarter contributor count for ${quarter.label}.`);
    }

    return svgSource.replace(quarterPattern, `$1${quarter.contributorCount}$3`);
}

function formatNumber(value) {
    return Number(value).toLocaleString('en-US');
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
    countCanonicalHumanContributorsFromIdentityLines,
    countCanonicalHumanContributorsFromShortlog,
    parseContributorIdentityEntries,
    rewriteRepoSagaContributorCountsInSvg,
};
