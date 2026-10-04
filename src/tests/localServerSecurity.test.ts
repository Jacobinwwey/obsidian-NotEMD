import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { request, createServer } from 'http';
import { startLocalServer, stopLocalServer, stopAllServers, getServerUrl } from '../slideExport/localServer';

jest.mock('obsidian', () => ({ Platform: { isDesktopApp: true }, Notice: jest.fn() }));
let directory: string;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'notemd-server-')); writeFileSync(join(directory, 'index.html'), '<p>测试</p>'); });
afterEach(() => { stopAllServers(); rmSync(directory, { recursive: true, force: true }); });
function get(port: number, path = '/', headers: Record<string, string> = {}) {
    return new Promise<{ status: number; body: string; headers: Record<string, unknown> }>((resolve, reject) => {
        request({ hostname: '127.0.0.1', port, path, headers }, response => {
            let body = ''; response.setEncoding('utf8'); response.on('data', chunk => body += chunk);
            response.on('end', () => resolve({ status: response.statusCode ?? 0, body, headers: response.headers }));
        }).on('error', reject).end();
    });
}
test('serves UTF-8 locally without granting wildcard cross-origin access', async () => {
    const port = await startLocalServer(directory, 0);
    const response = await get(port);
    expect(response.status).toBe(200); expect(response.body).toContain('测试');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(getServerUrl(directory)).toBe('http://127.0.0.1:' + port);
});
test('rejects foreign Host and Origin headers', async () => {
    const port = await startLocalServer(directory, 0);
    expect((await get(port, '/', { Host: 'attacker.invalid' })).status).toBe(403);
    expect((await get(port, '/', { Origin: 'https://attacker.invalid' })).status).toBe(403);
});
test('malformed escapes and encoded traversal fail without escaping the export directory', async () => {
    const port = await startLocalServer(directory, 0);
    expect((await get(port, '/%zz')).status).toBe(400);
    expect((await get(port, '/%2e%2e%2foutside.txt')).status).toBe(403);
});

test('concurrent acquisition shares one listener and releasing one consumer keeps the other alive', async () => {
    const [first, second] = await Promise.all([startLocalServer(directory, 0), startLocalServer(join(directory, '.'), 0)]);
    expect(first).toBe(second);
    stopLocalServer(directory);
    expect((await get(second)).status).toBe(200);
    stopLocalServer(directory);
    expect(getServerUrl(directory)).toBeNull();
});
test('shutdown cancels pending startup instead of resurrecting an unmanaged listener', async () => {
    const starting = startLocalServer(directory, 0); stopAllServers();
    await expect(starting).rejects.toThrow(/cancel/i);
    expect(getServerUrl(directory)).toBeNull();
});
test('actual bind retries a busy port without a separate probe window', async () => {
    const occupied = createServer(); await new Promise<void>(resolve => occupied.listen(0, '127.0.0.1', resolve));
    try {
        const address = occupied.address(); if (!address || typeof address === 'string') throw new Error('Missing address');
        const port = await startLocalServer(directory, address.port);
        expect(port).not.toBe(address.port); expect((await get(port)).status).toBe(200);
    } finally { await new Promise<void>((resolve, reject) => occupied.close(error => error ? reject(error) : resolve())); }
});
