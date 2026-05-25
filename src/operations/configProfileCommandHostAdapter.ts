import { formatI18n } from '../i18n';
import { NotemdSettings } from '../types';
import {
    executeExportCliCapabilityManifestCommand,
    executeExportCliInvocationContractCommand,
    executeExportCliPublicSurfaceCommand,
    executeExportProviderProfilesCommand,
    executeExportRedactedProviderProfilesCommand,
    executeImportProviderProfilesCommand,
    ExportCliCapabilityManifestCommandResult,
    ExportCliInvocationContractCommandResult,
    ExportCliPublicSurfaceCommandResult,
    ExportProviderProfilesCommandResult,
    ExportRedactedProviderProfilesCommandResult,
    ImportProviderProfilesCommandResult,
    MissingProviderProfileImportFileError,
    PluginConfigCommandHost
} from './configProfileCommands';

export interface ConfigProfileCommandNotice {
    message: string;
    duration?: number;
}

export interface ConfigProfileCommandUiStrings {
    notices: {
        cliCapabilityManifestExported: string;
        cliInvocationContractExported: string;
        cliPublicSurfaceExported: string;
    };
    settings: {
        providerConfig: {
            exportSuccess: string;
            exportRedactedSuccess: string;
            exportSensitiveWarning: string;
            exportError: string;
            importFileMissing: string;
            activeProviderReset: string;
            importSuccess: string;
            importError: string;
        };
    };
}

export interface ConfigProfileCommandHost {
    loadSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;
    getSettings: () => NotemdSettings;
    getUiStrings: () => ConfigProfileCommandUiStrings;
    pluginId: string;
    defaultActiveProvider: string;
    configHost: PluginConfigCommandHost;
    logError: (message: string, error: unknown) => void;
}

export type ExportProviderProfilesHostResult =
    | {
        kind: 'success';
        notices: ConfigProfileCommandNotice[];
        execution: ExportProviderProfilesCommandResult;
    }
    | {
        kind: 'error';
        notices: ConfigProfileCommandNotice[];
        error: unknown;
    };

export type ExportRedactedProviderProfilesHostResult =
    | ConfigProfileHostSuccessResult<ExportRedactedProviderProfilesCommandResult>
    | {
        kind: 'error';
        notices: ConfigProfileCommandNotice[];
        error: unknown;
    };

export type ImportProviderProfilesHostResult =
    | {
        kind: 'success';
        notices: ConfigProfileCommandNotice[];
        execution: ImportProviderProfilesCommandResult;
    }
    | {
        kind: 'missing-file';
        notices: ConfigProfileCommandNotice[];
        error: MissingProviderProfileImportFileError;
    }
    | {
        kind: 'error';
        notices: ConfigProfileCommandNotice[];
        error: unknown;
    };

