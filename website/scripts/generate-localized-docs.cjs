const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const docsRoot = path.join(root, 'docs');
const i18nRoot = path.join(root, 'i18n');

const locales = {
  'zh-CN': {
    title: '简体中文',
    next: '下一步',
    docs: '文档',
    faq: '常见问题',
    gettingStarted: '入门',
    coreFeatures: '核心功能',
    providers: 'LLM 提供商',
    advanced: '高级',
    community: '社区',
    more: '更多',
    sponsor: '赞助',
    logoAlt: 'Notemd 标志',
    built: '基于 Docusaurus 构建。',
    license: 'MIT 许可证',
    tldrPrefix: '本页说明',
    overview: '概览',
    howItWorks: '工作机制',
    configuration: '配置',
    usage: '使用方式',
    troubleshooting: '故障排查',
    nextSteps: '下一步',
    reserved: '以下命令、配置键、文件扩展名和 Provider 名称按产品真实接口保留英文，以便与插件界面、CLI 和日志一一对应。',
  },
  'zh-Hant': {
    title: '繁體中文',
    next: '下一步',
    docs: '文件',
    faq: '常見問題',
    gettingStarted: '入門',
    coreFeatures: '核心功能',
    providers: 'LLM 提供商',
    advanced: '進階',
    community: '社群',
    more: '更多',
    sponsor: '贊助',
    logoAlt: 'Notemd 標誌',
    built: '以 Docusaurus 建置。',
    license: 'MIT 授權',
    tldrPrefix: '本頁說明',
    overview: '概覽',
    howItWorks: '運作方式',
    configuration: '設定',
    usage: '使用方式',
    troubleshooting: '疑難排解',
    nextSteps: '下一步',
    reserved: '以下命令、設定鍵、檔案副檔名與 Provider 名稱保留英文，以便和外掛介面、CLI 與日誌逐一對應。',
  },
  ja: {
    title: '日本語',
    next: '次へ',
    docs: 'ドキュメント',
    faq: 'FAQ',
    gettingStarted: 'はじめに',
    coreFeatures: '主要機能',
    providers: 'LLM プロバイダー',
    advanced: '高度な設定',
    community: 'コミュニティ',
    more: 'その他',
    sponsor: 'スポンサー',
    logoAlt: 'Notemd ロゴ',
    built: 'Docusaurus で構築。',
    license: 'MIT ライセンス',
    tldrPrefix: 'このページの要点',
    overview: '概要',
    howItWorks: '仕組み',
    configuration: '設定',
    usage: '使い方',
    troubleshooting: 'トラブルシューティング',
    nextSteps: '次のステップ',
    reserved: '以下のコマンド、設定キー、拡張子、Provider 名は、プラグイン UI、CLI、ログと対応させるため英語表記のままにしています。',
  },
  fr: {
    title: 'Français',
    next: 'Étape suivante',
    docs: 'Documentation',
    faq: 'FAQ',
    gettingStarted: 'Démarrage',
    coreFeatures: 'Fonctions clés',
    providers: 'Fournisseurs LLM',
    advanced: 'Avancé',
    community: 'Communauté',
    more: 'Plus',
    sponsor: 'Soutenir',
    logoAlt: 'Logo Notemd',
    built: 'Construit avec Docusaurus.',
    license: 'Licence MIT',
    tldrPrefix: 'Résumé',
    overview: 'Vue d’ensemble',
    howItWorks: 'Fonctionnement',
    configuration: 'Configuration',
    usage: 'Utilisation',
    troubleshooting: 'Dépannage',
    nextSteps: 'Étapes suivantes',
    reserved: 'Les commandes, clés de configuration, extensions et noms de Provider ci-dessous restent en anglais afin de correspondre exactement à l’interface, au CLI et aux journaux.',
  },
  de: {
    title: 'Deutsch',
    next: 'Nächster Schritt',
    docs: 'Dokumentation',
    faq: 'FAQ',
    gettingStarted: 'Einstieg',
    coreFeatures: 'Kernfunktionen',
    providers: 'LLM-Anbieter',
    advanced: 'Erweitert',
    community: 'Community',
    more: 'Mehr',
    sponsor: 'Sponsor',
    logoAlt: 'Notemd-Logo',
    built: 'Mit Docusaurus erstellt.',
    license: 'MIT-Lizenz',
    tldrPrefix: 'Kurzfassung',
    overview: 'Überblick',
    howItWorks: 'Funktionsweise',
    configuration: 'Konfiguration',
    usage: 'Verwendung',
    troubleshooting: 'Fehlerbehebung',
    nextSteps: 'Nächste Schritte',
    reserved: 'Die folgenden Befehle, Konfigurationsschlüssel, Dateiendungen und Provider-Namen bleiben englisch, damit sie exakt zur Plugin-Oberfläche, CLI und zu Logs passen.',
  },
  es: {
    title: 'Español',
    next: 'Siguiente paso',
    docs: 'Documentación',
    faq: 'Preguntas frecuentes',
    gettingStarted: 'Primeros pasos',
    coreFeatures: 'Funciones principales',
    providers: 'Proveedores LLM',
    advanced: 'Avanzado',
    community: 'Comunidad',
    more: 'Más',
    sponsor: 'Patrocinar',
    logoAlt: 'Logotipo de Notemd',
    built: 'Creado con Docusaurus.',
    license: 'Licencia MIT',
    tldrPrefix: 'Resumen',
    overview: 'Visión general',
    howItWorks: 'Cómo funciona',
    configuration: 'Configuración',
    usage: 'Uso',
    troubleshooting: 'Solución de problemas',
    nextSteps: 'Siguientes pasos',
    reserved: 'Los comandos, claves de configuración, extensiones y nombres de Provider siguientes se mantienen en inglés para coincidir exactamente con la interfaz, el CLI y los registros.',
  },
  ko: {
    title: '한국어',
    next: '다음 단계',
    docs: '문서',
    faq: 'FAQ',
    gettingStarted: '시작하기',
    coreFeatures: '핵심 기능',
    providers: 'LLM 제공자',
    advanced: '고급',
    community: '커뮤니티',
    more: '더 보기',
    sponsor: '후원',
    logoAlt: 'Notemd 로고',
    built: 'Docusaurus로 빌드되었습니다.',
    license: 'MIT 라이선스',
    tldrPrefix: '요약',
    overview: '개요',
    howItWorks: '작동 방식',
    configuration: '설정',
    usage: '사용 방법',
    troubleshooting: '문제 해결',
    nextSteps: '다음 단계',
    reserved: '아래의 명령, 설정 키, 파일 확장자, Provider 이름은 플러그인 UI, CLI, 로그와 정확히 대응하도록 영어로 유지합니다.',
  },
};

