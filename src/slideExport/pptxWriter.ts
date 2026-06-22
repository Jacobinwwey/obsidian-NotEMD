import { strToU8, zipSync } from 'fflate';
import {
	PPTX_SLIDE_HEIGHT_EMU,
	PPTX_SLIDE_WIDTH_EMU,
	type SlidevPptxDocument,
	type SlidevPptxImage,
	type SlidevPptxRichTextParagraph,
	type SlidevPptxSlide,
	type SlidevPptxTable,
	type SlidevPptxTableCell,
	type SlidevPptxTextAlign,
	type SlidevPptxTextBox,
} from './pptxModel';
import { PPTX_WRITER_EAST_ASIA_FONT_FACE, pptxTextContainsCjk } from './pptxFontContract';
import { safeRequire } from './platformUtils';

const EMU_PER_INCH = 914400;

interface SlideImageRelationship {
	image: SlidevPptxImage;
	relationshipId: string;
	mediaPath: string;
}

function escapeXml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeXmlAttribute(value: string): string {
	return escapeXml(value).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
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
};

function buildTransparentRunXml(text: string, runStyle: TextRunStyle): string {
	const color = clampHexColor(runStyle.color, '111827');
	const size = Math.max(600, Math.min(14400, Math.round(runStyle.fontSize * 100)));
	const bold = runStyle.bold ? ' b="1"' : '';
	const italic = runStyle.italic ? ' i="1"' : '';
	const underline = runStyle.underline ? ' u="sng"' : '';
	const fontFace = escapeXmlAttribute(runStyle.fontFace || 'Aptos');
	const eastAsiaFont = pptxTextContainsCjk(text) ? PPTX_WRITER_EAST_ASIA_FONT_FACE : fontFace;

	return [
		'<a:r>',
		`<a:rPr lang="en-US" sz="${size}"${bold}${italic}${underline}>`,
		buildTransparentTextFill(color),
		`<a:latin typeface="${fontFace}"/>`,
		`<a:ea typeface="${escapeXmlAttribute(eastAsiaFont)}"/>`,
		'<a:cs typeface="Aptos"/>',
		'</a:rPr>',
		buildTextElement(text),
		'</a:r>',
	].join('');
}

function buildVisibleRunXml(text: string, runStyle: TextRunStyle): string {
	const color = clampHexColor(runStyle.color, '111827');
	const size = Math.max(600, Math.min(14400, Math.round(runStyle.fontSize * 100)));
	const bold = runStyle.bold ? ' b="1"' : '';
	const italic = runStyle.italic ? ' i="1"' : '';
	const underline = runStyle.underline ? ' u="sng"' : '';
	const fontFace = escapeXmlAttribute(runStyle.fontFace || 'Aptos');
	const eastAsiaFont = pptxTextContainsCjk(text) ? PPTX_WRITER_EAST_ASIA_FONT_FACE : fontFace;

	return [
		'<a:r>',
		`<a:rPr lang="en-US" sz="${size}"${bold}${italic}${underline}>`,
		buildVisibleTextFill(color),
		`<a:latin typeface="${fontFace}"/>`,
		`<a:ea typeface="${escapeXmlAttribute(eastAsiaFont)}"/>`,
		'<a:cs typeface="Aptos"/>',
		'</a:rPr>',
		buildTextElement(text),
		'</a:r>',
	].join('');
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
					code: false,
					link: false,
				},
			],
		}));
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
	return paragraphs.length > 0 ? paragraphs : fallbackTextParagraphs(textBox);
}

function paragraphEndFontSize(paragraph: SlidevPptxRichTextParagraph, fallbackFontSize: number): number {
	const lastRun = paragraph.runs[paragraph.runs.length - 1];
	return Math.max(600, Math.min(14400, Math.round((lastRun?.fontSize || fallbackFontSize) * 100)));
}

function buildTextParagraphs(textBox: SlidevPptxTextBox): string {
	const paragraphs = chooseTextParagraphs(textBox);
	const align = alignToOoxml(textBox.align);
	const bullet = textBox.bullet ? '<a:buChar char="&#8226;"/>' : '<a:buNone/>';

	return paragraphs
		.map((paragraph) =>
			[
				'<a:p>',
				`<a:pPr algn="${align}">${bullet}</a:pPr>`,
				paragraph.runs.map((run) => buildTransparentRunXml(run.text || ' ', run)).join(''),
				`<a:endParaRPr lang="en-US" sz="${paragraphEndFontSize(paragraph, textBox.fontSize)}"/>`,
				'</a:p>',
			].join(''),
		)
		.join('');
}

function buildVisibleTextParagraphs(textBox: SlidevPptxTextBox): string {
	const paragraphs = chooseTextParagraphs(textBox);
	const align = alignToOoxml(textBox.align);
	const bullet = textBox.bullet ? '<a:buChar char="&#8226;"/>' : '<a:buNone/>';

	return paragraphs
		.map((paragraph) =>
			[
				'<a:p>',
				`<a:pPr algn="${align}">${bullet}</a:pPr>`,
				paragraph.runs.map((run) => buildVisibleRunXml(run.text || ' ', run)).join(''),
				`<a:endParaRPr lang="en-US" sz="${paragraphEndFontSize(paragraph, textBox.fontSize)}"/>`,
				'</a:p>',
			].join(''),
		)
		.join('');
}

function buildTextShape(textBox: SlidevPptxTextBox, shapeId: number): string {
	const x = inchesToEmu(textBox.x);
	const y = inchesToEmu(textBox.y);
	const w = inchesToEmu(textBox.w);
	const h = inchesToEmu(textBox.h);
	const name = escapeXmlAttribute(`Editable Text ${shapeId}`);

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
		'<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t"><a:normAutofit fontScale="100000"/></a:bodyPr>',
		'<a:lstStyle/>',
		buildTextParagraphs(textBox),
		'</p:txBody>',
		'</p:sp>',
	].join('');
}

