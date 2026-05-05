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
        expect(ids).toContain('notemd:translate-file');
        expect(ids).toContain('notemd:batch-translate-folder');
        expect(ids).toContain('notemd:extract-concepts-from-current-file');
        expect(ids).toContain('notemd:batch-extract-concepts-from-folder');
        expect(ids).toContain('notemd:extract-original-text');
        expect(ids).toContain('notemd:extract-concepts-and-generate-titles');
    });

    test('captures code-backed metadata for mapped sidebar actions', () => {
        const manifest = buildCliCapabilityManifest();
        const diagram = manifest.commands.find(command => command.id === 'notemd:notemd-generate-diagram');
        const diagnostic = manifest.commands.find(command => command.id === 'notemd:test-llm-connection');
        const mermaid = manifest.commands.find(command => command.id === 'notemd:notemd-summarize-as-mermaid');
        const translateFile = manifest.commands.find(command => command.id === 'notemd:translate-file');
        const batchTranslate = manifest.commands.find(command => command.id === 'notemd:batch-translate-folder');
        const extractCurrent = manifest.commands.find(command => command.id === 'notemd:extract-concepts-from-current-file');
        const extractFolder = manifest.commands.find(command => command.id === 'notemd:batch-extract-concepts-from-folder');
        const extractOriginal = manifest.commands.find(command => command.id === 'notemd:extract-original-text');
        const extractAndGenerate = manifest.commands.find(command => command.id === 'notemd:extract-concepts-and-generate-titles');

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

        expect(translateFile).toEqual(expect.objectContaining({
            operationId: 'translate.file',
            automationLevel: getSidebarActionAutomationLevel('translate-current-file'),
            requiredContext: getSidebarActionRequiredContext('translate-current-file'),
            sideEffectClass: getSidebarActionSideEffectClass('translate-current-file'),
            mappingKind: 'exact'
        }));

        expect(batchTranslate).toEqual(expect.objectContaining({
            operationId: 'translate.folder-batch',
            automationLevel: getSidebarActionAutomationLevel('batch-translate-folder'),
            requiredContext: getSidebarActionRequiredContext('batch-translate-folder'),
            sideEffectClass: getSidebarActionSideEffectClass('batch-translate-folder'),
            mappingKind: 'exact'
        }));

        expect(extractCurrent).toEqual(expect.objectContaining({
            operationId: 'concept.extract-file',
            automationLevel: getSidebarActionAutomationLevel('extract-concepts-current'),
            requiredContext: getSidebarActionRequiredContext('extract-concepts-current'),
            sideEffectClass: getSidebarActionSideEffectClass('extract-concepts-current'),
            mappingKind: 'exact'
        }));

        expect(extractFolder).toEqual(expect.objectContaining({
            operationId: 'concept.extract-folder',
            automationLevel: getSidebarActionAutomationLevel('extract-concepts-folder'),
            requiredContext: getSidebarActionRequiredContext('extract-concepts-folder'),
            sideEffectClass: getSidebarActionSideEffectClass('extract-concepts-folder'),
            mappingKind: 'exact'
        }));

        expect(extractOriginal).toEqual(expect.objectContaining({
            operationId: 'content.extract-original-text',
            automationLevel: getSidebarActionAutomationLevel('extract-original-text'),
            requiredContext: getSidebarActionRequiredContext('extract-original-text'),
            sideEffectClass: getSidebarActionSideEffectClass('extract-original-text'),
            mappingKind: 'exact'
        }));

        expect(extractAndGenerate).toEqual(expect.objectContaining({
            operationId: 'workflow.extract-and-generate',
            automationLevel: 'requires-active-file',
            requiredContext: 'active-file',
            sideEffectClass: 'batch-write',
            mappingKind: 'exact'
        }));
    });
});