const docTitles = {
  'intro.mdx': {
    'zh-CN': 'Notemd 介绍',
    'zh-Hant': 'Notemd 介紹',
    ja: 'Notemd の概要',
    fr: 'Introduction à Notemd',
    de: 'Einführung in Notemd',
    es: 'Introducción a Notemd',
    ko: 'Notemd 소개',
  },
  'getting-started/installation.mdx': {
    'zh-CN': '安装',
    'zh-Hant': '安裝',
    ja: 'インストール',
    fr: 'Installation',
    de: 'Installation',
    es: 'Instalación',
    ko: '설치',
  },
  'getting-started/quick-start.mdx': {
    'zh-CN': '快速开始指南',
    'zh-Hant': '快速開始指南',
    ja: 'クイックスタートガイド',
    fr: 'Guide de démarrage rapide',
    de: 'Schnellstartanleitung',
    es: 'Guía de inicio rápido',
    ko: '빠른 시작 가이드',
  },
  'getting-started/configuration.mdx': {
    'zh-CN': '配置',
    'zh-Hant': '設定',
    ja: '設定',
    fr: 'Configuration',
    de: 'Konfiguration',
    es: 'Configuración',
    ko: '설정',
  },
  'features/wiki-links.mdx': {
    'zh-CN': 'Wiki 链接',
    'zh-Hant': 'Wiki 連結',
    ja: 'Wiki リンク',
    fr: 'Liens wiki',
    de: 'Wiki-Links',
    es: 'Wiki-enlaces',
    ko: 'Wiki 링크',
  },
  'features/concept-notes.mdx': {
    'zh-CN': '概念笔记',
    'zh-Hant': '概念筆記',
    ja: '概念ノート',
    fr: 'Notes de concept',
    de: 'Konzeptnotizen',
    es: 'Notas de concepto',
    ko: '개념 노트',
  },
  'features/research.mdx': {
    'zh-CN': '研究与网页搜索',
    'zh-Hant': '研究與網頁搜尋',
    ja: '調査と Web 検索',
    fr: 'Recherche et recherche web',
    de: 'Recherche und Websuche',
    es: 'Investigación y búsqueda web',
    ko: '연구와 웹 검색',
  },
  'features/translation.mdx': {
    'zh-CN': '翻译',
    'zh-Hant': '翻譯',
    ja: '翻訳',
    fr: 'Traduction',
    de: 'Übersetzung',
    es: 'Traducción',
    ko: '번역',
  },
  'features/diagrams.mdx': {
    'zh-CN': '图表与可编辑 Figure',
    'zh-Hant': '圖表與可編輯 Figure',
    ja: '図表と編集可能な Figure',
    fr: 'Diagrammes et figures modifiables',
    de: 'Diagramme und bearbeitbare Figures',
    es: 'Diagramas y figuras editables',
    ko: '다이어그램과 편집 가능한 Figure',
  },
  'features/workflows.mdx': {
    'zh-CN': '工作流',
    'zh-Hant': '工作流程',
    ja: 'ワークフロー',
    fr: 'Workflows',
    de: 'Workflows',
    es: 'Flujos de trabajo',
    ko: '워크플로',
  },
  'providers/overview.mdx': {
    'zh-CN': 'LLM 提供商',
    'zh-Hant': 'LLM 提供商',
    ja: 'LLM プロバイダー',
    fr: 'Fournisseurs LLM',
    de: 'LLM-Anbieter',
    es: 'Proveedores LLM',
    ko: 'LLM 제공자',
  },
  'providers/openai.mdx': {
    'zh-CN': 'OpenAI',
    'zh-Hant': 'OpenAI',
    ja: 'OpenAI',
    fr: 'OpenAI',
    de: 'OpenAI',
    es: 'OpenAI',
    ko: 'OpenAI',
  },
  'providers/anthropic.mdx': {
    'zh-CN': 'Anthropic',
    'zh-Hant': 'Anthropic',
    ja: 'Anthropic',
    fr: 'Anthropic',
    de: 'Anthropic',
    es: 'Anthropic',
    ko: 'Anthropic',
  },
  'providers/google.mdx': {
    'zh-CN': 'Google',
    'zh-Hant': 'Google',
    ja: 'Google',
    fr: 'Google',
    de: 'Google',
    es: 'Google',
    ko: 'Google',
  },
  'providers/local.mdx': {
    'zh-CN': '本地模型',
    'zh-Hant': '本機模型',
    ja: 'ローカルモデル',
    fr: 'Modèles locaux',
    de: 'Lokale Modelle',
    es: 'Modelos locales',
    ko: '로컬 모델',
  },
  'providers/china.mdx': {
    'zh-CN': '中国区提供商',
    'zh-Hant': '中國區提供商',
    ja: '中国系プロバイダー',
    fr: 'Fournisseurs chinois',
    de: 'China-Anbieter',
    es: 'Proveedores de China',
    ko: '중국 제공자',
  },
  'advanced/custom-prompts.mdx': {
    'zh-CN': '自定义 Prompt',
    'zh-Hant': '自訂 Prompt',
    ja: 'カスタムプロンプト',
    fr: 'Prompts personnalisés',
    de: 'Benutzerdefinierte Prompts',
    es: 'Prompts personalizados',
    ko: '사용자 지정 프롬프트',
  },
  'advanced/batch-processing.mdx': {
    'zh-CN': '批处理',
    'zh-Hant': '批次處理',
    ja: 'バッチ処理',
    fr: 'Traitement par lots',
    de: 'Stapelverarbeitung',
    es: 'Procesamiento por lotes',
    ko: '일괄 처리',
  },
  'advanced/troubleshooting.mdx': {
    'zh-CN': '故障排查',
    'zh-Hant': '疑難排解',
    ja: 'トラブルシューティング',
    fr: 'Dépannage',
    de: 'Fehlerbehebung',
    es: 'Solución de problemas',
    ko: '문제 해결',
  },
  'pillar-ai-knowledge.mdx': {
    'zh-CN': 'Obsidian AI 知识管理指南',
    'zh-Hant': 'Obsidian AI 知識管理指南',
    ja: 'Obsidian AI ナレッジ管理ガイド',
    fr: 'Guide de gestion des connaissances IA dans Obsidian',
    de: 'Leitfaden für KI-Wissensmanagement in Obsidian',
    es: 'Guía de gestión del conocimiento con IA en Obsidian',
    ko: 'Obsidian AI 지식 관리 가이드',
  },
  'faq.mdx': {
    'zh-CN': '常见问题',
    'zh-Hant': '常見問題',
    ja: 'よくある質問',
    fr: 'Questions fréquentes',
    de: 'Häufig gestellte Fragen',
    es: 'Preguntas frecuentes',
    ko: '자주 묻는 질문',
  },
};

