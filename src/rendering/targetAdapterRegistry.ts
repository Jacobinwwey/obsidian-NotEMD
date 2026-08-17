import type { RenderTarget } from '../diagram/types';

export interface TargetAdapter {
    target: RenderTarget;
}

/**
 * Small keyed registry shared by the preview and render-host boundaries.
 * Duplicate target ids fail during construction so an adapter cannot shadow
 * another one silently.
 */
export class TargetAdapterRegistry<TAdapter extends TargetAdapter> {
    private readonly adaptersByTarget: Map<RenderTarget, TAdapter>;

    constructor(adapters: readonly TAdapter[]) {
        this.adaptersByTarget = new Map();
        for (const adapter of adapters) {
            if (this.adaptersByTarget.has(adapter.target)) {
                throw new Error(`Duplicate target adapter "${adapter.target}".`);
            }
            this.adaptersByTarget.set(adapter.target, adapter);
        }
    }

    resolve(target: RenderTarget): TAdapter | null {
        return this.adaptersByTarget.get(target) ?? null;
    }

    list(): readonly TAdapter[] {
        return [...this.adaptersByTarget.values()];
    }
}
