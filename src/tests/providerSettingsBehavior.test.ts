import { Notice } from 'obsidian';
import { NotemdSettingTab } from '../ui/NotemdSettingTab';
import { DEFAULT_SETTINGS } from '../constants';
import { mockApp } from './__mocks__/app';

jest.mock('../providerModelDiscovery', () => ({
    discoverProviderModelsDetailed: jest.fn()
}));

import { discoverProviderModelsDetailed } from '../providerModelDiscovery';

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

function createDeferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
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

    test('separates diagram type, source format, and available export formats without developer mode', async () => {
        const plugin = createPlugin();
        plugin.settings.enableDeveloperMode = false;
        plugin.settings.enableExperimentalDiagramPipeline = true;
        plugin.settings.experimentalDiagramCompatibilityMode = 'best-fit';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const intentSetting = findSettingByName(tab.containerEl, 'Preferred diagram type');
        const targetSetting = findSettingByName(tab.containerEl, 'Preferred source format');
        const exportSetting = findSettingByName(tab.containerEl, 'Available export formats');

        expect(intentSetting).toBeDefined();
        expect(targetSetting).toBeDefined();
        expect(exportSetting).toBeDefined();
        expect(exportSetting?.desc).toBe('Source file, SVG, PNG, and PDF are available from diagram preview.');

        const intentDropdown = intentSetting?.controls.find(control => control.kind === 'dropdown') as MockDropdownControl | undefined;
        const targetDropdown = targetSetting?.controls.find(control => control.kind === 'dropdown') as MockDropdownControl | undefined;

        expect(intentDropdown?.options.circuit).toBe('Circuit diagram');
        expect(targetDropdown?.options.drawio).toBe('Draw.io source file');
        expect(targetDropdown?.options.drawnix).toBe('Drawnix source file');
        expect(targetDropdown?.options.circuitikz).toBe('CircuitikZ source file');

        await intentDropdown?.onChangeHandler?.('circuit');
        await targetDropdown?.onChangeHandler?.('circuitikz');

        expect(plugin.settings.preferredDiagramIntent).toBe('circuit');
        expect(plugin.settings.preferredDiagramRenderTarget).toBe('circuitikz');
        expect(plugin.saveSettings).toHaveBeenCalledTimes(2);
    });

    test('keeps CircuitikZ settings compatible when the diagram type changes', async () => {
        const plugin = createPlugin();
        plugin.settings.enableExperimentalDiagramPipeline = true;
        plugin.settings.experimentalDiagramCompatibilityMode = 'legacy-mermaid';
        plugin.settings.preferredDiagramIntent = 'flowchart';
        plugin.settings.preferredDiagramRenderTarget = 'drawio';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const intentSetting = findSettingByName(tab.containerEl, 'Preferred diagram type');
        const intentDropdown = intentSetting?.controls.find(control => control.kind === 'dropdown') as MockDropdownControl | undefined;

        await intentDropdown?.onChangeHandler?.('circuit');

        expect(plugin.settings.preferredDiagramIntent).toBe('circuit');
        expect(plugin.settings.preferredDiagramRenderTarget).toBe('circuitikz');
        expect(plugin.settings.experimentalDiagramCompatibilityMode).toBe('best-fit');

        await intentDropdown?.onChangeHandler?.('flowchart');

        expect(plugin.settings.preferredDiagramIntent).toBe('flowchart');
        expect(plugin.settings.preferredDiagramRenderTarget).toBeUndefined();
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

    test('reveals and persists local knowledge settings when the master toggle is enabled', async () => {
        const plugin = createPlugin();
        plugin.settings.enableLocalKnowledgeRetrieval = false;

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        expect(findSettingByName(tab.containerEl, 'Local knowledge retrieval')).toBeDefined();
        expect(findSettingByName(tab.containerEl, 'Default knowledge-base file/folder paths')).toBeUndefined();

        const enableSetting = findSettingByName(tab.containerEl, 'Enable local knowledge retrieval');
        const enableToggle = enableSetting?.controls.find(control => control.kind === 'toggle') as MockToggleControl | undefined;
        expect(enableToggle).toBeDefined();

        await enableToggle?.onChangeHandler?.(true);

        expect(plugin.settings.enableLocalKnowledgeRetrieval).toBe(true);
        expect(plugin.saveSettings).toHaveBeenCalled();
        expect(findSettingByName(tab.containerEl, 'Default knowledge-base file/folder paths')).toBeDefined();
        expect(findSettingByName(tab.containerEl, 'Retrieved section count')).toBeDefined();
        expect(findSettingByName(tab.containerEl, 'Sliding window size')).toBeDefined();
        expect(findSettingByName(tab.containerEl, 'Snippet character limit')).toBeDefined();
        expect(findSettingByName(tab.containerEl, 'Use for "Generate from title"')).toBeDefined();
        expect(findSettingByName(tab.containerEl, 'Use for "Batch generate from titles"')).toBeDefined();
        expect(findSettingByName(tab.containerEl, 'Use for "Research & summarize"')).toBeDefined();
        expect(findSettingByName(tab.containerEl, 'Use for "Generate diagram"')).toBeDefined();

        const basePathsSetting = findSettingByName(tab.containerEl, 'Default knowledge-base file/folder paths');
        const basePathsControl = basePathsSetting?.controls.find(control => control.kind === 'textarea') as MockTextAreaControl | undefined;
        expect(basePathsControl).toBeDefined();
        basePathsControl!.inputEl.value = 'Knowledge\nReferences/Architecture';
        basePathsControl!.getValue.mockReturnValue('Knowledge\nReferences/Architecture');
        await triggerDeferredTextBlur(basePathsControl! as unknown as MockTextControl);
        expect(plugin.settings.localKnowledgeBasePaths).toBe('Knowledge\nReferences/Architecture');

        const topKSetting = findSettingByName(tab.containerEl, 'Retrieved section count');
        const topKControl = topKSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(topKControl).toBeDefined();
        topKControl!.inputEl.value = '5';
        topKControl!.getValue.mockReturnValue('5');
        await triggerDeferredTextBlur(topKControl!);
        expect(plugin.settings.localKnowledgeTopK).toBe(5);

        const windowSetting = findSettingByName(tab.containerEl, 'Sliding window size');
        const windowControl = windowSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(windowControl).toBeDefined();
        windowControl!.inputEl.value = '2';
        windowControl!.getValue.mockReturnValue('2');
        await triggerDeferredTextBlur(windowControl!);
        expect(plugin.settings.localKnowledgeSlidingWindowSize).toBe(2);

        const snippetSetting = findSettingByName(tab.containerEl, 'Snippet character limit');
        const snippetControl = snippetSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(snippetControl).toBeDefined();
        snippetControl!.inputEl.value = '640';
        snippetControl!.getValue.mockReturnValue('640');
        await triggerDeferredTextBlur(snippetControl!);
        expect(plugin.settings.localKnowledgeMaxSnippetChars).toBe(640);

        const generateTitleToggle = findSettingByName(tab.containerEl, 'Use for "Generate from title"')
            ?.controls.find(control => control.kind === 'toggle') as MockToggleControl | undefined;
        const batchToggle = findSettingByName(tab.containerEl, 'Use for "Batch generate from titles"')
            ?.controls.find(control => control.kind === 'toggle') as MockToggleControl | undefined;
        const researchToggle = findSettingByName(tab.containerEl, 'Use for "Research & summarize"')
            ?.controls.find(control => control.kind === 'toggle') as MockToggleControl | undefined;
        const diagramToggle = findSettingByName(tab.containerEl, 'Use for "Generate diagram"')
            ?.controls.find(control => control.kind === 'toggle') as MockToggleControl | undefined;

        await generateTitleToggle?.onChangeHandler?.(true);
        await batchToggle?.onChangeHandler?.(true);
        await researchToggle?.onChangeHandler?.(true);
        await diagramToggle?.onChangeHandler?.(true);

        expect(plugin.settings.enableLocalKnowledgeForGenerateTitle).toBe(true);
        expect(plugin.settings.enableLocalKnowledgeForBatchGenerateFromTitles).toBe(true);
        expect(plugin.settings.enableLocalKnowledgeForResearchSummarize).toBe(true);
        expect(plugin.settings.enableLocalKnowledgeForDiagramGeneration).toBe(true);
    });

    test('persists chapter split heading level changes from the settings dropdown', async () => {
        const plugin = createPlugin();
        plugin.settings.chapterSplitHeadingLevel = 'auto';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const chapterSplitSetting = findSettingByName(tab.containerEl, 'Split heading level');
        const chapterSplitDropdown = chapterSplitSetting?.controls.find(control => control.kind === 'dropdown') as MockDropdownControl | undefined;
        expect(chapterSplitDropdown).toBeDefined();
        expect(chapterSplitDropdown?.value).toBe('auto');

        await chapterSplitDropdown?.onChangeHandler?.('h3');

        expect(plugin.settings.chapterSplitHeadingLevel).toBe('h3');
        expect(plugin.saveSettings).toHaveBeenCalled();
    });

    test('applies a discovered model, shows feedback, and collapses the discovered models panel', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'DeepSeek';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = true;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'DeepSeek');
        provider.model = 'deepseek-chat';

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['deepseek-chat', 'deepseek-v4-pro'],
            entries: [
                { id: 'deepseek-chat' },
                { id: 'deepseek-v4-pro', maxOutputTokens: 8192 }
            ],
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
        expect(provider.maxOutputTokens).toBe(384000);
        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toEqual({
            providerName: 'DeepSeek',
            modelName: 'deepseek-v4-pro',
            discoveryIdentity: expect.any(String),
            resolvedMaxOutputTokens: 384000
        });
        expect(plugin.saveSettings).toHaveBeenCalled();
        expect(Notice).toHaveBeenCalledWith(
            'Applied deepseek-v4-pro to DeepSeek and set the provider output token override to 384000.',
            7000
        );

        discoveryPanel = findElementByClass(tab.containerEl, 'notemd-provider-discovery-panel');
        expect(discoveryPanel).toBeDefined();
        expect(discoveryPanel?.open).toBe(false);

        const summaryNode = findElementByClass(tab.containerEl, 'notemd-provider-discovery-summary');
        expect(summaryNode?.text).toContain('current: deepseek-v4-pro');

        const refreshedModelSetting = findSettingByName(tab.containerEl, 'Model');
        const refreshedModelControl = refreshedModelSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedModelControl).toBeDefined();
        expect(refreshedModelControl?.inputEl.value).toBe('deepseek-v4-pro');

        const providerOverrideSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        const providerOverrideControl = providerOverrideSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(providerOverrideControl).toBeDefined();
        expect(providerOverrideControl?.inputEl.value).toBe('384000');
        expect(providerOverrideSetting?.desc).toContain('Known max output tokens for deepseek-v4-pro: 384000.');
    });

    test('preserves manual token overrides when applying a discovered model', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'DeepSeek';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = false;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'DeepSeek');
        provider.model = 'deepseek-chat';
        provider.maxOutputTokens = 5555;

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['deepseek-chat', 'deepseek-v4-pro'],
            entries: [
                { id: 'deepseek-chat' },
                { id: 'deepseek-v4-pro', maxOutputTokens: 8192 }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const useButtons = mockButtonComponents.filter(control => control.text === 'Use');
        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('deepseek-v4-pro');
        expect(provider.maxOutputTokens).toBe(5555);
        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toBeUndefined();
    });

    test('keeps the current provider override when discovered-model auto-fill is disabled', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'DeepSeek';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = false;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'DeepSeek');
        provider.model = 'deepseek-chat';
        provider.maxOutputTokens = 5555;

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['deepseek-chat', 'deepseek-v4-pro'],
            entries: [
                { id: 'deepseek-chat' },
                { id: 'deepseek-v4-pro', maxOutputTokens: 8192 }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const tokenSyncSetting = findSettingByName(tab.containerEl, 'Auto-fill provider output token override when applying a discovered model');
        const tokenSyncToggle = tokenSyncSetting?.controls.find(control => control.kind === 'toggle') as MockToggleControl | undefined;
        expect(tokenSyncToggle).toBeDefined();
        expect(tokenSyncToggle?.value).toBe(false);

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const useButtons = mockButtonComponents.filter(control => control.text === 'Use');
        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('deepseek-v4-pro');
        expect(provider.maxOutputTokens).toBe(5555);
        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toBeUndefined();

        const refreshedProviderOverrideSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        const refreshedProviderOverrideControl = refreshedProviderOverrideSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedProviderOverrideControl?.inputEl.value).toBe('5555');
    });

    test('auto-fills provider output token override when discovered-model auto-fill is enabled', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'DeepSeek';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = true;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'DeepSeek');
        provider.model = 'deepseek-chat';

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['deepseek-chat', 'deepseek-v4-pro'],
            entries: [
                { id: 'deepseek-chat' },
                { id: 'deepseek-v4-pro', maxOutputTokens: 8192 }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const tokenSyncSetting = findSettingByName(tab.containerEl, 'Auto-fill provider output token override when applying a discovered model');
        const tokenSyncToggle = tokenSyncSetting?.controls.find(control => control.kind === 'toggle') as MockToggleControl | undefined;
        expect(tokenSyncToggle).toBeDefined();
        expect(tokenSyncToggle?.value).toBe(true);

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const useButtons = mockButtonComponents.filter(control => control.text === 'Use');
        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('deepseek-v4-pro');
        expect(provider.maxOutputTokens).toBe(384000);
        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toEqual({
            providerName: 'DeepSeek',
            modelName: 'deepseek-v4-pro',
            discoveryIdentity: expect.any(String),
            resolvedMaxOutputTokens: 384000
        });
    });

    test('uses transient discovered max-output-token hints when applying a model that is absent from the static token registry', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = true;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://custom-openai-compatible.example/v1';
        provider.model = 'legacy-model';

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['custom-model-ultra'],
            entries: [
                {
                    id: 'custom-model-ultra',
                    label: 'Custom Model Ultra',
                    ownerHint: 'custom-gateway',
                    maxOutputTokens: 24576
                }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const modelMeta = findElementByClass(tab.containerEl, 'notemd-provider-model-meta');
        expect(modelMeta?.text).toContain('Custom Model Ultra');
        expect(modelMeta?.text).toContain('Provider hint: custom-gateway.');
        expect(modelMeta?.text).toContain('Known model max output tokens: 24576.');

        const useButtons = mockButtonComponents.filter(control => control.text === 'Use');
        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('custom-model-ultra');
        expect(provider.maxOutputTokens).toBe(24576);
        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toEqual({
            providerName: 'OpenAI Compatible',
            modelName: 'custom-model-ultra',
            discoveryIdentity: expect.any(String),
            resolvedMaxOutputTokens: 24576
        });

        const refreshedModelSetting = findSettingByName(tab.containerEl, 'Model');
        expect(refreshedModelSetting?.desc).toContain('Known model max output tokens: 24576.');

        const refreshedProviderOverrideSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        const refreshedProviderOverrideControl = refreshedProviderOverrideSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedProviderOverrideControl?.inputEl.value).toBe('24576');
        expect(refreshedProviderOverrideSetting?.desc).toContain('Known max output tokens for custom-model-ultra: 24576.');
    });

    test('uses discovered owner/provider hints to resolve known max-output-token guidance for bare model ids on generic gateways', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = true;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://custom-openai-compatible.example/v1';
        provider.model = 'legacy-model';

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['gpt-4.1'],
            entries: [
                {
                    id: 'gpt-4.1',
                    label: 'GPT-4.1',
                    ownerHint: 'openai'
                }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const modelMeta = findElementByClass(tab.containerEl, 'notemd-provider-model-meta');
        expect(modelMeta?.text).toContain('GPT-4.1');
        expect(modelMeta?.text).toContain('Provider hint: openai.');
        expect(modelMeta?.text).toContain('Known model max output tokens: 32768.');

        const useButtons = mockButtonComponents.filter(control => control.text === 'Use');
        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('gpt-4.1');
        expect(provider.maxOutputTokens).toBe(32768);
        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toEqual({
            providerName: 'OpenAI Compatible',
            modelName: 'gpt-4.1',
            discoveryIdentity: expect.any(String),
            resolvedMaxOutputTokens: 32768
        });

        const refreshedModelSetting = findSettingByName(tab.containerEl, 'Model');
        expect(refreshedModelSetting?.desc).toContain('Known model max output tokens: 32768.');

        const refreshedProviderOverrideSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        const refreshedProviderOverrideControl = refreshedProviderOverrideSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedProviderOverrideControl?.inputEl.value).toBe('32768');
    });

    test('uses discovered max-output-token hints sourced from real registry metadata when applying gateway models absent from the static token registry', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = true;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://custom-openai-compatible.example/v1';
        provider.model = 'legacy-model';

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['qwen/qwen3.7-max'],
            entries: [
                {
                    id: 'qwen/qwen3.7-max',
                    label: 'Qwen: Qwen3.7 Max',
                    maxOutputTokens: 65536
                }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const modelMeta = findElementByClass(tab.containerEl, 'notemd-provider-model-meta');
        expect(modelMeta?.text).toContain('Qwen: Qwen3.7 Max');
        expect(modelMeta?.text).toContain('Known model max output tokens: 65536.');

        const useButtons = mockButtonComponents.filter(control => control.text === 'Use');
        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('qwen/qwen3.7-max');
        expect(provider.maxOutputTokens).toBe(65536);
        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toEqual({
            providerName: 'OpenAI Compatible',
            modelName: 'qwen/qwen3.7-max',
            discoveryIdentity: expect.any(String),
            resolvedMaxOutputTokens: 65536
        });
    });

    test('preserves an existing provider output token override when a discovered model has no resolvable max output tokens', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = true;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://custom-openai-compatible.example/v1';
        provider.model = 'legacy-model';
        provider.maxOutputTokens = 7777;

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['opaque-model'],
            entries: [
                {
                    id: 'opaque-model',
                    label: 'Opaque Model'
                }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const useButtons = mockButtonComponents.filter(control => control.text === 'Use');
        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('opaque-model');
        expect(provider.maxOutputTokens).toBe(7777);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toBeUndefined();
        expect(Notice).toHaveBeenCalledWith(
            'Applied opaque-model to OpenAI Compatible. Could not resolve this model\'s max output tokens here, so set the provider output token override to fallback 7777; review it manually.',
            7000
        );

        const refreshedProviderOverrideSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        const refreshedProviderOverrideControl = refreshedProviderOverrideSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedProviderOverrideControl?.inputEl.value).toBe('7777');
    });

    test('uses the conservative fallback when a discovered model has no resolvable max output tokens and no existing provider override', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.autoApplyDiscoveredModelMaxOutputTokens = true;
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://custom-openai-compatible.example/v1';
        provider.model = 'legacy-model';
        provider.maxOutputTokens = undefined;

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['opaque-model'],
            entries: [
                {
                    id: 'opaque-model',
                    label: 'Opaque Model'
                }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const useButtons = mockButtonComponents.filter(control => control.text === 'Use');
        expect(useButtons).toHaveLength(1);

        await useButtons[0].click();

        expect(provider.model).toBe('opaque-model');
        expect(provider.maxOutputTokens).toBe(DEFAULT_SETTINGS.maxTokens);
        expect(plugin.settings.discoveredModelMaxOutputTokensTracking).toBeUndefined();
        expect(Notice).toHaveBeenCalledWith(
            'Applied opaque-model to OpenAI Compatible. Could not resolve this model\'s max output tokens here, so set the provider output token override to fallback 8192; review it manually.',
            7000
        );

        const refreshedProviderOverrideSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        const refreshedProviderOverrideControl = refreshedProviderOverrideSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedProviderOverrideControl?.inputEl.value).toBe(String(DEFAULT_SETTINGS.maxTokens));
    });

    test('clears transient discovery results and token hints when the provider discovery identity changes', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://custom-openai-compatible.example/v1';
        provider.model = 'custom-model-ultra';

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['custom-model-ultra'],
            entries: [
                {
                    id: 'custom-model-ultra',
                    label: 'Custom Model Ultra',
                    maxOutputTokens: 24576
                }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        expect(findElementByClass(tab.containerEl, 'notemd-provider-discovery-panel')).toBeDefined();
        const modelSettingBeforeIdentityChange = findSettingByName(tab.containerEl, 'Model');
        expect(modelSettingBeforeIdentityChange?.desc).toContain('Known model max output tokens: 24576.');

        const baseUrlSetting = findSettingByName(tab.containerEl, 'Base URL / endpoint');
        const baseUrlControl = baseUrlSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(baseUrlControl).toBeDefined();

        baseUrlControl!.inputEl.value = 'https://another-openai-compatible.example/v1';
        baseUrlControl!.getValue.mockReturnValue('https://another-openai-compatible.example/v1');
        await triggerDeferredTextBlur(baseUrlControl!);

        expect(provider.baseUrl).toBe('https://another-openai-compatible.example/v1');
        expect(findElementByClass(tab.containerEl, 'notemd-provider-discovery-panel')).toBeUndefined();

        const modelSettingAfterIdentityChange = findSettingByName(tab.containerEl, 'Model');
        expect(modelSettingAfterIdentityChange?.desc).not.toContain('Known model max output tokens: 24576.');

        const refreshedFetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(refreshedFetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');
    });

    test('restores auto-managed global max tokens and chunk guidance when a discovery identity change invalidates the old transient ceiling', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.maxTokens = 24576;
        plugin.settings.chunkWordCount = 8192;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://custom-openai-compatible.example/v1';
        provider.model = 'custom-model-ultra';

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['custom-model-ultra'],
            entries: [
                {
                    id: 'custom-model-ultra',
                    label: 'Custom Model Ultra',
                    maxOutputTokens: 24576
                }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const baseUrlSetting = findSettingByName(tab.containerEl, 'Base URL / endpoint');
        const baseUrlControl = baseUrlSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(baseUrlControl).toBeDefined();

        baseUrlControl!.inputEl.value = 'https://another-openai-compatible.example/v1';
        baseUrlControl!.getValue.mockReturnValue('https://another-openai-compatible.example/v1');
        await triggerDeferredTextBlur(baseUrlControl!);

        expect(plugin.settings.maxTokens).toBe(DEFAULT_SETTINGS.maxTokens);
        expect(plugin.settings.chunkWordCount).toBe(2731);

        const refreshedChunkSetting = findSettingByName(tab.containerEl, 'Chunk word count');
        const refreshedChunkControl = refreshedChunkSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedChunkControl?.value).toBe('2731');
        expect(refreshedChunkControl?.placeholder).toBe('2731');
    });

    test('preserves manual max tokens and chunk settings when the provider discovery identity changes', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://custom-openai-compatible.example/v1';
        provider.model = 'custom-model-ultra';

        (discoverProviderModelsDetailed as jest.Mock).mockResolvedValue({
            models: ['custom-model-ultra'],
            entries: [
                {
                    id: 'custom-model-ultra',
                    label: 'Custom Model Ultra',
                    maxOutputTokens: 24576
                }
            ],
            source: 'remote'
        });

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        await fetchButton?.click();

        const baseUrlSetting = findSettingByName(tab.containerEl, 'Base URL / endpoint');
        const baseUrlControl = baseUrlSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(baseUrlControl).toBeDefined();

        baseUrlControl!.inputEl.value = 'https://another-openai-compatible.example/v1';
        baseUrlControl!.getValue.mockReturnValue('https://another-openai-compatible.example/v1');
        await triggerDeferredTextBlur(baseUrlControl!);

        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
    });

    test('ignores stale in-flight discovery responses after the provider discovery identity changes', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://old-openai-compatible.example/v1';
        provider.model = 'custom-model-ultra';

        const deferred = createDeferred<{
            models: string[];
            entries: Array<{ id: string; label?: string; maxOutputTokens?: number }>;
            source: 'remote';
        }>();
        (discoverProviderModelsDetailed as jest.Mock).mockReturnValueOnce(deferred.promise);

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();

        const pendingFetch = fetchButton!.click();

        const loadingFetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const loadingFetchButton = loadingFetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(loadingFetchButton?.text).toBe('Fetching...');

        const baseUrlSetting = findSettingByName(tab.containerEl, 'Base URL / endpoint');
        const baseUrlControl = baseUrlSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(baseUrlControl).toBeDefined();

        baseUrlControl!.inputEl.value = 'https://new-openai-compatible.example/v1';
        baseUrlControl!.getValue.mockReturnValue('https://new-openai-compatible.example/v1');
        await triggerDeferredTextBlur(baseUrlControl!);

        expect(provider.baseUrl).toBe('https://new-openai-compatible.example/v1');
        expect(findElementByClass(tab.containerEl, 'notemd-provider-discovery-panel')).toBeUndefined();

        deferred.resolve({
            models: ['custom-model-ultra'],
            entries: [
                {
                    id: 'custom-model-ultra',
                    label: 'Custom Model Ultra',
                    maxOutputTokens: 24576
                }
            ],
            source: 'remote'
        });
        await pendingFetch;

        expect(findElementByClass(tab.containerEl, 'notemd-provider-discovery-panel')).toBeUndefined();
        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        expect(modelSetting?.desc).not.toContain('Known model max output tokens: 24576.');

        const currentFetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        const currentFetchButton = currentFetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(currentFetchButton?.text).toBe('Fetch models');
    });

    test('shows an actionable discovery disable reason for manual-first providers that stay unsupported', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'Azure OpenAI';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('deployment-specific');
        expect(fetchSetting?.desc).toContain('deployment name');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(true);
    });

    test('keeps fetch-models available for Hugging Face now that it shares the bounded OpenAI-compatible discovery path', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'Hugging Face';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');
        expect(fetchSetting?.desc).not.toContain('manual-first');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
    });

    test('keeps fetch-models available for GitHub Models via its hosted catalog family', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'GitHub Models';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');
        expect(fetchSetting?.desc).not.toContain('manual-first');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
    });

    test('keeps fetch-models available for PPIO via its dedicated bounded registry merge', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'PPIO';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
    });

    test('keeps fetch-models available for New API through the shared OpenAI-compatible discovery flow', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'New API';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
    });

    test('keeps fetch-models available for OVMS through its bounded local registry flow', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OVMS';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
    });

    test('keeps fetch-models available for generic OpenAI Compatible endpoints that resolve to a supported gateway family', () => {
        const plugin = createPlugin();
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://openrouter.ai/api/v1';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');
        expect(fetchSetting?.desc).not.toContain('manual-first');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
    });

    test('keeps fetch-models available for generic OpenAI Compatible endpoints that resolve to GitHub Models', () => {
        const plugin = createPlugin();
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://models.github.ai/inference';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');
        expect(fetchSetting?.desc).not.toContain('manual-first');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
    });

    test('keeps fetch-models available for generic OpenAI Compatible endpoints that resolve to OVMS-style local v3 registries', () => {
        const plugin = createPlugin();
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'http://localhost:8000/v3';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');
        expect(fetchSetting?.desc).not.toContain('manual-first');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
    });

    test('keeps fetch-models available for generic OpenAI Compatible endpoints entered as /responses roots', () => {
        const plugin = createPlugin();
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://api.openai.com/v1/responses';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const fetchSetting = findSettingByName(tab.containerEl, 'Fetch model list');
        expect(fetchSetting).toBeDefined();
        expect(fetchSetting?.desc).toContain('Query the provider endpoint for available model IDs.');
        expect(fetchSetting?.desc).not.toContain('manual-first');

        const fetchButton = fetchSetting?.controls.find(control => control.kind === 'button') as MockButtonControl | undefined;
        expect(fetchButton).toBeDefined();
        expect(fetchButton?.disabled).toBe(false);
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

    test('shows mapped known model max output token guidance for GitHub Models gateway presets', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'GitHub Models';
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'GitHub Models');
        provider.model = 'openai/gpt-4o';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        expect(modelSetting).toBeDefined();
        expect(modelSetting?.desc).toContain('Known model max output tokens: 4096.');

        const maxOutputTokensSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        expect(maxOutputTokensSetting).toBeDefined();
        expect(maxOutputTokensSetting?.desc).toContain('Known max output tokens for openai/gpt-4o: 4096.');
    });

    test('shows mapped known model max output token guidance for generic OpenAI Compatible gateway models', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://models.github.ai/inference';
        provider.model = 'anthropic/claude-sonnet-4.5';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        expect(modelSetting).toBeDefined();
        expect(modelSetting?.desc).toContain('Known model max output tokens: 64000.');

        const maxOutputTokensSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        expect(maxOutputTokensSetting).toBeDefined();
        expect(maxOutputTokensSetting?.desc).toContain('Known max output tokens for anthropic/claude-sonnet-4.5: 64000.');
    });

    test('shows host-aware known model max output token guidance for generic OpenAI Compatible bare model IDs on known official hosts', () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://api.openai.com/v1';
        provider.model = 'gpt-4o';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        expect(modelSetting).toBeDefined();
        expect(modelSetting?.desc).toContain('Known model max output tokens: 4096.');

        const maxOutputTokensSetting = findSettingByName(tab.containerEl, 'Provider output token override');
        expect(maxOutputTokensSetting).toBeDefined();
        expect(maxOutputTokensSetting?.desc).toContain('Known max output tokens for gpt-4o: 4096.');
    });

    test('auto-syncs max tokens and chunk word count when the selected model changes while defaults are still auto-managed', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI';
        plugin.settings.maxTokens = DEFAULT_SETTINGS.maxTokens;
        plugin.settings.chunkWordCount = DEFAULT_SETTINGS.chunkWordCount;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI');
        provider.model = 'gpt-4o';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        const modelControl = modelSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(modelControl).toBeDefined();

        modelControl!.inputEl.value = 'gpt-4.1';
        modelControl!.getValue.mockReturnValue('gpt-4.1');
        await triggerDeferredTextBlur(modelControl!);

        expect(provider.model).toBe('gpt-4.1');
        expect(plugin.settings.maxTokens).toBe(32768);
        expect(plugin.settings.chunkWordCount).toBe(10923);

        const refreshedChunkSetting = findSettingByName(tab.containerEl, 'Chunk word count');
        const refreshedChunkControl = refreshedChunkSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(refreshedChunkControl?.value).toBe('10923');
        expect(refreshedChunkControl?.placeholder).toBe('10923');
    });

    test('auto-syncs max tokens and chunk word count for GitHub Models when the selected gateway model has mapped token metadata', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'GitHub Models';
        plugin.settings.maxTokens = DEFAULT_SETTINGS.maxTokens;
        plugin.settings.chunkWordCount = DEFAULT_SETTINGS.chunkWordCount;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'GitHub Models');
        provider.model = 'gpt-4o-mini';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        const modelControl = modelSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(modelControl).toBeDefined();

        modelControl!.inputEl.value = 'openai/gpt-4o';
        modelControl!.getValue.mockReturnValue('openai/gpt-4o');
        await triggerDeferredTextBlur(modelControl!);

        expect(provider.model).toBe('openai/gpt-4o');
        expect(plugin.settings.maxTokens).toBe(4096);
        expect(plugin.settings.chunkWordCount).toBe(1366);
    });

    test('auto-syncs max tokens and chunk word count for generic OpenAI Compatible on known official hosts when the selected bare model has known metadata', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.maxTokens = DEFAULT_SETTINGS.maxTokens;
        plugin.settings.chunkWordCount = DEFAULT_SETTINGS.chunkWordCount;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI Compatible');
        provider.baseUrl = 'https://api.openai.com/v1';
        provider.model = 'unknown-model';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        const modelControl = modelSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(modelControl).toBeDefined();

        modelControl!.inputEl.value = 'gpt-4o';
        modelControl!.getValue.mockReturnValue('gpt-4o');
        await triggerDeferredTextBlur(modelControl!);

        expect(provider.model).toBe('gpt-4o');
        expect(plugin.settings.maxTokens).toBe(4096);
        expect(plugin.settings.chunkWordCount).toBe(1366);
    });

    test('preserves manual max tokens and chunk word count when the selected model changes', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI';
        plugin.settings.maxTokens = 12000;
        plugin.settings.chunkWordCount = 1234;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI');
        provider.model = 'gpt-4o';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        const modelControl = modelSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(modelControl).toBeDefined();

        modelControl!.inputEl.value = 'gpt-4.1';
        modelControl!.getValue.mockReturnValue('gpt-4.1');
        await triggerDeferredTextBlur(modelControl!);

        expect(provider.model).toBe('gpt-4.1');
        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.chunkWordCount).toBe(1234);
    });

    test('restores the default auto baseline when switching from a known model to an unknown model while token settings still track the model default', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI';
        plugin.settings.maxTokens = 4096;
        plugin.settings.chunkWordCount = 1366;
        const provider = plugin.settings.providers.find((entry: any) => entry.name === 'OpenAI');
        provider.model = 'gpt-4o';

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const modelSetting = findSettingByName(tab.containerEl, 'Model');
        const modelControl = modelSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(modelControl).toBeDefined();

        modelControl!.inputEl.value = 'custom-unknown-model';
        modelControl!.getValue.mockReturnValue('custom-unknown-model');
        await triggerDeferredTextBlur(modelControl!);

        expect(provider.model).toBe('custom-unknown-model');
        expect(plugin.settings.maxTokens).toBe(DEFAULT_SETTINGS.maxTokens);
        expect(plugin.settings.chunkWordCount).toBe(2731);
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

    test('clears model-aware tracking when the user manually edits global max tokens', async () => {
        const plugin = createPlugin();
        plugin.settings.activeProvider = 'OpenAI Compatible';
        plugin.settings.maxTokens = 24576;
        plugin.settings.chunkWordCount = 8192;
        plugin.settings.globalModelAwareMaxTokensTracking = {
            providerName: 'OpenAI Compatible',
            modelName: 'custom-model-ultra',
            discoveryIdentity: 'tracked-identity',
            resolvedMaxTokens: 24576
        };

        const tab = new NotemdSettingTab(mockApp as any, plugin as any) as any;
        tab.display();

        const maxTokensSetting = findSettingByName(tab.containerEl, 'Max tokens');
        const maxTokensControl = maxTokensSetting?.controls.find(control => control.kind === 'text') as MockTextControl | undefined;
        expect(maxTokensControl).toBeDefined();

        maxTokensControl!.inputEl.value = '12000';
        maxTokensControl!.getValue.mockReturnValue('12000');
        await triggerDeferredTextBlur(maxTokensControl!);

        expect(plugin.settings.maxTokens).toBe(12000);
        expect(plugin.settings.globalModelAwareMaxTokensTracking).toBeUndefined();
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
