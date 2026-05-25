import { execFileSync } from 'child_process';
import * as path from 'path';

const { OPERATION_HELP } = require('../../scripts/lib/maintainer-cli-operation-help.js');
type MaintainerOperationHelp = Record<string, {
    summary: string;
    required: string[];
    optional: string[];
}>;

describe('invoke maintainer CLI operation script', () => {
    test('prints a simplified maintainer help surface with core commands and operation summaries', () => {
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'invoke-maintainer-cli-operation.js');
        const output = execFileSync(process.execPath, [scriptPath, '--help'], {
            encoding: 'utf8'
        });

        expect(output).toContain('Notemd maintainer CLI helper');
        expect(output).toContain('npm run cli:help');
        expect(output).toContain('npm run cli:invoke -- --vault <vault> --operation <operation-id> [--pretty]');

        for (const [operationId, details] of Object.entries(OPERATION_HELP as MaintainerOperationHelp)) {
            expect(output).toContain(operationId);
            expect(output).toContain(details.summary);
        }

        expect(output).toContain('Current helper scope is export-only and accepts no input payload.');
        expect(output).toContain('maintainer-grade repo tooling');
    });
});
