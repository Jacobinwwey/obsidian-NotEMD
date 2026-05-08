'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_MANAGER_SHIM_DIR_NAME = '.notemd-package-manager-bin';

function packageManagerCandidates() {
    return [
        { command: 'pnpm', versionArgs: ['--version'], prefix: [] },
        { command: 'corepack', versionArgs: ['pnpm', '--version'], prefix: ['pnpm'] },
        { command: 'bun', versionArgs: ['x', 'pnpm', '--version'], prefix: ['x', 'pnpm'] }
    ];
}

function buildPackageManagerRuntime(candidate, cwd) {
    if (candidate.command === 'pnpm') {
        return {
            command: candidate.command,
            prefix: candidate.prefix,
            env: { ...process.env },
            shimDir: null
        };
    }

    const shimDir = ensurePnpmShimDir(candidate, cwd);
    return {
        command: candidate.command,
        prefix: candidate.prefix,
        env: prependToPath(process.env, shimDir),
        shimDir
    };
}

function ensurePnpmShimDir(candidate, cwd) {
    const shimDir = path.join(cwd, PACKAGE_MANAGER_SHIM_DIR_NAME);
    const shimPath = path.join(shimDir, 'pnpm');
    const shimBody = buildPnpmShimBody(candidate);

    fs.mkdirSync(shimDir, { recursive: true });
    if (!fs.existsSync(shimPath) || fs.readFileSync(shimPath, 'utf8') !== shimBody) {
        fs.writeFileSync(shimPath, shimBody, 'utf8');
        fs.chmodSync(shimPath, 0o755);
    }

    return shimDir;
}

function buildPnpmShimBody(candidate) {
    switch (candidate.command) {
        case 'corepack':
            return '#!/usr/bin/env sh\nexec corepack pnpm "$@"\n';
        case 'bun':
            return '#!/usr/bin/env sh\nexec bun x pnpm "$@"\n';
        default:
            throw new Error(`Unsupported pnpm shim candidate: ${candidate.command}`);
    }
}

function prependToPath(env, entry) {
    const nextEnv = { ...env };
    nextEnv.PATH = nextEnv.PATH ? `${entry}${path.delimiter}${nextEnv.PATH}` : entry;
    return nextEnv;
}

module.exports = {
    PACKAGE_MANAGER_SHIM_DIR_NAME,
    buildPackageManagerRuntime,
    packageManagerCandidates
};
