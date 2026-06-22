import { strToU8, zipSync } from 'fflate';
import {
	PPTX_SLIDE_HEIGHT_EMU,
	PPTX_SLIDE_WIDTH_EMU,
	SLIDEV_PPTX_VISIBLE_TEXT_SOURCE_KINDS,
	type SlidevPptxDocument,
	type SlidevPptxFontPolicy,
	type SlidevPptxImage,
	type SlidevPptxRichTextParagraph,
	type SlidevPptxSlide,
	type SlidevPptxSolidRectangle,
	type SlidevPptxTable,
	type SlidevPptxTableCell,
	type SlidevPptxTextAlign,
	type SlidevPptxTextBox,
	type SlidevPptxTextSourceKind,
} from './pptxModel';
import { resolveSlidevPptxFontPolicy, splitPptxTextIntoOfficeFontRuns } from './pptxFontContract';
import { safeRequire } from './platformUtils';

const EMU_PER_INCH = 914400;

interface SlideImageRelationship {
	image: SlidevPptxImage;
	relationshipId: string;
	mediaPath: string;
}

interface SlideHyperlinkRelationship {
	relationshipId: string;
	target: string;
}

type PptxWriterContext = {
	fontPolicy: SlidevPptxFontPolicy;
	registerHyperlinkTarget: (target: string | undefined) => string;
};

type PptxPackageContext = Pick<PptxWriterContext, 'fontPolicy'>;

