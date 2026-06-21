import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { strFromU8, unzipSync } from 'fflate';
import { PPTX_SLIDE_HEIGHT_IN, PPTX_SLIDE_WIDTH_IN, type SlidevPptxDocument } from '../slideExport/pptxModel';
import { writePptxDocument } from '../slideExport/pptxWriter';

jest.mock('obsidian', () => ({
	Platform: { isDesktopApp: true },
}));

describe('pptxWriter', () => {
	test('writes a PPTX zip with editable text runs and a visual fallback image', () => {
		const directory = mkdtempSync(join(tmpdir(), 'notemd-pptx-'));
		try {
			const outputPath = join(directory, 'deck.pptx');
			const document: SlidevPptxDocument = {
				title: 'Editable deck',
				author: 'NoteMD',
				slides: [{
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
					texts: [{
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
					}],
					warnings: [],
				}],
			};

			writePptxDocument(outputPath, document);

			const entries = unzipSync(new Uint8Array(readFileSync(outputPath)));
			expect(entries['ppt/presentation.xml']).toBeDefined();
			expect(entries['ppt/slides/slide1.xml']).toBeDefined();
			expect(entries['ppt/media/image1.png']).toBeDefined();
			const slideXml = strFromU8(entries['ppt/slides/slide1.xml']);
			expect(slideXml).toContain('<a:t>可编辑 PPTX</a:t>');
			expect(slideXml).toContain('<a:t>Architecture</a:t>');
			expect(slideXml).toContain('<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="t">');
			expect(slideXml).toContain('<a:normAutofit fontScale="100000"/>');
			expect(slideXml).toContain('<p:pic>');
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
