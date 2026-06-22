import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { strFromU8, unzipSync } from 'fflate';
import { splitPptxTextIntoOfficeFontRuns } from '../slideExport/pptxFontContract';
import { PPTX_SLIDE_HEIGHT_IN, PPTX_SLIDE_WIDTH_IN, type SlidevPptxDocument } from '../slideExport/pptxModel';
import { writePptxDocument, writeVisibleNativeExperimentPptxDocument } from '../slideExport/pptxWriter';

jest.mock('obsidian', () => ({
	Platform: { isDesktopApp: true },
}));

describe('pptxWriter', () => {
	test('keeps East Asian punctuation with the East Asian Office font run', () => {
		expect(splitPptxTextIntoOfficeFontRuns('API：架构 v2', 'Avenir Next')).toEqual([
			{
				text: 'API',
				sourceFontFace: 'Avenir Next',
				fontFace: 'Noto Sans',
				usesEastAsiaFont: false,
			},
			{
				text: '：架构',
				sourceFontFace: 'Avenir Next',
				fontFace: 'Microsoft YaHei',
				usesEastAsiaFont: true,
			},
			{
				text: ' v2',
				sourceFontFace: 'Avenir Next',
				fontFace: 'Noto Sans',
				usesEastAsiaFont: false,
			},
		]);
	});

	test('applies the selected PPTX font policy to Office text runs and theme fonts', () => {
		const fontPolicy = {
			latinFontFace: 'Aptos',
			eastAsiaFontFace: 'Noto Sans CJK SC',
			monospaceFontFace: 'Consolas',
		};
		expect(splitPptxTextIntoOfficeFontRuns('API：架构 v2', 'Avenir Next', fontPolicy)).toEqual([
			{
				text: 'API',
				sourceFontFace: 'Avenir Next',
				fontFace: 'Aptos',
				usesEastAsiaFont: false,
			},
			{
				text: '：架构',
				sourceFontFace: 'Avenir Next',
				fontFace: 'Noto Sans CJK SC',
				usesEastAsiaFont: true,
			},
			{
				text: ' v2',
				sourceFontFace: 'Avenir Next',
				fontFace: 'Aptos',
				usesEastAsiaFont: false,
			},
		]);
		expect(splitPptxTextIntoOfficeFontRuns('const ok = true;', 'Fira Code', fontPolicy)).toEqual([
			{
				text: 'const ok = true;',
				sourceFontFace: 'Fira Code',
				fontFace: 'Consolas',
				usesEastAsiaFont: false,
			},
		]);

		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-font-policy-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Font policy',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Font policy',
						backgroundColor: 'FFFFFF',
						texts: [
							{
								text: 'API 架构 v2\nconst ok = true;',
								sourceKind: 'body',
								x: 1,
								y: 1,
								w: 6,
								h: 1,
								fontSize: 18,
								fontFace: 'Avenir Next',
								color: '111827',
								bold: false,
								italic: false,
								underline: false,
								align: 'left',
								bullet: false,
								order: 10,
								richTextParagraphs: [
									{
										runs: [
											{
												text: 'API 架构 v2',
												fontSize: 18,
												fontFace: 'Avenir Next',
												color: '111827',
												bold: false,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
										],
									},
									{
										runs: [
											{
												text: 'const ok = true;',
												fontSize: 14,
												fontFace: 'Fira Code',
												color: '111827',
												bold: false,
												italic: false,
												underline: false,
												code: true,
												link: false,
											},
										],
									},
								],
								unmodeledRunReasons: [],
							},
						],
						tables: [],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document, fontPolicy);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			const themeXml = strFromU8(entries['ppt/theme/theme1.xml']);
			expect(slideXml).toContain('<a:latin typeface="Aptos"/>');
			expect(slideXml).toContain('<a:ea typeface="Noto Sans CJK SC"/>');
			expect(slideXml).toContain('<a:latin typeface="Consolas"/>');
			expect(themeXml).toContain('<a:latin typeface="Aptos"/>');
			expect(themeXml).toContain('<a:ea typeface="Noto Sans CJK SC"/>');
			expect(themeXml).toContain('<a:cs typeface="Consolas"/>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('writes a PPTX zip with editable text runs and a visual fallback image', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Editable deck',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Architecture',
						backgroundColor: 'FFFFFF',
						backgroundImage: {
							data: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
							mimeType: 'image/png',
							x: 0,
							y: 0,
							w: PPTX_SLIDE_WIDTH_IN,
							h: PPTX_SLIDE_HEIGHT_IN,
							name: 'Fallback',
							order: 0,
						},
						texts: [
							{
								text: '可编辑 PPTX\nArchitecture',
								x: 1,
								y: 1,
								w: 5,
								h: 1,
								fontSize: 24,
								fontFace: 'Aptos',
								color: '111827',
								bold: true,
								italic: false,
								underline: false,
								align: 'left',
								bullet: false,
								order: 10,
								richTextParagraphs: [
									{
										runs: [
											{
												text: '可编辑',
												fontSize: 24,
												fontFace: 'Aptos',
												color: '111827',
												bold: true,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
											{
												text: ' ',
												fontSize: 24,
												fontFace: 'Aptos',
												color: '111827',
												bold: true,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
											{
												text: 'PPTX',
												fontSize: 24,
												fontFace: 'Aptos',
												color: '2563EB',
												bold: true,
												italic: false,
												underline: true,
												code: false,
												link: true,
											},
										],
									},
									{
										runs: [
											{
												text: 'Architecture',
												fontSize: 24,
												fontFace: 'Aptos',
												color: '111827',
												bold: true,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
										],
									},
								],
								unmodeledRunReasons: [],
							},
						],
						tables: [
							{
								x: 1,
								y: 2.25,
								w: 5,
								h: 1,
								colWidths: [2, 3],
								rowHeights: [0.45, 0.55],
								order: 20,
								rows: [
									[
										{
											text: 'Header',
											rowSpan: 1,
											colSpan: 1,
											fontSize: 12,
											fontFace: 'Aptos',
											color: '111827',
											bold: true,
											italic: false,
											underline: false,
											align: 'left',
											verticalAlign: 'middle',
											fillColor: 'F3F4F6',
											borderColor: 'D1D5DB',
											borderWidthPt: 0.75,
										},
										{
											text: '值',
											rowSpan: 1,
											colSpan: 1,
											fontSize: 12,
											fontFace: 'Aptos',
											color: '111827',
											bold: true,
											italic: false,
											underline: false,
											align: 'center',
											verticalAlign: 'middle',
											fillColor: 'F3F4F6',
											borderColor: 'D1D5DB',
											borderWidthPt: 0.75,
										},
									],
									[
										{
											text: 'Editable table cell',
											rowSpan: 1,
											colSpan: 2,
											fontSize: 11,
											fontFace: 'Aptos',
											color: '374151',
											bold: false,
											italic: false,
											underline: false,
											align: 'left',
											verticalAlign: 'top',
											fillColor: null,
											borderColor: 'D1D5DB',
											borderWidthPt: 0.75,
										},
									],
								],
							},
						],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			expect(entries['ppt/presentation.xml']).toBeDefined();
			expect(entries['ppt/slides/slide1.xml']).toBeDefined();
			expect(entries['ppt/media/image1.png']).toBeDefined();
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			expect(slideXml).toContain('<a:t>可编辑</a:t>');
			expect(slideXml).toContain('<a:ea typeface="Microsoft YaHei"/>');
			expect(slideXml).toContain('<a:t xml:space="preserve"> </a:t>');
			expect(slideXml).toContain('<a:t>PPTX</a:t>');
			expect(slideXml).toContain('<a:t>Architecture</a:t>');
			expect(slideXml).toContain('<a:solidFill><a:srgbClr val="2563EB"/></a:solidFill>');
			expect(slideXml).toContain('u="sng"');
			expect(slideXml).toContain(
				'<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t">',
			);
			expect(slideXml).toContain('<a:noAutofit/>');
			expect(slideXml).toContain('<p:pic>');
			expect(slideXml).toContain('<p:graphicFrame>');
			expect(slideXml).toContain('<a:tbl>');
			expect(slideXml).toContain('<a:gridCol');
			expect(slideXml).toContain('<a:t>Header</a:t>');
			expect(slideXml).toContain('<a:t>值</a:t>');
			expect(slideXml).toContain('<a:t>Editable table cell</a:t>');
			expect(slideXml).toContain('gridSpan="2"');
			expect(slideXml).toContain('<a:lnL w="9525"><a:solidFill><a:srgbClr val="D1D5DB"/></a:solidFill></a:lnL>');
			expect(slideXml).not.toContain('<a:alpha val="0"/>');
			expect(slideXml).not.toContain('<a:alpha val="8000"/>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('writes rich text hyperlinks as real slide relationships', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-hyperlinks-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Hyperlink deck',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Links',
						backgroundColor: 'FFFFFF',
						texts: [
							{
								text: 'Open docs and docs again',
								sourceKind: 'body',
								x: 1,
								y: 1,
								w: 7,
								h: 0.6,
								fontSize: 18,
								fontFace: 'Aptos',
								color: '111827',
								bold: false,
								italic: false,
								underline: false,
								align: 'left',
								bullet: false,
								order: 10,
								richTextParagraphs: [
									{
										runs: [
											{
												text: 'Open ',
												fontSize: 18,
												fontFace: 'Aptos',
												color: '111827',
												bold: false,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
											{
												text: 'docs',
												fontSize: 18,
												fontFace: 'Aptos',
												color: '2563EB',
												bold: false,
												italic: false,
												underline: true,
												code: false,
												link: true,
												hyperlinkTarget: 'https://example.com/docs?a=1&b=2',
											},
											{
												text: ' and docs again',
												fontSize: 18,
												fontFace: 'Aptos',
												color: '2563EB',
												bold: false,
												italic: false,
												underline: true,
												code: false,
												link: true,
												hyperlinkTarget: 'https://example.com/docs?a=1&b=2',
											},
										],
									},
								],
								unmodeledRunReasons: ['link'],
							},
						],
						tables: [],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			const relationshipsXml = strFromU8(entries['ppt/slides/_rels/slide1.xml.rels']);
			expect(slideXml.match(/<a:hlinkClick r:id="rId2"\/>/g)).toHaveLength(2);
			expect(relationshipsXml).toContain(
				'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"',
			);
			expect(relationshipsXml).toContain('Target="https://example.com/docs?a=1&amp;b=2"');
			expect(relationshipsXml).toContain('TargetMode="External"');
			expect((relationshipsXml.match(/relationships\/hyperlink/g) || []).length).toBe(1);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('writes default text sources as visible native text and omits Mermaid transparent labels', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-visible-native-default-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const textBox = (
				text: string,
				sourceKind: 'body' | 'code' | 'svg-text' | 'table-cell-overlay' | 'mermaid-text',
				color: string,
				order: number,
			) => ({
				text,
				sourceKind,
				x: 1,
				y: order / 100,
				w: 5,
				h: 0.5,
				fontSize: 16,
				fontFace: sourceKind === 'code' ? 'Fira Code' : 'Aptos',
				color,
				bold: false,
				italic: false,
				underline: false,
				align: 'left' as const,
				bullet: false,
				order,
				richTextParagraphs: [],
				unmodeledRunReasons: [],
			});
			const document: SlidevPptxDocument = {
				title: 'Selective native text',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Selective native text',
						backgroundColor: 'FFFFFF',
						texts: [
							textBox('Body title', 'body', '111111', 10),
							textBox('const chart = true;', 'code', '222222', 20),
							textBox('Chart axis label', 'svg-text', '333333', 30),
							textBox('Table overlay value', 'table-cell-overlay', '444444', 40),
							textBox('Mermaid edge label', 'mermaid-text', '555555', 50),
						],
						tables: [],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			expect(slideXml).toContain('name="Visible Native Text');
			expect(slideXml).toContain('name="Visible Native Code Text');
			expect(slideXml).toContain('name="Visible Native SVG Text');
			expect(slideXml).toContain('name="Visible Native Table Cell Overlay Text');
			expect(slideXml).not.toContain('name="Editable Mermaid Text');
			expect(slideXml).not.toContain('Mermaid edge label');
			expect(slideXml).toContain('<a:solidFill><a:srgbClr val="111111"/></a:solidFill>');
			expect(slideXml).toContain('<a:solidFill><a:srgbClr val="222222"/></a:solidFill>');
			expect(slideXml).toContain('<a:solidFill><a:srgbClr val="333333"/></a:solidFill>');
			expect(slideXml).toContain('<a:solidFill><a:srgbClr val="444444"/></a:solidFill>');
			expect(slideXml).not.toContain('<a:alpha val="8000"/>');
			expect(slideXml).not.toContain('<a:alpha val="0"/>');
			expect(slideXml).not.toContain('<a:srgbClr val="111111"><a:alpha val="0"/></a:srgbClr>');
			expect(slideXml).not.toContain('<a:srgbClr val="222222"><a:alpha val="0"/></a:srgbClr>');
			expect(slideXml).not.toContain('<a:srgbClr val="333333"><a:alpha val="0"/></a:srgbClr>');
			expect(slideXml).not.toContain('<a:srgbClr val="444444"><a:alpha val="0"/></a:srgbClr>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('writes browser-line native text boxes without Office rewrapping', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-browser-line-text-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Browser line text',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Browser line text',
						backgroundColor: 'FFFFFF',
						texts: [
							{
								text: 'Line one from Chromium',
								sourceKind: 'body',
								x: 1,
								y: 1,
								w: 2.4,
								h: 0.24,
								fontSize: 12,
								fontFace: 'Aptos',
								color: '111827',
								bold: false,
								italic: false,
								underline: false,
								align: 'left',
								bullet: false,
								order: 10,
								richTextParagraphs: [
									{
										runs: [
											{
												text: 'Line one from Chromium',
												fontSize: 12,
												fontFace: 'Aptos',
												color: '111827',
												bold: false,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
										],
									},
								],
								unmodeledRunReasons: [],
							},
						],
						tables: [],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			expect(slideXml).toContain('name="Visible Native Text');
			expect(slideXml).toContain(
				'<a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t"><a:noAutofit/></a:bodyPr>',
			);
			expect(slideXml).toContain('<a:t>Line one from Chromium</a:t>');
			expect(slideXml).not.toContain('<a:alpha val="0"/>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('writes experimental visible-native text and table fills without transparent alpha', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-visible-native-'));
		try {
			const outputPath = join(directory, 'deck.visible-native-experiment.pptx');
			const document: SlidevPptxDocument = {
				title: 'Visible native deck',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Architecture',
						backgroundColor: 'FFFFFF',
						backgroundImage: {
							data: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
							mimeType: 'image/png',
							x: 0,
							y: 0,
							w: PPTX_SLIDE_WIDTH_IN,
							h: PPTX_SLIDE_HEIGHT_IN,
							name: 'Residual background',
							order: 0,
						},
						texts: [
							{
								text: 'Visible native text',
								x: 1,
								y: 1,
								w: 5,
								h: 1,
								fontSize: 24,
								fontFace: 'Aptos',
								color: '2563EB',
								bold: true,
								italic: false,
								underline: false,
								align: 'left',
								bullet: false,
								order: 10,
								richTextParagraphs: [],
								unmodeledRunReasons: [],
							},
						],
						tables: [
							{
								x: 1,
								y: 2.25,
								w: 5,
								h: 0.75,
								colWidths: [2, 3],
								rowHeights: [0.75],
								order: 20,
								rows: [
									[
										{
											text: 'Visible cell',
											rowSpan: 1,
											colSpan: 1,
											fontSize: 12,
											fontFace: 'Aptos',
											color: '111827',
											bold: false,
											italic: false,
											underline: false,
											align: 'left',
											verticalAlign: 'middle',
											fillColor: 'F3F4F6',
											borderColor: 'D1D5DB',
											borderWidthPt: 0.75,
										},
										{
											text: '值',
											rowSpan: 1,
											colSpan: 1,
											fontSize: 12,
											fontFace: 'Aptos',
											color: '047857',
											bold: false,
											italic: false,
											underline: false,
											align: 'center',
											verticalAlign: 'middle',
											fillColor: 'ECFDF5',
											borderColor: 'D1D5DB',
											borderWidthPt: 0.75,
										},
									],
								],
							},
						],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writeVisibleNativeExperimentPptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			expect(slideXml).toContain('<a:t>Visible native text</a:t>');
			expect(slideXml).toContain('<a:srgbClr val="2563EB"/>');
			expect(slideXml).toContain('<a:t>Visible cell</a:t>');
			expect(slideXml).toContain('<a:t>值</a:t>');
			expect(slideXml).toContain('<a:solidFill><a:srgbClr val="F3F4F6"/></a:solidFill>');
			expect(slideXml).toContain('<a:lnL w="9525"><a:solidFill><a:srgbClr val="D1D5DB"/></a:solidFill></a:lnL>');
			expect(slideXml).not.toContain('<a:alpha val="0"/>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('splits rich text runs containing newlines into editable paragraphs', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-code-lines-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Code lines',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Code',
						backgroundColor: 'FFFFFF',
						texts: [
							{
								text: 'const first = 1;\nconst second = 2;',
								sourceKind: 'code',
								x: 1,
								y: 1,
								w: 5,
								h: 1,
								fontSize: 14,
								fontFace: 'Fira Code',
								color: '111827',
								bold: false,
								italic: false,
								underline: false,
								align: 'left',
								bullet: false,
								order: 10,
								richTextParagraphs: [
									{
										runs: [
											{
												text: 'const first = 1;\nconst second = 2;',
												fontSize: 14,
												fontFace: 'Fira Code',
												color: '111827',
												bold: false,
												italic: false,
												underline: false,
												code: true,
												link: false,
											},
										],
									},
								],
								unmodeledRunReasons: ['syntax-highlight'],
							},
						],
						tables: [],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			const firstLineIndex = slideXml.indexOf('<a:t>const first = 1;</a:t>');
			const secondLineIndex = slideXml.indexOf('<a:t>const second = 2;</a:t>');
			expect(firstLineIndex).toBeGreaterThan(-1);
			expect(secondLineIndex).toBeGreaterThan(firstLineIndex);
			expect(slideXml).toContain('name="Visible Native Code Text');
			expect(slideXml.slice(firstLineIndex, secondLineIndex)).toContain('</a:p><a:p>');
			expect(slideXml).not.toContain('const first = 1;\nconst second = 2;');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('writes paragraph spacing, body insets, and bullet indentation as Office text properties', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-paragraph-contract-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Paragraph contract',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Paragraph contract',
						backgroundColor: 'FFFFFF',
						texts: [
							{
								text: 'Indented paragraph',
								sourceKind: 'body',
								x: 1,
								y: 1,
								w: 5,
								h: 0.8,
								fontSize: 18,
								fontFace: 'Aptos',
								color: '111827',
								bold: false,
								italic: false,
								underline: false,
								align: 'left',
								bullet: false,
								lineSpacingPt: 24,
								paragraphSpacingBeforePt: 6,
								paragraphSpacingAfterPt: 9,
								paddingLeftIn: 0.15,
								paddingRightIn: 0.2,
								paddingTopIn: 0.05,
								paddingBottomIn: 0.08,
								order: 10,
								richTextParagraphs: [
									{
										runs: [
											{
												text: 'Indented paragraph',
												fontSize: 18,
												fontFace: 'Aptos',
												color: '111827',
												bold: false,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
										],
									},
								],
								unmodeledRunReasons: [],
							},
							{
								text: 'Nested bullet',
								sourceKind: 'body',
								x: 1,
								y: 2,
								w: 5,
								h: 0.5,
								fontSize: 16,
								fontFace: 'Aptos',
								color: '111827',
								bold: false,
								italic: false,
								underline: false,
								align: 'left',
								bullet: true,
								bulletLevel: 2,
								lineSpacingPt: 20,
								order: 20,
								richTextParagraphs: [
									{
										runs: [
											{
												text: 'Nested bullet',
												fontSize: 16,
												fontFace: 'Aptos',
												color: '111827',
												bold: false,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
										],
									},
								],
								unmodeledRunReasons: [],
							},
						],
						tables: [],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			expect(slideXml).toContain('lIns="137160"');
			expect(slideXml).toContain('rIns="182880"');
			expect(slideXml).toContain('tIns="45720"');
			expect(slideXml).toContain('bIns="73152"');
			expect(slideXml).toContain('<a:spcBef><a:spcPts val="600"/></a:spcBef>');
			expect(slideXml).toContain('<a:spcAft><a:spcPts val="900"/></a:spcAft>');
			expect(slideXml).toContain('<a:lnSpc><a:spcPts val="2400"/></a:lnSpc>');
			expect(slideXml).toContain('<a:lnSpc><a:spcPts val="2000"/></a:lnSpc>');
			expect(slideXml).toContain('<a:pPr algn="l" marL="800100" indent="-171450">');
			expect(slideXml).toContain('<a:buChar char="&#8226;"/>');
			expect(slideXml).not.toContain('<a:alpha val="0"/>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('writes native table cell insets and line spacing as Office table properties', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-table-cell-layout-contract-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Table layout contract',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Table layout contract',
						backgroundColor: 'FFFFFF',
						texts: [],
						tables: [
							{
								x: 1,
								y: 1,
								w: 5,
								h: 1,
								colWidths: [5],
								rowHeights: [1],
								order: 10,
								rows: [
									[
										{
											text: 'Cell layout',
											rowSpan: 1,
											colSpan: 1,
											fontSize: 16,
											fontFace: 'Aptos',
											color: '111827',
											bold: false,
											italic: false,
											underline: false,
											align: 'left',
											verticalAlign: 'middle',
											fillColor: 'F8FAFC',
											borderColor: 'CBD5E1',
											borderWidthPt: 1,
											lineSpacingPt: 21,
											paddingLeftIn: 0.1,
											paddingRightIn: 0.2,
											paddingTopIn: 0.05,
											paddingBottomIn: 0.08,
										},
									],
								],
							},
						],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			expect(slideXml).toContain('name="Visible Native Table');
			expect(slideXml).toContain('anchor="ctr"');
			expect(slideXml).toContain('marL="91440"');
			expect(slideXml).toContain('marR="182880"');
			expect(slideXml).toContain('marT="45720"');
			expect(slideXml).toContain('marB="73152"');
			expect(slideXml).toContain('<a:lnSpc><a:spcPts val="2100"/></a:lnSpc>');
			expect(slideXml).not.toContain('<a:alpha val="0"/>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});

	test('splits mixed Latin and CJK text into Office font runs', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-office-font-runs-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Office font runs',
				author: 'NoteMD',
				slides: [
					{
						slideNumber: 1,
						title: 'Mixed script',
						backgroundColor: 'FFFFFF',
						texts: [
							{
								text: 'API 架构 v2',
								x: 1,
								y: 1,
								w: 5,
								h: 1,
								fontSize: 18,
								fontFace: 'Avenir Next',
								color: '111827',
								bold: false,
								italic: false,
								underline: false,
								align: 'left',
								bullet: false,
								order: 10,
								richTextParagraphs: [
									{
										runs: [
											{
												text: 'API 架构 v2',
												fontSize: 18,
												fontFace: 'Avenir Next',
												color: '111827',
												bold: false,
												italic: false,
												underline: false,
												code: false,
												link: false,
											},
										],
									},
								],
								unmodeledRunReasons: [],
							},
						],
						tables: [],
						fallbackOnlyElementKinds: [],
						consumedTableTextCandidateCount: 0,
						warnings: [],
					},
				],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			expect(slideXml).toContain('<a:t xml:space="preserve">API </a:t>');
			expect(slideXml).toContain('<a:t>架构</a:t>');
			expect(slideXml).toContain('<a:t xml:space="preserve"> v2</a:t>');
			expect(slideXml).toContain('<a:latin typeface="Noto Sans"/>');
			expect(slideXml).toContain('<a:latin typeface="Microsoft YaHei"/>');
			expect(slideXml).toContain('<a:ea typeface="Microsoft YaHei"/>');
			expect(slideXml).not.toContain('<a:t>API 架构 v2</a:t>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
