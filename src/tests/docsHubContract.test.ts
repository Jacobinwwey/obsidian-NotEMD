import * as fs from 'fs';
import * as path from 'path';

describe('docs hub contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const docsHub = fs.readFileSync(path.join(repoRoot, 'docs', 'README.md'), 'utf8');
    const docsHubZh = fs.readFileSync(path.join(repoRoot, 'docs', 'README.zh-CN.md'), 'utf8');
    const docsIndex = fs.readFileSync(path.join(repoRoot, 'docs', 'index.md'), 'utf8');
    const docsIndexZh = fs.readFileSync(path.join(repoRoot, 'docs', 'index.zh-CN.md'), 'utf8');

    test('docs hub keeps the local kb decision record discoverable in both languages', () => {
        expect(docsHub).toContain(
            '[Local KB Retrieval Decision And Quality Truth](./brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.md)'
        );
        expect(docsHubZh).toContain(
            '[Local KB Retrieval 方案决策与质量真值](./brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.zh-CN.md)'
        );
        expect(docsHub).toContain(
            '[Local KB RAG Quality And Execution Truth](./brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md)'
        );
        expect(docsHubZh).toContain(
            '[Local KB RAG 质量与执行链路真值](./brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md)'
        );
        expect(docsHub).toContain(
            '[Chapter Split Knowledge Management And TOC Comparison Truth](./brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md)'
        );
        expect(docsHubZh).toContain(
            '[Chapter Split 的知识管理与 TOC 对比真值](./brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md)'
        );
    });

    test('docs preview index keeps the same local kb and chapter split research truth discoverable in both languages', () => {
        expect(docsIndex).toContain(
            '[Local KB Retrieval Decision And Quality Truth (EN)](./brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.md)'
        );
        expect(docsIndex).toContain(
            '[Local KB RAG Quality And Execution Truth (EN)](./brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md)'
        );
        expect(docsIndex).toContain(
            '[Chapter Split Knowledge Management And TOC Comparison Truth (EN)](./brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md)'
        );
        expect(docsIndexZh).toContain(
            '[Local KB Retrieval 方案决策与质量真值（中文）](./brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.zh-CN.md)'
        );
        expect(docsIndexZh).toContain(
            '[Local KB RAG 质量与执行链路真值（中文）](./brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md)'
        );
        expect(docsIndexZh).toContain(
            '[Chapter Split 的知识管理与 TOC 对比真值（中文）](./brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md)'
        );
    });

    test('docs hub and preview index keep the diagram reference integration plan discoverable in both languages', () => {
        expect(docsHub).toContain(
            '[Diagram Reference Integration And Figure Generation Plan](./brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.md)'
        );
        expect(docsHubZh).toContain(
            '[图形参考项目集成与 Figure 生成扩展方案](./brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.zh-CN.md)'
        );
        expect(docsIndex).toContain(
            '[Diagram Reference Integration And Figure Generation Plan (EN)](./brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.md)'
        );
        expect(docsIndex).toContain(
            '[Diagram Reference Integration And Figure Generation Plan (zh-CN)](./brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.zh-CN.md)'
        );
        expect(docsIndexZh).toContain(
            '[图形参考项目集成与 Figure 生成扩展方案（英文）](./brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.md)'
        );
        expect(docsIndexZh).toContain(
            '[图形参考项目集成与 Figure 生成扩展方案（中文）](./brainstorms/2026-07-04-diagram-reference-integration-and-figure-generation-plan.zh-CN.md)'
        );
    });
});