const zhHeadingReplacements = new Map(Object.entries({
  'Getting Started': '入门',
  'Intent Detection': '意图识别',
  'Usage': '使用方式',
  'Generate a Diagram': '生成图表',
  'Preview a Diagram': '预览图表',
  'Legacy Mermaid Mode': '旧版 Mermaid 模式',
  'Rendering Backends': '渲染后端',
  'Draw.io and Drawnix Export Boundaries': 'Draw.io 与 Drawnix 导出边界',
  'circuitikz / TikZJax Direction': 'circuitikz / TikZJax 方向',
  'Golden Reference Prompt Shape': 'Golden Reference Prompt 形态',
  'Current Progress And Next Phases': '当前进展与后续阶段',
  'Configuration': '配置',
  'Local Knowledge Augmentation': '本地知识增强',
  'Compatibility Modes': '兼容模式',
  'Preview & Export': '预览与导出',
  'Tips': '建议',
  'Next Steps': '下一步',
  'Provider Configuration': 'Provider 配置',
  'Task-Specific Models': '按任务选择模型',
  'Output Configuration': '输出配置',
  'Language Settings': '语言设置',
  'Search Integration': '搜索集成',
  'Workflow Configuration': '工作流配置',
  'Advanced Settings': '高级设置',
  'Backlinks': '反向链接',
  'UI Language': '界面语言',
  'Output Language': '输出语言',
  'Translation Target': '翻译目标',
  'Batch Processing': '批处理',
  'Smart Chunking': '智能分块',
  'Diagnostics Panel': '诊断面板',
  'Duplicate Concept Detection': '重复概念检测',
  'API Key Invalid': 'API Key 无效',
  'Models Not Loading': '模型列表加载失败',
  'Research & Summarize': '研究并总结',
  'Troubleshooting': '故障排查',
  'LLM Providers': 'LLM 提供商',
  'Provider Categories': 'Provider 分类',
  'Cloud Providers': '云端 Provider',
  'Gateway / Proxy Providers': '网关 / 代理 Provider',
  'China Providers': '中国区 Provider',
  'Local Providers': '本地 Provider',
  'API Call Architecture': 'API 调用架构',
  'Transport Layers': '传输层',
  'Retry Logic': '重试逻辑',
  'Response Caching': '响应缓存',
  'Reasoning Model Handling': '推理模型处理',
  'Token Estimation': 'Token 估算',
  'Model Discovery': '模型发现',
  'Quick Start': '快速开始',
  'Setup': '设置',
  'Endpoint And Authentication': '端点与鉴权',
  'When To Use': '适用场景',
  'Overview': '概览',
  'How It Works': '工作机制',
  'Example': '示例',
  'Per-Task Models in Batch': '批处理中的按任务模型',
  'Per-Task Model Selection': '按任务选择模型',
  'Per-Task Model Recommendation': '按任务模型建议',
  'Custom Workflows': '自定义工作流',
  'Prompt Architecture': 'Prompt 架构',
  'Prompt Variables': 'Prompt 变量',
  'Focused Learning Domain': '聚焦学习领域',
  'Current circuitikz Prototype': '当前 circuitikz 原型',
  'Render Target Selection': '渲染目标选择',
  'Editable HTML/SVG': '可编辑 HTML/SVG',
  'Architecture: Spec-First Pipeline': '架构：Spec 优先管线',
  'Supported Diagram Types': '支持的图表类型',
  'Diagram Output': '图表输出',
  'JSON Canvas': 'JSON Canvas',
  'Rendering Chain': '渲染链路',
  'Golden Reference Template': 'Golden Reference 模板',
  'Notemd vs Other Obsidian AI Plugins': 'Notemd 与其他 Obsidian AI 插件对比',
  'Diagram Capability Direction': '图表能力方向',
  'Core Capabilities': '核心能力',
  'Core Features': '核心功能',
  'Common First Tasks': '常见首批任务',
  'Common Providers': '常见 Provider',
  '1. Automatic Wiki-Linking': '1. 自动 Wiki 链接',
  '2. Concept Note Generation': '2. 概念笔记生成',
  '3. Research: Bringing the Web In': '3. 研究：引入网页信息',
  'Research: Bringing the Web In': '研究：引入网页信息',
  'Web Research Integration': '网页研究集成',
  '4. Multilingual Translation': '4. 多语言翻译',
  '5. Diagram Generation': '5. 图表生成',
  '6. One-Click Workflows': '6. 一键工作流',
  'Notemd vs Auto Link': 'Notemd 与 Auto Link 对比',
  'Open Source': '开源',
  'Philosophy': '理念',
  'Features': '功能',
  'Architecture': '架构',
  'System Requirements': '系统要求',
  'Prerequisites': '准备条件',
  'Installation': '安装',
  'Alternative: Install via BRAT': '替代方式：通过 BRAT 安装',
  'Method 1: Community Plugins (Recommended)': '方法 1：社区插件（推荐）',
  'Method 2: Manual Installation': '方法 2：手动安装',
  'Auto-update (Recommended)': '自动更新（推荐）',
  'Manual update': '手动更新',
  'Uninstallation': '卸载',
  'Step 1: Configure Your First LLM Provider (2 min)': '步骤 1：配置第一个 LLM Provider（2 分钟）',
  'Step 2: Try Your First Task (1 min)': '步骤 2：尝试第一个任务（1 分钟）',
  'Step 3: Explore Features (2 min)': '步骤 3：探索功能（2 分钟）',
  'Option A: Cloud Provider (OpenAI, Anthropic, etc.)': '选项 A：云端 Provider（OpenAI、Anthropic 等）',
  'Option B: Local Ollama (No API Key Needed)': '选项 B：本地 Ollama（无需 API Key）',
  'Task 1: Process a Paper/Article': '任务 1：处理论文或文章',
  'Task 2: Translate Notes': '任务 2：翻译笔记',
  'Task 3: Create a Knowledge Map': '任务 3：创建知识图谱',
  'Settings Overview': '设置概览',
  'Configuration Profiles': '配置档案',
  'Recommended Configurations': '推荐配置',
  'Troubleshooting Configuration': '配置故障排查',
  'Research & Web Search': '研究与网页搜索',
  'Translation': '翻译',
  'Wiki-Links': 'Wiki 链接',
  'Concept Notes': '概念笔记',
  'Concept Note Generation': '概念笔记生成',
  'One-Click Workflows': '一键工作流',
  'Workflow Execution Pipeline': '工作流执行管线',
  'Predefined vs. Custom Workflows': '预定义工作流与自定义工作流',
  'Creating Custom Workflows': '创建自定义工作流',
  'Batch Execution Model': '批处理执行模型',
  'Concurrency Control': '并发控制',
  'Provider Categories': 'Provider 分类',
  'Per-Task Model Selection': '按任务选择模型',
  'Endpoint And Authentication': '端点与鉴权',
  'When To Use': '适用场景',
  'Common Errors': '常见错误',
  'Getting Help': '获取帮助',
  'Frequently Asked Questions': '常见问题',
  'What is Notemd?': 'Notemd 是什么？',
  'Who Should Use Notemd?': '谁适合使用 Notemd？',
  'Why Notemd + Obsidian?': '为什么选择 Notemd + Obsidian？',
  'Why AI Knowledge Management?': '为什么需要 AI 知识管理？',
  'Key Difference: Ephemeral vs. Persistent Knowledge': '关键差异：临时对话与持久知识',
  'PDF & Academic Workflows': 'PDF 与学术工作流',
  'Privacy-First (Local Only)': '隐私优先（仅本地）',
  'Open Source & Community': '开源与社区',
}));

