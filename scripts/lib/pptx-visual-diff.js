const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { unzipSync } = require('fflate');

const REQUIRED_TOOLS = [
	{ command: 'libreoffice', args: ['--version'] },
	{ command: 'pdftoppm', args: ['-v'] },
	{ command: 'identify', args: ['-version'] },
	{ command: 'convert', args: ['-version'] },
	{ command: 'compare', args: ['-version'] },
	{ command: 'montage', args: ['-version'] },
];

function ensureDirectory(directory) {
	fs.mkdirSync(directory, { recursive: true });
}

function resetDirectory(directory) {
	fs.rmSync(directory, { recursive: true, force: true });
	ensureDirectory(directory);
}

function prepareVisualDiffOutputDirectory(directory) {
	ensureDirectory(directory);
	for (const child of ['work', 'pptx-rendered', 'pptx-resized', 'diff', 'side-by-side']) {
		fs.rmSync(path.join(directory, child), {
			recursive: true,
			force: true,
		});
	}
	for (const file of [
		'all-side-by-side-sheet.png',
		'all-diff-sheet.png',
		'comparison-metrics.csv',
		'pptx-visual-diff.report.json',
	]) {
		fs.rmSync(path.join(directory, file), { force: true });
	}
}

function runCommand(command, args, options = {}) {
	const result = childProcess.spawnSync(command, args, {
		encoding: 'utf8',
		maxBuffer: 16 * 1024 * 1024,
		...options,
	});
	return {
		command,
		args,
		status: result.status,
		stdout: result.stdout || '',
		stderr: result.stderr || '',
		error: result.error ? result.error.message : null,
	};
}

function collectToolAvailability(tools = REQUIRED_TOOLS) {
	const checked = tools.map((tool) => {
		const result = runCommand(tool.command, tool.args);
		return {
			command: tool.command,
			available: !result.error && result.status !== 127 && result.status !== 126,
			status: result.status,
			version: (result.stdout || result.stderr).split(/\r?\n/).find(Boolean) || null,
			error: result.error,
		};
	});
	return {
		checked,
		missing: checked.filter((tool) => !tool.available).map((tool) => tool.command),
	};
}

function firstNumber(value) {
	const match = path.basename(value).match(/(\d+)/);
	return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function collectPngSequence(directory) {
	if (!directory || !fs.existsSync(directory)) {
		return [];
	}
	return fs
		.readdirSync(directory)
		.filter((file) => /\.png$/i.test(file))
		.map((file) => path.join(directory, file))
		.sort((left, right) => firstNumber(left) - firstNumber(right) || left.localeCompare(right));
}

function pairPngSequences(referenceDirectory, renderedDirectory) {
	const references = collectPngSequence(referenceDirectory);
	const rendered = collectPngSequence(renderedDirectory);
	const maxLength = Math.max(references.length, rendered.length);
	const pairs = [];
	for (let index = 0; index < maxLength; index += 1) {
		pairs.push({
			slide: index + 1,
			referencePath: references[index] || null,
			renderedPath: rendered[index] || null,
		});
	}
	return pairs;
}

function formatSlideFileName(slide, suffix = '.png') {
	return `slide-${String(slide).padStart(2, '0')}${suffix}`;
}

function slideNumberFromPptxPath(value) {
	const match = String(value || '').match(/\/slide(\d+)\.xml$/);
	return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function readZipText(entries, zipPath) {
	const entry = entries[zipPath];
	return entry ? Buffer.from(entry).toString('utf8') : '';
}

function collectSlideImageRelationships(entries, relsPath) {
	const relsXml = readZipText(entries, relsPath);
	const relationships = new Map();
	const relationshipPattern = /<Relationship\b([^>]+)>?/g;
	let match;
	while ((match = relationshipPattern.exec(relsXml))) {
		const attributes = match[1] || '';
		const id = attributes.match(/\bId="([^"]+)"/)?.[1];
		const target = attributes.match(/\bTarget="([^"]+)"/)?.[1];
		const type = attributes.match(/\bType="([^"]+)"/)?.[1] || '';
		if (id && target && /\/image$/i.test(type)) {
			relationships.set(id, target);
		}
	}
	return relationships;
}

