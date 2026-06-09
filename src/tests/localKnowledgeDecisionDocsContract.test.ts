import * as fs from 'fs';
import * as path from 'path';

describe('local knowledge decision docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const decisionDoc = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-06-09-local-kb-retrieval-decision-and-quality-truth.md'),
        'utf8'
    );
    const decisionDocZh = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-06-09-local-kb-retrieval-decision-and-quality-truth.zh-CN.md'),
        'utf8'
    );

    test('repo-owned local kb decision docs keep the shipped MiniSearch-vs-heavy-RAG truth explicit in both languages', () => {
        for (const content of [decisionDoc, decisionDocZh]) {
            expect(content).toContain('MiniSearch');
            expect(content).toContain('LightRAG');
            expect(content).toContain('txtai');
            expect(content).toContain('Mem0');
            expect(content).toContain('Smart Connections');
            expect(content).toContain('Smart Composer');
            expect(content).toContain('RAGPerf');
            expect(content).toContain('ragas');
        }

        expect(decisionDoc).toContain('**MiniSearch** remains the correct implementation base for current `main`');
        expect(decisionDocZh).toContain('**MiniSearch** 仍是当前主线上最合适的实现基座');
        expect(decisionDoc).toContain('### 3.2 Rejected as direct runtime bases');
        expect(decisionDocZh).toContain('仍被排除为直连 runtime 基座');
        expect(decisionDoc).toContain('2026-06-09-local-kb-rag-quality-and-execution-truth.md');
        expect(decisionDocZh).toContain('2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md');
        expect(decisionDoc).toContain('2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md');
        expect(decisionDocZh).toContain('2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md');
        expect(decisionDoc).toContain('plugin-native MiniSearch lexical retriever with task-scoped prompt injection');
        expect(decisionDocZh).toContain('plugin-native 的 MiniSearch lexical retriever，加上 task-scoped prompt injection');
        expect(decisionDoc).toContain('do not overclaim semantic/vector retrieval');
        expect(decisionDocZh).toContain('不要高估 semantic/vector retrieval');
        expect(decisionDoc).toContain('continue improving offline evidence through `npm run verify:local-kb-fixtures`');
        expect(decisionDocZh).toContain('继续通过 `npm run verify:local-kb-fixtures` 扩充离线证据');
    });
});
