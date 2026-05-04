import {
    getSidebarActionAutomationLevel,
    getSidebarActionRequiredContext,
    getSidebarActionSideEffectClass
} from '../workflowButtons';
import { buildCliCapabilityManifest } from '../operations/capabilityManifest';

describe('CLI capability manifest', () => {
    test('builds command capability entries for automation-facing surfaces', () => {
        const manifest = buildCliCapabilityManifest();
        const ids = manifest.commands.map(command => command.id);

        expect(ids).toContain('notemd:test-llm-connection');
        expect(ids).toContain('notemd:run-developer-provider-diagnostic');
        expect(ids).toContain('notemd:notemd-generate-diagram');
        expect(ids).toContain('notemd:notemd-summarize-as-mermaid');
    });

    test('captures code-backed metadata for mapped sidebar actions', () => {
        const manifest = buildCliCapabilityManifest();
        const diagram = manifest.commands.find(command => command.id === 'notemd:notemd-generate-diagram');
        const diagnostic = manifest.commands.find(command => command.id === 'notemd:test-llm-connection');
        const mermaid = manifest.commands.find(command => command.id === 'notemd:notemd-summarize-as-mermaid');

        expect(diagram).toEqual(expect.objectContaining({
            operationId: 'diagram.generate',
            automationLevel: getSidebarActionAutomationLevel('generate-experimental-diagram'),
            requiredContext: getSidebarActionRequiredContext('generate-experimental-diagram'),
            sideEffectClass: getSidebarActionSideEffectClass('generate-experimental-diagram')
        }));

        expect(mermaid).toEqual(expect.objectContaining({
            operationId: 'diagram.generate',
            automationLevel: getSidebarActionAutomationLevel('summarize-as-mermaid'),
            requiredContext: getSidebarActionRequiredContext('summarize-as-mermaid'),
            sideEffectClass: getSidebarActionSideEffectClass('summarize-as-mermaid'),
            mappingKind: 'exact',
            defaultInput: expect.objectContaining({ outputMode: 'mermaid' })
        }));

        expect(diagnostic).toEqual(expect.objectContaining({
            mappingKind: 'future-target',
            automationLevel: getSidebarActionAutomationLevel('test-llm-connection'),
            requiredContext: getSidebarActionRequiredContext('test-llm-connection'),
            sideEffectClass: getSidebarActionSideEffectClass('test-llm-connection')
        }));
    });
});