const sharedHeadingTranslations = {
  ja: {
    Overview: '概要',
    Configuration: '設定',
    Usage: '使い方',
    Troubleshooting: 'トラブルシューティング',
    'Next Steps': '次のステップ',
    Setup: 'セットアップ',
    Example: '例',
    'How It Works': '仕組み',
    'Model Discovery': 'モデル検出',
    'Endpoint And Authentication': 'エンドポイントと認証',
    'When To Use': '使うべき場面',
    'Getting Started': 'はじめに',
    'Quick Start': 'クイックスタート',
    Installation: 'インストール',
    'Provider Configuration': 'Provider 設定',
    'Task-Specific Models': 'タスク別モデル',
    'Output Configuration': '出力設定',
    'Language Settings': '言語設定',
    'Workflow Configuration': 'ワークフロー設定',
    'Advanced Settings': '高度な設定',
    'Provider Categories': 'Provider の分類',
    'Per-Task Model Selection': 'タスク別モデル選択',
    'API Call Architecture': 'API 呼び出しアーキテクチャ',
    'Transport Layers': 'トランスポート層',
    'Retry Logic': 'リトライロジック',
    'Response Caching': 'レスポンスキャッシュ',
    'Token Estimation': 'トークン見積もり',
    'Current Progress And Next Phases': '現在の進捗と次フェーズ',
    'Golden Reference Prompt Shape': 'Golden Reference プロンプト形状',
  },
  fr: {
    Overview: 'Vue d’ensemble',
    Configuration: 'Configuration',
    Usage: 'Utilisation',
    Troubleshooting: 'Dépannage',
    'Next Steps': 'Étapes suivantes',
    Setup: 'Mise en place',
    Example: 'Exemple',
    'How It Works': 'Fonctionnement',
    'Model Discovery': 'Découverte des modèles',
    'Endpoint And Authentication': 'Point de terminaison et authentification',
    'When To Use': 'Quand l’utiliser',
    'Getting Started': 'Démarrage',
    'Quick Start': 'Démarrage rapide',
    Installation: 'Installation',
    'Provider Configuration': 'Configuration du Provider',
    'Task-Specific Models': 'Modèles par tâche',
    'Output Configuration': 'Configuration de sortie',
    'Language Settings': 'Paramètres de langue',
    'Workflow Configuration': 'Configuration des workflows',
    'Advanced Settings': 'Paramètres avancés',
    'Provider Categories': 'Catégories de Providers',
    'Per-Task Model Selection': 'Sélection de modèle par tâche',
    'API Call Architecture': 'Architecture des appels API',
    'Transport Layers': 'Couches de transport',
    'Retry Logic': 'Logique de nouvelle tentative',
    'Response Caching': 'Cache des réponses',
    'Token Estimation': 'Estimation des tokens',
    'Current Progress And Next Phases': 'Avancement actuel et prochaines phases',
    'Golden Reference Prompt Shape': 'Forme du prompt Golden Reference',
  },
  de: {
    Overview: 'Überblick',
    Configuration: 'Konfiguration',
    Usage: 'Verwendung',
    Troubleshooting: 'Fehlerbehebung',
    'Next Steps': 'Nächste Schritte',
    Setup: 'Einrichtung',
    Example: 'Beispiel',
    'How It Works': 'Funktionsweise',
    'Model Discovery': 'Modellerkennung',
    'Endpoint And Authentication': 'Endpunkt und Authentifizierung',
    'When To Use': 'Wann verwenden',
    'Getting Started': 'Einstieg',
    'Quick Start': 'Schnellstart',
    Installation: 'Installation',
    'Provider Configuration': 'Provider-Konfiguration',
    'Task-Specific Models': 'Aufgabenspezifische Modelle',
    'Output Configuration': 'Ausgabekonfiguration',
    'Language Settings': 'Spracheinstellungen',
    'Workflow Configuration': 'Workflow-Konfiguration',
    'Advanced Settings': 'Erweiterte Einstellungen',
    'Provider Categories': 'Provider-Kategorien',
    'Per-Task Model Selection': 'Modellauswahl pro Aufgabe',
    'API Call Architecture': 'Architektur der API-Aufrufe',
    'Transport Layers': 'Transportschichten',
    'Retry Logic': 'Wiederholungslogik',
    'Response Caching': 'Antwort-Cache',
    'Token Estimation': 'Token-Schätzung',
    'Current Progress And Next Phases': 'Aktueller Fortschritt und nächste Phasen',
    'Golden Reference Prompt Shape': 'Form des Golden-Reference-Prompts',
  },
  es: {
    Overview: 'Visión general',
    Configuration: 'Configuración',
    Usage: 'Uso',
    Troubleshooting: 'Solución de problemas',
    'Next Steps': 'Siguientes pasos',
    Setup: 'Preparación',
    Example: 'Ejemplo',
    'How It Works': 'Cómo funciona',
    'Model Discovery': 'Detección de modelos',
    'Endpoint And Authentication': 'Endpoint y autenticación',
    'When To Use': 'Cuándo usarlo',
    'Getting Started': 'Primeros pasos',
    'Quick Start': 'Inicio rápido',
    Installation: 'Instalación',
    'Provider Configuration': 'Configuración del Provider',
    'Task-Specific Models': 'Modelos por tarea',
    'Output Configuration': 'Configuración de salida',
    'Language Settings': 'Ajustes de idioma',
    'Workflow Configuration': 'Configuración de workflows',
    'Advanced Settings': 'Ajustes avanzados',
    'Provider Categories': 'Categorías de Providers',
    'Per-Task Model Selection': 'Selección de modelo por tarea',
    'API Call Architecture': 'Arquitectura de llamadas API',
    'Transport Layers': 'Capas de transporte',
    'Retry Logic': 'Lógica de reintento',
    'Response Caching': 'Caché de respuestas',
    'Token Estimation': 'Estimación de tokens',
    'Current Progress And Next Phases': 'Progreso actual y próximas fases',
    'Golden Reference Prompt Shape': 'Forma del prompt Golden Reference',
  },
  ko: {
    Overview: '개요',
    Configuration: '설정',
    Usage: '사용 방법',
    Troubleshooting: '문제 해결',
    'Next Steps': '다음 단계',
    Setup: '설정',
    Example: '예시',
    'How It Works': '작동 방식',
    'Model Discovery': '모델 검색',
    'Endpoint And Authentication': '엔드포인트와 인증',
    'When To Use': '사용할 때',
    'Getting Started': '시작하기',
    'Quick Start': '빠른 시작',
    Installation: '설치',
    'Provider Configuration': 'Provider 설정',
    'Task-Specific Models': '작업별 모델',
    'Output Configuration': '출력 설정',
    'Language Settings': '언어 설정',
    'Workflow Configuration': '워크플로 설정',
    'Advanced Settings': '고급 설정',
    'Provider Categories': 'Provider 분류',
    'Per-Task Model Selection': '작업별 모델 선택',
    'API Call Architecture': 'API 호출 아키텍처',
    'Transport Layers': '전송 계층',
    'Retry Logic': '재시도 로직',
    'Response Caching': '응답 캐시',
    'Token Estimation': '토큰 추정',
    'Current Progress And Next Phases': '현재 진행 상황과 다음 단계',
    'Golden Reference Prompt Shape': 'Golden Reference 프롬프트 형태',
  },
};

sharedHeadingTranslations['zh-Hant'] = Object.fromEntries(
  Array.from(zhHeadingReplacements.entries()).map(([english, simplified]) => [
    english,
    simplified
      .replaceAll('笔', '筆')
      .replaceAll('图', '圖')
      .replaceAll('表', '表')
      .replaceAll('与', '與')
      .replaceAll('页', '頁')
      .replaceAll('体', '體')
      .replaceAll('简', '簡')
      .replaceAll('处', '處')
      .replaceAll('发', '發')
      .replaceAll('输', '輸')
      .replaceAll('据', '據')
      .replaceAll('设', '設')
      .replaceAll('鉴', '鑑')
      .replaceAll('权', '權')
      .replaceAll('务', '務')
      .replaceAll('级', '階')
      .replaceAll('错', '錯')
      .replaceAll('导', '導')
      .replaceAll('览', '覽')
      .replaceAll('链', '鏈')
      .replaceAll('开', '開')
      .replaceAll('关', '關')
      .replaceAll('档', '檔')
      .replaceAll('线', '線')
      .replaceAll('径', '徑')
      .replaceAll('议', '議')
      .replaceAll('类', '類')
      .replaceAll('节', '節')
      .replaceAll('术', '術')
      .replaceAll('态', '態')
      .replaceAll('区', '區')
      .replaceAll('复', '複')
      .replaceAll('现', '現')
      .replaceAll('检', '檢')
      .replaceAll('测', '測')
      .replaceAll('问', '問')
      .replaceAll('题', '題')
      .replaceAll('择', '擇')
      .replaceAll('项', '項')
      .replaceAll('译', '譯')
      .replaceAll('单', '單')
      .replaceAll('优', '優')
      .replaceAll('对', '對')
      .replaceAll('应', '應')
      .replaceAll('构', '構')
      .replaceAll('进', '進')
      .replaceAll('阶', '階')
      .replaceAll('后', '後'),
  ]),
);

function ensureDir(dir) {
  fs.mkdirSync(dir, {recursive: true});
}

function listMdxFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listMdxFiles(fullPath);
    }
    return entry.name.endsWith('.mdx') ? [fullPath] : [];
  });
}

function sourcePathFor(filePath) {
  return path.relative(docsRoot, filePath).replace(/\\/g, '/');
}

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    return {frontMatter: '', body: content};
  }
  return {frontMatter: match[1], body: content.slice(match[0].length)};
}

function idFromFrontMatter(frontMatter, fallbackPath) {
  const match = frontMatter.match(/^id:\s*(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  return fallbackPath.replace(/\.mdx$/, '').split('/').pop();
}

function extractHeadings(content) {
  const headings = [];
  let inFence = false;
  for (const line of content.split(/\r?\n/)) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      headings.push({level: match[1].length, text: match[2].replace(/\*\*/g, '').trim()});
    }
  }
  return headings;
}

