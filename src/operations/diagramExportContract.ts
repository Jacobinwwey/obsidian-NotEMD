import type { OperationSchema } from './types';
import { DIAGRAM_OUTPUT_DESCRIPTORS } from '../diagram/diagramOutputPreferences';

export const DIAGRAM_EXPORT_RUN_RESULT_SCHEMA: OperationSchema = {
    type: 'object', required: ['status', 'manifestPath', 'sourcePath', 'plan', 'outputs'],
    properties: {
        status: { type: 'string', enum: ['completed', 'partial', 'cancelled'] },
        manifestPath: { type: 'string' }, sourcePath: { type: 'string' },
        plan: { type: 'object', required: ['typeId', 'target', 'outputs', 'inactiveOutputs', 'usedDefaultOutput'], properties: {
            typeId: { type: 'string' }, target: { type: 'string' }, outputs: { type: 'array', items: { type: 'string' } },
            inactiveOutputs: { type: 'array', items: { type: 'object', required: ['id', 'reason'], properties: { id: { type: 'string' }, reason: { type: 'string' } } } },
            usedDefaultOutput: { type: 'boolean' }
        } },
        outputs: { type: 'array', items: { type: 'object', required: ['id', 'path', 'status', 'files'], properties: {
            id: { type: 'string', enum: DIAGRAM_OUTPUT_DESCRIPTORS.map(output => output.id) }, path: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'cancelled'] }, error: { type: 'string' },
            files: { type: 'array', items: { type: 'object', required: ['path', 'sha256'], properties: { path: { type: 'string' }, sha256: { type: 'string' } } } }
        } } }
    }
};
