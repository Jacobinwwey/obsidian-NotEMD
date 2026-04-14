import * as fs from 'fs';
import * as path from 'path';

describe('translated README english leak audit', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const readmeFiles = fs.readdirSync(repoRoot)
        .filter(file => /^README_.*\.md$/.test(file))
        .map(file => path.join(repoRoot, file));

    const forbiddenEnglishPhrases = [
        '[Language Hub](./docs/i18n/README.md)',
        'Release Workflow (English)',
        'Release Workflow (简体中文)',
        '**Batch Translate**:',
        '**Web Research & Summarization**:',
        '**Content Generation from Title**:',
        '**Summarise as Mermaid diagram**:',
        '**Use Different Providers for Tasks**:',
        '**Select different languages for different tasks**:',
        '**Enable Stable API Calls (Retry Logic)**:',
        '**API Error Debugging Mode**:',
        'AI-Powered Multi-Languages Knowledge Enhancement',
        'generate xx concepts md file',
        '#### Processed File Output',
        '#### Concept Note Output',
        '[Installation](#installation)',
        '[Configuration](#configuration)'
    ];

    const fileSpecificForbiddenEnglishPhraseEntries: Array<[string, string[]]> = [
        ['README_ru.md', [
            '### Multi-Model Configuration',
            '1. **Active Provider**:',
            '2. **Provider Settings**:',
            '3. **Test Connection**:',
            '4. **Manage Provider Configurations**:',
            '5. **Preset Coverage**:',
            '### Языковая архитектура (UI Locale vs Task Output Language)',
            '### Stable API Call Settings',
            '#### Output concept-note',
            '#### Output concept log file',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### One-click Workflow Buttons',
            '#### Duplicate Check Scope',
            '#### Web Research Provider',
            '#### Focused Learning Domain',
            '#### Output обработанных файлов',
            '#### Задача Extract Concepts',
            '### Developer diagnostics и debug log (опционально)',
            '#### Настройки custom prompt',
            '### Быстрые workflow и sidebar'
        ]],
        ['README_nl.md', [
            '#### Concept Log File Output',
            '#### Extract Concepts Task',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### Processing Parameters',
            '#### Content Generation',
            '#### One-click Workflow Buttons',
            '#### Custom Prompt Settings',
            '#### Duplicate Check Scope',
            '#### Web Research Provider',
            '#### Focused Learning Domain',
            '#### Translation',
            '### Quick Workflows en zijbalk',
            '### Developer Diagnostics en debuglogs (optioneel)',
            '#### Aangepaste promptinstellingen',
            '#### Webonderzoeksprovider',
            '### Snelle workflows en zijbalk',
            '### LLM-providerconfiguratie',
            '## Ondersteunde LLM-providers',
            '### LLM-providercalls (configureerbaar)'
        ]],
        ['README_no.md', [
            '### Stable API Call Settings',
            '### LLM Provider Calls (konfigurerbart)',
            '### Web Research Calls (valgfritt)',
            '### Developer Diagnostics & Debug Logs (valgfritt)',
            '#### Oppgaven "Extract Concepts"',
            '#### Tilpassede promptinnstillinger'
        ]],
        ['README_da.md', [
            '### Stable API Call Settings',
            '#### Extract Concepts Task',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### One-click Workflow Buttons',
            '#### Custom Prompt Settings',
            '#### Duplicate Check Scope',
            '#### Web Research Provider',
            '#### Focused Learning Domain',
            '### LLM Provider Calls (konfigurerbare)',
            '### Web Research Calls (valgfrit)',
            '### Developer Diagnostics & Debug Logs (valgfrit)',
            '#### Output for konceptnoter',
            '#### Output for concept log file',
            '#### Indstillinger for brugerdefinerede prompts',
            '### Hurtige workflows og sidepanel',
            '### Udviklerdiagnostik og debug-logs (valgfrit)'
        ]],
        ['README_bn.md', [
            '### LLM provider configuration',
            '### Multi-model configuration',
            '### Stable API call settings',
            '#### Processed file output',
            '#### Concept note output',
            '#### Concept log file output',
            '#### Extract Concepts task',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### Processing parameters',
            '#### One-click workflow button',
            '#### Custom prompt settings',
            '#### Duplicate check scope',
            '#### Web research provider',
            '### Quick workflow',
            '### LLM provider call (কনফিগারযোগ্য)',
            '### Web research call (ঐচ্ছিক)',
            '### Developer diagnostics ও debug logs (ঐচ্ছিক)'
        ]],
        ['README_ms.md', [
            '#### Output File yang Diproses',
            '#### Output Catatan Konsep',
            '#### Output File Log Konsep',
            '### Workflow Cepat & Sidebar'
        ]],
        ['README_sv.md', [
            '### Stable API Call Settings',
            '#### Utdata för concept log file',
            '#### Extract Concepts Task',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### One-click Workflow Buttons',
            '#### Custom Prompt Settings',
            '#### Duplicate Check Scope',
            '#### Web Research Provider',
            '#### Focused Learning Domain',
            '### LLM Provider Calls (konfigurerbara)',
            '### Web Research Calls (valfritt)',
            '### Developer Diagnostics & Debug Logs (valfritt)',
            '#### Anpassade promptinställningar'
        ]],
        ['README_cs.md', [
            '#### Úloha Extract Concepts',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### Tlačítka one-click workflow',
            '#### Web Research Provider',
            '#### Focused Learning Domain',
            '### Quick Workflows a Sidebar',
            '### Web Research volání (volitelné)',
            '### Developer diagnostics a debug logy (volitelné)',
            '#### Výstup concept note',
            '#### Nastavení vlastních promptů'
        ]],
        ['README_hi.md', [
            '### Stable API call settings',
            '#### Processed file output',
            '#### Concept note output',
            '#### Concept log file output',
            '#### Extract Concepts task',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### Processing parameters',
            '#### One-click workflow buttons',
            '#### Custom prompt settings',
            '#### Duplicate check scope',
            '#### Web research provider',
            '### LLM provider calls (कॉन्फ़िगर करने योग्य)',
            '### Web research calls (वैकल्पिक)',
            '### Developer diagnostics और debug logs (वैकल्पिक)'
        ]],
        ['README_vi.md', [
            '### Cài đặt stable API call',
            '#### Tác vụ Extract Concepts',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '### Quick Workflows và Sidebar',
            '### Chẩn đoán dành cho developer và debug log (tùy chọn)',
            '### Mở rộng knowledge graph',
            '#### Đầu ra concept note',
            '#### Nút one-click workflow',
            '#### Cài đặt custom prompt'
        ]],
        ['README_uk.md', [
            '1. **Active Provider**:',
            '2. **Provider Settings**:',
            '3. **Test Connection**:',
            '4. **Manage Provider Configurations**:',
            '5. **Preset Coverage**:',
            '### Мовна архітектура (UI Locale vs Task Output Language)',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '### Quick Workflows і Sidebar',
            '#### Вихід concept note',
            '#### Кнопки one-click workflow',
            '#### Налаштування власних prompt',
            '### Діагностика для розробників і debug-логи (необов\'язково)'
        ]],
        ['README_id.md', [
            '1. **Active Provider**:',
            '2. **Provider Settings**:',
            '3. **Test Connection**:',
            '4. **Manage Provider Configurations**:',
            '5. **Preset Coverage**:',
            '### Arsitektur Bahasa (UI Locale vs Task Output Language)',
            '#### Create minimal concept notes',
            '### Workflow Cepat & Sidebar'
        ]],
        ['README_he.md', [
            '### הגדרות Stable API Call',
            '#### פלט Concept Note',
            '#### משימת Extract Concepts',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '### diagnostics למפתחים ו-debug logs (אופציונלי)',
            '#### הגדרות prompt מותאם'
        ]],
        ['README_el.md', [
            '#### Εργασία Extract Concepts',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '### Διαγνωστικά προγραμματιστών και debug logs (προαιρετικά)',
            '#### Έξοδος concept note',
            '#### Κουμπιά one-click ροών εργασίας',
            '#### Ρυθμίσεις προσαρμοσμένων prompts'
        ]],
        ['README_hu.md', [
            '#### Extract Concepts feladat',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### Egyéni promptbeállítások'
        ]],
        ['README_fi.md', [
            '#### "Extract Concepts" -tehtävä',
            '#### Mukautettujen promptien asetukset',
            '### Kehittäjädiagnostiikka ja debug-lokit (valinnainen)'
        ]],
        ['README_pl.md', [
            '#### Przyciski przepływu pracy One-click',
            '#### Ustawienia niestandardowych promptów',
            '### Szybkie workflow i pasek boczny',
            '### Diagnostyka deweloperska i logi debugowania (opcjonalne)'
        ]],
        ['README_ro.md', [
            '#### Sarcina Extract Concepts',
            '#### Extract Specific Original Text',
            '#### Batch Mermaid Fix',
            '#### Butoane de flux one-click',
            '#### Setări pentru prompturi personalizate',
            '### Fluxuri rapide și sidebar',
            '### Diagnosticare pentru dezvoltatori și loguri de debug (opționale)'
        ]],
        ['README_ja.md', [
            '#### 翻訳 (Translate)',
            '#### コンテンツ生成 (Content Generation)'
        ]],
        ['README_ko.md', [
            '#### 번역 (Translate)',
            '#### 콘텐츠 생성 (Content Generation)'
        ]],
        ['README_th.md', [
            '#### การตั้งค่า prompt แบบกำหนดเอง'
        ]],
        ['README_zh.md', [
            '### LLM 提供商配置 (LLM Provider Configuration)',
            '### 多模型配置 (Multi-Model Configuration)',
            '### 语言架构（UI 语言 vs 任务输出语言）',
            '### 稳定 API 调用设置 (Stable API Call Settings)',
            '#### 处理文件输出 (Processed File Output)',
            '#### 概念笔记输出 (Concept Note Output)',
            '#### 概念日志文件输出 (Concept Log File Output)',
            '#### 处理参数 (Processing Parameters)',
            '#### 翻译（Translate）',
            '#### 内容生成 (Content Generation)',
            '#### 重复检查范围 (Duplicate Check Scope)',
            '#### 网络研究提供商 (Web Research Provider)',
            '#### 专注学习领域 (Focused Learning Domain)',
            '### LLM Provider 调用（可配置）',
            '**活动提供商 (Active Provider)**',
            '提供商设置 (Provider Settings)',
            '**API 密钥 (API Key)**',
            '**基础 URL / 端点 (Base URL / Endpoint)**',
            '**模型 (Model)**',
            '**温度 (Temperature)**',
            '**API 版本 (仅限 Azure) (API Version (Azure Only))**',
            '**测试连接 (Test Connection)**',
            '**管理提供商配置 (Manage Provider Configurations)**',
            '**预设覆盖范围 (Preset Coverage)**',
            '为任务使用不同的提供商 (Use Different Providers for Tasks)',
            '启用稳定 API 调用（重试逻辑）(Enable Stable API Calls (Retry Logic))',
            '**重试间隔 (秒) (Retry Interval (seconds))**',
            '**最大重试次数 (Maximum Retries)**',
            '**API 错误调试模式 (API Error Debugging Mode)**',
            '**开发者模式 (Developer Mode)**',
            '**开发者 Provider 诊断（长请求）(Developer Provider Diagnostic (Long Request))**',
            '**诊断调用方式 (Diagnostic Call Mode)**',
            '**运行诊断 (Run Diagnostic)**',
            '**运行稳定性测试 (Run Stability Test)**',
            '**诊断超时 (Diagnostic Timeout)**',
            '自定义处理文件的保存路径 (Customize Processed File Save Path)',
            '**处理文件文件夹路径 (Processed File Folder Path)**',
            '为“添加链接”使用自定义输出文件名 (Use Custom Output Filename for ‘Add Links’)',
            '自定义后缀/替换字符串 (Custom Suffix/Replacement String)',
            '在添加链接时移除代码围栏 (Remove Code Fences on Add Links)',
            '自定义概念笔记路径 (Customize Concept Note Path)',
            '**概念笔记文件夹路径 (Concept Note Folder Path)**',
            '生成概念日志文件 (Generate Concept Log File)',
            '自定义日志文件保存路径 (Customize Log File Save Path)',
            '**概念日志文件夹路径 (Concept Log Folder Path)**',
            '自定义日志文件名 (Customize Log File Name)',
            '**概念日志文件名 (Concept Log File Name)**',
            '**启用批处理并行化 (Enable Batch Parallelism)**',
            '**批处理并发数 (Batch Concurrency)**',
            '**批处理大小 (Batch Size)**',
            '**批处理间隔延迟 (毫秒) (Delay Between Batches (ms))**',
            '**API 调用间隔 (毫秒) (API Call Interval (ms))**',
            '**分块字数 (Chunk Word Count)**',
            '**启用重复检测 (Enable Duplicate Detection)**',
            '**最大令牌数 (Max Tokens)**',
            '在“从标题生成”中启用研究 (Enable Research in “Generate from Title”)',
            '为“从标题生成”使用自定义输出文件夹 (Use Custom Output Folder for ‘Generate from Title’)',
            '**自定义输出文件夹名称 (Custom Output Folder Name)**',
            '重复检查范围模式 (Duplicate Check Scope Mode)',
            '**包含/排除文件夹 (Include/Exclude Folders)**',
            '**搜索提供商 (Search Provider)**',
            '**Tavily API 密钥 (Tavily API Key)**',
            '**Tavily 最大结果数 (Tavily Max Results)**',
            '**Tavily 搜索深度 (Tavily Search Depth)**',
            '**DuckDuckGo 最大结果数 (DuckDuckGo Max Results)**',
            '**DuckDuckGo 内容获取超时 (DuckDuckGo Content Fetch Timeout)**',
            '**最大研究内容令牌数 (Max Research Content Tokens)**'
        ]],
        ['README_zh_Hant.md', [
            '### LLM 供應商配置 (LLM Provider Configuration)',
            '### 多模型配置 (Multi-Model Configuration)',
            '### 語言架構（UI 語言 vs 任務輸出語言）',
            '### 穩定 API 呼叫設定 (Stable API Call Settings)',
            '#### 處理文件輸出 (Processed File Output)',
            '#### 概念筆記輸出 (Concept Note Output)',
            '#### 概念日誌文件輸出 (Concept Log File Output)',
            '#### 處理參數 (Processing Parameters)',
            '#### 翻譯（Translate）',
            '#### 內容生成 (Content Generation)',
            '#### 重複檢查範圍 (Duplicate Check Scope)',
            '#### 網路研究供應商 (Web Research Provider)',
            '#### 專注學習領域 (Focused Learning Domain)',
            '### LLM Provider 呼叫（可配置）',
            '**活動供應商 (Active Provider)**',
            '供應商設定 (Provider Settings)',
            '**API 金鑰 (API Key)**',
            '**基礎 URL / 端點 (Base URL / Endpoint)**',
            '**模型 (Model)**',
            '**溫度 (Temperature)**',
            '**API 版本 (僅限 Azure) (API Version (Azure Only))**',
            '**測試連線 (Test Connection)**',
            '**管理供應商配置 (Manage Provider Configurations)**',
            '**預設覆蓋範圍 (Preset Coverage)**',
            '為任務使用不同的供應商 (Use Different Providers for Tasks)',
            '啟用穩定 API 呼叫（重試邏輯）(Enable Stable API Calls (Retry Logic))',
            '**重試間隔 (秒) (Retry Interval (seconds))**',
            '**最大重試次數 (Maximum Retries)**',
            '**API 錯誤除錯模式 (API Error Debugging Mode)**',
            '**開發者模式 (Developer Mode)**',
            '**開發者 Provider 診斷（長請求）(Developer Provider Diagnostic (Long Request))**',
            '**診斷呼叫方式 (Diagnostic Call Mode)**',
            '**執行診斷 (Run Diagnostic)**',
            '**執行穩定性測試 (Run Stability Test)**',
            '**診斷逾時 (Diagnostic Timeout)**',
            '自定義處理文件的儲存路徑 (Customize Processed File Save Path)',
            '**處理文件資料夾路徑 (Processed File Folder Path)**',
            '為「添加連結」使用自定義輸出檔名 (Use Custom Output Filename for ‘Add Links’)',
            '自定義字尾/取代字串 (Custom Suffix/Replacement String)',
            '在添加連結時移除程式碼圍欄 (Remove Code Fences on Add Links)',
            '自定義概念筆記路徑 (Customize Concept Note Path)',
            '**概念筆記資料夾路徑 (Concept Note Folder Path)**',
            '生成概念日誌文件 (Generate Concept Log File)',
            '自定義日誌文件儲存路徑 (Customize Log File Save Path)',
            '**概念日誌資料夾路徑 (Concept Log Folder Path)**',
            '自定義日誌檔名 (Customize Log File Name)',
            '**概念日誌檔名 (Concept Log File Name)**',
            '**啟用批次並行化 (Enable Batch Parallelism)**',
            '**批次並發數 (Batch Concurrency)**',
            '**批次大小 (Batch Size)**',
            '**批次間隔延遲 (毫秒) (Delay Between Batches (ms))**',
            '**API 呼叫間隔 (毫秒) (API Call Interval (ms))**',
            '**分塊字數 (Chunk Word Count)**',
            '**啟用重複檢測 (Enable Duplicate Detection)**',
            '**最大權杖數 (Max Tokens)**',
            '在「從標題生成」中啟用研究 (Enable Research in “Generate from Title”)',
            '為「從標題生成」使用自定義輸出資料夾 (Use Custom Output Folder for ‘Generate from Title’)',
            '**自定義輸出資料夾名稱 (Custom Output Folder Name)**',
            '重複檢查範圍模式 (Duplicate Check Scope Mode)',
            '**包含/排除資料夾 (Include/Exclude Folders)**',
            '**搜尋供應商 (Search Provider)**',
            '**Tavily API 金鑰 (Tavily API Key)**',
            '**Tavily 最大結果數 (Tavily Max Results)**',
            '**Tavily 搜尋深度 (Tavily Search Depth)**',
            '**DuckDuckGo 最大結果數 (DuckDuckGo Max Results)**',
            '**DuckDuckGo 內容獲取逾時 (DuckDuckGo Content Fetch Timeout)**',
            '**最大研究內容權杖數 (Max Research Content Tokens)**'
        ]]
    ];

    const duplicatedReadmeNames = fileSpecificForbiddenEnglishPhraseEntries.reduce<Map<string, number>>((counts, [readmeName]) => {
        counts.set(readmeName, (counts.get(readmeName) || 0) + 1);
        return counts;
    }, new Map());

    const duplicateFileSpecificAuditBlocks = Array.from(duplicatedReadmeNames.entries())
        .filter(([, count]) => count > 1)
        .map(([readmeName]) => readmeName);

    const fileSpecificForbiddenEnglishPhrases = Object.fromEntries(fileSpecificForbiddenEnglishPhraseEntries);

    test('does not define duplicate file-specific audit blocks', () => {
        expect(duplicateFileSpecificAuditBlocks).toEqual([]);
    });

    test('does not leave known english UI and workflow phrases in translated README variants', () => {
        for (const readmePath of readmeFiles) {
            const source = fs.readFileSync(readmePath, 'utf8');
            const readmeName = path.basename(readmePath);

            for (const phrase of forbiddenEnglishPhrases) {
                expect(source).not.toContain(phrase);
            }

            for (const phrase of fileSpecificForbiddenEnglishPhrases[readmeName] || []) {
                expect(source).not.toContain(phrase);
            }
        }
    });
});