function fallbackHeadingFor(locale, sourcePath, text) {
  const title = docTitles[sourcePath]?.[locale] || locales[locale].docs;
  const normalized = text.toLowerCase();
  const pick = (values) => values[locale] || values['zh-CN'];
  if (/install|setup|prerequisite|system|update|uninstall|brat/.test(normalized)) {
    return pick({'zh-CN': `${title}：安装与准备`, 'zh-Hant': `${title}：安裝與準備`, ja: `${title}：インストールと準備`, fr: `${title} : installation et préparation`, de: `${title}: Installation und Vorbereitung`, es: `${title}: instalación y preparación`, ko: `${title}: 설치와 준비`});
  }
  if (/config|setting|profile|key|endpoint|authentication|language|output|model|provider|llm|api|token/.test(normalized)) {
    return pick({'zh-CN': `${title}：配置与模型`, 'zh-Hant': `${title}：設定與模型`, ja: `${title}：設定とモデル`, fr: `${title} : configuration et modèles`, de: `${title}: Konfiguration und Modelle`, es: `${title}: configuración y modelos`, ko: `${title}: 설정과 모델`});
  }
  if (/workflow|task|batch|process|pipeline|command|execution|step|method|option|pattern|template/.test(normalized)) {
    return pick({'zh-CN': `${title}：工作流与任务`, 'zh-Hant': `${title}：工作流程與任務`, ja: `${title}：ワークフローとタスク`, fr: `${title} : workflows et tâches`, de: `${title}: Workflows und Aufgaben`, es: `${title}: workflows y tareas`, ko: `${title}: 워크플로와 작업`});
  }
  if (/research|search|tavily|duckduckgo|paper|pdf|academic/.test(normalized)) {
    return pick({'zh-CN': `${title}：研究与检索`, 'zh-Hant': `${title}：研究與檢索`, ja: `${title}：調査と検索`, fr: `${title} : recherche`, de: `${title}: Recherche`, es: `${title}: investigación y búsqueda`, ko: `${title}: 연구와 검색`});
  }
  if (/translate|translation|bilingual|multilingual/.test(normalized)) {
    return pick({'zh-CN': `${title}：翻译与语言`, 'zh-Hant': `${title}：翻譯與語言`, ja: `${title}：翻訳と言語`, fr: `${title} : traduction et langues`, de: `${title}: Übersetzung und Sprache`, es: `${title}: traducción e idioma`, ko: `${title}: 번역과 언어`});
  }
  if (/diagram|render|svg|html|mermaid|tikz|circuit|draw|canvas|vega|visual/.test(normalized)) {
    return pick({'zh-CN': `${title}：图表与渲染`, 'zh-Hant': `${title}：圖表與渲染`, ja: `${title}：図表とレンダリング`, fr: `${title} : diagrammes et rendu`, de: `${title}: Diagramme und Rendering`, es: `${title}: diagramas y renderizado`, ko: `${title}: 다이어그램과 렌더링`});
  }
  if (/troubleshoot|error|invalid|missing|slow|performance|forbidden|help|issue|not found|limit|connection/.test(normalized)) {
    return pick({'zh-CN': `${title}：故障排查`, 'zh-Hant': `${title}：疑難排解`, ja: `${title}：トラブルシューティング`, fr: `${title} : dépannage`, de: `${title}: Fehlerbehebung`, es: `${title}: solución de problemas`, ko: `${title}: 문제 해결`});
  }
  if (/privacy|local|offline|cloud|open source|community|free/.test(normalized)) {
    return pick({'zh-CN': `${title}：边界与治理`, 'zh-Hant': `${title}：邊界與治理`, ja: `${title}：境界と運用`, fr: `${title} : limites et gouvernance`, de: `${title}: Grenzen und Governance`, es: `${title}: límites y gobernanza`, ko: `${title}: 경계와 거버넌스`});
  }
  if (/next|recommend|tip|best practice|checklist|verification/.test(normalized)) {
    return pick({'zh-CN': `${title}：后续建议`, 'zh-Hant': `${title}：後續建議`, ja: `${title}：次の推奨事項`, fr: `${title} : recommandations suivantes`, de: `${title}: nächste Empfehlungen`, es: `${title}: siguientes recomendaciones`, ko: `${title}: 다음 권장 사항`});
  }
  return pick({'zh-CN': `${title}：核心说明`, 'zh-Hant': `${title}：核心說明`, ja: `${title}：主要な説明`, fr: `${title} : explication principale`, de: `${title}: zentrale Erläuterung`, es: `${title}: explicación principal`, ko: `${title}: 핵심 설명`});
}

function containsTranslatableEnglish(text) {
  const stripped = text
    .replace(/`[^`]+`/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\b(Notemd|OpenAI|Anthropic|Google|Gemini|DeepSeek|Ollama|Tavily|DuckDuckGo|Mermaid|Vega-Lite|HTML|SVG|JSON|DSL|API|LLM|CLI|UI|FAQ|PDF|BRAT|TikZJax|circuitikz|Draw\.io|Drawnix|Provider|Providers|Prompt|Prompts)\b/g, '');
  return /[A-Za-z]{3,}/.test(stripped);
}

function translateHeading(text, locale, sourcePath) {
  if (docTitles[sourcePath]?.[locale] && /^# /.test(`# ${text}`) && docTitles[sourcePath].en === text) {
    return docTitles[sourcePath][locale];
  }

  if (locale === 'zh-CN' && zhHeadingReplacements.has(text)) {
    return zhHeadingReplacements.get(text);
  }

  if (sharedHeadingTranslations[locale]?.[text]) {
    return sharedHeadingTranslations[locale][text];
  }

  const numbered = text.match(/^(\d+\.\s+)(.+)$/);
  if (numbered) {
    const translatedTail = translateHeading(numbered[2], locale, sourcePath);
    return `${numbered[1]}${translatedTail}`;
  }

  const title = docTitles[sourcePath]?.[locale];
  const ui = locales[locale];
  const replacements = {
    Overview: ui.overview,
    Configuration: ui.configuration,
    Usage: ui.usage,
    Troubleshooting: ui.troubleshooting,
    'Next Steps': ui.nextSteps,
    Setup: locale === 'zh-CN' ? '设置' : ui.configuration,
    Example: locale === 'zh-CN' ? '示例' : locale === 'ja' ? '例' : locale === 'fr' ? 'Exemple' : locale === 'de' ? 'Beispiel' : locale === 'es' ? 'Ejemplo' : '예시',
    'How It Works': ui.howItWorks,
    'Model Discovery': locale === 'zh-CN' ? '模型发现' : locale === 'ja' ? 'モデル検出' : locale === 'fr' ? 'Découverte des modèles' : locale === 'de' ? 'Modellerkennung' : locale === 'es' ? 'Detección de modelos' : '모델 검색',
    'Endpoint And Authentication': locale === 'zh-CN' ? '端点与鉴权' : locale === 'ja' ? 'エンドポイントと認証' : locale === 'fr' ? 'Point de terminaison et authentification' : locale === 'de' ? 'Endpunkt und Authentifizierung' : locale === 'es' ? 'Endpoint y autenticación' : '엔드포인트와 인증',
    'When To Use': locale === 'zh-CN' ? '适用场景' : locale === 'ja' ? '使うべき場面' : locale === 'fr' ? 'Quand l’utiliser' : locale === 'de' ? 'Wann verwenden' : locale === 'es' ? 'Cuándo usarlo' : '사용할 때',
  };

  let translated = replacements[text] || text;
  if (translated === text && /Provider$/.test(text)) {
    translated = locale === 'zh-CN' ? `${text.replace(/ Provider$/, '')} Provider` : text;
  }
  if (translated === text && title && text.includes(title)) {
    translated = text.replace(title, docTitles[sourcePath][locale]);
  }
  if (translated === text && containsTranslatableEnglish(text)) {
    return fallbackHeadingFor(locale, sourcePath, text);
  }
  return translated;
}

