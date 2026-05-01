import { buildDiagramSpecPrompt } from '../diagram/prompts/diagramSpecPrompt';

describe('diagram spec prompt builder', () => {
    test('builds a spec-first prompt instead of direct mermaid output instructions', () => {
        const prompt = buildDiagramSpecPrompt();

        expect(prompt).toMatch(/json/i);
        expect(prompt).toMatch(/DiagramSpec/i);
        expect(prompt).toMatch(/Do not output Mermaid/i);
    });

    test('includes preferred intent and target language guidance when provided', () => {
        const prompt = buildDiagramSpecPrompt({
            preferredIntent: 'flowchart',
            targetLanguage: 'Japanese'
        });

        expect(prompt).toMatch(/flowchart/i);
        expect(prompt).toMatch(/Japanese/i);
    });

    test('includes preferred chart type guidance when provided', () => {
        const prompt = buildDiagramSpecPrompt({
            preferredIntent: 'dataChart',
            preferredChartType: 'line'
        });

        expect(prompt).toMatch(/Preferred chart template: line/i);
    });

    test('documents the controlled data chart templates for layout hints', () => {
        const prompt = buildDiagramSpecPrompt();

        expect(prompt).toMatch(/layoutHints\.chartType/i);
        expect(prompt).toMatch(/scatter/i);
        expect(prompt).toMatch(/pie/i);
        expect(prompt).toMatch(/table/i);
    });

    test('requires explicit series metadata for data charts', () => {
        const prompt = buildDiagramSpecPrompt();

        expect(prompt).toMatch(/dataSeries\[\]\.id/i);
        expect(prompt).toMatch(/dataSeries\[\]\.label/i);
        expect(prompt).toMatch(/points\[\]\.x/i);
        expect(prompt).toMatch(/points\[\]\.y/i);
    });

    test('requires non-chart fallback when reliable numeric data is missing', () => {
        const prompt = buildDiagramSpecPrompt();

        expect(prompt).toMatch(/choose a non-dataChart intent/i);
    });
});
