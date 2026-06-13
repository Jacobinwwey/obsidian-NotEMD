/**
 * Slide Export — video exporter
 *
 * Converts a PNG sequence (from slidev export --format png --with-clicks)
 * into an MP4 video via ffmpeg.
 */

import type { App } from 'obsidian';
import type { SlideExportConfig, ExportProgressCallback } from './types';
import { FFMPEG_INSTALL_HINTS } from './types';
import { execFileAsync, getVaultBasePath } from './platformUtils';

/**
 * Convert PNG sequence to MP4 using ffmpeg.
 * ffmpeg -framerate <fps> -i <pattern> -c:v libx264 -pix_fmt yuv420p -crf <crf> -y output.mp4
 */
export async function exportVideoMp4(
	app: App,
	pngDirectory: string,
	outputName: string,
	config: SlideExportConfig,
	onProgress?: ExportProgressCallback,
): Promise<string> {
	onProgress?.('ffmpeg-encode', 'Encoding MP4 video...');
	const vaultRoot = getVaultBasePath(app);
	if (!vaultRoot) throw new Error('Vault root path unavailable');

	const absPngDir = `${vaultRoot}/${pngDirectory}`;
	const outputMp4 = `${vaultRoot}/${config.outputSubfolder}/${outputName}.mp4`;

	// Slidev PNG export with --with-clicks names files as: <slideNo>-<clicks>.png
	// Without --with-clicks: <slideNo>.png
	// ffmpeg input pattern for sequence: use glob or explicit pattern
	const pattern = config.withClicks ? '*.png' : '*.png';

	const args = [
		'-framerate', String(config.ffmpegFps),
		'-pattern_type', 'glob',
		'-i', `${absPngDir}/${pattern}`,
		'-c:v', 'libx264',
		'-pix_fmt', 'yuv420p',
		'-crf', String(config.ffmpegCrf),
		'-movflags', '+faststart',
		'-y',
		outputMp4,
	];

	const result = await execFileAsync('ffmpeg', args, {
		cwd: vaultRoot,
		timeout: Math.max(config.timeoutMs, 300_000),
	});

	if (result.exitCode !== 0) {
		throw new Error(`ffmpeg encoding failed (exit ${result.exitCode}): ${result.stderr || result.error?.message || 'unknown error'}`);
	}

	onProgress?.('ffmpeg-encode', 'MP4 encoding complete');
	return `${config.outputSubfolder}/${outputName}.mp4`;
}

/**
 * Get platform-specific ffmpeg install instructions.
 */
export function getFfmpegInstallInstructions(platform: 'win32' | 'darwin' | 'linux' | 'unknown'): string {
	return FFMPEG_INSTALL_HINTS[platform] || FFMPEG_INSTALL_HINTS.unknown;
}
