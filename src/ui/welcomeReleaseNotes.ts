import { resolveSupportedLocaleCode } from '../i18n/languageContext';

export interface WelcomeReleaseNoteEntry {
    version: string;
    highlights: string[];
}

type WelcomeReleaseNoteCatalog = Record<string, WelcomeReleaseNoteEntry[]>;

const ENTRIES_EN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.6',
        highlights: [
            'Added Settings reset controls with two modes: Complete reset (all settings) and Partial reset (keep LLM provider settings).',
            'Added the new Extract Concepts option "Replace synonyms during concept extraction", which prepends a synonym-suppression instruction for Process File/Folder and Extract Concepts.',
            'Synchronized packaged version metadata, README markers, and bilingual release notes for 1.8.6 with full regression verification gates.'
        ]
    },
    {
        version: '1.8.5',
        highlights: [
            'Canonical diagram actions now use consistent Generate diagram / Preview diagram wording across the sidebar, workflow builder, and runtime notices.',
            'The packaged release metadata, README version markers, welcome-modal digest, and bilingual release notes are now fully synchronized for 1.8.5.',
            'The next CLI implementation wave now advances under packaging / semantic-verification convergence with checked-in helper/runbook truth and dedicated persisted task context.'
        ]
    }
];

const ENTRIES_ZH_CN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.6',
        highlights: [
            '设置页新增“重置设置”双模式：完整重置（全部设置）与部分重置（保留 LLM 提供商设置）。',
            '新增“概念提取时替换同义词”选项，开启后会在“处理文件/文件夹（添加链接）”与“提取概念”任务提示词前置同义词抑制约束。',
            '1.8.6 的随包版本元数据、README 版本标记与双语 release notes 已完成同步，并通过完整回归门禁验证。'
        ]
    },
    {
        version: '1.8.5',
        highlights: [
            '图形能力在侧边栏、workflow builder 与运行时通知中已统一使用 Generate diagram / Preview diagram 的 canonical 表达。',
            '随包版本元数据、README 版本标记、欢迎弹窗更新摘要与双语 release notes 已全部同步到 1.8.5。',
            'CLI 下一阶段现已沿着 packaging / semantic-verification convergence 推进，并补齐了已检入的 helper/runbook 真值与专用持久化任务上下文。'
        ]
    }
];

const ENTRIES_ZH_TW: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.6',
        highlights: [
            '設定頁新增「重設設定」雙模式：完整重設（全部設定）與部分重設（保留 LLM 提供者設定）。',
            '新增「概念擷取時替換同義詞」選項，開啟後會在「處理檔案/資料夾（加入連結）」與「擷取概念」任務提示詞前置同義詞抑制約束。',
            '1.8.6 的隨包版本元資料、README 版本標記與雙語 release notes 已完成同步，並通過完整回歸門禁驗證。'
        ]
    },
    {
        version: '1.8.5',
        highlights: [
            '圖形能力在側邊欄、workflow builder 與執行期通知中已統一使用 Generate diagram / Preview diagram 的 canonical 表達。',
            '隨包版本元資料、README 版本標記、歡迎彈窗更新摘要與雙語 release notes 已全部同步到 1.8.5。',
            'CLI 下一階段現已沿著 packaging / semantic-verification convergence 推進，並補齊了已檢入的 helper/runbook 真值與專用持久化任務上下文。'
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