function escapeXml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeXmlAttribute(value: string): string {
	return escapeXml(value).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function normalizeOfficeHyperlinkTarget(value: string | undefined): string {
	const target = String(value || '').trim();
	if (!target || target.length > 2048 || /[\u0000-\u001f\u007f]/.test(target)) {
		return '';
	}
	if (/^(?:javascript|data|vbscript):/i.test(target)) {
		return '';
	}
	return target;
}

function inchesToEmu(value: number): number {
	return Math.round(Math.max(0, value) * EMU_PER_INCH);
}

function clampHexColor(value: string, fallback: string): string {
	const normalized = value.trim().replace(/^#/, '').toUpperCase();
	return /^[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
}

function extensionForImage(image: SlidevPptxImage): 'png' | 'jpg' {
	return image.mimeType === 'image/jpeg' ? 'jpg' : 'png';
}

function alignToOoxml(value: SlidevPptxTextAlign): string {
	switch (value) {
		case 'center':
			return 'ctr';
		case 'right':
			return 'r';
		case 'justify':
			return 'just';
		case 'left':
		default:
			return 'l';
	}
}

function verticalAlignToOoxml(value: SlidevPptxTextBox['verticalAlign']): string {
	switch (value) {
		case 'middle':
			return 'ctr';
		case 'bottom':
			return 'b';
		case 'top':
		default:
			return 't';
	}
}

function buildTransparentTextFill(color: string): string {
	return `<a:solidFill><a:srgbClr val="${color}"><a:alpha val="0"/></a:srgbClr></a:solidFill>`;
}

function buildVisibleTextFill(color: string): string {
	return `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`;
}

function buildTextElement(text: string): string {
	const xmlSpace = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : '';
	return `<a:t${xmlSpace}>${escapeXml(text)}</a:t>`;
}

type TextRunStyle = {
	fontSize: number;
	fontFace: string;
	color: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike?: boolean;
	charSpacingPt?: number;
	hyperlinkTarget?: string;
};

function buildRunXmlWithTextFill(
	text: string,
	runStyle: TextRunStyle,
	textFillXml: string,
	language: 'en-US' | 'zh-CN',
	hyperlinkRelationshipId?: string,
): string {
	const size = Math.max(600, Math.min(14400, Math.round(runStyle.fontSize * 100)));
	const bold = runStyle.bold ? ' b="1"' : '';
	const italic = runStyle.italic ? ' i="1"' : '';
	const underline = runStyle.underline ? ' u="sng"' : '';
	const strike = runStyle.strike ? ' strike="sngStrike"' : '';
	const charSpacing =
		Number.isFinite(Number(runStyle.charSpacingPt)) && Math.abs(Number(runStyle.charSpacingPt)) >= 0.01
			? ` spc="${Math.round(Math.max(-20, Math.min(200, Number(runStyle.charSpacingPt))) * 100)}"`
			: '';
	const fontFace = escapeXmlAttribute(runStyle.fontFace || 'Aptos');
	const hyperlinkXml = hyperlinkRelationshipId
		? `<a:hlinkClick r:id="${escapeXmlAttribute(hyperlinkRelationshipId)}"/>`
		: '';

	return [
		'<a:r>',
		`<a:rPr lang="${language}" sz="${size}"${bold}${italic}${underline}${strike}${charSpacing}>`,
		textFillXml,
		`<a:latin typeface="${fontFace}"/>`,
		`<a:ea typeface="${fontFace}"/>`,
		'<a:cs typeface="Aptos"/>',
		hyperlinkXml,
		'</a:rPr>',
		buildTextElement(text),
		'</a:r>',
	].join('');
}

function buildTransparentRunXml(text: string, runStyle: TextRunStyle, context: PptxWriterContext): string {
	const color = clampHexColor(runStyle.color, '111827');
	const textFillXml = buildTransparentTextFill(color);
	const hyperlinkRelationshipId = context.registerHyperlinkTarget(runStyle.hyperlinkTarget);
	return splitPptxTextIntoOfficeFontRuns(text, runStyle.fontFace, context.fontPolicy)
		.map((officeRun) =>
			buildRunXmlWithTextFill(
				officeRun.text,
				{ ...runStyle, fontFace: officeRun.fontFace },
				textFillXml,
				officeRun.usesEastAsiaFont ? 'zh-CN' : 'en-US',
				hyperlinkRelationshipId,
			),
		)
		.join('');
}

function buildVisibleRunXml(text: string, runStyle: TextRunStyle, context: PptxWriterContext): string {
	const color = clampHexColor(runStyle.color, '111827');
	const textFillXml = buildVisibleTextFill(color);
	const hyperlinkRelationshipId = context.registerHyperlinkTarget(runStyle.hyperlinkTarget);
	return splitPptxTextIntoOfficeFontRuns(text, runStyle.fontFace, context.fontPolicy)
		.map((officeRun) =>
			buildRunXmlWithTextFill(
				officeRun.text,
				{ ...runStyle, fontFace: officeRun.fontFace },
				textFillXml,
				officeRun.usesEastAsiaFont ? 'zh-CN' : 'en-US',
				hyperlinkRelationshipId,
			),
		)
		.join('');
}

function fallbackTextParagraphs(textBox: SlidevPptxTextBox): SlidevPptxRichTextParagraph[] {
	return textBox.text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd())
		.filter((line, index, lines) => line.length > 0 || lines.length === 1)
		.map((line) => ({
			runs: [
				{
					text: line || ' ',
					fontSize: textBox.fontSize,
					fontFace: textBox.fontFace,
					color: textBox.color,
					bold: textBox.bold,
					italic: textBox.italic,
					underline: textBox.underline,
					strike: textBox.strike,
					charSpacingPt: textBox.charSpacingPt,
					hyperlinkTarget: undefined,
					code: false,
					link: false,
				},
			],
		}));
}

function splitParagraphRunsOnNewlines(paragraph: SlidevPptxRichTextParagraph): SlidevPptxRichTextParagraph[] {
	const paragraphs: SlidevPptxRichTextParagraph[] = [];
	let currentRuns: SlidevPptxRichTextParagraph['runs'] = [];
	let lastRun = paragraph.runs[0];

	const flush = (): void => {
		if (currentRuns.length > 0) {
			paragraphs.push({ runs: currentRuns });
		} else if (lastRun) {
			paragraphs.push({ runs: [{ ...lastRun, text: ' ' }] });
		}
		currentRuns = [];
	};

	for (const run of paragraph.runs) {
		lastRun = run;
		const parts = String(run.text || '').replace(/\r\n?/g, '\n').split('\n');
		for (let index = 0; index < parts.length; index += 1) {
			if (index > 0) {
				flush();
			}
			if (parts[index].length > 0) {
				currentRuns.push({ ...run, text: parts[index] });
			}
		}
	}
	flush();
	return paragraphs.filter((item) => item.runs.some((run) => String(run.text || '').length > 0));
}

function chooseTextParagraphs(textBox: SlidevPptxTextBox): SlidevPptxRichTextParagraph[] {
	const paragraphs = Array.isArray(textBox.richTextParagraphs)
		? textBox.richTextParagraphs
				.map((paragraph) => ({
					runs: Array.isArray(paragraph.runs)
						? paragraph.runs.filter((run) => String(run.text || '').length > 0)
						: [],
				}))
				.filter((paragraph) => paragraph.runs.some((run) => String(run.text || '').trim().length > 0))
		: [];
	const chosen = paragraphs.length > 0 ? paragraphs : fallbackTextParagraphs(textBox);
	return chosen.flatMap(splitParagraphRunsOnNewlines);
}

function paragraphEndFontSize(paragraph: SlidevPptxRichTextParagraph, fallbackFontSize: number): number {
	const lastRun = paragraph.runs[paragraph.runs.length - 1];
	return Math.max(600, Math.min(14400, Math.round((lastRun?.fontSize || fallbackFontSize) * 100)));
}

function pointsToSpacingValue(value: number | undefined): number {
	const numeric = Number(value);
	return Number.isFinite(numeric) && numeric > 0 ? Math.round(Math.max(0, Math.min(200, numeric)) * 100) : 0;
}

function buildParagraphSpacingXml(textBox: SlidevPptxTextBox): string {
	const spacing: string[] = [];
	const spacingBefore = pointsToSpacingValue(textBox.paragraphSpacingBeforePt);
	const spacingAfter = pointsToSpacingValue(textBox.paragraphSpacingAfterPt);
	const lineSpacing = pointsToSpacingValue(textBox.lineSpacingPt);
	if (spacingBefore > 0) {
		spacing.push(`<a:spcBef><a:spcPts val="${spacingBefore}"/></a:spcBef>`);
	}
	if (spacingAfter > 0) {
		spacing.push(`<a:spcAft><a:spcPts val="${spacingAfter}"/></a:spcAft>`);
	}
	if (lineSpacing > 0) {
		spacing.push(`<a:lnSpc><a:spcPts val="${lineSpacing}"/></a:lnSpc>`);
	}
	return spacing.join('');
}

function buildTextBoxBulletXml(textBox: SlidevPptxTextBox): { attributes: string[]; children: string } {
	if (!textBox.bullet) {
		return { attributes: [], children: '<a:buNone/>' };
	}
	const level = Math.max(0, Math.min(8, Math.floor(Number(textBox.bulletLevel) || 0)));
	const marginLeft = 342900 + level * 228600;
	return {
		attributes: [`marL="${marginLeft}"`, 'indent="-171450"'],
		children: '<a:buChar char="&#8226;"/>',
	};
}

function buildTextBoxParagraphProperties(textBox: SlidevPptxTextBox): string {
	const align = alignToOoxml(textBox.align);
	const bullet = buildTextBoxBulletXml(textBox);
	const attributes = [`algn="${align}"`, ...bullet.attributes].join(' ');
	return `<a:pPr ${attributes}>${buildParagraphSpacingXml(textBox)}${bullet.children}</a:pPr>`;
}

function buildTableCellParagraphProperties(cell: SlidevPptxTableCell): string {
	const lineSpacing = pointsToSpacingValue(cell.lineSpacingPt);
	if (lineSpacing <= 0) {
		return `<a:pPr algn="${alignToOoxml(cell.align)}"/>`;
	}
	return `<a:pPr algn="${alignToOoxml(cell.align)}"><a:lnSpc><a:spcPts val="${lineSpacing}"/></a:lnSpc></a:pPr>`;
}

function buildTextParagraphs(textBox: SlidevPptxTextBox, context: PptxWriterContext): string {
	const paragraphs = chooseTextParagraphs(textBox);
	const paragraphProperties = buildTextBoxParagraphProperties(textBox);

	return paragraphs
		.map((paragraph) =>
				[
					'<a:p>',
					paragraphProperties,
					paragraph.runs.map((run) => buildTransparentRunXml(run.text || ' ', run, context)).join(''),
					`<a:endParaRPr lang="en-US" sz="${paragraphEndFontSize(paragraph, textBox.fontSize)}"/>`,
					'</a:p>',
			].join(''),
		)
		.join('');
}

function buildVisibleTextParagraphs(textBox: SlidevPptxTextBox, context: PptxWriterContext): string {
	const paragraphs = chooseTextParagraphs(textBox);
	const paragraphProperties = buildTextBoxParagraphProperties(textBox);

	return paragraphs
		.map((paragraph) =>
				[
					'<a:p>',
					paragraphProperties,
					paragraph.runs.map((run) => buildVisibleRunXml(run.text || ' ', run, context)).join(''),
					`<a:endParaRPr lang="en-US" sz="${paragraphEndFontSize(paragraph, textBox.fontSize)}"/>`,
					'</a:p>',
			].join(''),
		)
		.join('');
}

function visibleNativeTextBodyProperties(textBox: SlidevPptxTextBox): string {
	const paragraphCount = chooseTextParagraphs(textBox).length;
	const maxSingleLineHeight = Math.max(0.18, (textBox.fontSize / 72) * 1.8);
	const browserLineBox = paragraphCount === 1 && !textBox.text.includes('\n') && textBox.h <= maxSingleLineHeight;
	const wrap = browserLineBox ? 'none' : 'square';
	const lIns = inchesToEmu(textBox.paddingLeftIn || 0);
	const rIns = inchesToEmu(textBox.paddingRightIn || 0);
	const tIns = inchesToEmu(textBox.paddingTopIn || 0);
	const bIns = inchesToEmu(textBox.paddingBottomIn || 0);
	const anchor = verticalAlignToOoxml(textBox.verticalAlign);
	return `<a:bodyPr wrap="${wrap}" lIns="${lIns}" tIns="${tIns}" rIns="${rIns}" bIns="${bIns}" rtlCol="0" anchor="${anchor}"><a:noAutofit/></a:bodyPr>`;
}

function editableTextBodyProperties(textBox: SlidevPptxTextBox): string {
	const lIns = inchesToEmu(textBox.paddingLeftIn || 0);
	const rIns = inchesToEmu(textBox.paddingRightIn || 0);
	const tIns = inchesToEmu(textBox.paddingTopIn || 0);
	const bIns = inchesToEmu(textBox.paddingBottomIn || 0);
	const anchor = verticalAlignToOoxml(textBox.verticalAlign);
	return `<a:bodyPr wrap="square" lIns="${lIns}" tIns="${tIns}" rIns="${rIns}" bIns="${bIns}" rtlCol="0" anchor="${anchor}"><a:normAutofit fontScale="100000"/></a:bodyPr>`;
}

function textShapeLabel(textBox: SlidevPptxTextBox): string {
	switch (textBox.sourceKind) {
		case 'code':
			return 'Code Text';
		case 'mermaid-text':
			return 'Mermaid Text';
		case 'svg-text':
			return 'SVG Text';
		case 'table-cell-overlay':
			return 'Table Cell Overlay Text';
		case 'body':
		default:
			return 'Text';
	}
}

function textSourceKindForDefaultLayer(textBox: SlidevPptxTextBox): SlidevPptxTextSourceKind {
	return textBox.sourceKind === 'code' ||
		textBox.sourceKind === 'mermaid-text' ||
		textBox.sourceKind === 'svg-text' ||
		textBox.sourceKind === 'table-cell-overlay'
		? textBox.sourceKind
		: 'body';
}

function isVisibleDefaultTextSource(textBox: SlidevPptxTextBox): boolean {
	return SLIDEV_PPTX_VISIBLE_TEXT_SOURCE_KINDS.includes(textSourceKindForDefaultLayer(textBox));
}

function buildTextShape(textBox: SlidevPptxTextBox, shapeId: number, context: PptxWriterContext): string {
	const x = inchesToEmu(textBox.x);
	const y = inchesToEmu(textBox.y);
	const w = inchesToEmu(textBox.w);
	const h = inchesToEmu(textBox.h);
	const name = escapeXmlAttribute(`Editable ${textShapeLabel(textBox)} ${shapeId}`);

	return [
		'<p:sp>',
		'<p:nvSpPr>',
		`<p:cNvPr id="${shapeId}" name="${name}"/>`,
		'<p:cNvSpPr txBox="1"/>',
		'<p:nvPr/>',
		'</p:nvSpPr>',
		'<p:spPr>',
		`<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`,
		'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>',
		'<a:noFill/>',
		'<a:ln><a:noFill/></a:ln>',
		'</p:spPr>',
		'<p:txBody>',
		editableTextBodyProperties(textBox),
		'<a:lstStyle/>',
		buildTextParagraphs(textBox, context),
		'</p:txBody>',
		'</p:sp>',
	].join('');
}

function buildVisibleTextShape(textBox: SlidevPptxTextBox, shapeId: number, context: PptxWriterContext): string {
	const x = inchesToEmu(textBox.x);
	const y = inchesToEmu(textBox.y);
	const w = inchesToEmu(textBox.w);
	const h = inchesToEmu(textBox.h);
	const name = escapeXmlAttribute(`Visible Native ${textShapeLabel(textBox)} ${shapeId}`);

	return [
		'<p:sp>',
		'<p:nvSpPr>',
		`<p:cNvPr id="${shapeId}" name="${name}"/>`,
		'<p:cNvSpPr txBox="1"/>',
		'<p:nvPr/>',
		'</p:nvSpPr>',
		'<p:spPr>',
		`<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`,
		'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>',
		'<a:noFill/>',
		'<a:ln><a:noFill/></a:ln>',
		'</p:spPr>',
		'<p:txBody>',
		visibleNativeTextBodyProperties(textBox),
		'<a:lstStyle/>',
		buildVisibleTextParagraphs(textBox, context),
		'</p:txBody>',
		'</p:sp>',
	].join('');
}

function buildDefaultTextShape(
	textBox: SlidevPptxTextBox,
	shapeId: number,
	hasVisibleNativeTables: boolean,
	context: PptxWriterContext,
): string | null {
	if (textBox.sourceKind === 'mermaid-text') {
		return null;
	}
	if (textBox.sourceKind === 'table-cell-overlay' && hasVisibleNativeTables) {
		return null;
	}
	return isVisibleDefaultTextSource(textBox)
		? buildVisibleTextShape(textBox, shapeId, context)
		: buildTextShape(textBox, shapeId, context);
}

function buildTableCellRun(text: string, cell: SlidevPptxTableCell, context: PptxWriterContext): string {
	return buildTransparentRunXml(text, cell, context);
}

function buildVisibleTableCellRun(text: string, cell: SlidevPptxTableCell, context: PptxWriterContext): string {
	return buildVisibleRunXml(text, cell, context);
}

function buildTableCellParagraphs(cell: SlidevPptxTableCell, context: PptxWriterContext): string {
	const lines = cell.text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd())
		.filter((line, index, allLines) => line.length > 0 || allLines.length === 1);
	const size = Math.max(600, Math.min(14400, Math.round(cell.fontSize * 100)));

	return lines
		.map((line) =>
				[
					'<a:p>',
					buildTableCellParagraphProperties(cell),
					buildTableCellRun(line || ' ', cell, context),
					`<a:endParaRPr lang="en-US" sz="${size}"/>`,
					'</a:p>',
			].join(''),
		)
		.join('');
}

function buildVisibleTableCellParagraphs(cell: SlidevPptxTableCell, context: PptxWriterContext): string {
	const lines = cell.text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd())
		.filter((line, index, allLines) => line.length > 0 || allLines.length === 1);
	const size = Math.max(600, Math.min(14400, Math.round(cell.fontSize * 100)));

	return lines
		.map((line) =>
				[
					'<a:p>',
					buildTableCellParagraphProperties(cell),
					buildVisibleTableCellRun(line || ' ', cell, context),
					`<a:endParaRPr lang="en-US" sz="${size}"/>`,
					'</a:p>',
			].join(''),
		)
		.join('');
}

