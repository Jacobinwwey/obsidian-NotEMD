import { Notice } from 'obsidian';
import { NotemdSettingTab } from '../ui/NotemdSettingTab';
import { DEFAULT_SETTINGS } from '../constants';
import { mockApp } from './__mocks__/app';

jest.mock('../providerModelDiscovery', () => ({
    discoverProviderModels: jest.fn()
}));

import { discoverProviderModels } from '../providerModelDiscovery';

type MockElement = {
    tag: string;
    text: string;
    cls: string;
    open: boolean;
    value?: string;
    options?: any[];
    onchange?: (() => unknown | Promise<unknown>) | null;
    children: MockElement[];
    parent: MockElement | null;
    listeners: Record<string, Array<() => void>>;
    attributes: Record<string, string>;
    style: Record<string, string>;
    empty: jest.Mock;
    addClass: jest.Mock;
    removeClass: jest.Mock;
    createEl: jest.Mock;
    createDiv: jest.Mock;
    setAttr: jest.Mock;
    setText: jest.Mock;
    addEventListener: jest.Mock;
    querySelector?: jest.Mock;
    dispatch: (eventName: string) => void;
};

type MockTextControl = {
    kind: 'text';
    value: string;
    placeholder: string;
    onChangeHandler?: ((value: string) => unknown | Promise<unknown>) | null;
    inputEl: {
        value: string;
        addEventListener: jest.Mock;
        blur: jest.Mock;
        setAttrs?: jest.Mock;
    };
    setPlaceholder: jest.Mock;
    setValue: jest.Mock;
    getValue: jest.Mock;
    onChange: jest.Mock;
};

type MockButtonControl = {
    kind: 'button';
    text: string;
    disabled: boolean;
    tooltip: string;
    cta: boolean;
    warning: boolean;
    onClickHandler?: (() => unknown | Promise<unknown>) | null;
    setButtonText: jest.Mock;
    setDisabled: jest.Mock;
    setTooltip: jest.Mock;
    setCta: jest.Mock;
    setWarning: jest.Mock;
    onClick: jest.Mock;
    click: () => Promise<void>;
};

type MockSliderControl = {
    kind: 'slider';
    value: number;
    onChangeHandler?: ((value: number) => unknown | Promise<unknown>) | null;
    setLimits: jest.Mock;
    setValue: jest.Mock;
    onChange: jest.Mock;
    setDynamicTooltip: jest.Mock;
};

type MockToggleControl = {
    kind: 'toggle';
    value: boolean;
    onChangeHandler?: ((value: boolean) => unknown | Promise<unknown>) | null;
    setValue: jest.Mock;
    onChange: jest.Mock;
};

type MockDropdownControl = {
    kind: 'dropdown';
    value: string;
    options: Record<string, string>;
    onChangeHandler?: ((value: string) => unknown | Promise<unknown>) | null;
    addOption: jest.Mock;
    setValue: jest.Mock;
    onChange: jest.Mock;
};

type MockTextAreaControl = {
    kind: 'textarea';
    value: string;
    placeholder: string;
    onChangeHandler?: ((value: string) => unknown | Promise<unknown>) | null;
    inputEl: {
        value: string;
        addEventListener: jest.Mock;
        blur: jest.Mock;
        setAttrs?: jest.Mock;
    };
    setPlaceholder: jest.Mock;
    setValue: jest.Mock;
    getValue: jest.Mock;
    onChange: jest.Mock;
};

type MockSettingControl =
    | MockTextControl
    | MockButtonControl
    | MockSliderControl
    | MockToggleControl
    | MockDropdownControl
    | MockTextAreaControl;

class MockSetting {
    containerEl: MockElement;
    settingEl: MockElement;
    nameEl: MockElement;
    descEl: MockElement;
    controlEl: MockElement;
    name = '';
    desc = '';
    heading = false;
    controls: MockSettingControl[] = [];

    constructor(containerEl: MockElement) {
        this.containerEl = containerEl;
        this.settingEl = createMockElement('div', { cls: 'setting-item', parent: containerEl });
        this.nameEl = createMockElement('div', { cls: 'setting-item-name', parent: this.settingEl });
        this.descEl = createMockElement('div', { cls: 'setting-item-description', parent: this.settingEl });
        this.controlEl = createMockElement('div', { cls: 'setting-item-control', parent: this.settingEl });
        this.controlEl.querySelector = jest.fn((selector: string) => {
            if (selector !== 'input') {
                return null;
            }

            const textControl = this.controls.find((control): control is MockTextControl => control.kind === 'text');
            return textControl?.inputEl ?? null;
        });
        this.settingEl.children.push(this.nameEl, this.descEl, this.controlEl);
        containerEl.children.push(this.settingEl);
    }

