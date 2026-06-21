/**
 * Slide Export — type definitions
 *
 * Types for environment probing, export configuration, and command execution.
 */

export type SlideExportFormat = 'html' | 'pdf' | 'png' | 'pptx' | 'mp4';

export interface ProbeResult {
	tool: 'node' | 'slidev' | 'playwright' | 'ffmpeg';
	installed: boolean;
	version: string | null;
	error?: string;
}

export interface ExportCapabilities {
	html: boolean;
	pdf: boolean;
	png: boolean;
	pptx: boolean;
	mp4: boolean;
}

export interface EnvironmentReport {
	isDesktop: boolean;
	platform: 'win32' | 'darwin' | 'linux' | 'unknown';
	node: ProbeResult;
	slidev: ProbeResult;
	playwright: ProbeResult;
	ffmpeg: ProbeResult;
	capabilities: ExportCapabilities;
}

export type SlidevHtmlMode = 'standalone' | 'server-script';

export type SlidevHtmlActualMode = 'standalone' | 'server-script' | 'server-script-fallback';

export interface SlidevStandaloneAttempt {
	attempted: boolean;
	accepted: boolean;
	outputPath: string | null;
	preservedFailurePath: string | null;
	loaderGaps: string[];
	failureReason: 'loader-gaps' | null;
}

export interface SlidevHtmlExportOutcome {
	path: string;
	requestedMode: SlidevHtmlMode;
	actualMode: SlidevHtmlActualMode;
	requiresLocalServer: boolean;
	fallbackPath: string | null;
	standaloneAttempt: SlidevStandaloneAttempt;
}

export interface SlideExportConfig {
	format: SlideExportFormat;
	withClicks: boolean;
	outputSubfolder: string;
	ffmpegFps: number;
	ffmpegCrf: number;
	slidevTheme: string;
	timeoutMs: number;
	htmlMode?: SlidevHtmlMode;
}

export interface SlidevExportSource {
	inputFilePath: string;
	outputBasename: string;
	sourceLabel: string;
	preparedDeckPath?: string;
	skillRootPath?: string;
	skillReferencePaths?: string[];
}

export interface ExecResult {
	exitCode: number | null;
	stdout: string;
	stderr: string;
	error?: Error;
}

export type ExportProgressCallback = (phase: string, detail?: string) => void;

export interface InstallableTool {
	id: 'slidev' | 'playwright';
	label: string;
	autoInstall: true;
}

export interface ManualTool {
	id: 'node' | 'ffmpeg';
	label: string;
	autoInstall: false;
	installHint: string;
}

export type ProbeTool = InstallableTool | ManualTool;

export const PROBE_TOOL_ORDER: readonly ProbeResult['tool'][] = ['node', 'slidev', 'playwright', 'ffmpeg'] as const;

export const FFMPEG_INSTALL_HINTS: Record<EnvironmentReport['platform'], string> = {
	darwin: 'brew install ffmpeg',
	linux: 'sudo apt install ffmpeg  # or: sudo dnf install ffmpeg',
	win32: 'winget install ffmpeg\n# Or download from https://ffmpeg.org/download.html',
	unknown: 'Install ffmpeg from https://ffmpeg.org/download.html',
};
