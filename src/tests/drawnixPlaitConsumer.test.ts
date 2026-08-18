import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    exportDrawnixMindMapProjection,
    type DrawnixMindMapExportedData
} from '../diagram/adapters/drawnix/drawnixExporter';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import { DiagramSpec } from '../diagram/types';

interface PlaitConsumerReport {
    nodeIds: string[];
    rootIds: string[];
    relations: Array<{
        id: string;
        sourceId?: string;
        targetId?: string;
        text: string[];
    }>;
}

function createConsumerFixture(): DrawnixMindMapExportedData {
    const spec: DiagramSpec = {
        intent: 'drawnixMindmap',
        title: 'Plait consumer fixture',
        nodes: [
            {
                id: 'interaction',
                label: 'Interaction',
                children: [{ id: 'settings', label: 'Settings' }]
            },
            {
                id: 'delivery',
                label: 'Delivery',
                children: [{ id: 'presentation', label: 'Presentation' }]
            }
        ],
        edges: [{ from: 'settings', to: 'presentation', label: 'selects delivery' }]
    };
    return exportDrawnixMindMapProjection(buildDrawnixMindMapProjection(spec));
}

describe('Drawnix Plait consumer contract', () => {
    test('loads generated hierarchy and relation elements through the public Plait APIs', () => {
        const exported = createConsumerFixture();
        const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-drawnix-plait-consumer-'));
        const inputPath = path.join(temporaryDirectory, 'knowledge-map.drawnix');
        const consumerHarnessPath = path.join(__dirname, '..', '..', 'scripts', 'test-drawnix-plait-consumer.mjs');
        fs.writeFileSync(inputPath, JSON.stringify(exported), 'utf8');

        let consumerReport: PlaitConsumerReport;
        try {
            consumerReport = JSON.parse(execFileSync(process.execPath, [consumerHarnessPath, inputPath], {
                encoding: 'utf8'
            })) as PlaitConsumerReport;
        } finally {
            fs.rmSync(temporaryDirectory, { recursive: true, force: true });
        }

        expect(exported).toEqual(expect.objectContaining({
            type: 'drawnix',
            version: 1,
            source: 'web',
            viewport: expect.any(Object)
        }));
        expect(consumerReport.nodeIds).toEqual([
            'delivery',
            'interaction',
            'presentation',
            'settings'
        ]);
        expect(consumerReport.rootIds).toEqual([
            'delivery',
            'interaction'
        ]);
        expect(consumerReport.relations).toEqual([{
            id: 'cross-1-settings-to-presentation',
            sourceId: 'settings',
            targetId: 'presentation',
            text: ['selects delivery']
        }]);
    });

    test('runs the standalone gate against the production architecture fixture', () => {
        const gatePath = path.join(__dirname, '..', '..', 'scripts', 'run-drawnix-consumer-gate.mjs');
        const gateReport = JSON.parse(execFileSync(process.execPath, [gatePath], {
            cwd: path.join(__dirname, '..', '..'),
            encoding: 'utf8'
        })) as {
            status: string;
            consumer: string;
            generatedProductionFixture: boolean;
            nodeCount: number;
            rootCount: number;
            relationCount: number;
        };

        expect(gateReport).toEqual(expect.objectContaining({
            status: 'passed',
            consumer: 'plait-public-api',
            generatedProductionFixture: true,
            rootCount: 1
        }));
        expect(gateReport.nodeCount).toBeGreaterThan(1);
        expect(gateReport.relationCount).toBeGreaterThan(0);
    });
});
