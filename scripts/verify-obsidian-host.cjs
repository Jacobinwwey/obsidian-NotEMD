#!/usr/bin/env node
'use strict';

// Maintainer-only probe. It refuses Vaults without an explicit disposable-fixture marker.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { verifyVaultBundle } = require('./verify-vault-bundle');

async function verifyInHost(expectedPath) {
    const nodeFs = require('fs');
    const nodePath = require('path');
    const basePath = app.vault.adapter.getBasePath();
    if (nodePath.resolve(basePath) !== expectedPath || !nodeFs.existsSync(nodePath.join(basePath, '.notemd-host-verification'))) {
        throw new Error('Host verification requires the marked disposable Vault');
    }
    if (document.visibilityState !== 'visible') throw new Error('Foreground the disposable Vault before profiling; hidden-window scheduling is not comparable');
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    for (const modal of document.querySelectorAll('.notemd-diagram-preview-shell')) {
        Array.from(modal.querySelectorAll('button')).find(button => button.textContent === 'Close')?.click();
    }
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const summary = values => {
        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        return { samples: values, p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
            p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
            standardDeviation: Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) };
    };
    const activation = [];
    for (let sample = 0; sample < 8; sample++) {
        await app.plugins.disablePlugin('notemd');
        const start = performance.now();
        await app.plugins.enablePlugin('notemd');
        activation.push(performance.now() - start);
        assert(app.plugins.plugins.notemd, 'Plugin failed to activate');
    }
    const plugin = app.plugins.plugins.notemd;
    const originalSettings = JSON.parse(JSON.stringify(plugin.settings));
    const testFolder = `host-verification-${Date.now()}`;
    await app.vault.createFolder(testFolder);
    const report = {
        host: { appVersion: window.electron.ipcRenderer.sendSync('version'), versions: process.versions,
            platform: process.platform, arch: process.arch, cpu: require('os').cpus()[0].model,
            ramBytes: require('os').totalmem(), vaultProcess: typeof app.vault.process,
            fontFamily: getComputedStyle(document.body).fontFamily, devicePixelRatio: window.devicePixelRatio,
            visibility: document.visibilityState },
        activationMs: summary(activation), testFolder
    };
    window.__notemdHostVerification = report;
    let progress;
    let cancelledAt;
    const sockets = new Set();
    const responses = [];
    const server = require('http').createServer((request, response) => {
        request.resume();
        responses.push(response);
        if (responses.length === 2) { cancelledAt = performance.now(); progress.requestCancel(); }
    });
    server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        plugin.settings = { ...originalSettings, activeProvider: 'OpenAI Compatible', useMultiModelSettings: false,
            enableResearchInGenerateContent: false, enableLocalKnowledgeRetrieval: false,
            enableBatchParallelism: true, batchConcurrency: 2, batchSize: 2, apiCallIntervalMs: 0,
            enableStableApiCall: false, autoMermaidFixAfterGenerate: false, uiLocale: 'en',
            useCustomSummarizeToMermaidSavePath: false };
        plugin.settings.providers = plugin.settings.providers.map(provider => provider.name === 'OpenAI Compatible'
            ? { ...provider, apiKey: 'local-fixture-only', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, model: 'host-fixture' }
            : provider);
        await plugin.saveSettings();
        const batchFolder = `${testFolder}/cancel`;
        await app.vault.createFolder(batchFolder);
        const sources = await Promise.all(['one', 'two'].map(name => app.vault.create(`${batchFolder}/${name}.md`, `# ${name}\n`)));
        progress = plugin.getReporter();
        const started = performance.now();
        const command = plugin.batchGenerateContentForTitlesCommand(progress, batchFolder);
        const preflightDeadline = performance.now() + 5000;
        while (performance.now() < preflightDeadline) {
            const preflight = Array.from(document.querySelectorAll('.modal')).find(modal =>
                modal.querySelector('.modal-title')?.textContent === 'Confirm batch folder' && modal.textContent.includes(batchFolder));
            if (preflight) {
                preflight.querySelector('button.mod-cta').click();
                break;
            }
            await pause(16);
        }
        let timeout;
        const batch = await Promise.race([
            command,
            new Promise((_, reject) => { timeout = setTimeout(() => { progress.requestCancel(); reject(new Error('Host cancellation did not settle')); }, 12000); })
        ]).finally(() => clearTimeout(timeout));
        const settledAt = performance.now();
        assert(responses.length === 2, `Expected two active requests, got ${responses.length}`);
        assert(batch?.cancelled && batch.generatedCount === 0 && batch.movedCount === 0, 'Cancelled command reported writes');
        for (const response of responses) {
            response.writeHead(200, { 'content-type': 'application/json' });
            response.end(JSON.stringify({ choices: [{ message: { content: 'late response must not be saved' } }] }));
        }
        await pause(350);
        for (const source of sources) {
            assert(source.path.startsWith(`${batchFolder}/`) && await app.vault.read(source) === `# ${source.basename}\n`, 'Late response mutated a source');
        }
        assert(progress.activeTasks === 0 && !plugin.getIsBusy(), 'Cancellation leaked active work');
        report.cancellation = { passed: true, requests: responses.length, settledMs: settledAt - cancelledAt,
            commandWallMs: settledAt - started,
            generatedCount: batch.generatedCount, movedCount: batch.movedCount, activeTasks: progress.activeTasks,
            reporter: progress.constructor.name, lateResponsesObservedMs: 350 };
        progress.close?.();

        const source = await app.vault.create(`${testFolder}/Artifact.md`, '# Source\n');
        const primary = `${testFolder}/Artifact_diagram.canvas`;
        for (const name of [primary, `${primary}.svg`, `${primary}.md`]) await app.vault.create(name, `before:${name}`);
        const originalProcess = app.vault.process;
        const logs = [];
        const reporter = { cancelled: false, log: message => logs.push(message), updateStatus() {}, requestCancel() {},
            clearDisplay() {}, activeTasks: 0, updateActiveTasks() {} };
        const artifact = content => ({ target: 'json-canvas', content, mimeType: 'application/json', sourceIntent: 'canvasMap',
            previewSvg: { content: '<svg xmlns="http://www.w3.org/2000/svg"/>', mimeType: 'image/svg+xml' } });
        const save = content => plugin.createDiagramCommandHostAdapter().saveArtifact(source, artifact(content), reporter);
        let failure;
        try {
            let injected = false;
            app.vault.process = async function (file, transform, options) {
                if (file.path === `${primary}.md` && !injected) {
                    injected = true;
                    await originalProcess.call(this, this.getAbstractFileByPath(primary), () => 'external edit');
                    throw new Error('Injected wrapper persistence failure');
                }
                return originalProcess.call(this, file, transform, options);
            };
            try { await save('attempted output'); } catch (error) { failure = error; }
        } finally { app.vault.process = originalProcess; }
        assert(failure?.recovery?.length > 0, 'Missing structured recovery conflict');
        assert(await app.vault.read(app.vault.getAbstractFileByPath(primary)) === 'external edit', 'Recovery overwrote the external edit');
        const recovery = failure.recovery.find(entry => entry.path === primary);
        assert(recovery?.recoveryPath && await app.vault.read(app.vault.getAbstractFileByPath(recovery.recoveryPath)) === `before:${primary}`, 'Missing recovery preimage');
        await save('next successful operation');
        assert(await app.vault.read(app.vault.getAbstractFileByPath(primary)) === 'next successful operation', 'Failure poisoned the next save');
        report.persistence = { passed: true, externalEditPreserved: true, recoveryPath: recovery.recoveryPath,
            queueUsableAfterFailure: true, atomicApi: 'Vault.process' };

        const heapBefore = require('v8').getHeapStatistics().used_heap_size;
        report.previews = [];
        const mermaid = count => ({ target: 'mermaid', sourceIntent: 'flowchart', mimeType: 'text/plain', content: 'flowchart LR\n' +
            Array.from({ length: count }, (_, i) => `n${i}["阶段 ${i} / engineering"]${i ? `\nn${i-1} --> n${i}` : ''}`).join('\n') });
        const vega = count => ({ target: 'vega-lite', sourceIntent: 'dataChart', mimeType: 'application/json', content: JSON.stringify({
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json', width: 650, height: 340,
            data: { values: Array.from({ length: count }, (_, i) => ({ category: `样本 ${i}`, value: (i * 17) % 101 })) },
            mark: 'bar', encoding: { x: { field: 'category', type: 'nominal' }, y: { field: 'value', type: 'quantitative' } }
        }) });
        const fixtures = [
            { name: 'mermaid-small-cjk', artifact: mermaid(5) }, { name: 'mermaid-dense-cjk', artifact: mermaid(40) },
            { name: 'vega-small-cjk', artifact: vega(8) }, { name: 'vega-dense-cjk', artifact: vega(80) },
            { name: 'drawnix-knowledge-map', catalog: 'drawnix-knowledge-map' }
        ];
        for (const fixture of fixtures) {
            const timings = [];
            for (let sample = 0; sample < 9; sample++) {
                const start = performance.now();
                if (fixture.catalog) await plugin.openDiagramExamplePreview(fixture.catalog);
                else plugin.openDiagramPreviewModal(fixture.artifact, '', true);
                const modal = Array.from(document.querySelectorAll('.notemd-diagram-preview-shell')).at(-1);
                assert(modal, `No preview modal for ${fixture.name}`);
                let rendered = false;
                const deadline = performance.now() + 10000;
                while (performance.now() < deadline) {
                    const frames = Array.from(modal.querySelectorAll('iframe'));
                    rendered = !!modal.querySelector('.notemd-diagram-preview-body svg')
                        || frames.some(frame => frame.contentDocument?.querySelector('svg path, svg rect, canvas'));
                    if (rendered) break;
                    await pause(16);
                }
                assert(rendered, `Preview did not render: ${fixture.name}; classes=${Array.from(modal.querySelectorAll('[class]')).slice(0, 20).map(el=>el.className).join(',')}`);
                timings.push(performance.now() - start);
                const close = Array.from(modal.querySelectorAll('button')).find(button => button.textContent === 'Close');
                assert(close, 'Preview has no Close action');
                close.click();
                const closeDeadline = performance.now() + 2000;
                while (modal.isConnected && performance.now() < closeDeadline) await pause(16);
                assert(!modal.isConnected, 'Preview did not close');
            }
            report.previews.push({ name: fixture.name, firstUseMs: timings[0], warmMs: summary(timings.slice(1)) });
        }
        report.heap = { beforeBytes: heapBefore, afterCyclesBytes: require('v8').getHeapStatistics().used_heap_size,
            collection: 'not forced; retained-memory conclusion requires a separate CDP collection' };
        report.passed = true;
        return report;
    } catch (error) {
        report.passed = false;
        report.error = error.message;
        report.observedRequestCount = responses.length;
        return report;
    } finally {
        progress?.close?.();
        for (const socket of sockets) socket.destroy();
        await new Promise(resolve => server.close(resolve));
        plugin.settings = originalSettings;
        await plugin.saveSettings();
    }
}

