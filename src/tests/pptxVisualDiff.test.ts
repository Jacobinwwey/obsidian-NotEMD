import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { strToU8, zipSync } from 'fflate';

const {
	diagnoseVisualPage,
	evaluateVisualGate,
	extractPptxBackgroundImages,
	pairPngSequences,
	parseCompareMetric,
	parseGeometryBox,
	summarizePageMetrics,
} = require('../../scripts/lib/pptx-visual-diff');

describe('pptx visual diff helper', () => {
	test('parses ImageMagick normalized RMSE output', () => {
		expect(parseCompareMetric('17068.7 (0.260447)').value).toBeCloseTo(0.260447, 6);
		expect(parseCompareMetric('17068.7 (0.260447)').normalized).toBe(true);
		expect(parseCompareMetric('42').value).toBe(42);
		expect(parseCompareMetric('42').normalized).toBe(false);
		expect(parseCompareMetric('inf').value).toBe(Number.POSITIVE_INFINITY);
	});

	test('parses ImageMagick bounding-box geometry output', () => {
		expect(parseGeometryBox('1280x700+24+16')).toEqual({
			width: 1280,
			height: 700,
			x: 24,
			y: 16,
		});
		expect(parseGeometryBox('not geometry')).toBeNull();
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

			expect(pairs.map((pair: { referencePath: string }) => pair.referencePath.split('/').pop())).toEqual([
				'1.png',
				'2.png',
				'10.png',
			]);
			expect(pairs.map((pair: { renderedPath: string }) => pair.renderedPath.split('/').pop())).toEqual([
				'slide-01.png',
				'slide-02.png',
				'slide-10.png',
			]);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('summarizes and gates per-page RMSE metrics', () => {
		const summary = summarizePageMetrics([
			{
				slide: 1,
				referencePath: '1.png',
				renderedPath: 'slide-01.png',
				rmseNormalized: 0.03,
				absoluteErrorRatio: 0.1,
				maxScaleRatioDelta: 0.01,
				differenceBoundingBox: {
					available: true,
					thresholdPercent: 8,
					x: 0,
					y: 0,
					width: 40,
					height: 40,
					areaRatio: 0.02,
				},
			},
			{
				slide: 2,
				referencePath: '2.png',
				renderedPath: 'slide-02.png',
				rmseNormalized: 0.16,
				absoluteErrorRatio: 0.3,
				maxScaleRatioDelta: 0.08,
				differenceBoundingBox: {
					available: true,
					thresholdPercent: 8,
					x: 12,
					y: 10,
					width: 400,
					height: 300,
					areaRatio: 0.24,
				},
			},
		]);

		expect(summary.meanRmse).toBeCloseTo(0.095, 6);
		expect(summary.maxRmse).toBeCloseTo(0.16, 6);
		expect(summary.maxScaleRatioDelta).toBeCloseTo(0.08, 6);
		expect(summary.maxDifferenceBoundingBoxAreaRatio).toBeCloseTo(0.24, 6);
		expect(summary.worstSlides[0].slide).toBe(2);
		expect(summary.worstDifferenceBoundingBoxSlides[0].slide).toBe(2);
		expect(summary.advisoryMetrics.diagnosticCounts.layoutDriftLikely).toBe(1);
		expect(summary.advisoryMetrics.likelyRendererNoiseSlides).toEqual([1]);
		expect(summary.advisoryMetrics.worstLikelyLayoutDriftSlides[0].slide).toBe(2);
		expect(evaluateVisualGate(summary, { maxRmse: 0.12, meanRmse: 0.08 }).passed).toBe(false);
		expect(evaluateVisualGate(summary, { maxRmse: 0.2, meanRmse: 0.1 }).passed).toBe(true);
		expect(
			evaluateVisualGate(summary, {
				maxRmse: 0.2,
				meanRmse: 0.1,
				maxScaleRatioDelta: 0.02,
			}).passed,
		).toBe(false);
		expect(
			evaluateVisualGate(summary, {
				maxRmse: 0.2,
				meanRmse: 0.1,
				maxDifferenceBoundingBoxAreaRatio: 0.1,
			}).passed,
		).toBe(false);
	});

	test('classifies wide low-rmse diffs as likely renderer noise', () => {
		const diagnostics = diagnoseVisualPage({
			slide: 7,
			referencePath: 'reference.png',
			renderedPath: 'rendered.png',
			rmseNormalized: 0.05,
			maxScaleRatioDelta: 0.01,
			differenceBoundingBox: {
				available: true,
				areaRatio: 0.64,
			},
		});

		expect(diagnostics.textAntialiasDriftLikely).toBe(true);
		expect(diagnostics.rendererNoiseLikely).toBe(true);
		expect(diagnostics.layoutDriftLikely).toBe(false);
		expect(diagnostics.status).toBe('renderer-noise-review');
	});

	test('classifies scale drift as layout review', () => {
		const diagnostics = diagnoseVisualPage({
			slide: 8,
			referencePath: 'reference.png',
			renderedPath: 'rendered.png',
			rmseNormalized: 0.13,
			maxScaleRatioDelta: 0.05,
			differenceBoundingBox: {
				available: true,
				areaRatio: 0.2,
			},
		});

		expect(diagnostics.layoutDriftLikely).toBe(true);
		expect(diagnostics.reviewPriority).toBe('high');
		expect(diagnostics.status).toBe('layout-review');
	});

	test('keeps high-rmse external references separate from layout drift when scale is stable', () => {
		const diagnostics = diagnoseVisualPage(
			{
				slide: 9,
				referencePath: 'reference.png',
				renderedPath: 'rendered.png',
				rmseNormalized: 0.19,
				maxScaleRatioDelta: 0.02,
				differenceBoundingBox: {
					available: true,
					areaRatio: 0.6,
				},
			},
			{ referenceSource: 'external-png-sequence' },
		);

		expect(diagnostics.referenceContractDriftLikely).toBe(true);
		expect(diagnostics.layoutDriftLikely).toBe(false);
		expect(diagnostics.status).toBe('reference-contract-review');
	});

	test('does not classify same-rendered-html references as external contract drift', () => {
		const diagnostics = diagnoseVisualPage(
			{
				slide: 10,
				referencePath: 'reference.png',
				renderedPath: 'rendered.png',
				rmseNormalized: 0.19,
				maxScaleRatioDelta: 0.02,
				differenceBoundingBox: {
					available: true,
					areaRatio: 0.6,
				},
			},
			{ referenceSource: 'pptx-rendered-html-reference' },
		);

		expect(diagnostics.referenceContractDriftLikely).toBe(false);
		expect(diagnostics.layoutDriftLikely).toBe(true);
		expect(diagnostics.status).toBe('layout-review');
	});

	test('extracts PPTX frozen background images as visual references', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-visual-reference-'));
		try {
			const pptxPath = join(directory, 'deck.pptx');
			const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
			const files: Record<string, Uint8Array> = {
				'ppt/slides/slide1.xml': strToU8(
					[
						'<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
						'<p:cSld><p:spTree><p:pic><p:blipFill><a:blip r:embed="rId2"/></p:blipFill></p:pic></p:spTree></p:cSld>',
						'</p:sld>',
					].join(''),
				),
				'ppt/slides/_rels/slide1.xml.rels': strToU8(
					[
						'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
						'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>',
						'</Relationships>',
					].join(''),
				),
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
