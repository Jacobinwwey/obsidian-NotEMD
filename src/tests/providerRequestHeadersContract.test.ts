import * as fs from 'fs';
import * as path from 'path';

describe('provider request headers contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const discoveryPath = path.join(repoRoot, 'src', 'providerModelDiscovery.ts');
    const llmUtilsPath = path.join(repoRoot, 'src', 'llmUtils.ts');
    const sharedHeadersPath = path.join(repoRoot, 'src', 'providerRequestHeaders.ts');

    test('runtime and discovery reuse the shared OpenAI-compatible header owner', () => {
        const discoverySource = fs.readFileSync(discoveryPath, 'utf8');
        const llmUtilsSource = fs.readFileSync(llmUtilsPath, 'utf8');
        const sharedHeadersSource = fs.readFileSync(sharedHeadersPath, 'utf8');

        expect(discoverySource).toContain("buildOpenAICompatibleProviderHeaders");
        expect(llmUtilsSource).toContain("buildOpenAICompatibleProviderHeaders");
        expect(sharedHeadersSource).toContain("'X-Api-Key'");
        expect(sharedHeadersSource).toContain("'APP-Code'");
        expect(sharedHeadersSource).toContain("'X-GitHub-Api-Version'");
        expect(sharedHeadersSource).toContain("'X-Cerebras-3rd-Party-Integration'");
    });
});
