import { NOTEMD_SLIDEV_FORK_RELEASE_URL } from './slidevDistribution';

export const NOTEMD_SLIDEV_REQUIRED_BUILD_OPTIONS = ['--out', '--format', '--standalone-bundle'];
export const NOTEMD_SLIDEV_MISSING_ERROR = `The required Jacobinwwey/slidev fork is missing or its local provenance cannot be verified. Install the NoteMD fork release (${NOTEMD_SLIDEV_FORK_RELEASE_URL}) into the vault. If NOTEMD_SLIDEV_BIN or SLIDEV_CLI_PATH is set, point it to a fork checkout or npm installation with a fork release package-lock.json. Official @slidev/cli and automatic npx fallback are not supported.`;

export function findMissingSlidevBuildOptions(helpText: string): string[] {
	return NOTEMD_SLIDEV_REQUIRED_BUILD_OPTIONS.filter(option => !helpText.includes(option));
}

export function formatSlidevBuildRequirementError(description: string, missingOptions: string[]): string {
	const missing = missingOptions.length > 0 ? missingOptions.join(', ') : NOTEMD_SLIDEV_REQUIRED_BUILD_OPTIONS.join(', ');
	return `Slidev found via ${description}, but it is not the NoteMD Slidev fork build required for standalone export. Missing required build option(s): ${missing}. Install the NoteMD Slidev fork release (${NOTEMD_SLIDEV_FORK_RELEASE_URL}) or set NOTEMD_SLIDEV_BIN to a compatible fork CLI.`;
}