function buildVisibleTextShape(textBox: SlidevPptxTextBox, shapeId: number): string {
	const x = inchesToEmu(textBox.x);
	const y = inchesToEmu(textBox.y);
	const w = inchesToEmu(textBox.w);
	const h = inchesToEmu(textBox.h);
	const name = escapeXmlAttribute(`Visible Native Text ${shapeId}`);

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
		'<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t"><a:normAutofit fontScale="100000"/></a:bodyPr>',
		'<a:lstStyle/>',
		buildVisibleTextParagraphs(textBox),
		'</p:txBody>',
		'</p:sp>',
	].join('');
}

function buildTableCellRun(text: string, cell: SlidevPptxTableCell): string {
	return buildTransparentRunXml(text, cell);
}

function buildVisibleTableCellRun(text: string, cell: SlidevPptxTableCell): string {
	return buildVisibleRunXml(text, cell);
}

function buildTableCellParagraphs(cell: SlidevPptxTableCell): string {
	const lines = cell.text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd())
		.filter((line, index, allLines) => line.length > 0 || allLines.length === 1);
	const align = alignToOoxml(cell.align);
	const size = Math.max(600, Math.min(14400, Math.round(cell.fontSize * 100)));

	return lines
		.map((line) =>
			[
				'<a:p>',
				`<a:pPr algn="${align}"/>`,
				buildTableCellRun(line || ' ', cell),
				`<a:endParaRPr lang="en-US" sz="${size}"/>`,
				'</a:p>',
			].join(''),
		)
		.join('');
}

function buildVisibleTableCellParagraphs(cell: SlidevPptxTableCell): string {
	const lines = cell.text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd())
		.filter((line, index, allLines) => line.length > 0 || allLines.length === 1);
	const align = alignToOoxml(cell.align);
	const size = Math.max(600, Math.min(14400, Math.round(cell.fontSize * 100)));

	return lines
		.map((line) =>
			[
				'<a:p>',
				`<a:pPr algn="${align}"/>`,
				buildVisibleTableCellRun(line || ' ', cell),
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
	// Visible table paint and text stay in the DOM-derived layers until native table layout can match Slidev.
	return `<a:tcPr${attributes.length > 0 ? ` ${attributes.join(' ')}` : ''}><a:noFill/>${invisibleBorders}</a:tcPr>`;
}

function pointsToEmu(value: number): number {
	return Math.round(Math.max(0, value) * 12700);
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

function buildTableXml(table: SlidevPptxTable, shapeId: number): string {
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
						buildTableCellParagraphs(gridEntry.cell),
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

function buildVisibleTableXml(table: SlidevPptxTable, shapeId: number): string {
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
						buildVisibleTableCellParagraphs(gridEntry.cell),
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

function buildVisibleNativeExperimentSlideXml(
	slide: SlidevPptxSlide,
	imageRelationships: SlideImageRelationship[],
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

	for (const text of slide.texts) {
		items.push({
			order: text.order,
			xml: buildVisibleTextShape(text, shapeId),
		});
		shapeId += 1;
	}

	for (const table of slide.tables) {
		items.push({
			order: table.order,
			xml: buildVisibleTableXml(table, shapeId),
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

function buildSlideXml(slide: SlidevPptxSlide, imageRelationships: SlideImageRelationship[]): string {
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

	for (const text of slide.texts) {
		items.push({
			order: text.order,
			xml: buildTextShape(text, shapeId),
		});
		shapeId += 1;
	}

	for (const table of slide.tables) {
		items.push({
			order: table.order,
			xml: buildTableXml(table, shapeId),
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

function buildSlideRelationships(imageRelationships: SlideImageRelationship[]): string {
	const imageRels = imageRelationships.map(
		(relationship) =>
			`<Relationship Id="${relationship.relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../${relationship.mediaPath}"/>`,
	);
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
		imageRels.join(''),
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

function buildTheme(): string {
	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
		'<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="NoteMD">',
		'<a:themeElements>',
		'<a:clrScheme name="NoteMD"><a:dk1><a:srgbClr val="111827"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F9FAFB"/></a:lt2><a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="059669"/></a:accent2><a:accent3><a:srgbClr val="D97706"/></a:accent3><a:accent4><a:srgbClr val="DC2626"/></a:accent4><a:accent5><a:srgbClr val="7C3AED"/></a:accent5><a:accent6><a:srgbClr val="0891B2"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink></a:clrScheme>',
		'<a:fontScheme name="NoteMD"><a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Aptos"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Aptos"/></a:minorFont></a:fontScheme>',
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
	buildSlideContentXml: (slide: SlidevPptxSlide, imageRelationships: SlideImageRelationship[]) => string,
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
			const slideNumber = slideIndex + 1;
			addText(`ppt/slides/slide${slideNumber}.xml`, buildSlideContentXml(slide, imageRelationships));
			addText(`ppt/slides/_rels/slide${slideNumber}.xml.rels`, buildSlideRelationships(imageRelationships));
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
	addText('ppt/theme/theme1.xml', buildTheme());

	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	const zipped = zipSync(files, { level: 6 });
	fs.writeFileSync(outputPath, Buffer.from(zipped));
}

export function writePptxDocument(outputPath: string, document: SlidevPptxDocument): void {
	writePptxPackage(outputPath, document, buildSlideXml);
}

export function writeVisibleNativeExperimentPptxDocument(outputPath: string, document: SlidevPptxDocument): void {
	writePptxPackage(outputPath, document, buildVisibleNativeExperimentSlideXml);
}
