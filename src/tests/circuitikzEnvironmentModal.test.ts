import { CircuitikzEnvironmentModal } from '../ui/CircuitikzEnvironmentModal';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

type MockElement = {
    text: string;
    cls: string;
    children: MockElement[];
    attributes: Record<string, string>;
    dataset: Record<string, string>;
    disabled: boolean;
    value: number;
    empty: jest.Mock;
    addClass: jest.Mock;
    removeClass: jest.Mock;
    setText: jest.Mock;
    setAttr: jest.Mock;
    setAttribute: jest.Mock;
    addEventListener: jest.Mock;
    createDiv: jest.Mock;
    createEl: jest.Mock;
    createSpan: jest.Mock;
    click: () => Promise<void>;
};

function createMockElement(options: { text?: string; cls?: string } = {}): MockElement {
    const listeners = new Map<string, Array<() => unknown>>();
    const element = {
        text: options.text ?? '',
        cls: options.cls ?? '',
        children: [] as MockElement[],
        attributes: {} as Record<string, string>,
        dataset: {} as Record<string, string>,
        disabled: false,
        value: 0,
        empty: jest.fn(),
        addClass: jest.fn(),
        removeClass: jest.fn(),
        setText: jest.fn(),
        setAttr: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        createDiv: jest.fn(),
        createEl: jest.fn(),
        createSpan: jest.fn(),
        click: async () => {
            for (const listener of listeners.get('click') ?? []) await listener();
        }
    } as MockElement;
    element.empty.mockImplementation(() => { element.children = []; element.text = ''; });
    element.addClass.mockImplementation((name: string) => { element.cls = `${element.cls} ${name}`.trim(); });
    element.removeClass.mockImplementation((name: string) => { element.cls = element.cls.split(' ').filter(value => value !== name).join(' '); });
    element.setText.mockImplementation((text: string) => { element.text = text; });
    element.setAttr.mockImplementation((name: string, value: string) => { element.attributes[name] = value; });
    element.setAttribute.mockImplementation((name: string, value: string) => { element.attributes[name] = value; });
    element.addEventListener.mockImplementation((name: string, listener: () => unknown) => {
        listeners.set(name, [...(listeners.get(name) ?? []), listener]);
    });
    element.createDiv.mockImplementation((childOptions: { text?: string; cls?: string } = {}) => {
        const child = createMockElement(childOptions); element.children.push(child); return child;
    });
    element.createEl.mockImplementation((_tag: string, childOptions: { text?: string; cls?: string; href?: string; attr?: Record<string, string> } = {}) => {
        const child = createMockElement(childOptions);
        child.attributes = {
            ...(childOptions.attr ?? {}),
            ...(childOptions.href ? { href: childOptions.href } : {})
        };
        element.children.push(child);
        return child;
    });
    element.createSpan.mockImplementation((childOptions: { text?: string; cls?: string } = {}) => {
        const child = createMockElement(childOptions);
        element.children.push(child);
        return child;
    });
    return element;
}

function mountModal(modal: CircuitikzEnvironmentModal): CircuitikzEnvironmentModal {
    const mounted = modal as any;
    mounted.app = mockApp;
    mounted.modalEl = createMockElement();
    mounted.titleEl = createMockElement();
    mounted.contentEl = createMockElement();
    return modal;
}

function flatten(element: MockElement): MockElement[] {
    return [element, ...element.children.flatMap(flatten)];
}

