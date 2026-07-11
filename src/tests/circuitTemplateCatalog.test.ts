import * as fs from 'fs';
import * as path from 'path';
import { resolveCircuitTemplateFromMarkdown } from '../diagram/adapters/circuitikz/circuitTemplateCatalog';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const CIRCUIT_TEMPLATE_CASES = [
    {
        request: 'Draw a common-source NMOS amplifier.',
        fixture: 'common-source-nmos-v1.json'
    },
    {
        request: 'Draw a CMOS inverter.',
        fixture: 'cmos-inverter-v1.json'
    },
    {
        request: 'Draw a CMOS buffer.',
        fixture: 'cmos-buffer-v1.json'
    },
    {
        request: 'Draw a CMOS transmission gate.',
        fixture: 'cmos-transmission-gate-v1.json'
    },
    {
        request: 'Draw a two-input CMOS NAND gate.',
        fixture: 'cmos-nand2-v1.json'
    },
    {
        request: 'Draw a two-input CMOS NOR gate.',
        fixture: 'cmos-nor2-v1.json'
    }
] as const;

describe('circuit template catalog', () => {
    test.each(CIRCUIT_TEMPLATE_CASES)(
        'matches $fixture without drifting from the golden fixture',
        ({ request, fixture }) => {
            const fixturePath = path.join(
                PROJECT_ROOT,
                'docs',
                'maintainer',
                'fixtures',
                'circuitikz',
                fixture
            );
            const expected = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

            expect(resolveCircuitTemplateFromMarkdown(request)).toEqual(expected);
        }
    );

    test('recognizes the Chinese CMOS inverter request from the real-machine failure', () => {
        expect(resolveCircuitTemplateFromMarkdown('现在用 tikz 写一个 CMOS 反相器')).toEqual(
            expect.objectContaining({
                circuitKind: 'cmos-inverter',
                goldenReferenceId: 'cmos-inverter-v1'
            })
        );
    });

    test('returns null when no supported golden circuit family is named', () => {
        expect(resolveCircuitTemplateFromMarkdown('Draw an operational amplifier.')).toBeNull();
    });
});