function resolveSlideImageZipPath(slidePath, target) {
	const slideDirectory = path.posix.dirname(slidePath);
	return path.posix.normalize(path.posix.join(slideDirectory, target));
}

function extractPptxBackgroundImages(options) {
	const pptxPath = path.resolve(options.pptxPath);
	const outputDirectory = path.resolve(options.outputDirectory);
	const referenceDirectory = path.resolve(
		options.referenceDirectory || path.join(outputDirectory, 'pptx-background-reference'),
	);
	if (!fs.existsSync(pptxPath)) {
		throw new Error(`PPTX file does not exist: ${pptxPath}`);
	}

	resetDirectory(referenceDirectory);
	const entries = unzipSync(new Uint8Array(fs.readFileSync(pptxPath)));
	const slidePaths = Object.keys(entries)
		.filter((file) => /^ppt\/slides\/slide\d+\.xml$/i.test(file))
		.sort((left, right) => slideNumberFromPptxPath(left) - slideNumberFromPptxPath(right));
	const referenceImages = [];

	for (const slidePath of slidePaths) {
		const slideNumber = slideNumberFromPptxPath(slidePath);
		const slideXml = readZipText(entries, slidePath);
		const firstEmbedId = slideXml.match(/<a:blip\b[^>]*\br:embed="([^"]+)"/)?.[1];
		if (!firstEmbedId) {
			continue;
		}
		const relsPath = `ppt/slides/_rels/${path.posix.basename(slidePath)}.rels`;
		const relationships = collectSlideImageRelationships(entries, relsPath);
		const target = relationships.get(firstEmbedId);
		if (!target) {
			continue;
		}
		const imageZipPath = resolveSlideImageZipPath(slidePath, target);
		const imageEntry = entries[imageZipPath];
		if (!imageEntry) {
			continue;
		}
		const extension = path.posix.extname(imageZipPath).toLowerCase() || '.png';
		const imagePath = path.join(referenceDirectory, formatSlideFileName(slideNumber, extension));
		fs.writeFileSync(imagePath, Buffer.from(imageEntry));
		referenceImages.push({
			slide: slideNumber,
			imageZipPath,
			imagePath,
		});
	}

	return {
		source: 'pptx-background-images',
		pptxPath,
		referenceDirectory,
		referenceImages,
	};
}

function resolvePdfPath(workDirectory, pptxPath) {
	const basename = path.basename(pptxPath, path.extname(pptxPath));
	const candidate = path.join(workDirectory, `${basename}.pdf`);
	if (fs.existsSync(candidate)) {
		return candidate;
	}
	const pdfs = fs
		.readdirSync(workDirectory)
		.filter((file) => /\.pdf$/i.test(file))
		.map((file) => path.join(workDirectory, file));
	return pdfs[0] || candidate;
}

