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
				fontFace: 'Avenir Next',
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
				fontFace: 'Avenir Next',
				usesEastAsiaFont: false,
			},
		]);
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
			expect(slideXml).toContain('<a:srgbClr val="111827"><a:alpha val="0"/></a:srgbClr>');
			expect(slideXml).toContain('<a:srgbClr val="2563EB"><a:alpha val="0"/></a:srgbClr>');
			expect(slideXml).toContain('u="sng"');
			expect(slideXml).toContain(
				'<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t">',
			);
			expect(slideXml).toContain('<a:normAutofit fontScale="100000"/>');
			expect(slideXml).toContain('<p:pic>');
			expect(slideXml).toContain('<p:graphicFrame>');
			expect(slideXml).toContain('<a:tbl>');
			expect(slideXml).toContain('<a:gridCol');
			expect(slideXml).toContain('<a:t>Header</a:t>');
			expect(slideXml).toContain('<a:t>值</a:t>');
			expect(slideXml).toContain('<a:t>Editable table cell</a:t>');
			expect(slideXml).toContain('gridSpan="2"');
			expect(slideXml).toContain('<a:alpha val="0"/>');
			expect(slideXml).toContain('<a:lnL><a:noFill/></a:lnL>');
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
			expect(slideXml.slice(firstLineIndex, secondLineIndex)).toContain('</a:p><a:p>');
			expect(slideXml).not.toContain('const first = 1;\nconst second = 2;');
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
			expect(slideXml).toContain('<a:latin typeface="Avenir Next"/>');
			expect(slideXml).toContain('<a:latin typeface="Microsoft YaHei"/>');
			expect(slideXml).toContain('<a:ea typeface="Microsoft YaHei"/>');
			expect(slideXml).not.toContain('<a:t>API 架构 v2</a:t>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
