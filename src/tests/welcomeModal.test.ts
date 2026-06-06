import { WelcomeModal } from '../ui/WelcomeModal';
import { getWelcomeReleaseNotes } from '../ui/welcomeReleaseNotes';
import { getLanguage } from 'obsidian';
import { mockApp } from './__mocks__/app';

jest.mock('obsidian');

type MockElement = {
    tag: string;
    text: string;
    cls: string;
    children: MockElement[];
    attributes: Record<string, string>;
    empty: jest.Mock;
    addClass: jest.Mock;
    removeClass: jest.Mock;
    createEl: jest.Mock;
    createDiv: jest.Mock;
    setAttr: jest.Mock;
    setText: jest.Mock;
    focus: jest.Mock;
    addEventListener: jest.Mock;
};

function createMockElement(tag = 'div', options: { text?: string; cls?: string } = {}): MockElement {
    const element = {
        tag,
        text: options.text ?? '',
        cls: options.cls ?? '',
        children: [] as MockElement[],
        attributes: {} as Record<string, string>,
        empty: jest.fn(),
        addClass: jest.fn(),
        removeClass: jest.fn(),
        createEl: jest.fn(),
        createDiv: jest.fn(),
        setAttr: jest.fn(),
        setText: jest.fn(),
        focus: jest.fn(),
        addEventListener: jest.fn()
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

    element.createEl.mockImplementation((childTag: string, childOptions: { text?: string; cls?: string } = {}) => {
        const child = createMockElement(childTag, childOptions);
        element.children.push(child);
        return child;
    });

    element.createDiv.mockImplementation((childOptions: { cls?: string } = {}) => {
        const child = createMockElement('div', childOptions);
        element.children.push(child);
        return child;
    });

    return element;
}

function flattenElements(root: MockElement): MockElement[] {
    return [root, ...root.children.flatMap(child => flattenElements(child))];
}

describe('welcome modal', () => {
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

    beforeEach(() => {
        (getLanguage as jest.Mock).mockReset();
        (getLanguage as jest.Mock).mockReturnValue('en');
        (mockApp as any).setting = {
            openTabById: jest.fn()
        };
        (globalThis as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
            callback(0);
            return 0;
        };
    });

    afterEach(() => {
        (globalThis as any).requestAnimationFrame = originalRequestAnimationFrame;
        jest.restoreAllMocks();
    });

    test('renders the latest two release notes with headings and bullet points', () => {
        const modal = new WelcomeModal(mockApp, 'en') as any;
        modal.app = mockApp;
        modal.titleEl = createMockElement('h2');
        modal.contentEl = createMockElement();
        modal.modalEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();

        const nodes = flattenElements(modal.contentEl);
        const releaseNotes = getWelcomeReleaseNotes('en');

        expect(modal.titleEl.text).toBe('Welcome to Notemd');
        expect(nodes.some(node => node.cls.includes('notemd-welcome-release-notes'))).toBe(true);
        expect(releaseNotes).toHaveLength(2);

        for (const release of releaseNotes) {
            expect(nodes.some(node => node.text === `v${release.version}`)).toBe(true);
            for (const highlight of release.highlights) {
                expect(nodes.some(node => node.text === highlight)).toBe(true);
            }
        }

        expect(nodes.some(node => node.text === 'v1.9.0')).toBe(false);
    });

    test('uses localized release notes and labels for simplified chinese', () => {
        const modal = new WelcomeModal(mockApp, 'zh-CN') as any;
        modal.app = mockApp;
        modal.titleEl = createMockElement('h2');
        modal.contentEl = createMockElement();
        modal.modalEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();

        const nodes = flattenElements(modal.contentEl);
        const releaseNotes = getWelcomeReleaseNotes('zh-CN');

        expect(modal.titleEl.text).toBe('欢迎使用 Notemd');
        expect(nodes.some(node => node.text === '最近更新')).toBe(true);
        expect(nodes.some(node => node.text === '查看最近两个版本的重要更新，帮助你快速了解当前功能变化。')).toBe(true);

        for (const release of releaseNotes) {
            expect(nodes.some(node => node.text === `v${release.version}`)).toBe(true);
            expect(nodes.some(node => node.text === release.highlights[0])).toBe(true);
        }
    });

    test('uses Obsidian locale for release notes when ui locale is auto', () => {
        (getLanguage as jest.Mock).mockReturnValue('zh-cn');

        const modal = new WelcomeModal(mockApp, 'auto') as any;
        modal.app = mockApp;
        modal.titleEl = createMockElement('h2');
        modal.contentEl = createMockElement();
        modal.modalEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();

        const nodes = flattenElements(modal.contentEl);
        const releaseNotes = getWelcomeReleaseNotes('auto');

        expect(modal.titleEl.text).toBe('欢迎使用 Notemd');
        expect(releaseNotes).toHaveLength(2);
        expect(releaseNotes[0].highlights[0]).toContain('Sidebar 底部滚动区与 API 可观测性样式已恢复');
        expect(nodes.some(node => node.text === releaseNotes[0].highlights[0])).toBe(true);
        expect(nodes.some(node => node.text === '最近更新')).toBe(true);
    });

    test('keeps release notes in a dedicated scroll container and focuses the configure button', () => {
        const modal = new WelcomeModal(mockApp, 'en') as any;
        modal.app = mockApp;
        modal.titleEl = createMockElement('h2');
        modal.contentEl = createMockElement();
        modal.modalEl = createMockElement();
        modal.close = jest.fn();

        modal.onOpen();

        const nodes = flattenElements(modal.contentEl);
        const notesContainer = nodes.find(node => node.cls.includes('notemd-welcome-release-notes-scroll'));
        const configureButton = nodes.find(node => node.tag === 'button' && node.text === 'Configure LLM');

        expect(notesContainer).toBeDefined();
        expect(configureButton).toBeDefined();
        expect(configureButton?.focus).toHaveBeenCalled();
    });
});