function buildTableCellProperties(cell: SlidevPptxTableCell): string {
	const attributes: string[] = [];
	const invisibleBorders = [
		'<a:lnL><a:noFill/></a:lnL>',
		'<a:lnR><a:noFill/></a:lnR>',
		'<a:lnT><a:noFill/></a:lnT>',
		'<a:lnB><a:noFill/></a:lnB>',
	].join('');
	if (cell.verticalAlign === 'middle') {
		attributes.push('anchor="ctr"');
	} else if (cell.verticalAlign === 'bottom') {
		attributes.push('anchor="b"');
	}
	attributes.push(...tableCellInsetAttributes(cell));
	// Visible table paint and text stay in the DOM-derived layers until native table layout can match Slidev.
	return `<a:tcPr${attributes.length > 0 ? ` ${attributes.join(' ')}` : ''}><a:noFill/>${invisibleBorders}</a:tcPr>`;
}

function pointsToEmu(value: number): number {
	return Math.round(Math.max(0, value) * 12700);
}

function tableCellInsetAttributes(cell: SlidevPptxTableCell): string[] {
	const attributes: string[] = [];
	const insetPairs: Array<[string, number | undefined]> = [
		['marL', tableCellOfficeLeftInset(cell)],
		['marR', tableCellOfficeRightInset(cell)],
		['marT', tableCellOfficeTopInset(cell)],
		['marB', tableCellOfficeBottomInset(cell)],
	];
	for (const [attributeName, value] of insetPairs) {
		const emuValue = inchesToEmu(value || 0);
		if (emuValue > 0) {
			attributes.push(`${attributeName}="${emuValue}"`);
		}
	}
	return attributes;
}

