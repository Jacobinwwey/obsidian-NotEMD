import type { DiagramSpec } from '../../diagram/types';

/** Mirrors the filename-rooted structure used to demonstrate the vault architecture document. */
export const DRAWNIX_ARCHITECTURE_DOCUMENT_TREE_FIXTURE: DiagramSpec = {
    intent: 'drawnixMindmap',
    title: 'Notemd 系统架构总览',
    summary: '基于真实架构文档的单根知识图，用于验证 Drawnix 关系路由。',
    sourceLanguage: 'zh-CN',
    outputLanguage: 'zh-CN',
    nodes: [{
        id: 'architecture-zh-cn',
        label: 'architecture.zh-CN',
        kind: 'document',
        children: [
            {
                id: 'ui-entrypoints',
                label: 'Obsidian 用户界面',
                kind: 'subsystem',
                children: [
                { id: 'command-panel', label: '命令面板', kind: 'component' },
                { id: 'notemd-sidebar', label: 'Notemd 工作台', kind: 'component' },
                { id: 'settings-tab', label: '设置标签页', kind: 'component' }
                ]
            },
            {
                id: 'plugin-orchestration',
                label: 'NotemdPlugin 编排',
                kind: 'subsystem',
                children: [
                { id: 'settings-store', label: '设置加载与保存', kind: 'subsystem' },
                { id: 'command-dispatch', label: '命令分发', kind: 'subsystem' },
                { id: 'batch-operations', label: '批量处理', kind: 'subsystem' },
                { id: 'operation-host-adapters', label: 'Host adapter 编排', kind: 'component' }
                ]
            },
            {
                id: 'llm-pipeline',
                label: 'LLM 调用管道',
                kind: 'subsystem',
                children: [
                { id: 'provider-registry', label: '提供商注册', kind: 'subsystem' },
                { id: 'token-policy', label: '令牌解析', kind: 'subsystem' },
                { id: 'response-cache', label: '响应缓存', kind: 'component' },
                {
                    id: 'transport-runtime',
                    label: '传输运行时',
                    kind: 'subsystem',
                    children: [
                        { id: 'openai-compatible', label: 'OpenAI-compatible', kind: 'component' },
                        { id: 'protocol-transports', label: 'Anthropic / Google / Azure / Ollama', kind: 'component' }
                    ]
                }
                ]
            },
            {
                id: 'diagram-platform',
                label: '图表渲染平台',
                kind: 'subsystem',
                children: [
                { id: 'diagram-plan', label: 'DiagramPlan', kind: 'subsystem' },
                { id: 'spec-generation', label: 'DiagramSpec 提示与解析', kind: 'subsystem' },
                { id: 'renderer-registry', label: 'RendererRegistry', kind: 'subsystem' },
                { id: 'preview-host', label: 'IframeRenderHost', kind: 'component' }
                ]
            },
            {
                id: 'artifact-delivery',
                label: 'Artifact 交付',
                kind: 'subsystem',
                children: [
                { id: 'vault-artifacts', label: 'Vault 可编辑工件', kind: 'subsystem' },
                { id: 'preview-modal', label: 'DiagramPreviewModal', kind: 'component' },
                { id: 'multi-format-export', label: 'SVG / PNG / PDF 导出', kind: 'component' }
                ]
            },
            {
                id: 'cli-boundary',
                label: 'CLI 与 operation 边界',
                kind: 'subsystem',
                children: [
                { id: 'official-cli', label: '官方 Obsidian CLI', kind: 'external' },
                { id: 'maintainer-bridge', label: 'Maintainer bridge', kind: 'component' },
                { id: 'operation-core', label: '宿主无关 operation core', kind: 'subsystem' },
                { id: 'typed-contracts', label: 'Capability 与调用契约', kind: 'evidence' }
                ]
            }
        ]
    }],
    edges: [
        { from: 'command-panel', to: 'command-dispatch', label: '触发' },
        { from: 'notemd-sidebar', to: 'command-dispatch', label: '触发' },
        { from: 'command-dispatch', to: 'provider-registry', label: '选择模型' },
        { from: 'response-cache', to: 'transport-runtime', label: '未命中后请求' },
        { from: 'transport-runtime', to: 'spec-generation', label: '结构化响应' },
        { from: 'spec-generation', to: 'renderer-registry', label: 'DiagramSpec' },
        { from: 'renderer-registry', to: 'vault-artifacts', label: '持久化' },
        { from: 'renderer-registry', to: 'preview-host', label: '渲染会话' },
        { from: 'official-cli', to: 'operation-core', label: '命令触发' },
        { from: 'operation-core', to: 'command-dispatch', label: '宿主绑定' }
    ]
};
