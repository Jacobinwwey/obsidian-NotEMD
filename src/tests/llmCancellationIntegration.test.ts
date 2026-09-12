import { createServer } from 'http';
import type { Socket } from 'net';
import { requestUrl } from 'obsidian';
import { callLLM, clearLlmResponseCache } from '../llmUtils';
import { DEFAULT_SETTINGS } from '../constants';
import { createDefaultProviders } from '../llmProviders';
import { ProgressReporter } from '../types';

describe('real loopback transport cancellation', () => {
    test.each(['desktop', 'fetch'])('%s closes an in-flight stream and retains caller controller ownership', async transport => {
        const versions = Object.getOwnPropertyDescriptor(process, 'versions')!;
        const sockets = new Set<Socket>();
        let announceRequest!: () => void;
        const started = new Promise<void>(resolve => { announceRequest = resolve; });
        let announceClose!: () => void;
        const closed = new Promise<void>(resolve => { announceClose = resolve; });
        const server = createServer((_request, response) => {
            response.on('close', announceClose);
            response.writeHead(200, { 'Content-Type': 'text/event-stream' });
            response.write('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n');
            announceRequest();
        });
        server.on('connection', socket => {
            sockets.add(socket);
            socket.on('close', () => sockets.delete(socket));
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
            if (transport === 'fetch') {
                Object.defineProperty(process, 'versions', { ...versions, value: { ...process.versions, node: undefined } });
            }
            clearLlmResponseCache();
            (requestUrl as jest.Mock).mockReset();
            const address = server.address();
            if (!address || typeof address === 'string') throw new Error('Loopback server has no TCP address.');
            const controller = new AbortController();
            let cancelled = false;
            const reporter: ProgressReporter = {
                log: jest.fn(), updateStatus: jest.fn(), clearDisplay: jest.fn(),
                get cancelled() { return cancelled; },
                requestCancel() { cancelled = true; controller.abort(); },
                abortController: controller, activeTasks: 0, updateActiveTasks: jest.fn()
            };
            const provider = createDefaultProviders().find(candidate => candidate.name === 'OpenAI Compatible')!;
            const running = callLLM({ ...provider, baseUrl: `http://127.0.0.1:${address.port}/v1`, model: 'loopback' },
                'integration', transport, { ...DEFAULT_SETTINGS, enableStableApiCall: true, apiCallMaxRetries: 0 }, reporter)
                .catch(error => error);
            await started;
            reporter.requestCancel();
            const outcome = await running;
            await closed;
            expect(outcome).toEqual(expect.objectContaining({ name: 'AbortError', message: expect.stringMatching(/cancelled/i) }));
            expect(requestUrl).not.toHaveBeenCalled();
            expect(reporter.abortController).toBe(controller);
        } finally {
            Object.defineProperty(process, 'versions', versions);
            sockets.forEach(socket => socket.destroy());
            await new Promise<void>(resolve => server.close(() => resolve()));
        }
    });
});