function measuredInsetOrPadding(measuredInset: number | undefined, paddingInset: number | undefined): number | undefined {
	return Number.isFinite(Number(measuredInset)) && Number(measuredInset) > 0 ? measuredInset : paddingInset;
}

function tableCellOfficeLeftInset(cell: SlidevPptxTableCell): number | undefined {
	return cell.align === 'left' ? measuredInsetOrPadding(cell.textLeftInsetIn, cell.paddingLeftIn) : cell.paddingLeftIn;
}

function tableCellOfficeRightInset(cell: SlidevPptxTableCell): number | undefined {
	return cell.align === 'right' ? measuredInsetOrPadding(cell.textRightInsetIn, cell.paddingRightIn) : cell.paddingRightIn;
}

function tableCellOfficeTopInset(cell: SlidevPptxTableCell): number | undefined {
	return cell.verticalAlign === 'top' ? measuredInsetOrPadding(cell.textTopInsetIn, cell.paddingTopIn) : cell.paddingTopIn;
}

function tableCellOfficeBottomInset(cell: SlidevPptxTableCell): number | undefined {
	return cell.verticalAlign === 'bottom'
		? measuredInsetOrPadding(cell.textBottomInsetIn, cell.paddingBottomIn)
		: cell.paddingBottomIn;
}

function buildVisibleTableBorder(cell: SlidevPptxTableCell): string {
	const borderColor = cell.borderColor ? clampHexColor(cell.borderColor, '') : '';
	const borderWidth = pointsToEmu(cell.borderWidthPt);
	if (!borderColor || borderWidth <= 0) {
		return '<a:noFill/>';
	}
	return `<a:solidFill><a:srgbClr val="${borderColor}"/></a:solidFill>`;
}

function buildVisibleTableCellProperties(cell: SlidevPptxTableCell): string {
	const attributes: string[] = [];
	if (cell.verticalAlign === 'middle') {
		attributes.push('anchor="ctr"');
	} else if (cell.verticalAlign === 'bottom') {
		attributes.push('anchor="b"');
	}
	attributes.push(...tableCellInsetAttributes(cell));
	const fill = cell.fillColor
		? `<a:solidFill><a:srgbClr val="${clampHexColor(cell.fillColor, 'FFFFFF')}"/></a:solidFill>`
		: '<a:noFill/>';
	const borderWidth = pointsToEmu(cell.borderWidthPt);
	const borderFill = buildVisibleTableBorder(cell);
	const border =
		borderWidth > 0
			? [
					`<a:lnL w="${borderWidth}">${borderFill}</a:lnL>`,
					`<a:lnR w="${borderWidth}">${borderFill}</a:lnR>`,
					`<a:lnT w="${borderWidth}">${borderFill}</a:lnT>`,
					`<a:lnB w="${borderWidth}">${borderFill}</a:lnB>`,
				].join('')
			: [
					'<a:lnL><a:noFill/></a:lnL>',
					'<a:lnR><a:noFill/></a:lnR>',
					'<a:lnT><a:noFill/></a:lnT>',
					'<a:lnB><a:noFill/></a:lnB>',
				].join('');
	return `<a:tcPr${attributes.length > 0 ? ` ${attributes.join(' ')}` : ''}>${fill}${border}</a:tcPr>`;
}

