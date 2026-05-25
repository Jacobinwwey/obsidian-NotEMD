import {
    defaultPackagePreviewModuleLoader,
    PackagePreviewModuleLoader
} from './packageModuleLoader';
import {
    MermaidPreviewDeps,
    validateMermaidPreviewDeps
} from './mermaidPreviewShared';

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
    void baseDir;
    // Current shipping truth is still single-bundle. The default preview runtime
    // therefore resolves directly from the bundled package runtime, not a
    // standalone render-host asset.
    return 'mermaid';
}

export async function loadBundledMermaidPreviewDeps(
    loadModule: PackagePreviewModuleLoader = defaultPackagePreviewModuleLoader,
    moduleSpecifier = resolveBundledMermaidRuntimeModuleSpecifier()
): Promise<MermaidPreviewDeps> {
    const moduleExports = await loadModule(moduleSpecifier);
    return resolveDirectMermaidDeps(moduleSpecifier, moduleExports);
}

export async function loadDefaultBundledMermaidPreviewDeps(): Promise<MermaidPreviewDeps> {
    if (!defaultDepsPromise) {
        defaultDepsPromise = loadBundledMermaidPreviewDeps();
    }

    return defaultDepsPromise;
}