function renderPptxToPngSequence(options) {
	const pptxPath = path.resolve(options.pptxPath);
	const outputDirectory = path.resolve(options.outputDirectory);
	const workDirectory = path.resolve(options.workDirectory || path.join(outputDirectory, 'work'));
	const rawDirectory = path.join(workDirectory, 'raw-rendered');
	const renderedDirectory = path.resolve(options.renderedDirectory || path.join(outputDirectory, 'pptx-rendered'));
	const dpi = Number.isFinite(Number(options.dpi)) ? Number(options.dpi) : 150;

	if (!fs.existsSync(pptxPath)) {
		throw new Error(`PPTX file does not exist: ${pptxPath}`);
	}

	resetDirectory(workDirectory);
	resetDirectory(rawDirectory);
	resetDirectory(renderedDirectory);
	const profileDirectory = path.join(workDirectory, 'libreoffice-profile');
	ensureDirectory(profileDirectory);

	const convertResult = runCommand(
		'libreoffice',
		[
			'--headless',
			'--invisible',
			'--nodefault',
			'--nofirststartwizard',
			'--norestore',
			`-env:UserInstallation=${pathToFileURL(profileDirectory).toString()}`,
			'--convert-to',
			'pdf',
			'--outdir',
			workDirectory,
			pptxPath,
		],
		{ timeout: Number(options.timeoutMs) || 120000 },
	);
	if (convertResult.status !== 0) {
		throw new Error(
			`LibreOffice PPTX to PDF conversion failed: ${convertResult.stderr || convertResult.stdout || convertResult.error || 'unknown error'}`,
		);
	}

	const pdfPath = resolvePdfPath(workDirectory, pptxPath);
	if (!fs.existsSync(pdfPath)) {
		throw new Error(`LibreOffice did not produce a PDF in ${workDirectory}`);
	}

	const ppmPrefix = path.join(rawDirectory, 'slide');
	const ppmResult = runCommand('pdftoppm', ['-png', '-r', String(dpi), pdfPath, ppmPrefix], {
		timeout: Number(options.timeoutMs) || 120000,
	});
	if (ppmResult.status !== 0) {
		throw new Error(
			`pdftoppm render failed: ${ppmResult.stderr || ppmResult.stdout || ppmResult.error || 'unknown error'}`,
		);
	}

	const rawImages = collectPngSequence(rawDirectory);
	const renderedImages = rawImages.map((imagePath, index) => {
		const target = path.join(renderedDirectory, formatSlideFileName(index + 1));
		fs.copyFileSync(imagePath, target);
		return target;
	});

	return {
		pptxPath,
		pdfPath,
		renderedDirectory,
		renderedImages,
		dpi,
		commands: {
			libreOffice: {
				status: convertResult.status,
				stderr: convertResult.stderr.trim(),
			},
			pdftoppm: {
				status: ppmResult.status,
				stderr: ppmResult.stderr.trim(),
			},
		},
	};
}

function identifyDimensions(imagePath) {
	const result = runCommand('identify', ['-format', '%w %h', imagePath], {
		timeout: 30000,
	});
	if (result.status !== 0) {
		throw new Error(
			`identify failed for ${imagePath}: ${result.stderr || result.stdout || result.error || 'unknown error'}`,
		);
	}
	const [width, height] = result.stdout.trim().split(/\s+/).map(Number);
	if (!Number.isFinite(width) || !Number.isFinite(height)) {
		throw new Error(`identify returned invalid dimensions for ${imagePath}: ${result.stdout}`);
	}
	return { width, height };
}

