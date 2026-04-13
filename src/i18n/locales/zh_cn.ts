import type { NotemdEnglishStrings } from './en';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export const STRINGS_ZH_CN: DeepPartial<NotemdEnglishStrings> = {
    common: {
        language: '语言',
        cancel: '取消',
        close: '关闭',
        copy: '复制',
        ready: '就绪',
        standby: '待命',
        unknownError: '未知错误'
    },
    plugin: {
        viewName: 'Notemd 工作台',
        ribbonTooltip: '打开 Notemd 侧边栏'
    },
    settings: {
        language: {
            heading: '语言设置',
            uiLocaleName: '界面语言',
            uiLocaleDesc: '选择插件界面所使用的语言。“自动”将跟随当前 Obsidian 语言。',
            uiLocaleAuto: '跟随 Obsidian（自动）',
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
        defaultWorkflowName: '一键提取',
        quickWorkflowTitle: '快速工作流',
        quickWorkflowDesc: '由内置动作组装的自定义按钮。',
        sectionTitles: {
            core: '核心流程',
            generation: '生成与 Mermaid',
            knowledge: '知识',
            translation: '翻译',
            utilities: '工具'
        },
        actions: {
            processCurrentAddLinks: { label: '处理文件（添加链接）' },
            processFolderAddLinks: { label: '处理文件夹（添加链接）' },
            generateFromTitle: { label: '从标题生成' },
            batchGenerateFromTitles: { label: '从标题批量生成' },
            researchAndSummarize: { label: '研究并总结' },
            summarizeAsMermaid: { label: '总结为 Mermaid 图表' },
            translateCurrentFile: { label: '翻译当前文件' },
            batchTranslateFolder: { label: '批量翻译文件夹' },
            extractConceptsCurrent: { label: '提取概念（当前文件）' },
            extractConceptsFolder: { label: '提取概念（文件夹）' },
            extractOriginalText: { label: '提取指定原文' },
            batchMermaidFix: { label: '批量修复 Mermaid' },
            fixFormulaCurrent: { label: '修复公式格式（当前）' },
            batchFixFormula: { label: '批量修复公式格式' },
            checkDuplicatesCurrent: { label: '检查重复项（当前文件）' },
            checkRemoveDuplicateConcepts: { label: '检查并移除重复项' },
            testLlmConnection: { label: '测试 LLM 连接' }
        },
        status: {
            runningAction: '正在运行“{label}”…',
            actionComplete: '“{label}”已完成',
            actionFailed: '动作失败：{message}',
            workflowStart: '工作流：{name}',
            workflowComplete: '工作流“{name}”已完成',
            workflowFailed: '工作流失败',
            workflowFailedLog: '工作流失败：{message}',
            workflowFinishedWithErrors: '工作流“{name}”已结束，包含 {count} 个错误',
            stepLabel: '[{current}/{total}] {label}',
            stepLog: '步骤 {current}/{total}：{label}',
            stepFailed: '步骤失败：{message}',
            processingActive: '处理中…（活动任务：{count}）',
            timeRemaining: '预计剩余时间：{time}',
            timeRemainingCalculating: '预计剩余时间：计算中…',
            stopped: '已停止',
            processingStopped: '处理已停止。',
            cancelling: '正在取消…',
            userRequestedCancellation: '用户请求取消。'
        },
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
    },
    progressModal: {
        heading: 'Notemd 处理中',
        starting: '正在启动…',
        cancelProgress: '取消',
        timeRemaining: '预计剩余时间：{time}',
        timeRemainingCalculating: '预计剩余时间：计算中…',
        cancelledOrError: '已取消/出错',
        processingStopped: '处理已停止。',
        cancelling: '正在取消…',
        userRequestedCancellation: '用户请求取消。'
    }
};
