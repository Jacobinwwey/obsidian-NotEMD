import { isDesktopApp, safeRequire } from './platformUtils';
/**
 * Local HTTP server for serving Slidev HTML exports
 *
 * Slidev exports use ES modules with dynamic imports, which are blocked
 * by CORS policy when opened via file:// protocol. This server provides
 * a local HTTP server to serve the exports properly.
 */

import type { Server } from 'http';
import { Notice } from 'obsidian';

interface ServerInstance {
    server?: Server;
    port?: number;
    users: number;
    cancelled: boolean;
    ready: Promise<number>;
}
const activeServers = new Map<string, ServerInstance>();

function canonicalDirectory(directory: string): string {
    // The desktop operation owns Node access. Importing shutdown remains mobile-safe.
    const files = safeRequire('fs') as typeof import('fs') | null;
    if (!files) throw new Error('Local filesystem access is unavailable.');
    return files.realpathSync(directory);
}

/** Each successful acquisition must have one matching release. */
export async function startLocalServer(directory: string, preferredPort = 8765): Promise<number> {
    if (!isDesktopApp()) throw new Error('Local HTML serving requires desktop Obsidian.');
    if (!Number.isInteger(preferredPort) || preferredPort < 0 || preferredPort > 65535) throw new Error('Invalid local server port.');
    const root = canonicalDirectory(directory);
    const existing = activeServers.get(root);
    if (existing) { existing.users++; return existing.ready; }
    const entry: ServerInstance = { users: 1, cancelled: false, ready: Promise.resolve(0) };
    // Register before the first await, so concurrent starts and unload see pending work.
    activeServers.set(root, entry);
    entry.ready = createStaticServer(root).then(server => {
        entry.server = server;
        return new Promise<number>((resolve, reject) => {
            const listen = (port: number) => {
                if (entry.cancelled) { reject(new Error('Local server startup cancelled.')); return; }
                const failed = (error: NodeJS.ErrnoException) => {
                    if (error.code === 'EADDRINUSE' && port > 0 && port < 65535) listen(port + 1);
                    else reject(error);
                };
                server.once('error', failed);
                server.listen(port, '127.0.0.1', () => {
                    server.removeListener('error', failed);
                    if (entry.cancelled) { server.close(); reject(new Error('Local server startup cancelled.')); return; }
                    const address = server.address();
                    if (!address || typeof address === 'string') { server.close(); reject(new Error('Could not determine local server port.')); return; }
                    entry.port = address.port;
                    resolve(address.port);
                });
            };
            listen(preferredPort);
        });
    }).catch((error: unknown) => {
        if (activeServers.get(root) === entry) activeServers.delete(root);
        entry.cancelled = true;
        entry.server?.close();
        throw error;
    });
    return entry.ready;
}

/** Release one consumer; the final release closes the shared listener. */
export function stopLocalServer(directory: string): void {
    if (!isDesktopApp()) return;
    const root = canonicalDirectory(directory);
    const entry = activeServers.get(root);
    if (!entry || --entry.users > 0) return;
    activeServers.delete(root);
    entry.cancelled = true;
    entry.server?.close();
}

/** Plugin unload owns all active and pending listeners regardless of consumers. */
export function stopAllServers(): void {
    for (const entry of activeServers.values()) { entry.cancelled = true; entry.server?.close(); }
    activeServers.clear();
}

export function getServerUrl(directory: string): string | null {
    if (!isDesktopApp()) return null;
    const port = activeServers.get(canonicalDirectory(directory))?.port;
    return port ? 'http://127.0.0.1:' + port : null;
}

async function createStaticServer(directory: string): Promise<Server> {
    // This dependency boundary must remain lazy: main imports shutdown on mobile.
    const [{ createServer }, files, paths] = await Promise.all([import('http'), import('fs'), import('path')]);
    const root = files.realpathSync(directory);
    const server = createServer((request, response) => {
        const address = server.address();
        const port = address && typeof address !== 'string' ? address.port : 0;
        const hosts = [`http://127.0.0.1:${port}`, `http://localhost:${port}`];
        if (!hosts.includes(`http://${request.headers.host}`)
            || (request.headers.origin && !hosts.includes(request.headers.origin))) {
            response.writeHead(403); response.end('Forbidden'); return;
        }
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
        }
        let pathname: string;
        try {
            pathname = decodeURIComponent(new URL(request.url || '/', hosts[0]).pathname);
        } catch {
            response.writeHead(400); response.end('Invalid request path'); return;
        }
        const filePath = paths.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
        const relative = paths.relative(root, filePath);
        if (relative === '..' || relative.startsWith('..' + paths.sep) || paths.isAbsolute(relative) || pathname.includes('\0')) {
            response.writeHead(403); response.end('Forbidden'); return;
        }
        try {
            const realFile = files.realpathSync(filePath);
            const realRelative = paths.relative(root, realFile);
            if (realRelative === '..' || realRelative.startsWith('..' + paths.sep) || paths.isAbsolute(realRelative)) {
                response.writeHead(403); response.end('Forbidden'); return;
            }
            if (!files.statSync(realFile).isFile()) {
                response.writeHead(404); response.end('Not found'); return;
            }
            const types: Record<string, string> = {
                '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
                '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.woff': 'font/woff', '.woff2': 'font/woff2'
            };
            response.setHeader('Content-Type', types[paths.extname(realFile).toLowerCase()] ?? 'application/octet-stream');
            response.setHeader('Cache-Control', 'no-store');
            response.setHeader('X-Content-Type-Options', 'nosniff');
            if (request.method === 'HEAD') { response.end(); return; }
            files.createReadStream(realFile).on('error', error => {
                if (response.headersSent) response.destroy(error);
                else { response.writeHead(500); response.end('Failed to read file'); }
            }).pipe(response);
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            response.writeHead(code === 'ENOENT' || code === 'ENOTDIR' ? 404 : 500);
            response.end(code === 'ENOENT' || code === 'ENOTDIR' ? 'Not found' : 'Failed to read file');
        }
    });
    return server;
}


/** Open an exported HTML file through the loopback server on desktop. */
export async function openHtmlInBrowser(htmlPath: string, vaultRoot: string): Promise<void> {
    const directory = htmlPath.substring(0, htmlPath.lastIndexOf('/'));
    const filename = htmlPath.substring(htmlPath.lastIndexOf('/') + 1);
    const fullDirectory = vaultRoot + '/' + directory;
    // Browser tabs outlive this operation; their acquired lease is released at plugin unload.
    const port = await startLocalServer(fullDirectory);
    const url = 'http://127.0.0.1:' + port + '/' + encodeURIComponent(filename);
    const electron = safeRequire('electron') as { shell: { openExternal(url: string): Promise<void> } } | null;
    if (!electron) { stopLocalServer(fullDirectory); throw new Error('Opening the system browser is unavailable.'); }
    try { await electron.shell.openExternal(url); }
    catch (error: unknown) { stopLocalServer(fullDirectory); throw error; }
    new Notice('Opened in browser: ' + url);
}
