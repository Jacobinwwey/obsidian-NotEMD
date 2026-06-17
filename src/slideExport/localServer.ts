/**
 * Local HTTP server for serving Slidev HTML exports
 *
 * Slidev exports use ES modules with dynamic imports, which are blocked
 * by CORS policy when opened via file:// protocol. This server provides
 * a local HTTP server to serve the exports properly.
 */

import type { Server } from 'http';
import { spawn, ChildProcess } from 'child_process';
import { Notice } from 'obsidian';

interface ServerInstance {
	process: ChildProcess;
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
		// Use Node's built-in http-server via npx
		const serverProcess = spawn('npx', [
			'-y',
			'http-server',
			directory,
			'-p', port.toString(),
			'--cors',
			'-c-1', // Disable caching
			'--silent'
		], {
			stdio: ['ignore', 'pipe', 'pipe']
		});

		let started = false;

		serverProcess.stdout?.on('data', (data: Buffer) => {
			const output = data.toString();
			if (output.includes('Available on:') || output.includes('Hit CTRL-C')) {
				if (!started) {
					started = true;
					activeServers.set(directory, {
						process: serverProcess,
						port,
						directory
					});
					resolve(port);
				}
			}
		});

		serverProcess.stderr?.on('data', (data: Buffer) => {
			console.error('Server error:', data.toString());
		});

		serverProcess.on('error', (error) => {
			if (!started) {
				reject(new Error(`Failed to start server: ${error.message}`));
			}
		});

		serverProcess.on('exit', (code) => {
			activeServers.delete(directory);
			if (!started && code !== 0) {
				reject(new Error(`Server exited with code ${code}`));
			}
		});

		// Timeout after 10 seconds
		setTimeout(() => {
			if (!started) {
				serverProcess.kill();
				reject(new Error('Server startup timeout'));
			}
		}, 10000);
	});
}

/**
 * Stop server for a directory
 */
export function stopLocalServer(directory: string): void {
	const server = activeServers.get(directory);
	if (server) {
		server.process.kill();
		activeServers.delete(directory);
	}
}

/**
 * Stop all active servers
 */
export function stopAllServers(): void {
	for (const [directory, server] of activeServers.entries()) {
		server.process.kill();
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
