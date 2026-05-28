export type RenderHostRuntimeModuleLoader = (moduleSpecifier: string) => Promise<unknown>;

let configuredBundledRenderHostRuntimeModuleSpecifier: string | null = null;

const dynamicImportModuleLoader = new Function(
    'moduleSpecifier',
    'return import(moduleSpecifier);'
) as RenderHostRuntimeModuleLoader;

function isBarePackageModuleSpecifier(moduleSpecifier: string): boolean {
    return !/^(?:[a-z]+:|\/)/i.test(moduleSpecifier)
        && !moduleSpecifier.startsWith('./')
        && !moduleSpecifier.startsWith('../');
}

function resolveNodeRequire(): ((moduleSpecifier: string) => unknown) | null {
    if (typeof require === 'function') {
        return require;
    }

    try {
        return new Function('return typeof require === "function" ? require : null;')() as ((moduleSpecifier: string) => unknown) | null;
    } catch {
        return null;
    }
}

export const defaultRenderHostRuntimeModuleLoader: RenderHostRuntimeModuleLoader = async (moduleSpecifier) => {
    const nodeRequire = resolveNodeRequire();
    if (nodeRequire && isBarePackageModuleSpecifier(moduleSpecifier)) {
        return nodeRequire(moduleSpecifier);
    }

    return dynamicImportModuleLoader(moduleSpecifier);
};

export function configureBundledRenderHostRuntimeModuleSpecifier(moduleSpecifier: string | null): void {
    const normalized = typeof moduleSpecifier === 'string' ? moduleSpecifier.trim() : '';
    configuredBundledRenderHostRuntimeModuleSpecifier = normalized.length > 0 ? normalized : null;
}

export function resolveBundledRenderHostRuntimeModuleSpecifier(): string | null {
    return configuredBundledRenderHostRuntimeModuleSpecifier;
}
