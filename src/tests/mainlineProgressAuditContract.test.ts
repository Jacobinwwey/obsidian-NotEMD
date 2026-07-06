import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.join(__dirname, '..', '..');

function readDoc(relativePath: string): string {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('mainline progress audit contract', () => {
    const progressDoc = readDoc('docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md');
    const progressDocZh = readDoc(
        'docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md'
    );
    const postRecoveryDoc = readDoc(
        'docs/brainstorms/2026-05-25-post-bounded-recovery-audit-and-next-level-direction.md'
    );
    const postRecoveryDocZh = readDoc(
        'docs/brainstorms/2026-05-25-post-bounded-recovery-audit-and-next-level-direction.zh-CN.md'
    );
    const matrixDoc = readDoc('docs/brainstorms/2026-05-20-unified-follow-through-matrix.md');
    const matrixDocZh = readDoc('docs/brainstorms/2026-05-20-unified-follow-through-matrix.zh-CN.md');
    const standaloneAcceptanceDoc = readDoc('docs/maintainer/slidev-standalone-acceptance-2026-06-18.md');
    const standaloneAcceptanceDocZh = readDoc('docs/maintainer/slidev-standalone-acceptance-2026-06-18.zh-CN.md');
    const pagesLanguageGeoWorkflowDoc = readDoc('docs/maintainer/github-pages-language-geo-workflow.md');
    const pagesLanguageGeoWorkflowDocZh = readDoc('docs/maintainer/github-pages-language-geo-workflow.zh-CN.md');
    const pagesGeoMeasurementLog = readDoc('docs/maintainer/github-pages-geo-measurement-log.md');
    const pagesGeoMeasurementLogZh = readDoc('docs/maintainer/github-pages-geo-measurement-log.zh-CN.md');
    const docsReadme = readDoc('docs/README.md');
    const docsReadmeZh = readDoc('docs/README.zh-CN.md');
    const websiteReadme = readDoc('website/README.md');
    const geoRoadmap = readDoc('GEO_ROADMAP.md');

    test('records the current Stage-B2/C/D baseline and fixture anchor in both canonical progress docs', () => {
        expect(progressDoc).toContain('### 2.7 Current `890b21b` Stage-B2/C/D follow-through baseline');
        expect(progressDocZh).toContain('### 2.7 当前 `890b21b` Stage-B2/C/D 跟进基线');
        expect(progressDoc).toContain('docs(progress): align post-recovery packaging truth');
        expect(progressDocZh).toContain('docs(progress): align post-recovery packaging truth');
        expect(progressDoc).toContain('earlier local-KB fixture anchor remains `824d07e`');
        expect(progressDocZh).toContain('更早的 local-KB fixture 锚点仍是 `824d07e`');
        expect(progressDoc).toContain('test(local-kb): cover chapter split showcase retrieval');
        expect(progressDocZh).toContain('test(local-kb): cover chapter split showcase retrieval');
        expect(progressDoc).toContain('`npm run verify:local-kb-fixtures`');
        expect(progressDocZh).toContain('`npm run verify:local-kb-fixtures`');
        expect(progressDoc).toContain('MiniSearch-backed retrieval path');
        expect(progressDocZh).toContain('MiniSearch-backed retrieval 路径');
        expect(progressDoc).toContain('### 2.9 Current `7af2f9b` docs-sync baseline');
        expect(progressDocZh).toContain('### 2.9 当前 `7af2f9b` 的文档同步基线');
        expect(progressDoc).toContain('docs(progress): sync current-main helper proof truth');
        expect(progressDocZh).toContain('docs(progress): sync current-main helper proof truth');
    });

    test('locks the active PRD interpretation to landed implementation truth plus ongoing gates', () => {
        expect(progressDoc).toContain('Requirement-by-requirement status');
        expect(progressDocZh).toContain('当前逐项状态');

        for (const marker of ['R1 local-KB task support', 'R2/R3 local-only', 'R4/R4a/R4b', 'R8 packaging']) {
            expect(progressDoc).toContain(marker);
        }

        for (const marker of ['R1 local-KB 任务支持', 'R2/R3 local-only', 'R4/R4a/R4b', 'R8 packaging']) {
            expect(progressDocZh).toContain(marker);
        }

        expect(progressDoc).toContain('On current main, R1 through R7 are implementation truth');
        expect(progressDocZh).toContain('在当前主线上，R1 到 R7 已经是实现真值');
        expect(progressDoc).toContain('R9 and R10 are continuing finish gates');
        expect(progressDocZh).toContain('R9 与 R10 是持续 finish gate');
    });

    test('keeps diagnostics and packaging boundaries explicit instead of widening public claims', () => {
        for (const content of [progressDoc, progressDocZh, postRecoveryDoc, postRecoveryDocZh, matrixDoc, matrixDocZh]) {
            expect(content).toContain('`local-knowledge.inspect`');
            expect(content).toContain('`main.js`');
            expect(content).toContain('inline `srcdoc`');
        }

        expect(progressDoc).toContain('maintainer-only');
        expect(progressDocZh).toContain('maintainer-only');
        expect(postRecoveryDoc).toContain('maintainer-only');
        expect(postRecoveryDocZh).toContain('maintainer-only');
        expect(matrixDoc).toContain('maintainer-only');
        expect(matrixDocZh).toContain('maintainer-only');
        expect(progressDoc).toContain('not a public CLI expansion');
        expect(progressDocZh).toContain('不是 public CLI 扩张');
        expect(progressDoc).toContain('no dedicated runtime asset is claimed');
        expect(progressDocZh).toContain('没有宣称 dedicated runtime asset');
        expect(progressDoc).toContain('`createRenderHostBundleBuildOptions()` remains candidate-only');
        expect(progressDoc).toContain('not consumed by `esbuild.config.mjs`');
        expect(progressDocZh).toContain('`createRenderHostBundleBuildOptions()` 继续保持 candidate-only');
        expect(progressDocZh).toContain('不能被 `esbuild.config.mjs` 消费');
        expect(matrixDoc).toContain('`createRenderHostBundleBuildOptions()` candidate-only');
        expect(matrixDoc).toContain('production `esbuild.config.mjs` path');
        expect(matrixDocZh).toContain('`createRenderHostBundleBuildOptions()`');
        expect(matrixDocZh).toContain('candidate-only');
        expect(matrixDocZh).toContain('production `esbuild.config.mjs`');
        expect(matrixDoc).toContain('not existence re-proof');
        expect(matrixDocZh).toContain('不是继续做存在性重证');
    });

    test('keeps the post-recovery audit aligned to current release and provider-control truth', () => {
        expect(postRecoveryDoc).toContain('shipped through the `1.9.2` boundary');
        expect(postRecoveryDocZh).toContain('已发货到 `1.9.2` 边界');
        expect(postRecoveryDoc).toContain('`createRenderHostBundleBuildOptions()` remains candidate-only');
        expect(postRecoveryDocZh).toContain('`createRenderHostBundleBuildOptions()` 会保持 candidate-only');
        expect(postRecoveryDoc).toContain('provider settings/model discovery is no longer an unlanded UX architecture gap');
        expect(postRecoveryDocZh).toContain('provider settings/model discovery 已不再是未落地的 UX architecture gap');
        expect(postRecoveryDoc).toContain('keep the landed provider settings/model-discovery control plane shared-core and lightweight');
        expect(postRecoveryDocZh).toContain('让已落地的 provider settings/model-discovery control plane');

        for (const staleMarker of [
            'shipped `1.9.0`,',
            'through hardcoded branching on `activeProvider.name`',
            'does **not** yet describe',
            'current main does **not** already satisfy the requested provider-settings UX',
            'stop hardcoding provider settings behavior',
            'first-batch discovery support should stay narrow',
            'current hardcoded provider panel cannot'
        ]) {
            expect(postRecoveryDoc).not.toContain(staleMarker);
        }

        for (const staleMarker of [
            '发布了 `1.9.0`',
            '仍通过 `activeProvider.name` 的硬编码分支',
            '它 **还没有** 表达',
            '当前 main **并没有** 已满足用户要求的 provider-settings UX',
            '先停止硬编码 provider settings 行为',
            '首批 discovery 支持保持收窄',
            '当前硬编码 provider panel 不行'
        ]) {
            expect(postRecoveryDocZh).not.toContain(staleMarker);
        }
    });

    test('keeps the unified matrix aligned with the same current-head evidence and next direction', () => {
        expect(matrixDoc).toContain('Current execution baseline for this matrix update:');
        expect(matrixDocZh).toContain('本次矩阵更新的当前执行基线：');
        expect(matrixDoc).toContain('re-audited against the current `main` working tree on 2026-06-09');
        expect(matrixDocZh).toContain('并在 2026-06-09 基于 `1.9.2` 发货边界');
        expect(matrixDoc).toContain('`890b21b`');
        expect(matrixDocZh).toContain('`890b21b`');
        expect(matrixDoc).toContain('docs(progress): align post-recovery packaging truth');
        expect(matrixDocZh).toContain('docs(progress): align post-recovery packaging truth');
        expect(matrixDoc).toContain('`824d07e`');
        expect(matrixDocZh).toContain('`824d07e`');
        expect(matrixDoc).toContain('`7999a5f`');
        expect(matrixDocZh).toContain('`7999a5f`');
        expect(matrixDoc).toContain('test(local-kb): broaden stage-c fixture coverage');
        expect(matrixDocZh).toContain('test(local-kb): broaden stage-c fixture coverage');
        expect(matrixDoc).toContain(
            'real-note-style chapter-split showcase retrieval plus real-note/query diversity beyond the chapter-split showcase through the live MiniSearch path'
        );
        expect(matrixDocZh).toContain('real-note-style chapter-split showcase retrieval');
        expect(matrixDocZh).toContain('chapter-split showcase 之外的真实 note/query 多样性');
        expect(matrixDocZh).toContain('MiniSearch path');
        expect(matrixDoc).toContain('Current Batch-C alignment note:');
        expect(matrixDocZh).toContain('本轮 Batch-C 对齐说明：');
        expect(matrixDoc).toContain('helper help, the bilingual capability matrix, and tests now jointly cover explicit research queries');
        expect(matrixDocZh).toContain('helper help、双语 capability matrix 与测试现在共同覆盖 explicit research query');
        expect(matrixDoc).toContain('reproducible docs-vault failure-state probes for `no-paths` and `no-candidate-files`');
        expect(matrixDocZh).toContain('可直接复现 `no-paths` / `no-candidate-files` 的 docs-vault failure-state 示例');
        expect(matrixDoc).toContain('cross-folder task-contract retrieval, RAG-quality evaluation notes, and low-signal navigation-source diagnostics');
        expect(matrixDocZh).toContain('跨文件夹任务契约检索、RAG 质量评估笔记与低信号导航源 diagnostics');
        expect(matrixDoc).toContain('evaluation depth, maintainer-example alignment, and packaging-boundary discipline');
        expect(matrixDocZh).toContain('评估深度、maintainer 示例对齐与 packaging 边界纪律');
        expect(matrixDoc).toContain('candidate-only production-build guard');
        expect(matrixDocZh).toContain('candidate-only production-build guard');
        expect(progressDoc).toContain('maintainer operator surface');
        expect(progressDocZh).toContain('maintainer operator surface');
        expect(progressDoc).toContain('maintainer help/docs alignment tests now also lock the real docs-vault example payloads');
        expect(progressDocZh).toContain('maintainer help/docs alignment 测试还锁住真实 docs-vault example payload');
        expect(progressDoc).toContain('the bilingual capability matrix');
        expect(progressDocZh).toContain('双语 capability matrix');
        expect(progressDoc).toContain('reproducible docs-vault failure-state examples');
        expect(progressDocZh).toContain('可直接复现的 docs-vault failure-state 示例');
        expect(progressDoc).toContain('`repo-saga` SVG-only folder now proves `no-candidate-files`');
        expect(progressDocZh).toContain('`repo-saga` 这个仅含 SVG 的目录会稳定证明 `no-candidate-files`');
        expect(progressDoc).toContain('maintainer CLI wrapper now has process-level regression coverage');
        expect(progressDocZh).toContain('maintainer CLI wrapper 现在已经具备入口级 process-level 回归覆盖');
        expect(progressDoc).toContain('release / repo-saga helper lane now also has process-level regression coverage');
        expect(progressDocZh).toContain('release / repo-saga helper 这条线现在也已经具备已检入入口的 process-level 回归覆盖');
        expect(progressDoc).toContain('release dry-run create/repair command shape');
        expect(progressDocZh).toContain('release dry-run 的 create/repair 命令形态');
        expect(progressDoc).toContain('repo-saga sync-only stamp hits, active-lock refusal, isolated generation, and invalid-argument fast-fail paths');
        expect(progressDocZh).toContain('repo-saga 的 sync-only stamp 命中、active-lock refusal、隔离生成路径与非法参数 fast-fail');
        expect(progressDoc).toContain('MiniSearch remains the chosen implementation base');
        expect(progressDocZh).toContain('MiniSearch 仍是当前主线的实现基座');
        expect(progressDoc).toContain('LightRAG, txtai, and Mem0/Embedchain remain rejected as direct runtime bases');
        expect(progressDocZh).toContain('LightRAG、txtai 与 Mem0/Embedchain 仍应排除为本批直连 runtime 基座');
        expect(progressDoc).toContain('RAGPerf / ragas remain evaluation references');
        expect(progressDocZh).toContain('RAGPerf / ragas 仍应视为评测参考');
        expect(progressDoc).toContain('2026-06-09-local-kb-rag-quality-and-execution-truth.md');
        expect(progressDocZh).toContain('2026-06-09-local-kb-rag-quality-and-execution-truth.zh-CN.md');
        expect(progressDoc).toContain('2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md');
        expect(progressDocZh).toContain('2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.zh-CN.md');
        expect(progressDoc).toContain('offline fixture and maintainer inspect examples now probe them through real retrieval paths');
        expect(progressDocZh).toContain('离线 fixture 与 maintainer inspect 示例会沿真实检索路径探测它们');
        expect(matrixDoc).toContain('docs/brainstorms/2026-06-09-*');
        expect(matrixDocZh).toContain('docs/brainstorms/2026-06-09-*');
        expect(matrixDoc).toContain('part of executable retrieval evidence through the offline fixture and maintainer inspect examples');
        expect(matrixDocZh).toContain('进入可执行的检索证据面');
        expect(matrixDoc).toContain('`7af2f9b` (`docs(progress): sync current-main helper proof truth`) is the current docs-sync baseline');
        expect(matrixDocZh).toContain('`7af2f9b`（`docs(progress): sync current-main helper proof truth`）是当前 docs-sync 基线');
        expect(matrixDoc).toContain('The diagram-platform roadmap EN/ZH is now also part of this current-main truth set');
        expect(matrixDocZh).toContain('diagram-platform roadmap 的中英文版本现在也属于这套 current-main truth');
        expect(matrixDoc).toContain('release / repo-saga helper lane now also has process-level entrypoint proof');
        expect(matrixDocZh).toContain('release / repo-saga helper 这条线现在也已经具备 current main 上的 process-level 入口证明');
        expect(matrixDoc).toContain('invalid-tag wrapper failures');
        expect(matrixDocZh).toContain('非法 tag 的 wrapper 失败路径');
        expect(matrixDoc).toContain('invalid-argument fast-fail behavior');
        expect(matrixDocZh).toContain('非法参数 fast-fail 行为');
    });

    test('records the current Slidev export convergence truth in both canonical progress docs', () => {
        expect(progressDoc).toContain('`convergeSlidevDeckLayout()`');
        expect(progressDocZh).toContain('`convergeSlidevDeckLayout()`');
        expect(progressDoc).toContain('slidev-standalone-acceptance-2026-06-18');
        expect(progressDocZh).toContain('slidev-standalone-acceptance-2026-06-18');
        expect(progressDoc).toContain('same converged prepared deck');
        expect(progressDocZh).toContain('同一个 converged prepared deck');
        expect(progressDoc).toContain('retryCount = 4');
        expect(progressDocZh).toContain('retryCount = 4');
        expect(progressDoc).toContain('https://github.com/Jacobinwwey/slidev.git');
        expect(progressDocZh).toContain('https://github.com/Jacobinwwey/slidev.git');
        expect(progressDoc).toContain('actualMode = "standalone"');
        expect(progressDocZh).toContain('actualMode = "standalone"');
        expect(progressDoc).toContain('standaloneGate.passed = true');
        expect(progressDocZh).toContain('standaloneGate.passed = true');
        expect(progressDoc).toContain('$n');
        expect(progressDocZh).toContain('$n');
        expect(progressDoc).toContain('server-script-fallback');
        expect(progressDocZh).toContain('server-script-fallback');
        expect(progressDoc).toContain('isolated working copies with sibling support-entry mirroring');
        expect(progressDocZh).toContain('isolated working-copy + sibling support sync');
        expect(progressDoc).toContain('component-heavy custom-slot local `<Transform>` fallback');
        expect(progressDocZh).toContain('component-heavy custom slot 的 local `<Transform>` fallback');
        expect(progressDoc).toContain('zone-level owner rects');
        expect(progressDocZh).toContain('zone 级 owner rect');
        expect(progressDoc).toContain('inject local `<Transform>` wrappers for each overflowing zone');
        expect(progressDocZh).toContain('分别注入多个局部 `<Transform>`');
        expect(progressDoc).toContain('clipped by `overflow-hidden`');
        expect(progressDocZh).toContain('`overflow-hidden` 把后代裁出了当前视口');
        expect(progressDoc).toContain('pass/fail overflow remains rooted in the rendered slide root');
        expect(progressDocZh).toContain('pass/fail 的 hard overflow 继续锚定在真实渲染后的 slide root');
        expect(progressDoc).toContain('safe-rect-aware measured fit');
        expect(progressDocZh).toContain('safe-rect-aware 的 measured fit');
        expect(progressDoc).toContain('rendered text hints');
        expect(progressDocZh).toContain('rendered text hint');
        expect(progressDoc).toContain('nonoverflowing sibling zone');
        expect(progressDocZh).toContain('几何结果打平');
        expect(progressDoc).toContain('slot-owner wrappers');
        expect(progressDocZh).toContain('slot-owner wrapper');
    });

    test('tracks the strict Slidev standalone acceptance package as a repository-visible artifact index', () => {
        for (const content of [standaloneAcceptanceDoc, standaloneAcceptanceDocZh]) {
            expect(content).toContain('completion-rerun-strict-report.json');
            expect(content).toContain('/home/jacob/slidev-export-review/2026-06-18/standalone-strict/');
            expect(content).toContain('/home/jacob/slidev/packages/slidev/bin/slidev.mjs');
            expect(content).toContain('/home/jacob/slidev/skills/slidev');
            expect(content).toContain('"skillReferenceCount": 52');
            expect(content).toContain('"actualMode": "standalone"');
            expect(content).toContain('"requiresLocalServer": false');
            expect(content).toContain('"passed": true');
            expect(content).toContain('"slideCount": 28');
            expect(content).toContain('"overflowCount": 0');
            expect(content).toContain('"unreadableCount": 0');
            expect(content).toContain('"retryCount": 4');
            expect(content).toContain('"ignoredOutputs": []');
            expect(content).toContain('$n');
            expect(content).toContain('server-script-fallback');
        }

        expect(standaloneAcceptanceDoc).toContain('Do not commit test/generated output to main');
        expect(standaloneAcceptanceDocZh).toContain('测试/生成输出不要提交到 main');
    });

    test('locks the GitHub Pages language and GEO build-output gate', () => {
        for (const content of [pagesLanguageGeoWorkflowDoc, pagesLanguageGeoWorkflowDocZh]) {
            expect(content).toContain('website/scripts/audit-build.cjs');
            expect(content).toContain('website/src/lib/publishedLanguageScopeData.mjs');
            expect(content).toContain('website/src/lib/publishedLanguageScope.js');
            expect(content).toContain('website/src/lib/languageRoutePolicy.js');
            expect(content).toContain('website/src/theme/SiteMetadata/index.js');
            expect(content).toContain('website/src/theme/NavbarItem/LocaleDropdownNavbarItem/index.js');
            expect(content).toContain('website/src/theme/DocRoot/Layout/Sidebar/index.js');
            expect(content).toContain('website/src/theme/DocItem/Paginator/index.js');
            expect(content).toContain('npm run audit:build');
            expect(content).toContain('zh-Hant');
            expect(content).toContain('ja');
            expect(content).toContain('fr');
            expect(content).toContain('de');
            expect(content).toContain('es');
            expect(content).toContain('ko');
            expect(content).toContain('llms.txt');
            expect(content).toContain('/docs/intro');
            expect(content).toContain('/docs/getting-started/quick-start');
            expect(content).toContain('/docs/providers/overview');
            expect(content).toContain('/docs/faq');
            expect(content).toContain('canonical');
            expect(content).toContain('Search Console');
            expect(content).toContain('AI visibility');
            expect(content).toContain('sitemap');
        }

        expect(pagesLanguageGeoWorkflowDoc).toContain('full docs route set');
        expect(pagesLanguageGeoWorkflowDocZh).toContain('完整 docs 路由集');

        expect(docsReadme).toContain('GitHub Pages Language And GEO Workflow');
        expect(docsReadme).toContain('GitHub Pages GEO Measurement Log');
        expect(docsReadmeZh).toContain('GitHub Pages 语言与 GEO 工作流');
        expect(docsReadmeZh).toContain('GitHub Pages GEO 测量记录');

        for (const content of [pagesGeoMeasurementLog, pagesGeoMeasurementLogZh]) {
            expect(content).toContain('2026-06-22');
            expect(content).toContain('2026-07-04');
            expect(content).toContain('28641376675');
            expect(content).toContain('28701182146');
            expect(content).toContain('2b2e1cd');
            expect(content).toContain('40543eb');
            expect(content).toContain('2026-07-07');
            expect(content).toContain('zh-Hant');
            expect(content).toContain('Search Console');
            expect(content).toContain('AI visibility');
            expect(content).toContain('sitemap');
            expect(content).toContain('/zh-CN/docs/providers/openai');
        }

        expect(pagesGeoMeasurementLog).toContain('full docs route');
        expect(pagesGeoMeasurementLogZh).toContain('完整 docs 路由');

        expect(readDoc('docs/brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.md')).toContain(
            'canonical: true'
        );
        expect(readDoc('docs/brainstorms/2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.zh-CN.md')).toContain(
            'canonical: true'
        );

        for (const content of [progressDoc, progressDocZh, websiteReadme, geoRoadmap]) {
            expect(content).toContain('website/scripts/audit-build.cjs');
            expect(content).toContain('website/src/lib/publishedLanguageScope.js');
            expect(content).toContain('npm run audit:build');
            expect(content).toContain('llms.txt');
        }

        expect(progressDoc).toContain('build-output gate');
        expect(progressDocZh).toContain('build-output gate');
        expect(websiteReadme).toContain('publishedLanguageScopeData.mjs');
        expect(websiteReadme).toContain('full docs routes for Simplified Chinese (`zh-CN`)');
        expect(websiteReadme).toContain('Provider docs contain setup, endpoint/auth, model discovery, troubleshooting, and use-case sections');
        expect(geoRoadmap).toContain('2026-07-07 Phase 8 Multilingual Docs Route Parity');
        expect(geoRoadmap).toContain('Full multilingual docs route boundary');
        expect(geoRoadmap).toContain('Provider page quality');
        expect(geoRoadmap).toContain('Search Console and AI visibility');
        expect(geoRoadmap).toContain('.github/workflows/deploy-docs.yml');
    });
});
