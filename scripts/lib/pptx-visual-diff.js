const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { unzipSync } = require('fflate');

function collectCoreImageDiffTools(platform = process.platform) {
	const tools = [
		{ command: 'identify', args: ['-version'] },
		{ command: 'compare', args: ['-version'] },
		{ command: 'montage', args: ['-version'] },
	];
	if (platform === 'win32') {
		return [...tools, { command: 'magick', args: ['-version'] }];
	}
	return [tools[0], { command: 'convert', args: ['-version'] }, tools[1], tools[2]];
}

const CORE_IMAGE_DIFF_TOOLS = collectCoreImageDiffTools();

const LIBREOFFICE_RENDER_TOOLS = [
	{ command: 'libreoffice', args: ['--version'] },
	{ command: 'pdftoppm', args: ['-v'] },
];

const POWERPOINT_RENDER_SCRIPT = path.join(__dirname, 'powerpoint-render-pptx.ps1');
const POWERPOINT_RENDERER_TIMEOUT_MS = 240000;

const OPTIONAL_COMPARE_METRICS = ['PHASH', 'NCC', 'SSIM'];
const DEFAULT_OPTIONAL_COMPARE_METRIC_TIMEOUT_MS = 60000;

const VISUAL_DIAGNOSTIC_LIMITS = {
	rmse: {
		low: 0.08,
		medium: 0.12,
		high: 0.2,
	},
	scaleDrift: {
		low: 0.015,
		medium: 0.035,
		high: 0.06,
	},
	diffArea: {
		low: 0.08,
		medium: 0.28,
		high: 0.55,
	},
};

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
	const errorCode = result.error?.code || null;
	return {
		command,
		args,
		status: result.status,
		signal: result.signal || null,
		stdout: result.stdout || '',
		stderr: result.stderr || '',
		error: result.error ? result.error.message : null,
		errorCode,
		timedOut: errorCode === 'ETIMEDOUT',
	};
}

