import * as fs from 'fs';
import * as path from 'path';

describe('provider discovery registry contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const providerDiscoveryPath = path.join(repoRoot, 'src', 'providerModelDiscovery.ts');

    test('provider model discovery routes provider-specific families through explicit discovery modes', () => {
        const source = fs.readFileSync(providerDiscoveryPath, 'utf8');

        expect(source).toContain("case 'openrouter-models':");
        expect(source).toContain("case 'litellm-proxy-models':");
        expect(source).toContain("case 'huaweicloud-modelarts-models':");
        expect(source).toContain("case 'github-models':");
        expect(source).toContain("case 'ppio-models':");
        expect(source).toContain("case 'ovms-models':");
        expect(source).toContain("case 'xai-language-models':");
        expect(source).not.toContain("provider.name === 'LiteLLM'");
    });
});