export interface ConfigProfileHostSuccessResult<TExecution> {
    kind: 'success';
    notices: ConfigProfileCommandNotice[];
    execution: TExecution;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function applyImportedProviderState(
    settings: NotemdSettings,
    execution: ImportProviderProfilesCommandResult
): void {
    settings.providers = execution.importedProviders;
    settings.activeProvider = execution.activeProvider;
}

export async function runExportProviderProfilesCommandWithHost(
    host: ConfigProfileCommandHost,
    executeCommandImpl: typeof executeExportProviderProfilesCommand = executeExportProviderProfilesCommand
): Promise<ExportProviderProfilesHostResult> {
    await host.loadSettings();
    const uiStrings = host.getUiStrings();

    try {
        const execution = await executeCommandImpl({
            pluginId: host.pluginId,
            providers: host.getSettings().providers,
            host: host.configHost
        });

        return {
            kind: 'success',
            notices: [
                {
                    message: formatI18n(uiStrings.settings.providerConfig.exportSuccess, {
                        path: execution.outputPath
                    })
                },
                {
                    message: uiStrings.settings.providerConfig.exportSensitiveWarning
                }
            ],
            execution
        };
    } catch (error: unknown) {
        host.logError('Error exporting provider settings:', error);
        return {
            kind: 'error',
            notices: [
                {
                    message: formatI18n(uiStrings.settings.providerConfig.exportError, {
                        message: getErrorMessage(error)
                    })
                }
            ],
            error
        };
    }
}

export async function runExportRedactedProviderProfilesCommandWithHost(
    host: ConfigProfileCommandHost,
    executeCommandImpl: typeof executeExportRedactedProviderProfilesCommand = executeExportRedactedProviderProfilesCommand
): Promise<ExportRedactedProviderProfilesHostResult> {
    await host.loadSettings();
    const uiStrings = host.getUiStrings();

    try {
        const execution = await executeCommandImpl({
            pluginId: host.pluginId,
            providers: host.getSettings().providers,
            host: host.configHost
        });

        return {
            kind: 'success',
            notices: [
                {
                    message: formatI18n(uiStrings.settings.providerConfig.exportRedactedSuccess, {
                        path: execution.outputPath
                    })
                }
            ],
            execution
        };
    } catch (error: unknown) {
        host.logError('Error exporting redacted provider settings:', error);
        return {
            kind: 'error',
            notices: [
                {
                    message: formatI18n(uiStrings.settings.providerConfig.exportError, {
                        message: getErrorMessage(error)
                    })
                }
            ],
            error
        };
    }
}

export async function runImportProviderProfilesCommandWithHost(
    host: ConfigProfileCommandHost,
    executeCommandImpl: typeof executeImportProviderProfilesCommand = executeImportProviderProfilesCommand
): Promise<ImportProviderProfilesHostResult> {
    await host.loadSettings();
    const uiStrings = host.getUiStrings();

    try {
        const settings = host.getSettings();
        const execution = await executeCommandImpl({
            pluginId: host.pluginId,
            existingProviders: settings.providers,
            activeProvider: settings.activeProvider,
            defaultActiveProvider: host.defaultActiveProvider,
            host: host.configHost
        });

        applyImportedProviderState(settings, execution);
        await host.saveSettings();

        const notices: ConfigProfileCommandNotice[] = [];
        if (execution.activeProviderReset) {
            notices.push({
                message: uiStrings.settings.providerConfig.activeProviderReset
            });
        }
        notices.push({
            message: formatI18n(uiStrings.settings.providerConfig.importSuccess, {
                newCount: execution.newCount,
                updatedCount: execution.updatedCount
            })
        });

        return {
            kind: 'success',
            notices,
            execution
        };
    } catch (error: unknown) {
        if (error instanceof MissingProviderProfileImportFileError) {
            return {
                kind: 'missing-file',
                notices: [
                    {
                        message: formatI18n(uiStrings.settings.providerConfig.importFileMissing, {
                            path: error.inputPath
                        })
                    }
                ],
                error
            };
        }

        host.logError('Error importing provider settings:', error);
        return {
            kind: 'error',
            notices: [
                {
                    message: formatI18n(uiStrings.settings.providerConfig.importError, {
                        message: getErrorMessage(error)
                    })
                }
            ],
            error
        };
    }
}

export async function runExportCliCapabilityManifestCommandWithHost(
    host: ConfigProfileCommandHost,
    executeCommandImpl: typeof executeExportCliCapabilityManifestCommand = executeExportCliCapabilityManifestCommand
): Promise<ConfigProfileHostSuccessResult<ExportCliCapabilityManifestCommandResult>> {
    await host.loadSettings();
    const uiStrings = host.getUiStrings();
    const execution = await executeCommandImpl({
        pluginId: host.pluginId,
        host: host.configHost
    });

    return {
        kind: 'success',
        notices: [
            {
                message: formatI18n(uiStrings.notices.cliCapabilityManifestExported, {
                    path: execution.outputPath
                })
            }
        ],
        execution
    };
}

export async function runExportCliInvocationContractCommandWithHost(
    host: ConfigProfileCommandHost,
    executeCommandImpl: typeof executeExportCliInvocationContractCommand = executeExportCliInvocationContractCommand
): Promise<ConfigProfileHostSuccessResult<ExportCliInvocationContractCommandResult>> {
    await host.loadSettings();
    const uiStrings = host.getUiStrings();
    const execution = await executeCommandImpl({
        pluginId: host.pluginId,
        host: host.configHost
    });

    return {
        kind: 'success',
        notices: [
            {
                message: formatI18n(uiStrings.notices.cliInvocationContractExported, {
                    path: execution.outputPath
                })
            }
        ],
        execution
    };
}

export async function runExportCliPublicSurfaceCommandWithHost(
    host: ConfigProfileCommandHost,
    executeCommandImpl: typeof executeExportCliPublicSurfaceCommand = executeExportCliPublicSurfaceCommand
): Promise<ConfigProfileHostSuccessResult<ExportCliPublicSurfaceCommandResult>> {
    await host.loadSettings();
    const uiStrings = host.getUiStrings();
    const execution = await executeCommandImpl({
        pluginId: host.pluginId,
        host: host.configHost
    });

    return {
        kind: 'success',
        notices: [
            {
                message: formatI18n(uiStrings.notices.cliPublicSurfaceExported, {
                    path: execution.outputPath
                })
            }
        ],
        execution
    };
}
