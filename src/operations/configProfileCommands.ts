import { buildCliInvocationContract } from '../cliContracts';
import { buildCliCapabilityManifest } from './capabilityManifest';
import { buildCliPublicSurface } from './publicCliSurface';
import {
    buildProviderProfileExport,
    buildRedactedProviderProfileExport,
    parseProviderProfileImport,
    ProviderProfileExport,
    RedactedProviderProfileExport,
    ProviderProfileImportSummary
} from '../providerProfiles';
import { LLMProviderConfig } from '../types';

export const PROVIDER_PROFILE_FILE_NAME = 'notemd-providers.json';
export const REDACTED_PROVIDER_PROFILE_FILE_NAME = 'notemd-providers-redacted.json';
export const CLI_CAPABILITY_MANIFEST_FILE_NAME = 'notemd-cli-capabilities.json';
export const CLI_INVOCATION_CONTRACT_FILE_NAME = 'notemd-cli-contract.json';
export const CLI_PUBLIC_SURFACE_FILE_NAME = 'notemd-cli-public-surface.json';

export interface PluginConfigCommandHost {
    configDir: string;
    exists: (path: string) => Promise<boolean>;
    mkdir: (path: string) => Promise<void>;
    read: (path: string) => Promise<string>;
    write: (path: string, content: string) => Promise<void>;
}

export interface ExportProviderProfilesCommandResult {
    outputPath: string;
    profile: ProviderProfileExport;
}

export interface ExportRedactedProviderProfilesCommandResult {
    outputPath: string;
    profile: RedactedProviderProfileExport;
}

export interface ImportProviderProfilesCommandResult extends ProviderProfileImportSummary {
    inputPath: string;
    activeProvider: string;
    activeProviderReset: boolean;
}

export interface ExportCliCapabilityManifestCommandResult {
    outputPath: string;
    manifest: ReturnType<typeof buildCliCapabilityManifest>;
}

export interface ExportCliInvocationContractCommandResult {
    outputPath: string;
    contract: ReturnType<typeof buildCliInvocationContract>;
}

export interface ExportCliPublicSurfaceCommandResult {
    outputPath: string;
    surface: ReturnType<typeof buildCliPublicSurface>;
}

export class MissingProviderProfileImportFileError extends Error {
    constructor(public readonly inputPath: string) {
        super(`Provider profile import file not found: ${inputPath}`);
        this.name = 'MissingProviderProfileImportFileError';
    }
}

export function buildPluginConfigDir(configDir: string, pluginId: string): string {
    return `${configDir}/plugins/${pluginId}`;
}

export function buildPluginConfigFilePath(configDir: string, pluginId: string, fileName: string): string {
    return `${buildPluginConfigDir(configDir, pluginId)}/${fileName}`;
}

async function ensurePluginConfigDir(host: PluginConfigCommandHost, pluginId: string): Promise<string> {
    const pluginConfigDir = buildPluginConfigDir(host.configDir, pluginId);
    if (!(await host.exists(pluginConfigDir))) {
        await host.mkdir(pluginConfigDir);
    }
    return pluginConfigDir;
}

async function writePluginConfigJsonFile(
    host: PluginConfigCommandHost,
    pluginId: string,
    fileName: string,
    payload: unknown
): Promise<string> {
    await ensurePluginConfigDir(host, pluginId);
    const outputPath = buildPluginConfigFilePath(host.configDir, pluginId, fileName);
    await host.write(outputPath, JSON.stringify(payload, null, 2));
    return outputPath;
}

function resolveImportedActiveProvider(
    importedProviders: LLMProviderConfig[],
    activeProvider: string,
    defaultActiveProvider: string
): { activeProvider: string; activeProviderReset: boolean } {
    const providerNames = new Set(importedProviders.map(provider => provider.name));
    if (providerNames.has(activeProvider)) {
        return {
            activeProvider,
            activeProviderReset: false
        };
    }

    if (providerNames.has(defaultActiveProvider)) {
        return {
            activeProvider: defaultActiveProvider,
            activeProviderReset: true
        };
    }

    if (importedProviders.length > 0) {
        return {
            activeProvider: importedProviders[0].name,
            activeProviderReset: true
        };
    }

    return {
        activeProvider: defaultActiveProvider,
        activeProviderReset: true
    };
}