function buildEmptyTableCell(attributes = ''): string {
	return [
		`<a:tc${attributes}>`,
		'<a:txBody>',
		'<a:bodyPr/>',
		'<a:lstStyle/>',
		'<a:p><a:endParaRPr lang="en-US"/></a:p>',
		'</a:txBody>',
		buildTableCellProperties({
			text: '',
			rowSpan: 1,
			colSpan: 1,
			fontSize: 12,
			fontFace: 'Aptos',
			color: '111827',
			bold: false,
			italic: false,
			underline: false,
			align: 'left',
			verticalAlign: 'top',
			fillColor: null,
			borderColor: null,
			borderWidthPt: 0,
		}),
		'</a:tc>',
	].join('');
}

function buildVisibleEmptyTableCell(attributes = ''): string {
	return [
		`<a:tc${attributes}>`,
		'<a:txBody>',
		'<a:bodyPr/>',
		'<a:lstStyle/>',
		'<a:p><a:endParaRPr lang="en-US"/></a:p>',
		'</a:txBody>',
		buildVisibleTableCellProperties({
			text: '',
			rowSpan: 1,
			colSpan: 1,
			fontSize: 12,
			fontFace: 'Aptos',
			color: '111827',
			bold: false,
			italic: false,
			underline: false,
			align: 'left',
			verticalAlign: 'top',
			fillColor: null,
			borderColor: null,
			borderWidthPt: 0,
		}),
		'</a:tc>',
	].join('');
}

function buildTableXml(table: SlidevPptxTable, shapeId: number, context: PptxWriterContext): string {
	const maxCols = Math.max(
		table.colWidths.length,
		...table.rows.map((row) => row.reduce((total, cell) => total + Math.max(1, cell.colSpan), 0)),
		1,
	);
	const totalRows = Math.max(table.rows.length, 1);
	type TableGridEntry = {
		cell: SlidevPptxTableCell;
		origin: boolean;
		rowSpan: number;
		colSpan: number;
		hMerge: boolean;
		vMerge: boolean;
	};
	const cellGrid: Array<Array<TableGridEntry | null>> = Array.from({ length: totalRows }, () =>
		Array.from({ length: maxCols }, () => null),
	);

	for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
		let colIndex = 0;
		for (const cell of table.rows[rowIndex]) {
			while (colIndex < maxCols && cellGrid[rowIndex][colIndex]) {
				colIndex += 1;
			}
			if (colIndex >= maxCols) break;
			const rowSpan = Math.min(Math.max(1, cell.rowSpan), totalRows - rowIndex);
			const colSpan = Math.min(Math.max(1, cell.colSpan), maxCols - colIndex);
			for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
				for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
					cellGrid[rowIndex + rowOffset][colIndex + colOffset] = {
						cell,
						origin: rowOffset === 0 && colOffset === 0,
						rowSpan,
						colSpan,
						hMerge: colOffset > 0,
						vMerge: rowOffset > 0,
					};
				}
			}
			colIndex += colSpan;
		}
	}

	const defaultColWidth = table.w / maxCols;
	const gridColumns = Array.from({ length: maxCols }, (_unused, index) => table.colWidths[index] || defaultColWidth);
	const gridColumnsXml = gridColumns.map((width) => `<a:gridCol w="${inchesToEmu(width)}"/>`).join('');
	const rowsXml = cellGrid
		.map((gridRow, rowIndex) => {
			const rowHeight = table.rowHeights[rowIndex] || table.h / totalRows;
			const cellsXml = gridRow
				.map((gridEntry) => {
					if (!gridEntry) {
						return buildEmptyTableCell();
					}
					if (!gridEntry.origin) {
						const mergeAttributes = [
							gridEntry.hMerge ? 'hMerge="1"' : '',
							gridEntry.vMerge ? 'vMerge="1"' : '',
						]
							.filter(Boolean)
							.join(' ');
						return buildEmptyTableCell(mergeAttributes ? ` ${mergeAttributes}` : '');
					}
					const gridSpan = gridEntry.colSpan > 1 ? ` gridSpan="${gridEntry.colSpan}"` : '';
					const rowSpan = gridEntry.rowSpan > 1 ? ` rowSpan="${gridEntry.rowSpan}"` : '';
					return [
						`<a:tc${gridSpan}${rowSpan}>`,
						'<a:txBody>',
						'<a:bodyPr/>',
						'<a:lstStyle/>',
						buildTableCellParagraphs(gridEntry.cell, context),
						'</a:txBody>',
						buildTableCellProperties(gridEntry.cell),
						'</a:tc>',
					].join('');
				})
				.join('');
			return `<a:tr h="${inchesToEmu(rowHeight)}">${cellsXml}</a:tr>`;
		})
		.join('');
	const name = escapeXmlAttribute(`Editable Table ${shapeId}`);

	return [
		'<p:graphicFrame>',
		'<p:nvGraphicFramePr>',
		`<p:cNvPr id="${shapeId}" name="${name}"/>`,
		'<p:cNvGraphicFramePr/>',
		'<p:nvPr/>',
		'</p:nvGraphicFramePr>',
		'<p:xfrm>',
		`<a:off x="${inchesToEmu(table.x)}" y="${inchesToEmu(table.y)}"/>`,
		`<a:ext cx="${inchesToEmu(table.w)}" cy="${inchesToEmu(table.h)}"/>`,
		'</p:xfrm>',
		'<a:graphic>',
		'<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">',
		'<a:tbl>',
		'<a:tblPr firstRow="0" lastRow="0" firstCol="0" lastCol="0" noBandRow="1" noBandCol="1"/>',
		`<a:tblGrid>${gridColumnsXml}</a:tblGrid>`,
		rowsXml,
		'</a:tbl>',
		'</a:graphicData>',
		'</a:graphic>',
		'</p:graphicFrame>',
	].join('');
}

