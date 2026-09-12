#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { verifyVaultBundle } = require('./verify-vault-bundle');

// This probe exercises real Vault rename/process behavior without profiling a window.
async function verifyPersistenceInHost(expectedPath) {
    const basePath = app.vault.adapter.getBasePath();
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    assert(require('path').resolve(basePath) === expectedPath
        && require('fs').existsSync(require('path').join(basePath, '.notemd-host-verification')),
    'Persistence verification requires the marked disposable Vault');
    const plugin = app.plugins.plugins.notemd;
    assert(plugin && typeof app.vault.process === 'function', 'The loaded plugin and Vault.process are required');
    const originalSettings = plugin.settings;
    const originalProcess = app.vault.process;
    const originalRead = app.vault.read;
    const originalReadBinary = app.vault.readBinary;
    const folder = `persistence-verification-${Date.now()}`;
    const reporter = { cancelled: false, log() {}, updateStatus() {}, requestCancel() {}, clearDisplay() {}, activeTasks: 0, updateActiveTasks() {} };
    const cases = [];
    await app.vault.createFolder(folder);
    plugin.settings = { ...originalSettings, useCustomSummarizeToMermaidSavePath: false };
    try {
        for (const scenario of ['atomic-write-move', 'legacy-write-move', 'binary-write-move', 'compensation-move', 'compensation-replacement']) {
            const directory = `${folder}/${scenario}`;
            await app.vault.createFolder(directory);
            const source = await app.vault.create(`${directory}/Source.md`, '# Fixture\n');
            const primary = `${directory}/Source_diagram.canvas`;
            for (const output of [primary, `${primary}.svg`, `${primary}.md`]) await app.vault.create(output, `before:${output}`);
            const artifact = { target: 'json-canvas', content: 'generated', mimeType: 'application/json', sourceIntent: 'canvasMap',
                previewSvg: { content: '<svg xmlns="http://www.w3.org/2000/svg"/>', mimeType: 'image/svg+xml' } };
            const movedPath = `${directory}/user-moved`;
            const save = () => plugin.createDiagramCommandHostAdapter().saveArtifact(source, artifact, reporter);
            let restoring = false;
            let injected = false;
            let failure;
            try {
                if (scenario === 'legacy-write-move') {
                    app.vault.process = undefined;
                    app.vault.read = async function (file) {
                        const text = await originalRead.call(this, file);
                        if (!injected && file.path === `${primary}.svg`) { injected = true; await this.rename(file, movedPath); }
                        return text;
                    };
                } else if (scenario === 'binary-write-move') {
                    await app.vault.createBinary(`${directory}/fixture.png`, new Uint8Array([1, 2, 3]).buffer);
                    artifact.companions = [{ path: 'fixture.png', content: new Uint8Array([4, 5, 6]).buffer, binary: true, mimeType: 'image/png' }];
                    app.vault.readBinary = async function (file) {
                        const bytes = await originalReadBinary.call(this, file);
                        if (!injected && file.path === `${directory}/fixture.png`) { injected = true; await this.rename(file, movedPath); }
                        return bytes;
                    };
                } else {
                    app.vault.process = async function (file, transform, options) {
                        if (scenario.startsWith('compensation-') && file.path === `${primary}.md` && !restoring) {
                            restoring = true;
                            throw new Error('Injected wrapper failure');
                        }
                        if (!injected && ((scenario === 'atomic-write-move' && file.path === `${primary}.svg`)
                            || (restoring && file.path === primary))) {
                            injected = true;
                            await this.rename(file, movedPath);
                            if (scenario === 'compensation-replacement') await this.create(primary, 'external replacement');
                        }
                        return originalProcess.call(this, file, transform, options);
                    };
                }
                try { await save(); } catch (error) { failure = error; }
            } finally {
                app.vault.process = originalProcess;
                app.vault.read = originalRead;
                app.vault.readBinary = originalReadBinary;
            }
            assert(injected && failure, `${scenario}: the injected path race was not rejected`);
            const movedFile = app.vault.getAbstractFileByPath(movedPath);
            assert(movedFile, `${scenario}: moved file was lost`);
            if (scenario === 'binary-write-move') {
                assert(Array.from(new Uint8Array(await app.vault.readBinary(movedFile))).join(',') === '1,2,3', 'Binary preimage was overwritten');
            } else {
                const expected = restoring ? 'generated' : `before:${primary}.svg`;
                assert(await app.vault.read(movedFile) === expected, `${scenario}: moved contents were overwritten`);
            }
            if (restoring) {
                const recovery = failure.recovery.find(entry => entry.path === primary);
                assert(recovery?.recoveryPath && await app.vault.read(app.vault.getAbstractFileByPath(recovery.recoveryPath)) === `before:${primary}`,
                    `${scenario}: missing recovery preimage`);
            }
            if (scenario === 'compensation-replacement') {
                assert(await app.vault.read(app.vault.getAbstractFileByPath(primary)) === 'external replacement', 'Replacement was overwritten');
            }
            await save();
            assert(await app.vault.read(app.vault.getAbstractFileByPath(primary)) === 'generated', `${scenario}: queue remained blocked`);
            cases.push({ scenario, rejected: true, movedFilePreserved: true, queueUsable: true });
        }
        return { passed: true, appVersion: window.electron.ipcRenderer.sendSync('version'), cases, fixtureFolder: folder };
    } finally {
        app.vault.process = originalProcess;
        app.vault.read = originalRead;
        app.vault.readBinary = originalReadBinary;
        plugin.settings = originalSettings;
    }
}

function main() {
    const [vault, cli = 'obsidian', reportPath = '.cache/verification/obsidian-persistence.json'] = process.argv.slice(2);
    if (!vault) throw new Error('Usage: node scripts/verify-obsidian-persistence.cjs <disposable-vault> [obsidian-cli-executable] [report.json]');
    const vaultPath = path.resolve(vault);
    if (!fs.existsSync(path.join(vaultPath, '.notemd-host-verification'))) throw new Error('Missing disposable Vault marker');
    const bundle = verifyVaultBundle({ vaultPath });
    const scriptPath = path.resolve(reportPath + '.probe.js');
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
    fs.writeFileSync(scriptPath, `(${verifyPersistenceInHost.toString()})(${JSON.stringify(vaultPath)}).then(value=>JSON.stringify(value))`);
    const expression = `eval(require('fs').readFileSync(${JSON.stringify(scriptPath)},'utf8'))`;
    const output = execFileSync(cli, [`vault=${path.basename(vaultPath)}`, 'eval', `code=${expression}`],
        { encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024 });
    const json = output.split(/\r?\n/).find(line => line.startsWith('=> '));
    if (!json) throw new Error(output.trim() || 'Obsidian CLI returned no structured evidence');
    const report = { observedAt: new Date().toISOString(), bundle, ...JSON.parse(json.slice(3)) };
    fs.writeFileSync(path.resolve(reportPath), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
}

if (require.main === module) {
    try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
