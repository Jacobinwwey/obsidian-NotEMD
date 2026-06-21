import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { strToU8, zipSync } from 'fflate';

const {
	evaluateVisualGate,
	extractPptxBackgroundImages,
	pairPngSequences,
	parseCompareMetric,
	summarizePageMetrics,
} = require('../../scripts/lib/pptx-visual-diff');

describe('pptx visual diff helper', () => {
	test('parses ImageMagick normalized RMSE output', () => {
		expect(parseCompareMetric('17068.7 (0.260447)').value).toBeCloseTo(0.260447, 6);
		expect(parseCompareMetric('17068.7 (0.260447)').normalized).toBe(true);
		expect(parseCompareMetric('42').value).toBe(42);
		expect(parseCompareMetric('42').normalized).toBe(false);
	});

	test('pairs PNG sequences by page number rather than lexical order', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-visual-diff-'));
		const reference = join(directory, 'reference');
		const rendered = join(directory, 'rendered');
		try {
			require('fs').mkdirSync(reference);
			require('fs').mkdirSync(rendered);
			writeFileSync(join(reference, '1.png'), '');
			writeFileSync(join(reference, '10.png'), '');
			writeFileSync(join(reference, '2.png'), '');
			writeFileSync(join(rendered, 'slide-01.png'), '');
			writeFileSync(join(rendered, 'slide-02.png'), '');
			writeFileSync(join(rendered, 'slide-10.png'), '');

			const pairs = pairPngSequences(reference, rendered);

			expect(pairs.map((pair: { referencePath: string }) => pair.referencePath.split('/').pop())).toEqual(['1.png', '2.png', '10.png']);
			expect(pairs.map((pair: { renderedPath: string }) => pair.renderedPath.split('/').pop())).toEqual(['slide-01.png', 'slide-02.png', 'slide-10.png']);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('summarizes and gates per-page RMSE metrics', () => {
		const summary = summarizePageMetrics([
			{ slide: 1, referencePath: '1.png', renderedPath: 'slide-01.png', rmseNormalized: 0.03, absoluteErrorRatio: 0.1 },
			{ slide: 2, referencePath: '2.png', renderedPath: 'slide-02.png', rmseNormalized: 0.16, absoluteErrorRatio: 0.3 },
		]);

		expect(summary.meanRmse).toBeCloseTo(0.095, 6);
		expect(summary.maxRmse).toBeCloseTo(0.16, 6);
		expect(summary.worstSlides[0].slide).toBe(2);
		expect(evaluateVisualGate(summary, { maxRmse: 0.12, meanRmse: 0.08 }).passed).toBe(false);
		expect(evaluateVisualGate(summary, { maxRmse: 0.2, meanRmse: 0.1 }).passed).toBe(true);
	});

	test('extracts PPTX frozen background images as visual references', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-visual-reference-'));
		try {
			const pptxPath = join(directory, 'deck.pptx');
			const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
			const files: Record<string, Uint8Array> = {
				'ppt/slides/slide1.xml': strToU8([
					'<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
					'<p:cSld><p:spTree><p:pic><p:blipFill><a:blip r:embed="rId2"/></p:blipFill></p:pic></p:spTree></p:cSld>',
					'</p:sld>',
				].join('')),
				'ppt/slides/_rels/slide1.xml.rels': strToU8([
					'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
					'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>',
					'</Relationships>',
				].join('')),
				'ppt/media/image1.png': png,
			};
			writeFileSync(pptxPath, Buffer.from(zipSync(files)));

			const result = extractPptxBackgroundImages({
				pptxPath,
				outputDirectory: directory,
			});

			expect(result.source).toBe('pptx-background-images');
			expect(result.referenceImages).toHaveLength(1);
			expect(result.referenceImages[0].imageZipPath).toBe('ppt/media/image1.png');
			expect(readFileSync(join(result.referenceDirectory, 'slide-01.png'))).toEqual(Buffer.from(png));
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
