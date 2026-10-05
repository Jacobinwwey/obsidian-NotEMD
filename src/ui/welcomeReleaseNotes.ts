import { getCurrentUiLocale } from '../i18n';
import { resolveSupportedLocaleCode } from '../i18n/languageContext';

export interface WelcomeReleaseNoteEntry {
    version: string;
    highlights: string[];
}

type WelcomeReleaseNoteCatalog = Record<string, WelcomeReleaseNoteEntry[]>;
const WELCOME_RELEASE_NOTE_LIMIT = 2;

const ENTRIES_EN: WelcomeReleaseNoteEntry[] = [
    {"version":"1.9.11","highlights":["Drawnix places closely related branches nearer and reduces connector overlap and crossings, preserving every node and explicit relationship. Cross-branch arrows remain static after rearrangement.","PDF export handles complex SVG selectors and inherited styles after sanitization. Missing viewBoxes are restored; oversized pages are scaled proportionally while retaining vectors.","Diagnostics are grouped by tag and collapsed by default. Expand a group to read every message and suggestion; severity counts remain visible.","Logs accumulate across task stages and preview reopening during the plugin session. Use Clear log to reset them; reloading the plugin does not preserve the transcript."]},
    {"version":"1.9.10","highlights":["Imported SVG previews now strip active content and external resources while preserving vector labels and panel styles. Mobile startup keeps desktop dependencies lazy.","Device-only providers are Vault-scoped. Explicit legacy import preserves the old list and configured providers; storage, favorites and clipboard failures are visible.","Presentation HTML uses a loopback server with shared-consumer lifecycle control. Requested PNGs and verified compatibility companions remain available; Drawnix has no fixed relation quota."]},
    {
        version: '1.9.9',
        highlights: [
            'Select several chart types in one run and choose multiple output formats independently for each type. Unchecking a type retains its format preferences; leaving every type unchecked uses automatic analysis.',
            'Selected files are exported automatically beside the source note, or directly into the configured output folder. Names include the type, such as `topic_drawnix.pdf` and `topic_flowchart.svg`; collisions add `-2`, `-3` and so on without overwriting existing files.',
            'Drawnix preserves all explicit directed relationships without a fixed total or per-node limit. Identical claims are deduplicated; different predicates and reverse directions remain distinct. Overlapping exterior routes use separate tracks, disjoint routes reuse tracks, and labels receive separate measured rows. The canvas grows to retain relationships. Unlabeled, generic or redundant hierarchy arrows remain in metadata with reasons. Boxed relation text stays visible in PDF, including older cached SVG. Cross-branch arrows remain static and may detach after rearrangement in Drawnix.'
        ]
    },
    {
        version: '1.9.8',
        highlights: [
            'Cancellation reaches queued work, provider transports and retries; overlapping diagram saves preserve conflicting edits and report recovery outputs.',
            'PowerPoint merged-table separators and CircuitikZ wiring are corrected, and batch title generation uses a consistent local-knowledge snapshot.',
            'Updated guides explain actual defaults, output paths and supported developer/Agent entry points. Cancellation retains completed writes and cannot guarantee that provider billing stops.'
        ]
    },
    {
        version: '1.9.7',
        highlights: [
            'Diagram workflows now keep Mermaid quadrant labels free of structural brackets copied from coordinate syntax; family-aware normalization preserves intentional punctuation.',
            'Dense editable lane-grid previews now measure summary/header space and route cross-lane connectors around occupied cells and labels, preventing text/background overlap.',
            'The release adds bilingual real-Vault diagram examples and updates the public docs and GitHub Pages evidence for the repaired preview path.'
        ]
    },
    {
        version: '1.9.6',
        highlights: [
            'Diagram workflows now retain their explicit source/render/export boundaries; settings discovery ranks visible names, descriptions, aliases, and categories, then jumps to a stable setting anchor.',
            'The discovery toolbar preserves its query when collapsed into a floating top-right control, and ★ Favorites opens a dedicated navigable list with Vault persistence and stale-ID cleanup.',
            'Documentation and translation tooling now enforce the 1.9.6 PPI, Mermaid companion, and bounded LM Studio batch contracts.'
        ]
    },
    {
        version: '1.9.5',
        highlights: [
            'Diagram workflows now distinguish source formats, render targets, and export targets; Drawnix previews show the complete board plus every embedded Mermaid visual in source order inside one vertically scrollable surface.',
            'Each Mermaid or Drawnix panel can be exported independently, while multi-panel SVG, PNG, and PDF export asks for a source or custom Vault-relative folder and continues after isolated failures.',
            'SVG and PDF keep the same vector layout and text metrics; the configurable 72-600 PPI setting is used for PNG rasterization and defaults to 300.'
        ]
    },
    {
        version: '1.9.4',
        highlights: [
            'Diagram workflows now distinguish source formats from render and export targets, with first-class CircuitikZ, Draw.io, Drawnix, SVG, PNG, PDF, HTML, and editable artifact paths.',
            'CircuitikZ can use a managed, integrity-checked Tectonic environment while retaining dependency-free previews and explicit native compile diagnostics.',
            'Diagram history is now Vault-persistent and available through an adaptive right drawer with search, filters, pagination, artifact actions, and corrected scrolling; settings add fuzzy search, favorites, and section navigation.'
        ]
    },
    {
        version: '1.9.3',
        highlights: [
            'Slidev export now ships a report-gated HTML/PDF/PNG/PPTX path with the local Slidev fork and full Slidev skill reference set wired into the real export workflow.',
            'PPTX export now uses visible native editable text and native tables instead of transparent selectable overlays, with richer font, paragraph, table-cell, and code-background contracts.',
            'The PPTX writer now enforces background, shape, table, and text layer ordering so code-background rectangles stay below visible text in the exported deck.'
        ]
    },
    {
        version: '1.9.2',
        highlights: [
            'Sidebar footer scrolling and API observability styling are restored, so API activity no longer squeezes the log output area out of view.',
            'Local knowledge inspect now reports bounded query diagnostics, including navigation-note cautions for low-signal basenames such as index-style notes.',
            'Maintainer CLI examples now use the correct vault-relative path contract, and Chapter Split + TOC now ships with dedicated docs and showcase coverage.'
        ]
    },
    {
        version: '1.9.1',
        highlights: [
            'Provider settings now use a clearer core/advanced split, preserving existing advanced overrides while keeping first-run provider setup focused on required fields.',
            'Fetch model list now covers more provider catalog shapes and applies discovered token ceilings to the active provider override lane instead of silently rewriting the global Max tokens value.',
            'When a discovered model does not expose a reliable output-token ceiling, Notemd preserves any existing provider override and falls back only with an explicit manual-review notice.'
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
    {"version":"1.9.11","highlights":["Drawnix 将关联紧密的分支放得更近，减少连接线重叠与交叉，同时保留全部节点和明确关系。跨分支箭头重排后仍有静态坐标限制。","PDF 导出在净化 SVG 后正确处理复杂选择器与继承样式，补全缺失的 viewBox，并将超大页面等比例缩放，保留向量图形。","诊断按标签分组并默认收起。展开后可查看每条消息和建议，严重级别计数始终可见。","插件会话内的日志跨任务阶段和预览重开持续累积。使用“清空日志”重置；重新加载插件不会保留此前日志。"]},
    {"version":"1.9.10","highlights":["导入 SVG 预览移除活动内容与外部资源，保留向量文字和各面板样式；移动端启动不再提前加载桌面依赖。","仅设备 provider 按 Vault 隔离，显式旧版导入保留原列表与已有配置；存储、收藏及剪贴板失败明确报告。","演示 HTML 使用 loopback 服务器并管理共享消费者生命周期；保留请求 PNG 与已验证兼容副本，Drawnix 不设固定关系配额。"]},
    {
        version: '1.9.9',
        highlights: [
            '一次勾选多种图表，每种类型独立选择多种输出格式。取消勾选仍保留该类型的格式偏好；全部取消则自动分析原文。',
            '所选文件自动导出到原笔记所在目录，或直接保存到配置的输出目录。名称包含图表类型，如 `topic_drawnix.pdf`、`topic_flowchart.svg`；重名追加 `-2`、`-3` 等序号，不覆盖已有文件。',
            'Drawnix 保留全部明确的有向关系，不限制总条数或每个节点的关系数。相同关系去重，不同谓词及反向关系分别保留。外侧连线区间重叠时错开轨道，不重叠时复用轨道，标签按实际尺寸分行；画布随关系需要扩展。无标签、泛化或重复层级的连线仍附原因保存在元数据中。PDF 关系方框文字正常显示，也兼容旧 SVG 缓存。跨分支箭头仍为静态关系，在 Drawnix 重排后可能脱离节点。'
        ]
    },
    {
        version: '1.9.8',
        highlights: [
            '取消信号贯穿排队任务、provider 传输与重试；重叠图表保存会保留冲突编辑，并报告恢复产物。',
            '修正 PowerPoint 合并表格分隔线和 CircuitikZ 连线；标题生成批处理使用一致的本地知识快照。',
            '指南已校正实际默认值、输出路径及开发者／Agent 入口。取消会保留已完成写入，且不能保证 provider 停止计费。'
        ]
    },
    {
        version: '1.9.7',
        highlights: [
            '图表工作流现在不会让 Mermaid 象限图标签显示从坐标语法误复制的结构性括号；按 family 规范化，同时保留有意使用的标点。',
            '密集 editable lane-grid 预览现在会测量摘要/标题空间，并让跨 lane 连接线避开已占用单元格和标签，防止文字与背景重叠。',
            '本版本新增双语真实 Vault 图表示例，并同步公开文档与 GitHub Pages 中关于预览修复路径的证据。'
        ]
    },
    {
        version: '1.9.6',
        highlights: [
            '图表工作流现在明确区分源格式、渲染目标与导出目标；设置查找会按可见名称、描述、别名和类别排序，并跳转到带稳定锚点的目标设置。',
            '查找工具栏收起为右上角悬浮控件后仍会保留搜索条件；点击 ★ Favorites 会打开按 Vault 持久化、可导航且能清理失效 ID 的独立收藏设置单。',
            '文档与翻译工具现在统一执行 1.9.6 的 PPI、Mermaid companion 和 LM Studio 有界小批次契约。'
        ]
    },
    {
        version: '1.9.5',
        highlights: [
            '图表工作流现在明确区分源格式、渲染目标与导出目标；Drawnix 预览现在会按源文件顺序显示完整画布及所有嵌入的 Mermaid 图，并放在同一个支持纵向滚动的预览面板中。',
            '每个 Mermaid 或 Drawnix panel 都可以单独导出；多 panel SVG、PNG 与 PDF 导出会要求选择原文件夹或自定义 Vault 相对文件夹，并在单图失败后继续处理。',
            'SVG 与 PDF 保持相同的矢量布局和文字度量；可配置的 72-600 PPI 设置只用于 PNG 栅格化，默认值为 300。'
        ]
    },
    {
        version: '1.9.4',
        highlights: [
            '图表工作流现在明确区分源格式、渲染目标与导出目标，并为 CircuitikZ、Draw.io、Drawnix、SVG、PNG、PDF、HTML 与可编辑产物提供一等路径。',
            'CircuitikZ 现在可使用经过完整性校验的托管 Tectonic 环境，同时保留零依赖预览与明确的原生编译诊断。',
            '图形历史现在按 Vault 持久化，并通过自适应右侧抽屉提供搜索、筛选、分页与产物操作，滚动问题也已修复；设置页新增模糊搜索、收藏与大项导览。'
        ]
    },
    {
        version: '1.9.3',
        highlights: [
            'Slidev 导出现在具备经过报告门禁验证的 HTML/PDF/PNG/PPTX 路径，并在真实导出工作流中接入本地 Slidev fork 与完整 Slidev skill reference 集合。',
            'PPTX 导出现在使用可见的 Office 原生可编辑文字与原生表格，不再依赖透明可选中文字层，并补齐字体、段落、表格单元格与代码背景契约。',
            'PPTX writer 现在强制 background、shape、table、text 的层级顺序，导出 deck 中的代码背景矩形会稳定位于可见文字下方。'
        ]
    },
    {
        version: '1.9.2',
        highlights: [
            'Sidebar 底部滚动区与 API 可观测性样式已恢复，API activity 不会再把 Log output 区域挤出可视范围。',
            '本地知识库 inspect 现在会返回有界 query diagnostics，包括对 `index.*` 这类低信号导航文件名的 caution 提示。',
            '维护者 CLI 示例现已统一为正确的 vault-relative 路径契约，同时“章节拆分 + TOC”也补齐了独立文档与效果展示。'
        ]
    },
    {
        version: '1.9.1',
        highlights: [
            'Provider 设置现已采用更清晰的核心/高级分组：首次配置只暴露必要字段，同时会保留并自动展开已有高级覆盖项。',
            '“获取模型列表”现在覆盖更多 provider catalog 形态，并将发现到的输出 token 上限应用到当前 provider 的 override 通道，而不是静默改写全局“最大Token数”。',
            '当模型发现无法解析可靠输出 token 上限时，Notemd 会保留已有 provider 覆盖值；只有不存在有效覆盖值时才使用 fallback，并明确提示用户人工复核。'
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
    {"version":"1.9.11","highlights":["Drawnix 將關聯密切的分支放得更近，減少連接線重疊與交叉，同時保留所有節點和明確關係。跨分支箭頭重新排列後仍有靜態座標限制。","PDF 匯出在淨化 SVG 後正確處理複雜選取器與繼承樣式，補全缺少的 viewBox，並將超大頁面等比例縮放，保留向量圖形。","診斷依標籤分組並預設收合。展開後可查看每則訊息和建議，嚴重程度計數始終可見。","外掛工作階段內的日誌會跨任務階段與預覽重新開啟持續累積。使用「清空日誌」重設；重新載入外掛不會保留先前日誌。"]},
    {"version":"1.9.10","highlights":["匯入 SVG 預覽移除活動內容與外部資源，保留向量文字和各面板樣式；行動端啟動不再提前載入桌面依賴。","僅裝置 provider 依 Vault 隔離，明確匯入舊版列表並保留原列表與既有設定；儲存、收藏及剪貼簿失敗會顯示錯誤。","簡報 HTML 使用 loopback 伺服器並管理共用使用者生命週期；保留要求的 PNG 與已驗證相容副本，Drawnix 不設固定關係配額。"]},
    {
        version: '1.9.9',
        highlights: [
            '一次勾選多種圖表，每種類型獨立選擇多種輸出格式。取消勾選仍保留該類型的格式偏好；全部取消則自動分析原文。',
            '所選檔案自動匯出至原筆記所在目錄，或直接儲存至設定的輸出目錄。名稱包含圖表類型，例如 `topic_drawnix.pdf`、`topic_flowchart.svg`；重名追加 `-2`、`-3` 等序號，不覆寫現有檔案。',
            'Drawnix 保留全部明確的有向關係，不限制總條數或每個節點的關係數。相同關係去重，不同謂詞及反向關係分別保留。外側連線區間重疊時錯開軌道，不重疊時共用軌道，標籤按實際尺寸分行；畫布依關係需要擴展。無標籤、泛化或重複階層的連線仍附原因保存在中繼資料中。PDF 關係方框文字正常顯示，也相容舊 SVG 快取。跨分支箭頭仍為靜態關係，在 Drawnix 重新排列後可能脫離節點。'
        ]
    },
    {
        version: '1.9.8',
        highlights: [
            '取消訊號涵蓋排隊工作、provider 傳輸與重試；重疊圖表儲存會保留衝突編輯，並回報復原產物。',
            '修正 PowerPoint 合併表格分隔線和 CircuitikZ 連線；標題生成批次作業使用一致的本地知識快照。',
            '指南已校正實際預設值、輸出路徑及開發者／Agent 入口。取消會保留已完成的寫入，且不能保證 provider 停止計費。'
        ]
    },
    {
        version: '1.9.7',
        highlights: [
            '圖表工作流程現在不會讓 Mermaid 象限圖標籤顯示從座標語法誤複製的結構性括號；依 family 進行規範化，同時保留刻意使用的標點。',
            '密集 editable lane-grid 預覽現在會測量摘要/標題空間，並讓跨 lane 連接線避開已佔用的儲存格與標籤，防止文字與背景重疊。',
            '本版本新增雙語真實 Vault 圖表示例，並同步公開文件與 GitHub Pages 中關於預覽修復路徑的證據。'
        ]
    },
    {
        version: '1.9.6',
        highlights: [
            '圖表工作流程現在明確區分來源格式、渲染目標與匯出目標；設定探索會依可見名稱、描述、別名與類別排序，並跳轉到具有穩定錨點的目標設定。',
            '探索工具列收起為右上角浮動控制後仍會保留搜尋條件；點擊 ★ Favorites 會開啟按 Vault 持久化、可導覽且能清理失效 ID 的獨立收藏設定清單。',
            '文件與翻譯工具現在統一執行 1.9.6 的 PPI、Mermaid companion 與 LM Studio 有界小批次契約。'
        ]
    },
    {
        version: '1.9.5',
        highlights: [
            '圖表工作流程現在明確區分來源格式、渲染目標與匯出目標；Drawnix 預覽現在會按來源順序顯示完整畫布及所有嵌入的 Mermaid 圖，並放在同一個支援垂直捲動的預覽面板中。',
            '每個 Mermaid 或 Drawnix panel 都可以單獨匯出；多 panel SVG、PNG 與 PDF 匯出會要求選擇原始檔案夾或自訂 Vault 相對檔案夾，並在單圖失敗後繼續處理。',
            'SVG 與 PDF 保持相同的向量布局和文字度量；可配置的 72-600 PPI 設定只用於 PNG 光柵化，預設值為 300。'
        ]
    },
    {
        version: '1.9.4',
        highlights: [
            '圖表工作流程現在明確區分來源格式、渲染目標與匯出目標，並為 CircuitikZ、Draw.io、Drawnix、SVG、PNG、PDF、HTML 與可編輯產物提供一等路徑。',
            'CircuitikZ 現在可使用經過完整性校驗的託管 Tectonic 環境，同時保留零依賴預覽與明確的原生編譯診斷。',
            '圖形歷史現在按 Vault 持久化，並透過自適應右側抽屜提供搜尋、篩選、分頁與產物操作，捲動問題也已修復；設定頁新增模糊搜尋、收藏與大項導覽。'
        ]
    },
    {
        version: '1.9.3',
        highlights: [
            'Slidev 匯出現在具備經過報告門檻驗證的 HTML/PDF/PNG/PPTX 路徑，並在真實匯出流程中接入本機 Slidev fork 與完整 Slidev skill reference 集合。',
            'PPTX 匯出現在使用可見的 Office 原生可編輯文字與原生表格，不再依賴透明可選中文字層，並補齊字型、段落、表格儲存格與程式碼背景契約。',
            'PPTX writer 現在強制 background、shape、table、text 的層級順序，匯出 deck 中的程式碼背景矩形會穩定位於可見文字下方。'
        ]
    },
    {
        version: '1.9.2',
        highlights: [
            'Sidebar 底部捲動區與 API 可觀測性樣式已恢復，API activity 不會再把 Log output 區域擠出可視範圍。',
            '本地知識庫 inspect 現在會回傳有界 query diagnostics，包括對 `index.*` 這類低訊號導覽檔名的 caution 提示。',
            '維護者 CLI 範例現已統一為正確的 vault-relative 路徑契約，同時「章節拆分 + TOC」也補齊了獨立文件與效果展示。'
        ]
    },
    {
        version: '1.9.1',
        highlights: [
            'Provider 設定現已採用更清晰的核心/進階分組：首次配置只暴露必要欄位，同時會保留並自動展開既有進階覆寫項。',
            '「取得模型列表」現在覆蓋更多 provider catalog 形態，並將發現到的輸出 token 上限套用到目前 provider 的 override 通道，而不是靜默改寫全域「最大Token數」。',
            '當模型發現無法解析可靠輸出 token 上限時，Notemd 會保留既有 provider 覆寫值；只有不存在有效覆寫值時才使用 fallback，並明確提示使用者人工複核。'
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