function buildVisibleTableXml(table: SlidevPptxTable, shapeId: number, context: PptxWriterContext): string {
	const maxCols = Math.max(
		table.colWidths.length,
		...table.rows.map((row) => row.reduce((total, cell) => total + Math.max(1, cell.colSpan), 0)),
		1,
	);
	const totalRows = Math.max(table.rows.length, 1);
	type TableGridEntry = {
		cell: SlidevPptxTableCell;
		origin: boolean;
		rowSpan: number;
		colSpan: number;
		hMerge: boolean;
		vMerge: boolean;
	};
	const cellGrid: Array<Array<TableGridEntry | null>> = Array.from({ length: totalRows }, () =>
		Array.from({ length: maxCols }, () => null),
	);

	for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
		let colIndex = 0;
		for (const cell of table.rows[rowIndex]) {
			while (colIndex < maxCols && cellGrid[rowIndex][colIndex]) {
				colIndex += 1;
			}
			if (colIndex >= maxCols) break;
			const rowSpan = Math.min(Math.max(1, cell.rowSpan), totalRows - rowIndex);
			const colSpan = Math.min(Math.max(1, cell.colSpan), maxCols - colIndex);
			for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
				for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
					cellGrid[rowIndex + rowOffset][colIndex + colOffset] = {
						cell,
						origin: rowOffset === 0 && colOffset === 0,
						rowSpan,
						colSpan,
						hMerge: colOffset > 0,
						vMerge: rowOffset > 0,
					};
				}
			}
			colIndex += colSpan;
		}
	}

	const defaultColWidth = table.w / maxCols;
	const gridColumns = Array.from({ length: maxCols }, (_unused, index) => table.colWidths[index] || defaultColWidth);
	const gridColumnsXml = gridColumns.map((width) => `<a:gridCol w="${inchesToEmu(width)}"/>`).join('');
	const rowsXml = cellGrid
		.map((gridRow, rowIndex) => {
			const rowHeight = table.rowHeights[rowIndex] || table.h / totalRows;
			const cellsXml = gridRow
				.map((gridEntry) => {
					if (!gridEntry) {
						return buildVisibleEmptyTableCell();
					}
					if (!gridEntry.origin) {
						const mergeAttributes = [
							gridEntry.hMerge ? 'hMerge="1"' : '',
							gridEntry.vMerge ? 'vMerge="1"' : '',
						]
							.filter(Boolean)
							.join(' ');
						return buildVisibleEmptyTableCell(mergeAttributes ? ` ${mergeAttributes}` : '');
					}
					const gridSpan = gridEntry.colSpan > 1 ? ` gridSpan="${gridEntry.colSpan}"` : '';
					const rowSpan = gridEntry.rowSpan > 1 ? ` rowSpan="${gridEntry.rowSpan}"` : '';
					return [
						`<a:tc${gridSpan}${rowSpan}>`,
						'<a:txBody>',
						'<a:bodyPr/>',
						'<a:lstStyle/>',
						buildVisibleTableCellParagraphs(gridEntry.cell, context),
						'</a:txBody>',
						buildVisibleTableCellProperties(gridEntry.cell),
						'</a:tc>',
					].join('');
				})
				.join('');
			return `<a:tr h="${inchesToEmu(rowHeight)}">${cellsXml}</a:tr>`;
		})
		.join('');
	const name = escapeXmlAttribute(`Visible Native Table ${shapeId}`);

	return [
		'<p:graphicFrame>',
		'<p:nvGraphicFramePr>',
		`<p:cNvPr id="${shapeId}" name="${name}"/>`,
		'<p:cNvGraphicFramePr/>',
		'<p:nvPr/>',
		'</p:nvGraphicFramePr>',
		'<p:xfrm>',
		`<a:off x="${inchesToEmu(table.x)}" y="${inchesToEmu(table.y)}"/>`,
		`<a:ext cx="${inchesToEmu(table.w)}" cy="${inchesToEmu(table.h)}"/>`,
		'</p:xfrm>',
		'<a:graphic>',
		'<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">',
		'<a:tbl>',
		'<a:tblPr firstRow="0" lastRow="0" firstCol="0" lastCol="0" noBandRow="1" noBandCol="1"/>',
		`<a:tblGrid>${gridColumnsXml}</a:tblGrid>`,
		rowsXml,
		'</a:tbl>',
		'</a:graphicData>',
		'</a:graphic>',
		'</p:graphicFrame>',
	].join('');
}

function buildPicture(image: SlidevPptxImage, shapeId: number, relationshipId: string): string {
	const x = inchesToEmu(image.x);
	const y = inchesToEmu(image.y);
	const w = inchesToEmu(image.w);
	const h = inchesToEmu(image.h);
	const name = escapeXmlAttribute(image.name || `Image ${shapeId}`);

	return [
		'<p:pic>',
		'<p:nvPicPr>',
		`<p:cNvPr id="${shapeId}" name="${name}"/>`,
		'<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>',
		'<p:nvPr/>',
		'</p:nvPicPr>',
		'<p:blipFill>',
		`<a:blip r:embed="${relationshipId}"/>`,
		'<a:stretch><a:fillRect/></a:stretch>',
		'</p:blipFill>',
		'<p:spPr>',
		`<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`,
		'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>',
		'</p:spPr>',
		'</p:pic>',
	].join('');
}

function shapeLabel(shape: SlidevPptxSolidRectangle): string {
	switch (shape.sourceKind) {
		case 'code-background':
		default:
			return 'Code Background Rectangle';
	}
}

function solidRectangleGeometryXml(shape: SlidevPptxSolidRectangle): string {
	const adjustment = Math.max(0, Math.min(50000, Math.round(shape.cornerRadiusAdjustment || 0)));
	if (adjustment <= 0) {
		return '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
	}
	return `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${adjustment}"/></a:avLst></a:prstGeom>`;
}

function buildSolidRectangleShape(shape: SlidevPptxSolidRectangle, shapeId: number): string {
	const x = inchesToEmu(shape.x);
	const y = inchesToEmu(shape.y);
	const w = inchesToEmu(shape.w);
	const h = inchesToEmu(shape.h);
	const name = escapeXmlAttribute(`Native ${shapeLabel(shape)} ${shapeId}`);
	const fillColor = clampHexColor(shape.fillColor, 'FFFFFF');
	const borderColor = shape.borderColor ? clampHexColor(shape.borderColor, '') : '';
	const borderWidth = pointsToEmu(shape.borderWidthPt || 0);
	const geometryXml = solidRectangleGeometryXml(shape);
	const lineXml =
		borderColor && borderWidth > 0
			? `<a:ln w="${borderWidth}"><a:solidFill><a:srgbClr val="${borderColor}"/></a:solidFill></a:ln>`
			: '<a:ln><a:noFill/></a:ln>';

	return [
		'<p:sp>',
		'<p:nvSpPr>',
		`<p:cNvPr id="${shapeId}" name="${name}"/>`,
		'<p:cNvSpPr/>',
		'<p:nvPr/>',
		'</p:nvSpPr>',
		'<p:spPr>',
		`<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`,
		geometryXml,
		`<a:solidFill><a:srgbClr val="${fillColor}"/></a:solidFill>`,
		lineXml,
		'</p:spPr>',
		'</p:sp>',
	].join('');
}

