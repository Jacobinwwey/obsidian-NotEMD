/**
 * Slide Export — video exporter
 *
 * Converts a PNG sequence (from slidev export --format png --per-slide)
 * into an MP4 video via ffmpeg.
 *
 * Slidev CLI names PNG files either as `<slideNo>.png` (one-piece export) or
 * `<slideNo>.padStart(2).png` (per-slide export, e.g. `01.png`), and with
 * `--with-clicks` appends `-<clicks>` to produce `<slideNo>-<clicks>.png`. A
 * shell glob (`*.png`) sorts those names lexicographically, so a 34-slide deck
 * is read as `1.png, 10.png, 11.png, ..., 2.png, ...` — the wrong order. The
 * ffmpeg `image2` sequence demuxer needs a fixed zero-pad width, which breaks
 * for decks with >= 100 slides whose zero-padding is only 2 digits. We side-step
 * every naming hazard by listing the directory ourselves, sorting the entries
 * by their numeric groups (slide number then click index), and feeding ffmpeg
 * the concat demuxer with an explicit per-frame `duration` so each slide
 * becomes exactly one frame at the configured fps.
 */

import type { App } from 'obsidian';
import type { SlideExportConfig, ExportProgressCallback } from './types';
import { FFMPEG_INSTALL_HINTS } from './types';
import { execFileAsync, getVaultBasePath, safeRequire } from './platformUtils';

const MP4_CONCAT_LIST_FILE_NAME = '_slidev-mp4-concat.txt';

/**
 * Build a numeric sort key from a PNG filename stem by splitting on every
 * non-digit run, so `1.png`, `01.png`, and `01-2.png` map to
 * [1], [1], and [1, 2] respectively. Names with no digits sort lowest.
 */
function numericGroupsFromPngFileName(fileName: string): number[] {
	const stem = fileName.replace(/\.png$/, '');
	const parts = stem.split(/[^0-9]+/).filter(Boolean);
	return parts.length ? parts.map(part => parseInt(part, 10)) : [];
}

/**
 * Convert PNG sequence to MP4 using ffmpeg with an explicit, numerically-ordered
 * concat list so slides are encoded in deck order regardless of file naming or
 * zero-padding width.
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

	const fs: any = safeRequire('fs');
	const path: any = safeRequire('path');
	if (!fs?.readdirSync || !fs?.writeFileSync || !path?.join) {
		throw new Error('node fs/path modules unavailable for MP4 concat list');
	}

	const absPngDir = `${vaultRoot}/${pngDirectory}`;
	const outputMp4 = `${vaultRoot}/${config.outputSubfolder}/${outputName}.mp4`;

	const pngFileNames = (fs.readdirSync(absPngDir) as string[])
		.filter((name: string) => name.endsWith('.png') && name !== MP4_CONCAT_LIST_FILE_NAME)
		.sort((a: string, b: string) => {
			const ga = numericGroupsFromPngFileName(a);
			const gb = numericGroupsFromPngFileName(b);
			const limit = Math.max(ga.length, gb.length);
			for (let i = 0; i < limit; i++) {
				const va = ga[i] ?? Number.NEGATIVE_INFINITY;
				const vb = gb[i] ?? Number.NEGATIVE_INFINITY;
				if (va !== vb) return va - vb;
			}
			return 0;
		});
	if (pngFileNames.length === 0) {
		throw new Error(`No PNG slides found in ${pngDirectory} for MP4 encoding`);
	}

	// concat demuxer requires every file entry to be followed by a `duration`
	// line, and the final image must be re-listed because concat stops emitting
	// frames for the last entry's own duration window.
	const frameDuration = String(1 / config.ffmpegFps);
	const concatLines: string[] = [];
	for (const [index, name] of pngFileNames.entries()) {
		concatLines.push(`file '${path.join(absPngDir, name)}'`);
		concatLines.push(`duration ${frameDuration}`);
		if (index === pngFileNames.length - 1) {
			concatLines.push(`file '${path.join(absPngDir, name)}'`);
		}
	}
	const concatListPath = path.join(absPngDir, MP4_CONCAT_LIST_FILE_NAME);
	fs.writeFileSync(concatListPath, concatLines.join('\n') + '\n', 'utf8');

	// High capture scales (scale 3 → 2940x1653) can produce odd-dimensioned
	// inputs, which libx264 + yuv420p rejects ("height not divisible by 2").
	// Pad each frame to the next even width/height so encoding always succeeds;
	// pad uses a transparent/black background by default and only grows by ≤1px.
	const args = [
		'-f', 'concat',
		'-safe', '0',
		'-i', concatListPath,
		'-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
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
