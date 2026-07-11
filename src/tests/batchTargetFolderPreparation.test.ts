import { prepareBatchTargetFolder } from '../operations/batchTargetFolderPreparation';

describe('batch target folder preparation', () => {
    test('creates a missing folder after consent and remembers automatic creation', async () => {
        const createFolder = jest.fn().mockResolvedValue(undefined);
        const remember = jest.fn().mockResolvedValue(undefined);
        const result = await prepareBatchTargetFolder({
            path: 'Financial',
            inspect: async () => ({ kind: 'missing' }),
            createFolder,
            confirmMissing: async () => ({ confirmed: true, remember: true }),
            confirmNonEmpty: async () => false,
            rememberAutoCreate: remember,
            autoCreateMissing: false,
            interactive: true
        });
        expect(result.status).toBe('ready');
        expect(createFolder).toHaveBeenCalledWith('Financial');
        expect(remember).toHaveBeenCalledWith(true);
    });

    test('confirms a non-empty folder once before the batch', async () => {
        const confirmNonEmpty = jest.fn().mockResolvedValue(true);
        const result = await prepareBatchTargetFolder({
            path: 'Financial',
            inspect: async () => ({ kind: 'folder', childCount: 12, sample: ['a.md', 'b.md'] }),
            createFolder: async () => undefined,
            confirmMissing: async () => ({ confirmed: false, remember: false }),
            confirmNonEmpty,
            rememberAutoCreate: async () => undefined,
            autoCreateMissing: false,
            interactive: true
        });
        expect(result.status).toBe('ready');
        expect(confirmNonEmpty).toHaveBeenCalledTimes(1);
    });

    test('returns a recoverable outcome for missing folders without interaction', async () => {
        const result = await prepareBatchTargetFolder({
            path: 'Financial', inspect: async () => ({ kind: 'missing' }), createFolder: async () => undefined,
            confirmMissing: async () => ({ confirmed: false, remember: false }), confirmNonEmpty: async () => false,
            rememberAutoCreate: async () => undefined, autoCreateMissing: false, interactive: false
        });
        expect(result.status).toBe('requires-interaction');
    });
});
