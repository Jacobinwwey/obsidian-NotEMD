import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');
const englishDocPath = path.join(repoRoot, 'docs', 'maintainer', 'drawnix-export-spike.md');
const chineseDocPath = path.join(repoRoot, 'docs', 'maintainer', 'drawnix-export-spike.zh-CN.md');
const implementationPlanPaths = [
    path.join(repoRoot, 'docs', 'brainstorms', '2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.md'),
    path.join(repoRoot, 'docs', 'brainstorms', '2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.zh-CN.md')
];
const progressAuditPaths = [
    path.join(repoRoot, 'docs', 'brainstorms', '2026-05-28-mainline-progress-audit-and-next-level-direction.md'),
    path.join(repoRoot, 'docs', 'brainstorms', '2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md')
];
const referencePlanPaths = [
    path.join(repoRoot, 'docs', 'brainstorms', '2026-07-04-diagram-reference-integration-and-figure-generation-plan.md'),
    path.join(repoRoot, 'docs', 'brainstorms', '2026-07-04-diagram-reference-integration-and-figure-generation-plan.zh-CN.md')
];
const architectureDocPaths = [
    path.join(repoRoot, 'docs', 'architecture.md'),
    path.join(repoRoot, 'docs', 'architecture.zh-CN.md')
];

describe('drawnix export spike documentation contract', () => {
    test('records the native knowledge-map contract and manual import evidence boundary in both languages', () => {
        const english = fs.readFileSync(englishDocPath, 'utf8');
        const chinese = fs.readFileSync(chineseDocPath, 'utf8');

        for (const doc of [english, chinese]) {
            expect(doc).toContain('DrawnixExportedData');
            expect(doc).toContain('type/version/source/elements/viewport/theme');
            expect(doc).toContain('drawnixMindmap');
            expect(doc).toContain('DrawnixMindMapProjection');
            expect(doc).toContain('mindmap');
            expect(doc).toContain('mind_child');
            expect(doc).toContain('node.children');
            expect(doc).toContain('arrow-line');
            expect(doc).not.toContain('maximum depth 3');
            expect(doc).not.toContain('at most 4 cross-branch relationships');
            expect(doc).toContain('notemd-drawnix-mindmap-svg@1.0.0');
            expect(doc).toContain('no Plait dependency');
            expect(doc).toContain('manual open/import');
            expect(doc).toContain('localforage');
            expect(doc).toContain('.drawnix');
            expect(doc).not.toContain('exportSemanticFigureModelToDrawnixData');
            expect(doc).toContain('Architecture-canvas decision: rejected');
            expect(doc).toContain('Stage 4 decision: deferred');
            expect(doc).toContain('bundle isolation');
        }

        expect(english).toContain('no fixed depth or relation-count quota');
        expect(english).toContain('two-pass relation lanes');
        expect(chinese).toContain('不设固定的层级深度或关系数量配额');
        expect(chinese).toContain('两阶段关系通道');
    });

    test('keeps bilingual planning and progress truth aligned with the implemented architecture', () => {
        for (const planPath of implementationPlanPaths) {
            const plan = fs.readFileSync(planPath, 'utf8');
            expect(plan).toContain('status: implemented');
            expect(plan).toContain('drawnixMindmap');
            expect(plan).toContain('DrawnixMindMapProjection');
            expect(plan).toContain('notemd-drawnix-mindmap-svg@1.0.0');
            expect(plan).toContain('Mermaid `mindmap`');
            expect(plan).toContain('Stage 3 decision: rejected');
            expect(plan).toContain('DrawnixArchitectureProjection');
            expect(plan).toContain('Draw.io or Mermaid');
            expect(plan).toContain('Stage 4 decision: deferred');
            expect(plan).toContain('Plait preview');
            expect(plan).toContain('bundle isolation');
            expect(plan).not.toContain('maximum depth 3');
            expect(plan).not.toContain('at most 4 cross-branch relationships');
        }

        for (const docPath of [...progressAuditPaths, ...referencePlanPaths]) {
            const doc = fs.readFileSync(docPath, 'utf8');
            expect(doc).toContain('drawnixMindmap');
            expect(doc).toContain('DrawnixMindMapProjection');
            expect(doc).toContain('Mermaid `mindmap`');
        }
    });

    test('documents Drawnix as an independent diagram intent without changing Mermaid mindmap routing', () => {
        for (const architectureDocPath of architectureDocPaths) {
            const architecture = fs.readFileSync(architectureDocPath, 'utf8');

            expect(architecture).toMatch(/\| `drawnixMindmap` \| drawnix \| DrawnixRenderer \|/);
            expect(architecture).toMatch(/\| `mindmap` \| mermaid \| MermaidRenderer \|/);
        }
    });
});
