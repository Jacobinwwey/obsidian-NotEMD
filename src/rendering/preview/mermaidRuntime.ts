import {
    defaultRenderHostRuntimeModuleLoader,
    resolveBundledRenderHostRuntimeModuleSpecifier,
    RenderHostRuntimeModuleLoader
} from './renderHostRuntimeClient';
import {
    MermaidPreviewDeps,
    validateMermaidPreviewDeps
} from './mermaidPreviewShared';

type MermaidRuntimeModule = {
    loadBundledMermaidPreviewDeps?: () => MermaidPreviewDeps | Promise<MermaidPreviewDeps>;
};

let defaultDepsPromise: Promise<MermaidPreviewDeps> | null = null;

function resolveDirectMermaidDeps(moduleSpecifier: string, moduleExports: unknown): MermaidPreviewDeps {
    const candidate = (
        moduleExports
        && typeof moduleExports === 'object'
        && 'default' in moduleExports
    )
        ? (moduleExports as Record<string, unknown>).default
        : moduleExports;

    return validateMermaidPreviewDeps(moduleSpecifier, candidate as MermaidPreviewDeps);
}

export function resolveBundledMermaidRuntimeModuleSpecifier(baseDir = __dirname): string {
    return resolveBundledRenderHostRuntimeModuleSpecifier(baseDir);
}

export async function loadBundledMermaidPreviewDeps(
    loadModule: RenderHostRuntimeModuleLoader = defaultRenderHostRuntimeModuleLoader,
    moduleSpecifier = resolveBundledMermaidRuntimeModuleSpecifier()
): Promise<MermaidPreviewDeps> {
    try {
        const moduleExports = await loadModule(moduleSpecifier) as MermaidRuntimeModule;
        if (typeof moduleExports?.loadBundledMermaidPreviewDeps !== 'function') {
            throw new Error(`Dedicated render-host runtime module did not expose loadBundledMermaidPreviewDeps: ${moduleSpecifier}`);
        }

        const deps = await moduleExports.loadBundledMermaidPreviewDeps();
        return validateMermaidPreviewDeps(moduleSpecifier, deps);
    } catch (error) {
        const fallbackSpecifier = 'mermaid';
        const fallbackModule = await loadModule(fallbackSpecifier);
        return resolveDirectMermaidDeps(fallbackSpecifier, fallbackModule);
    }
}

export async function loadDefaultBundledMermaidPreviewDeps(): Promise<MermaidPreviewDeps> {
    if (!defaultDepsPromise) {
        defaultDepsPromise = loadBundledMermaidPreviewDeps();
    }

    return defaultDepsPromise;
}
