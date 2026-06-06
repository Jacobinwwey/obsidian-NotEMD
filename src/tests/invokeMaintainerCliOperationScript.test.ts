import { execFileSync } from 'child_process';
import * as path from 'path';

const { OPERATION_HELP } = require('../../scripts/lib/maintainer-cli-operation-help.js');
type MaintainerOperationHelp = Record<string, {
    summary: string;
    required: string[];
    optional: string[];
    exampleInput?: string;
    additionalExamples?: string[];
}>;

describe('invoke maintainer CLI operation script', () => {
    test('prints a simplified maintainer help surface with core commands, inputs, and operation summaries', () => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'invoke-maintainer-cli-operation.js');
        const output = execFileSync(process.execPath, [scriptPath, '--help'], {
            encoding: 'utf8'
        });

        expect(output).toContain('Notemd maintainer CLI helper');
        expect(output).toContain('npm run cli:help');
        expect(output).toContain('npm run cli:invoke -- --vault <vault> --operation <operation-id> [--input-file <path> | --input-json');
        expect(output).toContain('Prefer --input-file for non-trivial payloads.');

        for (const [operationId, details] of Object.entries(OPERATION_HELP as MaintainerOperationHelp)) {
            expect(output).toContain(operationId);
            expect(output).toContain(details.summary);
            expect(output).toContain(`required: ${details.required.join(', ')}`);
            if (details.optional.length > 0) {
                expect(output).toContain(`optional: ${details.optional.join(', ')}`);
            }
            if (details.exampleInput) {
                expect(output).toContain(`example input: ${details.exampleInput}`);
            }
            for (const additionalExample of details.additionalExamples || []) {
                expect(output).toContain(additionalExample);
            }
        }

        expect(output).toContain('content.batch-generate-from-titles');
        expect(output).toContain('"includeSubfoldersMode":"exclude"');
        expect(output).toContain('local-knowledge.inspect');
        expect(output).toContain('"taskScope":"diagramGeneration"');
        expect(output).toContain('"taskScope":"batchGenerateFromTitles"');
        expect(output).toContain('"taskScope":"researchSummarize"');
        expect(output).toContain('knowledgePaths');
        expect(output).toContain('npm run cli:invoke -- --vault docs --operation local-knowledge.inspect');
        expect(output).toContain('"sourcePath":"index.zh-CN.md"');
        expect(output).toContain('"knowledgePaths":["maintainer","superpowers"]');
        expect(output).toContain('Paths inside --input-json are vault-relative.');
        expect(output).toContain('research.summarize-topic');
        expect(output).toContain('"topic":"RAG quality audit"');
        expect(output).toContain('diagram.generate');
        expect(output).toContain('"requestedIntent":"erDiagram"');
        expect(output).toContain('Maintainer bridge only; not a public CLI surface.');
    });
});
