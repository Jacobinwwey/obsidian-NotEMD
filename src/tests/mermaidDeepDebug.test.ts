import mermaid from 'mermaid';
import { refineMermaidBlocks } from '../mermaidProcessor';

describe('Mermaid Deep Debug Fixes', () => {
    it('should fix complex double labels and note conversions', async () => {
        // Force mermaid.parse to fail so deepDebugMermaid is called
        (mermaid.parse as jest.Mock).mockRejectedValue(new Error('Syntax Error'));

        const input = [
            '```mermaid',
            'graph LR',
            'subgraph "Energy Storage Comparison Log-Log Scale"',
            'direction LR',
            'A[Conventional Capacitor] -- Low Energy, High Power --> BSupercapacitor;',
            'B -- Moderate Energy & Power -- "Balanced Energy/Power<br>Widely Used" --> C["Lithium-ion Battery"];',
            'C -- Higher Energy, Lower Power --> D[Flow Battery];',
            'D -- Very High Energy, Low Power -- "Grid Scale<br>High Energy Capacity<br>Geographically Limited" --> E[Pumped Hydro / CAES];',
            'F[Flywheel] -- Similar to Supercap but Mechanical --> B;',
            '',
            'XAxis["Power Density W/kg or W/L"];',
            'YAxis["Energy Density Wh/kg or Wh/L"];',
            '',
            'note right of A : Very High Power Density<br>Very Low Energy Density',
            'end',
            'XAxis --- YAxis;',
            'G -- Label1 -- Label2 --- H;',
            '```'
        ].join('\n');

        const processed = await refineMermaidBlocks(input);

        console.log('Processed Mermaid:\n', processed);

        expect(processed).toContain('B -- "Moderate Energy & Power<br>Balanced Energy/Power<br>Widely Used" --> C');
        expect(processed).toContain('D -- "Very High Energy, Low Power<br>Grid Scale<br>High Energy Capacity<br>Geographically Limited" --> E');
        
        // Note expectation:
        // NoteA["Note: Very High Power Density<br>Very Low Energy Density"]
        // A -.- NoteA
        expect(processed).toContain('NoteA["Note: Very High Power Density<br>Very Low Energy Density"]');
        expect(processed).toContain('A -.- NoteA');

        // Check for node A definition with quoted label if possible, or just the note
        // The previous expectation was 'A -- "Low Energy...' but A is defined as A[...].
        // So we just check that the label is quoted correctly in the output line.
        // Also BSupercapacitor is fixed to B["Supercapacitor"]
        expect(processed).toContain('A[Conventional Capacitor] -- "Low Energy, High Power" --> B["Supercapacitor"]');

        // Check triple dash support
        // G -- Label1 -- Label2 --- H; -> G -- "Label1<br>Label2" --- H;
        expect(processed).toContain('G -- "Label1<br>Label2" --- H');
    });
});