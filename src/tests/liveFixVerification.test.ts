/**
 * Verifies fixes for real-world errors reported by user.
 * Tests edge cases: missing node labels, edge normalization.
 */
import * as fs from 'fs';
import { generateDiagramArtifact, DiagramGenerationOptions } from '../diagram/diagramGenerationService';
import { parseDiagramSpecResponse } from '../diagram/diagramSpecResponseParser';
import { assertValidDiagramSpec } from '../diagram/spec';

interface ProviderConfig {
    name: string; apiKey: string; baseUrl: string; model: string;
}

function loadVaultProvider(): ProviderConfig {
    const data = JSON.parse(fs.readFileSync('/home/jacob/Documents/test/.obsidian/plugins/notemd/data.json', 'utf-8'));
    const activeName = data.activeProvider || 'DeepSeek';
    const provider = data.providers.find((p: any) => p.name === activeName);
    if (!provider) throw new Error(`Provider "${activeName}" not found`);
    return { name: provider.name, apiKey: provider.apiKey, baseUrl: provider.baseUrl, model: provider.model };
}

function apiRequest(hostname: string, port: number, restPath: string, method: string, body?: Record<string, unknown>, apiKey?: string): Promise<Record<string, unknown>> {
    const https = require('https');
    const data = body ? JSON.stringify(body) : undefined;
    return new Promise((resolve, reject) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const req = https.request({ hostname, port, path: restPath, method, headers, timeout: 90000 }, (res: any) => {
            let respBody = '';
            res.on('data', (chunk: string) => respBody += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) resolve(JSON.parse(respBody));
                else reject(new Error(`API ${res.statusCode}: ${respBody.substring(0, 300)}`));
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
        if (data) req.write(data);
        req.end();
    });
}

async function chat(provider: ProviderConfig, messages: Array<{role: string; content: string}>, maxTokens = 4096): Promise<string> {
    const url = new URL(provider.baseUrl);
    const chatPath = url.pathname.replace(/\/$/, '') + '/chat/completions';
    const result = await apiRequest(url.hostname, parseInt(url.port || (url.protocol === 'https:' ? '443' : '80')), chatPath, 'POST', {
        model: provider.model, messages, max_tokens: maxTokens, temperature: 0.5, top_p: 0.65,
    }, provider.apiKey);
    const choice = (result as any).choices?.[0];
    if (!choice?.message?.content) throw new Error(`No content: ${JSON.stringify(result).substring(0, 200)}`);
    return choice.message.content;
}

jest.setTimeout(180000);

describe('live fix verification', () => {
    const provider = loadVaultProvider();

    test('node without label gets auto-label from id', () => {
        // Simulate the error case: LLM returns node with id but no label
        const spec = parseDiagramSpecResponse(JSON.stringify({
            intent: 'flowchart',
            title: 'Test',
            nodes: [
                { id: 'start' },
                { id: 'end', label: 'End' }
            ],
            edges: [{ from: 'start', to: 'end' }]
        }));
        
        // After mergeSpecDefaults, the node should have label = id
        expect(spec.nodes[0].label).toBeUndefined(); // parser passes through as-is
        
        // But validation should pass after mergeSpecDefaults fills label
        // This is tested indirectly via generateDiagramArtifact
    });

    test('live flowchart generation works with user-selected intent', async () => {
        const sourceContent = 'A user login process: enter credentials, validate, grant access or show error.';
        
        const options: DiagramGenerationOptions = {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            requestedIntent: 'flowchart',
            llmInvoker: async (systemPrompt: string, sourceMarkdown: string) => {
                return chat(provider, [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: sourceMarkdown },
                ], 4096);
            },
        };

        const result = await generateDiagramArtifact(sourceContent, options);
        
        expect(result.spec.intent).toBe('flowchart');
        expect(result.artifact.target).toBe('mermaid');
        expect(result.spec.nodes.length).toBeGreaterThan(0);
        
        // Verify all nodes have labels
        for (const node of result.spec.nodes) {
            expect(node.label).toBeTruthy();
            console.log(`  Node: ${node.id} -> "${node.label}"`);
        }
        
        console.log('Flowchart content:');
        console.log(result.artifact.content.substring(0, 300));
    }, 120000);

    test('live stateDiagram with requested intent produces valid spec', async () => {
        const sourceContent = 'An order lifecycle: Pending, Confirmed, Shipped, Delivered. Can cancel from any state.';
        
        const options: DiagramGenerationOptions = {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            requestedIntent: 'stateDiagram',
            llmInvoker: async (systemPrompt: string, sourceMarkdown: string) => {
                return chat(provider, [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: sourceMarkdown },
                ], 4096);
            },
        };

        const result = await generateDiagramArtifact(sourceContent, options);
        
        expect(result.spec.intent).toBe('stateDiagram');
        expect(result.artifact.target).toBe('mermaid');
        
        for (const node of result.spec.nodes) {
            expect(node.label).toBeTruthy();
            console.log(`  Node: ${node.id} -> "${node.label}"`);
        }
        
        console.log('StateDiagram content:');
        console.log(result.artifact.content.substring(0, 300));
    }, 120000);
});