async function main() {
    const args = process.argv.slice(2);
    const options = { cli: 'obsidian', report: '.cache/verification/obsidian-host.json' };
    while (args.length) {
        const flag = args.shift();
        if (!['--vault', '--cli', '--report'].includes(flag) || !args[0]) throw new Error(`Invalid option ${flag}`);
        options[flag.slice(2)] = args.shift();
    }
    if (!options.vault) throw new Error('--vault must name a marked disposable Vault path');
    const vaultPath = path.resolve(options.vault);
    if (!fs.existsSync(path.join(vaultPath, '.notemd-host-verification'))) throw new Error('Missing disposable Vault marker .notemd-host-verification');
    const bundle = verifyVaultBundle({ vaultPath });
    const code = `(${verifyInHost.toString()})(${JSON.stringify(vaultPath)}).then(value=>JSON.stringify(value).replace(/[\\u0080-\\uffff]/g,ch=>'\\\\u'+ch.charCodeAt(0).toString(16).padStart(4,'0')))`;
    const scriptPath = path.resolve(options.report + '.probe.js');
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
    fs.writeFileSync(scriptPath, code);
    const expression = `eval(require('fs').readFileSync(${JSON.stringify(scriptPath)},'utf8'))`;
    const output = execFileSync(options.cli, [`vault=${path.basename(vaultPath)}`, 'eval', `code=${expression}`],
        { encoding: 'utf8', windowsHide: true, timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
    const json = output.split(/\r?\n/).find(line => line.startsWith('=> '));
    if (!json) throw new Error(output.trim() || 'Obsidian CLI returned no structured evidence');
    const report = { observedAt: new Date().toISOString(), bundle, ...JSON.parse(json.slice(3)) };
    fs.mkdirSync(path.dirname(path.resolve(options.report)), { recursive: true });
    fs.writeFileSync(options.report, `${JSON.stringify(report, null, 2)}\n`);
    if (!report.passed) throw new Error(`Host verification failed: ${report.error}`);
    console.log(JSON.stringify({ report: options.report, passed: report.passed, activationMs: report.activationMs,
        cancellation: report.cancellation, persistence: report.persistence, previews: report.previews, heap: report.heap }, null, 2));
}

if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