function buildVisibleNativeExperimentSlideXml(
	slide: SlidevPptxSlide,
	imageRelationships: SlideImageRelationship[],
	context: PptxWriterContext,
): string {
	const backgroundColor = clampHexColor(slide.backgroundColor, 'FFFFFF');
	const items: Array<{ order: number; xml: string }> = [];
	let shapeId = 2;

	for (const relationship of imageRelationships) {
		items.push({
			order: relationship.image.order,
			xml: buildPicture(relationship.image, shapeId, relationship.relationshipId),
		});
		shapeId += 1;
	}

	for (const shape of slide.shapes || []) {
		items.push({
			order: shape.order,
			xml: buildSolidRectangleShape(shape, shapeId),
		});
		shapeId += 1;
	}

	for (const text of slide.texts) {
		items.push({
			order: text.order,
			xml: buildVisibleTextShape(text, shapeId, context),
		});
		shapeId += 1;
	}

	for (const table of slide.tables) {
		items.push({
			order: table.order,
			xml: buildVisibleTableXml(table, shapeId, context),
		});
		shapeId += 1;
	}

	items.sort((left, right) => left.order - right.order);

	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">',
		'<p:cSld>',
		`<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${backgroundColor}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`,
		'<p:spTree>',
		'<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>',
		'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>',
		items.map((item) => item.xml).join(''),
		'</p:spTree>',
		'</p:cSld>',
		'<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>',
		'</p:sld>',
	].join('');
}

function buildSlideXml(
	slide: SlidevPptxSlide,
	imageRelationships: SlideImageRelationship[],
	context: PptxWriterContext,
): string {
	const backgroundColor = clampHexColor(slide.backgroundColor, 'FFFFFF');
	const items: Array<{ order: number; xml: string }> = [];
	let shapeId = 2;

	for (const relationship of imageRelationships) {
		items.push({
			order: relationship.image.order,
			xml: buildPicture(relationship.image, shapeId, relationship.relationshipId),
		});
		shapeId += 1;
	}

	for (const shape of slide.shapes || []) {
		items.push({
			order: shape.order,
			xml: buildSolidRectangleShape(shape, shapeId),
		});
		shapeId += 1;
	}

	for (const text of slide.texts) {
		const textXml = buildDefaultTextShape(text, shapeId, slide.tables.length > 0, context);
		if (!textXml) continue;
		items.push({
			order: text.order,
			xml: textXml,
		});
		shapeId += 1;
	}

	for (const table of slide.tables) {
		items.push({
			order: table.order,
			xml: buildVisibleTableXml(table, shapeId, context),
		});
		shapeId += 1;
	}

	items.sort((left, right) => left.order - right.order);

	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">',
		'<p:cSld>',
		`<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${backgroundColor}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`,
		'<p:spTree>',
		'<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>',
		'<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>',
		items.map((item) => item.xml).join(''),
		'</p:spTree>',
		'</p:cSld>',
		'<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>',
		'</p:sld>',
	].join('');
}

function buildSlideRelationships(
	imageRelationships: SlideImageRelationship[],
	hyperlinkRelationships: SlideHyperlinkRelationship[],
): string {
	const imageRels = imageRelationships.map(
		(relationship) =>
			`<Relationship Id="${relationship.relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../${relationship.mediaPath}"/>`,
	);
	const hyperlinkRels = hyperlinkRelationships.map(
		(relationship) =>
			`<Relationship Id="${relationship.relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXmlAttribute(relationship.target)}" TargetMode="External"/>`,
	);
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
		imageRels.join(''),
		hyperlinkRels.join(''),
		'</Relationships>',
	].join('');
}

function buildPresentationXml(slideCount: number): string {
	const slideIds = Array.from(
		{ length: slideCount },
		(_unused, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`,
	).join('');

	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">',
		'<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>',
		`<p:sldIdLst>${slideIds}</p:sldIdLst>`,
		`<p:sldSz cx="${PPTX_SLIDE_WIDTH_EMU}" cy="${PPTX_SLIDE_HEIGHT_EMU}" type="wide"/>`,
		'<p:notesSz cx="6858000" cy="9144000"/>',
		'<p:defaultTextStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:defaultTextStyle>',
		'</p:presentation>',
	].join('');
}

function buildPresentationRelationships(slideCount: number): string {
	const slideRels = Array.from(
		{ length: slideCount },
		(_unused, index) =>
			`<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`,
	).join('');
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',
		slideRels,
		'</Relationships>',
	].join('');
}

function buildContentTypes(slideCount: number, imageExtensions: Set<string>): string {
	const imageDefaults = Array.from(imageExtensions)
		.sort()
		.map((extension) => {
			const contentType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
			return `<Default Extension="${extension}" ContentType="${contentType}"/>`;
		})
		.join('');
	const slideOverrides = Array.from(
		{ length: slideCount },
		(_unused, index) =>
			`<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
	).join('');

	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
		'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
		'<Default Extension="xml" ContentType="application/xml"/>',
		imageDefaults,
		'<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
		'<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
		'<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
		'<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
		'<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
		'<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
		slideOverrides,
		'</Types>',
	].join('');
}

function buildRootRelationships(): string {
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>',
		'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
		'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
		'</Relationships>',
	].join('');
}

function buildCoreProperties(document: SlidevPptxDocument): string {
	const now = new Date().toISOString();
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
		`<dc:title>${escapeXml(document.title)}</dc:title>`,
		`<dc:creator>${escapeXml(document.author || 'NoteMD')}</dc:creator>`,
		`<cp:lastModifiedBy>${escapeXml(document.author || 'NoteMD')}</cp:lastModifiedBy>`,
		`<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>`,
		`<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>`,
		'</cp:coreProperties>',
	].join('');
}

function buildAppProperties(document: SlidevPptxDocument): string {
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
		'<Application>NoteMD</Application>',
		`<Slides>${document.slides.length}</Slides>`,
		'<PresentationFormat>On-screen Show (16:9)</PresentationFormat>',
		'</Properties>',
	].join('');
}

function buildSlideMaster(): string {
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">',
		'<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>',
		'<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>',
		'<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>',
		'<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>',
		'</p:sldMaster>',
	].join('');
}