function localizedDescription(locale, sourcePath) {
  const title = docTitles[sourcePath][locale];
  switch (locale) {
    case 'zh-CN':
      return `说明 ${title} 在 Notemd 中的用途、配置、工作流边界与常见排查路径。`;
    case 'zh-Hant':
      return `說明 ${title} 在 Notemd 中的用途、設定、工作流程邊界與常見排查路徑。`;
    case 'ja':
      return `Notemd における ${title} の目的、設定、ワークフロー上の境界、よくある確認点を説明します。`;
    case 'fr':
      return `Explique le rôle de ${title} dans Notemd, sa configuration, ses limites de workflow et les vérifications courantes.`;
    case 'de':
      return `Erläutert Zweck, Konfiguration, Workflow-Grenzen und typische Prüfungen für ${title} in Notemd.`;
    case 'es':
      return `Explica el uso de ${title} en Notemd, su configuración, límites de flujo de trabajo y comprobaciones habituales.`;
    case 'ko':
      return `Notemd에서 ${title}의 목적, 설정, 워크플로 경계와 일반적인 점검 항목을 설명합니다.`;
    default:
      return title;
  }
}

function paragraphFor(locale, sourcePath, heading) {
  const title = docTitles[sourcePath][locale];
  const ui = locales[locale];
  const normalized = heading.toLowerCase();
  if (normalized.includes('troubleshooting') || normalized.includes('error') || normalized.includes('故障')) {
    return {
      'zh-CN': `本节用于定位 ${title} 的常见失败模式。优先查看 Notemd 设置中的诊断输出、Provider 返回的 HTTP 状态、模型名称、网络连通性和是否触发限流。`,
      'zh-Hant': `本節用於定位 ${title} 的常見失敗模式。優先查看 Notemd 設定中的診斷輸出、Provider 回傳的 HTTP 狀態、模型名稱、網路連線與是否觸發限流。`,
      ja: `この節では ${title} の典型的な失敗を切り分けます。Notemd の診断出力、Provider の HTTP ステータス、モデル名、ネットワーク、レート制限を先に確認します。`,
      fr: `Cette section sert à diagnostiquer les échecs courants liés à ${title}. Vérifiez d’abord les diagnostics Notemd, le statut HTTP du Provider, le nom du modèle, le réseau et les limites de débit.`,
      de: `Dieser Abschnitt grenzt typische Fehler bei ${title} ein. Prüfen Sie zuerst Notemd-Diagnosen, HTTP-Status des Providers, Modellnamen, Netzwerk und Rate Limits.`,
      es: `Esta sección ayuda a diagnosticar fallos habituales de ${title}. Revise primero los diagnósticos de Notemd, el estado HTTP del Provider, el nombre del modelo, la red y los límites de tasa.`,
      ko: `이 절은 ${title}의 일반적인 실패 원인을 구분합니다. Notemd 진단 출력, Provider HTTP 상태, 모델 이름, 네트워크, 속도 제한을 먼저 확인하세요.`,
    }[locale];
  }
  if (normalized.includes('configuration') || normalized.includes('setup') || normalized.includes('setting')) {
    return {
      'zh-CN': `${title} 的配置应从 Notemd 设置入口完成。Provider、模型、输出路径、语言和批处理并不是彼此独立的开关；修改前应明确它会影响当前文件、文件夹任务还是一键工作流。`,
      'zh-Hant': `${title} 的設定應從 Notemd 設定入口完成。Provider、模型、輸出路徑、語言與批次處理不是彼此獨立的開關；修改前應確認它影響目前檔案、資料夾任務或一鍵工作流程。`,
      ja: `${title} の設定は Notemd 設定画面から行います。Provider、モデル、出力先、言語、バッチ処理は独立した項目ではなく、現在のファイル、フォルダー処理、ワークフローのどれに影響するかを確認してください。`,
      fr: `La configuration de ${title} se fait dans les paramètres Notemd. Provider, modèle, sortie, langue et traitement par lots interagissent; identifiez si le changement touche le fichier courant, un dossier ou un workflow.`,
      de: `${title} wird in den Notemd-Einstellungen konfiguriert. Provider, Modell, Ausgabepfad, Sprache und Batch-Verarbeitung greifen ineinander; klären Sie, ob die Änderung Datei-, Ordner- oder Workflow-Aufgaben betrifft.`,
      es: `${title} se configura desde los ajustes de Notemd. Provider, modelo, salida, idioma y procesamiento por lotes se relacionan entre sí; confirme si el cambio afecta al archivo actual, carpetas o workflows.`,
      ko: `${title} 설정은 Notemd 설정 화면에서 합니다. Provider, 모델, 출력 경로, 언어, 일괄 처리는 서로 연결되어 있으므로 현재 파일, 폴더 작업, 워크플로 중 어디에 영향을 주는지 확인하세요.`,
    }[locale];
  }
  if (normalized.includes('next')) {
    return {
      'zh-CN': `继续阅读相邻页面时，优先选择与你当前任务链直接相关的主题：Provider 配置、核心功能、批处理、故障排查或图表导出。`,
      'zh-Hant': `繼續閱讀相鄰頁面時，優先選擇與目前任務鏈直接相關的主題：Provider 設定、核心功能、批次處理、疑難排解或圖表匯出。`,
      ja: `次に読むページは、いまの作業に直結する Provider 設定、主要機能、バッチ処理、トラブルシューティング、図表出力から選んでください。`,
      fr: `Pour continuer, choisissez la page qui correspond directement à votre chaîne de travail: Provider, fonction principale, traitement par lots, dépannage ou export de diagrammes.`,
      de: `Wählen Sie als Nächstes die Seite, die direkt zu Ihrer Aufgabe passt: Provider-Konfiguration, Kernfunktion, Batch-Verarbeitung, Fehlerbehebung oder Diagrammexport.`,
      es: `Para continuar, elija la página que corresponda a su cadena de trabajo: Provider, función principal, procesamiento por lotes, solución de problemas o exportación de diagramas.`,
      ko: `다음에는 현재 작업 흐름과 직접 연결된 Provider 설정, 핵심 기능, 일괄 처리, 문제 해결, 다이어그램 내보내기 문서를 우선 보세요.`,
    }[locale];
  }
  return {
    'zh-CN': `${title} 的这一部分解释产品行为、使用入口和工程边界。请把界面按钮、命令名称、配置键和文件扩展名视为稳定契约，文案翻译不会改变真实运行时名称。`,
    'zh-Hant': `${title} 的這一部分說明產品行為、使用入口與工程邊界。介面按鈕、命令名稱、設定鍵與檔案副檔名是穩定契約，翻譯不會改變實際執行名稱。`,
    ja: `${title} のこの部分では、製品の挙動、利用入口、実装上の境界を説明します。UI ボタン、コマンド名、設定キー、拡張子は安定した契約として扱います。`,
    fr: `Cette partie de ${title} décrit le comportement produit, les points d’entrée et les limites d’implémentation. Les boutons, commandes, clés et extensions restent des contrats stables.`,
    de: `Dieser Teil von ${title} beschreibt Produktverhalten, Einstiegspunkte und technische Grenzen. UI-Schaltflächen, Befehle, Schlüssel und Dateiendungen sind stabile Verträge.`,
    es: `Esta parte de ${title} describe el comportamiento del producto, puntos de entrada y límites técnicos. Botones, comandos, claves y extensiones son contratos estables.`,
    ko: `${title}의 이 부분은 제품 동작, 사용 진입점, 엔지니어링 경계를 설명합니다. UI 버튼, 명령 이름, 설정 키, 확장자는 안정적인 계약으로 봅니다.`,
  }[locale];
}

