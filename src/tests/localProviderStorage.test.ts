import NotemdPlugin from '../main';
import { mockApp } from './__mocks__/app';
import { App } from 'obsidian';

const manifest = { id: 'notemd', name: 'Notemd', version: 'test', author: 'Test', description: 'Test', minAppVersion: '0.15.0', isDesktopOnly: false };
function vaultApp() {
    const stored = new Map<string, unknown>();
    return { ...mockApp, loadLocalStorage: jest.fn((key: string) => stored.get(key) ?? null), saveLocalStorage: jest.fn((key: string, value: unknown) => stored.set(key, value)) } as unknown as App;
}
function plugin(app: App) {
    const instance = new NotemdPlugin(app, manifest);
    instance.app = app;
    instance.saveData = jest.fn().mockResolvedValue(undefined);
    instance.loadData = jest.fn().mockResolvedValue({});
    return instance;
}
const legacyStorage = new Map<string, string>();
beforeEach(() => { legacyStorage.clear(); Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => legacyStorage.get(key) ?? null, setItem: (key: string, value: string) => legacyStorage.set(key, value), removeItem: (key: string) => legacyStorage.delete(key) } }); });
afterEach(() => { delete (globalThis as unknown as { localStorage?: Storage }).localStorage; });
const localProvider = { name: 'Local provider', model: 'local', apiKey: 'private', baseUrl: 'http://localhost:1234/v1', temperature: 0.7, localOnly: true };

test('local provider persistence is isolated by Vault and survives reload', async () => {
    const firstApp = vaultApp(); const secondApp = vaultApp();
    const first = plugin(firstApp);
    first.settings = { ...first.settings, providers: [localProvider] };
    await first.saveSettings();
    expect(firstApp.saveLocalStorage).toHaveBeenCalledWith('notemd-local-providers', [localProvider]);
    expect(first.saveData).toHaveBeenCalledWith(expect.objectContaining({ providers: [] }));
    const reloaded = plugin(firstApp); await reloaded.loadSettings();
    const other = plugin(secondApp); await other.loadSettings();
    expect(reloaded.settings.providers).toContainEqual(localProvider);
    expect(other.settings.providers).not.toContainEqual(localProvider);
});

test('a scoped storage write failure cannot silently drop local provider secrets', async () => {
    const app = vaultApp(); const instance = plugin(app);
    instance.settings = { ...instance.settings, providers: [localProvider] };
    (app.saveLocalStorage as jest.Mock).mockImplementation(() => { throw new Error('quota exceeded'); });
    await expect(instance.saveSettings()).rejects.toThrow(/quota exceeded/);
    expect(instance.saveData).not.toHaveBeenCalled();
    expect(instance.settings.providers).toContainEqual(localProvider);
});

test('legacy credentials require explicit import, preserving configured providers and global storage', async () => {
    const app = vaultApp(); const instance = plugin(app);
    const preset = { ...localProvider, name: 'OpenAI', model: 'legacy-model' };
    const legacy = JSON.stringify([preset, localProvider]);
    localStorage.setItem('notemd-local-providers', legacy);
    await instance.loadSettings();
    expect(instance.settings.providers).not.toContainEqual(localProvider);
    const configured = { ...instance.settings.providers.find(p => p.name === 'OpenAI')!, apiKey: 'existing-secret' };
    instance.settings.providers = instance.settings.providers.map(p => p.name === configured.name ? configured : p);
    expect(await instance.importLegacyLocalProviders()).toBe(1);
    expect(instance.settings.providers).toContainEqual(configured);
    expect(instance.settings.providers).toContainEqual(localProvider);
    expect(localStorage.getItem('notemd-local-providers')).toBe(legacy);
    localStorage.removeItem('notemd-local-providers');
});

test('legacy import can replace an unused preset and rolls memory back on write failure', async () => {
    const app = vaultApp(); const instance = plugin(app); await instance.loadSettings();
    const legacy = { ...localProvider, name: 'OpenAI', model: 'legacy-model' };
    localStorage.setItem('notemd-local-providers', JSON.stringify([legacy]));
    const before = instance.settings.providers;
    (app.saveLocalStorage as jest.Mock).mockImplementation(() => { throw new Error('quota'); });
    await expect(instance.importLegacyLocalProviders()).rejects.toThrow('quota');
    expect(instance.settings.providers).toBe(before);
    (app.saveLocalStorage as jest.Mock).mockImplementation(() => undefined);
    expect(await instance.importLegacyLocalProviders()).toBe(1);
    expect(instance.settings.providers).toContainEqual(legacy);
    localStorage.removeItem('notemd-local-providers');
});
