import * as fs from 'fs';
import * as path from 'path';

const README_VARIANTS = fs.readdirSync(path.join(__dirname, '..', '..'))
    .filter(fileName => fileName === 'README.md' || /^README_.*\.md$/.test(fileName))
    .sort();

describe('readme locale fallback docs', () => {
    test.each(README_VARIANTS)('%s documents regional uiLocale fallback examples', (fileName) => {
        const readme = fs.readFileSync(path.join(__dirname, '..', '..', fileName), 'utf8');

        expect(readme).toContain('fr-CA');
        expect(readme).toContain('es-419');
        expect(readme).toContain('pt-PT');
        expect(readme).toContain('zh-Hans');
        expect(readme).toContain('zh-Hant-HK');
    });
});
