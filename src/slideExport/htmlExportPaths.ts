export function isSlidevServerHtmlEntryPath(htmlPath: string): boolean {
	return htmlPath.replace(/\\/g, '/').endsWith('/index.html');
}
