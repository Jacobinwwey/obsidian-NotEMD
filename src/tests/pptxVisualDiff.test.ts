import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { tmpdir } from 'os';
import { strToU8, zipSync } from 'fflate';

const {
	DEFAULT_OPTIONAL_COMPARE_METRIC_TIMEOUT_MS,
	diagnoseVisualPage,
	evaluateVisualGate,
	extractPptxBackgroundImages,
	pairPngSequences,
	parseCompareMetric,
	parseGeometryBox,
	runOptionalCompareMetric,
	summarizePageMetrics,
	writeComparisonCsv,
} = require('../../scripts/lib/pptx-visual-diff');
const {
	inspectPptx,
	normalizeGitCheckIgnoreOutputPath,
	normalizeGitRelativePath,
	selectPptxHardGateReferenceSource,
	selectPptxVisualThresholdProfile,
	shouldRunBackgroundPptxVisualDiff,
	shouldRunRenderedHtmlPptxReferenceDiff,
} = require('../../scripts/verify-slidev-export-workflow.cjs');

describe('pptx visual diff helper', () => {
	test('normalizes git check-ignore paths across Windows and POSIX output', () => {
		expect(normalizeGitRelativePath('docs\\export\\deck\\index.html')).toBe('docs/export/deck/index.html');
		expect(normalizeGitCheckIgnoreOutputPath('"docs\\\\export\\\\deck\\\\index.html"')).toBe(
			'docs/export/deck/index.html',
		);
		expect(normalizeGitCheckIgnoreOutputPath('"docs/export/deck/index.html\\r"')).toBe(
			'docs/export/deck/index.html',
		);
		expect(normalizeGitCheckIgnoreOutputPath('docs/export/deck/index.html')).toBe(
			'docs/export/deck/index.html',
		);
	});

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

			expect(pairs.map((pair: { referencePath: string }) => basename(pair.referencePath))).toEqual([
				'1.png',
				'2.png',
				'10.png',
			]);
			expect(pairs.map((pair: { renderedPath: string }) => basename(pair.renderedPath))).toEqual([
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

	test('keeps optional ImageMagick metric timeout stable by default', () => {
		expect(DEFAULT_OPTIONAL_COMPARE_METRIC_TIMEOUT_MS).toBe(60000);
	});

	test('uses rendered HTML as the hard visual gate for visible-native PPTX defaults', () => {
		const args = {
			requirePptxVisualMatch: true,
			pptxVisualDiff: true,
			pptxVisualReferenceDir: null,
			pptxRenderedHtmlReferenceDiff: false,
			pptxVisibleNativeExperiment: false,
			pptxVisualMaxRmse: 0.12,
			pptxVisualMeanRmse: 0.08,
			pptxVisualMaxRmseExplicit: false,
			pptxVisualMeanRmseExplicit: false,
		};
		const report = {
			visibleTextLayer: 'native-text-and-background-image',
			editableLayerRenderMode: 'visible-native-text',
		};

		expect(selectPptxHardGateReferenceSource(args, report)).toBe('pptx-rendered-html-reference');
		expect(shouldRunRenderedHtmlPptxReferenceDiff(args, report)).toBe(true);
		expect(shouldRunBackgroundPptxVisualDiff(args, report)).toBe(false);
		expect(selectPptxVisualThresholdProfile(args, report, 'pptx-rendered-html-reference')).toEqual({
			name: 'visible-native-rendered-html',
			explicit: {
				maxRmse: false,
				meanRmse: false,
			},
			thresholds: {
				maxRmse: 0.25,
				meanRmse: 0.145,
			},
		});
	});

	test('keeps configured PPTX visual reference directories explicit', () => {
		const args = {
			requirePptxVisualMatch: true,
			pptxVisualDiff: true,
			pptxVisualReferenceDir: 'export/reference-png',
			pptxRenderedHtmlReferenceDiff: false,
			pptxVisibleNativeExperiment: false,
			pptxVisualMaxRmse: 0.11,
			pptxVisualMeanRmse: 0.07,
			pptxVisualMaxRmseExplicit: true,
			pptxVisualMeanRmseExplicit: true,
		};
		const report = {
			visibleTextLayer: 'native-text-and-background-image',
			editableLayerRenderMode: 'visible-native-text',
		};

		expect(selectPptxHardGateReferenceSource(args, report)).toBe('configured-png-sequence');
		expect(shouldRunRenderedHtmlPptxReferenceDiff(args, report)).toBe(false);
		expect(shouldRunBackgroundPptxVisualDiff(args, report)).toBe(true);
		expect(selectPptxVisualThresholdProfile(args, report, 'configured-png-sequence')).toEqual({
			name: 'default-raster',
			explicit: {
				maxRmse: true,
				meanRmse: true,
			},
			thresholds: {
				maxRmse: 0.11,
				meanRmse: 0.07,
			},
		});
	});

	test('reports unsupported optional ImageMagick metrics without throwing', () => {
		const result = runOptionalCompareMetric(
			'NCC',
			'reference.png',
			'rendered.png',
			{ available: true, metrics: ['RMSE', 'AE'] },
		);

		expect(result).toEqual(expect.objectContaining({
			metric: 'NCC',
			available: false,
			value: null,
			normalized: false,
			reason: 'unsupported-by-imagemagick',
		}));
	});

	test('summarizes optional metric availability as advisory diagnostics', () => {
		const summary = summarizePageMetrics([
			{
				slide: 1,
				referencePath: '1.png',
				renderedPath: 'slide-01.png',
				rmseNormalized: 0.03,
				absoluteErrorRatio: 0.01,
				maxScaleRatioDelta: 0.01,
				optionalCompareMetrics: {
					PHASH: { metric: 'PHASH', available: true, value: 0.02, normalized: true, reason: null },
					NCC: { metric: 'NCC', available: false, value: null, normalized: false, reason: 'metric-timeout' },
					SSIM: {
						metric: 'SSIM',
						available: false,
						value: null,
						normalized: false,
						reason: 'unsupported-by-imagemagick',
					},
				},
			},
		]);

		expect(summary.advisoryMetrics.optionalCompareMetrics).toEqual(expect.objectContaining({
			requestedMetricCount: 3,
			availableMetricCount: 1,
			unavailableMetricCount: 2,
			timedOutMetricCount: 1,
			unsupportedMetricCount: 1,
			unavailableReasons: {
				'metric-timeout': 1,
				'unsupported-by-imagemagick': 1,
			},
		}));
	});

	test('writes optional metric unavailable reasons into the comparison CSV', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-visual-csv-'));
		try {
			const outputPath = join(directory, 'comparison-metrics.csv');
			writeComparisonCsv([
				{
					slide: 1,
					referencePath: '1.png',
					renderedPath: 'slide-01.png',
					optionalCompareMetrics: {
						PHASH: { value: 0.02, reason: null },
						NCC: { value: null, reason: 'metric-timeout' },
						SSIM: { value: null, reason: 'unsupported-by-imagemagick' },
					},
				},
			], outputPath);

			const csv = readFileSync(outputPath, 'utf8');
			expect(csv.split('\n')[0]).toContain('phash_reason,ncc_reason,ssim_reason');
			expect(csv).toContain('metric-timeout');
			expect(csv).toContain('unsupported-by-imagemagick');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
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
