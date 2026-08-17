import { measureDrawnixText, wrapDrawnixText } from '../diagram/adapters/drawnix/drawnixTextLayout';

describe('Drawnix text layout primitives', () => {
    test('measures text deterministically across ASCII and wide characters', () => {
        expect(measureDrawnixText('A M')).toBe(29);
        expect(measureDrawnixText('图')).toBe(15);
        expect(measureDrawnixText('A M')).toBe(measureDrawnixText('A M'));
    });

    test('wraps words before splitting long words', () => {
        expect(wrapDrawnixText('alpha beta', 44)).toEqual(['alpha', 'beta']);
        expect(wrapDrawnixText('abcdefgh', 24)).toEqual(['abc', 'def', 'gh']);
    });

    test('keeps empty labels renderable', () => {
        expect(wrapDrawnixText('  ', 120)).toEqual(['Untitled']);
    });
});