function localizedDoc(sourcePath, sourceContent, locale) {
  const {frontMatter} = parseFrontMatter(sourceContent);
  const id = idFromFrontMatter(frontMatter, sourcePath);
  const title = docTitles[sourcePath][locale];
  const description = localizedDescription(locale, sourcePath);
  const headings = extractHeadings(sourceContent).filter((heading, index) => index > 0 || heading.level !== 1);
  const ui = locales[locale];
  const lines = [
    '---',
    `id: ${id}`,
    `title: ${title}`,
    `description: ${description}`,
    "author:",
    "  '@id': 'https://jacobinwwey.github.io/obsidian-NotEMD/#person-jacobinwwey'",
    '---',
    '',
    "import TLDR from '@site/src/components/TLDR';",
    '',
    `# ${title}`,
    '',
    '<TLDR>',
    `**${ui.tldrPrefix}：** ${description} ${ui.reserved}`,
    '</TLDR>',
    '',
  ];

  for (const heading of headings) {
    const translated = translateHeading(heading.text, locale, sourcePath);
    lines.push(`${'#'.repeat(heading.level)} ${translated}`);
    lines.push('');
    lines.push(paragraphFor(locale, sourcePath, heading.text));
    lines.push('');
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}`;
}

function patchZhCnExistingDocs() {
  const currentRoot = path.join(i18nRoot, 'zh-CN', 'docusaurus-plugin-content-docs', 'current');
  for (const filePath of listMdxFiles(currentRoot)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const sourcePath = path.relative(currentRoot, filePath).replace(/\\/g, '/');
    const sourceFile = path.join(docsRoot, sourcePath);
    const sourceHeadings = fs.existsSync(sourceFile)
      ? extractHeadings(fs.readFileSync(sourceFile, 'utf8'))
      : [];
    for (const [english, chinese] of zhHeadingReplacements) {
      content = content.replace(new RegExp(`(^#{1,4} )${escapeRegExp(english)}$`, 'gm'), `$1${chinese}`);
      content = content.replace(new RegExp(`(^title: )${escapeRegExp(english)}$`, 'gm'), `$1${chinese}`);
    }
    let headingIndex = 0;
    content = content.replace(/^(#{1,4})\s+(.+)$/gm, (line, hashes) => {
      const sourceHeading = sourceHeadings[headingIndex];
      headingIndex += 1;
      if (hashes === '#' && docTitles[sourcePath]?.['zh-CN']) {
        return `${hashes} ${docTitles[sourcePath]['zh-CN']}`;
      }
      if (sourceHeading) {
        return `${hashes} ${translateHeading(sourceHeading.text, 'zh-CN', sourcePath)}`;
      }
      return line;
    });
    if (docTitles[sourcePath]?.['zh-CN']) {
      content = content.replace(/^title:\s*.+$/m, `title: ${docTitles[sourcePath]['zh-CN']}`);
    }
    content = content
      .replace('## Getting Started', '## 入门')
      .replace('## Troubleshooting', '## 故障排查')
      .replace('### Research & Summarize', '### 研究并总结')
      .replace('## Quick Start', '## 快速开始')
      .replace('title: LLM Providers', 'title: LLM 提供商')
      .replace('# LLM Providers', '# LLM 提供商');
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeTranslationJson(locale) {
  const ui = locales[locale];
  writeJson(path.join(i18nRoot, locale, 'docusaurus-plugin-content-docs', 'current.json'), {
    'version.label': {
      message: ui.next,
      description: 'The label for version current',
    },
    'sidebar.tutorialSidebar.category.Getting Started': {
      message: ui.gettingStarted,
      description: "The label for category 'Getting Started' in sidebar 'tutorialSidebar'",
    },
    'sidebar.tutorialSidebar.category.Core Features': {
      message: ui.coreFeatures,
      description: "The label for category 'Core Features' in sidebar 'tutorialSidebar'",
    },
    'sidebar.tutorialSidebar.category.LLM Providers': {
      message: ui.providers,
      description: "The label for category 'LLM Providers' in sidebar 'tutorialSidebar'",
    },
    'sidebar.tutorialSidebar.category.Advanced': {
      message: ui.advanced,
      description: "The label for category 'Advanced' in sidebar 'tutorialSidebar'",
    },
  });

  writeJson(path.join(i18nRoot, locale, 'docusaurus-theme-classic', 'navbar.json'), {
    title: {message: 'Notemd', description: 'The title in the navbar'},
    'logo.alt': {message: ui.logoAlt, description: 'The alt text of navbar logo'},
    'item.label.Docs': {message: ui.docs, description: 'Navbar item with label Docs'},
    'item.label.FAQ': {message: ui.faq, description: 'Navbar item with label FAQ'},
    'item.label.GitHub': {message: 'GitHub', description: 'Navbar item with label GitHub'},
  });

  writeJson(path.join(i18nRoot, locale, 'docusaurus-theme-classic', 'footer.json'), {
    'link.title.Docs': {message: ui.docs, description: 'The title of the footer links column with title=Docs in the footer'},
    'link.title.Community': {message: ui.community, description: 'The title of the footer links column with title=Community in the footer'},
    'link.title.More': {message: ui.more, description: 'The title of the footer links column with title=More in the footer'},
    'link.item.label.Getting Started': {message: ui.gettingStarted, description: 'The label of footer link with label=Getting Started linking to /docs/intro'},
    'link.item.label.FAQ': {message: ui.faq, description: 'The label of footer link with label=FAQ linking to /docs/faq'},
    'link.item.label.Discord': {message: 'Discord', description: 'The label of footer link with label=Discord linking to https://discord.gg/qnGgsQ9W'},
    'link.item.label.GitHub Discussions': {message: 'GitHub Discussions', description: 'The label of footer link with label=GitHub Discussions linking to https://github.com/Jacobinwwey/obsidian-NotEMD/discussions'},
    'link.item.label.GitHub': {message: 'GitHub', description: 'The label of footer link with label=GitHub linking to https://github.com/Jacobinwwey/obsidian-NotEMD'},
    'link.item.label.Sponsor': {message: ui.sponsor, description: 'The label of footer link with label=Sponsor linking to https://github.com/sponsors/Jacobinwwey'},
    copyright: {
      message: `Copyright © 2026 Notemd. ${ui.built} | <a href="https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/LICENSE">${ui.license}</a>`,
      description: 'The footer copyright',
    },
  });
}

function codeJsonFor(locale) {
  const values = {
    'zh-Hant': {
      edit: '編輯此頁',
      lastUpdated: '最後更新於',
      next: '下一頁',
      previous: '上一頁',
      search: '搜尋',
      noResults: '找不到結果',
      seeAll: '查看全部結果',
      toc: '本頁目錄',
      skip: '跳到主要內容',
      breadcrumbs: '麵包屑導覽',
      docsSidebar: '文件側邊欄',
      mainNav: '主導覽',
      backToTop: '回到頂部',
      copy: '複製',
      copied: '已複製',
      copyAria: '複製程式碼到剪貼簿',
      notFoundTitle: '找不到頁面',
      notFoundBody: '找不到你要查看的頁面。',
      language: '語言',
      colorToggle: '切換深色/淺色模式',
      close: '關閉',
      expand: '展開側邊欄',
      collapse: '收合側邊欄',
    },
    ja: {
      edit: 'このページを編集',
      lastUpdated: '最終更新',
      next: '次のページ',
      previous: '前のページ',
      search: '検索',
      noResults: '結果が見つかりません',
      seeAll: 'すべての結果を見る',
      toc: 'このページの目次',
      skip: 'メインコンテンツへ移動',
      breadcrumbs: 'パンくずナビゲーション',
      docsSidebar: 'ドキュメントサイドバー',
      mainNav: 'メインナビゲーション',
      backToTop: 'トップへ戻る',
      copy: 'コピー',
      copied: 'コピーしました',
      copyAria: 'コードをクリップボードにコピー',
      notFoundTitle: 'ページが見つかりません',
      notFoundBody: 'お探しのページは見つかりませんでした。',
      language: '言語',
      colorToggle: 'ダーク/ライトモードを切り替え',
      close: '閉じる',
      expand: 'サイドバーを展開',
      collapse: 'サイドバーを折りたたむ',
    },
    fr: {
      edit: 'Modifier cette page',
      lastUpdated: 'Dernière mise à jour',
      next: 'Page suivante',
      previous: 'Page précédente',
      search: 'Rechercher',
      noResults: 'Aucun résultat trouvé',
      seeAll: 'Voir tous les résultats',
      toc: 'Sommaire',
      skip: 'Aller au contenu principal',
      breadcrumbs: 'Fil d’Ariane',
      docsSidebar: 'Barre latérale de la documentation',
      mainNav: 'Navigation principale',
      backToTop: 'Retour en haut',
      copy: 'Copier',
      copied: 'Copié',
      copyAria: 'Copier le code dans le presse-papiers',
      notFoundTitle: 'Page introuvable',
      notFoundBody: 'Nous ne trouvons pas la page demandée.',
      language: 'Langue',
      colorToggle: 'Basculer entre mode sombre et clair',
      close: 'Fermer',
      expand: 'Développer la barre latérale',
      collapse: 'Réduire la barre latérale',
    },
    de: {
      edit: 'Diese Seite bearbeiten',
      lastUpdated: 'Zuletzt aktualisiert',
      next: 'Nächste Seite',
      previous: 'Vorherige Seite',
      search: 'Suchen',
      noResults: 'Keine Ergebnisse gefunden',
      seeAll: 'Alle Ergebnisse anzeigen',
      toc: 'Inhaltsverzeichnis',
      skip: 'Zum Hauptinhalt springen',
      breadcrumbs: 'Breadcrumb-Navigation',
      docsSidebar: 'Dokumentations-Seitenleiste',
      mainNav: 'Hauptnavigation',
      backToTop: 'Zurück nach oben',
      copy: 'Kopieren',
      copied: 'Kopiert',
      copyAria: 'Code in die Zwischenablage kopieren',
      notFoundTitle: 'Seite nicht gefunden',
      notFoundBody: 'Die gesuchte Seite konnte nicht gefunden werden.',
      language: 'Sprache',
      colorToggle: 'Zwischen dunklem und hellem Modus wechseln',
      close: 'Schließen',
      expand: 'Seitenleiste erweitern',
      collapse: 'Seitenleiste einklappen',
    },
    es: {
      edit: 'Editar esta página',
      lastUpdated: 'Última actualización',
      next: 'Página siguiente',
      previous: 'Página anterior',
      search: 'Buscar',
      noResults: 'No se encontraron resultados',
      seeAll: 'Ver todos los resultados',
      toc: 'En esta página',
      skip: 'Ir al contenido principal',
      breadcrumbs: 'Navegación de migas de pan',
      docsSidebar: 'Barra lateral de documentación',
      mainNav: 'Navegación principal',
      backToTop: 'Volver arriba',
      copy: 'Copiar',
      copied: 'Copiado',
      copyAria: 'Copiar código al portapapeles',
      notFoundTitle: 'Página no encontrada',
      notFoundBody: 'No pudimos encontrar la página que buscas.',
      language: 'Idioma',
      colorToggle: 'Cambiar entre modo oscuro y claro',
      close: 'Cerrar',
      expand: 'Expandir barra lateral',
      collapse: 'Contraer barra lateral',
    },
    ko: {
      edit: '이 페이지 편집',
      lastUpdated: '마지막 업데이트',
      next: '다음 페이지',
      previous: '이전 페이지',
      search: '검색',
      noResults: '결과를 찾을 수 없습니다',
      seeAll: '모든 결과 보기',
      toc: '이 페이지의 목차',
      skip: '주요 콘텐츠로 이동',
      breadcrumbs: '이동 경로',
      docsSidebar: '문서 사이드바',
      mainNav: '기본 탐색',
      backToTop: '맨 위로',
      copy: '복사',
      copied: '복사됨',
      copyAria: '코드를 클립보드에 복사',
      notFoundTitle: '페이지를 찾을 수 없습니다',
      notFoundBody: '찾고 있는 페이지를 찾을 수 없습니다.',
      language: '언어',
      colorToggle: '어두운/밝은 모드 전환',
      close: '닫기',
      expand: '사이드바 펼치기',
      collapse: '사이드바 접기',
    },
  }[locale];

  if (!values) {
    return undefined;
  }

  return {
    'theme.colorToggle.ariaLabel': {message: values.colorToggle, description: 'The ARIA label for the color mode toggle'},
    'theme.common.editThisPage': {message: values.edit, description: 'The link label to edit the current page'},
    'theme.common.lastUpdatedAt': {message: values.lastUpdated},
    'theme.docs.breadcrumbs.navAriaLabel': {message: values.breadcrumbs, description: 'The ARIA label for the breadcrumbs'},
    'theme.docs.paginator.navAriaLabel': {message: values.docsSidebar, description: 'The ARIA label for the docs pagination'},
    'theme.docs.paginator.next': {message: values.next, description: 'The label used to navigate to the next doc'},
    'theme.docs.paginator.previous': {message: values.previous, description: 'The label used to navigate to the previous doc'},
    'theme.docs.sidebar.closeSidebarButtonAriaLabel': {message: values.close, description: 'The ARIA label for close button of mobile sidebar'},
    'theme.docs.sidebar.collapseButtonTitle': {message: values.collapse, description: 'The title attribute for collapse button of doc sidebar'},
    'theme.docs.sidebar.expandButtonTitle': {message: values.expand, description: 'The ARIA label and title attribute for expand button of doc sidebar'},
    'theme.NotFound.p1': {message: values.notFoundBody, description: 'The first paragraph of the 404 page'},
    'theme.NotFound.title': {message: values.notFoundTitle, description: 'The title of the 404 page'},
    'theme.SearchBar.label': {message: values.search},
    'theme.SearchBar.noResultsText': {message: values.noResults},
    'theme.SearchBar.seeAll': {message: values.seeAll},
    'theme.TOCCollapsible.toggleButtonLabel': {message: values.toc, description: 'The label used by the button on the collapsible TOC component'},
    'theme.navbar.mobileLanguageDropdown.label': {message: values.language, description: 'The label for the mobile language switcher dropdown'},
    'theme.BackToTopButton.buttonAriaLabel': {message: values.backToTop, description: 'The ARIA label for the back to top button'},
    'theme.IconExternalLink.ariaLabel': {message: '(opens in new tab)', description: 'The ARIA label for the external link icon'},
    'theme.NavBar.navAriaLabel': {message: values.mainNav, description: 'The ARIA label for the main navigation'},
    'theme.CodeBlock.copy': {message: values.copy, description: 'The copy button label on code blocks'},
    'theme.CodeBlock.copied': {message: values.copied, description: 'The copied button label on code blocks'},
    'theme.CodeBlock.copyButtonAriaLabel': {message: values.copyAria, description: 'The ARIA label for copy code blocks button'},
    'theme.docs.breadcrumbs.home': {message: locales[locale].docs, description: 'The ARIA label for the home page in the breadcrumbs'},
    'theme.docs.sidebar.navAriaLabel': {message: values.docsSidebar, description: 'The ARIA label for the sidebar navigation'},
    'theme.docs.sidebar.toggleSidebarButtonAriaLabel': {message: values.expand, description: 'The ARIA label for hamburger menu button of mobile navigation'},
    'theme.common.skipToMainContent': {message: values.skip, description: 'The skip to content label used for accessibility'},
  };
}

function writeCodeJson(locale) {
  if (locale === 'zh-CN') {
    return;
  }
  const codeJson = codeJsonFor(locale);
  if (codeJson) {
    writeJson(path.join(i18nRoot, locale, 'code.json'), codeJson);
  }
}

function generateDocs() {
  const sourceFiles = listMdxFiles(docsRoot);
  for (const [locale] of Object.entries(locales)) {
    const targetRoot = path.join(i18nRoot, locale, 'docusaurus-plugin-content-docs', 'current');
    ensureDir(targetRoot);
    for (const sourceFile of sourceFiles) {
      const sourcePath = sourcePathFor(sourceFile);
      const targetFile = path.join(targetRoot, sourcePath);
      const exists = fs.existsSync(targetFile);
      if (locale === 'zh-CN' && exists) {
        continue;
      }
      ensureDir(path.dirname(targetFile));
      const content = fs.readFileSync(sourceFile, 'utf8');
      fs.writeFileSync(targetFile, localizedDoc(sourcePath, content, locale), 'utf8');
    }
    writeTranslationJson(locale);
    writeCodeJson(locale);
  }
  patchZhCnExistingDocs();
}

generateDocs();
