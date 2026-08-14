import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('Drawnix knowledge-map benchmark', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const benchmarkPath = path.join(repoRoot, 'scripts', 'benchmark-drawnix-knowledge-map.js');

    test('exports a representative multi-root forest without a semantic capacity quota', () => {
        const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'notemd-drawnix-benchmark-'));

        try {
            const stdout = execFileSync(process.execPath, [
                benchmarkPath,
                '--output-directory', outputDirectory
            ], {
                cwd: repoRoot,
                encoding: 'utf8'
            });
            const result = JSON.parse(stdout);

            expect(result).toEqual(expect.objectContaining({
                rootCount: 8,
                nodeCount: 136,
                edgeCount: 32,
                validationErrorCount: 0
            }));
            expect(result.elapsedMs).toBeGreaterThan(0);
            expect(fs.existsSync(result.outputPath)).toBe(true);
            expect(fs.readFileSync(result.previewSvgOutputPath, 'utf8'))
                .toContain('notemd-drawnix-mindmap-svg@1.0.0');
        } finally {
            fs.rmSync(outputDirectory, { recursive: true, force: true });
        }
    }, 30000);
});
