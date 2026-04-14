declare module 'vega-lite' {
    export function compile(spec: Record<string, unknown>): {
        spec: Record<string, unknown>;
    };
}
