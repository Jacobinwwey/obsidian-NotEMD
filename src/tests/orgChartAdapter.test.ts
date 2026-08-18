import { renderOrgChartMermaid } from '../diagram/adapters/mermaid/orgChartAdapter';

describe('org chart Mermaid adapter', () => {
    test('emits one node per owner and deterministic parent links', () => {
        const output = renderOrgChartMermaid({
            intent: 'orgChart',
            title: 'Support ownership',
            nodes: [],
            orgChartSpec: {
                nodes: [
                    { id: 'director', label: 'Support Director', role: 'Front door' },
                    { id: 'platform', label: 'Platform Team', reportsTo: 'director', scope: ['runtime', 'reliability'] }
                ]
            }
        });

        expect(output).toContain('```mermaid');
        expect(output).toContain('flowchart TD');
        expect(output).toContain('director["Support Director<br/>Front door"]');
        expect(output).toContain('platform["Platform Team<br/>runtime, reliability"]');
        expect(output).toContain('director --> platform');
    });
});
