# Notemd Obsidian 插件

[English](./README.md) | [简体中文](./README_zh.md)

```
=============================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
=============================================
      AI驱动的多语言知识增强工具
=============================================
```

一个创建您自己知识库的简单方法！

Notemd 通过与各种大型语言模型 (LLM) 集成来增强您的 Obsidian 工作流程，支持多语言笔记处理，自动为关键概念生成维基链接、创建相应的概念笔记、执行网页搜索与摘要、翻译内容等，助力构建强大的知识图谱。

**版本:** 1.3.2

![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />

## 目录
- [功能特性](#功能特性)
- [安装](#安装)
- [配置](#配置)
- [使用指南](#使用指南)
- [支持的LLM提供商](#支持的llm提供商)
- [故障排除](#故障排除)
- [贡献](#贡献)
- [许可证](#许可证)

## 功能特性

### AI驱动的文档处理
- **多LLM支持**: 兼容多种云端及本地LLM提供商（详见[支持的LLM提供商]）。
- **智能分块**: 按字数自动将大文档拆分为可处理小块。
- **内容格式保留**: 在增加结构和链接的同时尽力保持原文格式。
- **进度跟踪**: 侧边栏或弹窗实时显示处理进度。
- **可取消操作**: 所有由侧边栏或命令面板发起的处理任务均可随时取消。
- **多模型配置**: 不同任务（添加链接、研究、生成标题、翻译）可灵活指定不同的LLM服务商和模型，也可统一使用单一服务商。
- **稳定API调用（重试机制）**: 支持为API调用失败自动重试，重试间隔和最大次数可配置。

### 知识图谱增强
- **自动维基链接**: 基于LLM结果为笔记核心概念添加 `[[维基链接]]`。
- **概念笔记自动创建**: 可选项，自动为新发现概念在指定文件夹中生成新笔记。
- **自定义输出路径与文件名**: 支持为处理结果与概念笔记单独设置存储路径、文件名后缀或直接覆盖原文件。
- **链接完整性维护**: 对笔记重命名/删除自动维护相关链接。

### 翻译

- **AI驱动的翻译**:
    - 使用LLM翻译笔记内容，支持多语言互译。
    - 目标语言可在设置或命令时灵活选择。
    - 翻译结果自动在原文右侧新窗格展示，方便对照阅读。

### 网络研究与内容生成
- **网页研究与摘要**:
    - 支持Tavily（需API Key）与DuckDuckGo（实验性）两种网络搜索服务。
    - 自动用LLM总结搜索结果，并附加到当前笔记。
    - 可配置用于研究的最大内容长度。
- **根据标题生成内容**:
    - 利用笔记标题通过LLM生成内容并替换原有文本。
    - 可选在生成前自动执行网页研究，丰富生成上下文。
- **批量根据标题生成内容**:
    - 一键批量处理选定文件夹下所有笔记，自动跳过已处理文件。
    - 可配置“完成”子文件夹名称，避免重复处理。

### 实用功能
- **重复检测**: 检查当前处理内容中的重复词（结果输出到控制台）。
- **检查并删除重复概念笔记**: 综合文件名（精确/复数/规范化/包含关系）检测概念笔记文件夹内外潜在重复项，支持自定义检测范围，操作前会详细列出并需手动确认。
- **批量Mermaid修复**: 对选定文件夹内所有Markdown文件应用Mermaid和LaTeX语法校正。
- **LLM连接测试**: 一键检测所有配置LLM服务商的API连接状态。

## 安装

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### 通过Obsidian市场（推荐）
1. 打开Obsidian **设置** → **社区插件**。
2. 确认“受限模式”已关闭。
3. 点击“浏览”社区插件，搜索“Notemd”。
4. 点击“安装”。
5. 安装后点击“启用”。

### 手动安装
1. 从 [GitHub发布页](https://github.com/Jacobinwwey/obsidian-NotEMD/releases) 下载最新发布的 `main.js`, `styles.css`, `manifest.json`。
2. 进入 `<您的保险库>/.obsidian/plugins/` 目录。
3. 新建 `notemd` 文件夹，将上述文件拷贝至此。
4. 重启Obsidian。
5. 在“社区插件”中启用Notemd插件。

## 配置

进入设置：**设置** → **社区插件** → **Notemd**（齿轮图标）。

### LLM服务商配置
1. **激活服务商**：下拉选择想要使用的服务商。
2. **服务商设置**：
    * **API Key**: 云端大多需要（如OpenAI、Anthropic、DeepSeek、Google、Mistral、Azure、OpenRouter），本地Ollama不需要，LMStudio一般留空或用`EMPTY`。
    * **Base URL/Endpoint**: API地址。大多自带默认值，本地或部分服务商（如OpenRouter、Azure）需手动填写。
    * **模型**: 填写具体模型名/ID（如`gpt-4o`、`claude-3-5-sonnet-20240620`、`google/gemini-flash-1.5`等）。
    * **温度**: 控制生成内容的随机性，结构化任务建议0.2-0.5。
    * **API版本（仅Azure）**: Azure OpenAI需填写该项（如`2024-02-15-preview`）。
3. **测试连接**：点击“测试连接”验证当前设置是否可用（Notemd: Test LLM Connection）。
4. **导入/导出服务商配置**：一键备份/恢复服务商账号信息。

<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### 多模型配置
- **为不同任务指定不同LLM**：可分别为“添加链接”、“研究与摘要”、“生成标题”、“翻译”指定不同服务商或模型，未填写则继承全局设置。

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### 稳定API调用设置
- **启用自动重试**：API调用失败时自动重试，重试间隔（秒）和最大次数均可自定义。

<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### 常规设置

#### 处理文件输出
- **自定义保存路径/文件名后缀**：可自定义处理结果保存位置、文件名（Notemd: Process Current File, Notemd: Process Folder），留空则覆盖原文件。
- **添加链接时删除代码围栏**：可选，默认保留，仅删除 \`\`\`markdown。

<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### 概念笔记输出
- **自定义概念笔记目录**：可选，指定生成概念笔记的文件夹路径。

<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### 概念日志文件输出
- **生成概念日志文件**：自动记录每次处理新生成的概念笔记，可配置保存路径和文件名。

<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### 处理参数
- **分块字数**：单次调用LLM的最大分块长度（默认3000）。
- **启用重复检测**：处理内容时检测并输出重复词（默认开启）。
- **最大tokens数**：LLM单次回复的最大长度（默认4096）。

<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### 翻译
- **目标语言**：可选默认目标语言，命令时可覆盖。
- **翻译文件保存路径/后缀**：自定义翻译结果的保存路径和文件名后缀（Notemd: Translate Note/Selection）。

<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### 内容生成
- **启用标题内容生成时的研究**：生成内容前可自动网页研究并加入上下文。
- **输出语言**：支持多语言输出。
- **自定义提示词**：自定义每个任务的提示词。
- **自定义完成文件夹名**：成功处理文件将自动移动到自定义“完成”文件夹（Notemd: Batch Generate Content from Titles）。

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### 重复检查范围
- **检测范围模式**：可对整个保险库、指定文件夹、排除文件夹或仅文件夹内进行概念笔记重复检测。

## 使用指南

### 原始处理（添加维基链接）

**注意：** 仅支持 `.md` 或 `.txt` 文件。PDF可用 [Mineru](https://github.com/opendatalab/MinerU) 转换为MD后再处理。

1.  **侧边栏操作**：
    *   打开 Notemd 侧边栏（魔杖图标/命令面板）。
    *   打开目标`.md`或`.txt`文件。
    *   点击“处理文件（添加链接）”(Notemd: Process Current File)。
    *   文件夹处理：点击“处理文件夹（添加链接）”(Notemd: Process Folder)，选择文件夹并点击“处理”。
    *   进度实时显示，可随时取消任务（侧边栏按钮）。
    *   *批量处理文件在后台执行，不会打开编辑器。*

2.  **命令面板操作**（`Ctrl+P` 或 `Cmd+P`）：
    *   单文件：打开后运行 `Notemd: 处理当前文件 (Notemd: Process Current File)`。
    *   文件夹：运行 `Notemd: 处理文件夹 (Notemd: Process Folder)`，选择目标文件夹。批量处理不打开编辑器。
    *   进度弹窗可随时取消。
    *   *插件自动移除内容开头`\boxed{`和结尾`}（如有）再保存。*

### 新功能（翻译、网络研究与内容生成）

1.  **翻译笔记/选区**：
    *   选中文本可仅翻译选区，无选区则翻译全文。
    *   运行 `Notemd: 翻译笔记/选区 (Notemd: Translate Note/Selection)`。
    *   弹窗可确认/修改目标语言（默认使用设置）。
    *   翻译内容保存到指定路径并在原文右侧新窗格打开。
    *   任务可随时取消。

2.  **研究与摘要主题**：
    *   选中文本或用笔记标题作为搜索主题。
    *   运行 `Notemd: 研究和摘要主题 (Notemd: Research and Summarize Topic)`。
    *   配置的搜索服务与LLM自动协作，结果附加到当前笔记。
    *   任务可随时取消。
    *   *DuckDuckGo 可能因反爬机制失败，推荐Tavily。*

3.  **从标题生成内容**：
    *   打开任意笔记（可为空）。
    *   运行 `Notemd: 从标题生成内容 (Notemd: Generate Content from Title)`。
    *   LLM根据标题生成内容并替换原文。
    *   可选先自动研究，丰富上下文。
    *   任务可随时取消。

4.  **批量从标题生成内容**：
    *   运行 `Notemd: 从标题批量生成内容 (Notemd: Batch Generate Content from Titles)`。
    *   选择要处理的文件夹，自动跳过已完成文件。
    *   成功处理的文件自动移动到指定“完成”子文件夹。
    *   任务可随时取消。

### 实用工具

1.  **检查重复项**：
    *   打开目标`.md`或`.txt`文件。
    *   运行 `Notemd: 检查当前文件中的重复项 (Notemd: Check for Duplicates in Current File)`。
    *   结果输出到开发者控制台和通知栏/侧边栏。

2.  **测试LLM连接**：
    *   运行 `Notemd: 测试LLM连接 (Notemd: Test LLM Connection)`。
    *   验证当前激活服务商的API设置，结果显示在通知栏和侧边栏。

3.  **批量Mermaid修复**：
    *   运行 `Notemd: 批量修复Mermaid语法 (Notemd: Batch Fix Mermaid Syntax)`。
    *   选择Markdown文件夹，自动逐个修复语法并保存。
    *   包括Mermaid块结构调整、去除多余括号、LaTeX分隔符规范化等。

4.  **检查并删除重复概念笔记**：
    *   配置好概念笔记文件夹后运行该命令。
    *   运行 `Notemd: 检查并删除重复概念笔记 (Notemd: Check and Remove Duplicate Concept Notes)`。
    *   自动检测并提示所有潜在重复项，需手动确认删除。
    *   进度与结果显示在侧边栏/通知栏。

## 支持的LLM提供商

| 提供商       | 类型  | 需要API密钥 | 说明                                                 |
|--------------|-------|-------------|------------------------------------------------------|
| DeepSeek     | 云    | 是          |                                                      |
| OpenAI       | 云    | 是          | 支持GPT-4o、GPT-3.5等模型                            |
| Anthropic    | 云    | 是          | 支持Claude系列                                        |
| Google       | 云    | 是          | 支持Gemini系列                                        |
| Mistral      | 云    | 是          | 支持Mistral系列                                       |
| Azure OpenAI | 云    | 是          | 需填写Endpoint、API Key和API Version                 |
| OpenRouter   | 云    | 是          | 通过OpenRouter API访问多种模型                       |
| LMStudio     | 本地  | 否（用EMPTY）| LM Studio服务器本地运行模型                           |
| Ollama       | 本地  | 否          | Ollama服务器本地运行模型                              |

*本地服务商请确保服务器已启动且Base URL配置正确。*
*OpenRouter请使用完整模型ID（如`google/gemini-flash-1.5`）。*

## 故障排除

### 常见问题
- **插件未加载**：确保`manifest.json`、`main.js`、`styles.css`均放置在 `<保险库>/.obsidian/plugins/notemd/` 并重启Obsidian。启动异常可通过开发者控制台查看。
- **处理失败/API错误**：
    1. 文件必须为`.md`或`.txt`格式；
    2. “测试LLM连接”命令可验证API设置（Notemd: Test LLM Connection）；
    3. 检查API Key、Base URL、模型名等参数是否填写正确；
    4. 本地模型需确保服务端已启动，Base URL无误；
    5. 云端服务需保证网络连接正常；
    6. 单文件处理失败可查看开发者控制台详细信息；
    7. 批量处理失败可查看保险库根目录的`error_processing_filename.log`日志。
- **LM Studio连接失败**：确认LM Studio服务器已启动, 并加载了正确模型。
- **文件夹创建失败**：请确保设置中保存路径为相对路径，且不包含无效字符（如\* " \ / < > : | ? # ^ [ ] 等）。
- **性能问题**：大文件或批量处理可适当调低分块字数，或更换LLM模型。
- **链接质量问题**：可尝试不同模型或温度设置改善效果。

## 贡献

欢迎任何形式的贡献！请参考GitHub项目说明: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## 许可证

MIT许可证 - 详情请见[LICENSE](LICENSE)。

---

*Notemd v1.3.2 - 用AI提升你的Obsidian知识图谱。*
