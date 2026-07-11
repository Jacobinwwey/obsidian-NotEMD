import * as fs from 'fs';
import * as path from 'path';

const stylesPath = path.join(__dirname, '..', '..', 'styles.css');

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
        expect(styles).toContain('.notemd-diagram-history-toolbar');
        expect(styles).toContain('.notemd-diagram-history-actions');
        expect(styles).toContain('@media (max-width: 720px)');
    });
});
