import { isSlidevServerHtmlEntryPath } from '../slideExport/htmlExportPaths';

describe('htmlExportPaths', () => {
	test('detects server-script index html paths on Windows and POSIX separators', () => {
		expect(isSlidevServerHtmlEntryPath('E:\\vault\\export\\deck-slides\\index.html')).toBe(true);
		expect(isSlidevServerHtmlEntryPath('/vault/export/deck-slides/index.html')).toBe(true);
		expect(isSlidevServerHtmlEntryPath('/vault/export/deck-slides/index-standalone.html')).toBe(false);
	});
});
