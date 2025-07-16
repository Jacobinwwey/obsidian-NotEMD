import { App, Vault, TFile, TFolder } from 'obsidian';

export const mockApp = {
    vault: {
        create: jest.fn(),
        createFolder: jest.fn(),
        getAbstractFileByPath: jest.fn(),
        read: jest.fn(),
        modify: jest.fn(),
        rename: jest.fn(),
        delete: jest.fn(),
        trash: jest.fn(),
        getFiles: jest.fn(() => []),
        getAllLoadedFiles: jest.fn(() => []), // Added
        getName: jest.fn(() => 'MyVault'),
        configDir: '.obsidian',
        adapter: {
            exists: jest.fn(),
            write: jest.fn(),
            read: jest.fn(),
            mkdir: jest.fn(),
            append: jest.fn(), // Added
            stat: jest.fn(), // Added
        },
        on: jest.fn(), // Added
    },
    workspace: {
        getActiveFile: jest.fn(),
        getActiveViewOfType: jest.fn(),
        getLeavesOfType: jest.fn(),
        revealLeaf: jest.fn(),
        getRightLeaf: jest.fn(),
        iterateAllLeaves: jest.fn(), // Added
        on: jest.fn(), // Added
    },
    metadataCache: {
        getFileCache: jest.fn(),
        getFirstLinkpathDest: jest.fn(),
    },
    // Add other App properties/methods as needed by tests
    keymap: {}, // Placeholder
    scope: {}, // Placeholder
    fileManager: {}, // Placeholder
    lastEvent: null, // Placeholder
    plugins: { // Placeholder
        enabledPlugins: new Set(),
        getPlugin: jest.fn(),
    },
    commands: { // Placeholder
        executeCommandById: jest.fn(),
    },
} as unknown as App; // Cast to App to satisfy type checking
