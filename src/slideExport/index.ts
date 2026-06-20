/**
 * Slide Export — barrel export
 *
 * Re-exports all slide export functionality.
 * Used by dynamic imports in main.ts / sidebar to avoid bundling
 * child_process on mobile.
 */

export { type SlideExportFormat, type SlideExportConfig, type SlidevExportSource, type EnvironmentReport, type ProbeResult, type ExportCapabilities, type ExecResult, type ExportProgressCallback, type SlidevHtmlActualMode, type SlidevHtmlExportOutcome, type SlidevHtmlMode, type SlidevStandaloneAttempt } from './types';
export { isDesktopApp, getVaultBasePath, safeRequire, execFileAsync, resolveNpxCommand, getOsPlatform } from './platformUtils';
export { probeEnvironment, probeNode, probeSlidev, probePlaywright, probeFfmpeg } from './environmentProber';
export {
	prepareSlidevExportSource,
	prepareSlidevExportSourceFromOutline,
	generateSlidevExportOutline,
	getSlidevExportOutlinePath
} from './slidevSourcePreparer';
export { exportSlidevHtml, exportSlidevHtmlWithOutcome, exportSlidevPdf, exportSlidevPng, autoInstallSlidev, autoInstallPlaywright } from './slidevExporter';
export { convergeSlidevDeckLayout } from './slidevLayoutWorkflow';
export { exportVideoMp4, getFfmpegInstallInstructions } from './videoExporter';
export { EnvironmentProbeModal } from './EnvironmentProbeModal';
