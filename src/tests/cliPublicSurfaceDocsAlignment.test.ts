import * as fs from 'fs';
import * as path from 'path';

import { buildCliPublicSurface } from '../operations/publicCliSurface';

const repoRoot = path.join(__dirname, '..', '..');
const { OPERATION_HELP } = require('../../scripts/lib/maintainer-cli-operation-help.js');

function extractBacktickedBulletValues(content: string, sectionHeading: string): string[] {
    const sectionStart = content.indexOf(sectionHeading);
    if (sectionStart < 0) {
        throw new Error(`Section heading not found: ${sectionHeading}`);
    }

    const sectionTail = content.slice(sectionStart + sectionHeading.length).split('\n');
    const values: string[] = [];
    let started = false;

    for (const line of sectionTail) {
        const trimmed = line.trim();
        if (!started && trimmed === '') {
            continue;
        }

        if (!trimmed.startsWith('- `')) {
            if (started) {
                break;
            }
            continue;
        }

        started = true;
        const match = trimmed.match(/^- `([^`]+)`$/);
        if (!match) {
            throw new Error(`Unexpected bullet format in section ${sectionHeading}: ${trimmed}`);
        }
        values.push(match[1]);
    }

    if (values.length === 0) {
        throw new Error(`No bullet values found for section: ${sectionHeading}`);
    }

    return values;
}

describe('CLI public surface docs alignment', () => {
    const expectedPublicSurfaceCommandIds = buildCliPublicSurface().commands
        .map(command => command.id)
        .sort();
    const expectedMaintainerBridgeOperationIds = Object.keys(OPERATION_HELP).sort();
    const matrixPath = path.join(repoRoot, 'docs', 'maintainer', 'notemd-cli-capability-matrix.md');
    const matrixZhPath = path.join(repoRoot, 'docs', 'maintainer', 'notemd-cli-capability-matrix.zh-CN.md');
    const runbookPath = path.join(repoRoot, 'docs', 'maintainer', 'diagram-semantic-verification.md');
    const runbookZhPath = path.join(repoRoot, 'docs', 'maintainer', 'diagram-semantic-verification.zh-CN.md');

    test('maintainer CLI matrix docs enumerate the exact current public-safe command slice', () => {
        const matrix = fs.readFileSync(matrixPath, 'utf8');
        const matrixZh = fs.readFileSync(matrixZhPath, 'utf8');

        const matrixIds = extractBacktickedBulletValues(matrix, 'Current command IDs in this slice:').sort();
        const matrixZhIds = extractBacktickedBulletValues(matrixZh, '当前这一 slice 中的命令 ID 明确只有：').sort();

        expect(matrixIds).toEqual(expectedPublicSurfaceCommandIds);
        expect(matrixZhIds).toEqual(expectedPublicSurfaceCommandIds);

        expect(matrix).toContain('`outputHandlingTags=contains-provider-credentials`');
        expect(matrixZh).toContain('`outputHandlingTags=contains-provider-credentials`');
        expect(matrix).toContain('`notemd:export-provider-profiles`');
        expect(matrixZh).toContain('`notemd:export-provider-profiles`');
    });

    test('semantic verification runbooks keep the current public-safe slice and exclusion rule visible', () => {
        const runbook = fs.readFileSync(runbookPath, 'utf8');
        const runbookZh = fs.readFileSync(runbookZhPath, 'utf8');

        for (const commandId of expectedPublicSurfaceCommandIds) {
            expect(runbook).toContain(`\`${commandId}\``);
            expect(runbookZh).toContain(`\`${commandId}\``);
        }

        expect(runbook).toContain('`notemd:export-provider-profiles`');
        expect(runbookZh).toContain('`notemd:export-provider-profiles`');
        expect(runbook).toContain('`outputHandlingTags=contains-provider-credentials`');
        expect(runbookZh).toContain('`outputHandlingTags=contains-provider-credentials`');
        expect(runbook).toContain('Public CLI Surface Contract');
        expect(runbookZh).toContain('Public CLI Surface Contract');
    });

    test('maintainer CLI matrix docs enumerate the exact current bounded bridge operations and shared help source', () => {
        const matrix = fs.readFileSync(matrixPath, 'utf8');
        const matrixZh = fs.readFileSync(matrixZhPath, 'utf8');

        const matrixOperationIds = extractBacktickedBulletValues(matrix, 'supported operation ids:').sort();
        const matrixZhOperationIds = extractBacktickedBulletValues(matrixZh, '当前仅支持的 operation id：').sort();

        expect(matrixOperationIds).toEqual(expectedMaintainerBridgeOperationIds);
        expect(matrixZhOperationIds).toEqual(expectedMaintainerBridgeOperationIds);

        expect(matrix).toContain('`scripts/lib/maintainer-cli-operation-help.js`');
        expect(matrixZh).toContain('`scripts/lib/maintainer-cli-operation-help.js`');
        expect(matrix).toContain('maintainer helper metadata');
        expect(matrixZh).toContain('共享帮助元数据');
        expect(matrix).toContain('`local-knowledge.inspect`');
        expect(matrixZh).toContain('`local-knowledge.inspect`');
        expect(matrix).toContain('effective knowledge-base path resolution');
        expect(matrixZh).toContain('实际生效的知识库路径解析结果');
        expect(matrix).toContain('query diagnostics');
        expect(matrixZh).toContain('query diagnostics');
        expect(matrix).toContain('temporary `knowledgePaths` override array');
        expect(matrixZh).toContain('临时 `knowledgePaths` override 数组');
        expect(matrix).toContain('`createRenderHostBundleBuildOptions()` candidate-only');
        expect(matrix).toContain('outside `esbuild.config.mjs`');
        expect(matrix).toContain('build, release assets, audit, and docs moving together');
        expect(matrixZh).toContain('`createRenderHostBundleBuildOptions()` 保持在 `esbuild.config.mjs` 之外的 candidate-only 状态');
        expect(matrixZh).toContain('build、release assets、audit 与 docs');
        expect(matrix).toContain("npm run cli:invoke -- --vault docs --operation local-knowledge.inspect");
        expect(matrixZh).toContain("npm run cli:invoke -- --vault docs --operation local-knowledge.inspect");
        expect(matrix).toContain('"sourcePath":"index.zh-CN.md"');
        expect(matrixZh).toContain('"sourcePath":"index.zh-CN.md"');
        expect(matrix).toContain('"knowledgePaths":["maintainer","superpowers"]');
        expect(matrixZh).toContain('"knowledgePaths":["maintainer","superpowers"]');
        expect(matrix).toContain('"query":"chapter split TOC managed artifacts guarded reruns"');
        expect(matrixZh).toContain('"query":"chapter split TOC managed artifacts guarded reruns"');
        expect(matrix).toContain('"knowledgePaths":["chapter-split-toc.md","chapter-split-toc.zh-CN.md"]');
        expect(matrixZh).toContain('"knowledgePaths":["chapter-split-toc.md","chapter-split-toc.zh-CN.md"]');
        expect(matrix).toContain('"query":"real-note query diversity beyond chapter split showcase"');
        expect(matrixZh).toContain('"query":"real-note query diversity beyond chapter split showcase"');
        expect(matrix).toContain('"knowledgePaths":["brainstorms","maintainer"]');
        expect(matrixZh).toContain('"knowledgePaths":["brainstorms","maintainer"]');
        expect(matrix).toContain('"sourcePath":"brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md"');
        expect(matrixZh).toContain('"sourcePath":"brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md"');
        expect(matrix).toContain('"query":"missing path coverage"');
        expect(matrixZh).toContain('"query":"missing path coverage"');
        expect(matrix).toContain('"knowledgePaths":[]');
        expect(matrixZh).toContain('"knowledgePaths":[]');
        expect(matrix).toContain('"query":"svg-only repo saga scope"');
        expect(matrixZh).toContain('"query":"svg-only repo saga scope"');
        expect(matrix).toContain('"knowledgePaths":["repo-saga"]');
        expect(matrixZh).toContain('"knowledgePaths":["repo-saga"]');
        expect(matrix).toContain('vault-relative');
        expect(matrixZh).toContain('vault-relative');
    });
});