export async function executeExportProviderProfilesCommand(params: {
    pluginId: string;
    providers: LLMProviderConfig[];
    host: PluginConfigCommandHost;
    now?: Date;
    buildProviderProfileExportImpl?: typeof buildProviderProfileExport;
}): Promise<ExportProviderProfilesCommandResult> {
    const buildExport = params.buildProviderProfileExportImpl ?? buildProviderProfileExport;
    const profile = buildExport(params.providers, params.now ?? new Date());
    const outputPath = await writePluginConfigJsonFile(
        params.host,
        params.pluginId,
        PROVIDER_PROFILE_FILE_NAME,
        profile
    );

    return {
        outputPath,
        profile
    };
}

export async function executeExportRedactedProviderProfilesCommand(params: {
    pluginId: string;
    providers: LLMProviderConfig[];
    host: PluginConfigCommandHost;
    now?: Date;
    buildRedactedProviderProfileExportImpl?: typeof buildRedactedProviderProfileExport;
}): Promise<ExportRedactedProviderProfilesCommandResult> {
    const buildExport = params.buildRedactedProviderProfileExportImpl ?? buildRedactedProviderProfileExport;
    const profile = buildExport(params.providers, params.now ?? new Date());
    const outputPath = await writePluginConfigJsonFile(
        params.host,
        params.pluginId,
        REDACTED_PROVIDER_PROFILE_FILE_NAME,
        profile
    );

    return {
        outputPath,
        profile
    };
}

export async function executeImportProviderProfilesCommand(params: {
    pluginId: string;
    existingProviders: LLMProviderConfig[];
    activeProvider: string;
    defaultActiveProvider: string;
    host: PluginConfigCommandHost;
    parseProviderProfileImportImpl?: typeof parseProviderProfileImport;
}): Promise<ImportProviderProfilesCommandResult> {
    const inputPath = buildPluginConfigFilePath(params.host.configDir, params.pluginId, PROVIDER_PROFILE_FILE_NAME);
    if (!(await params.host.exists(inputPath))) {
        throw new MissingProviderProfileImportFileError(inputPath);
    }

    const jsonData = await params.host.read(inputPath);
    const parseImport = params.parseProviderProfileImportImpl ?? parseProviderProfileImport;
    const importSummary = parseImport(jsonData, params.existingProviders);
    const activeProviderState = resolveImportedActiveProvider(
        importSummary.importedProviders,
        params.activeProvider,
        params.defaultActiveProvider
    );

    return {
        ...importSummary,
        inputPath,
        activeProvider: activeProviderState.activeProvider,
        activeProviderReset: activeProviderState.activeProviderReset
    };
}

export async function executeExportCliCapabilityManifestCommand(params: {
    pluginId: string;
    host: PluginConfigCommandHost;
    buildCliCapabilityManifestImpl?: typeof buildCliCapabilityManifest;
}): Promise<ExportCliCapabilityManifestCommandResult> {
    const buildManifest = params.buildCliCapabilityManifestImpl ?? buildCliCapabilityManifest;
    const manifest = buildManifest(params.pluginId);
    const outputPath = await writePluginConfigJsonFile(
        params.host,
        params.pluginId,
        CLI_CAPABILITY_MANIFEST_FILE_NAME,
        manifest
    );

    return {
        outputPath,
        manifest
    };
}

export async function executeExportCliInvocationContractCommand(params: {
    pluginId: string;
    host: PluginConfigCommandHost;
    buildCliInvocationContractImpl?: typeof buildCliInvocationContract;
}): Promise<ExportCliInvocationContractCommandResult> {
    const buildContract = params.buildCliInvocationContractImpl ?? buildCliInvocationContract;
    const contract = buildContract();
    const outputPath = await writePluginConfigJsonFile(
        params.host,
        params.pluginId,
        CLI_INVOCATION_CONTRACT_FILE_NAME,
        contract
    );

    return {
        outputPath,
        contract
    };
}

export async function executeExportCliPublicSurfaceCommand(params: {
    pluginId: string;
    host: PluginConfigCommandHost;
    buildCliPublicSurfaceImpl?: typeof buildCliPublicSurface;
}): Promise<ExportCliPublicSurfaceCommandResult> {
    const buildSurface = params.buildCliPublicSurfaceImpl ?? buildCliPublicSurface;
    const surface = buildSurface(params.pluginId);
    const outputPath = await writePluginConfigJsonFile(
        params.host,
        params.pluginId,
        CLI_PUBLIC_SURFACE_FILE_NAME,
        surface
    );

    return {
        outputPath,
        surface
    };
}
