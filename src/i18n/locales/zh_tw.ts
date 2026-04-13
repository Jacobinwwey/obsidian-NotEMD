import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const STRINGS_ZH_TW: DeepPartial<NotemdEnglishStrings> = {
    common: {
        language: '語言',
        select: '選擇',
        cancel: '取消',
        close: '關閉',
        copy: '複製',
        ready: '就緒',
        standby: '待命',
        unknownError: '未知錯誤'
    },
    commands: {
        checkDuplicatesCurrent: '檢查目前檔案中的重複項',
        extractConceptsAndGenerateTitles: '擷取概念並生成標題',
        createWikiLinkAndGenerateNoteFromSelection: '從選取內容建立 Wiki-Link 並生成筆記'
    },
    plugin: {
        viewName: 'Notemd 工作台',
        ribbonTooltip: '開啟 Notemd 側欄'
    },
    folderPicker: {
        title: '選擇資料夾',
        vaultRoot: '（Vault 根目錄）',
        selectAction: '選擇'
    },
    duplicateModal: {
        title: '確認刪除重複項',
        intro: '以下 {count} 筆概念筆記被識別為可能重複項，將移至系統垃圾桶：',
        reason: '原因：{reason}',
        conflictsWith: '衝突項目：{files}',
        warning: '此操作無法在 Obsidian 內輕易復原，但通常仍可從系統垃圾桶還原檔案。',
        deleteFiles: '刪除 {count} 個檔案'
    },
    settings: {
        language: {
            heading: '語言設定',
            uiLocaleName: '介面語言',
            uiLocaleDesc: '選擇外掛介面使用的語言。「自動」會跟隨目前 Obsidian 語言。',
            uiLocaleAuto: '跟隨 Obsidian（自動）',
            outputName: '輸出語言',
            outputDesc: '選擇 LLM 輸出內容使用的語言。',
            perTaskName: '為不同任務選擇不同語言',
            perTaskDesc: '開：可為每個任務設定語言。關：統一使用「輸出語言」。',
            disableAutoTranslationName: '停用自動翻譯（「Translate」任務除外）',
            disableAutoTranslationDesc: '開：非 Translate 任務不強制翻譯到目標語言。Translate 任務仍依設定執行。',
            taskLanguageLabel: '{task} 語言',
            taskLanguageDesc: '為「{task}」選擇輸出語言。'
        },
        developer: {
            modeName: '開發者模式',
            modeDesc: '開：顯示開發者診斷工具。關：隱藏開發者專用控制項。',
            heading: '開發者診斷',
            runDiagnostic: '執行診斷',
            runStability: '執行穩定性測試'
        }
    },
    sidebar: {
        heroTitle: 'Notemd 工作台',
        heroDesc: '執行單一動作或自訂一鍵工作流程，並查看即時進度與日誌。',
        defaultWorkflowName: '一鍵擷取',
        quickWorkflowTitle: '快速工作流程',
        quickWorkflowDesc: '由內建動作組裝的自訂按鈕。',
        sectionTitles: {
            core: '核心流程',
            generation: '生成與 Mermaid',
            knowledge: '知識',
            translation: '翻譯',
            utilities: '工具'
        },
        actions: {
            processCurrentAddLinks: { label: '處理檔案（新增連結）' },
            processFolderAddLinks: { label: '處理資料夾（新增連結）' },
            generateFromTitle: { label: '從標題生成' },
            batchGenerateFromTitles: { label: '從標題批次生成' },
            researchAndSummarize: { label: '研究並摘要' },
            summarizeAsMermaid: { label: '摘要為 Mermaid 圖表' },
            translateCurrentFile: { label: '翻譯目前檔案' },
            batchTranslateFolder: { label: '批次翻譯資料夾' },
            extractConceptsCurrent: { label: '擷取概念（目前檔案）' },
            extractConceptsFolder: { label: '擷取概念（資料夾）' },
            extractOriginalText: { label: '擷取指定原文' },
            batchMermaidFix: { label: '批次修復 Mermaid' },
            fixFormulaCurrent: { label: '修復公式格式（目前）' },
            batchFixFormula: { label: '批次修復公式格式' },
            checkDuplicatesCurrent: { label: '檢查重複項（目前檔案）' },
            checkRemoveDuplicateConcepts: { label: '檢查並移除重複項' },
            testLlmConnection: { label: '測試 LLM 連線' }
        },
        status: {
            runningAction: '正在執行「{label}」…',
            actionComplete: '「{label}」已完成',
            actionFailed: '動作失敗：{message}',
            workflowStart: '工作流程：{name}',
            workflowComplete: '工作流程「{name}」已完成',
            workflowFailed: '工作流程失敗',
            workflowFailedLog: '工作流程失敗：{message}',
            workflowFinishedWithErrors: '工作流程「{name}」已結束，含 {count} 個錯誤',
            stepLabel: '[{current}/{total}] {label}',
            stepLog: '步驟 {current}/{total}：{label}',
            stepFailed: '步驟失敗：{message}',
            processingActive: '處理中…（活動任務：{count}）',
            timeRemaining: '預估剩餘時間：{time}',
            timeRemainingCalculating: '預估剩餘時間：計算中…',
            stopped: '已停止',
            processingStopped: '處理已停止。',
            cancelling: '正在取消…',
            userRequestedCancellation: '使用者要求取消。'
        },
        builtInActionsPrefix: '內建 {category} 動作。',
        logOutputTitle: '日誌輸出',
        copyLog: '複製日誌',
        copyLogSuccess: '日誌已複製！',
        copyLogFailed: '複製日誌失敗。',
        logEmpty: '日誌為空。',
        cancelProcessing: '取消處理',
        workflowFallbackWarning: '工作流程 DSL 有 {count} 個問題，側欄已使用預設回退設定。',
        languageChangedNotice: '語言已切換為 {language}'
    },
    notices: {
        processingAlreadyRunning: '已有任務正在處理中。',
        anotherProcessRunning: '另一個任務正在執行，請稍候。',
        notemdBusy: 'Notemd 忙碌中。',
        duplicateTermsFound: '發現 {count} 個可能重複的詞彙。',
        duplicateTermsCheckConsole: '發現 {count} 個可能重複的詞彙。請查看主控台。',
        duplicateTermsCheckLogConsole: '發現 {count} 個可能重複的詞彙。請查看日誌與主控台。',
        duplicateCheckError: '檢查重複項時發生錯誤：{message}',
        noActiveTextFileSelected: "目前沒有選取的 '.md' 或 '.txt' 檔案。",
        noActiveProviderConfigured: '目前未設定作用中的 LLM 提供者，請檢查 Notemd 設定。',
        noActiveMarkdownFileSelectedOrChanged: '目前沒有選取的 Markdown 檔案，或檔案已變更。',
        noActiveMarkdownFileSelected: '目前沒有選取的 Markdown 檔案。',
        noActiveMarkdownEditorFound: '找不到作用中的 Markdown 編輯器。',
        selectValidWord: '請選取有效的詞語（至少 2 個字元）。',
        setConceptNoteFolder: '請先在設定中設定 Concept Note Folder。',
        generatedContentForWord: '已為 [[{word}]] 生成內容！',
        genericError: '錯誤：{message}',
        couldNotOpenSidebar: '無法開啟 Notemd 側欄。',
        processingComplete: 'Notemd 處理完成！',
        extractionCompleteSavedTo: '擷取完成，已儲存至 {path}',
        noMarkdownFilesFoundSelectedFolder: '所選資料夾中找不到 Markdown 檔案。',
        batchTranslationCompleted: '已完成 {count} 個檔案的批次翻譯。',
        batchTranslationFailed: '批次翻譯失敗，請查看主控台以取得詳細資訊。',
        fileEmpty: '檔案為空。',
        noTranslationProviderConfigured: '尚未設定翻譯使用的提供者。',
        failedCreateTranslationFolder: '建立翻譯資料夾失敗：{path}。將回退到原始檔案所在資料夾。',
        translatedFileSavedTo: '翻譯後的檔案已儲存至 {path}',
        failedTranslateFile: '翻譯檔案失敗，請查看主控台以取得詳細資訊。',
        duplicateDeletionCancelled: '已取消刪除重複項。',
        duplicateCheckComplete: '重複項檢查完成。',
        duplicateCheckCompleteCancelled: '重複項檢查完成（已取消刪除）。',
        noPotentialDuplicateConceptNotesFound: '未發現可能重複的概念筆記。',
        deletionCompleteSummary: '刪除完成。在 {total} 個已識別檔案中刪除了 {deleted} 個，發生 {errors} 個錯誤。'
    },
    errorModal: {
        copyDetails: '複製錯誤詳情',
        copied: '已複製！',
        copySuccessNotice: '錯誤詳情已複製到剪貼簿！',
        copyFailedNotice: '複製錯誤詳情失敗，請查看主控台。'
    },
    progressModal: {
        heading: 'Notemd 處理中',
        starting: '正在啟動…',
        cancelProgress: '取消',
        timeRemaining: '預估剩餘時間：{time}',
        timeRemainingCalculating: '預估剩餘時間：計算中…',
        cancelledOrError: '已取消/錯誤',
        processingStopped: '處理已停止。',
        cancelling: '正在取消…',
        userRequestedCancellation: '使用者要求取消。'
    }
};
