import postcss from 'postcss';
import { SLIDEV_CSS_COMPATIBILITY_CONFIG } from '../slideExport/slidevCssCompatibility';

function createTransform() {
    const config = new Function('postcss', SLIDEV_CSS_COMPATIBILITY_CONFIG
        .replace("import postcss from 'postcss';", '')
        .replace('export default', 'return'))(postcss);
    expect(config.build).toBeUndefined();
    expect(config.plugins[0].transform.order).toBe('pre');
    return config.plugins[0].transform.handler;
}

describe('Slidev CSS compatibility', () => {
    test('removes only empty Slidev style rules before Uno transforms while retaining declarations and at-rules', () => {
        const transform = createTransform();
        const css = '.empty {}\n@layer reserved {}\n.line::before { --uno: w-4 mr-6 dark-text-gray-600; }';
        const result = transform(css, 'E:\\vault\\node_modules\\@slidev\\client\\styles\\code.css?direct');
        expect(result.code).not.toContain('.empty');
        expect(result.code).toContain('@layer reserved {}');
        expect(result.code).toContain('.line::before { --uno: w-4 mr-6 dark-text-gray-600; }');
        expect(result.map).toBeTruthy();
        expect(transform(result.code, '/node_modules/@slidev/client/styles/code.css')).toBeUndefined();
    });

    test('leaves user CSS, Vue components, comments and nonempty client CSS untouched', () => {
        const transform = createTransform();
        for (const id of ['/workspace/styles/code.css', '/workspace/components/code.vue', '/workspace/@slidev/client-fork/styles/code.css']) {
            expect(transform('.empty {}', id)).toBeUndefined();
        }
        expect(transform('.comment { /* intentional */ }', '/node_modules/@slidev/client/styles/code.css')).toBeUndefined();
        expect(transform('.line { color: red }', '/node_modules/@slidev/client/styles/code.css')).toBeUndefined();
    });
});
