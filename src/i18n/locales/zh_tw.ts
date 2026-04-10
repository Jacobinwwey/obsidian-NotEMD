import type { NotemdEnglishStrings } from './en';

export const STRINGS_ZH_TW: Partial<NotemdEnglishStrings> = {
    common: {
        language: '語言',
        cancel: '取消',
        close: '關閉',
        copy: '複製',
        ready: '就緒',
        standby: '待命',
        unknownError: '未知錯誤'
    },
    settings: {
        language: {
            heading: '語言設定',
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
        quickWorkflowTitle: '快速工作流程',
        quickWorkflowDesc: '由內建動作組裝的自訂按鈕。',
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
        notemdBusy: 'Notemd 忙碌中。'
    },
    errorModal: {
        copyDetails: '複製錯誤詳情',
        copied: '已複製！',
        copySuccessNotice: '錯誤詳情已複製到剪貼簿！',
        copyFailedNotice: '複製錯誤詳情失敗，請查看主控台。'
    }
};
