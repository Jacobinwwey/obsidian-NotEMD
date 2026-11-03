#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { build } = require('esbuild');
const { chromium } = require('playwright');
const { getDiagramAcceptanceCases } = require('./lib/diagram-acceptance-cases');
const { renderDiagramAcceptancePage } = require('./lib/diagram-acceptance-page');

const repoRoot = path.resolve(__dirname, '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = args => execFileSync('rtk', ['proxy', 'git', ...args], { cwd: repoRoot, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });

async function buildBeforeBundle(commit, outputRoot) {
    return build({
        entryPoints: [path.join(__dirname, 'diagram-acceptance-browser-entry.ts')], bundle: true,
        platform: 'browser', format: 'iife', globalName: 'BaselineAcceptance', target: 'es2020',
        outfile: path.join(outputRoot, 'baseline-runtime.js'), logLevel: 'silent',
        plugins: [{ name: 'read-baseline-source', setup(builder) {
            builder.onLoad({ filter: /[.]ts$/ }, input => {
                const relativePath = path.relative(repoRoot, input.path).split(path.sep).join('/');
                if (!relativePath.startsWith('src/')) return undefined;
                return { contents: git(['show', commit + ':' + relativePath]), loader: 'ts', resolveDir: path.dirname(input.path) };
            });
        } }]
    });
}

async function buildCurrentBundle(outputRoot) {
    return build({ entryPoints: [path.join(__dirname, 'diagram-acceptance-browser-entry.ts')], bundle: true,
        platform: 'browser', format: 'iife', globalName: 'CurrentAcceptance', target: 'es2020',
        outfile: path.join(outputRoot, 'current-runtime.js'), logLevel: 'silent', metafile: true });
}

async function renderSpecimen(page, runtimeName, operation, spec) {
    return page.evaluate(async input => {
        const runtime = window[input.runtimeName];
        const validation = runtime.validateDiagramSpec(input.spec);
        if (validation.errors.length) throw new Error('Acceptance source is not renderable: ' + validation.errors.join('; '));
        const { svg, source } = await runtime[input.operation](input.spec);
        const kind = 'diagram';
        document.body.innerHTML = '<main></main>';
        document.querySelector('main').innerHTML = svg;
        const root = document.querySelector('svg');
        if (!root) throw new Error('Acceptance renderer returned no SVG.');
        const siblingLefts = Array.from(root.querySelectorAll('[id^="reference-tree-node-child_"] > rect')).map(rect => Number(rect.getAttribute('x'))).sort((first, second) => first - second);
        const gaps = siblingLefts.slice(1).map((left, index) => left - siblingLefts[index]);
        const classIds = source ? Array.from(source.matchAll(/class ([A-Za-z0-9_]+)/g), match => match[1]) : [];
        const participantIds = source ? Array.from(source.matchAll(/participant ([A-Za-z0-9_]+) as/g), match => match[1]) : [];
        const measurements = { validationErrors: validation.errors, entityTables: root.querySelectorAll('[data-er-entity]').length,
            attributeRows: root.querySelectorAll('[data-er-attribute]').length, uniqueClassIds: new Set(classIds).size,
            uniqueParticipantIds: new Set(participantIds).size, siblingMinimumDistance: gaps.length ? Math.min(...gaps) : null,
            treeNodes: root.querySelectorAll('[id^="reference-tree-node-"]').length,
            treeEdges: root.querySelectorAll('[id^="reference-tree-edge-"]').length,
            cycleEdges: root.querySelectorAll('[data-source-cycle="true"]').length,
            missingSteps: root.querySelectorAll('[data-source-missing="true"]').length,
            sourceNotices: root.querySelectorAll('[data-source-notice]').length,
            canvasWidth: root.viewBox.baseVal.width, canvasHeight: root.viewBox.baseVal.height,
            actorHeaders: root.querySelectorAll('rect.actor-top, rect.actor-bottom').length,
            treeRouteLength: Array.from(root.querySelectorAll('[id^="reference-tree-edge-"]')).reduce((length, edge) => length + edge.getTotalLength(), 0) };
        return { svg, source, kind, measurements };
    }, { runtimeName, operation, spec });
}

async function writeSpecimen(page, outputRoot, entry, side, rendered, spec) {
    const relativeStem = entry.id + '/' + side;
    const svgPath = relativeStem + '.svg';
    const pngPath = relativeStem + '.png';
    const sourcePath = relativeStem + '.json';
    fs.mkdirSync(path.join(outputRoot, entry.id), { recursive: true });
    const sourceText = JSON.stringify(spec, null, 2) + '\n';
    fs.writeFileSync(path.join(outputRoot, svgPath), rendered.svg);
    fs.writeFileSync(path.join(outputRoot, sourcePath), sourceText);
    if (rendered.source) fs.writeFileSync(path.join(outputRoot, relativeStem + '.mmd'), rendered.source);
    const raster = await page.evaluate(async svg => {
        const image = await window.CurrentAcceptance.rasterizeSvgToImageArrayBuffer(svg, undefined, { ppi: 144 });
        return { bytes: Array.from(new Uint8Array(image.data)), width: image.imageWidthPx, height: image.imageHeightPx, ppi: image.ppi };
    }, rendered.svg);
    const bytes = Buffer.from(raster.bytes);
    fs.writeFileSync(path.join(outputRoot, pngPath), bytes);
    return { png: pngPath, svg: svgPath, source: sourcePath, sha256: hash(bytes), svgSha256: hash(rendered.svg), sourceSha256: hash(sourceText),
        kind: rendered.kind, width: raster.width, height: raster.height, ppi: raster.ppi };
}

function verifyImprovements(cases) {
    const byId = new Map(cases.map(entry => [entry.id, entry]));
    const assert = (condition, message) => { if (!condition) throw new Error('Acceptance failed: ' + message); };
    assert(byId.get('er-layout').measurements.before.entityTables === 0 && byId.get('er-layout').measurements.after.entityTables === 2, 'ER layout comparison');
    assert(byId.get('er-semantics').measurements.after.attributeRows === 4, 'ER field preservation');
    assert(byId.get('class-identity').measurements.before.uniqueClassIds === 1 && byId.get('class-identity').measurements.after.uniqueClassIds === 2, 'class identity');
    assert(byId.get('sequence-identity').measurements.before.uniqueParticipantIds === 1 && byId.get('sequence-identity').measurements.after.uniqueParticipantIds === 2, 'sequence identity');
    assert(byId.get('tree-spacing').measurements.before.siblingMinimumDistance < 194 && byId.get('tree-spacing').measurements.after.siblingMinimumDistance >= 194, 'tree spacing');
    for (const id of ['tree-cycle', 'lane-handoff']) assert(byId.get(id).before.kind === 'diagram' && byId.get(id).after.kind === 'diagram' && byId.get(id).measurements.after.sourceNotices === 1, id + ' annotated diagram');
    const cycle = byId.get('tree-cycle').measurements.after;
    assert(cycle.treeNodes === 3 && cycle.treeEdges === 2 && cycle.cycleEdges === 2, 'all cyclic source relations retained');
    assert(byId.get('lane-handoff').measurements.after.missingSteps === 1, 'unprovided step visible');
}

async function verifyAcceptancePage(browser, outputRoot, manifest) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
        await page.goto(pathToFileURL(path.join(outputRoot, 'index.html')).href);
        await page.evaluate(async () => {
            for (const image of document.querySelectorAll('main img')) image.loading = 'eager';
            await Promise.all(Array.from(document.querySelectorAll('main img'), image => image.decode()));
        });
        for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(viewport);
            const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1,
                images: document.querySelectorAll('main img').length, broken: Array.from(document.querySelectorAll('main img')).filter(image => !image.naturalWidth).length,
                minimumImageTarget: Math.min(...Array.from(document.querySelectorAll('.image-open'), button => button.getBoundingClientRect().height)) }));
            if (metrics.overflow || metrics.broken || metrics.images !== manifest.cases.length * 2 || metrics.minimumImageTarget < 44) throw new Error('Acceptance page geometry/images failed: ' + JSON.stringify(metrics));
            await page.screenshot({ path: path.join(outputRoot, viewport.width === 390 ? 'review-mobile.png' : 'review-desktop.png'), fullPage: true });
        }
        const opener = page.locator('.image-open').first();
        await opener.focus(); await page.keyboard.press('Enter');
        await page.locator('dialog').waitFor({ state: 'visible' });
        await page.locator('#viewer-native').click();
        if (!await page.locator('.viewer-scroll').evaluate(element => element.classList.contains('native'))) throw new Error('Native-resolution viewer failed.');
        await page.keyboard.press('Escape');
        if (!await opener.evaluate(element => element === document.activeElement)) throw new Error('Viewer did not return keyboard focus.');
        if (errors.length) throw new Error('Acceptance page script errors: ' + errors.join('; '));
    } finally { await page.close(); }
}

