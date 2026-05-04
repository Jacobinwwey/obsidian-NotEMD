import {
    buildCliCapabilityManifest,
    getSidebarActionAutomationLevel,
    getSidebarActionRequiredContext,
    getSidebarActionSideEffectClass
} from '../workflowButtons';

describe('CLI capability manifest', () => {
    test('builds command capability entries for automation-facing surfaces', () => {
        const manifest = buildCliCapabilityManifest();
        const ids = manifest.commands.map(command => command.id);

        expect(ids).toContain('notemd:test-llm-connection');
        expect(ids).toContain('notemd:run-developer-provider-diagnostic');
        expect(ids).toContain('notemd:notemd-generate-diagram');
    });

    test('captures code-backed metadata for mapped sidebar actions', () => {
        const manifest = buildCliCapabilityManifest();
        const diagram = manifest.commands.find(command => command.id === 'notemd:notemd-generate-diagram');
        const diagnostic = manifest.commands.find(command => command.id === 'notemd:test-llm-connection');

        expect(diagram).toEqual(expect.objectContaining({
            automationLevel: getSidebarActionAutomationLevel('generate-experimental-diagram'),
            requiredContext: getSidebarActionRequiredContext('generate-experimental-diagram'),
            sideEffectClass: getSidebarActionSideEffectClass('generate-experimental-diagram')
        }));

        expect(diagnostic).toEqual(expect.objectContaining({
            automationLevel: getSidebarActionAutomationLevel('test-llm-connection'),
            requiredContext: getSidebarActionRequiredContext('test-llm-connection'),
            sideEffectClass: getSidebarActionSideEffectClass('test-llm-connection')
        }));
    });
});
