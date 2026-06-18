/**
 * Local HTTP server for serving Slidev HTML exports
 *
 * Slidev exports use ES modules with dynamic imports, which are blocked
 * by CORS policy when opened via file:// protocol. This server provides
 * a local HTTP server to serve the exports properly.
 */

import type { Server } from 'http';
import { Notice } from 'obsidian';
import { createReadStream, existsSync, statSync } from 'fs';
import { extname, join, normalize } from 'path';

interface ServerInstance {
	server: Server;
	port: number;
	directory: string;
}

const activeServers = new Map<string, ServerInstance>();

/**
 * Start a local HTTP server for a directory
 */
export async function startLocalServer(directory: string, preferredPort = 8765): Promise<number> {
	// Check if server already running for this directory
	const existing = activeServers.get(directory);
	if (existing) {
		return existing.port;
	}

	// Find available port
	const port = await findAvailablePort(preferredPort);

	return new Promise((resolve, reject) => {
		const server = createStaticServer(directory);
		server.on('error', error => reject(new Error(`Failed to start server: ${error.message}`)));
		server.listen(port, () => {
			activeServers.set(directory, {
				server,
				port,
				directory
			});
			resolve(port);
		});
	});
}

/**
 * Stop server for a directory
 */
export function stopLocalServer(directory: string): void {
	const server = activeServers.get(directory);
	if (server) {
		server.server.close();
		activeServers.delete(directory);
	}
}

/**
 * Stop all active servers
 */
export function stopAllServers(): void {
	for (const [directory, server] of activeServers.entries()) {
		server.server.close();
	}
	activeServers.clear();
}

/**
 * Get server URL for a directory
 */
export function getServerUrl(directory: string): string | null {
	const server = activeServers.get(directory);
	return server ? `http://localhost:${server.port}` : null;
}

/**
 * Find an available port starting from preferred port
 */
async function findAvailablePort(startPort: number): Promise<number> {
	const { createServer } = await import('http');

	return new Promise((resolve, reject) => {
		const server = createServer();

		server.listen(startPort, () => {
			const address = server.address();
			if (address && typeof address !== 'string') {
				const port = address.port;
				server.close(() => resolve(port));
			} else {
				server.close(() => reject(new Error('Could not determine port')));
			}
		});

		server.on('error', (err: NodeJS.ErrnoException) => {
			if (err.code === 'EADDRINUSE') {
				// Port in use, try next one
				resolve(findAvailablePort(startPort + 1));
			} else {
				reject(err);
			}
		});
	});
}

function createStaticServer(directory: string): Server {
	const { createServer } = require('http') as typeof import('http');

	return createServer((request, response) => {
		const requestPath = new URL(request.url || '/', 'http://localhost').pathname;
		const relativePath = requestPath === '/' ? '/index.html' : requestPath;
		const normalizedPath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
		const filePath = join(directory, normalizedPath);

		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Cache-Control', 'no-store');

		if (!existsSync(filePath) || !statSync(filePath).isFile()) {
			response.statusCode = 404;
			response.end('Not found');
			return;
		}

		response.setHeader('Content-Type', contentTypeForPath(filePath));
		createReadStream(filePath)
			.on('error', () => {
				response.statusCode = 500;
				response.end('Failed to read file');
			})
			.pipe(response);
	});
}

function contentTypeForPath(filePath: string): string {
	switch (extname(filePath).toLowerCase()) {
		case '.html':
			return 'text/html; charset=utf-8';
		case '.js':
			return 'application/javascript; charset=utf-8';
		case '.css':
			return 'text/css; charset=utf-8';
		case '.json':
			return 'application/json; charset=utf-8';
		case '.svg':
			return 'image/svg+xml';
		case '.png':
			return 'image/png';
		case '.jpg':
		case '.jpeg':
			return 'image/jpeg';
		case '.woff':
			return 'font/woff';
		case '.woff2':
			return 'font/woff2';
		default:
			return 'application/octet-stream';
	}
}

/**
 * Open HTML export in browser via local server
 */
export async function openHtmlInBrowser(htmlPath: string, vaultRoot: string): Promise<void> {
	try {
		// Extract directory from HTML path
		const directory = htmlPath.substring(0, htmlPath.lastIndexOf('/'));
		const filename = htmlPath.substring(htmlPath.lastIndexOf('/') + 1);
		const fullDirectory = `${vaultRoot}/${directory}`;

		// Start server
		new Notice('Starting local server...');
		const port = await startLocalServer(fullDirectory);

		// Construct URL
		const url = `http://localhost:${port}/${filename}`;

		// Open in default browser
		require('electron').shell.openExternal(url);

		new Notice(`Opened in browser: ${url}`);
	} catch (error) {
		new Notice(`Failed to start server: ${error.message}`);
		throw error;
	}
}
