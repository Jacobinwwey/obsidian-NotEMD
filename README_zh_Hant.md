![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

# Notemd Obsidian 插件

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

更多語言文件：請查看 [語言中心](./docs/i18n/README_zh.md)

```
=============================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
=============================================
      AI驅動的多語言知識增強工具
=============================================
```

一個建立您自己知識庫的簡單方法！

Notemd 通過與各種大型語言模型 (LLM) 集成來增強您的 Obsidian 工作流程，支援多語言筆記處理，自動為關鍵概念生成維基連結、建立對應的概念筆記、執行網頁搜尋與摘要、翻譯內容、總結為 Mermaid 腦圖等，助力構建強大的知識圖譜。

If you love using Notemd, please consider [⭐ Give a Star on GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) or [☕️ Buy Me a Coffee](https://ko-fi.com/jacobinwwey).

**版本:** 1.8.3

![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/1d97ca0d-2ea6-41a4-accc-be3be9590088" />


## 目錄
- [快速入門](#快速入門)
- [語言支援](#語言支援)
- [功能特性](#功能特性)
- [安裝](#安裝)
- [配置](#配置)
- [使用指南](#使用指南)
- [支援的LLM供應商](#支援的llm供應商)
- [網路使用與數據處理](#網路使用與數據處理)
- [疑難排解](#疑難排解)
- [貢獻](#貢獻)
- [維護者文件](#維護者文件)
- [授權條款](#授權條款)
  
## 快速入門

1.  **安裝與啟用**：從 Obsidian 市場獲取插件。
2.  **設定 LLM**：進入 `設定 -> Notemd`，選擇您的 LLM 供應商（如 OpenAI 或本地供應商如 Ollama），並輸入 API 金鑰/URL。
3.  **開啟側邊欄**：點擊左側工具列中的 Notemd 魔法棒圖示以開啟側邊欄。
4.  **處理筆記**：開啟任意筆記，在側邊欄中點擊 **「處理文件 (添加連結)」**，即可自動為關鍵概念添加 `[[wiki-links]]` 連結。
5.  **執行快捷工作流**：使用預設的 **「One-Click Extract」** 按鈕，可一鍵串聯處理、批量生成與 Mermaid 修復。

完成！探索更多設定以解鎖網頁搜尋、翻譯和內容生成等功能。

## 語言支援

### 語言行為契約

| 關注點 | 控制範圍 | 預設值 | 說明 |
|---|---|---|---|
| `介面語言` | 僅影響插件介面文案（設定、側邊欄、提示、彈窗） | `auto` | 跟隨 Obsidian 語言；當前 UI 語言包為 `en`、`ar`、`de`、`es`、`fa`、`fr`、`id`、`it`、`ja`、`ko`、`nl`、`pl`、`pt`、`pt-BR`、`ru`、`th`、`tr`、`uk`、`vi`、`zh-CN`、`zh-TW`。 |
| `任務輸出語言` | 影響 LLM 任務輸出（連結、摘要、生成、提取、翻譯目標） | `en` | 可使用全局語言，或開啟「按任務設定語言」。 |
| `禁用自動翻譯` | 非翻譯任務保持原文語境 | `false` | 顯式「翻譯」任務仍按目標語言執行。 |
| Locale 回退 | UI 文案缺失時的回退策略 | 當前 locale -> `en` | 避免部分翻譯缺失導致介面異常。 |

- 維護源文件為 English + 簡體中文，已發佈的 README 譯文已在上方頁眉列出。
- 應用內 UI locale 覆蓋目前與程式碼中的顯式語言目錄一致：`en`、`ar`、`de`、`es`、`fa`、`fr`、`id`、`it`、`ja`、`ko`、`nl`、`pl`、`pt`、`pt-BR`、`ru`、`th`、`tr`、`uk`、`vi`、`zh-CN`、`zh-TW`。
- English 回退仍保留為實作層安全網，但已支援 locale 的可見介面已由回歸測試覆蓋，正常使用中不應再靜默回落到英文。
- 更多詳情及貢獻指南請參閱 [語言中心](./docs/i18n/README_zh.md)。

## 功能特性

### AI驅動的文件處理
- **多 LLM 支援**: 連接到各種雲端和本地 LLM 供應商（參見 [支援的LLM供應商](#支援的llm供應商)）。
- **智慧分塊**: 根據字數自動將大型文件分割成易於管理的小塊進行處理。
- **內容保留**: 在添加結構和連結的同時，旨在保持原始内容格式。
- **進度追蹤**: 通過 Notemd 側邊欄或進度模式進行即時更新。
- **可取消操作**: 可以通過側邊欄的專用取消按鈕取消任何處理任務（單個或批量）。命令面板操作使用強制回應視窗，也可以取消。
- **多模型配置**: 為不同任務（添加連結、研究、生成標題）使用不同的 LLM 供應商*和*特定模型，或為所有任務使用單一供應商。
- **穩定的 API 呼叫（重試邏輯）**: 可選擇為失敗的 LLM API 呼叫啟用自動重試，並可配置重試間隔和嘗試次數限制。
- **更穩健的 Provider 連線測試**: 當 Provider 的首次連線測試遇到暫時性斷連時，Notemd 現在會先回退到穩定重試序列再判定失敗，涵蓋 OpenAI-compatible、Anthropic、Google、Azure OpenAI 與 Ollama 五類傳輸鏈路。
- **執行階段環境傳輸回退**: 當長耗時 Provider 請求被 `requestUrl` 以 `ERR_CONNECTION_CLOSED` 等暫時性網路錯誤中斷時，Notemd 現在會先在同一次呼叫內切換到與執行環境相符的回退傳輸：桌面端使用 Node `http/https`，非桌面環境使用瀏覽器 `fetch`；只有在該回退也失敗時，才進入配置好的穩定重試序列，從而降低慢速網關或反向代理下的誤報失敗。
- **OpenAI-compatible 穩定長請求鏈路加固**: 在穩定模式下，OpenAI-compatible 每次呼叫現在會按 `直連串流 -> 直連非串流 -> requestUrl` 的順序依次嘗試（必要時 `requestUrl` 仍可升級為串流解析），再決定是否進入下一次重試。這可降低「Provider 實際已返回非串流結果，但串流鏈路不穩定」導致的誤失敗。
- **全 LLM API 的協定感知串流回退**: 長耗時回退請求現在不再只涵蓋 OpenAI-compatible Provider，而是擴展到所有內建 LLM 路徑。Notemd 現在會在桌面 `http/https` 與非桌面 `fetch` 回退階段，分別處理 OpenAI/Azure 風格 SSE、Anthropic Messages SSE、Google Gemini SSE，以及 Ollama 的 NDJSON 串流輸出，其餘直連的 OpenAI 風格 Provider 入口也會復用同一套共享回退路徑。
- **中國區 Provider 預設增強**: 內建補充了 `Qwen`、`Qwen Code`、`Doubao`、`Moonshot`、`GLM`、`Z AI`、`MiniMax`、`Huawei Cloud MaaS`、`Baidu Qianfan`、`SiliconFlow` 等中國區常用雲端模型服務商預設。
- **可靠的批次處理**: 改進了並發處理邏輯，通過**交錯的 API 呼叫**來防止速率限制錯誤，確保在大型批次處理作業中效能穩定。新的實作確保任務在不同時間間隔啟動，而不是同時啟動。
- **準確的進度報告**: 修復了進度條可能卡住的錯誤，確保使用者介面始終反映操作的真實狀態。
- **健壯的並行批次處理**: 解決了並行批次處理操作過早停止的問題，確保所有文件都能可靠高效地處理。
- **進度條準確性**: 修復了「建立維基連結並生成筆記」命令進度條卡在 95% 的錯誤，確保現在能正確顯示 100% 完成。
- **增強的 API 除錯**: 「API 錯誤除錯模式」現在不僅可以擷取來自 LLM 供應商和搜尋服務（Tavily/DuckDuckGo）的完整回應體，還會記錄按嘗試維度展開的傳輸時間線，包括脫敏後的請求 URL、耗時、回應標頭、部分回應體、已解析的部分串流內容與堆疊資訊，從而更適合定位 OpenAI-compatible、Anthropic、Google、Azure OpenAI、Ollama 等鏈路上的 429/500 錯誤、網關斷連和其他 API 故障。
- **開發者模式面板**: 設定中新增獨立 Developer 診斷面板，預設隱藏，只有開啟「Developer mode」後才顯示。該面板支援選擇診斷呼叫方式，並可按指定方式執行多輪穩定性測試。
- **重構後的側邊欄**: 內建操作按用途分組展示，並提供更清晰的標籤、即時狀態、可取消進度和可複製日誌，顯著減少按鈕堆疊帶來的混亂。即使所有分組都展開，底部的進度與日誌區域也會保持可見，Ready 狀態下的待機進度軌道也更容易辨認。
- **側邊欄互動與可讀性打磨**: 側邊欄按鈕補齊了更清晰的懸停/按下/焦點回饋；`One-Click Extract`、`Batch generate from titles` 等彩色 CTA 按鈕也強化了文字對比度，在不同主題下可讀性更好。
- **單文件 CTA 映射規則**: 彩色 CTA 現在僅用於「單文件處理」動作；批量/資料夾級動作以及包含批量步驟的工作流會使用非 CTA 樣式，降低動作範圍誤判風險。
- **自定義一鍵工作流**: 可將內建側邊欄操作組裝成可複用的自定義按鈕，支援使用者命名與動作編排，預設內建 `One-Click Extract` 工作流。

### 知識圖譜增強
- **自動維基連結**: 根據 LLM 輸出，識別您處理過的筆記中的核心概念並添加 `[[維基連結]]`。
- **概念筆記建立（可選和可定制）**: 在指定的 vault 資料夾中自動為發現的概念建立新筆記。
- **可定制的輸出路徑**: 在您的 vault 中為儲存處理過的文件和新建立的概念筆記配置單獨的相對路徑。
- **可定制的輸出檔名（添加連結）**: 在處理文件以添加連結時，可選擇**覆蓋原始文件**或使用自定義字尾/取代字串，而不是預設的 `_processed.md`。
- **連結完整性維護**: 在 vault 內重新命名或刪除筆記時，基本處理更新連結的功能。
- **純概念提取**: 提取概念並建立對應的概念筆記，而不修改原始文件。這對於從現有文件中填充知識庫而不改變它們是理想的。此功能具有用於建立最簡概念筆記和添加反向連結的可配置選項。

### 翻譯

- **AI 驅動的翻譯**：
    - 使用配置的 LLM 翻譯筆記內容。
    - **大文件支援**：在發送給 LLM 之前，會根據 `分塊字數` 設定將大文件自動拆分為更小的塊。翻譯後的塊隨後會無縫地合併回單個文件中。
    - 支援多種語言之間的翻譯。
    - 可在設定或 UI 中自定義目標語言。
    - 自動在原始文字右側打開翻譯後的文字，便於閱讀。
- **批量翻譯**:
    - 一鍵翻譯所選資料夾中的所有文件。
    - 當「啟用批次並行化」開啟時，支援並行處理。
    - 如果已配置，則使用自定義提示進行翻譯。
	- 在文件瀏覽器的操作功能表中添加「批量翻譯此資料夾」選項。
- **禁用自動翻譯**: 啟用此選項後，非翻譯任務將不再強制輸出為特定語言，從而保留原始語言內容；顯式「翻譯」任務仍將按配置執行翻譯。

### 網路研究與內容生成
- **網頁研究與摘要**:
    - 支援 Tavily（需 API 金鑰）與 DuckDuckGo（實驗性）兩種網路搜尋服務。
    - **改進的搜尋穩定性**: DuckDuckGo 搜尋現在具有增強的解析邏輯（DOMParser 與 Regex 回退），以處理佈局變化並確保結果的可靠性。
    - 自動用 LLM 總結搜尋結果，並附加到當前筆記。
    - 可以在設定中自定義摘要的輸出語言。
    - 可配置用於研究的最大內容長度。
- **根據標題生成內容**:
    - 利用筆記標題通過 LLM 生成內容並取代原有文字。
    - 可選在生成前自動執行網頁研究，豐富生成內容。
- **批量根據標題生成內容**:
    - 一鍵批量處理選定資料夾下所有筆記，自動跳過已處理文件。
    - 可配置「完成」子資料夾名稱，避免重複處理。
- **Mermaid 自動修復耦合**:
    - 當啟用 Mermaid 自動修復後，處理、按標題生成、批量按標題生成、研究與摘要、總結為 Mermaid、翻譯等 Mermaid 相關流程都會在輸出後自動執行修復，減少圖表語法殘留與人工返工。

### 實用功能
- **總結為 Mermaid 圖表**:
    - 此功能允許您將筆記內容總結為 Mermaid 圖表。
    - 可以在設定中自定義 Mermaid 圖表的輸出語言。
    - **Mermaid 輸出資料夾**: 配置生成 Mermaid 圖表文件的儲存資料夾。如果留空，圖表將儲存在與原始筆記相同的資料夾中。
    - **翻譯總結為 Mermaid 輸出**: 可選地將生成的 Mermaid 圖表內容翻譯成配置的目標語言。

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/803d444f-e477-428a-9ce6-4aac8075062a" />


- **簡單公式格式修正**:
    - 快速將單行 `$` 分隔的數學公式轉換為標準的 `$$` 塊。
    - **單文件**: 通過側邊欄按鈕或命令面板處理當前文件。
    - **批量修復**: 通過側邊欄按鈕或命令面板處理所選資料夾中的所有文件。

- **檢查當前文件中的重複項**: 此命令有助於識別活動文件中的潛在重複術語。
- **重複檢測**: 檢查當前處理內容中的重複詞（結果輸出到主控台）。
- **檢查並刪除重複概念筆記**: 綜合檔名（精確/複數/規範化/包含關係）檢測概念筆記資料夾內外潛在重複項，支援自定義檢測範圍，操作前會詳細列出並需手動確認。
- **批量 Mermaid 修復**: 對選定資料夾內所有 Markdown 文件應用 Mermaid 和 LaTeX 語法校正。
    - **可作為工作流步驟**: 除了單獨執行外，也可以作為自定義一鍵工作流中的一步進行組合。
    - **錯誤報告**: 生成 `mermaid_error_{foldername}.md` 報告，列出處理後仍包含潛在 Mermaid 錯誤的文件。
    - **移動錯誤文件**: 可選地將檢測到錯誤的文件移動到指定資料夾以供手動審查。
    - **智慧檢測**: 在嘗試修復之前，使用 `mermaid.parse` 智慧檢查文件是否存在語法錯誤，節省處理時間並避免不必要的編輯。
    - **安全處理**: 確保語法修復僅應用於 Mermaid 程式碼塊，防止意外修改 Markdown 表格或其他內容。包含針對表格語法（例如 `| :--- |`）的穩健保護措施，防止被深度除錯功能誤修。
    - **深度除錯模式**: 如果初始修復後錯誤仍然存在，將觸發高級深度除錯模式。此模式處理複雜的邊緣情況，包括：
        - **註釋整合**: 自動將尾隨註釋（以 `%` 開頭）合併到連接線標籤中（例如，`A -- Label --> B; % Comment` 變為 `A -- "Label(Comment)" --> B;`）。
        - **畸形箭頭**: 修復被引號吸收的箭頭（例如 `A -- "Label -->" B` 修正為 `A -- "Label" --> B`）。
        - **行內子圖**: 將行內子圖標籤轉換為連接線標籤。
        - **反向箭頭修復**: 將非標準的 `X <-- Y` 箭頭修正為 `Y --> X`。
        - **方向關鍵字修復**: 確保子圖內的 `direction` 關鍵字為小寫（例如 `Direction TB` -> `direction TB`）。
        - **註釋轉換**: 將 `//` 註釋轉換為連接線標籤（例如 `A --> B; // 註釋` -> `A -- "註釋" --> B;`）。
        - **重複標籤修復**: 簡化重複的括號標籤（例如 `Node["標籤"]["標籤"]` -> `Node["標籤"]`）。
        - **無效箭頭修復**: 將無效的箭頭語法 `--|>` 轉換為標準的 `-->`。
        - **穩健的標籤與註釋處理**: 改進了對包含特殊字元（如 `/`）的標籤處理，並更好支援自定義註釋語法（`note for ...`），確保徹底清除尾隨括號等殘留物。
        - **高級修復模式**: 包含針對包含空格、特殊字元或巢狀括號的未加引號節點標籤的穩健修復（例如，將 `Node[標籤 [文本]]` 轉換為 `Node["標籤 [文本]"]`）。
        - **註釋轉換**: 自動將 `note right/left of` 以及獨立的 `note :` 註釋轉換為標準的 Mermaid 節點定義和連接（例如，將 `note right of A: text` 轉換為 `NoteA["Note: text"]` 並連接到 `A`），防止語法錯誤並改善佈局。
        - **擴充註釋支援**: 自動將 `note for Node "Content"` 和 `note of Node "Content"` 轉換為標準的連結註釋節點（例如 `NoteNode[" Content"]` 連接到 `Node`），確保與使用者擴充語法的相容性。
        - **增強的註釋修正**: 自動使用順序編號（如 `Note1`, `Note2`）重新命名註釋，以防止存在多個註釋時出現別名問題。
        - **平行四邊形/形狀修復**: 修正畸形的節點形狀定義，如將 `[/["標籤["/]` 轉換為標準的 `["標籤"]`，確保與生成內容的相容性。
        - **標準化管道標籤**: 自動修復和標準化包含管道符號的連接線標籤，確保它們被正確引用（例如，將 `-->|文本|` 轉換為 `-->|"文本"|`）。
        - **錯位管道修復**: 修正出現在箭頭之前的錯位連接線標籤（例如 `>|"標籤"| A --> B` 修正為 `A -->|"標籤"| B`）。
        - **合併雙重標籤**: 檢測並合併單條邊上的複雜雙重標籤（例如，`A -- 標籤1 -- 標籤2 --> B` 或 `A -- 標籤1 -- 標籤2 --- B`），將其轉換為帶有換行的單個清晰標籤（`A -- "標籤1<br>標籤2" --> B`）。
        - **未加引號的標籤修復**: 自動為包含潛在問題字元（如引號、等號、數學運算子）但缺少外引號的節點標籤添加引號（例如，將 `Plot[Plot "A"]` 修正為 `Plot["Plot "A""]`），防止渲染錯誤。
        - **連接標籤修復**: 穩健地修復 ID 與標籤連接的節點定義（例如，`SubdivideSubdivide...` 變為 `Subdivide["Subdivide..."]`），即使在前面有管道標籤或重複不完全的情況下，也能通過驗證已知節點 ID 進行修復。
        -   **提取特定原始文本**:    - 在設定中定義問題列表。
    - 從活動筆記中逐字提取回答這些問題的文本段落。
    - **合併查詢模式**: 可選擇在單個 API 呼叫中處理所有問題以提高效率。
    - **翻譯**: 可選在輸出中包含提取文本的翻譯。
    - **自定義輸出**: 可配置提取文本文件的儲存路徑和檔名字尾。
- **LLM連線測試**: 一鍵檢測所有配置 LLM 服務商的 API 連線狀態。

## 安裝

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### 通過 Obsidian 市場（推薦）
1. 打開 Obsidian **設定** → **社群插件**。
2. 確認「受限模式」已關閉。
3. 點擊「瀏覽」社群插件，搜尋「Notemd」。
4. 點擊「安裝」。
5. 安裝後點擊「啟用」。

### 手動安裝
1. 從 [GitHub發佈頁](https://github.com/Jacobinwwey/obsidian-NotEMD/releases) 下載最新發佈資產。每個 Release 也會附帶 `README.md` 作為隨包文件，但手動安裝實際只需要 `main.js`、`styles.css`、`manifest.json`。
2. 進入 `<您的保險庫>/.obsidian/plugins/` 目錄。
3. 新建 `notemd` 資料夾，將 `main.js`、`styles.css`、`manifest.json` 拷貝至此。
4. 重啟 Obsidian。
5. 在「社群插件」中啟用 Notemd 插件。

## 配置

進入設定：**設定** → **社群插件** → **Notemd**（齒輪圖示）。

### LLM 供應商配置

1. **活動供應商**: 從下拉選單中選擇您想要使用的 LLM 供應商。

2. 供應商設定

   : 配置所選供應商的具體設定：

   - **API 金鑰**: 大多數雲端供應商（例如 OpenAI、Anthropic、DeepSeek、Qwen、Qwen Code、Doubao、Moonshot、GLM、Z AI、MiniMax、Huawei Cloud MaaS、Baidu Qianfan、SiliconFlow、Google、Mistral、Azure OpenAI、OpenRouter、xAI、Groq、Together、Fireworks、Requesty）需要。Ollama 不需要。LMStudio 和通用的 `OpenAI Compatible` 預設在某些允許匿名或佔位金鑰的端點上可留空。
   - **基礎 URL / 端點**: 服務的 API 端點。提供了預設值，但您可能需要為本地模型（LMStudio、Ollama）、網關（OpenRouter、Requesty、OpenAI Compatible）或特定 Azure 佈署修改此項。**Azure OpenAI 必填。**
   - **模型**: 要使用的具體模型名稱/ID（例如 `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`）。請確保該模型在您的端點/供應商處可用。
   - **溫度**: 控制 LLM 輸出的隨機性（0=確定性，1=最大創造力）。較低的值（例如 0.2-0.5）通常更適合結構化任務。
   - **API 版本（僅限 Azure）**: Azure OpenAI 佈署需要（例如 `2024-02-15-preview`）。

3. **測試連線**: 使用活動供應商的「測試連線」按鈕來驗證您的設定。OpenAI-compatible 供應商現在會按 provider 特性自動選擇測試策略：`Qwen`、`Qwen Code`、`Doubao`、`Moonshot`、`GLM`、`Z AI`、`MiniMax`、`Huawei Cloud MaaS`、`Baidu Qianfan`、`SiliconFlow`、`Groq`、`Together`、`Fireworks`、`LMStudio` 與 `OpenAI Compatible` 會直接探測 `chat/completions`，而具備穩定 `/models` 端點的服務仍會優先走模型列表探測。如果首次探測遇到 `ERR_CONNECTION_CLOSED` 這類暫時性網路斷連，Notemd 會自動切入穩定重試序列，而不是立刻報錯。

4. **管理供應商配置**: 使用「匯出供應商」和「匯入供應商」按鈕將您的 LLM 供應商設定儲存到插件配置目錄中的 `notemd-providers.json` 文件或從中載入。這便於備份和共享。

5. **預設覆蓋範圍**: 除了原有供應商外，Notemd 現在還內建了 `Qwen`、`Qwen Code`、`Doubao`、`Moonshot`、`GLM`、`Z AI`、`MiniMax`、`Huawei Cloud MaaS`、`Baidu Qianfan`、`SiliconFlow`、`xAI`、`Groq`、`Together`、`Fireworks`、`Requesty` 以及通用的 `OpenAI Compatible` 預設，可用於 LiteLLM、vLLM、Perplexity、Vercel AI Gateway 或自定義代理。

<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### 多模型配置

- 為任務使用不同的供應商

  :

  - **禁用 (預設)**: 對所有任務使用上面選擇的單個「活動供應商」。
  - **啟用**: 允許您為每個任務（「添加連結」、「研究與摘要」、「從標題生成」、「提取概念」）選擇特定的供應商*和*可選地覆蓋模型名稱。如果任務的模型覆蓋欄位留空，則將使用為該任務選定供應商配置的預設模型。
- **為不同任務選擇不同語言**:
    *   **禁用 (預設)**: 所有任務都使用單一的「輸出語言」。
    *   **啟用**: 允許您為每個任務（「添加連結」、「研究與摘要」、「從標題生成」、「總結為 Mermaid 圖表」、「提取概念」）選擇特定的語言。

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### 語言架構（介面語言與任務輸出語言）

- **介面語言**只控制插件介面文案（設定項、側邊欄按鈕、提示、彈窗）。預設 `auto` 會跟隨 Obsidian 當前介面語言。
- 區域／書寫系統變體現在會優先映射到最接近的已發布語言目錄，而不是直接回退到英文。例如，`fr-CA` 使用法語，`es-419` 使用西班牙語，`pt-PT` 使用葡萄牙語，`zh-Hans` 使用簡體中文，`zh-Hant-HK` 使用繁體中文。
- **任務輸出語言**控制模型生成內容的語言（添加連結、研究摘要、按標題生成、Mermaid 總結、概念提取、翻譯目標）。
- **按任務語言模式**通過統一策略層解析每個任務的輸出語言，避免分散在各模組中的語言分支造成行為漂移。
- **禁用自動翻譯**後，非翻譯任務會保留原文語言內容；顯式「翻譯」任務仍按目標語言執行。
- Mermaid 相關生成鏈路與上述統一語言策略保持一致，並在開啟時繼續支援自動 Mermaid 修復。

### 穩定 API 呼叫設定

- 啟用穩定 API 呼叫（重試邏輯）

  :

  - **禁用 (預設)**: 單個 API 呼叫失敗將停止當前任務。
  - **啟用**: 自動重試失敗的 LLM API 呼叫（對於間歇性網路問題或速率限制很有用）。
  - **連線測試回退**: 即使普通呼叫當前沒有預先開啟穩定模式，Provider 的連線測試在首次遇到暫時性網路錯誤後也會切換到同一套重試序列。
  - **執行階段傳輸回退（環境感知）**: 如果長耗時任務請求被 `requestUrl` 暫時性中斷，Notemd 會先使用與當前環境相符的回退傳輸重試同一次呼叫：桌面端走 Node `http/https`，非桌面環境走瀏覽器 `fetch`。該回退階段現在會按協定解析各類串流輸出，涵蓋 OpenAI-compatible / Azure OpenAI 的 SSE、Anthropic Messages SSE、Google Gemini SSE，以及 Ollama 的 NDJSON，讓慢速網關儘早返回 body 分片；其餘直連的 OpenAI 風格 Provider 入口也會複用這條共享回退鏈路。
  - **OpenAI-compatible 穩定模式順序**: 在穩定模式下，OpenAI-compatible 的單次呼叫會優先走 `直連串流`，失敗後立即嘗試 `直連非串流`，最後才走 `requestUrl`（必要時附帶串流回退解析）。三段都失敗後，才計入下一次穩定重試，避免某一種傳輸鏈路抖動時過早報錯。

- **重試間隔（秒）**: (僅在啟用時可見) 重試嘗試之間等待的時間（1-300 秒）。預設值：5。

- **最大重試次數**: (僅在啟用時可見) 最大重試嘗試次數（0-10）。預設值：3。
- **API 錯誤除錯模式**:
    *   **禁用 (預設)**: 使用標準的簡潔錯誤報告。
    *   **啟用**: 為所有 Provider 和任務（包括翻譯、搜尋和連線測試）啟動詳細的錯誤日誌記錄（類似 DeepSeek 的詳細輸出）。日誌現在會包含 HTTP 狀態碼、原始回應文本、請求傳輸時間線、脫敏後的請求 URL/請求標頭、單次嘗試耗時、回應標頭、部分回應體、已解析的部分串流輸出與堆疊資訊，對於排查 API 連線問題和上游網關重置尤其關鍵。
- **開發者模式**:
    *   **禁用 (預設)**: 隱藏開發者專用診斷控制項，避免一般使用者誤操作。
    *   **啟用**: 在設定頁顯示獨立 Developer 診斷面板。
- **開發者供應商診斷（長請求）**:
    *   **診斷呼叫方式**: 可選擇呼叫路徑進行診斷。OpenAI-compatible Provider 額外支援強制 `直連串流`、`直連非串流`、`requestUrl-only`。
    *   **執行診斷**: 以當前呼叫方式執行一次長請求探針，並將完整報告 `Notemd_Provider_Diagnostic_*.txt` 寫入倉庫根目錄。
    *   **執行穩定性測試**: 以當前呼叫方式執行可配置輪次（1-10）的重複呼叫，輸出聚合穩定性報告。
    *   **診斷逾時**: 可配置單次診斷逾時（15-3600 秒）。
    *   **適用場景**: 當「測試連線」成功但真實長任務（例如慢網關下翻譯）仍快速失敗時，可快速定位鏈路問題。

<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### 常規設定

#### 處理文件輸出

- 自定義處理文件的儲存路徑

  :

  - **禁用 (預設)**: 處理過的文件（例如 `YourNote_processed.md`）儲存在與原始筆記*相同的資料夾*中。
  - **啟用**: 允許您指定自定義儲存位置。

- **處理文件資料夾路徑**: (僅在啟用上述選項時可見) 輸入 vault 內的*相對路徑*（例如 `Processed Notes` 或 `Output/LLM`），處理過的文件應儲存在此路徑。如果資料夾不存在，將自動建立。**請勿使用絕對路徑（如 C:...）或無效字元。**

- 為「添加連結」使用自定義輸出檔名

  :

  - **禁用 (預設)**: 由「添加連結」命令建立的處理文件使用預設的 `_processed.md` 字尾（例如 `YourNote_processed.md`）。
  - **啟用**: 允許您使用下面的設定自定義輸出檔名。

- 自定義字尾/取代字串

  : (僅在啟用上述選項時可見) 輸入用於輸出檔名的字串。

  - 如果留**空**，原始文件將被處理後的內容**覆蓋**。
  - 如果您輸入一個字串（例如 `_linked`），它將被附加到原始基本名稱後（例如 `YourNote_linked.md`）。確保字尾不包含無效的檔名字元。

- 在添加連結時移除程式碼圍欄

  :

  - **禁用 (預設)**: 添加連結時，程式碼圍欄 **(`)\** 會保留在內容中，而 \**(`markdown)** 會被自動刪除。
  - **啟用**: 在添加連結之前從內容中移除程式碼圍欄。

<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### 概念筆記輸出

- 自定義概念筆記路徑

  :

  - **禁用 (預設)**: 禁用為 `[[連結的概念]]` 自動建立筆記。
  - **啟用**: 允許您指定建立新概念筆記的資料夾。

- **概念筆記資料夾路徑**: (僅在啟用上述選項時可見) 輸入 vault 內的*相對路徑*（例如 `Concepts` 或 `Generated/Topics`），新概念筆記應儲存在此路徑。如果資料夾不存在，將自動建立。**如果啟用了自定義，則必須填寫。** **請勿使用絕對路徑或無效字元。**

<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### 概念日誌文件輸出

- 生成概念日誌文件

  :

  - **禁用 (預設)**: 不生成日誌文件。
  - **啟用**: 處理後建立一個日誌文件，列出新建立的概念筆記。格式如下： `生成 xx 個概念 md 文件 1. 概念1 2. 概念2 ... n. 概念n`

- 自定義日誌文件儲存路徑

  : (僅在啟用「生成概念日誌文件」時可見)

  - **禁用 (預設)**: 日誌文件儲存在**概念筆記資料夾路徑**（如果已指定）中，否則儲存在 vault 根目錄。
  - **啟用**: 允許您為日誌文件指定自定義資料夾。

- **概念日誌資料夾路徑**: (僅在啟用「自定義日誌文件儲存路徑」時可見) 輸入 vault 內的*相對路徑*（例如 `Logs/Notemd`），日誌文件應儲存在此路徑。**如果啟用了自定義，則必須填寫。**

- 自定義日誌檔名

  : (僅在啟用「生成概念日誌文件」時可見)

  - **禁用 (預設)**: 日誌檔名為 `Generate.log`。
  - **啟用**: 允許您為日誌文件指定自定義名稱。

- **概念日誌檔名**: (僅在啟用「自定義日誌檔名」時可見) 輸入所需的檔名（例如 `ConceptCreation.log`）。**如果啟用了自定義，則必須填寫。**

<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### 提取概念任務
- **建立最簡概念筆記**:
    - **開啟（預設）**：新建立的概念筆記將只包含標題（例如 `# 概念`）。
    - **關閉**：概念筆記可能包含其他內容，例如「連結來源」反向連結（如果下面的設定未禁用）。
- **添加「連結來源」反向連結**:
    - **關閉（預設）**：在提取過程中，不會在概念筆記中添加指向源文件的反向連結。
    - **開啟**：添加一個帶有指向源文件反向連結的「連結來源」部分。

#### 提取特定原始文本
-   **提取問題**: 輸入您希望 AI 從筆記中逐字提取答案的問題列表（每行一個）。
-   **將輸出翻譯為對應語言**:
    *   **關閉 (預設)**: 僅以原始語言輸出提取的文本。
    *   **開啟**: 以由此任務選擇的語言附加提取文本的翻譯。
-   **合併查詢模式**:
    *   **關閉**: 單獨處理每個問題（精度更高但 API 呼叫更多）。
    *   **開啟**: 在單個提示中發送所有問題（更快且 API 呼叫更少）。
-   **自定義提取文本儲存路徑和檔名**:
    *   **關閉**: 儲存到與原始文件相同的資料夾，字尾為 `_Extracted`。
    *   **開啟**: 允許您指定自定義輸出資料夾和檔名字尾。

#### 批量 Mermaid 修復
-   **啟用 Mermaid 錯誤檢測**:
    *   **關閉 (預設)**: 處理後跳過錯誤檢測。
    *   **開啟**: 掃描處理後的文件以查找剩餘的 Mermaid 語法錯誤，並生成 `mermaid_error_{foldername}.md` 報告。
-   **將存在 Mermaid 錯誤的文件移動到指定資料夾**:
    *   **關閉**: 有錯誤的文件保留在原位。
    *   **開啟**: 將修復嘗試後仍包含 Mermaid 語法錯誤的文件移動到專用資料夾以供手動審查。
-   **Mermaid 錯誤資料夾路徑**: (僅在啟用上述選項時可見) 移動錯誤文件的資料夾。

#### 處理參數

- **啟用批次並行化**:
    - **禁用 (預設)**: 批次處理任務（如「處理資料夾」或「從標題批量生成」）將逐個（序列）處理文件。
    - **啟用**: 允許插件同時處理多個文件，這可以顯著加快大型批次處理作業的速度。
- **批次並發數**: (僅在啟用並行化時可見) 設定並行處理的最大文件數。較高的數字可以更快，但會消耗更多資源，並可能達到 API 速率限制。（預設值：1，範圍：1-20）
- **批次大小**: (僅在啟用並行化時可見) 分組到單個批次中的文件數。（預設值：50，範圍：10-200）
- **批次間隔延遲（毫秒）**: (僅在啟用並行化時可見) 處理每個批次之間的可選延遲（以毫秒為單位），這有助於管理 API 速率限制。（預設值：1000 毫秒）
- **API 呼叫間隔（毫秒）**: 每個單獨的 LLM API 呼叫之前和之後的最小延遲（以毫秒為單位）。對於低速率 API 或防止 429 錯誤至關重要。設定為 0 表示沒人為延遲。（預設值：500 毫秒）
- **分塊字數**: 發送給 LLM 的每個塊的最大字數。影響大型文件的 API 呼叫次數。（預設值：3000）
- **啟用重複檢測**: 切換對處理內容中重複單詞的基本檢查（結果在主控台中）。（預設值：啟用）
- **最大權杖數**: LLM 每個回應塊應生成的最大權杖數。影響成本和細節。（預設值：4096）

<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### 翻譯
- **目標語言**：可選預設目標語言，命令時可覆蓋。
- **翻譯文件儲存路徑/字尾**：自定義翻譯結果的儲存路徑和檔名字尾（Notemd: Translate Note/Selection）。
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Mermaid 設定
- **Mermaid 輸出資料夾**: 配置生成 Mermaid 圖表文件的儲存資料夾。如果留空，圖表將儲存在與原始筆記相同的資料夾中。
- **翻譯總結為 Mermaid 輸出**: 可選地將生成的 Mermaid 圖表內容翻譯成配置的目標語言。


#### 內容生成

- 在「從標題生成」中啟用研究

  :

  - **禁用 (預設)**: 「從標題生成」僅使用標題作為輸入。
  - **啟用**: 使用配置的**網路研究供應商**執行網路研究，並將研究結果作為上下文包含在基於標題生成的 LLM 提示中。

- **生成後自動修復 Mermaid 語法**:
    - **啟用 (預設)**: 在處理、從標題生成、批量從標題生成、研究與摘要、總結為 Mermaid 圖表、翻譯等 Mermaid 相關流程結束後，自動執行 Mermaid 語法修復。
    - **禁用**: 不自動處理 Mermaid 輸出，需要手動執行「批量 Mermaid 修復」或將其加入自定義工作流。

- 輸出語言

  : (新增) 為「從標題生成」和「從標題批量生成」任務選擇所需的輸出語言。

  - **英語 (預設)**: 提示以英語處理和輸出。
  - **其他語言**: 指示 LLM 以英語進行推理，但以您選擇的語言 (例如 西班牙語、法語、簡體中文、繁體中文、阿拉伯語、印地語等) 提供最終文件。

- 更改提示詞

  : (新增)

  - **更改提示詞**: 允許您更改特定任務的提示詞。
  - **自定義提示詞**: 輸入您任務的自定義提示詞。

- 為「從標題生成」使用自定義輸出資料夾

  :

  - **禁用 (預設)**: 成功生成的文件將移動到相對於原始資料夾父目錄的名為 `[原始資料夾名稱]_complete` 的子資料夾中（如果原始資料夾是根目錄，則為 `Vault_complete`）。
  - **啟用**: 允許您為移動已完成文件的子資料夾指定自定義名稱。

- **自定義輸出資料夾名稱**: (僅在啟用上述選項時可見) 輸入子資料夾所需的名稱（例如 `Generated Content`, `_complete`）。不允許使用無效字元。如果留空，則預設為 `_complete`。此資料夾建立在原始資料夾的父目錄內。

#### 一鍵工作流按鈕

- **視覺化工作流構建器**：無需手寫 DSL，即可從內建動作建立、編輯和排序自定義工作流按鈕。
- **自定義工作流 DSL**：進階使用者仍可直接編輯文本定義。若 DSL 配置存在問題，插件會安全回退到預設工作流，並在設定/側邊欄中提示警告。
- **工作流錯誤策略**：
    - **遇錯停止（預設）**：任一步驟失敗後立即中止整個工作流。
    - **遇錯繼續**：繼續執行後續步驟，並在結束時匯總失敗次數。
- **內建預設工作流**：`One-Click Extract` 預設串聯 `處理文件（添加連結）` -> `批量從標題生成內容` -> `批量 Mermaid 修復`。

#### 自定義提示詞設定
此功能允許您覆蓋發送給 LLM 的特定任務的預設指令（提示詞），從而對輸出進行精細控制。

-   **為特定任務啟用自定義提示詞**：
    *   **禁用（預設）**：插件對所有操作使用其內建的預設提示詞。
    *   **啟用**：啟動為下面列出的任務設定自定義提示詞的功能。這是此功能的主開關。

-   **為[任務名稱]使用自定義提示詞**：（僅在啟用上述功能時可見）
    *   對於每個支援的任務（「添加連結」、「從標題生成」、「研究與摘要」、「提取概念」），您可以單獨啟用或禁用您的自定義提示詞。
    *   **禁用**：此特定任務將使用預設提示詞。
    *   **啟用**：此任務將使用您在下方相應「自定義提示詞」文字區域中提供的文本。

-   **自定義提示詞文字區域**：（僅在啟用任務的自定義提示詞時可見）
    *   **預設提示詞顯示**：為方便您參考，插件會顯示該任務通常使用的預設提示詞。您可以使用**「複製預設提示詞」**按鈕複製此文本，作為您自己自定義提示詞的起點。
    *   **自定義提示詞輸入**：您可以在此處編寫自己的 LLM 指令。
    *   **佔位符**：您可以在提示詞中使用特殊的佔位符，插件在將請求發送給 LLM 之前會將其替換為實際內容。請參考預設提示詞以查看每個任務可用的佔位符。常用佔位符包括：
        *   `{TITLE}`：當前筆記的標題。
        *   `{RESEARCH_CONTEXT_SECTION}`：從網路研究中收集的內容。
        *   `{USER_PROMPT}`：正在處理的筆記內容。

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### 重複檢查範圍

- 重複檢查範圍模式

  : 控制將概念筆記資料夾中的筆記與哪些文件進行比較以查找潛在重複項。

  - **整個 Vault (預設)**: 將概念筆記與 vault 中的所有其他筆記（不包括概念筆記資料夾本身）進行比較。
  - **僅包含特定資料夾**: 僅將概念筆記與下面列出的資料夾中的筆記進行比較。
  - **排除特定資料夾**: 將概念筆記與*除*下面列出的資料夾中的筆記（以及概念筆記資料夾）之外的所有筆記進行比較。
  - **僅概念資料夾**: 僅將概念筆記與*概念筆記資料夾內的其他筆記*進行比較。這有助於查找純粹在您生成的概念內部的重複項。

- **包含/排除資料夾**: (僅在模式為「包含」或「排除」時可見) 輸入您要包含或排除的資料夾的*相對路徑*，**每行一個路徑**。路徑區分大小寫，並使用 `/` 作為分隔符號（例如 `Reference Material/Papers` 或 `Daily Notes`）。這些資料夾不能與概念筆記資料夾相同或位於其內部。

#### 網路研究供應商

- **搜尋供應商**: 在 `Tavily`（需要 API 金鑰，推薦）和 `DuckDuckGo`（實驗性，經常被搜尋引擎阻止自動化請求）之間選擇。用於「研究與摘要主題」和可選的「從標題生成」。
- **Tavily API 金鑰**: (僅在選擇 Tavily 時可見) 輸入您從 [tavily.com](https://tavily.com/) 獲取的 API 金鑰。
- **Tavily 最大結果數**: (僅在選擇 Tavily 時可見) Tavily 應返回的最大搜尋結果數（1-20）。預設值：5。
- **Tavily 搜尋深度**: (僅在選擇 Tavily 時可見) 選擇 `basic`（預設）或 `advanced`。注意：`advanced` 提供更好結果，但每次搜尋消耗 2 個 API 點數，而不是 1 個。
- **DuckDuckGo 最大結果數**: (僅在選擇 DuckDuckGo 時可見) 要解析的最大搜尋結果數（1-10）。預設值：5。
- **DuckDuckGo 內容獲取逾時**: (僅在選擇 DuckDuckGo 時可見) 嘗試從每個 DuckDuckGo 結果 URL 獲取內容時等待的最大秒數。預設值：15。
- **最大研究內容權杖數**: 要包含在摘要提示中的組合網路研究結果（片段/獲取的內容）的大致最大權杖數。有助於管理上下文視窗大小和成本。（預設值：3000）
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### 專注學習領域
-   **啟用專注學習領域**:
    *   **禁用 (預設)**: 發送給 LLM 的提示詞使用標準的通用指令。
    *   **啟用**: 允許您指定一個或多個研究領域，以提高 LLM 的上下文理解能力。
-   **學習領域**: (僅在啟用上述選項時可見) 輸入您的特定領域，例如「材料科學」、「高分子物理」、「機器學習」。這將在提示詞的開頭添加一行「相關領域: [...]」，幫助 LLM 為您的特定研究領域生成更準確、更相關的連結和內容。
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/e8d5e407-d39d-4a21-a18f-446ca660276f" />

## 使用指南

### 快捷工作流與新版側邊欄

-   打開 Notemd 側邊欄後，可按核心處理、生成、翻譯、知識整理、實用工具等分組查看內建動作。
-   側邊欄頂部的 **快捷工作流** 區域用於執行自定義多步驟按鈕。
-   預設 **One-Click Extract** 會執行 `處理文件（添加連結）` -> `批量從標題生成內容` -> `批量 Mermaid 修復`。
-   每一步的狀態、日誌和失敗資訊都會顯示在側邊欄中，底部固定區域會保護進度條與日誌視窗不被展開的分組擠壓。
-   進度卡片將狀態文本、獨立百分比標籤與剩餘時間分開展示，更便於快速判斷當前執行情況；自定義工作流也可以在設定頁中重新配置。

### 原始處理（添加維基連結）

**注意：** 僅支援 `.md` 或 `.txt` 文件。PDF 可用 [Mineru](https://github.com/opendatalab/MinerU) 轉換為 MD 後再處理。

1.  **側邊欄操作**：
    *   打開 Notemd 側邊欄（魔杖圖示/命令面板）。
    *   打開目標 `.md` 或 `.txt` 文件。
    *   點擊「處理文件（添加連結）」(Notemd: Process Current File)。
    *   資料夾處理：點擊「處理資料夾（添加連結）」(Notemd: Process Folder)，選擇資料夾並點擊「處理」。
    *   進度即時顯示，可隨時取消任務（側邊欄按鈕）。
    *   *批量處理文件在背景執行，不會打開編輯器。*

2.  **命令面板操作**（`Ctrl+P` 或 `Cmd+P`）：
    *   單文件：打開後執行 `Notemd: 處理當前文件 (Notemd: Process Current File)`。
    *   資料夾：執行 `Notemd: 處理資料夾 (Notemd: Process Folder)`，選擇目標資料夾。批量處理不打開編輯器。
    *   進度彈窗可隨時取消。
    *   *插件自動移除內容開頭 `\boxed{` 和結尾 `}（如有）再儲存。*

### 新功能（翻譯、網路研究與內容生成）

1.  **總結為 Mermaid 圖表**：
    *   打開要總結的筆記。
    *   執行命令 `Notemd: 總結為 Mermaid 圖表` (通過命令面板或側邊欄按鈕)。
    *   插件將生成一個帶有 Mermaid 圖表的新筆記。

2.  **翻譯筆記/選區**：
    *   選取文字可僅翻譯選區，無選區則翻譯全文。
    *   執行 `Notemd: 翻譯筆記/選區 (Notemd: Translate Note/Selection)`。
    *   彈窗可確認/修改目標語言（預設使用設定）。
    *   翻譯內容儲存到指定路徑並在原文右側新窗格打開。
    *   任務可隨時取消。

3.  **批量翻譯**:
    *   從命令面板執行 `Notemd: 批量翻譯資料夾` 並選擇一個資料夾，或在文件瀏覽器中右鍵點擊一個資料夾並選擇「批量翻譯此資料夾」。
    *   插件將翻譯所選資料夾中的所有 Markdown 文件。
    *   翻譯後的文件將儲存到配置的翻譯路徑中，但不會自動打開。
    *   此過程可以通過進度模式取消。

3.  **研究與摘要主題**：
    *   選取文字或用筆記標題作為搜尋主題。
    *   執行 `Notemd: 研究和摘要主題 (Notemd: Research and Summarize Topic)`。
    *   配置的搜尋服務與 LLM 自動協作，結果附加到當前筆記。
    *   任務可隨時取消。
    *   *DuckDuckGo 可能因反爬機制失敗，推薦 Tavily。*

4.  **從標題生成內容**：
    *   打開任意筆記（可為空）。
    *   執行命令 `Notemd: 從標題生成內容 (Notemd: Generate Content from Title)`。
    *   LLM 根據標題生成內容並取代原文。
    *   可選先自動研究，豐富上下文。
    *   任務可隨時取消。

5.  **批量從標題生成內容**：
    *   執行 `Notemd: 從標題批量生成內容 (Notemd: Batch Generate Content from Titles)`。
    *   選擇要處理的資料夾，自動跳過已處理文件。
    *   成功處理的文件自動移動到指定「完成」子資料夾。
    *   任務可隨時取消。

6.  **提取概念（純模式）**:
    *   此功能允許您從文件中提取概念並建立對應的概念筆記，而*不*更改原始文件。它非常適合從一組文件中快速填充您的知識庫。
    *   **單個文件**：打開一個文件，從命令面板執行 `Notemd: 提取概念（僅建立概念筆記）` 命令，或點擊側邊欄中的 **「提取概念（當前文件）」** 按鈕。
    *   **資料夾**：從命令面板執行 `Notemd: 批量提取概念` 命令，或點擊側邊欄中的 **「提取概念（資料夾）」** 按鈕，然後選擇一個資料夾來處理其中的所有筆記。
    *   插件將讀取文件，識別概念，並在您指定的 **概念筆記資料夾** 中為它們建立新筆記，而原始文件保持不變。

7.  **建立維基連結並從選區生成筆記**：
    *   這個強大的命令簡化了建立和填充新概念筆記的過程。
    *   在編輯器中選擇一個詞或片語。
    *   執行命令 `Notemd: 建立維基連結並從選區生成筆記` (建議為此分配一個快捷鍵，如 `Cmd+Shift+W`)。
    *   插件將會：
        1.  將您選擇的文字替換為 `[[維基連結]]`。
        2.  檢查您的 **概念筆記資料夾** 中是否已存在該標題的筆記。
        3.  如果存在，它會向當前筆記添加一個反向連結。
        4.  如果不存在，它會建立一個新的空筆記。
        5.  然後，它會自動對新的或現有的筆記執行 **「從標題生成內容」** 命令，用 AI 生成的內容填充它。

8.  **提取概念並生成標題**：
    *   該命令將兩個強大的功能連結在一起，以實現簡化的工作流程。
    *   從命令面板執行命令 `Notemd: 提取概念並生成標題` (建議為此分配一個快捷鍵)。
    *   插件將會：
        1.  首先，對當前活動文件執行 **「提取概念（當前文件）」** 任務。
        2.  然後，它將自動在您設定為 **概念筆記資料夾路徑** 的資料夾上執行 **「批量從標題生成」** 任務。
    *   這使您可以首先從源文件中提取新概念來填充您的知識庫，然後立即在一個步驟中用 AI 生成的內容來充實這些新的概念筆記。

### 實用工具

1.  **檢查重複項**：
    *   打開目標 `.md` 或 `.txt` 文件。
    *   執行 `Notemd: 檢查當前文件中的重複項 (Notemd: Check for Duplicates in Current File)`。
    *   結果輸出到開發者主控台和通知列/側邊欄。

2.  **測試 LLM 連線**：
    *   執行 `Notemd: 測試 LLM 連線 (Notemd: Test LLM Connection)`。
    *   驗證當前啟動服務商的 API 設定，結果顯示在通知列和側邊欄。

3.  **批量 Mermaid 修復**：
    *   執行 `Notemd: 批量修復 Mermaid 語法 (Notemd: Batch Fix Mermaid Syntax)`。
    *   對使用者選擇的資料夾內的所有 Markdown 文件應用 Mermaid 和 LaTeX 語法校正。
    *   **錯誤報告**: 生成 `mermaid_error_{foldername}.md` 報告，列出處理後仍包含潛在 Mermaid 錯誤的文件。
    *   **移動錯誤文件**: 可選地將檢測到錯誤的文件移動到指定資料夾以供手動審查。
    *   **高級修復模式**: 包含針對包含空格、特殊字元或巢狀括號的未加引號節點標籤的穩健修復（例如，將 `Node[標籤 [文本]]` 轉換為 `Node["標籤 [文本]"]`）。

4.  **檢查並刪除重複概念筆記**：
    *   配置好概念筆記資料夾後執行該命令。
    *   執行 `Notemd: 檢查並刪除重複概念筆記 (Notemd: Check and Remove Duplicate Concept Notes)`。
    *   自動檢測並提示所有潛在重複項，需手動確認刪除。
    *   進度與結果顯示在側邊欄/通知列。

5.  **提取特定原始文本**:
    *   在「提取特定原始文本」下的設定中配置您的問題。
    *   使用側邊欄中的「提取特定原始文本」按鈕來處理當前活動文件。
    *   **合併模式**: 通過在一個提示中發送所有問題來加快處理速度。
    *   **翻譯**: 可選地將提取的文字翻譯為您配置的語言。
    *   **自定義輸出**: 配置提取文件的儲存位置和方式。

## 支援的LLM供應商

| 供應商             | 類型   | 需要 API 金鑰        | 說明                                                              |
|--------------------|--------|----------------------|-------------------------------------------------------------------|
| DeepSeek           | 雲端   | 是                   | DeepSeek 原生端點，已處理 reasoning 模型差異                      |
| Qwen               | 雲端   | 是                   | 阿里雲百鍊 DashScope 相容模式預設，適合 Qwen / QwQ               |
| Qwen Code          | 雲端   | 是                   | 阿里雲百鍊面向編碼模型的獨立預設，適合 Qwen coder 系列            |
| Doubao             | 雲端   | 是                   | 火山方舟 Ark 相容模式預設，模型欄位通常填寫 Endpoint ID           |
| Moonshot           | 雲端   | 是                   | Moonshot / Kimi 官方端點                                          |
| GLM                | 雲端   | 是                   | 智譜 BigModel 官方 OpenAI-compatible 端點                         |
| Z AI               | 雲端   | 是                   | Z AI 國際站 GLM/Zhipu OpenAI-compatible 端點，與 `GLM` 預設互補   |
| MiniMax            | 雲端   | 是                   | MiniMax 官方 chat-completions 端點                                |
| Huawei Cloud MaaS  | 雲端   | 是                   | 華為雲 ModelArts MaaS OpenAI-compatible 端點，適合託管模型        |
| Baidu Qianfan      | 雲端   | 是                   | 百度千帆官方 OpenAI-compatible 端點，適合 ERNIE 等模型            |
| SiliconFlow        | 雲端   | 是                   | SiliconFlow 官方 OpenAI-compatible 端點，適合託管開源模型         |
| OpenAI             | 雲端   | 是                   | 支援 GPT 與 o 系列模型                                            |
| Anthropic          | 雲端   | 是                   | 支援 Claude 系列                                                  |
| Google             | 雲端   | 是                   | 支援 Gemini 系列                                                  |
| Mistral            | 雲端   | 是                   | 支援 Mistral / Codestral 系列                                    |
| Azure OpenAI       | 雲端   | 是                   | 需要 Endpoint、API Key、Deployment Name 和 API Version            |
| OpenRouter         | 網關   | 是                   | 通過 OpenRouter 模型 ID 存取多家供應商                            |
| xAI                | 雲端   | 是                   | Grok 原生端點                                                     |
| Groq               | 雲端   | 是                   | 面向託管開源模型的高速 OpenAI-compatible 推理端點                 |
| Together           | 雲端   | 是                   | 面向託管開源模型的 OpenAI-compatible 端點                         |
| Fireworks          | 雲端   | 是                   | OpenAI-compatible 推理端點                                        |
| Requesty           | 網關   | 是                   | 單一 API Key 對接多供應商路由                                     |
| OpenAI Compatible  | 網關   | 可選                 | 通用預設，可接 LiteLLM、vLLM、Perplexity、Vercel AI Gateway 等    |
| LMStudio           | 本地   | 可選（`EMPTY`）      | LM Studio 本地 OpenAI-compatible 服務                             |
| Ollama             | 本地   | 否                   | Ollama 本地原生服務                                               |

*本地服務商請確保伺服器已啟動且 Base URL 配置正確。*
*OpenRouter 與 Requesty 請使用網關要求的完整/帶前綴模型 ID（例如 `google/gemini-flash-1.5` 或 `anthropic/claude-3-7-sonnet-latest`）。*
*`Doubao` 預設通常要求在模型欄位中填寫 Ark Endpoint/Deployment ID，而不是直接填寫模型家族名。設定頁現在會在仍使用預設佔位值時發出警告，並阻止連線測試，直到您替換為真實 Endpoint ID。*
*`Z AI` 面向國際 `api.z.ai` 線路，而 `GLM` 繼續保留中國大陸 BigModel 入口。請根據帳戶區域選擇對應預設。*
*中國區相容協定預設預設使用 chat-first 測試，這樣可以同時驗證 API Key、模型名或佈署 ID 是否真正可用。*
*`OpenAI Compatible` 預設用於自定義網關與代理，請按對應服務文件填寫 Base URL、鑑權方式和模型 ID。*

## 網路使用與數據處理

Notemd 在本地 Obsidian 執行，但部分功能會發起外部網路請求。

### LLM 供應商呼叫（可配置）

- 觸發場景：處理文件、內容生成、翻譯、研究總結、Mermaid 總結，以及連線測試/開發者診斷。
- 請求目標：您在 Notemd 設定中配置的 Provider Base URL。
- 發送數據：完成任務所需的 prompt 與內容片段。
- 數據說明：API 金鑰儲存在本地插件配置中，並由您的裝置發起簽章請求。

### 網頁研究請求（可選）

- 觸發場景：開啟網頁研究並選擇搜尋供應商時。
- 請求目標：Tavily 或 DuckDuckGo。
- 發送數據：您的查詢詞與必要請求元數據。

### 開發者診斷與除錯日誌（可選）

- 觸發場景：開啟 API 除錯模式或執行開發者診斷動作。
- 落地位置：保險庫根目錄（例如 `Notemd_Provider_Diagnostic_*.txt`、`Notemd_Error_Log_*.txt`）。
- 風險提示：日誌可能包含請求/回應片段，對外分享前請先審查並脫敏。

### 本地儲存

- 插件配置儲存在 `.obsidian/plugins/notemd/data.json`。
- 生成文件、報告和可選日誌根據您的設定儲存在保險庫內。

## 疑難排解

### 常見問題
- **插件未載入**：確保 `manifest.json`、`main.js`、`styles.css` 均放置在 `<保險庫>/.obsidian/plugins/notemd/` 並重啟 Obsidian。啟動異常可通過開發者主控台查看。
- **處理失敗/API 錯誤**：
    1. 文件必須為 `.md` 或 `.txt` 格式；
    2. 「測試 LLM 連線」命令可驗證 API 設定 (Notemd: Test LLM Connection)；
    3. 檢查 API 金鑰、Base URL、模型名等參數是否填寫正確；
    4. 本地模型需確保伺服器已啟動，Base URL 無誤；
    5. 雲端服務需保證網路連線正常；
    6. 單文件處理失敗可查看開發者主控台詳細資訊；
    7. 批量處理失敗可查看保險庫根目錄的 `error_processing_filename.log` 日誌。
    8. 自動錯誤日誌：若任務失敗，插件會在倉庫根目錄生成 `Notemd_Error_Log_[Timestamp].txt`，其中包含錯誤資訊、堆疊與工作階段日誌。開啟「API 錯誤除錯模式」後，該日誌會包含更完整的 API 除錯細節。
    9. 真實 Endpoint 長請求診斷（開發者）：
        - 插件內路徑（建議先用）：進入 **設定 -> Notemd -> 開發者 Provider 診斷（長請求）**，對活動 Provider 執行執行階段探針，並在倉庫根目錄生成 `Notemd_Provider_Diagnostic_*.txt` 報告。
        - CLI 路徑（在 Obsidian 執行階段之外）：若需要對真實端點執行 buffered 與 streaming 的可重複對照，可使用內建 Node 診斷指令碼：
        ```bash
        npm run diagnose:llm -- \
          --transport openai-compatible \
          --provider-name OpenRouter \
          --base-url https://openrouter.ai/api/v1 \
          --api-key "$OPENROUTER_API_KEY" \
          --model anthropic/claude-3.7-sonnet \
          --prompt-file ./tmp/prompt.txt \
          --content-file ./tmp/content.txt \
          --mode compare \
          --timeout-ms 360000 \
          --output ./tmp/openrouter-diagnostic.txt
        ```
        該報告會記錄每次嘗試的 `First Byte`、`Duration`、脫敏後的請求資訊、回應標頭、原始/部分回應體、已解析的串流片段以及傳輸層失敗點，便於定位逾時、斷連與網關行為。
- **LM Studio/Ollama 連線問題**：
    *   **測試連線失敗**：確保本地伺服器（LM Studio 或 Ollama）正在執行，並且已載入/可用正確的模型。
    *   **CORS 錯誤（Windows 上的 Ollama）**：如果在 Windows 上使用 Ollama 時遇到 CORS（跨來源資源共享）錯誤，您可能需要設定 `OLLAMA_ORIGINS` 環境變數。您可以在啟動 Ollama 之前，在命令提示字元中執行 `set OLLAMA_ORIGINS=*` 來實現。這允許來自任何來源的請求。
    *   **在 LM Studio 中啟用 CORS**：對於 LM Studio，您可以直接在伺服器設定中啟用 CORS，如果 Obsidian 在瀏覽器中執行或具有嚴格的來源策略，這可能是必需的。
- **資料夾建立失敗**：請確保設定中儲存路徑為相對路徑，且不包含無效字元（如\* " \ / < > : | ? # ^ [ ] 等）。
- **效能問題**：大文件或批量處理可適當調低分塊字數，或更換 LLM 模型。
- **連結品質問題**：可嘗試不同模型或溫度設定改善效果。

## 貢獻

歡迎任何形式的貢獻！請參考 GitHub 專案說明: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## 維護者文件

- [發佈流程（英文）](./docs/maintainer/release-workflow.md)
- [發佈流程（簡體中文）](./docs/maintainer/release-workflow.zh-CN.md)

## 授權條款

MIT 授權條款 - 詳情請見 [LICENSE](LICENSE)。

---


*Notemd v1.8.3 - 用 AI 提升你的 Obsidian 知識圖譜。*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
