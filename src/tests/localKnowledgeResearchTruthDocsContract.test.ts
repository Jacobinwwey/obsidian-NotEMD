import * as fs from 'fs';
import * as path from 'path';

describe('local knowledge research truth docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const ragDoc = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-06-09-local-kb-rag-quality-and-execution-truth.md'),
        'utf8'
    );
    const ragDocZh = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md'),
        'utf8'
    );
    const tocDoc = fs.readFileSync(
        path.join(
            repoRoot,
            'docs',
            'brainstorms',
            '2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md'
        ),
        'utf8'
    );
    const tocDocZh = fs.readFileSync(
        path.join(
            repoRoot,
            'docs',
            'brainstorms',
            '2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md'
        ),
        'utf8'
    );

    test('repo-owned RAG execution truth docs keep the shipped execution chain and evaluation boundary explicit in both languages', () => {
        for (const content of [ragDoc, ragDocZh]) {
            expect(content).toContain('MiniSearch');
            expect(content).toContain('`npm run verify:local-kb-fixtures`');
            expect(content).toContain('`local-knowledge.inspect`');
            expect(content).toContain('ragas');
            expect(content).toContain('RAGPerf');
        }

        expect(ragDoc).toContain('## 3. Actual Execution Chain');
        expect(ragDocZh).toContain('## 3. 实际执行链路');
        expect(ragDoc).toContain('machine-readable retrieval summaries now exist');
        expect(ragDocZh).toContain('已经存在 machine-readable retrieval summaries');
        expect(ragDoc).toContain('The right near-term move is to borrow the evaluation mindset off the hot path');
        expect(ragDocZh).toContain('正确的近期动作，是在线路外借用这种评估视角');
        expect(ragDoc).toContain('do not overclaim semantic/vector retrieval or a server-backed RAG subsystem');
        expect(ragDocZh).toContain('不要高估 semantic/vector retrieval，也不要暗示存在 server-backed RAG 子系统');
    });

    test('repo-owned chapter split comparison docs keep the managed-artifact interpretation explicit in both languages', () => {
        for (const content of [tocDoc, tocDocZh]) {
            expect(content).toContain('.notemd-chapter-split.json');
            expect(content).toContain('managed-artifact');
            expect(content).toContain('kpm');
            expect(content).toContain('markdown-toc');
            expect(content).toContain('andrej-karpathy-skills');
        }

        expect(tocDoc).toContain('this is a managed-artifact write contract');
        expect(tocDocZh).toContain('这是一条 managed-artifact 写入契约');
        expect(tocDoc).toContain('keep chapter split active-file scoped on current `main`');
        expect(tocDocZh).toContain('current `main` 上继续保持 chapter split 为 active-file scoped');
        expect(tocDoc).toContain(
            'keep deterministic TOC front matter, stable block refs, manifest-backed reruns, and stale-file cleanup explicit in docs and tests'
        );
        expect(tocDocZh).toContain(
            '在文档与测试里持续明确 deterministic TOC front matter、stable block refs、manifest-backed reruns 与 stale-file cleanup'
        );
    });
});
