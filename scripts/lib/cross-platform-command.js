'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function spawnSyncWithCommandResolution(command, args = [], options = {}) {
    if (process.platform === 'win32') {
        const resolvedCommand = resolveWindowsCommand(command, options);
        if (resolvedCommand) {
            if (isWindowsBatchFile(resolvedCommand)) {
                return spawnWindowsBatchFileSync(resolvedCommand, args, options);
            }
            return spawnSync(resolvedCommand, args, {
                ...options,
                shell: false,
                windowsHide: true
            });
        }
    }

    const directResult = spawnSync(command, args, {
        ...options,
        shell: false,
        windowsHide: true
    });

    if (!shouldRetryWithWindowsShell(directResult.error)) {
        return directResult;
    }

    const resolvedCommand = resolveWindowsCommand(command, options);
    if (resolvedCommand && isWindowsBatchFile(resolvedCommand)) {
        return spawnWindowsBatchFileSync(resolvedCommand, args, options);
    }

    return directResult;
}

function spawnWindowsBatchFileSync(command, args, options) {
    const commandLine = [
        'call',
        quoteCmdArgument(command),
        ...args.map(quoteCmdArgument)
    ].join(' ');

    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', commandLine], {
        ...options,
        shell: false,
        windowsVerbatimArguments: true,
        windowsHide: true
    });
}

function execFileSyncWithCommandResolution(command, args = [], options = {}) {
    const result = spawnSyncWithCommandResolution(command, args, {
        ...options,
        encoding: options.encoding ?? 'buffer'
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw createCommandFailure(command, args, result);
    }

    return result.stdout;
}

function createCommandFailure(command, args, result) {
    const error = new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
    error.status = result.status;
    error.signal = result.signal;
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    return error;
}

function shouldRetryWithWindowsShell(error) {
    if (process.platform !== 'win32' || !error) {
        return false;
    }

    const code = String(error.code ?? '').toUpperCase();
    const message = String(error.message ?? '').toUpperCase();
    return code === 'EINVAL'
        || code === 'ENOENT'
        || message.includes('SPAWN EINVAL')
        || message.includes('SPAWN ENOENT');
}

function resolveWindowsCommand(command, options = {}) {
    if (typeof command !== 'string' || command.trim().length === 0) {
        return null;
    }

    const env = options.env ?? process.env;
    const cwd = options.cwd ?? process.cwd();
    const pathEntries = String(env.Path ?? env.PATH ?? process.env.Path ?? process.env.PATH ?? '')
        .split(path.delimiter)
        .filter(Boolean);
    const pathExts = String(env.PATHEXT ?? process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD')
        .split(';')
        .filter(Boolean);

    const hasDirectory = /[\\/]/.test(command);
    const candidates = commandHasExtension(command)
        ? [command]
        : pathExts.map((extension) => `${command}${extension}`);

    if (hasDirectory) {
        for (const candidate of candidates) {
            const absoluteCandidate = path.resolve(cwd, candidate);
            if (fs.existsSync(absoluteCandidate)) {
                return absoluteCandidate;
            }
        }
        return null;
    }

    for (const entry of [cwd, ...pathEntries]) {
        for (const candidate of candidates) {
            const absoluteCandidate = path.join(entry, candidate);
            if (fs.existsSync(absoluteCandidate)) {
                return absoluteCandidate;
            }
        }
    }

    return null;
}

function commandHasExtension(command) {
    return path.extname(command).length > 0;
}

function isWindowsBatchFile(command) {
    const extension = path.extname(command).toLowerCase();
    return extension === '.cmd' || extension === '.bat';
}

function quoteCmdArgument(value) {
    const source = String(value);
    let quoted = '"';
    let backslashCount = 0;

    for (const char of source) {
        if (char === '\\') {
            backslashCount += 1;
            continue;
        }

        if (char === '"') {
            quoted += '\\'.repeat(backslashCount * 2 + 1);
            quoted += '"';
            backslashCount = 0;
            continue;
        }

        quoted += '\\'.repeat(backslashCount);
        quoted += char;
        backslashCount = 0;
    }

    quoted += '\\'.repeat(backslashCount * 2);
    quoted += '"';
    return quoted;
}

module.exports = {
    execFileSyncWithCommandResolution,
    spawnSyncWithCommandResolution
};
