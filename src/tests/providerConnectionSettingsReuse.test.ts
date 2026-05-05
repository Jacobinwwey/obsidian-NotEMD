import * as fs from 'fs';
import * as path from 'path';

const settingsTabPath = path.join(__dirname, '..', 'ui', 'NotemdSettingTab.ts');

describe('settings provider connection reuse', () => {
    test('routes settings-tab provider connection checks through shared host adapter instead of direct testAPI calls', () => {
        const source = fs.readFileSync(settingsTabPath, 'utf8');

        expect(source).toContain('runProviderConnectionTestWithHost');
        expect(source).not.toContain("import { testAPI } from '../llmUtils'");
        expect(source).toContain('hasBlockingProviderValidationIssues');
    });
});
