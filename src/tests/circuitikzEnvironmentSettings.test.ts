import { DEFAULT_SETTINGS } from '../constants';

describe('CircuitikZ native environment settings', () => {
    test('defaults to automatic discovery without forcing a managed download', () => {
        expect(DEFAULT_SETTINGS).toEqual(expect.objectContaining({
            circuitikzCompilerPreference: 'auto',
            circuitikzCustomCompilerKind: 'pdflatex',
            circuitikzCustomCompilerPath: '',
            circuitikzManagedRuntimeRoot: '',
            circuitikzCompileTimeoutMs: 120_000
        }));
    });
});
