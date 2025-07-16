import { App, Vault, TFile, TFolder } from 'obsidian';

export const mockVault: Vault = {
    create: jest.fn(),
    createFolder: jest.fn(),
    getAbstractFileByPath: jest.fn(),
    read: jest.fn(),
    modify: jest.fn(),
    rename: jest.fn(),
    getMarkdownFiles: jest.fn(() => []),
    getAllLoadedFiles: jest.fn(() => []),
    on: jest.fn(),
    // Add other properties and methods as needed, with mock implementations
    adapter: {
        exists: jest.fn().mockResolvedValue(false),
        stat: jest.fn().mockResolvedValue(null),
        append: jest.fn().mockResolvedValue(undefined),
    } as any,
    trash: jest.fn().mockResolvedValue(undefined),
};

export const mockApp = {
    vault: mockVault,
    workspace: {
        getActiveFile: jest.fn(),
    },
    // Add other App properties and methods as needed
} as unknown as App;
