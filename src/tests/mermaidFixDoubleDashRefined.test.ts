import { deepDebugMermaid } from '../mermaidProcessor';

describe('Mermaid Fix Double Dash Refined', () => {

    test('Should NOT convert --- to -->', () => {
        const input = 'A --- B;';
        const expected = 'A --- B;';
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should convert -- to -->', () => {
        const input = 'A -- B;';
        const expected = 'A --> B;';
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should convert -- "Label" -- to -- "Label" -->', () => {
        // This case assumes A -- "Label" -- B;
        // The fixDoubleDashToArrow handles the LAST --.
        // So A -- "Label" -- B; -> A -- "Label" --> B;
        const input = 'A -- "Label" -- B;';
        const expected = 'A -- "Label" --> B;';
        expect(deepDebugMermaid(input)).toBe(expected);
    });

    test('Should NOT convert --- "Label" ---', () => {
        // If such syntax exists or matches pattern
        const input = 'A --- "Label" --- B;';
        expect(deepDebugMermaid(input)).toBe(input);
    });

});
