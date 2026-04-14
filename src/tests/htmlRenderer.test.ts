import { DiagramSpec } from '../diagram/types';
import { HtmlRenderer } from '../rendering/renderers/htmlRenderer';

describe('html renderer', () => {
    test('renders a standalone html summary document for structured diagrams', async () => {
        const renderer = new HtmlRenderer();
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'Release Flow',
            summary: 'Validate, review, and publish the release.',
            nodes: [
                { id: 'validate', label: 'Validate' },
                { id: 'review', label: 'Review' },
                { id: 'publish', label: 'Publish' }
            ],
            edges: [
                { from: 'validate', to: 'review', label: 'checks pass' },
                { from: 'review', to: 'publish', label: 'approved' }
            ],
            callouts: [
                { label: 'Gate', detail: 'Manual approval required before publishing.' }
            ]
        };

        const artifact = await renderer.render(spec);

        expect(artifact.target).toBe('html');
        expect(artifact.mimeType).toBe('text/html');
        expect(artifact.content).toContain('<!DOCTYPE html>');
        expect(artifact.content).toContain('Release Flow');
        expect(artifact.content).toContain('Validate');
        expect(artifact.content).toContain('Manual approval required before publishing.');
        expect(artifact.content).toContain('Content-Security-Policy');
    });

    test('renders chart specs as html data tables', async () => {
        const renderer = new HtmlRenderer();
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: 'Weekly Signups',
            nodes: [],
            dataSeries: [
                {
                    id: 'signups',
                    label: 'Signups',
                    points: [
                        { x: 'Week 1', y: 12 },
                        { x: 'Week 2', y: 19 }
                    ]
                }
            ]
        };

        const artifact = await renderer.render(spec);

        expect(artifact.content).toContain('<table');
        expect(artifact.content).toContain('Week 1');
        expect(artifact.content).toContain('19');
    });

    test('localizes fallback headings using output language', async () => {
        const renderer = new HtmlRenderer();
        const spec: DiagramSpec = {
            intent: 'flowchart',
            title: 'リリースフロー',
            summary: '確認して公開する。',
            sourceLanguage: 'en',
            outputLanguage: 'ja',
            nodes: [{ id: 'validate', label: '確認' }],
            callouts: [{ label: '重要', detail: '承認が必要です。' }]
        };

        const artifact = await renderer.render(spec);

        expect(artifact.content).toContain('<h2>構造</h2>');
        expect(artifact.content).toContain('<h2>注記</h2>');
        expect(artifact.content).toContain('入力言語');
        expect(artifact.content).toContain('出力言語');
        expect(artifact.content).not.toContain('<h2>Structure</h2>');
        expect(artifact.content).not.toContain('<h2>Callouts</h2>');
    });

    test('localizes chart table labels using output language', async () => {
        const renderer = new HtmlRenderer();
        const spec: DiagramSpec = {
            intent: 'dataChart',
            title: '每周注册量',
            outputLanguage: 'zh-CN',
            nodes: [],
            dataSeries: [
                {
                    id: 'signups',
                    label: '注册量',
                    points: [
                        { x: '第 1 周', y: 12 },
                        { x: '第 2 周', y: 19 }
                    ]
                }
            ]
        };

        const artifact = await renderer.render(spec);

        expect(artifact.content).toContain('<h2>数据</h2>');
        expect(artifact.content).toContain('<th>系列</th>');
        expect(artifact.content).not.toContain('<h2>Data</h2>');
        expect(artifact.content).not.toContain('<th>Series</th>');
    });
});
