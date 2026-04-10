import type { NotemdEnglishStrings } from './en';

export const STRINGS_ZH_CN: Partial<NotemdEnglishStrings> = {
    common: {
        language: '语言',
        cancel: '取消',
        close: '关闭',
        copy: '复制',
        ready: '就绪',
        standby: '待命',
        unknownError: '未知错误'
    },
    settings: {
        language: {
            heading: '语言设置',
            outputName: '输出语言',
            outputDesc: '选择 LLM 输出内容使用的语言。',
            perTaskName: '为不同任务选择不同语言',
            perTaskDesc: '开：为每个任务分别设置语言。关：统一使用“输出语言”。',
            disableAutoTranslationName: '关闭自动翻译（“Translate”任务除外）',
            disableAutoTranslationDesc: '开：非 Translate 任务不强制翻译到目标语言。Translate 任务仍按配置执行翻译。',
            taskLanguageLabel: '{task} 语言',
            taskLanguageDesc: '为“{task}”选择输出语言。'
        },
        developer: {
            modeName: '开发者模式',
            modeDesc: '开：显示开发者诊断工具。关：隐藏开发者专用控件。',
            heading: '开发者诊断',
            runDiagnostic: '运行诊断',
            runStability: '运行稳定性测试'
        }
    },
    sidebar: {
        heroTitle: 'Notemd 工作台',
        heroDesc: '执行单项任务或自定义一键工作流，并查看实时进度与日志。',
        quickWorkflowTitle: '快速工作流',
        quickWorkflowDesc: '由内置动作组装的自定义按钮。',
        builtInActionsPrefix: '内置{category}动作。',
        logOutputTitle: '日志输出',
        copyLog: '复制日志',
        copyLogSuccess: '日志已复制！',
        copyLogFailed: '复制日志失败。',
        logEmpty: '日志为空。',
        cancelProcessing: '取消处理',
        workflowFallbackWarning: '工作流 DSL 有 {count} 个问题，侧边栏已使用默认回退配置。',
        languageChangedNotice: '语言已切换为 {language}'
    },
    notices: {
        processingAlreadyRunning: '已有任务正在处理中。',
        anotherProcessRunning: '另一个任务正在运行，请稍候。',
        notemdBusy: 'Notemd 正在忙碌中。'
    },
    errorModal: {
        copyDetails: '复制错误详情',
        copied: '已复制！',
        copySuccessNotice: '错误详情已复制到剪贴板！',
        copyFailedNotice: '复制错误详情失败，请查看控制台。'
    }
};
