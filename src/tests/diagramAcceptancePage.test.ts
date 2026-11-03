import { createRequire } from 'module';
const { renderDiagramAcceptancePage } = createRequire(__filename)('../../scripts/lib/diagram-acceptance-page');

const acceptance = () => ({
    baselineCommit: 'a'.repeat(40), generatedAt: '2026-10-18T12:00:00.000Z',
    cases: [{ id: 'er', title: 'ER <客户>', explanation: '字段与类型 / Fields and types', comparison: 'identical-input',
        before: { png: 'er/before.png', svg: 'er/before.svg', source: 'er/before.json', sha256: 'b'.repeat(64), kind: 'diagram', width: 960, height: 540 },
        after: { png: 'er/after.png', svg: 'er/after.svg', source: 'er/after.json', sha256: 'c'.repeat(64), kind: 'diagram', width: 1100, height: 600 },
        measurements: { before: { entities: 1 }, after: { entities: 2 } } }]
});

test('renders paired local exports with baseline and diagnostic provenance', () => {
    const document = renderDiagramAcceptancePage(acceptance());
    expect(document).toContain('er/before.png');
    expect(document).toContain('er/after.png');
    expect(document).toContain('a'.repeat(40));
    expect(document).toContain('ER &lt;客户&gt;');
    expect(document).toContain('Content-Security-Policy');
    expect(document).toContain('<dialog');
    expect(document).not.toMatch(/https?:\/\/|<script[^>]+src=/);
});

test.each(['../secret.png', 'https://example.org/export.png', 'C:/secret.png', 'er/x%2e%2e.png', 'er/x\\y.png'])('rejects a nonportable asset path %s', unsafePath => {
    const manifest = acceptance();
    manifest.cases[0].before.png = unsafePath;
    expect(() => renderDiagramAcceptancePage(manifest)).toThrow(/asset path/i);
});

test('does not interpolate authored script markup into the acceptance page', () => {
    const manifest = acceptance();
    manifest.cases[0].explanation = '</script><script>alert(1)</script>';
    const document = renderDiagramAcceptancePage(manifest);
    expect(document).not.toContain('</script><script>alert(1)</script>');
    expect(document).toContain('&lt;/script&gt;');
});

test('rejects diagnostic-only substitutes for actual diagram exports', () => {
    const manifest = acceptance();
    manifest.cases[0].after.kind = 'validation';
    expect(() => renderDiagramAcceptancePage(manifest)).toThrow(/specimen/i);
});

test('rejects an unsupported comparison claim instead of silently relabeling it', () => {
    const manifest = acceptance();
    manifest.cases[0].comparison = 'pixel-identical';
    expect(() => renderDiagramAcceptancePage(manifest)).toThrow(/comparison contract/i);
});

test('labels a reviewed-export baseline honestly and escapes its explanation', () => {
    const manifest = { ...acceptance(), baselineLabel: 'Previously reviewed output', baselineDescription: 'Reviewed baseline <not Git HEAD>', currentLabel: 'Reading revision' };
    const document = renderDiagramAcceptancePage(manifest);
    expect(document).toContain('Previously reviewed output');
    expect(document).toContain('Reading revision');
    expect(document).toContain('Reviewed baseline &lt;not Git HEAD&gt;');
    expect(document).not.toContain('优化前来自基线源码');
});
