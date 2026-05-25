import {
    ExportCliCapabilityManifestCommandResult,
    ExportCliInvocationContractCommandResult,
    ExportCliPublicSurfaceCommandResult,
    ExportRedactedProviderProfilesCommandResult
} from './operations/configProfileCommands';

export type MaintainerCliOperationId =
    | 'provider.profile.export-redacted'
    | 'cli.capability-manifest.export'
    | 'cli.invocation-contract.export'
    | 'cli.public-surface.export';

export interface MaintainerCliOperationRequest {
    operationId: MaintainerCliOperationId;
    input?: unknown;
}

export type MaintainerCliOperationResult =
    | ExportRedactedProviderProfilesCommandResult
    | ExportCliCapabilityManifestCommandResult
    | ExportCliInvocationContractCommandResult
    | ExportCliPublicSurfaceCommandResult
    | null;

export interface MaintainerCliBridgeHost {
    exportRedactedProviderProfilesCommand: () => Promise<ExportRedactedProviderProfilesCommandResult | null>;
    exportCliCapabilityManifestCommand: () => Promise<ExportCliCapabilityManifestCommandResult | null>;
    exportCliInvocationContractCommand: () => Promise<ExportCliInvocationContractCommandResult | null>;
    exportCliPublicSurfaceCommand: () => Promise<ExportCliPublicSurfaceCommandResult | null>;
}

function assertNoInput(input: unknown): void {
    if (input == null) {
        return;
    }

    if (typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Maintainer CLI export operations do not accept positional input payloads.');
    }

    if (Object.keys(input as Record<string, unknown>).length > 0) {
        throw new Error('Maintainer CLI export operations do not accept input fields.');
    }
}

export async function invokeMaintainerCliOperation(
    host: MaintainerCliBridgeHost,
    request: MaintainerCliOperationRequest
): Promise<MaintainerCliOperationResult> {
    assertNoInput(request.input);

    switch (request.operationId) {
        case 'provider.profile.export-redacted':
            return host.exportRedactedProviderProfilesCommand();
        case 'cli.capability-manifest.export':
            return host.exportCliCapabilityManifestCommand();
        case 'cli.invocation-contract.export':
            return host.exportCliInvocationContractCommand();
        case 'cli.public-surface.export':
            return host.exportCliPublicSurfaceCommand();
        default: {
            const exhaustiveCheck: never = request.operationId;
            throw new Error(`Unsupported maintainer CLI operation: ${exhaustiveCheck}`);
        }
    }
}
