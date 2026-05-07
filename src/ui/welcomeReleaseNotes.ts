import { resolveSupportedLocaleCode } from '../i18n/languageContext';

export interface WelcomeReleaseNoteEntry {
    version: string;
    highlights: string[];
}

type WelcomeReleaseNoteCatalog = Record<string, WelcomeReleaseNoteEntry[]>;

const ENTRIES_EN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.4',
        highlights: [
            'Added Xiaomi MiMo and hardened the shared OpenAI-compatible provider runtime for broader provider coverage.',
            'Added batch "Extract Specific Original Text" plus a concept-note-path prerequisite warning for concept-generating flows.',
            'Fixed settings inputs that blurred after a single digit and promoted concept-note / processing settings higher in the page.'
        ]
    },
    {
        version: '1.8.3',
        highlights: [
            'Added the first-install welcome modal and sponsor actions.',
            'Aligned unknown-model token resolution with Cline so default max tokens can defer to provider limits.',
            'Normalized diagram edge field aliases such as source/target into from/to.'
        ]
    }
];

const ENTRIES_ZH_CN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.4',
        highlights: [
            '新增 Xiaomi MiMo，并加固共享 OpenAI-compatible Provider 运行时，以支持更多 Provider。',
            '新增“提取指定原文”批量能力，并为会生成概念笔记的流程补齐概念笔记路径前置提示。',
            '修复设置输入框输入一个数字就失焦的问题，并将概念笔记与处理参数设置前移。'
        ]
    },
    {
        version: '1.8.3',
        highlights: [
            '新增首次安装欢迎弹窗与赞助入口。',
            '未知模型的默认最大 Token 处理与 Cline 对齐，允许交由 Provider 决定限制。',
            '图表边缘字段支持将 source/target 等别名归一化为 from/to。'
        ]
    }
];

const ENTRIES_ZH_TW: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.4',
        highlights: [
            '新增 Xiaomi MiMo，並加固共享 OpenAI-compatible Provider 執行路徑，以支援更多 Provider。',
            '新增「提取指定原文」批次能力，並為會生成概念筆記的流程補齊概念筆記路徑前置提示。',
            '修復設定輸入框輸入一個數字就失焦的問題，並將概念筆記與處理參數設定前移。'
        ]
    },
    {
        version: '1.8.3',
        highlights: [
            '新增首次安裝歡迎彈窗與贊助入口。',
            '未知模型的預設最大 Token 處理與 Cline 對齊，可交由 Provider 決定限制。',
            '圖表邊緣欄位支援將 source/target 等別名正規化為 from/to。'
        ]
    }
];

const WELCOME_RELEASE_NOTES: WelcomeReleaseNoteCatalog = {
    en: ENTRIES_EN,
    'zh-CN': ENTRIES_ZH_CN,
    'zh-TW': ENTRIES_ZH_TW
};

export function getWelcomeReleaseNotes(uiLocale: string): WelcomeReleaseNoteEntry[] {
    const locale = resolveSupportedLocaleCode(uiLocale, Object.keys(WELCOME_RELEASE_NOTES));
    return WELCOME_RELEASE_NOTES[locale] ?? ENTRIES_EN;
}