function buildSlideMasterRelationships(): string {
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
		'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>',
		'</Relationships>',
	].join('');
}

function buildSlideLayout(): string {
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">',
		'<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>',
		'<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>',
		'</p:sldLayout>',
	].join('');
}

function buildSlideLayoutRelationships(): string {
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>',
		'</Relationships>',
	].join('');
}

function buildTheme(context: PptxPackageContext): string {
	const latinFontFace = escapeXmlAttribute(context.fontPolicy.latinFontFace);
	const eastAsiaFontFace = escapeXmlAttribute(context.fontPolicy.eastAsiaFontFace);
	const monospaceFontFace = escapeXmlAttribute(context.fontPolicy.monospaceFontFace);
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="NoteMD">',
		'<a:themeElements>',
		'<a:clrScheme name="NoteMD"><a:dk1><a:srgbClr val="111827"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F9FAFB"/></a:lt2><a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="059669"/></a:accent2><a:accent3><a:srgbClr val="D97706"/></a:accent3><a:accent4><a:srgbClr val="DC2626"/></a:accent4><a:accent5><a:srgbClr val="7C3AED"/></a:accent5><a:accent6><a:srgbClr val="0891B2"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink></a:clrScheme>',
		`<a:fontScheme name="NoteMD"><a:majorFont><a:latin typeface="${latinFontFace}"/><a:ea typeface="${eastAsiaFontFace}"/><a:cs typeface="${latinFontFace}"/></a:majorFont><a:minorFont><a:latin typeface="${latinFontFace}"/><a:ea typeface="${eastAsiaFontFace}"/><a:cs typeface="${monospaceFontFace}"/></a:minorFont></a:fontScheme>`,
		'<a:fmtScheme name="NoteMD"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>',
		'</a:themeElements>',
		'<a:objectDefaults/>',
		'<a:extraClrSchemeLst/>',
		'</a:theme>',
	].join('');
}

function writePptxPackage(
	outputPath: string,
	document: SlidevPptxDocument,
	buildSlideContentXml: (
		slide: SlidevPptxSlide,
		imageRelationships: SlideImageRelationship[],
		context: PptxWriterContext,
	) => string,
	context: PptxPackageContext,
): void {
	const fs: any = safeRequire('fs');
	const path: any = safeRequire('path');
	if (!fs?.writeFileSync || !path?.dirname) {
		throw new Error('Filesystem APIs are unavailable; PPTX export requires desktop Obsidian.');
	}

	const files: Record<string, Uint8Array> = {};
	const imageExtensions = new Set<string>();
	let mediaIndex = 1;

	const addText = (zipPath: string, xml: string): void => {
		files[zipPath] = strToU8(xml);
	};

	for (let slideIndex = 0; slideIndex < document.slides.length; slideIndex += 1) {
		const slide = document.slides[slideIndex];
		const images = slide.backgroundImage ? [slide.backgroundImage] : [];
		const imageRelationships: SlideImageRelationship[] = images.map((image, imageIndex) => {
			const extension = extensionForImage(image);
			imageExtensions.add(extension);
			const mediaPath = `media/image${mediaIndex}.${extension}`;
			files[`ppt/${mediaPath}`] = image.data;
			mediaIndex += 1;
			return {
				image,
				relationshipId: `rId${imageIndex + 2}`,
				mediaPath,
			};
		});
		const hyperlinkRelationships: SlideHyperlinkRelationship[] = [];
		const hyperlinkRelationshipIdsByTarget = new Map<string, string>();
		let nextRelationshipId = imageRelationships.length + 2;
		const slideContext: PptxWriterContext = {
			fontPolicy: context.fontPolicy,
			registerHyperlinkTarget: (targetInput) => {
				const target = normalizeOfficeHyperlinkTarget(targetInput);
				if (!target) {
					return '';
				}
				const existingRelationshipId = hyperlinkRelationshipIdsByTarget.get(target);
				if (existingRelationshipId) {
					return existingRelationshipId;
				}
				const relationshipId = `rId${nextRelationshipId}`;
				nextRelationshipId += 1;
				hyperlinkRelationshipIdsByTarget.set(target, relationshipId);
				hyperlinkRelationships.push({ relationshipId, target });
				return relationshipId;
			},
		};
		const slideNumber = slideIndex + 1;
		addText(`ppt/slides/slide${slideNumber}.xml`, buildSlideContentXml(slide, imageRelationships, slideContext));
		addText(
			`ppt/slides/_rels/slide${slideNumber}.xml.rels`,
			buildSlideRelationships(imageRelationships, hyperlinkRelationships),
		);
	}

	addText('[Content_Types].xml', buildContentTypes(document.slides.length, imageExtensions));
	addText('_rels/.rels', buildRootRelationships());
	addText('docProps/core.xml', buildCoreProperties(document));
	addText('docProps/app.xml', buildAppProperties(document));
	addText('ppt/presentation.xml', buildPresentationXml(document.slides.length));
	addText('ppt/_rels/presentation.xml.rels', buildPresentationRelationships(document.slides.length));
	addText('ppt/slideMasters/slideMaster1.xml', buildSlideMaster());
	addText('ppt/slideMasters/_rels/slideMaster1.xml.rels', buildSlideMasterRelationships());
	addText('ppt/slideLayouts/slideLayout1.xml', buildSlideLayout());
	addText('ppt/slideLayouts/_rels/slideLayout1.xml.rels', buildSlideLayoutRelationships());
	addText('ppt/theme/theme1.xml', buildTheme(context));

	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	const zipped = zipSync(files, { level: 6 });
	fs.writeFileSync(outputPath, Buffer.from(zipped));
}

export function writePptxDocument(
	outputPath: string,
	document: SlidevPptxDocument,
	fontPolicy?: Partial<SlidevPptxFontPolicy>,
): void {
	writePptxPackage(outputPath, document, buildSlideXml, {
		fontPolicy: resolveSlidevPptxFontPolicy(fontPolicy),
	});
}

export function writeVisibleNativeExperimentPptxDocument(
	outputPath: string,
	document: SlidevPptxDocument,
	fontPolicy?: Partial<SlidevPptxFontPolicy>,
): void {
	writePptxPackage(outputPath, document, buildVisibleNativeExperimentSlideXml, {
		fontPolicy: resolveSlidevPptxFontPolicy(fontPolicy),
	});
}
