jest.mock('obsidian');

import { Setting } from 'obsidian';
import { NotemdSettingTab } from '../ui/NotemdSettingTab';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

type CapturedTextControl = {
    placeholder?: string;
    value?: string;
};

type CapturedToggleControl = {
    value?: boolean;
};

type MockTextApi = {
    setPlaceholder: (value: string) => MockTextApi;
    setValue: (value: string) => MockTextApi;
    onChange: (callback: (value: string) => unknown) => MockTextApi;
    inputEl?: {
        rows?: number;
        setAttrs?: (...args: unknown[]) => unknown;
    };
};

type MockToggleApi = {
    setValue: (value: boolean) => MockToggleApi;
    onChange: (callback: (value: boolean) => unknown) => MockToggleApi;
};

type MockContainerNode = {
    empty: jest.Mock;
    createEl: jest.Mock<MockContainerNode, [string?, Record<string, unknown>?]>;
    createDiv: jest.Mock<MockContainerNode, [Record<string, unknown>?]>;
    addClass: jest.Mock;
    removeClass: jest.Mock;
    setAttr: jest.Mock;
    setText: jest.Mock;
    toggleClass: jest.Mock;
    appendChild: jest.Mock;
    add: jest.Mock;
    inputEl: {
        setAttr: jest.Mock;
        value: string;
    };
};

type CapturedSetting = {
    name?: string;
    desc?: string;
    texts: CapturedTextControl[];
    toggles: CapturedToggleControl[];
};

