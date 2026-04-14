import { DiagramSpec, RenderTarget } from '../diagram/types';
import { DiagramRenderer } from './types';

export class RendererRegistry {
    private readonly renderers: DiagramRenderer[];

    constructor(renderers: DiagramRenderer[] = []) {
        this.renderers = [...renderers];
    }

    register(renderer: DiagramRenderer): void {
        this.renderers.push(renderer);
    }

    resolve(spec: DiagramSpec, target?: RenderTarget): DiagramRenderer | null {
        return this.renderers.find(renderer => {
            if (target && renderer.target !== target) {
                return false;
            }
            return renderer.supports(spec);
        }) ?? null;
    }

    list(): DiagramRenderer[] {
        return [...this.renderers];
    }
}