function parseCompareMetric(output) {
	const text = String(output || '').trim();
	const normalizedMatch = text.match(/\(([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\)/i);
	if (normalizedMatch) {
		return {
			raw: text,
			value: Number(normalizedMatch[1]),
			normalized: true,
		};
	}
	const valueMatch = text.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
	return {
		raw: text,
		value: valueMatch ? Number(valueMatch[0]) : null,
		normalized: false,
	};
}

function parseGeometryBox(output) {
	const text = String(output || '').trim();
	const match = text.match(/^(\d+)x(\d+)([+-]\d+)([+-]\d+)$/);
	if (!match) {
		return null;
	}
	return {
		width: Number(match[1]),
		height: Number(match[2]),
		x: Number(match[3]),
		y: Number(match[4]),
	};
}

function runCompareMetric(metric, referencePath, renderedPath, outputPath) {
	const args = ['-metric', metric, referencePath, renderedPath, outputPath || 'null:'];
	const result = runCommand('compare', args, { timeout: 60000 });
	if (![0, 1].includes(result.status)) {
		throw new Error(
			`ImageMagick compare ${metric} failed: ${result.stderr || result.stdout || result.error || 'unknown error'}`,
		);
	}
	return parseCompareMetric(result.stderr || result.stdout);
}

function measureDifferenceBoundingBox(referencePath, renderedPath, referenceDimensions, thresholdPercent = 8) {
	const result = runCommand(
		'convert',
		[
			referencePath,
			renderedPath,
			'-compose',
			'difference',
			'-composite',
			'-colorspace',
			'Gray',
			'-threshold',
			`${thresholdPercent}%`,
			'-format',
			'%@',
			'info:',
		],
		{ timeout: 60000 },
	);
	if (result.status !== 0) {
		return {
			available: false,
			thresholdPercent,
			error: result.stderr || result.stdout || result.error || 'unknown error',
		};
	}
	const box = parseGeometryBox(result.stdout || result.stderr);
	if (!box || box.width <= 0 || box.height <= 0) {
		return {
			available: true,
			thresholdPercent,
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			areaRatio: 0,
		};
	}
	const pixelCount = referenceDimensions.width * referenceDimensions.height;
	return {
		available: true,
		thresholdPercent,
		...box,
		areaRatio: pixelCount > 0 ? (box.width * box.height) / pixelCount : null,
	};
}

function resizeRenderedImage(renderedPath, referenceDimensions, outputPath) {
	const geometry = `${referenceDimensions.width}x${referenceDimensions.height}!`;
	const result = runCommand('convert', [renderedPath, '-resize', geometry, outputPath], { timeout: 60000 });
	if (result.status !== 0) {
		throw new Error(
			`ImageMagick resize failed: ${result.stderr || result.stdout || result.error || 'unknown error'}`,
		);
	}
	return outputPath;
}

function buildSideBySide(referencePath, renderedPath, outputPath) {
	const result = runCommand(
		'montage',
		[referencePath, renderedPath, '-tile', '2x1', '-geometry', '+12+12', '-background', 'white', outputPath],
		{ timeout: 60000 },
	);
	if (result.status !== 0) {
		throw new Error(
			`ImageMagick side-by-side montage failed: ${result.stderr || result.stdout || result.error || 'unknown error'}`,
		);
	}
	return outputPath;
}

function buildContactSheet(inputPaths, outputPath, tile = '3x') {
	if (inputPaths.length === 0) {
		return null;
	}
	const result = runCommand(
		'montage',
		[...inputPaths, '-tile', tile, '-geometry', '+8+8', '-background', 'white', outputPath],
		{ timeout: 120000 },
	);
	if (result.status !== 0) {
		throw new Error(
			`ImageMagick contact sheet montage failed: ${result.stderr || result.stdout || result.error || 'unknown error'}`,
		);
	}
	return outputPath;
}

function csvCell(value) {
	if (value === null || value === undefined) {
		return '';
	}
	const text = String(value);
	if (/[",\n\r]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function writeComparisonCsv(pages, outputPath) {
	const headers = [
		'slide',
		'rmse_normalized',
		'absolute_error_pixels',
		'absolute_error_ratio',
		'reference_width',
		'reference_height',
		'rendered_original_width',
		'rendered_original_height',
		'width_scale_ratio',
		'height_scale_ratio',
		'max_scale_ratio_delta',
		'difference_bbox_x',
		'difference_bbox_y',
		'difference_bbox_width',
		'difference_bbox_height',
		'difference_bbox_area_ratio',
		'reference_path',
		'rendered_path',
		'resized_path',
		'diff_path',
		'side_by_side_path',
	];
	const rows = pages.map((page) => [
		page.slide,
		page.rmseNormalized,
		page.absoluteErrorPixels,
		page.absoluteErrorRatio,
		page.referenceDimensions?.width,
		page.referenceDimensions?.height,
		page.renderedOriginalDimensions?.width,
		page.renderedOriginalDimensions?.height,
		page.widthScaleRatio,
		page.heightScaleRatio,
		page.maxScaleRatioDelta,
		page.differenceBoundingBox?.x,
		page.differenceBoundingBox?.y,
		page.differenceBoundingBox?.width,
		page.differenceBoundingBox?.height,
		page.differenceBoundingBox?.areaRatio,
		page.referencePath,
		page.renderedPath,
		page.resizedPath,
		page.diffPath,
		page.sideBySidePath,
	]);
	fs.writeFileSync(outputPath, [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n'), 'utf8');
	return outputPath;
}

function summarizePageMetrics(pages) {
	const comparablePages = pages.filter((page) => Number.isFinite(page.rmseNormalized));
	const meanRmse =
		comparablePages.length > 0
			? comparablePages.reduce((sum, page) => sum + page.rmseNormalized, 0) / comparablePages.length
			: null;
	const maxRmse = comparablePages.length > 0 ? Math.max(...comparablePages.map((page) => page.rmseNormalized)) : null;
	const pagesWithScale = comparablePages.filter((page) => Number.isFinite(page.maxScaleRatioDelta));
	const maxScaleRatioDelta =
		pagesWithScale.length > 0 ? Math.max(...pagesWithScale.map((page) => page.maxScaleRatioDelta)) : null;
	const pagesWithDifferenceBox = comparablePages.filter((page) =>
		Number.isFinite(page.differenceBoundingBox?.areaRatio),
	);
	const maxDifferenceBoundingBoxAreaRatio =
		pagesWithDifferenceBox.length > 0
			? Math.max(...pagesWithDifferenceBox.map((page) => page.differenceBoundingBox.areaRatio))
			: null;
	const worstSlides = [...comparablePages]
		.sort((left, right) => right.rmseNormalized - left.rmseNormalized)
		.slice(0, 12)
		.map((page) => ({
			slide: page.slide,
			rmseNormalized: page.rmseNormalized,
			absoluteErrorRatio: page.absoluteErrorRatio,
			maxScaleRatioDelta: page.maxScaleRatioDelta,
			differenceBoundingBox: page.differenceBoundingBox,
			sideBySidePath: page.sideBySidePath,
			diffPath: page.diffPath,
		}));
	const worstDifferenceBoundingBoxSlides = [...comparablePages]
		.sort((left, right) => {
			const rightBox = right.differenceBoundingBox?.areaRatio ?? -1;
			const leftBox = left.differenceBoundingBox?.areaRatio ?? -1;
			if (rightBox !== leftBox) return rightBox - leftBox;
			return (right.maxScaleRatioDelta ?? -1) - (left.maxScaleRatioDelta ?? -1);
		})
		.slice(0, 12)
		.map((page) => ({
			slide: page.slide,
			rmseNormalized: page.rmseNormalized,
			absoluteErrorRatio: page.absoluteErrorRatio,
			maxScaleRatioDelta: page.maxScaleRatioDelta,
			differenceBoundingBox: page.differenceBoundingBox,
			sideBySidePath: page.sideBySidePath,
			diffPath: page.diffPath,
		}));

	return {
		pageCount: pages.length,
		comparablePageCount: comparablePages.length,
		missingReferenceSlides: pages.filter((page) => !page.referencePath).map((page) => page.slide),
		missingRenderedSlides: pages.filter((page) => !page.renderedPath).map((page) => page.slide),
		meanRmse,
		maxRmse,
		maxScaleRatioDelta,
		maxDifferenceBoundingBoxAreaRatio,
		worstSlides,
		worstDifferenceBoundingBoxSlides,
	};
}

function evaluateVisualGate(summary, thresholds) {
	const maxRmse = Number(thresholds?.maxRmse);
	const meanRmse = Number(thresholds?.meanRmse);
	const maxScaleRatioDelta = Number(thresholds?.maxScaleRatioDelta);
	const maxDifferenceBoundingBoxAreaRatio = Number(thresholds?.maxDifferenceBoundingBoxAreaRatio);
	const failures = [];
	if (summary.missingReferenceSlides.length > 0) {
		failures.push(`Missing reference PNG for slides: ${summary.missingReferenceSlides.join(', ')}`);
	}
	if (summary.missingRenderedSlides.length > 0) {
		failures.push(`Missing rendered PPTX PNG for slides: ${summary.missingRenderedSlides.join(', ')}`);
	}
	if (Number.isFinite(maxRmse) && Number.isFinite(summary.maxRmse) && summary.maxRmse > maxRmse) {
		failures.push(`Max RMSE ${summary.maxRmse.toFixed(6)} exceeds ${maxRmse}`);
	}
	if (Number.isFinite(meanRmse) && Number.isFinite(summary.meanRmse) && summary.meanRmse > meanRmse) {
		failures.push(`Mean RMSE ${summary.meanRmse.toFixed(6)} exceeds ${meanRmse}`);
	}
	if (
		Number.isFinite(maxScaleRatioDelta) &&
		Number.isFinite(summary.maxScaleRatioDelta) &&
		summary.maxScaleRatioDelta > maxScaleRatioDelta
	) {
		failures.push(`Max scale ratio delta ${summary.maxScaleRatioDelta.toFixed(6)} exceeds ${maxScaleRatioDelta}`);
	}
	if (
		Number.isFinite(maxDifferenceBoundingBoxAreaRatio) &&
		Number.isFinite(summary.maxDifferenceBoundingBoxAreaRatio) &&
		summary.maxDifferenceBoundingBoxAreaRatio > maxDifferenceBoundingBoxAreaRatio
	) {
		failures.push(
			`Max difference bounding-box area ratio ${summary.maxDifferenceBoundingBoxAreaRatio.toFixed(6)} exceeds ${maxDifferenceBoundingBoxAreaRatio}`,
		);
	}
	if (summary.comparablePageCount === 0) {
		failures.push('No comparable PPTX/PNG pages were found');
	}
	return {
		passed: failures.length === 0,
		failures,
		thresholds: {
			maxRmse: Number.isFinite(maxRmse) ? maxRmse : null,
			meanRmse: Number.isFinite(meanRmse) ? meanRmse : null,
			maxScaleRatioDelta: Number.isFinite(maxScaleRatioDelta) ? maxScaleRatioDelta : null,
			maxDifferenceBoundingBoxAreaRatio: Number.isFinite(maxDifferenceBoundingBoxAreaRatio)
				? maxDifferenceBoundingBoxAreaRatio
				: null,
		},
	};
}

function comparePngSequences(options) {
	const referenceDirectory = path.resolve(options.referenceDirectory);
	const renderedDirectory = path.resolve(options.renderedDirectory);
	const outputDirectory = path.resolve(options.outputDirectory);
	const resizedDirectory = path.join(outputDirectory, 'pptx-resized');
	const diffDirectory = path.join(outputDirectory, 'diff');
	const sideBySideDirectory = path.join(outputDirectory, 'side-by-side');

	resetDirectory(resizedDirectory);
	resetDirectory(diffDirectory);
	resetDirectory(sideBySideDirectory);

	const pairs = pairPngSequences(referenceDirectory, renderedDirectory);
	const pages = pairs.map((pair) => {
		if (!pair.referencePath || !pair.renderedPath) {
			return {
				slide: pair.slide,
				referencePath: pair.referencePath,
				renderedPath: pair.renderedPath,
				rmseNormalized: null,
				absoluteErrorPixels: null,
				absoluteErrorRatio: null,
			};
		}

		const referenceDimensions = identifyDimensions(pair.referencePath);
		const renderedOriginalDimensions = identifyDimensions(pair.renderedPath);
		const widthScaleRatio =
			referenceDimensions.width > 0 ? renderedOriginalDimensions.width / referenceDimensions.width : null;
		const heightScaleRatio =
			referenceDimensions.height > 0 ? renderedOriginalDimensions.height / referenceDimensions.height : null;
		const maxScaleRatioDelta =
			Number.isFinite(widthScaleRatio) && Number.isFinite(heightScaleRatio)
				? Math.max(Math.abs(widthScaleRatio - 1), Math.abs(heightScaleRatio - 1))
				: null;
		const resizedPath = path.join(resizedDirectory, formatSlideFileName(pair.slide));
		resizeRenderedImage(pair.renderedPath, referenceDimensions, resizedPath);
		const diffPath = path.join(diffDirectory, formatSlideFileName(pair.slide));
		const sideBySidePath = path.join(sideBySideDirectory, formatSlideFileName(pair.slide));
		const rmse = runCompareMetric('RMSE', pair.referencePath, resizedPath, diffPath);
		const ae = runCompareMetric('AE', pair.referencePath, resizedPath, null);
		const differenceBoundingBox = measureDifferenceBoundingBox(
			pair.referencePath,
			resizedPath,
			referenceDimensions,
		);
		const absoluteErrorPixels = Number.isFinite(ae.value) ? ae.value : null;
		const pixelCount = referenceDimensions.width * referenceDimensions.height;

		buildSideBySide(pair.referencePath, resizedPath, sideBySidePath);

		return {
			slide: pair.slide,
			referencePath: pair.referencePath,
			renderedPath: pair.renderedPath,
			resizedPath,
			diffPath,
			sideBySidePath,
			referenceDimensions,
			renderedOriginalDimensions,
			widthScaleRatio,
			heightScaleRatio,
			maxScaleRatioDelta,
			differenceBoundingBox,
			rmseRaw: rmse.raw,
			rmseNormalized: Number.isFinite(rmse.value) ? rmse.value : null,
			absoluteErrorPixels,
			absoluteErrorRatio: absoluteErrorPixels === null ? null : absoluteErrorPixels / pixelCount,
		};
	});

	const summary = summarizePageMetrics(pages);
	const metricsCsvPath = writeComparisonCsv(pages, path.join(outputDirectory, 'comparison-metrics.csv'));
	const sideBySideSheetPath = buildContactSheet(
		pages.filter((page) => page.sideBySidePath).map((page) => page.sideBySidePath),
		path.join(outputDirectory, 'all-side-by-side-sheet.png'),
		'3x',
	);
	const diffSheetPath = buildContactSheet(
		pages.filter((page) => page.diffPath).map((page) => page.diffPath),
		path.join(outputDirectory, 'all-diff-sheet.png'),
		'3x',
	);

	return {
		referenceDirectory,
		renderedDirectory,
		outputDirectory,
		resizedDirectory,
		diffDirectory,
		sideBySideDirectory,
		sideBySideSheetPath,
		diffSheetPath,
		metricsCsvPath,
		pages,
		summary,
		gate: evaluateVisualGate(summary, options.thresholds || {}),
	};
}

function buildPptxVisualDiff(options) {
	const outputDirectory = path.resolve(options.outputDirectory);
	prepareVisualDiffOutputDirectory(outputDirectory);
	const tools = collectToolAvailability();
	if (tools.missing.length > 0) {
		return {
			available: false,
			outputDirectory,
			tools,
			error: `Missing required tools: ${tools.missing.join(', ')}`,
			gate: {
				passed: false,
				failures: [`Missing required tools: ${tools.missing.join(', ')}`],
				thresholds: options.thresholds || {},
			},
		};
	}

	const render = renderPptxToPngSequence({
		pptxPath: options.pptxPath,
		outputDirectory,
		dpi: options.dpi,
		timeoutMs: options.timeoutMs,
	});
	const reference = options.referenceDirectory
		? {
				source: 'external-png-sequence',
				referenceDirectory: path.resolve(options.referenceDirectory),
				referenceImages: collectPngSequence(options.referenceDirectory).map((imagePath, index) => ({
					slide: index + 1,
					imagePath,
				})),
			}
		: extractPptxBackgroundImages({
				pptxPath: options.pptxPath,
				outputDirectory,
			});
	const comparison = comparePngSequences({
		referenceDirectory: reference.referenceDirectory,
		renderedDirectory: render.renderedDirectory,
		outputDirectory,
		thresholds: options.thresholds,
	});
	const report = {
		available: true,
		outputDirectory,
		tools,
		reference,
		render,
		comparison,
		gate: comparison.gate,
	};
	fs.writeFileSync(
		path.join(outputDirectory, 'pptx-visual-diff.report.json'),
		JSON.stringify(report, null, 2),
		'utf8',
	);
	return report;
}

module.exports = {
	REQUIRED_TOOLS,
	buildPptxVisualDiff,
	collectPngSequence,
	collectToolAvailability,
	comparePngSequences,
	evaluateVisualGate,
	extractPptxBackgroundImages,
	pairPngSequences,
	parseCompareMetric,
	parseGeometryBox,
	renderPptxToPngSequence,
	summarizePageMetrics,
	writeComparisonCsv,
};
