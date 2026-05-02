/**
 * Live chain tests - exercises real LLM API calls and diagram generation pipeline.
 * Makes real HTTP calls to configured provider using credentials from vault config.
 * Run with: npm test -- --runInBand src/tests/liveChainTest.test.ts
 */

import * as fs from 'fs';
import { buildDiagramSpecPrompt } from '../diagram/prompts/diagramSpecPrompt';
import { parseDiagramSpecResponse } from '../diagram/diagramSpecResponseParser';
import { generateDiagramArtifact, DiagramGenerationOptions } from '../diagram/diagramGenerationService';

// ── Real HTTP helpers ──

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
    const http = require('http');
    const mod = new URL('https://' + hostname).protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : undefined;
    return new Promise((resolve, reject) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const req = mod.request({ hostname, port, path: restPath, method, headers, timeout: 90000 }, (res: any) => {
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
    const data = await apiRequest(url.hostname, parseInt(url.port || (url.protocol === 'https:' ? '443' : '80')), chatPath, 'POST', {
        model: provider.model, messages, max_tokens: maxTokens, temperature: 0.5, top_p: 0.65,
    }, provider.apiKey);
    const choice = (data as any).choices?.[0];
    if (!choice?.message?.content) throw new Error(`No content: ${JSON.stringify(data).substring(0, 200)}`);
    return choice.message.content;
}

jest.setTimeout(180000);

describe('live LLM chain tests', () => {
    const provider = loadVaultProvider();

    beforeAll(() => {
        console.log(`Provider: ${provider.name} model=${provider.model} baseUrl=${provider.baseUrl}`);
    });

    test('chat completion returns content', async () => {
        const result = await chat(provider, [
            { role: 'system', content: 'Answer in one sentence.' },
            { role: 'user', content: 'Say hello.' },
        ]);
        expect(result.length).toBeGreaterThan(0);
        console.log('Chat:', result.substring(0, 200));
    }, 60000);

    test('diagram spec prompt is well-formed', () => {
        const prompt = buildDiagramSpecPrompt({});
        expect(prompt).toMatch(/DiagramSpec/);
    });

    test('diagram spec parser parses valid JSON', () => {
        const r = parseDiagramSpecResponse('{"diagramSpec":{"intent":"flowchart","title":"T","nodes":[{"id":"A","label":"S"}],"edges":[]}}');
        expect(r.intent).toBe('flowchart');
    });

    test('diagram spec parser throws on garbage', () => {
        expect(() => parseDiagramSpecResponse('garbage')).toThrow();
    });

    test('full diagram generation pipeline succeeds', async () => {
        const sourceContent = 'A user authentication system with login, registration, and password reset.';
        
        // Capture raw LLM response for debugging
        let rawResponse = '';
        
        const options: DiagramGenerationOptions = {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            llmInvoker: async (systemPrompt: string, sourceMarkdown: string) => {
                rawResponse = await chat(provider, [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: sourceMarkdown },
                ], 4096);
                return rawResponse;
            },
        };

        try {
            const result = await generateDiagramArtifact(sourceContent, options);
            console.log('Intent:', result.spec.intent);
            console.log('Target:', result.artifact.target);
            console.log('Nodes:', result.spec.nodes?.length ?? 0);
            expect(result.spec.intent).toBeTruthy();
            expect(result.artifact.target).toBeTruthy();
        } catch (e) {
            console.log('=== Raw LLM response ===');
            console.log(rawResponse);
            console.log('=== Error ===');
            console.log((e as Error).message);
            throw e;
        }
    }, 120000);
});