async function main() {
    const baselineCommit = git(['rev-parse', 'HEAD']).trim();
    const outputRoot = path.join(repoRoot, '.cache', 'diagram-acceptance', 'run-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomBytes(3).toString('hex'));
    fs.mkdirSync(path.dirname(outputRoot), { recursive: true });
    fs.mkdirSync(outputRoot);
    console.log('Acceptance folder: ' + outputRoot);
    await buildBeforeBundle(baselineCommit, outputRoot);
    const currentBuild = await buildCurrentBundle(outputRoot);
    const sourceFiles = Object.keys(currentBuild.metafile.inputs).filter(input => !input.includes('node_modules')).map(input => path.resolve(repoRoot, input));
    sourceFiles.push(__filename, path.join(__dirname, 'lib/diagram-acceptance-cases.js'), path.join(__dirname, 'lib/diagram-acceptance-page.js'), path.join(repoRoot, 'pnpm-lock.yaml'));
    const currentSourceSha256 = Object.fromEntries(sourceFiles.map(file => [path.relative(repoRoot, file).split(path.sep).join('/'), hash(fs.readFileSync(file))]));
    const browser = await chromium.launch({ headless: true, timeout: 120000 });
    try {
        const beforePage = await browser.newPage({ colorScheme: 'light' });
        const afterPage = await browser.newPage({ colorScheme: 'light' });
        await beforePage.setContent('<main></main>'); await afterPage.setContent('<main></main>');
        await beforePage.addScriptTag({ path: path.join(outputRoot, 'baseline-runtime.js') });
        await afterPage.addScriptTag({ path: path.join(outputRoot, 'current-runtime.js') });
        const cases = [];
        for (const entry of getDiagramAcceptanceCases()) {
            console.log('Rendering ' + entry.id);
            const before = await renderSpecimen(beforePage, 'BaselineAcceptance', entry.operation, entry.beforeSpec);
            const after = await renderSpecimen(afterPage, 'CurrentAcceptance', entry.operation, entry.afterSpec);
            if (after.kind !== (entry.expectedAfter || 'diagram')) throw new Error('Unexpected after outcome for ' + entry.id);
            if (entry.comparison === 'identical-input' && JSON.stringify(entry.beforeSpec) !== JSON.stringify(entry.afterSpec)) throw new Error('Unequal comparison inputs: ' + entry.id);
            cases.push({ id: entry.id, title: entry.title, explanation: entry.explanation, comparison: entry.comparison,
                before: await writeSpecimen(afterPage, outputRoot, entry, 'before', before, entry.beforeSpec),
                after: await writeSpecimen(afterPage, outputRoot, entry, 'after', after, entry.afterSpec),
                measurements: { before: before.measurements, after: after.measurements } });
        }
        verifyImprovements(cases);
        const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), baselineCommit, currentSourceSha256,
            environment: { platform: process.platform, node: process.version, chromium: browser.version(), rasterPpi: 144,
                note: 'Both implementations use the current lockfile/runtime; before source comes from Git HEAD. PNG rasterization uses the same current exporter for both.' }, cases };
        fs.writeFileSync(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
        fs.writeFileSync(path.join(outputRoot, 'index.html'), renderDiagramAcceptancePage(manifest));
        fs.writeFileSync(path.join(outputRoot, 'README.md'), '# 图形修复验收\n\n打开 index.html。七组案例包含真实的前后 PNG、SVG 与输入 JSON。六组输入完全相同；ER 语义案例比较相同来源事实的旧投影与新契约，不是同一 JSON。七组均为真实图表；循环关系与缺失步骤以图内标注保留，可直接导出。前后使用相同当前依赖与 PNG 导出器，基线源码来自 Git HEAD。未调用 LLM，不证明全部供应商生成质量。manifest.json 记录版本、文件哈希与测量。浏览器截图仅用于页面验收，不替代图表导出。\n\n# Diagram repair acceptance\n\nOpen index.html. Seven pairs contain actual PNG exports, SVG and source JSON. Six pairs use identical inputs; the ER semantic case compares the old projection and new typed contract of equivalent facts, not identical JSON. All seven pairs are real diagrams; visible source caveats retain cycles and unprovided steps in the exported images. Both versions share current dependencies and the PNG exporter; baseline source is read from Git HEAD. No live LLM quality is claimed. manifest.json records revisions, hashes and measurements. Browser screenshots document the page, not substitute diagram exports.\n');
        await verifyAcceptancePage(browser, outputRoot, manifest);
        const proof = { status: 'passed', cases: cases.length, pngs: cases.length * 2, desktop: '1440x1000', mobile: '390x844', keyboardOpenClose: true, nativeResolution: true };
        fs.writeFileSync(path.join(outputRoot, 'verification.json'), JSON.stringify(proof, null, 2) + '\n');
        fs.writeFileSync(path.join(path.dirname(outputRoot), 'latest.json'), JSON.stringify({ outputRoot, ...proof }, null, 2) + '\n');
        console.log(JSON.stringify({ outputRoot, ...proof }, null, 2));
    } finally { await browser.close(); }
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

module.exports = { verifyImprovements };