async function flushPromises(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

describe('CircuitikZ environment modal', () => {
    test('only offers cancellation while an abortable operation is active', () => {
        const modal = mountModal(new CircuitikzEnvironmentModal(mockApp, {
            settings: { ...mockSettings }, uiLocale: 'en', isDesktop: true,
            loadDesktopModule: jest.fn()
        }));
        const mounted = modal as any;

        mounted.state = 'checking';
        mounted.activeController = null;
        mounted.render();

        const content = mounted.contentEl as MockElement;
        expect(flatten(content).some(element => element.attributes['data-notemd-environment-action'] === 'cancel')).toBe(false);

        mounted.activeController = new AbortController();
        mounted.render();

        expect(flatten(content).some(element => element.attributes['data-notemd-environment-action'] === 'cancel')).toBe(true);
    });

    test('probes the desktop environment and renders compiler capabilities', async () => {
        const probeConfiguredCircuitikzEnvironment = jest.fn().mockResolvedValue({
            context: {
                platform: 'win32', architecture: 'x64', runtimeRoot: 'E:/Notemd/runtimes/latex',
                managedArtifact: { compressedBytes: 20_035_039 }, managedExecutablePath: null, candidates: []
            },
            report: {
                status: 'ready',
                selected: { kind: 'pdflatex', source: 'system', executable: 'C:/texlive/bin/pdflatex.exe' },
                capabilities: { compileDiagnostics: true, nativePdf: true, repairAcceptance: true },
                attempts: [{ candidate: { kind: 'pdflatex', source: 'system', executable: 'C:/texlive/bin/pdflatex.exe' }, status: 'ready', version: 'pdfTeX 3.141592653' }]
            }
        });
        const modal = mountModal(new CircuitikzEnvironmentModal(mockApp, {
            settings: { ...mockSettings }, uiLocale: 'en', isDesktop: true,
            loadDesktopModule: jest.fn().mockResolvedValue({
                probeConfiguredCircuitikzEnvironment,
                installConfiguredManagedTectonic: jest.fn(),
                removeConfiguredManagedTectonic: jest.fn()
            })
        }));

        modal.onOpen();
        await flushPromises();

        const content = (modal as any).contentEl as MockElement;
        expect((modal as any).titleEl.text).toBe('CircuitikZ native compile environment');
        expect(probeConfiguredCircuitikzEnvironment).toHaveBeenCalledTimes(1);
        expect(flatten(content).some(element => element.attributes['data-notemd-environment-status'] === 'ready')).toBe(true);
        expect(flatten(content).some(element => element.text.includes('pdfTeX 3.141592653'))).toBe(true);
        expect(flatten(content).filter(element => element.attributes['data-notemd-capability'] === 'available')).toHaveLength(3);
    });

    test('keeps dependency-free exports available on mobile without loading desktop modules', async () => {
        const loadDesktopModule = jest.fn();
        const modal = mountModal(new CircuitikzEnvironmentModal(mockApp, {
            settings: { ...mockSettings }, uiLocale: 'en', isDesktop: false, loadDesktopModule
        }));

        modal.onOpen();
        await flushPromises();

        const content = (modal as any).contentEl as MockElement;
        expect(loadDesktopModule).not.toHaveBeenCalled();
        expect(flatten(content).some(element => element.attributes['data-notemd-environment-status'] === 'unsupported')).toBe(true);
        expect(flatten(content).some(element => element.text.includes('SVG, PNG, and preview PDF exports still work without LaTeX'))).toBe(true);
    });

    test('links the managed runtime license and pinned release as separate truthful references', () => {
        const modal = mountModal(new CircuitikzEnvironmentModal(mockApp, {
            settings: { ...mockSettings }, uiLocale: 'en', isDesktop: false,
            loadDesktopModule: jest.fn()
        }));

        modal.onOpen();

        const links = flatten((modal as any).contentEl as MockElement)
            .filter(element => element.attributes.href)
            .map(element => ({ text: element.text, href: element.attributes.href }));
        expect(links).toEqual(expect.arrayContaining([
            {
                text: 'Tectonic license',
                href: 'https://github.com/tectonic-typesetting/tectonic/blob/tectonic%400.16.9/LICENSE'
            },
            {
                text: 'Tectonic 0.16.9 release',
                href: 'https://github.com/tectonic-typesetting/tectonic/releases/tag/tectonic%400.16.9'
            }
        ]));
    });

    test('keeps installation failures inline instead of opening a generic error modal', async () => {
        const installConfiguredManagedTectonic = jest.fn().mockResolvedValue({ status: 'failed', message: 'CircuitikZ package download timed out.' });
        const desktopModule = {
            probeConfiguredCircuitikzEnvironment: jest.fn().mockResolvedValue({
                context: { platform: 'win32', architecture: 'x64', runtimeRoot: 'E:/runtime', managedArtifact: { compressedBytes: 20_035_039 }, managedExecutablePath: null, candidates: [] },
                report: { status: 'missing', capabilities: { compileDiagnostics: false, nativePdf: false, repairAcceptance: false }, attempts: [] }
            }),
            installConfiguredManagedTectonic,
            removeConfiguredManagedTectonic: jest.fn()
        };
        const modal = mountModal(new CircuitikzEnvironmentModal(mockApp, {
            settings: { ...mockSettings }, uiLocale: 'en', isDesktop: true,
            loadDesktopModule: jest.fn().mockResolvedValue(desktopModule)
        }));
        modal.onOpen();
        await flushPromises();

        const content = (modal as any).contentEl as MockElement;
        const installButton = flatten(content).find(element => element.attributes['data-notemd-environment-action'] === 'install');
        await installButton?.click();
        await flushPromises();

        expect(installConfiguredManagedTectonic).toHaveBeenCalledTimes(1);
        expect(flatten(content).some(element => element.attributes['data-notemd-environment-status'] === 'failed')).toBe(true);
        expect(flatten(content).some(element => element.text.includes('CircuitikZ package download timed out.'))).toBe(true);
    });

    test('threads cancellation through managed-runtime removal and does not start a follow-up probe', async () => {
        let finishRemoval!: (result: { status: 'cancelled' }) => void;
        const removalFinished = new Promise<{ status: 'cancelled' }>(resolve => { finishRemoval = resolve; });
        const removeConfiguredManagedTectonic = jest.fn((_settings, input?: { signal?: AbortSignal }) => {
            expect(input?.signal).toBeInstanceOf(AbortSignal);
            return removalFinished;
        });
        const probeConfiguredCircuitikzEnvironment = jest.fn();
        const modal = mountModal(new CircuitikzEnvironmentModal(mockApp, {
            settings: { ...mockSettings }, uiLocale: 'en', isDesktop: true,
            loadDesktopModule: jest.fn().mockResolvedValue({
                probeConfiguredCircuitikzEnvironment,
                installConfiguredManagedTectonic: jest.fn(),
                removeConfiguredManagedTectonic
            })
        }));
        const mounted = modal as any;

        const removal = mounted.removeManagedRuntime();
        await flushPromises();
        const controller = mounted.activeController as AbortController | null;
        expect(controller).not.toBeNull();
        mounted.cancelOperation();
        expect(controller?.signal.aborted).toBe(true);
        finishRemoval({ status: 'cancelled' });
        await removal;

        expect(removeConfiguredManagedTectonic).toHaveBeenCalledTimes(1);
        expect(probeConfiguredCircuitikzEnvironment).not.toHaveBeenCalled();
        expect(mounted.state).toBe('cancelled');
    });

    test('exposes explicit stale-lock recovery and clears retry state before probing again', async () => {
        const clearConfiguredManagedTectonicStaleLock = jest.fn().mockResolvedValue({
            status: 'cleared',
            message: 'Cleared stale managed runtime lock.'
        });
        const probeConfiguredCircuitikzEnvironment = jest.fn().mockResolvedValue({
            context: {
                platform: 'win32', architecture: 'x64', runtimeRoot: 'E:/runtime',
                managedArtifact: { compressedBytes: 20_035_039 }, managedExecutablePath: null, candidates: []
            },
            report: {
                status: 'missing', capabilities: {
                    compileDiagnostics: false, nativePdf: false, repairAcceptance: false
                }, attempts: []
            }
        });
        const modal = mountModal(new CircuitikzEnvironmentModal(mockApp, {
            settings: { ...mockSettings }, uiLocale: 'en', isDesktop: true,
            loadDesktopModule: jest.fn().mockResolvedValue({
                probeConfiguredCircuitikzEnvironment,
                installConfiguredManagedTectonic: jest.fn(),
                removeConfiguredManagedTectonic: jest.fn(),
                clearConfiguredManagedTectonicStaleLock
            })
        }));
        const mounted = modal as any;
        mounted.state = 'failed';
        mounted.errorMessage = 'Managed runtime lock appears stale.';
        mounted.progress = { phase: 'cleanup', detail: 'old retry state' };
        mounted.render();
        const recoveryButton = flatten(mounted.contentEl as MockElement)
            .find(element => element.attributes['data-notemd-environment-action'] === 'clear-stale-lock');

        expect(recoveryButton).toBeDefined();
        await recoveryButton?.click();
        await flushPromises();

        expect(clearConfiguredManagedTectonicStaleLock).toHaveBeenCalledTimes(1);
        expect(mounted.errorMessage).toBe('');
        expect(mounted.progress).toBeNull();
        expect(probeConfiguredCircuitikzEnvironment).toHaveBeenCalledTimes(1);
    });
});
