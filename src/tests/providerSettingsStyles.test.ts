import * as fs from 'fs';
import * as path from 'path';

const stylesPath = path.join(__dirname, '..', '..', 'styles.css');
const settingTabPath = path.join(__dirname, '..', 'ui', 'NotemdSettingTab.ts');

function readRule(styles: string, selector: string): string {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
    return match?.[1] ?? '';
}

describe('provider settings styles', () => {
    test('styles ship dedicated selectors for advanced provider settings and discovered model rows', () => {
        const styles = fs.readFileSync(stylesPath, 'utf8');

        expect(styles).toContain('.notemd-provider-advanced-settings');
        expect(styles).toContain('.notemd-provider-discovery-panel');
        expect(styles).toContain('.notemd-provider-discovery-summary');
        expect(styles).toContain('.notemd-provider-model-list');
        expect(styles).toContain('.notemd-provider-model-item');
        expect(styles).toContain('.notemd-provider-model-item.is-current');
        expect(styles).toContain('.notemd-provider-model-copy');
        expect(styles).toContain('.notemd-provider-model-meta');
        expect(styles).toContain('.notemd-provider-model-item code');
    });

    test('styles preserve sidebar footer scroll and API observability selectors', () => {
        const styles = fs.readFileSync(stylesPath, 'utf8');

        expect(styles).toContain('.notemd-sidebar-footer-scroll');
        expect(styles).toContain('overflow-y: auto;');
        expect(styles).toContain('.notemd-api-liveness');
        expect(styles).toContain('.notemd-api-liveness-dot');
        expect(styles).toContain('.notemd-api-activity');
        expect(styles).toContain('.notemd-api-activity-content');
        expect(styles).toContain('.notemd-api-activity-item-header');
        expect(styles).toContain('.notemd-api-activity-toggle-button');
        expect(styles).toContain('.notemd-copy-api-activity-button');
        expect(styles).toContain('.notemd-log-header-actions');
        expect(styles).toContain('.notemd-debug-toggle');
        expect(styles).toContain('.notemd-debug-toggle-input');
    });

    test('settings discovery and history controls provide keyboard focus and usable targets', () => {
        const styles = fs.readFileSync(stylesPath, 'utf8');

        expect(styles).toContain('.notemd-settings-discovery button:focus-visible');
        expect(styles).toContain('.notemd-setting-favorite-button { min-width: 44px; min-height: 44px;');
        expect(styles).toContain('.notemd-settings-search, .notemd-settings-category-navigation, .notemd-settings-favorites-filter { min-height: 44px; }');
        expect(styles).toContain('.notemd-diagram-history-toolbar');
        expect(styles).toContain('.notemd-diagram-history-actions');
        expect(styles).toContain('.notemd-settings-result-count');
        expect(styles).toContain('.notemd-settings-empty-state');
        expect(styles).toContain('.notemd-settings-search-results');
        expect(styles).toContain('.notemd-settings-favorites-panel');
        expect(styles).toContain('.notemd-settings-favorites-content');
        expect(styles).toContain('.notemd-settings-favorite-result');
        expect(styles).toContain('.notemd-settings-favorite-remove');
        expect(styles).toContain('.notemd-settings-search-result[aria-selected="true"]');
        expect(styles).toContain('.notemd-settings-discovery-toggle');
        expect(styles).toContain('.notemd-settings-discovery-controls');
        expect(styles).toContain('.notemd-settings-discovery.is-collapsed .notemd-settings-discovery-controls');
        const collapsedRule = readRule(styles, '.notemd-settings-discovery.is-collapsed');
        const collapsedToggleRule = readRule(styles, '.notemd-settings-discovery.is-collapsed .notemd-settings-discovery-toggle');
        expect(collapsedRule).toMatch(/position:\s*sticky\s*;/);
        expect(collapsedRule).toMatch(/width:\s*100%\s*;/);
        expect(collapsedRule).toMatch(/height:\s*0\s*;/);
        expect(collapsedRule).toMatch(/pointer-events:\s*none\s*;/);
        expect(collapsedToggleRule).toMatch(/position:\s*absolute\s*;/);
        expect(collapsedToggleRule).toMatch(/pointer-events:\s*auto\s*;/);
        expect(styles).toContain('.notemd-setting-search-target');
        expect(styles).toContain('@media (max-width: 720px)');
    });

    test('search result copy uses explicit grid areas so long descriptions cannot collapse names', () => {
        const styles = fs.readFileSync(stylesPath, 'utf8');
        const resultRule = readRule(styles, '.notemd-settings-search-result');
        const nameRule = readRule(styles, '.notemd-settings-search-result-name');
        const descriptionRule = readRule(styles, '.notemd-settings-search-result-description');
        const categoryRule = readRule(styles, '.notemd-settings-search-result-category');

        expect(resultRule).toMatch(/grid-template-areas:\s*['"]name category['"]\s*['"]description category['"]/);
        expect(resultRule).toMatch(/min-height:\s*44px\s*;/);
        expect(nameRule).toMatch(/grid-area:\s*name\s*;/);
        expect(descriptionRule).toMatch(/grid-area:\s*description\s*;/);
        expect(categoryRule).toMatch(/grid-area:\s*category\s*;/);
    });

    test('diagram history drawer constrains the grid item and contains its scroll region', () => {
        const styles = fs.readFileSync(stylesPath, 'utf8');
        const drawerRule = readRule(styles, '.notemd-diagram-history-drawer');
        const bodyRule = readRule(styles, '.notemd-diagram-history-drawer-body');

        expect(drawerRule).toMatch(/min-height:\s*0\s*;/);
        expect(bodyRule).toMatch(/min-height:\s*0\s*;/);
        expect(bodyRule).toMatch(/overflow:\s*auto\s*;/);
        expect(bodyRule).toMatch(/overscroll-behavior:\s*contain\s*;/);
    });

    test('settings categories use one progressive selector instead of parallel heading buttons', () => {
        const source = fs.readFileSync(settingTabPath, 'utf8');

        expect(source).toContain("discoveryControls.createEl('select', { cls: 'notemd-settings-category-navigation' })");
        expect(source).not.toContain("navigation.createEl('button', { text: label })");
    });
});
