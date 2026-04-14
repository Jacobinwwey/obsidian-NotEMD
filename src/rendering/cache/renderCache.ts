import { DiagramSpec } from '../../diagram/types';
import { RenderArtifact, RenderOptions } from '../types';

function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map(item => stableStringify(item)).join(',')}]`;
    }

    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

export class RenderCache {
    private readonly artifacts = new Map<string, RenderArtifact>();

    buildKey(spec: DiagramSpec, options: RenderOptions = {}): string {
        return stableStringify({
            spec,
            target: options.target ?? null,
            theme: options.theme ?? 'system'
        });
    }

    get(spec: DiagramSpec, options: RenderOptions = {}): RenderArtifact | null {
        return this.artifacts.get(this.buildKey(spec, options)) ?? null;
    }

    set(spec: DiagramSpec, options: RenderOptions = {}, artifact: RenderArtifact): void {
        this.artifacts.set(this.buildKey(spec, options), artifact);
    }

    clear(): void {
        this.artifacts.clear();
    }
}
