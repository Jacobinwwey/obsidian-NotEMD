export function parse(spec: Record<string, unknown>): Record<string, unknown> {
    return spec;
}

export class View {
    constructor(private readonly runtime: unknown) {}

    async toSVG(): Promise<string> {
        return `<svg data-runtime="${typeof this.runtime}"></svg>`;
    }

    finalize(): void {}
}
