import { resolveSupportedLocaleCode } from '../i18n/languageContext';

export interface WelcomeReleaseNoteEntry {
    version: string;
    highlights: string[];
}

type WelcomeReleaseNoteCatalog = Record<string, WelcomeReleaseNoteEntry[]>;

const ENTRIES_EN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.9',
        highlights: [
            'Preview diagram now reopens saved Mermaid source consistently, so the first post-generation preview and later manual preview no longer drift apart.',
            'The Mermaid preview modal now uses a vertical action rail plus preview history switching, keeping controls inside the initial frame without horizontal scrolling.',
            'Live Obsidian verification now closes the small-diagram modal-width mismatch by sizing the outer wrapper with the preview shell instead of only expanding inner content.'
        ]
    },
    {
        version: '1.8.8',
        highlights: [
            'Sidebar API observability now ships with a quick deep-debug toggle, compact request activity region, and retry-aware liveness feedback that keeps log output visible.',
            'Preview diagram now opens supported saved artifacts directly, including Mermaid markdown, JSON Canvas, Vega-Lite markdown or JSON, and HTML files, instead of re-entering generation for saved outputs.',
            'Legacy Mermaid intent handling no longer coerces requested Mermaid-compatible intents such as erDiagram into mindmap, reducing saved-diagram preview/regeneration drift.'
        ]
    },
    {
        version: '1.8.7',
        highlights: [
            'Folder-task file filtering now converges on a shared selector contract across process/extract/translate/fix paths with include-subfolders compatibility mode and settings-driven filter semantics.',
            'Operation-level folder overrides are now wired through canonical host adapters, including batch extract original text, with non-mutation guarantees for base settings.',
            'Regex precheck semantics are now shared between settings UI and runtime matcher compilation, reducing drift risk and surfacing invalid patterns earlier.'
        ]
    },
    {
        version: '1.8.6',
        highlights: [
            'Added Settings reset controls with two modes: Complete reset (all settings) and Partial reset (keep LLM provider settings).',
            'Added the new Extract Concepts option "Replace synonyms during concept extraction", which prepends a synonym-suppression instruction for Process File/Folder and Extract Concepts.',
            'Synchronized packaged version metadata, README markers, and bilingual release notes for 1.8.6 with full regression verification gates.'
        ]
    }
];

const ENTRIES_ZH_CN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.9',
        highlights: [
            '“预览图形”现在会一致地重新打开已保存的 Mermaid 源，因此生成后首次预览与后续手动预览不再出现内容漂移。',
            'Mermaid 预览弹窗现已改为纵向操作栏并支持预览历史切换，所有按钮保持在初始视窗内，无需横向滚动。',
            '通过本机 Obsidian 实测，已收口小图场景下 modal 外层宽度与内容层错配的问题，外层 shell 现负责统一控宽。'
        ]
    },
    {
        version: '1.8.8',
        highlights: [
            'Sidebar API 可观测性现已提供快捷 deep-debug 开关、紧凑 request activity 区域与 retry-aware 测活反馈，同时继续保证 Log output 可见。',
            '“预览图形”现在可直接打开受支持的已保存产物，包括 Mermaid Markdown、JSON Canvas、Vega-Lite Markdown/JSON 与 HTML 文件，不再对已保存图形重新走生成链路。',
            'legacy Mermaid intent 处理不再把 `erDiagram` 这类兼容 Mermaid 的显式 intent 强制回退为 `mindmap`，降低保存图形的预览/再生成漂移风险。'
        ]
    },
    {
        version: '1.8.7',
        highlights: [
            '文件夹任务文件筛选已收敛到共享 selector 契约，覆盖处理/提取/翻译/修复路径，并保留 include-subfolders 兼容模式。',
            'operation 级文件夹覆盖参数（含“批量提取指定原文”）已打通 canonical host adapter，且回归锁定 base settings 不变性保障。',
            'regex 预检语义已在设置页与运行时 matcher 之间共享，非法 pattern 可更早暴露，降低配置漂移风险。'
        ]
    },
    {
        version: '1.8.6',
        highlights: [
            '设置页新增“重置设置”双模式：完整重置（全部设置）与部分重置（保留 LLM 提供商设置）。',
            '新增“概念提取时替换同义词”选项，开启后会在“处理文件/文件夹（添加链接）”与“提取概念”任务提示词前置同义词抑制约束。',
            '1.8.6 的随包版本元数据、README 版本标记与双语 release notes 已完成同步，并通过完整回归门禁验证。'
        ]
    }
];

const ENTRIES_ZH_TW: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.8.9',
        highlights: [
            '「預覽圖形」現在會一致地重新開啟已儲存的 Mermaid 來源，因此生成後首次預覽與後續手動預覽不再出現內容漂移。',
            'Mermaid 預覽彈窗現已改為縱向操作欄並支援預覽歷史切換，所有按鈕都能保持在初始視窗內，無需橫向捲動。',
            '透過本機 Obsidian 實測，已收斂小圖場景下 modal 外層寬度與內容層錯配的問題，外層 shell 現在負責統一控寬。'
        ]
    },
    {
        version: '1.8.8',
        highlights: [
            'Sidebar API 可觀測性現已提供快捷 deep-debug 開關、緊湊 request activity 區域與 retry-aware 測活回饋，同時繼續保持 Log output 可見。',
            '「預覽圖形」現在可直接開啟受支援的已儲存產物，包括 Mermaid Markdown、JSON Canvas、Vega-Lite Markdown/JSON 與 HTML 檔案，不再對已儲存圖形重新走生成鏈路。',
            'legacy Mermaid intent 處理不再把 `erDiagram` 這類相容 Mermaid 的顯式 intent 強制回退為 `mindmap`，降低已儲存圖形的預覽/再生成漂移風險。'
        ]
    },
    {
        version: '1.8.7',
        highlights: [
            '資料夾任務檔案篩選已收斂到共享 selector 契約，覆蓋處理/擷取/翻譯/修復路徑，並保留 include-subfolders 相容模式。',
            'operation 級資料夾覆蓋參數（含「批量提取指定原文」）已打通 canonical host adapter，且回歸鎖定 base settings 不變性保障。',
            'regex 預檢語義已在設定頁與執行期 matcher 之間共享，非法 pattern 可更早暴露，降低設定漂移風險。'
        ]
    },
    {
        version: '1.8.6',
        highlights: [
            '設定頁新增「重設設定」雙模式：完整重設（全部設定）與部分重設（保留 LLM 提供者設定）。',
            '新增「概念擷取時替換同義詞」選項，開啟後會在「處理檔案/資料夾（加入連結）」與「擷取概念」任務提示詞前置同義詞抑制約束。',
            '1.8.6 的隨包版本元資料、README 版本標記與雙語 release notes 已完成同步，並通過完整回歸門禁驗證。'
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
