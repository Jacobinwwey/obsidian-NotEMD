import * as fs from 'fs';
import * as path from 'path';

describe('provider discovery docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const readmeEn = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const readmeZh = fs.readFileSync(path.join(repoRoot, 'README_zh.md'), 'utf8');
    const changeLog = fs.readFileSync(path.join(repoRoot, 'change.md'), 'utf8');
    const unifiedMatrixZh = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-05-20-unified-follow-through-matrix.zh-CN.md'),
        'utf8'
    );
    const providerPlanEn = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-05-27-provider-settings-simplification-and-model-discovery-plan.md'),
        'utf8'
    );
    const providerPlanZh = fs.readFileSync(
        path.join(repoRoot, 'docs', 'brainstorms', '2026-05-27-provider-settings-simplification-and-model-discovery-plan.zh-CN.md'),
        'utf8'
    );

    test('README surfaces mention the current bounded discovery families', () => {
        expect(readmeEn).toContain('selected official OpenAI-compatible `/models` presets');
        expect(readmeEn).toContain('Together\'s dedicated `/models` response shape');
        expect(readmeEn).toContain('Huawei Cloud MaaS\'s dedicated `v2/models` registry endpoint');
        expect(readmeEn).toContain('a bounded Vercel AI Gateway merge of the official `/v1/models` catalog plus `v3/ai/config`');
        expect(readmeEn).toContain('`OpenRouter` now uses a bounded merge of its chat and embedding catalogs');
        expect(readmeEn).toContain('Anthropic and Google discovery now also follow bounded multi-page registry traversal');
        expect(readmeEn).toContain('`AIHubMix`');
        expect(readmeEn).toContain('`PPIO`');
        expect(readmeEn).toContain('`New API`');
        expect(readmeEn).toContain('`OVMS`');
        expect(readmeEn).toContain('`LiteLLM`');
        expect(readmeEn).toContain('known official host such as OpenAI, DashScope/Qwen, Xiaomi MiMo, Fireworks, or Hugging Face');
        expect(readmeEn).toContain('OVMS-style local `/v3` endpoints');
        expect(readmeEn).toContain('`/responses`, `/chat/completions`, or `/models`');
        expect(readmeZh).toContain('一批已验证的 OpenAI-compatible `/models` 预设');
        expect(readmeZh).toContain('Together 专用 `/models` 响应形态');
        expect(readmeZh).toContain('Huawei Cloud MaaS 专用 `v2/models` 模型注册表接口');
        expect(readmeZh).toContain('Vercel AI Gateway 对官方 `/v1/models` 与 `v3/ai/config` 的有界双源合并');
        expect(readmeZh).toContain('`OpenRouter` 现在会有界合并 chat 与 embedding catalog');
        expect(readmeZh).toContain('Anthropic 与 Google 在 provider 返回分页 catalog 时，也会按有界多页遍历合并模型结果');
        expect(readmeZh).toContain('`AIHubMix`');
        expect(readmeZh).toContain('`PPIO`');
        expect(readmeZh).toContain('`New API`');
        expect(readmeZh).toContain('`OVMS`');
        expect(readmeZh).toContain('`LiteLLM`');
        expect(readmeZh).toContain('OpenAI、DashScope/Qwen、Xiaomi MiMo、Fireworks、Hugging Face 这类已知官方 host');
        expect(readmeZh).toContain('OVMS 风格的本地 `/v3` 端点');
        expect(readmeZh).toContain('`/responses`、`/chat/completions` 或 `/models`');
        expect(readmeEn).toContain('The generic `OpenAI Compatible` entry now auto-upgrades to the matching bounded discovery family for known hosts');
        expect(readmeZh).toContain('通用 `OpenAI Compatible` 预设现在会在已知 host');
    });

    test('change log describes the broader bounded discovery support truthfully', () => {
        expect(changeLog).toContain('Together\'s dedicated `/models` response shape');
        expect(changeLog).toContain('LiteLLM');
        expect(changeLog).toContain('Huawei Cloud MaaS');
        expect(changeLog).toContain('AIHubMix');
        expect(changeLog).toContain('PPIO');
        expect(changeLog).toContain('New API');
        expect(changeLog).toContain('OVMS');
        expect(changeLog).toContain('official `/v1/models` catalog plus `v3/ai/config`');
        expect(changeLog).toContain('Qwen/Doubao/Moonshot/GLM/SiliconFlow/Groq/Fireworks/Nebius/Cerebras/OpenRouter/Requesty');
        expect(changeLog).toContain('known official hosts can also reuse upstream provider token-cap metadata for bare model IDs');
        expect(changeLog).toContain('OVMS-style local `/v3` endpoints');
        expect(changeLog).toContain('`/responses`, `/chat/completions`, or `/models` endpoint forms');
    });

    test('planning docs stay aligned with the current bounded discovery truth', () => {
        expect(providerPlanEn).toContain('Together\'s dedicated `/models` array response');
        expect(providerPlanEn).toContain('Huawei Cloud MaaS\'s `v2/models` registry endpoint');
        expect(providerPlanEn).toContain('Vercel AI Gateway\'s bounded `/v1/models` + `v3/ai/config` merge');
        expect(providerPlanEn).toContain('LiteLLM\'s explicit proxy-family `/models` + `/model/info` merge');
        expect(providerPlanEn).toContain('PPIO\'s bounded chat + embedding + reranker registry merge');
        expect(providerPlanEn).toContain('OVMS\'s preferred local `/v3/models` with bounded `/v1/config` fallback');
        expect(providerPlanEn).toContain('Google and Anthropic now also traverse bounded pages');
        expect(providerPlanEn).toContain('reuses official-provider token-cap metadata for bare model IDs');
        expect(providerPlanZh).toContain('Together 专用的 `/models` 数组响应');
        expect(providerPlanZh).toContain('Huawei Cloud MaaS 单独走 `v2/models` registry endpoint');
        expect(providerPlanZh).toContain('Vercel AI Gateway 走有界的 `/v1/models` + `v3/ai/config` 双源合并');
        expect(providerPlanZh).toContain('LiteLLM 显式走 proxy-family 的 `/models` + `/model/info` 有界合并');
        expect(providerPlanZh).toContain('PPIO 单独走 chat + embedding + reranker 三路有界合并');
        expect(providerPlanZh).toContain('OVMS 优先走本地 `/v3/models`、必要时再回退到 `/v1/config`');
        expect(providerPlanZh).toContain('Google 与 Anthropic 在 provider 返回分页模型目录时，也会执行有界多页遍历');
        expect(providerPlanZh).toContain('bare model ID 复用官方 provider 的 token-cap 元数据');
        expect(providerPlanEn).toContain('OVMS-style local `/v3` endpoints');
        expect(providerPlanEn).toContain('including `/responses` endpoint forms');
        expect(providerPlanZh).toContain('OVMS 风格的本地 `/v3` 端点');
        expect(providerPlanZh).toContain('包括 `/responses` 这类端点形态');
        expect(providerPlanEn).toContain('selected official OpenAI-compatible `GET /models` presets');
        expect(providerPlanZh).toContain('一批已验证的 OpenAI-compatible `GET /models` 预设');
        expect(unifiedMatrixZh).toContain('Together 专用 `/models` 响应');
        expect(unifiedMatrixZh).toContain('Vercel AI Gateway 有界 `/v1/models` + `v3/ai/config` 双源合并');
        expect(unifiedMatrixZh).toContain('PPIO 的 chat + embedding + reranker 三路有界发现');
        expect(unifiedMatrixZh).toContain('OVMS 优先 `/v3/models` 并有界回退 `/v1/config`');
        expect(unifiedMatrixZh).toContain('Groq、Fireworks');
        expect(unifiedMatrixZh).toContain('OVMS 风格本地 `/v3` 端点');
        expect(unifiedMatrixZh).toContain('`/responses`、`/chat/completions`、`/models` 这类 endpoint 形态');
    });
});