    setName(name: string): this {
        this.name = name;
        this.nameEl.text = name;
        return this;
    }

    setDesc(desc: string): this {
        this.desc = desc;
        this.descEl.text = desc;
        return this;
    }

    setHeading(): this {
        this.heading = true;
        this.settingEl.addClass('setting-item-heading');
        return this;
    }

    addText(callback: (control: MockTextControl) => void): this {
        const control = createMockTextControl();
        this.controls.push(control);
        callback(control);
        return this;
    }

    addTextArea(callback: (control: MockTextAreaControl) => void): this {
        const control = createMockTextAreaControl();
        this.controls.push(control);
        callback(control);
        return this;
    }

    addButton(callback: (control: MockButtonControl) => void): this {
        const control = createMockButtonControl();
        this.controls.push(control);
        callback(control);
        return this;
    }

    addSlider(callback: (control: MockSliderControl) => void): this {
        const control = createMockSliderControl();
        this.controls.push(control);
        callback(control);
        return this;
    }

    addToggle(callback: (control: MockToggleControl) => void): this {
        const control = createMockToggleControl();
        this.controls.push(control);
        callback(control);
        return this;
    }

    addDropdown(callback: (control: MockDropdownControl) => void): this {
        const control = createMockDropdownControl();
        this.controls.push(control);
        callback(control);
        return this;
    }
}

function createMockElement(
    tag = 'div',
    options: { text?: string; cls?: string; parent?: MockElement | null } = {}
): MockElement {
    const element = {
        tag,
        text: options.text ?? '',
        cls: options.cls ?? '',
        open: false,
        value: '',
        options: [],
        onchange: null,
        children: [] as MockElement[],
        parent: options.parent ?? null,
        listeners: {} as Record<string, Array<() => void>>,
        attributes: {} as Record<string, string>,
        style: {} as Record<string, string>,
        empty: jest.fn(),
        addClass: jest.fn(),
        removeClass: jest.fn(),
        createEl: jest.fn(),
        createDiv: jest.fn(),
        setAttr: jest.fn(),
        setText: jest.fn(),
        addEventListener: jest.fn(),
        querySelector: jest.fn(),
        dispatch: (eventName: string) => {
            for (const listener of element.listeners[eventName] ?? []) {
                listener();
            }
        }
    } as MockElement;

    element.empty.mockImplementation(() => {
        element.children = [];
        element.text = '';
    });

    element.addClass.mockImplementation((cls: string) => {
        element.cls = element.cls ? `${element.cls} ${cls}` : cls;
    });

    element.removeClass.mockImplementation((cls: string) => {
        element.cls = element.cls
            .split(' ')
            .filter(token => token && token !== cls)
            .join(' ');
    });

    element.setAttr.mockImplementation((name: string, value: string) => {
        element.attributes[name] = value;
    });

    element.setText.mockImplementation((text: string) => {
        element.text = text;
    });

    element.addEventListener.mockImplementation((eventName: string, listener: () => void) => {
        if (!element.listeners[eventName]) {
            element.listeners[eventName] = [];
        }
        element.listeners[eventName].push(listener);
    });

    element.createEl.mockImplementation((childTag: string, childOptions: { text?: string; cls?: string } = {}) => {
        const child = createMockElement(childTag, { ...childOptions, parent: element });
        if (childTag === 'select') {
            (child as any).add = jest.fn().mockImplementation((option: any) => {
                child.options?.push(option);
            });
        }
        element.children.push(child);
        return child;
    });

    element.createDiv.mockImplementation((childOptions: { cls?: string } = {}) => {
        const child = createMockElement('div', { ...childOptions, parent: element });
        element.children.push(child);
        return child;
    });

    return element;
}