describe('NotemdSettingTab provider controls', () => {
    const originalSetting = Setting as unknown as jest.Mock;
    let capturedSettings: CapturedSetting[];

    beforeEach(() => {
        jest.clearAllMocks();
        capturedSettings = [];
        (global as any).Option = function Option(text: string, value: string) {
            return { text, value };
        };

        originalSetting.mockImplementation(() => {
            const record: CapturedSetting = {
                texts: [],
                toggles: []
            };
            capturedSettings.push(record);

            const settingApi: any = {
                setName: jest.fn((value: string) => {
                    record.name = value;
                    return settingApi;
                }),
                setDesc: jest.fn((value: string) => {
                    record.desc = value;
                    return settingApi;
                }),
                setHeading: jest.fn(() => settingApi),
                addText: jest.fn((cb: Function) => {
                    const textRecord: CapturedTextControl = {};
                    record.texts.push(textRecord);
                    const textApi: MockTextApi = {
                        setPlaceholder: jest.fn((value: string) => {
                            textRecord.placeholder = value;
                            return textApi;
                        }),
                        setValue: jest.fn((value: string) => {
                            textRecord.value = value;
                            return textApi;
                        }),
                        onChange: jest.fn(() => textApi)
                    };
                    cb(textApi);
                    return settingApi;
                }),
                addToggle: jest.fn((cb: Function) => {
                    const toggleRecord: CapturedToggleControl = {};
                    record.toggles.push(toggleRecord);
                    const toggleApi: MockToggleApi = {
                        setValue: jest.fn((value: boolean) => {
                            toggleRecord.value = value;
                            return toggleApi;
                        }),
                        onChange: jest.fn(() => toggleApi)
                    };
                    cb(toggleApi);
                    return settingApi;
                }),
                addTextArea: jest.fn((cb: Function) => {
                    const textApi: MockTextApi = {
                        setPlaceholder: jest.fn(() => textApi),
                        setValue: jest.fn(() => textApi),
                        onChange: jest.fn(() => textApi),
                        inputEl: {
                            rows: 0,
                            setAttrs: jest.fn()
                        }
                    };
                    cb(textApi);
                    return settingApi;
                }),
                addSlider: jest.fn(() => settingApi),
                addButton: jest.fn(() => settingApi),
                addDropdown: jest.fn(() => settingApi)
            };

            return settingApi;
        });
    });

    function createPlugin(overrides: Record<string, unknown> = {}) {
        return {
            app: mockApp,
            manifest: { id: 'notemd' },
            settings: {
                ...mockSettings,
                ...overrides
            },
            saveSettings: jest.fn().mockResolvedValue(undefined)
        } as any;
    }

    function createTab(pluginOverrides: Record<string, unknown> = {}) {
        const plugin = createPlugin(pluginOverrides);
        const tab = new NotemdSettingTab(mockApp as any, plugin);
        const createContainerNode = (): MockContainerNode => ({
            empty: jest.fn(),
            createEl: jest.fn(() => createContainerNode()),
            createDiv: jest.fn(() => createContainerNode()),
            addClass: jest.fn(),
            removeClass: jest.fn()
            ,
            setAttr: jest.fn(),
            setText: jest.fn(),
            toggleClass: jest.fn(),
            appendChild: jest.fn(),
            add: jest.fn(),
            inputEl: {
                setAttr: jest.fn(),
                value: ''
            }
        });
        Object.defineProperty(tab, 'containerEl', {
            value: createContainerNode(),
            configurable: true
        });
        return { tab, plugin };
    }

    test('uses localized placeholders for top-p and reasoning effort controls', () => {
        const openAiProvider = {
            ...mockSettings.providers[0],
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5,
            topP: 0.8,
            reasoningEffort: 'high'
        };

        const { tab } = createTab({
            providers: [openAiProvider],
            activeProvider: 'OpenAI'
        });

        tab.display();

        const placeholders = capturedSettings
            .flatMap(setting => setting.texts)
            .map(text => text.placeholder)
            .filter(Boolean);

        expect(placeholders).toContain('0.0 - 1.0');
        expect(placeholders).toContain('none | low | medium | high');
    });

    test('shows max output token override control for non-openai providers when override exists', () => {
        const anthropicProvider = {
            ...mockSettings.providers[0],
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.5,
            maxOutputTokens: 8192
        };

        const { tab } = createTab({
            providers: [anthropicProvider],
            activeProvider: 'Anthropic'
        });

        tab.display();

        const hasOutputTokenSetting = capturedSettings.some(setting =>
            setting.desc === 'Optional provider-only output token cap. Leave blank to use the global Max tokens setting.'
        );

        expect(hasOutputTokenSetting).toBe(true);
    });

    test('shows DeepSeek thinking toggle only for DeepSeek provider', () => {
        const deepSeekProvider = {
            ...mockSettings.providers[0],
            name: 'DeepSeek',
            apiKey: 'deepseek-key',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-v4-pro',
            temperature: 0.5,
            thinkingEnabled: true
        };

        const { tab: deepSeekTab } = createTab({
            providers: [deepSeekProvider],
            activeProvider: 'DeepSeek'
        });
        deepSeekTab.display();

        const deepSeekHasThinking = capturedSettings.some(setting =>
            setting.name === 'Enable thinking mode'
        );

        expect(deepSeekHasThinking).toBe(true);

        capturedSettings = [];

        const anthropicProvider = {
            ...mockSettings.providers[0],
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.5
        };

        const { tab: anthropicTab } = createTab({
            providers: [anthropicProvider],
            activeProvider: 'Anthropic'
        });
        anthropicTab.display();

        const anthropicHasThinking = capturedSettings.some(setting =>
            setting.name === 'Enable thinking mode'
        );

        expect(anthropicHasThinking).toBe(false);
    });

    test('hides OpenAI-only top-p and reasoning controls for non-openai transports', () => {
        const anthropicProvider = {
            ...mockSettings.providers[0],
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.5,
            maxOutputTokens: 8192
        };

        const { tab } = createTab({
            providers: [anthropicProvider],
            activeProvider: 'Anthropic'
        });

        tab.display();

        const hasTopP = capturedSettings.some(setting => setting.name === 'Top-p');
        const hasReasoning = capturedSettings.some(setting => setting.name === 'Reasoning effort');

        expect(hasTopP).toBe(false);
        expect(hasReasoning).toBe(false);
    });

    test('shows global max-token placeholder when developer mode exposes provider override field without explicit override', () => {
        const anthropicProvider = {
            ...mockSettings.providers[0],
            name: 'Anthropic',
            apiKey: 'anthropic-key',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20240620',
            temperature: 0.5
        };

        const { tab } = createTab({
            providers: [anthropicProvider],
            activeProvider: 'Anthropic',
            enableDeveloperMode: true,
            maxTokens: 16384
        });

        tab.display();

        const outputTokenField = capturedSettings
            .find(setting => setting.desc === 'Optional provider-only output token cap. Leave blank to use the global Max tokens setting.');

        expect(outputTokenField?.texts[0]?.placeholder).toBe('16384');
    });

    test('shows Azure API version field only for Azure OpenAI provider', () => {
        const azureProvider = {
            ...mockSettings.providers[0],
            name: 'Azure OpenAI',
            apiKey: 'azure-key',
            baseUrl: 'https://azure.example.com',
            model: 'gpt-4o',
            temperature: 0.5,
            apiVersion: '2025-01-01-preview'
        };

        const { tab: azureTab } = createTab({
            providers: [azureProvider],
            activeProvider: 'Azure OpenAI'
        });
        azureTab.display();

        const azureHasApiVersion = capturedSettings.some(setting =>
            setting.name === 'API version'
        );
        expect(azureHasApiVersion).toBe(true);

        capturedSettings = [];

        const openAiProvider = {
            ...mockSettings.providers[0],
            name: 'OpenAI',
            apiKey: 'openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            temperature: 0.5
        };

        const { tab: openAiTab } = createTab({
            providers: [openAiProvider],
            activeProvider: 'OpenAI'
        });
        openAiTab.display();

        const openAiHasApiVersion = capturedSettings.some(setting =>
            setting.name === 'API version'
        );
        expect(openAiHasApiVersion).toBe(false);
    });
});
