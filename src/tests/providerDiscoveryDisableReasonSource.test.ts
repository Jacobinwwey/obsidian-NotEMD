import * as fs from 'fs';
import * as path from 'path';

describe('provider discovery disable reason source', () => {
    const settingsTabPath = path.join(__dirname, '..', 'ui', 'NotemdSettingTab.ts');

    test('settings tab resolves unavailable discovery reasons through localized reason keys', () => {
        const source = fs.readFileSync(settingsTabPath, 'utf8');

        expect(source).toContain('discovery.disableReasonKey');
        expect(source).toContain('providerI18n.fetchModelsUnavailableReasons');
        expect(source).not.toContain('discovery.disableReason ??');
    });
});
