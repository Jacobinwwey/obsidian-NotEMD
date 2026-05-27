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

    test('renders provider settings through shared metadata/discovery helpers instead of provider-name-only field branching', () => {
        const source = fs.readFileSync(settingsTabPath, 'utf8');

        expect(source).toContain('getProviderSettingFields');
        expect(source).toContain('hasPersistedAdvancedProviderSettings');
        expect(source).toContain('discoverProviderModels');
        expect(source).toContain('advancedSettingsName');
        expect(source).toContain('fetchModelsName');
    });

    test('collapses discovered-models panel and emits apply feedback when a discovered model is selected', () => {
        const source = fs.readFileSync(settingsTabPath, 'utf8');

        expect(source).toContain('discoveredModelsExpanded');
        expect(source).toContain('detailsEl.addEventListener(\'toggle\'');
        expect(source).toContain('providerI18n.discoveredModelsApplied');
        expect(source).toContain('panelState.discoveredModelsExpanded = false;');
        expect(source).toContain('providerI18n.discoveredModelsSummaryWithCurrent');
    });
});
