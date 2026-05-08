import { resolveSupportedLocaleCode } from '../i18n/languageContext';

export interface WelcomeReleaseNoteEntry {
    version: string;
    highlights: string[];
}

type WelcomeReleaseNoteCatalog = Record<string, WelcomeReleaseNoteEntry[]>;

const ENTRIES_EN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.5',
        highlights: [
            'Canonical diagram actions now use consistent Generate diagram / Preview diagram wording across the sidebar, workflow builder, and runtime notices.',
            'The packaged release metadata, README version markers, welcome-modal digest, and bilingual release notes are now fully synchronized for 1.8.5.',
            'The next CLI implementation wave now advances under packaging / semantic-verification convergence with checked-in helper/runbook truth and dedicated persisted task context.'
        ]
    },
    {
        version: '1.8.4',
        highlights: [
            'Added Xiaomi MiMo and hardened the shared OpenAI-compatible provider runtime for broader provider coverage.',
            'Added batch "Extract Specific Original Text" plus a concept-note-path prerequisite warning for concept-generating flows.',
            'Fixed settings inputs that blurred after a single digit and promoted concept-note / processing settings higher in the page.'
        ]
    }
];

const ENTRIES_ZH_CN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.5',
        highlights: [
            '图形能力在侧边栏、workflow builder 与运行时通知中已统一使用 Generate diagram / Preview diagram 的 canonical 表达。',
            '随包版本元数据、README 版本标记、欢迎弹窗更新摘要与双语 release notes 已全部同步到 1.8.5。',
            'CLI 下一阶段现已沿着 packaging / semantic-verification convergence 推进，并补齐了已检入的 helper/runbook 真值与专用持久化任务上下文。'
        ]
    },
    {
        version: '1.8.4',
        highlights: [
            '新增 Xiaomi MiMo，并加固共享 OpenAI-compatible Provider 运行时，以支持更多 Provider。',
            '新增“提取指定原文”批量能力，并为会生成概念笔记的流程补齐概念笔记路径前置提示。',
            '修复设置输入框输入一个数字就失焦的问题，并将概念笔记与处理参数设置前移。'
        ]
    }
];

const ENTRIES_ZH_TW: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.5',
        highlights: [
            '圖形能力在側邊欄、workflow builder 與執行期通知中已統一使用 Generate diagram / Preview diagram 的 canonical 表達。',
            '隨包版本元資料、README 版本標記、歡迎彈窗更新摘要與雙語 release notes 已全部同步到 1.8.5。',
            'CLI 下一階段現已沿著 packaging / semantic-verification convergence 推進，並補齊了已檢入的 helper/runbook 真值與專用持久化任務上下文。'
        ]
    },
    {
        version: '1.8.4',
        highlights: [
            '新增 Xiaomi MiMo，並加固共享 OpenAI-compatible Provider 執行路徑，以支援更多 Provider。',
            '新增「提取指定原文」批次能力，並為會生成概念筆記的流程補齊概念筆記路徑前置提示。',
            '修復設定輸入框輸入一個數字就失焦的問題，並將概念筆記與處理參數設定前移。'
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
