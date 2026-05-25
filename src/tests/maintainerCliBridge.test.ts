import { invokeMaintainerCliOperation } from '../maintainerCliBridge';

describe('maintainer CLI bridge', () => {
    test('dispatches redacted provider profile export', async () => {
        const host = {
            exportRedactedProviderProfilesCommand: jest.fn().mockResolvedValue({ outputPath: 'redacted.json' }),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        const result = await invokeMaintainerCliOperation(host as any, {
            operationId: 'provider.profile.export-redacted'
        });

        expect(host.exportRedactedProviderProfilesCommand).toHaveBeenCalled();
        expect(result).toEqual({ outputPath: 'redacted.json' });
    });

    test('dispatches CLI public surface export', async () => {
        const host = {
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn().mockResolvedValue({ outputPath: 'surface.json' })
        };

        const result = await invokeMaintainerCliOperation(host as any, {
            operationId: 'cli.public-surface.export',
            input: {}
        });

        expect(host.exportCliPublicSurfaceCommand).toHaveBeenCalled();
        expect(result).toEqual({ outputPath: 'surface.json' });
    });

    test('rejects unexpected input payloads', async () => {
        const host = {
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        await expect(invokeMaintainerCliOperation(host as any, {
            operationId: 'cli.capability-manifest.export',
            input: { extra: true }
        })).rejects.toThrow('do not accept input fields');
    });

    test('rejects positional input payloads', async () => {
        const host = {
            exportRedactedProviderProfilesCommand: jest.fn(),
            exportCliCapabilityManifestCommand: jest.fn(),
            exportCliInvocationContractCommand: jest.fn(),
            exportCliPublicSurfaceCommand: jest.fn()
        };

        await expect(invokeMaintainerCliOperation(host as any, {
            operationId: 'cli.invocation-contract.export',
            input: 'bad'
        })).rejects.toThrow('do not accept positional input payloads');
    });
});