function collectToolAvailability(tools = CORE_IMAGE_DIFF_TOOLS) {
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

function resolveImageMagickResizeCommand(platform = process.platform) {
	if (platform === 'win32') {
		return {
			command: 'magick',
			argsPrefix: [],
		};
	}
	return {
		command: 'convert',
		argsPrefix: [],
	};
}

function isToolAvailable(tool) {
	const availability = collectToolAvailability([tool]);
	return availability.checked[0]?.available === true;
}

function collectRendererAvailability() {
	const libreoffice = LIBREOFFICE_RENDER_TOOLS.every((tool) => isToolAvailable(tool));
	const powershell = process.platform === 'win32' && isToolAvailable({ command: 'powershell', args: ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'] });
	let powerpoint = false;
	let powerpointError = null;
	if (powershell) {
		const result = runCommand(
			'powershell',
			[
				'-NoProfile',
				'-NonInteractive',
				'-ExecutionPolicy',
				'Bypass',
				'-Command',
				'$ErrorActionPreference = "Stop"; $pp = New-Object -ComObject PowerPoint.Application; $pp.Quit(); Write-Output "PowerPoint COM available"',
			],
			{ timeout: 60000 },
		);
		powerpoint = result.status === 0 && !result.error;
		powerpointError = powerpoint ? null : result.stderr || result.stdout || result.error || 'PowerPoint COM unavailable';
	}

	return {
		libreoffice,
		powerpoint,
		powershell,
		powerpointError,
	};
}

function resolvePptxVisualRenderer({ requestedRenderer = 'auto', platform = process.platform, availability }) {
	if (requestedRenderer === 'libreoffice') {
		return { renderer: 'libreoffice', reason: 'requested-libreoffice' };
	}
	if (requestedRenderer === 'powerpoint') {
		return { renderer: 'powerpoint', reason: 'requested-powerpoint' };
	}
	if (platform === 'win32' && availability.powerpoint) {
		return { renderer: 'powerpoint', reason: 'windows-powerpoint-available' };
	}
	if (availability.libreoffice) {
		return { renderer: 'libreoffice', reason: 'libreoffice-available' };
	}
	if (availability.powerpoint) {
		return { renderer: 'powerpoint', reason: 'powerpoint-available' };
	}
	return { renderer: 'libreoffice', reason: 'fallback-libreoffice-missing' };
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
	const renderer = options.renderer || 'libreoffice';
	if (renderer === 'powerpoint') {
		return renderPptxToPngSequenceWithPowerPoint(options);
	}

	return renderPptxToPngSequenceWithLibreOffice(options);
}

function renderPptxToPngSequenceWithLibreOffice(options) {
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
		renderer: 'libreoffice',
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

function renderPptxToPngSequenceWithPowerPoint(options) {
	const pptxPath = path.resolve(options.pptxPath);
	const outputDirectory = path.resolve(options.outputDirectory);
	const workDirectory = path.resolve(options.workDirectory || path.join(outputDirectory, 'work'));
	const rawDirectory = path.resolve(options.rawDirectory || path.join(workDirectory, 'powerpoint-raw'));
	const renderedDirectory = path.resolve(options.renderedDirectory || path.join(outputDirectory, 'pptx-rendered'));
	const width = Number.isFinite(Number(options.width)) ? Number(options.width) : 1960;
	const height = Number.isFinite(Number(options.height)) ? Number(options.height) : 1104;
	const timeoutMs = Number(options.timeoutMs) || POWERPOINT_RENDERER_TIMEOUT_MS;

	if (!fs.existsSync(pptxPath)) {
		throw new Error(`PPTX file does not exist: ${pptxPath}`);
	}

	resetDirectory(workDirectory);
	resetDirectory(rawDirectory);
	resetDirectory(renderedDirectory);

	const result = runCommand(
		'powershell',
		[
			'-NoProfile',
			'-NonInteractive',
			'-ExecutionPolicy',
			'Bypass',
			'-File',
			POWERPOINT_RENDER_SCRIPT,
			'-PptxPath',
			pptxPath,
			'-OutputDirectory',
			rawDirectory,
			'-Width',
			String(width),
			'-Height',
			String(height),
		],
		{ timeout: timeoutMs },
	);
	if (result.status !== 0) {
		throw new Error(
			`PowerPoint PPTX export failed: ${result.stderr || result.stdout || result.error || 'unknown error'}`,
		);
	}

	let metadata = {};
	try {
		metadata = JSON.parse(result.stdout.trim());
	} catch (_error) {
		metadata = {};
	}

	const rawImages = collectPngSequence(rawDirectory);
	const renderedImages = rawImages.map((imagePath, index) => {
		const target = path.join(renderedDirectory, formatSlideFileName(index + 1));
		fs.copyFileSync(imagePath, target);
		return target;
	});

	return {
		pptxPath,
		renderer: 'powerpoint',
		renderedDirectory,
		renderedImages,
		width,
		height,
		metadata,
		commands: {
			powerpoint: {
				status: result.status,
				stdout: result.stdout.trim(),
				stderr: result.stderr.trim(),
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
	if (/^inf(?:inity)?$/i.test(text)) {
		return {
			raw: text,
			value: Number.POSITIVE_INFINITY,
			normalized: false,
		};
	}
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

function collectCompareMetricSupport() {
	const result = runCommand('compare', ['-list', 'metric'], { timeout: 30000 });
	if (result.status !== 0) {
		return {
			available: false,
			metrics: [],
			error: result.stderr || result.stdout || result.error || 'compare -list metric failed',
		};
	}
	const metrics = (result.stdout || result.stderr)
		.split(/\r?\n/)
		.map((line) => line.trim().toUpperCase())
		.filter(Boolean);
	return {
		available: true,
		metrics,
		error: null,
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

function resolvePositiveInteger(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function runCompareMetric(metric, referencePath, renderedPath, outputPath, options = {}) {
	const args = ['-metric', metric, referencePath, renderedPath, outputPath || 'null:'];
	const timeoutMs = resolvePositiveInteger(options.timeoutMs, DEFAULT_OPTIONAL_COMPARE_METRIC_TIMEOUT_MS);
	const result = runCommand('compare', args, { timeout: timeoutMs });
	if (result.timedOut) {
		throw new Error(`ImageMagick compare ${metric} timed out after ${timeoutMs}ms`);
	}
	if (![0, 1].includes(result.status)) {
		throw new Error(
			`ImageMagick compare ${metric} failed: ${result.stderr || result.stdout || result.error || 'unknown error'}`,
		);
	}
	return parseCompareMetric(result.stderr || result.stdout);
}

function unavailableOptionalCompareMetric(metric, reason, error = null) {
	return {
		metric,
		available: false,
		value: null,
		normalized: false,
		reason,
		error,
	};
}

function optionalCompareMetricReason(error) {
	const message = error instanceof Error ? error.message : String(error);
	if (/timed out/i.test(message)) {
		return {
			reason: 'metric-timeout',
			error: message,
		};
	}
	return {
		reason: 'metric-command-failed',
		error: message,
	};
}

function runOptionalCompareMetric(metric, referencePath, renderedPath, metricSupport, options = {}) {
	const normalizedMetric = String(metric || '').trim().toUpperCase();
	const timeoutMs = resolvePositiveInteger(options.timeoutMs, DEFAULT_OPTIONAL_COMPARE_METRIC_TIMEOUT_MS);
	if (!metricSupport?.available) {
		return unavailableOptionalCompareMetric(
			normalizedMetric,
			'metric-support-unavailable',
			metricSupport?.error || 'metric support unavailable',
		);
	}
	if (!metricSupport.metrics.includes(normalizedMetric)) {
		return unavailableOptionalCompareMetric(normalizedMetric, 'unsupported-by-imagemagick');
	}
	try {
		const parsed = runCompareMetric(normalizedMetric, referencePath, renderedPath, null, { timeoutMs });
		return {
			metric: normalizedMetric,
			available: Number.isFinite(parsed.value) || parsed.value === Number.POSITIVE_INFINITY,
			raw: parsed.raw,
			value: Number.isFinite(parsed.value) || parsed.value === Number.POSITIVE_INFINITY ? parsed.value : null,
			normalized: parsed.normalized,
			reason: Number.isFinite(parsed.value) || parsed.value === Number.POSITIVE_INFINITY ? null : 'metric-output-unparsed',
			error: null,
			timeoutMs,
		};
	} catch (error) {
		const reason = optionalCompareMetricReason(error);
		return {
			...unavailableOptionalCompareMetric(normalizedMetric, reason.reason, reason.error),
			timeoutMs,
		};
	}
}

function levelFor(value, limits) {
	if (!Number.isFinite(value)) {
		return 'unavailable';
	}
	if (value <= limits.low) {
		return 'low';
	}
	if (value <= limits.medium) {
		return 'medium';
	}
	if (value <= limits.high) {
		return 'high';
	}
	return 'critical';
}

function buildDifferenceGeometry(differenceBoundingBox) {
	if (!differenceBoundingBox?.available || !Number.isFinite(differenceBoundingBox.areaRatio)) {
		return {
			available: false,
			centerOffsetXRatio: null,
			centerOffsetYRatio: null,
			maxCenterOffsetRatio: null,
		};
	}
	const referenceWidth = Number(differenceBoundingBox.referenceWidth);
	const referenceHeight = Number(differenceBoundingBox.referenceHeight);
	if (!Number.isFinite(referenceWidth) || !Number.isFinite(referenceHeight) || referenceWidth <= 0 || referenceHeight <= 0) {
		return {
			available: false,
			centerOffsetXRatio: null,
			centerOffsetYRatio: null,
			maxCenterOffsetRatio: null,
		};
	}
	const boxCenterX = differenceBoundingBox.x + differenceBoundingBox.width / 2;
	const boxCenterY = differenceBoundingBox.y + differenceBoundingBox.height / 2;
	const centerOffsetXRatio = Math.abs(boxCenterX - referenceWidth / 2) / referenceWidth;
	const centerOffsetYRatio = Math.abs(boxCenterY - referenceHeight / 2) / referenceHeight;
	return {
		available: true,
		centerOffsetXRatio,
		centerOffsetYRatio,
		maxCenterOffsetRatio: Math.max(centerOffsetXRatio, centerOffsetYRatio),
	};
}

function diagnoseVisualPage(page, context = {}) {
	if (!page.referencePath || !page.renderedPath) {
		return {
			status: !page.referencePath ? 'missing-reference' : 'missing-rendered',
			rmseLevel: 'unavailable',
			scaleDriftLevel: 'unavailable',
			diffAreaLevel: 'unavailable',
			textAntialiasDriftLikely: false,
			rendererNoiseLikely: false,
			referenceContractDriftLikely: false,
			layoutDriftLikely: true,
			reviewPriority: 'high',
			rationale: [!page.referencePath ? 'missing reference image' : 'missing rendered image'],
		};
	}

	const rmse = Number(page.rmseNormalized);
	const scaleDrift = Number(page.maxScaleRatioDelta);
	const diffAreaRatio = Number(page.differenceBoundingBox?.areaRatio);
	const rmseLevel = levelFor(rmse, VISUAL_DIAGNOSTIC_LIMITS.rmse);
	const scaleDriftLevel = levelFor(scaleDrift, VISUAL_DIAGNOSTIC_LIMITS.scaleDrift);
	const diffAreaLevel = levelFor(diffAreaRatio, VISUAL_DIAGNOSTIC_LIMITS.diffArea);
	const lowScaleDrift = !Number.isFinite(scaleDrift) || scaleDrift <= VISUAL_DIAGNOSTIC_LIMITS.scaleDrift.low;
	const acceptableScaleDrift = !Number.isFinite(scaleDrift) || scaleDrift <= 0.025;
	const lowOrMediumRmse = Number.isFinite(rmse) && rmse <= VISUAL_DIAGNOSTIC_LIMITS.rmse.medium;
	const highDiffSpread = Number.isFinite(diffAreaRatio) && diffAreaRatio >= VISUAL_DIAGNOSTIC_LIMITS.diffArea.medium;
	const textAntialiasDriftLikely = lowOrMediumRmse && acceptableScaleDrift && highDiffSpread;
	const rendererNoiseLikely =
		(Number.isFinite(rmse) && rmse <= VISUAL_DIAGNOSTIC_LIMITS.rmse.medium && lowScaleDrift) ||
		textAntialiasDriftLikely;
	const referenceSource = context.referenceSource || page.referenceSource || null;
	const usesExternalReference = referenceSource === 'external-png-sequence';
	const scaleDriftExceedsLayoutLimit =
		Number.isFinite(scaleDrift) && scaleDrift > VISUAL_DIAGNOSTIC_LIMITS.scaleDrift.medium;
	const referenceContractDriftLikely =
		usesExternalReference &&
		!scaleDriftExceedsLayoutLimit &&
		Number.isFinite(rmse) &&
		rmse > VISUAL_DIAGNOSTIC_LIMITS.rmse.medium;
	const layoutDriftLikely =
		scaleDriftExceedsLayoutLimit ||
		(!referenceContractDriftLikely &&
			((Number.isFinite(rmse) && rmse > VISUAL_DIAGNOSTIC_LIMITS.rmse.high) ||
				(Number.isFinite(rmse) &&
					rmse > VISUAL_DIAGNOSTIC_LIMITS.rmse.medium &&
					Number.isFinite(scaleDrift) &&
					scaleDrift > VISUAL_DIAGNOSTIC_LIMITS.scaleDrift.low)));
	const rationale = [];
	if (textAntialiasDriftLikely) {
		rationale.push('wide diff region with low RMSE and low scale drift');
	}
	if (referenceContractDriftLikely) {
		rationale.push('external reference has high RMSE without layout-scale drift');
	}
	if (layoutDriftLikely) {
		rationale.push('RMSE or scale drift exceeds layout-review limits');
	}
	if (rendererNoiseLikely && !layoutDriftLikely) {
		rationale.push('metrics fit renderer/subpixel noise profile');
	}
	if (rationale.length === 0) {
		rationale.push('no dominant visual drift signal');
	}

	return {
		status: layoutDriftLikely
			? 'layout-review'
			: referenceContractDriftLikely
				? 'reference-contract-review'
				: rendererNoiseLikely
					? 'renderer-noise-review'
					: 'within-advisory-range',
		rmseLevel,
		scaleDriftLevel,
		diffAreaLevel,
		textAntialiasDriftLikely,
		rendererNoiseLikely,
		referenceContractDriftLikely,
		layoutDriftLikely,
		reviewPriority: layoutDriftLikely ? 'high' : rendererNoiseLikely ? 'low' : 'medium',
		rationale,
	};
}

function measureDifferenceBoundingBox(referencePath, renderedPath, referenceDimensions, thresholdPercent = 8) {
	const differenceCommand = resolveImageMagickResizeCommand();
	const result = runCommand(
		differenceCommand.command,
		[
			...differenceCommand.argsPrefix,
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
			referenceWidth: referenceDimensions.width,
			referenceHeight: referenceDimensions.height,
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
		referenceWidth: referenceDimensions.width,
		referenceHeight: referenceDimensions.height,
		...box,
		areaRatio: pixelCount > 0 ? (box.width * box.height) / pixelCount : null,
	};
}

function resizeRenderedImage(renderedPath, referenceDimensions, outputPath) {
	const geometry = `${referenceDimensions.width}x${referenceDimensions.height}!`;
	const resizeCommand = resolveImageMagickResizeCommand();
	const result = runCommand(
		resizeCommand.command,
		[...resizeCommand.argsPrefix, renderedPath, '-resize', geometry, outputPath],
		{ timeout: 60000 },
	);
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

function tryBuildContactSheet(inputPaths, outputPath, tile = '3x') {
	try {
		return {
			path: buildContactSheet(inputPaths, outputPath, tile),
			warning: null,
		};
	} catch (error) {
		return {
			path: null,
			warning: error instanceof Error ? error.message : String(error),
		};
	}
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
		'difference_bbox_center_offset_x_ratio',
		'difference_bbox_center_offset_y_ratio',
		'difference_bbox_max_center_offset_ratio',
		'phash',
		'ncc',
		'ssim',
		'phash_reason',
		'ncc_reason',
		'ssim_reason',
		'rmse_level',
		'scale_drift_level',
		'diff_area_level',
		'text_antialias_drift_likely',
		'renderer_noise_likely',
		'reference_contract_drift_likely',
		'layout_drift_likely',
		'review_priority',
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
		page.differenceGeometry?.centerOffsetXRatio,
		page.differenceGeometry?.centerOffsetYRatio,
		page.differenceGeometry?.maxCenterOffsetRatio,
		page.optionalCompareMetrics?.PHASH?.value,
		page.optionalCompareMetrics?.NCC?.value,
		page.optionalCompareMetrics?.SSIM?.value,
		page.optionalCompareMetrics?.PHASH?.reason,
		page.optionalCompareMetrics?.NCC?.reason,
		page.optionalCompareMetrics?.SSIM?.reason,
		page.diagnostics?.rmseLevel,
		page.diagnostics?.scaleDriftLevel,
		page.diagnostics?.diffAreaLevel,
		page.diagnostics?.textAntialiasDriftLikely,
		page.diagnostics?.rendererNoiseLikely,
		page.diagnostics?.referenceContractDriftLikely,
		page.diagnostics?.layoutDriftLikely,
		page.diagnostics?.reviewPriority,
		page.referencePath,
		page.renderedPath,
		page.resizedPath,
		page.diffPath,
		page.sideBySidePath,
	]);
	fs.writeFileSync(outputPath, [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n'), 'utf8');
	return outputPath;
}

function summarizeOptionalCompareMetrics(pages) {
	const summary = {
		requestedMetricCount: 0,
		availableMetricCount: 0,
		unavailableMetricCount: 0,
		timedOutMetricCount: 0,
		unsupportedMetricCount: 0,
		unparsedMetricCount: 0,
		commandFailedMetricCount: 0,
		unavailableReasons: {},
	};
	for (const page of pages) {
		for (const metricResult of Object.values(page.optionalCompareMetrics || {})) {
			summary.requestedMetricCount += 1;
			if (metricResult?.available) {
				summary.availableMetricCount += 1;
				continue;
			}
			summary.unavailableMetricCount += 1;
			const reason = metricResult?.reason || 'unknown';
			summary.unavailableReasons[reason] = (summary.unavailableReasons[reason] || 0) + 1;
			if (reason === 'metric-timeout') {
				summary.timedOutMetricCount += 1;
			} else if (reason === 'unsupported-by-imagemagick') {
				summary.unsupportedMetricCount += 1;
			} else if (reason === 'metric-output-unparsed') {
				summary.unparsedMetricCount += 1;
			} else if (reason === 'metric-command-failed') {
				summary.commandFailedMetricCount += 1;
			}
		}
	}
	return summary;
}

function summarizePageMetrics(pages) {
	const comparablePages = pages.filter((page) => Number.isFinite(page.rmseNormalized));
	const pagesWithDiagnostics = pages.map((page) => ({
		...page,
		diagnostics: page.diagnostics || diagnoseVisualPage(page),
	}));
	const comparablePagesWithDiagnostics = pagesWithDiagnostics.filter((page) => Number.isFinite(page.rmseNormalized));
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
	const diagnosticCounts = comparablePagesWithDiagnostics.reduce(
		(counts, page) => {
			if (page.diagnostics.textAntialiasDriftLikely) counts.textAntialiasDriftLikely += 1;
			if (page.diagnostics.rendererNoiseLikely) counts.rendererNoiseLikely += 1;
			if (page.diagnostics.referenceContractDriftLikely) counts.referenceContractDriftLikely += 1;
			if (page.diagnostics.layoutDriftLikely) counts.layoutDriftLikely += 1;
			return counts;
		},
		{
			textAntialiasDriftLikely: 0,
			rendererNoiseLikely: 0,
			referenceContractDriftLikely: 0,
			layoutDriftLikely: 0,
		},
	);
	const worstLikelyLayoutDriftSlides = comparablePagesWithDiagnostics
		.filter((page) => page.diagnostics.layoutDriftLikely)
		.sort((left, right) => {
			const rmseDelta = (right.rmseNormalized ?? -1) - (left.rmseNormalized ?? -1);
			if (rmseDelta !== 0) return rmseDelta;
			return (right.maxScaleRatioDelta ?? -1) - (left.maxScaleRatioDelta ?? -1);
		})
		.slice(0, 12)
		.map((page) => ({
			slide: page.slide,
			rmseNormalized: page.rmseNormalized,
			maxScaleRatioDelta: page.maxScaleRatioDelta,
			differenceBoundingBox: page.differenceBoundingBox,
			diagnostics: page.diagnostics,
			sideBySidePath: page.sideBySidePath,
			diffPath: page.diffPath,
		}));
	const likelyRendererNoiseSlides = comparablePagesWithDiagnostics
		.filter((page) => page.diagnostics.rendererNoiseLikely && !page.diagnostics.layoutDriftLikely)
		.map((page) => page.slide);
	const textAntialiasDriftSlides = comparablePagesWithDiagnostics
		.filter((page) => page.diagnostics.textAntialiasDriftLikely)
		.map((page) => page.slide);
	const referenceContractDriftSlides = comparablePagesWithDiagnostics
		.filter((page) => page.diagnostics.referenceContractDriftLikely)
		.map((page) => page.slide);

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
		advisoryMetrics: {
			limits: VISUAL_DIAGNOSTIC_LIMITS,
			optionalCompareMetrics: summarizeOptionalCompareMetrics(pages),
			diagnosticCounts,
			likelyRendererNoiseSlides,
			textAntialiasDriftSlides,
			referenceContractDriftSlides,
			worstLikelyLayoutDriftSlides,
		},
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
	const optionalMetricSupport = collectCompareMetricSupport();
	const optionalMetricTimeoutMs = resolvePositiveInteger(
		options.optionalMetricTimeoutMs,
		DEFAULT_OPTIONAL_COMPARE_METRIC_TIMEOUT_MS,
	);

	resetDirectory(resizedDirectory);
	resetDirectory(diffDirectory);
	resetDirectory(sideBySideDirectory);

	const pairs = pairPngSequences(referenceDirectory, renderedDirectory);
	const pages = pairs.map((pair) => {
		if (!pair.referencePath || !pair.renderedPath) {
			const page = {
				slide: pair.slide,
				referencePath: pair.referencePath,
				renderedPath: pair.renderedPath,
				rmseNormalized: null,
				absoluteErrorPixels: null,
				absoluteErrorRatio: null,
			};
			page.diagnostics = diagnoseVisualPage(page, { referenceSource: options.referenceSource });
			return page;
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
		const differenceGeometry = buildDifferenceGeometry(differenceBoundingBox);
		const optionalCompareMetrics = Object.fromEntries(
			OPTIONAL_COMPARE_METRICS.map((metric) => [
				metric,
				runOptionalCompareMetric(metric, pair.referencePath, resizedPath, optionalMetricSupport, {
					timeoutMs: optionalMetricTimeoutMs,
				}),
			]),
		);
		const absoluteErrorPixels = Number.isFinite(ae.value) ? ae.value : null;
		const pixelCount = referenceDimensions.width * referenceDimensions.height;

		buildSideBySide(pair.referencePath, resizedPath, sideBySidePath);

		const page = {
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
			differenceGeometry,
			optionalCompareMetrics,
			rmseRaw: rmse.raw,
			rmseNormalized: Number.isFinite(rmse.value) ? rmse.value : null,
			absoluteErrorPixels,
			absoluteErrorRatio: absoluteErrorPixels === null ? null : absoluteErrorPixels / pixelCount,
		};
		page.diagnostics = diagnoseVisualPage(page, { referenceSource: options.referenceSource });
		return page;
	});

	const summary = summarizePageMetrics(pages);
	const metricsCsvPath = writeComparisonCsv(pages, path.join(outputDirectory, 'comparison-metrics.csv'));
	const contactSheetWarnings = [];
	const sideBySideSheet = tryBuildContactSheet(
		pages.filter((page) => page.sideBySidePath).map((page) => page.sideBySidePath),
		path.join(outputDirectory, 'all-side-by-side-sheet.png'),
		'3x',
	);
	if (sideBySideSheet.warning) {
		contactSheetWarnings.push(sideBySideSheet.warning);
	}
	const diffSheet = tryBuildContactSheet(
		pages.filter((page) => page.diffPath).map((page) => page.diffPath),
		path.join(outputDirectory, 'all-diff-sheet.png'),
		'3x',
	);
	if (diffSheet.warning) {
		contactSheetWarnings.push(diffSheet.warning);
	}

	return {
		referenceDirectory,
		renderedDirectory,
		outputDirectory,
		resizedDirectory,
		diffDirectory,
		sideBySideDirectory,
		sideBySideSheetPath: sideBySideSheet.path,
		diffSheetPath: diffSheet.path,
		contactSheetWarnings,
		metricsCsvPath,
		optionalMetricSupport,
		optionalMetricPolicy: {
			metrics: OPTIONAL_COMPARE_METRICS,
			timeoutMs: optionalMetricTimeoutMs,
			hardGate: false,
		},
		pages,
		summary,
		gate: evaluateVisualGate(summary, options.thresholds || {}),
	};
}

function buildPptxVisualDiff(options) {
	const outputDirectory = path.resolve(options.outputDirectory);
	prepareVisualDiffOutputDirectory(outputDirectory);
	const availability = collectRendererAvailability();
	const rendererSelection = resolvePptxVisualRenderer({
		requestedRenderer: options.renderer || 'auto',
		platform: process.platform,
		availability,
	});
	const requiredTools = rendererSelection.renderer === 'powerpoint'
		? CORE_IMAGE_DIFF_TOOLS
		: [...LIBREOFFICE_RENDER_TOOLS, ...CORE_IMAGE_DIFF_TOOLS];
	const tools = collectToolAvailability(requiredTools);
	const missingReasons = [...tools.missing];
	if (rendererSelection.renderer === 'powerpoint' && !availability.powerpoint) {
		missingReasons.push(`powerpoint-com${availability.powershell ? '' : ' (powershell unavailable)'}`);
	}
	if (missingReasons.length > 0) {
		return {
			available: false,
			outputDirectory,
			tools,
			rendererSelection,
			error: `Missing required tools: ${missingReasons.join(', ')}`,
			gate: {
				passed: false,
			failures: [`Missing required tools: ${missingReasons.join(', ')}`],
			thresholds: options.thresholds || {},
		},
	};
}

	const explicitReferenceSource = options.referenceSource || 'external-png-sequence';
	const reference = options.referenceDirectory
		? {
				source: explicitReferenceSource,
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
	const derivedPowerPointRenderSize =
		rendererSelection.renderer === 'powerpoint' && !Number.isFinite(Number(options.width)) && !Number.isFinite(Number(options.height))
			? (() => {
					const firstReferenceImage = reference.referenceImages?.[0]?.imagePath;
					if (!firstReferenceImage || !fs.existsSync(firstReferenceImage)) {
						return null;
					}
					try {
						const dimensions = identifyDimensions(firstReferenceImage);
						return {
							width: dimensions.width,
							height: dimensions.height,
						};
					} catch (_error) {
						return null;
					}
				})()
			: null;
	const render = renderPptxToPngSequence({
		pptxPath: options.pptxPath,
		outputDirectory,
		dpi: options.dpi,
		renderer: rendererSelection.renderer,
		timeoutMs: options.timeoutMs,
		width: derivedPowerPointRenderSize?.width,
		height: derivedPowerPointRenderSize?.height,
	});
	const comparison = comparePngSequences({
		referenceDirectory: reference.referenceDirectory,
		renderedDirectory: render.renderedDirectory,
		outputDirectory,
		referenceSource: reference.source,
		thresholds: options.thresholds,
		optionalMetricTimeoutMs: options.optionalMetricTimeoutMs,
	});
	const report = {
		available: true,
		outputDirectory,
		tools,
		rendererSelection,
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
	CORE_IMAGE_DIFF_TOOLS,
	LIBREOFFICE_RENDER_TOOLS,
	OPTIONAL_COMPARE_METRICS,
	DEFAULT_OPTIONAL_COMPARE_METRIC_TIMEOUT_MS,
	VISUAL_DIAGNOSTIC_LIMITS,
	buildPptxVisualDiff,
	collectCoreImageDiffTools,
	collectRendererAvailability,
	collectCompareMetricSupport,
	collectPngSequence,
	collectToolAvailability,
	comparePngSequences,
	diagnoseVisualPage,
	evaluateVisualGate,
	extractPptxBackgroundImages,
	pairPngSequences,
	parseCompareMetric,
	parseGeometryBox,
	resolveImageMagickResizeCommand,
	resolvePptxVisualRenderer,
	renderPptxToPngSequence,
	runOptionalCompareMetric,
	summarizePageMetrics,
	writeComparisonCsv,
};
