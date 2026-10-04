import { build } from 'esbuild';
import { chromium } from 'playwright';
import * as path from 'path';

test('the production plugin loads in a browser without any Node builtin on mobile', async () => {
    // The production build contract is CommonJS and must be tested without an ESM rewrite.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createMainBundleBuildOptions } = require('../../scripts/lib/esbuild-bundle-config');
    const compiled = await build({ ...createMainBundleBuildOptions({ prod: true, write: false, logLevel: 'silent' }), absWorkingDir: path.join(__dirname, '../..') });
    const script = compiled.outputFiles?.[0]?.text;
    if (!script) throw new Error('Missing production bundle');
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.evaluate(() => {
            const host = window as unknown as { require: (name: string) => unknown; module: { exports: unknown }; exports: unknown; loaded: string[] };
            host.loaded = []; host.module = { exports: {} }; host.exports = {};
            class HostClass {}
            const api = new Proxy({ Platform: { isDesktopApp: false }, getLanguage: () => 'en' }, { get(target, key) { return key in target ? target[key as keyof typeof target] : HostClass; } });
            host.require = (name: string) => { host.loaded.push(name); if (name === 'obsidian') return api; throw new Error('Mobile cannot load ' + name); };
        });
        await page.addScriptTag({ content: script });
        expect(await page.evaluate(() => (window as unknown as { loaded: string[] }).loaded.filter(name => name !== 'obsidian'))).toEqual([]);
        expect(await page.evaluate(() => typeof (window as unknown as { module: { exports: { default?: unknown } } }).module.exports.default)).toBe('function');
    } finally { await browser.close(); }
}, 30000);
