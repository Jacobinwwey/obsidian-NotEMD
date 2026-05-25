export type PackagePreviewModuleLoader = (moduleSpecifier: string) => Promise<unknown>;

const dynamicImportModuleLoader = new Function(
    'moduleSpecifier',
    'return import(moduleSpecifier);'
) as PackagePreviewModuleLoader;

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

export const defaultPackagePreviewModuleLoader: PackagePreviewModuleLoader = async (moduleSpecifier) => {
    const nodeRequire = resolveNodeRequire();
    if (nodeRequire && isBarePackageModuleSpecifier(moduleSpecifier)) {
        return nodeRequire(moduleSpecifier);
    }

    return dynamicImportModuleLoader(moduleSpecifier);
};