function createMockTextControl(): MockTextControl {
    const control: MockTextControl = {
        kind: 'text' as const,
        value: '',
        placeholder: '',
        onChangeHandler: null,
        inputEl: {
            value: '',
            addEventListener: jest.fn(),
            blur: jest.fn(),
            setAttrs: jest.fn()
        },
        setPlaceholder: jest.fn(),
        setValue: jest.fn(),
        getValue: jest.fn(),
        onChange: jest.fn()
    };

    control.setPlaceholder.mockImplementation((placeholder: string) => {
        control.placeholder = placeholder;
        return control;
    });
    control.setValue.mockImplementation((value: string) => {
        control.value = value;
        control.inputEl.value = value;
        return control;
    });
    control.getValue.mockImplementation(() => control.inputEl.value);
    control.onChange.mockImplementation((handler: (value: string) => unknown | Promise<unknown>) => {
        control.onChangeHandler = handler;
        return control;
    });

    return control;
}

function createMockTextAreaControl(): MockTextAreaControl {
    const control: MockTextAreaControl = {
        kind: 'textarea' as const,
        value: '',
        placeholder: '',
        onChangeHandler: null,
        inputEl: {
            value: '',
            addEventListener: jest.fn(),
            blur: jest.fn(),
            setAttrs: jest.fn()
        },
        setPlaceholder: jest.fn(),
        setValue: jest.fn(),
        getValue: jest.fn(),
        onChange: jest.fn()
    };

    control.setPlaceholder.mockImplementation((placeholder: string) => {
        control.placeholder = placeholder;
        return control;
    });
    control.setValue.mockImplementation((value: string) => {
        control.value = value;
        control.inputEl.value = value;
        return control;
    });
    control.getValue.mockImplementation(() => control.inputEl.value);
    control.onChange.mockImplementation((handler: (value: string) => unknown | Promise<unknown>) => {
        control.onChangeHandler = handler;
        return control;
    });

    return control;
}

function createMockButtonControl(): MockButtonControl {
    const control: MockButtonControl = {
        kind: 'button' as const,
        text: '',
        disabled: false,
        tooltip: '',
        cta: false,
        warning: false,
        onClickHandler: null,
        setButtonText: jest.fn(),
        setDisabled: jest.fn(),
        setTooltip: jest.fn(),
        setCta: jest.fn(),
        setWarning: jest.fn(),
        onClick: jest.fn(),
        click: async () => {
            if (control.onClickHandler) {
                await control.onClickHandler();
            }
        }
    };

    control.setButtonText.mockImplementation((text: string) => {
        control.text = text;
        return control;
    });
    control.setDisabled.mockImplementation((disabled: boolean) => {
        control.disabled = disabled;
        return control;
    });
    control.setTooltip.mockImplementation((tooltip: string) => {
        control.tooltip = tooltip;
        return control;
    });
    control.setCta.mockImplementation(() => {
        control.cta = true;
        return control;
    });
    control.setWarning.mockImplementation(() => {
        control.warning = true;
        return control;
    });
    control.onClick.mockImplementation((handler: () => unknown | Promise<unknown>) => {
        control.onClickHandler = handler;
        return control;
    });

    return control;
}

function createMockSliderControl(): MockSliderControl {
    const control: MockSliderControl = {
        kind: 'slider' as const,
        value: 0,
        onChangeHandler: null,
        setLimits: jest.fn(),
        setValue: jest.fn(),
        onChange: jest.fn(),
        setDynamicTooltip: jest.fn()
    };

    control.setLimits.mockImplementation(() => control);
    control.setValue.mockImplementation((value: number) => {
        control.value = value;
        return control;
    });
    control.onChange.mockImplementation((handler: (value: number) => unknown | Promise<unknown>) => {
        control.onChangeHandler = handler;
        return control;
    });
    control.setDynamicTooltip.mockImplementation(() => control);

    return control;
}

function createMockToggleControl(): MockToggleControl {
    const control: MockToggleControl = {
        kind: 'toggle' as const,
        value: false,
        onChangeHandler: null,
        setValue: jest.fn(),
        onChange: jest.fn()
    };

    control.setValue.mockImplementation((value: boolean) => {
        control.value = value;
        return control;
    });
    control.onChange.mockImplementation((handler: (value: boolean) => unknown | Promise<unknown>) => {
        control.onChangeHandler = handler;
        return control;
    });

    return control;
}

function createMockDropdownControl(): MockDropdownControl {
    const control: MockDropdownControl = {
        kind: 'dropdown' as const,
        value: '',
        options: {} as Record<string, string>,
        onChangeHandler: null,
        addOption: jest.fn(),
        setValue: jest.fn(),
        onChange: jest.fn()
    };

    control.addOption.mockImplementation((value: string, label: string) => {
        control.options[value] = label;
        return control;
    });
    control.setValue.mockImplementation((value: string) => {
        control.value = value;
        return control;
    });
    control.onChange.mockImplementation((handler: (value: string) => unknown | Promise<unknown>) => {
        control.onChangeHandler = handler;
        return control;
    });

    return control;
}

