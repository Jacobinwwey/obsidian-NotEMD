import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

const requireScript = createRequire(__filename);
const { selectHomepageCopy } = requireScript('../../website/src/lib/homepageCopy.cjs');
const catalogSource = fs.readFileSync(path.join(__dirname, '../../website/src/lib/homeCopyCatalog.mjs'), 'utf8');
const catalog = new Function(catalogSource.replace('export const', 'const') + '\nreturn homeCopyOverrides;')();

describe('localized homepage publication boundary', () => {
    test('preserves a complete authored locale without English field substitution', () => {
        expect(selectHomepageCopy(catalog, 'it')).toEqual(catalog.it);
        expect(selectHomepageCopy(catalog, 'it').audienceHeading).toBe('Scegli il tuo percorso');
    });

    test('rejects a missing locale instead of publishing another language', () => {
        expect(() => selectHomepageCopy(catalog, 'untranslated')).toThrow(/untranslated.*missing/i);
    });

    test('rejects a missing localized section heading even when other fields exist', () => {
        const incomplete = { ...catalog.it };
        delete incomplete.audienceHeading;
        expect(() => selectHomepageCopy({ it: incomplete }, 'it')).toThrow(/it.*audienceHeading/);
    });

    test('rejects empty nested audience copy and missing discovery destinations', () => {
        const blankAudience = { ...catalog.it, sections: [{ ...catalog.it.sections[0], body: '   ' }] };
        expect(() => selectHomepageCopy({ it: blankAudience }, 'it')).toThrow(/it.*sections\[0\].body/);
        const missingLink = { ...catalog.it, retrievalLinks: [{ title: 'Indice', body: 'Guida' }] };
        expect(() => selectHomepageCopy({ it: missingLink }, 'it')).toThrow(/it.*retrievalLinks\[0\].href/);
    });
});
