import { getCurrentUiLocale } from '../i18n';
import { resolveSupportedLocaleCode } from '../i18n/languageContext';

export interface WelcomeReleaseNoteEntry {
    version: string;
    highlights: string[];
}

type WelcomeReleaseNoteCatalog = Record<string, WelcomeReleaseNoteEntry[]>;
const WELCOME_RELEASE_NOTE_LIMIT = 2;

const ENTRIES_EN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.9.1',
        highlights: [
            'Provider settings now use a clearer core/advanced split, preserving existing advanced overrides while keeping first-run provider setup focused on required fields.',
            'Fetch model list now covers more provider catalog shapes and applies discovered token ceilings to the active provider override lane instead of silently rewriting the global Max tokens value.',
            'When a discovered model does not expose a reliable output-token ceiling, Notemd preserves any existing provider override and falls back only with an explicit manual-review notice.'
        ]
    },
    {
        version: '1.9.0',
        highlights: [
            'Developer-gated batch folder selection now ships with saved file-selection profiles, one-run folder or rule overrides, clickable preset chips, and an inline selected-file preview before the batch starts.',
            'Developer-gated relaxed input file restrictions now let selected source-preserving tasks read broader text-like files and PDF text via Obsidian\'s PDF runtime without weakening mutation-sensitive workflows.',
            'Task-aware input validation is now shared across sidebar actions, command palette entrypoints, batch host adapters, and path-based diagram generation so UI and CLI-facing surfaces stop drifting.'
        ]
    },
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
];

const ENTRIES_ZH_CN: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.9.1',
        highlights: [
            'Provider 设置现已采用更清晰的核心/高级分组：首次配置只暴露必要字段，同时会保留并自动展开已有高级覆盖项。',
            '“获取模型列表”现在覆盖更多 provider catalog 形态，并将发现到的输出 token 上限应用到当前 provider 的 override 通道，而不是静默改写全局“最大Token数”。',
            '当模型发现无法解析可靠输出 token 上限时，Notemd 会保留已有 provider 覆盖值；只有不存在有效覆盖值时才使用 fallback，并明确提示用户人工复核。'
        ]
    },
    {
        version: '1.9.0',
        highlights: [
            '开发者开关控制的 batch 文件夹选择弹窗现已支持已保存筛选档案、单次文件夹/规则覆盖、可点击 preset chips，以及批处理启动前的内联匹配文件预览。',
            '开发者开关控制的“放开输入文件限制”现可让部分保留原文件的任务读取更广泛的文本类文件，以及通过 Obsidian PDF 运行时提取文本的 PDF，同时继续保留对改写型流程的限制。',
            '任务级输入校验现已在侧边栏、命令面板、batch host adapter 与按路径图形生成入口之间共享，减少 UI 与 CLI 可见行为漂移。'
        ]
    },
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
];

const ENTRIES_ZH_TW: WelcomeReleaseNoteEntry[] = [
    {
        version: '1.9.1',
        highlights: [
            'Provider 設定現已採用更清晰的核心/進階分組：首次配置只暴露必要欄位，同時會保留並自動展開既有進階覆寫項。',
            '「取得模型列表」現在覆蓋更多 provider catalog 形態，並將發現到的輸出 token 上限套用到目前 provider 的 override 通道，而不是靜默改寫全域「最大Token數」。',
            '當模型發現無法解析可靠輸出 token 上限時，Notemd 會保留既有 provider 覆寫值；只有不存在有效覆寫值時才使用 fallback，並明確提示使用者人工複核。'
        ]
    },
    {
        version: '1.9.0',
        highlights: [
            '開發者開關控制的 batch 資料夾選取彈窗現已支援已儲存篩選設定檔、單次資料夾/規則覆寫、可點擊 preset chips，以及批次啟動前的內聯匹配檔案預覽。',
            '開發者開關控制的「放開輸入檔案限制」現在可讓部分保留原檔的任務讀取更廣泛的文字類檔案，以及透過 Obsidian PDF 執行期提取文字的 PDF，同時繼續保留對改寫型流程的限制。',
            '任務級輸入校驗現已在側欄、命令面板、batch host adapter 與按路徑圖形生成入口之間共享，降低 UI 與 CLI 可見行為漂移。'
        ]
    },
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
];

const WELCOME_RELEASE_NOTES: WelcomeReleaseNoteCatalog = {
    en: ENTRIES_EN,
    'zh-CN': ENTRIES_ZH_CN,
    'zh-TW': ENTRIES_ZH_TW
};

export function getWelcomeReleaseNotes(uiLocale: string): WelcomeReleaseNoteEntry[] {
    const locale = resolveSupportedLocaleCode(
        getCurrentUiLocale({ uiLocale }),
        Object.keys(WELCOME_RELEASE_NOTES)
    );
    return (WELCOME_RELEASE_NOTES[locale] ?? ENTRIES_EN).slice(0, WELCOME_RELEASE_NOTE_LIMIT);
}