function flattenElements(root: MockElement): MockElement[] {
    return [root, ...root.children.flatMap(child => flattenElements(child))];
}

function findElementByClass(root: MockElement, cls: string): MockElement | undefined {
    return flattenElements(root).find(element => element.cls.split(' ').includes(cls));
}

function collectSettings(root: MockElement): MockSetting[] {
    const settings: MockSetting[] = [];
    const visit = (element: MockElement) => {
        const maybeSetting = (element as unknown as { __setting?: MockSetting }).__setting;
        if (maybeSetting) {
            settings.push(maybeSetting);
        }
        element.children.forEach(visit);
    };
    visit(root);
    return settings;
}

function findSettingByName(root: MockElement, name: string): MockSetting | undefined {
    return collectSettings(root).find(setting => setting.name === name);
}

async function triggerDeferredTextBlur(control: MockTextControl): Promise<void> {
    const blurHandler = control.inputEl.addEventListener.mock.calls
        .find(([eventName]: [string]) => eventName === 'blur')?.[1] as (() => Promise<void> | void) | undefined;
    expect(blurHandler).toBeDefined();
    await blurHandler?.();
}

const mockSettingsCreated: MockSetting[] = [];
const mockButtonComponents: MockButtonControl[] = [];

jest.mock('obsidian', () => {
    const actual = jest.requireActual('../__mocks__/obsidian');

    const PluginSettingTab = jest.fn().mockImplementation(function (this: any, app: unknown, plugin: unknown) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = createMockElement('div');
    });

    const Setting = jest.fn().mockImplementation((containerEl: MockElement) => {
        const setting = new MockSetting(containerEl);
        (setting.settingEl as unknown as { __setting?: MockSetting }).__setting = setting;
        mockSettingsCreated.push(setting);
        return setting;
    });

    const ButtonComponent = jest.fn().mockImplementation((_containerEl: MockElement) => {
        const control = createMockButtonControl();
        mockButtonComponents.push(control);
        return control;
    });
    const TextAreaComponent = jest.fn();

    return {
        ...actual,
        PluginSettingTab,
        Setting,
        ButtonComponent,
        TextAreaComponent,
        Notice: jest.fn()
    };
});

function cloneDefaultSettings() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function createPlugin(overrides: Partial<any> = {}) {
    const settings = cloneDefaultSettings();
    settings.uiLocale = 'en';
    settings.enableDeveloperMode = true;

    return {
        app: mockApp,
        settings,
        saveSettings: jest.fn().mockResolvedValue(undefined),
        refreshLocalizedUi: jest.fn().mockResolvedValue(undefined),
        resetSettings: jest.fn().mockResolvedValue(undefined),
        ...overrides
    };
}

