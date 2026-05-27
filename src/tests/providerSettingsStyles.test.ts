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
        expect(styles).toContain('.notemd-provider-model-item code');
    });
});
