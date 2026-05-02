/**
 * Live comprehensive diagram intent tests.
 * Tests all 8 supported diagram intents against the live DeepSeek API.
 * Each intent is tested with appropriate source content.
 * Run with: npm test -- --runInBand src/tests/liveAllDiagramIntents.test.ts
 */

import * as fs from 'fs';
import { generateDiagramArtifact, DiagramGenerationOptions } from '../diagram/diagramGenerationService';
import { SUPPORTED_DIAGRAM_INTENTS, DiagramIntent } from '../diagram/types';

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

jest.setTimeout(300000);

// Content tailored for each diagram intent
const INTENT_CONTENT: Record<DiagramIntent, string> = {
    mindmap: 'A knowledge management system with note-taking, tagging, linking, search, and visualization features.',
    flowchart: 'A user login process: enter credentials → validate → check MFA → grant access or show error.',
    sequence: 'A payment flow: User sends payment request to Gateway, Gateway forwards to Bank, Bank validates and returns confirmation to Gateway, Gateway notifies User.',
    classDiagram: 'A library system with Book (title, author, ISBN), Member (name, id, borrowedBooks), and Loan (dueDate, returnDate) classes. Member can borrow and return Books.',
    erDiagram: 'A blog database with Users (id, name, email), Posts (id, title, content, userId), and Comments (id, text, postId, userId). Users have many Posts, Posts have many Comments.',
    stateDiagram: 'An order lifecycle: Pending → Confirmed → Shipped → Delivered. From any state except Delivered, order can be Cancelled.',
    canvasMap: 'A software architecture with Frontend (React), Backend (Node.js), Database (PostgreSQL), and Cache (Redis) components. Frontend talks to Backend, Backend talks to Database and Cache.',
    dataChart: 'Monthly sales: Jan 120, Feb 145, Mar 132, Apr 168, May 155, Jun 190. Product A: 45%, Product B: 30%, Product C: 25%.',
};

describe('live all diagram intents', () => {
    const provider = loadVaultProvider();

    beforeAll(() => {
        console.log(`Provider: ${provider.name} model=${provider.model}`);
        console.log(`Testing ${SUPPORTED_DIAGRAM_INTENTS.length} diagram intents\n`);
    });

    test.each(SUPPORTED_DIAGRAM_INTENTS.map(i => [i]))('intent: %s generates valid artifact', async (intent: DiagramIntent) => {
        const sourceContent = INTENT_CONTENT[intent];
        console.log(`\n=== Testing intent: ${intent} ===`);
        console.log(`Source: ${sourceContent.substring(0, 80)}...`);

        const options: DiagramGenerationOptions = {
            compatibilityMode: 'best-fit',
            targetLanguage: 'en',
            requestedIntent: intent,
            llmInvoker: async (systemPrompt: string, sourceMarkdown: string) => {
                return chat(provider, [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: sourceMarkdown },
                ], 4096);
            },
        };

        const result = await generateDiagramArtifact(sourceContent, options);

        expect(result).toBeTruthy();
        expect(result.spec).toBeTruthy();
        expect(result.spec.intent).toBeTruthy();
        expect(result.artifact).toBeTruthy();
        expect(result.artifact.target).toBeTruthy();

        console.log(`Intent: ${result.spec.intent} | Target: ${result.artifact.target}`);
        console.log(`Nodes: ${result.spec.nodes?.length ?? 0} | Edges: ${result.spec.edges?.length ?? 0}`);
        console.log(`Content preview: ${(result.artifact.content ?? '').substring(0, 150)}`);

        // Verify the generated intent matches or is compatible with requested
        expect(SUPPORTED_DIAGRAM_INTENTS).toContain(result.spec.intent);
    }, 120000);
});
