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

Notemd 通过与各种大型语言模型 (LLM) 集成来增强您的 Obsidian 工作流程，支持多语言笔记处理，自动为关键概念生成维基链接、创建相应的概念笔记、执行网页搜索与摘要、翻译内容、总结为Mermaid脑图等，助力构建强大的知识图谱。

**版本:** 1.6.0

![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/1d97ca0d-2ea6-41a4-accc-be3be9590088" />


## 目录
- [快速入门](#快速入门)
- [功能特性](#功能特性)
- [安装](#安装)
- [配置](#配置)
- [使用指南](#使用指南)
- [支持的LLM提供商](#支持的llm提供商)
- [故障排除](#故障排除)
- [贡献](#贡献)
- [许可证](#许可证)
  
## 快速入门

1.  **安装与启用**：从 Obsidian 市场获取插件。
2.  **配置 LLM**：进入 `设置 -> Notemd`，选择您的 LLM 提供商（如 OpenAI 或本地提供商如 Ollama），并输入 API 密钥/URL。
3.  **打开侧边栏**：点击左侧工具栏中的 Notemd 魔法棒图标以打开侧边栏。
4.  **处理笔记**：打开任意笔记，在侧边栏中点击 **“处理文件 (添加链接)”**，即可自动为关键概念添加 `[[wiki-links]]` 链接。

完成！探索更多设置以解锁网页搜索、翻译和内容生成等功能。

## 功能特性

### AI驱动的文档处理
- **多 LLM 支持**: 连接到各种云和本地 LLM 提供商 (参见 [支持的 LLM 提供商](about:blank#支持的-llm-提供商-1))。
- **智能分块**: 根据字数自动将大型文档分割成易于管理的小块进行处理。
- **内容保留**: 在添加结构和链接的同时，旨在保持原始内容格式。
- **进度跟踪**: 通过 Notemd 侧边栏或进度模式进行实时更新。
- **可取消操作**: 可以通过侧边栏的专用取消按钮取消任何处理任务（单个或批量）。命令面板操作使用模式窗口，也可以取消。
- **多模型配置**: 为不同任务（添加链接、研究、生成标题）使用不同的 LLM 提供商*和*特定模型，或为所有任务使用单一提供商。
- **稳定的 API 调用（重试逻辑）**: 可选择为失败的 LLM API 调用启用自动重试，并可配置重试间隔和尝试次数限制。
- **可靠的批处理**: 改进了并发处理逻辑，通过**交错的API调用**来防止速率限制错误，确保在大型批处理作业中性能稳定。新的实现确保任务在不同时间间隔启动，而不是同时启动。
- **准确的进度报告**: 修复了进度条可能卡住的错误，确保用户界面始终反映操作的真实状态。
- **健壮的并行批处理**: 解决了并行批处理操作过早停止的问题，确保所有文件都能可靠高效地处理。
- **进度条准确性**: 修复了“创建维基链接并生成笔记”命令进度条卡在95%的错误，确保现在能正确显示100%完成。

### 知识图谱增强
- **自动维基链接**: 根据 LLM 输出，识别您处理过的笔记中的核心概念并添加 `[[维基链接]]`。
- **概念笔记创建（可选和可定制）**: 在指定的 vault 文件夹中自动为发现的概念创建新笔记。
- **可定制的输出路径**: 在您的 vault 中为保存处理过的文件和新创建的概念笔记配置单独的相对路径。
- **可定制的输出文件名（添加链接）**: 在处理文件以添加链接时，可选择**覆盖原始文件**或使用自定义后缀/替换字符串，而不是默认的 `_processed.md`。
- **链接完整性维护**: 在 vault 内重命名或删除笔记时，基本处理更新链接的功能。
- **纯概念提取**: 提取概念并创建相应的概念笔记，而不修改原始文档。这对于从现有文档中填充知识库而不改变它们是理想的。此功能具有用于创建最简概念笔记和添加反向链接的可配置选项。此功能具有用于创建最简概念笔记和添加反向链接的可配置选项。

### 翻译

- **AI 驱动的翻译**：
    - 使用配置的 LLM 翻译笔记内容。
    - **大文件支持**：在发送给 LLM 之前，会根据 `分块字数` 设置将大文件自动拆分为更小的块。翻译后的块随后会无缝地合并回单个文档中。
    - 支持多种语言之间的翻译。
    - 可在设置或 UI 中自定义目标语言。
    - 自动在原始文本右侧打开翻译后的文本，便于阅读。
- **批量翻译**:
    - 一键翻译所选文件夹中的所有文件。
    - 当“启用批处理并行化”开启时，支持并行处理。
    - 如果已配置，则使用自定义提示进行翻译。
	- 在文件浏览器的上下文菜单中添加“批量翻译此文件夹”选项。
- **禁用自动翻译**: 启用此选项后，非翻译任务将不再强制输出为特定语言，从而保留原始语言上下文。明确的“翻译”任务仍将按配置执行翻译。

### 网络研究与内容生成
- **网页研究与摘要**:
    - 支持Tavily（需API Key）与DuckDuckGo（实验性）两种网络搜索服务。
    - 自动用LLM总结搜索结果，并附加到当前笔记。
    - 可以在设置中自定义摘要的输出语言。
    - 可配置用于研究的最大内容长度。
- **根据标题生成内容**:
    - 利用笔记标题通过LLM生成内容并替换原有文本。
    - 可选在生成前自动执行网页研究，丰富生成上下文。
- **批量根据标题生成内容**:
    - 一键批量处理选定文件夹下所有笔记，自动跳过已处理文件。
    - 可配置“完成”子文件夹名称，避免重复处理。

### 实用功能
- **总结为Mermaid图表**:
    - 此功能允许您将笔记内容总结为Mermaid图表。
    - 可以在设置中自定义Mermaid图表的输出语言。
    - **Mermaid 输出文件夹**: 配置生成Mermaid图表文件的保存文件夹。如果留空，图表将保存在与原始笔记相同的文件夹中。
    - **翻译总结为Mermaid输出**: 可选地将生成的Mermaid图表内容翻译成配置的目标语言。

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/803d444f-e477-428a-9ce6-4aac8075062a" />


- **检查当前文件中的重复项**: 此命令有助于识别活动文件中的潜在重复术语。
- **重复检测**: 检查当前处理内容中的重复词（结果输出到控制台）。
- **检查并删除重复概念笔记**: 综合文件名（精确/复数/规范化/包含关系）检测概念笔记文件夹内外潜在重复项，支持自定义检测范围，操作前会详细列出并需手动确认。
- **批量Mermaid修复**: 对选定文件夹内所有Markdown文件应用Mermaid和LaTeX语法校正。
    - **错误报告**: 生成 `mermaid_error_{foldername}.md` 报告，列出处理后仍包含潜在Mermaid错误的文件。
    - **移动错误文件**: 可选地将检测到错误的文件移动到指定文件夹以供手动审查。
    - **高级修复模式**: 包含针对包含空格、特殊字符或嵌套括号的未加引号节点标签的稳健修复（例如，将 `Node[标签 [文本]]` 转换为 `Node["标签 [文本]"]`）。
- **提取特定原始内容**:
    - 在设置中定义问题列表。
    - 从活动笔记中逐字提取回答这些问题的文本段落。
    - **合并查询模式**: 可选择在单个 API 调用中处理所有问题以提高效率。
    - **翻译**: 可选在输出中包含提取文本的翻译。
    - **自定义输出**: 可配置提取文本文件的保存路径和文件名后缀。
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

### LLM 提供商配置 (LLM Provider Configuration)

1. **活动提供商 (Active Provider)**: 从下拉菜单中选择您想要使用的 LLM 提供商。

2. 提供商设置 (Provider Settings)

   : 配置所选提供商的具体设置：

   - **API 密钥 (API Key)**: 大多数云提供商（例如 OpenAI, Anthropic, DeepSeek, Google, Mistral, Azure, OpenRouter）需要。Ollama 不需要。LMStudio 通常使用 `EMPTY` 或可以留空。
   - **基础 URL / 端点 (Base URL / Endpoint)**: 服务的 API 端点。提供了默认值，但您可能需要为本地模型（LMStudio, Ollama）、OpenRouter 或特定的 Azure 部署更改此设置。**Azure OpenAI 必需。**
   - **模型 (Model)**: 要使用的具体模型名称/ID（例如 `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `llama3`, `mistral-large-latest`）。确保模型在您的端点/提供商处可用。对于 OpenRouter，请使用其网站上显示的模型 ID（例如 `gryphe/mythomax-l2-13b`）。
   - **温度 (Temperature)**: 控制 LLM 输出的随机性（0=确定性，1=最大创造力）。较低的值（例如 0.2-0.5）通常更适合结构化任务。
   - **API 版本 (仅限 Azure) (API Version (Azure Only))**: Azure OpenAI 部署需要（例如 `2024-02-15-preview`）。

3. **测试连接 (Test Connection)**: 使用活动提供商的“测试连接”按钮来验证您的设置。现在对 LM Studio 使用了更可靠的方法。

4. **管理提供商配置 (Manage Provider Configurations)**: 使用“导出提供商”和“导入提供商”按钮将您的 LLM 提供商设置保存到插件配置目录中的 `notemd-providers.json` 文件或从中加载。这便于备份和共享。

<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### 多模型配置 (Multi-Model Configuration)

- 为任务使用不同的提供商 (Use Different Providers for Tasks)

  :

  - **禁用 (默认)**: 对所有任务使用上面选择的单个“活动提供商”。
  - **启用**: 允许您为每个任务（“添加链接”、“研究与摘要”、“从标题生成”、“提取概念”）选择特定的提供商*和*可选地覆盖模型名称。如果任务的模型覆盖字段留空，则将使用为该任务选定提供商配置的默认模型。
- **为不同任务选择不同语言**:
    *   **禁用 (默认)**: 所有任务都使用单一的“输出语言”。
    *   **启用**: 允许您为每个任务（“添加链接”、“研究与摘要”、“从标题生成”、“总结为Mermaid图表”、“提取概念”）选择特定的语言。

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### 稳定 API 调用设置 (Stable API Call Settings)

- 启用稳定 API 调用（重试逻辑）(Enable Stable API Calls (Retry Logic))

  :

  - **禁用 (默认)**: 单个 API 调用失败将停止当前任务。
  - **启用**: 自动重试失败的 LLM API 调用（对于间歇性网络问题或速率限制很有用）。

- **重试间隔 (秒) (Retry Interval (seconds))**: (仅在启用时可见) 重试尝试之间等待的时间（1-300 秒）。默认值：5。

- **最大重试次数 (Maximum Retries)**: (仅在启用时可见) 最大重试尝试次数（0-10）。默认值：3。
- **API 错误调试模式 (API Error Debugging Mode)**:
    *   **禁用 (默认)**: 使用标准的简洁错误报告。
    *   **启用**: 为所有提供商激活详细的错误日志记录（类似于 DeepSeek 的详细输出）。这包括 HTTP 状态代码和原始响应文本，对于排查 API 连接问题至关重要。

<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### 常规设置

#### 处理文件输出 (Processed File Output)

- 自定义处理文件的保存路径 (Customize Processed File Save Path)

  :

  - **禁用 (默认)**: 处理过的文件（例如 `YourNote_processed.md`）保存在与原始笔记*相同的文件夹*中。
  - **启用**: 允许您指定自定义保存位置。

- **处理文件文件夹路径 (Processed File Folder Path)**: (仅在启用上述选项时可见) 输入 vault 内的*相对路径*（例如 `Processed Notes` 或 `Output/LLM`），处理过的文件应保存在此路径。如果文件夹不存在，将自动创建。**请勿使用绝对路径（如 C:...）或无效字符。**

- 为“添加链接”使用自定义输出文件名 (Use Custom Output Filename for ‘Add Links’)

  :

  - **禁用 (默认)**: 由“添加链接”命令创建的处理文件使用默认的 `_processed.md` 后缀（例如 `YourNote_processed.md`）。
  - **启用**: 允许您使用下面的设置自定义输出文件名。

- 自定义后缀/替换字符串 (Custom Suffix/Replacement String)

  : (仅在启用上述选项时可见) 输入用于输出文件名的字符串。

  - 如果留**空**，原始文件将被处理后的内容**覆盖**。
  - 如果您输入一个字符串（例如 `_linked`），它将被附加到原始基本名称后（例如 `YourNote_linked.md`）。确保后缀不包含无效的文件名字符。

- 在添加链接时移除代码围栏 (Remove Code Fences on Add Links)

  :

  - **禁用 (默认)**: 添加链接时，代码围栏 **(`)\** 会保留在内容中，而 \**(`markdown)** 会被自动删除。
  - **启用**: 在添加链接之前从内容中移除代码围栏。

<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### 概念笔记输出 (Concept Note Output)

- 自定义概念笔记路径 (Customize Concept Note Path)

  :

  - **禁用 (默认)**: 禁用为 `[[链接的概念]]` 自动创建笔记。
  - **启用**: 允许您指定创建新概念笔记的文件夹。

- **概念笔记文件夹路径 (Concept Note Folder Path)**: (仅在启用上述选项时可见) 输入 vault 内的*相对路径*（例如 `Concepts` 或 `Generated/Topics`），新概念笔记应保存在此路径。如果文件夹不存在，将自动创建。**如果启用了自定义，则必须填写。** **请勿使用绝对路径或无效字符。**

<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### 概念日志文件输出 (Concept Log File Output)

- 生成概念日志文件 (Generate Concept Log File)

  :

  - **禁用 (默认)**: 不生成日志文件。
  - **启用**: 处理后创建一个日志文件，列出新创建的概念笔记。格式如下： `generate xx concepts md file 1. concepts1 2. concepts2 ... n. conceptsn`

- 自定义日志文件保存路径 (Customize Log File Save Path)

  : (仅在启用“生成概念日志文件”时可见)

  - **禁用 (默认)**: 日志文件保存在**概念笔记文件夹路径**（如果已指定）中，否则保存在 vault 根目录。
  - **启用**: 允许您为日志文件指定自定义文件夹。

- **概念日志文件夹路径 (Concept Log Folder Path)**: (仅在启用“自定义日志文件保存路径”时可见) 输入 vault 内的*相对路径*（例如 `Logs/Notemd`），日志文件应保存在此路径。**如果启用了自定义，则必须填写。**

- 自定义日志文件名 (Customize Log File Name)

  : (仅在启用“生成概念日志文件”时可见)

  - **禁用 (默认)**: 日志文件名为 `Generate.log`。
  - **启用**: 允许您为日志文件指定自定义名称。

- **概念日志文件名 (Concept Log File Name)**: (仅在启用“自定义日志文件名”时可见) 输入所需的文件名（例如 `ConceptCreation.log`）。**如果启用了自定义，则必须填写。**

<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### 提取概念任务
- **创建最简概念笔记**:
    - **开启（默认）**：新创建的概念笔记将只包含标题（例如 `# 概念`）。
    - **关闭**：概念笔记可能包含其他内容，例如“链接来源”反向链接（如果下面的设置未禁用）。
- **添加“链接来源”反向链接**:
    - **关闭（默认）**：在提取过程中，不会在概念笔记中添加指向源文档的反向链接。
    - **开启**：添加一个带有指向源文件反向链接的“链接来源”部分。

#### 提取特定原始内容
-   **提取问题**: 输入您希望AI从笔记中逐字提取答案的问题列表（每行一个）。
-   **将输出翻译为相应语言**:
    *   **关闭 (默认)**: 仅以原始语言输出提取的文本。
    *   **开启**: 以由此任务选择的语言附加提取文本的翻译。
-   **合并查询模式**:
    *   **关闭**: 单独处理每个问题（精度更高但API调用更多）。
    *   **开启**: 在单个提示中发送所有问题（更快且API调用更少）。
-   **自定义提取文本保存路径和文件名**:
    *   **关闭**: 保存到与原始文件相同的文件夹，后缀为 `_Extracted`。
    *   **开启**: 允许您指定自定义输出文件夹和文件名后缀。

#### 批量Mermaid修复
-   **将存在Mermaid错误的文件移动到指定文件夹**:
    *   **关闭**: 有错误的文件保留在原位。
    *   **开启**: 将修复尝试后仍包含Mermaid语法错误的文件移动到专用文件夹以供手动审查。
-   **Mermaid错误文件夹路径**: (仅在启用上述选项时可见) 移动错误文件的文件夹。

#### 处理参数 (Processing Parameters)

- **启用批处理并行化 (Enable Batch Parallelism)**:
    - **禁用 (默认)**: 批处理任务（如“处理文件夹”或“从标题批量生成”）将逐个（串行）处理文件。
    - **启用**: 允许插件同时处理多个文件，这可以显著加快大型批处理作业的速度。
- **批处理并发数 (Batch Concurrency)**: (仅在启用并行化时可见) 设置并行处理的最大文件数。较高的数字可以更快，但会消耗更多资源，并可能达到API速率限制。（默认值：1，范围：1-20）
- **批处理大小 (Batch Size)**: (仅在启用并行化时可见) 分组到单个批次中的文件数。（默认值：50，范围：10-200）
- **批处理间隔延迟 (毫秒) (Delay Between Batches (ms))**: (仅在启用并行化时可见) 处理每个批次之间的可选延迟（以毫秒为单位），这有助于管理API速率限制。（默认值：1000毫秒）
- **API 调用间隔 (毫秒) (API Call Interval (ms))**: 每个单独的 LLM API 调用之前和之后的最小延迟（以毫秒为单位）。对于低速率 API 或防止 429 错误至关重要。设置为 0 表示没有人为延迟。（默认值：500毫秒）
- **分块字数 (Chunk Word Count)**: 发送给 LLM 的每个块的最大字数。影响大型文件的 API 调用次数。（默认值：3000）
- **启用重复检测 (Enable Duplicate Detection)**: 切换对处理内容中重复单词的基本检查（结果在控制台中）。（默认值：启用）
- **最大令牌数 (Max Tokens)**: LLM 每个响应块应生成的最大令牌数。影响成本和细节。（默认值：4096）

<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### 翻译（Translate）
- **目标语言**：可选默认目标语言，命令时可覆盖。
- **翻译文件保存路径/后缀**：自定义翻译结果的保存路径和文件名后缀（Notemd: Translate Note/Selection）。
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Mermaid 设置
- **Mermaid 输出文件夹**: 配置生成Mermaid图表文件的保存文件夹。如果留空，图表将保存在与原始笔记相同的文件夹中。
- **翻译总结为Mermaid输出**: 可选地将生成的Mermaid图表内容翻译成配置的目标语言。



#### 内容生成 (Content Generation)

- 在“从标题生成”中启用研究 (Enable Research in “Generate from Title”)

  :

  - **禁用 (默认)**: “从标题生成”仅使用标题作为输入。
  - **启用**: 使用配置的**网络研究提供商**执行网络研究，并将研究结果作为上下文包含在基于标题生成的 LLM 提示中。

- **生成后自动修复Mermaid语法**:
    - **禁用 (默认)**: 不执行额外操作。
    - **启用**: 在使用“从标题生成”、“批量从标题生成”或“创建维基链接并生成笔记”后，自动对笔记运行语法修复。这有助于确保生成的Mermaid图表有效。

- 输出语言

  : (新增) 为“从标题生成”和“从标题批量生成”任务选择所需的输出语言。

  - **英语 (默认)**: 提示以英语处理和输出。
  - **其他语言**: 指示LLM以英语进行推理，但以您选择的语言 (例如 西班牙语、法语、简体中文、繁體中文、阿拉伯语、印地语等) 提供最终文档。

- 更改提示词

  : (新增)

  - **更改提示词**: 允许您更改特定任务的提示词。
  - **自定义提示词**: 输入您任务的自定义提示词。

- 为“从标题生成”使用自定义输出文件夹 (Use Custom Output Folder for ‘Generate from Title’)

  :

  - **禁用 (默认)**: 成功生成的文件将移动到相对于原始文件夹父目录的名为 `[原始文件夹名称]_complete` 的子文件夹中（如果原始文件夹是根目录，则为 `Vault_complete`）。
  - **启用**: 允许您为移动已完成文件的子文件夹指定自定义名称。

- **自定义输出文件夹名称 (Custom Output Folder Name)**: (仅在启用上述选项时可见) 输入子文件夹所需的名称（例如 `Generated Content`, `_complete`）。不允许使用无效字符。如果留空，则默认为 `_complete`。此文件夹创建在原始文件夹的父目录内。

#### 自定义提示词设置
此功能允许您覆盖发送给LLM的特定任务的默认指令（提示词），从而对输出进行精细控制。

-   **为特定任务启用自定义提示词**：
    *   **禁用（默认）**：插件对所有操作使用其内置的默认提示词。
    *   **启用**：激活为下面列出的任务设置自定义提示词的功能。这是此功能的主开关。

-   **为[任务名称]使用自定义提示词**：（仅��启用上述功能时可见）
    *   对于每个支持的任务（“添加链接”、“从标题生成”、“研究与摘要”、“提取概念”），您可以单独启用或禁用您的自定义提示词。
    *   **禁用**：此特定任务将使用默认提示词。
    *   **启用**：此任务将使用您在下方相应“自定义提示词”文本区域中提供的文本。

-   **自定义提示词文本区域**：（仅在启用任务的自定义提示词时可见）
    *   **默认提示词显示**：为方便您参考，插件会显示该任务通常使用的默认提示词。您可以使用**“复制默认提示词”**按钮复制此文本，作为您自己自定义提示词的起点。
    *   **自定义提示词输入**：您可以在此处编写自己的LLM指令。
    *   **占位符**：您可以在提示词中使用特殊的占位符，插件在将请求发送给LLM之前会将其替换为实际内容。请参考默认提示词以查看每个任务可用的占位符。常用占位符包括：
        *   `{TITLE}`：当前笔记的标题。
        *   `{RESEARCH_CONTEXT_SECTION}`：从网络研究中收集的内容。
        *   `{USER_PROMPT}`：正在处理的笔记内容。

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### 重复检查范围 (Duplicate Check Scope)

- 重复检查范围模式 (Duplicate Check Scope Mode)

  : 控制将概念笔记文件夹中的笔记与哪些文件进行比较以查找潜在重复项。

  - **整个 Vault (默认)**: 将概念笔记与 vault 中的所有其他笔记（不包括概念笔记文件夹本身）进行比较。
  - **仅包含特定文件夹**: 仅将概念笔记与下面列出的文件夹中的笔记进行比较。
  - **排除特定文件夹**: 将概念笔记与*除*下面列出的文件夹中的笔记（以及概念笔记文件夹）之外的所有笔记进行比较。
  - **仅概念文件夹**: 仅将概念笔记与*概念笔记文件夹内的其他笔记*进行比较。这有助于查找纯粹在您生成的概念内部的重复项。

- **包含/排除文件夹 (Include/Exclude Folders)**: (仅在模式为“包含”或“排除”时可见) 输入您要包含或排除的文件夹的*相对路径*，**每行一个路径**。路径区分大小写，并使用 `/` 作为分隔符（例如 `Reference Material/Papers` 或 `Daily Notes`）。这些文件夹不能与概念笔记文件夹相同或位于其内部。

#### 网络研究提供商 (Web Research Provider)

- **搜索提供商 (Search Provider)**: 在 `Tavily`（需要 API 密钥，推荐）和 `DuckDuckGo`（实验性，经常被搜索引擎阻止自动化请求）之间选择。用于“研究与摘要主题”和可选的“从标题生成”。
- **Tavily API 密钥 (Tavily API Key)**: (仅在选择 Tavily 时可见) 输入您从 [tavily.com](https://tavily.com/) 获取的 API 密钥。
- **Tavily 最大结果数 (Tavily Max Results)**: (仅在选择 Tavily 时可见) Tavily 应返回的最大搜索结果数（1-20）。默认值：5。
- **Tavily 搜索深度 (Tavily Search Depth)**: (仅在选择 Tavily 时可见) 选择 `basic`（默认）或 `advanced`。注意：`advanced` 提供更好的结果，但每次搜索消耗 2 个 API 积分，而不是 1 个。
- **DuckDuckGo 最大结果数 (DuckDuckGo Max Results)**: (仅在选择 DuckDuckGo 时可见) 要解析的最大搜索结果数（1-10）。默认值：5。
- **DuckDuckGo 内容获取超时 (DuckDuckGo Content Fetch Timeout)**: (仅在选择 DuckDuckGo 时可见) 尝试从每个 DuckDuckGo 结果 URL 获取内容时等待的最大秒数。默认值：15。
- **最大研究内容令牌数 (Max Research Content Tokens)**: 要包含在摘要提示中的组合网络研究结果（片段/获取的内容）的大致最大令牌数。有助于管理上下文窗口大小和成本。（默认值：3000）
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### 专注学习领域 (Focused Learning Domain)
-   **启用专注学习领域**:
    *   **禁用 (默认)**: 发送给LLM的提示词使用标准的通用指令。
    *   **启用**: 允许您指定一个或多个研究���域，以提高LLM的上下文理解能力。
-   **学习领域**: (仅在启用上述选项时可见) 输入您的特定领域，例如“材料科学”、“高分子物理”、“机器学习”。这将在提示词的开头添加一行“相关领域: [...]”，帮助LLM为您的特定研究领域生成更准确、更相关的链接和内容。
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/e8d5e407-d39d-4a21-a18f-446ca660276f" />

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

1.  **总结为Mermaid图表**：
    *   打开要总结的笔记。
    *   运行命令 `Notemd: 总结为Mermaid图表` (通过命令面板或侧边栏按钮)。
    *   插件将生成一个带有Mermaid图表的新笔记。

2.  **翻译笔记/选区**：
    *   选中文本可仅翻译选区，无选区则翻译全文。
    *   运行 `Notemd: 翻译笔记/选区 (Notemd: Translate Note/Selection)`。
    *   弹窗可确认/修改目标语言（默认使用设置）。
    *   翻译内容保存到指定路径并在原文右侧新窗格打开。
    *   任务可随时取消。

3.  **批量翻译**：
    *   从命令面板运行 `Notemd: 批量翻译文件夹` 并选择一个文件夹，或在文件浏览器中右键单击一个文件夹并选择“批量翻译此文件夹”。
    *   插件将翻译所选文件夹中的所有 Markdown 文件。
    *   翻译后的文件将保存到配置的翻译路径中，但不会自动打开。
    *   此过程可以通过进度模式取消。

3.  **研究与摘要主题**：
    *   选中文本或用笔记标题作为搜索主题。
    *   运行 `Notemd: 研究和摘要主题 (Notemd: Research and Summarize Topic)`。
    *   配置的搜索服务与LLM自动协作，结果附加到当前笔记。
    *   任务可随时取消。
    *   *DuckDuckGo 可能因反爬机制失败，推荐Tavily。*

4.  **从标题生成内容**：
    *   打开任意笔记（可为空）。
    *   运行 `Notemd: 从标题生成内容 (Notemd: Generate Content from Title)`。
    *   LLM根据标题生成内容并替换原文。
    *   可选先自动研究，丰富上下文。
    *   任务可随时取消。

5.  **批量从标题生成内容**：
    *   运行 `Notemd: 从标题批量生成内容 (Notemd: Batch Generate Content from Titles)`。
    *   选择要处理的文件夹，自动跳过已完成文件。
    *   成功处理的文件自动移动到指定“完成”子文件夹。
    *   任务可随时取消。

6.  **提取概念（纯模式）**:
    *   此功能允许您从文档中提取概念并创建相应的概念笔记，而*不*更改原始文件。它非常适合从一组文档中快速填充您的知识库。
    *   **单个文件**：打开一个文件，从命令面板运行 `Notemd: 提取概念（仅创建概念笔记）` 命令，或单击侧边栏中的 **“提取概念（当前文件）”** 按钮。
    *   **文件夹**：从命令面板运行 `Notemd: 批量提取概念` 命令，或单击侧边栏中的 **“提取概念（文件夹）”** 按钮，然后选择一个文件夹来处理其中的所有笔记。
    *   插件将读取文件，识别概念，并在您指定的 **概念笔记文件夹** 中为它们创建新笔记，而原始文件保持不变。

7.  **创建维基链接并从选区生成笔记**：
    *   这个强大的命令简化了创建和填充新概念笔记的过程。
    *   在编辑器中选择一个词或短语。
    *   运行命令 `Notemd: 创建维基链接并从选区生成笔记` (建议为此分配一个快捷键，如 `Cmd+Shift+W`)。
    *   插件将会：
        1.  将您选择的文本替换为 `[[维基链接]]`。
        2.  检查您的 **概念笔记文件夹** 中是否已存在该标题的笔记。
        3.  如果存在，它会向当前笔记添加一个反向链接。
        4.  如果不存在，它会创建一个新的空笔记。
        5.  然后，它会自动对新的或现有的笔记运行 **“从标题生成内容”** 命令，用AI生成的内容填充它。

8.  **提取概念并生成标题**：
    *   该命令将两个强大的功能链接在一起，以实现简化的工作流程。
    *   从命令面板运行命令 `Notemd: 提取概念并生成标题` (建议为此分配一个快捷键)。
    *   插件将会：
        1.  首先，对当前活动文件运行 **“提取概念（当前文件）”** 任务。
        2.  然后，它将自动在您设置为 **概念笔记文件夹路径** 的文件夹上运行 **“批量从标题生成”** 任务。
    *   这使您可以首先从源文档中提取新概念来填充您的知识库，然后立即在一个步骤中用AI生成的内容来充实这些新的概念笔记。

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
    *   对用户选择的文件夹内的所有Markdown文件应用Mermaid和LaTeX语法校正。
    *   **错误报告**: 生成 `mermaid_error_{foldername}.md` 报告，列出处理后仍包含潜在Mermaid错误的文件。
    *   **移动错误文件**: 可选地将检测到错误的文件移动到指定文件夹以供手动审查。
    *   **高级修复模式**: 包含针对包含空格、特殊字符或嵌套括号的未加引号节点标签的稳健修复（例如，将 `Node[标签 [文本]]` 转换为 `Node["标签 [文本]"]`）。

4.  **检查并删除重复概念笔记**：
    *   配置好概念笔记文件夹后运行该命令。
    *   运行 `Notemd: 检查并删除重复概念笔记 (Notemd: Check and Remove Duplicate Concept Notes)`。
    *   自动检测并提示所有潜在重复项，需手动确认删除。
    *   进度与结果显示在侧边栏/通知栏。

5.  **提取特定原始内容**:
    *   在“提取特定原始内容”下的设置中配置您的问题。
    *   使用侧边栏中的“提取特定原始内容”按钮来处理当前活动文件。
    *   **合并模式**: 通过在一个提示中发送所有问题来加快处理速度。
    *   **翻译**: 可选地将提取的文本翻译为您配置的语言。
    *   **自定义输出**: 配置提取文件的保存位置和方式。

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
- **LM Studio/Ollama 连接问题**：
    *   **测试连接失败**：确保本地服务器（LM Studio 或 Ollama）正在运行，并且已加载/可用正确的模型。
    *   **CORS 错误（Windows上的Ollama）**：如果在 Windows 上使用 Ollama 时遇到 CORS（跨源资源共享）错误，您可能需要设置 `OLLAMA_ORIGINS` 环境变量。您可以在启动 Ollama 之前，在命令提示符中运行 `set OLLAMA_ORIGINS=*` 来实现。这允许来自任何来源的请求。
    *   **在 LM Studio 中启用 CORS**：对于 LM Studio，您可以直接在服务器设置中启用 CORS，如果 Obsidian 在浏览器中运行或具有严格的来源策略，这可能是必需的。
- **文件夹创建失败**：请确保设置中保存路径为相对路径，且不包含无效字符（如\* " \ / < > : | ? # ^ [ ] 等）。
- **性能问题**：大文件或批量处理可适当调低分块字数，或更换LLM模型。
- **链接质量问题**：可尝试不同模型或温度设置改善效果。

## 贡献

欢迎任何形式的贡献！请参考GitHub项目说明: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## 许可证

MIT许可证 - 详情请见[LICENSE](LICENSE)。

---

*Notemd v1.5.0 - 用AI提升你的Obsidian知识图谱。*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
