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
        expect(ids).toContain('notemd:export-provider-profiles');
        expect(ids).toContain('notemd:import-provider-profiles');
        expect(ids).toContain('notemd:export-cli-capability-manifest');
        expect(ids).toContain('notemd:export-cli-invocation-contract');
        expect(ids).toContain('notemd:create-wiki-link-and-generate-from-selection');
        expect(ids).toContain('notemd:process-with-notemd');
        expect(ids).toContain('notemd:process-folder-with-notemd');
        expect(ids).toContain('notemd:generate-content-from-title');
        expect(ids).toContain('notemd:batch-generate-content-from-titles');
        expect(ids).toContain('notemd:research-and-summarize-topic');
        expect(ids).toContain('notemd:translate-file');
        expect(ids).toContain('notemd:batch-translate-folder');
        expect(ids).toContain('notemd:extract-concepts-from-current-file');
        expect(ids).toContain('notemd:batch-extract-concepts-from-folder');
        expect(ids).toContain('notemd:extract-original-text');
        expect(ids).toContain('notemd:extract-concepts-and-generate-titles');
        expect(ids).toContain('notemd:check-for-duplicates');
        expect(ids).toContain('notemd:check-and-remove-duplicate-concept-notes');
        expect(ids).toContain('notemd:batch-mermaid-fix');
        expect(ids).toContain('notemd:fix-formula-formats');
        expect(ids).toContain('notemd:batch-fix-formula-formats');
    });

    test('captures code-backed metadata for mapped sidebar actions', () => {
        const manifest = buildCliCapabilityManifest();
        const diagram = manifest.commands.find(command => command.id === 'notemd:notemd-generate-diagram');
        const diagramPreview = manifest.commands.find(command => command.id === 'notemd:notemd-preview-diagram');
        const diagnostic = manifest.commands.find(command => command.id === 'notemd:test-llm-connection');
        const mermaid = manifest.commands.find(command => command.id === 'notemd:notemd-summarize-as-mermaid');
        const providerProfileExport = manifest.commands.find(command => command.id === 'notemd:export-provider-profiles');
        const providerProfileImport = manifest.commands.find(command => command.id === 'notemd:import-provider-profiles');
        const cliCapabilityExport = manifest.commands.find(command => command.id === 'notemd:export-cli-capability-manifest');
        const cliContractExport = manifest.commands.find(command => command.id === 'notemd:export-cli-invocation-contract');
        const createWikiAndGenerate = manifest.commands.find(command => command.id === 'notemd:create-wiki-link-and-generate-from-selection');
        const translateFile = manifest.commands.find(command => command.id === 'notemd:translate-file');
        const processCurrent = manifest.commands.find(command => command.id === 'notemd:process-with-notemd');
        const processFolder = manifest.commands.find(command => command.id === 'notemd:process-folder-with-notemd');
        const generateFromTitle = manifest.commands.find(command => command.id === 'notemd:generate-content-from-title');
        const batchGenerate = manifest.commands.find(command => command.id === 'notemd:batch-generate-content-from-titles');
        const researchSummarize = manifest.commands.find(command => command.id === 'notemd:research-and-summarize-topic');
        const batchTranslate = manifest.commands.find(command => command.id === 'notemd:batch-translate-folder');
        const extractCurrent = manifest.commands.find(command => command.id === 'notemd:extract-concepts-from-current-file');
        const extractFolder = manifest.commands.find(command => command.id === 'notemd:batch-extract-concepts-from-folder');
        const extractOriginal = manifest.commands.find(command => command.id === 'notemd:extract-original-text');
        const extractAndGenerate = manifest.commands.find(command => command.id === 'notemd:extract-concepts-and-generate-titles');
        const checkDuplicates = manifest.commands.find(command => command.id === 'notemd:check-for-duplicates');
        const dedupeConcepts = manifest.commands.find(command => command.id === 'notemd:check-and-remove-duplicate-concept-notes');
        const batchMermaidFix = manifest.commands.find(command => command.id === 'notemd:batch-mermaid-fix');
        const fixFormulaFile = manifest.commands.find(command => command.id === 'notemd:fix-formula-formats');
        const batchFixFormula = manifest.commands.find(command => command.id === 'notemd:batch-fix-formula-formats');

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
            operationId: 'provider.connection.test',
            mappingKind: 'exact',
            automationLevel: getSidebarActionAutomationLevel('test-llm-connection'),
            requiredContext: getSidebarActionRequiredContext('test-llm-connection'),
            sideEffectClass: getSidebarActionSideEffectClass('test-llm-connection')
        }));

        expect(diagramPreview).toEqual(expect.objectContaining({
            operationId: 'diagram.preview',
            automationLevel: getSidebarActionAutomationLevel('preview-experimental-diagram'),
            requiredContext: getSidebarActionRequiredContext('preview-experimental-diagram'),
            sideEffectClass: getSidebarActionSideEffectClass('preview-experimental-diagram'),
            mappingKind: 'exact'
        }));

        expect(providerProfileExport).toEqual(expect.objectContaining({
            operationId: 'provider.profile.export',
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            mappingKind: 'exact'
        }));

        expect(providerProfileImport).toEqual(expect.objectContaining({
            operationId: 'provider.profile.import',
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            mappingKind: 'exact'
        }));

        expect(cliCapabilityExport).toEqual(expect.objectContaining({
            operationId: 'cli.capability-manifest.export',
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            mappingKind: 'exact'
        }));

        expect(cliContractExport).toEqual(expect.objectContaining({
            operationId: 'cli.invocation-contract.export',
            automationLevel: 'safe',
            requiredContext: 'none',
            sideEffectClass: 'write-file',
            mappingKind: 'exact'
        }));

        expect(createWikiAndGenerate).toEqual(expect.objectContaining({
            operationId: 'editor.create-link-and-generate',
            automationLevel: 'requires-selection',
            requiredContext: 'editor-selection',
            sideEffectClass: 'write-file',
            mappingKind: 'exact'
        }));

        expect(processCurrent).toEqual(expect.objectContaining({
            operationId: 'file.process-add-links',
            automationLevel: getSidebarActionAutomationLevel('process-current-add-links'),
            requiredContext: getSidebarActionRequiredContext('process-current-add-links'),
            sideEffectClass: getSidebarActionSideEffectClass('process-current-add-links'),
            mappingKind: 'exact'
        }));

        expect(processFolder).toEqual(expect.objectContaining({
            operationId: 'file.process-folder-add-links',
            automationLevel: getSidebarActionAutomationLevel('process-folder-add-links'),
            requiredContext: getSidebarActionRequiredContext('process-folder-add-links'),
            sideEffectClass: getSidebarActionSideEffectClass('process-folder-add-links'),
            mappingKind: 'exact'
        }));

        expect(generateFromTitle).toEqual(expect.objectContaining({
            operationId: 'content.generate-from-title',
            automationLevel: getSidebarActionAutomationLevel('generate-from-title'),
            requiredContext: getSidebarActionRequiredContext('generate-from-title'),
            sideEffectClass: getSidebarActionSideEffectClass('generate-from-title'),
            mappingKind: 'exact'
        }));

        expect(batchGenerate).toEqual(expect.objectContaining({
            operationId: 'content.batch-generate-from-titles',
            automationLevel: getSidebarActionAutomationLevel('batch-generate-from-titles'),
            requiredContext: getSidebarActionRequiredContext('batch-generate-from-titles'),
            sideEffectClass: getSidebarActionSideEffectClass('batch-generate-from-titles'),
            mappingKind: 'exact'
        }));

        expect(researchSummarize).toEqual(expect.objectContaining({
            operationId: 'research.summarize-topic',
            automationLevel: getSidebarActionAutomationLevel('research-and-summarize'),
            requiredContext: getSidebarActionRequiredContext('research-and-summarize'),
            sideEffectClass: getSidebarActionSideEffectClass('research-and-summarize'),
            mappingKind: 'exact'
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

        expect(checkDuplicates).toEqual(expect.objectContaining({
            operationId: 'duplicate.check-file',
            automationLevel: getSidebarActionAutomationLevel('check-duplicates-current'),
            requiredContext: getSidebarActionRequiredContext('check-duplicates-current'),
            sideEffectClass: getSidebarActionSideEffectClass('check-duplicates-current'),
            mappingKind: 'exact'
        }));

        expect(dedupeConcepts).toEqual(expect.objectContaining({
            operationId: 'concept.dedupe',
            automationLevel: getSidebarActionAutomationLevel('check-remove-duplicate-concepts'),
            requiredContext: getSidebarActionRequiredContext('check-remove-duplicate-concepts'),
            sideEffectClass: getSidebarActionSideEffectClass('check-remove-duplicate-concepts'),
            mappingKind: 'exact'
        }));

        expect(batchMermaidFix).toEqual(expect.objectContaining({
            operationId: 'mermaid.batch-fix',
            automationLevel: getSidebarActionAutomationLevel('batch-mermaid-fix'),
            requiredContext: getSidebarActionRequiredContext('batch-mermaid-fix'),
            sideEffectClass: getSidebarActionSideEffectClass('batch-mermaid-fix'),
            mappingKind: 'exact'
        }));

        expect(fixFormulaFile).toEqual(expect.objectContaining({
            operationId: 'formula.fix-file',
            automationLevel: getSidebarActionAutomationLevel('fix-formula-current'),
            requiredContext: getSidebarActionRequiredContext('fix-formula-current'),
            sideEffectClass: getSidebarActionSideEffectClass('fix-formula-current'),
            mappingKind: 'exact'
        }));

        expect(batchFixFormula).toEqual(expect.objectContaining({
            operationId: 'formula.batch-fix',
            automationLevel: getSidebarActionAutomationLevel('batch-fix-formula'),
            requiredContext: getSidebarActionRequiredContext('batch-fix-formula'),
            sideEffectClass: getSidebarActionSideEffectClass('batch-fix-formula'),
            mappingKind: 'exact'
        }));
    });
});