describe('provider settings behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSettingsCreated.length = 0;
        mockButtonComponents.length = 0;
        (globalThis as any).Option = function Option(this: any, label: string, value: string) {
            this.label = label;
            this.text = label;
            this.value = value;
        };
    });

    test('keeps advanced settings collapsed after the user closes them and reopens the settings tab', () => {
        const plugin = createPlugin();
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'DeepSeek');
        provider.topP = 0.7;
        plugin.settings.activeProvider = 'DeepSeek';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const firstAdvanced = findElementByClass(tab.containerEl, 'notemd-provider-advanced-settings');
        expect(firstAdvanced).toBeDefined();
        expect(firstAdvanced?.open).toBe(true);

        firstAdvanced!.open = false;
        firstAdvanced!.dispatch('toggle');

        tab.display();

        const secondAdvanced = findElementByClass(tab.containerEl, 'notemd-provider-advanced-settings');
        expect(secondAdvanced).toBeDefined();
        expect(secondAdvanced?.open).toBe(false);
    });

    test('applies a discovered model, shows feedback, and collapses the discovered models panel', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'DeepSeek';
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'DeepSeek');
        provider.model = 'deepseek-chat';

        (discoverProviderModels as jest.Mock).mockResolvedValue({
            models: ['deepseek-chat', 'deepseek-v4-pro'],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        let discoveryPanel = findElementByClass(tab.containerEl, 'notemd-provider-discovery-panel');
        expect(discoveryPanel).toBeDefined();
        expect(discoveryPanel?.open).toBe(true);

        const useButtons = mockButtonComponents
            .filter(control => control.text === 'Use');

        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('deepseek-v4-pro');
        expect(plugin.saveSettings).toHaveBeenCalled();
        expect(Notice).toHaveBeenCalledWith('Applied deepseek-v4-pro to DeepSeek.', 5000);

        discoveryPanel = findElementByClass(tab.containerEl, 'notemd-provider-discovery-panel');
        expect(discoveryPanel).toBeDefined();
        expect(discoveryPanel?.open).toBe(false);

        const summaryNode = findElementByClass(tab.containerEl, 'notemd-provider-discovery-summary');
        expect(summaryNode?.text).toContain('current: deepseek-v4-pro');
    });

    test('shows known model max output token guidance on model and provider override settings', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI';
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI');
        provider.model = 'gpt-4.1';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        expect(modelSetting).toBeDefined();
        expect(modelSetting?.desc).toContain('Known model max output tokens: 32768.');

        const maxOutputTokensSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        expect(maxOutputTokensSetting).toBeDefined();
        expect(maxOutputTokensSetting?.desc).toContain('Known max output tokens for gpt-4.1: 32768.');
    });

    test('refreshes model-aware guidance after model and max token edits', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI';
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI');
        provider.model = 'gpt-4.1';
        plugin.settings.maxTokens = 8192;

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        const modelControl = modelSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(modelControl).toBeDefined();

        modelControl!.inputEl.value = 'gpt-4o';
        modelControl!.getValue.mockReturnValue('gpt-4o');
        await triggerDeferredTextBlur(modelControl!);

        const refreshedModelSetting = findSettingByName(tab.containerEl, 'Model');
        expect(refreshedModelSetting?.desc).toContain('Known model max output tokens: 4096.');

        const refreshedMaxTokensSetting = findSettingByName(tab.containerEl, 'Max tokens');
        expect(refreshedMaxTokensSetting?.desc).toContain('Known max output tokens for gpt-4o: 4096.');

        const maxTokensControl = refreshedMaxTokensSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(maxTokensControl).toBeDefined();

        maxTokensControl!.inputEl.value = '9000';
        maxTokensControl!.getValue.mockReturnValue('9000');
        await triggerDeferredTextBlur(maxTokensControl!);

        const refreshedChunkSetting = findSettingByName(tab.containerEl, 'Chunk word count');
        const refreshedChunkControl = refreshedChunkSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedChunkControl?.placeholder).toBe('3000');
    });

    test('shows recommended chunk guidance in global max token description', () => {
        const plugin = createPlugin();
        plugin.settings.maxTokens = 8192;

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const maxTokensSetting = findSettingByName(tab.containerEl, 'Max tokens');
        expect(maxTokensSetting).toBeDefined();
        expect(maxTokensSetting?.desc).toContain('Recommended chunk word count: 2731.');

        const chunkWordCountSetting = findSettingByName(tab.containerEl, 'Chunk word count');
        const chunkWordTextControl = chunkWordCountSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(chunkWordTextControl).toBeDefined();
        expect(chunkWordTextControl?.placeholder).toBe('2731');
    });

    test('auto-fills chunk word count from max tokens using ceiling division until user overrides it manually', async () => {
        const plugin = createPlugin();
        plugin.settings.maxTokens = 8192;
        plugin.settings.chunkWordCount = 3000;

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const maxTokensSetting = findSettingByName(tab.containerEl, 'Max tokens');
        const maxTokensControl = maxTokensSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(maxTokensControl).toBeDefined();

        maxTokensControl!.inputEl.value = '9001';
        maxTokensControl!.getValue.mockReturnValue('9001');
        await triggerDeferredTextBlur(maxTokensControl!);

        expect(plugin.settings.maxTokens).toBe(9001);
        expect(plugin.settings.chunkWordCount).toBe(3001);

        const chunkSetting = findSettingByName(tab.containerEl, 'Chunk word count');
        const chunkControl = chunkSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(chunkControl).toBeDefined();

        chunkControl!.inputEl.value = '1234';
        chunkControl!.getValue.mockReturnValue('1234');
        await triggerDeferredTextBlur(chunkControl!);

        expect(plugin.settings.chunkWordCount).toBe(1234);

        maxTokensControl!.inputEl.value = '12000';
        maxTokensControl!.getValue.mockReturnValue('12000');
        await triggerDeferredTextBlur(maxTokensControl!);

        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
    });
});
