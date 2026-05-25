import { buildCliPublicSurface } from '../operations/publicCliSurface';

describe('CLI public surface', () => {
    test('exports only bounded no-input official CLI commands with self-contained contracts', () => {
        const surface = buildCliPublicSurface();
        const ids = surface.commands.map(command => command.id);
        const providerProfileRedactedExport = surface.commands.find(command => command.id === 'notemd:export-provider-profiles-redacted');
        const cliCapabilityExport = surface.commands.find(command => command.id === 'notemd:export-cli-capability-manifest');
        const cliContractExport = surface.commands.find(command => command.id === 'notemd:export-cli-invocation-contract');
        const cliPublicSurfaceExport = surface.commands.find(command => command.id === 'notemd:export-cli-public-surface');

        expect(surface.version).toBe(1);
        expect(ids).toEqual(expect.arrayContaining([
            'notemd:export-provider-profiles-redacted',
            'notemd:export-cli-capability-manifest',
            'notemd:export-cli-invocation-contract',
            'notemd:export-cli-public-surface'
        ]));
        expect(ids).toHaveLength(4);
        expect(ids).not.toContain('notemd:export-provider-profiles');
        expect(ids).not.toContain('notemd:import-provider-profiles');
        expect(ids).not.toContain('notemd:test-llm-connection');
        expect(ids).not.toContain('notemd:run-developer-provider-diagnostic');

        expect(providerProfileRedactedExport).toEqual(expect.objectContaining({
            operationId: 'provider.profile.export-redacted',
            commandExample: 'obsidian command id=notemd:export-provider-profiles-redacted',
            automationLevel: 'safe',
            requiredContext: 'none',
            mappingKind: 'exact',
            inputSchema: expect.objectContaining({
                type: 'object',
                properties: {}
            }),
            resultSchema: expect.objectContaining({
                type: 'object',
                properties: expect.objectContaining({
                    outputPath: expect.any(Object),
                    profile: expect.any(Object)
                })
            })
        }));
        expect(providerProfileRedactedExport?.outputHandlingTags).toBeUndefined();

        expect(cliCapabilityExport).toEqual(expect.objectContaining({
            operationId: 'cli.capability-manifest.export',
            commandExample: 'obsidian command id=notemd:export-cli-capability-manifest'
        }));

        expect(cliContractExport).toEqual(expect.objectContaining({
            operationId: 'cli.invocation-contract.export',
            commandExample: 'obsidian command id=notemd:export-cli-invocation-contract'
        }));

        expect(cliPublicSurfaceExport).toEqual(expect.objectContaining({
            operationId: 'cli.public-surface.export',
            commandExample: 'obsidian command id=notemd:export-cli-public-surface'
        }));
    });
});
