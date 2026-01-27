# Notemd Change Log

This document summarizes the major functional and architectural changes implemented.

---

## [1.6.3] - 2026-01-27

### Fixed
*   **API Error Debugging**: Fixed an issue where the "API Error Debugging Mode" would not show the full error response body for certain providers (like LMStudio 429 errors). Now, detailed JSON responses and status codes are correctly captured and logged when this mode is enabled, aiding significantly in troubleshooting connectivity and rate-limit issues.

## v1.6.2

### English
*   **Modularized API Error Handling**: Refactored error handling logic to ensure consistency across all tasks.
*   **Enhanced Debugging**: The "API Error Debugging Mode" now fully supports "Translate", "Search", and "Connection Test" tasks, providing detailed logs (HTTP status codes, raw responses) for deeper troubleshooting.

### Chinese (中文)
*   **模块化API错误处理**: 重构了错误处理逻辑，确保所有任务的一致性。
*   **增强调试**: “API错误调试模式”现在完全支持“翻译”、“搜索”和“连接测试”任务，提供详细的日志（HTTP状态代码、原始响应）以便进行更深入的故障排除。

---

## Bug Fixes

### English
*   **Fix Mermaid Table Corruption**: Resolved a critical issue where the "Batch Mermaid Fix" and "Deep Debug" features would incorrectly apply syntax fixes to Markdown tables (e.g., changing `| : --- |` to `| : -- "- |`), ensuring that modifications are strictly limited to code blocks within ```mermaid``` tags.
*   **Enhanced Table Protection**: Implemented robust safeguards in the deep debug processor to specifically ignore lines matching Markdown table separators (e.g., `| :--- |`) and lines containing `:-- :`, preserving table integrity even in aggressive fix modes.

### Chinese (中文)
*   **修复Mermaid表格损坏**: 解决了“批量Mermaid修复”和“深度调试”功能错误地将语法修复应用于Markdown表格（例如，将 `| : --- |` 更改为 `| : -- "- |`）的关键问题，确保修改严格限制在 ```mermaid``` 标签内的代码块中。
*   **增强的表格保护**: 在深度调试处理器中实现了稳健的保护措施，专门忽略匹配Markdown表格分隔符（例如 `| :--- |`）和包含 `:-- :` 的行，即使在激进的修复模式下也能保持表格完整性。

---

## Code/Architecture Update

### English
*   **Modularized API Error Handling**: Refactored `llmUtils.ts` to introduce a centralized `handleProviderError` function. This function supports both concise error reporting (default) and verbose, "DeepSeek-style" debugging logs (status codes, raw responses), ensuring consistent error handling across all 10+ supported LLM providers.
*   **Automatic Error Logging**: Implemented a `saveErrorLog` utility in `fileUtils.ts`. This function captures the error message, stack trace, and the full session log from the reporter, saving it to a timestamped file (e.g., `Notemd_Error_Log_2023-10-27_10-00-00.txt`) in the vault root whenever a process fails. It also intelligently prompts users to enable debug mode if it's currently disabled.

### Chinese (中文)
*   **模块化API错误处理**: 重构了 `llmUtils.ts`，引入了集中的 `handleProviderError` 函数。该函数支持简洁的错误报告（默认）和详细的“DeepSeek风格”调试日志（状态代码、原始响应），确保所有10多个受支持的LLM提供商具有一致的错误处理。
*   **自动错误日志记录**: 在 `fileUtils.ts` 中实现了 `saveErrorLog` 工具。该函数捕获错误消息、堆栈跟踪和来自报告器的完整会话日志，并在进程失败时将其保存到保管库根目录下的带时间戳的文件（例如 `Notemd_Error_Log_2023-10-27_10-00-00.txt`）。如果当前禁用了调试模式，它还会智能地提示用户启用调试模式。

---

## Implementation of Functionality

### English
*   **API Error Debugging Mode**: Added a new setting in the "Stable API calls" section.
    *   **Enabled**: Activates detailed logging for all API calls, including HTTP status codes and raw response text, aiding in troubleshooting connection issues.
    *   **Disabled**: Maintains the standard, clean user experience with concise error messages.
*   **Automatic Log File Generation**:
    *   When an error occurs during any major operation (processing files, generating content, research, etc.), a detailed log file is now automatically created in the vault root.
    *   This file includes the error context and session history, making it easier for users to report bugs and for developers to diagnose issues.

### Chinese (中文)
*   **API错误调试模式**: 在“稳定API调用”部分添加了一个新设置。
    *   **启用**: 激活所有API调用的详细日志记录，包括HTTP状态代码和原始响应文本，有助于排查连接问题。
    *   **禁用**: 保持标准的、干净的用户体验，提供简洁的错误消息。
*   **自动日志文件生成**:
    *   当任何主要操作（处理文件、生成内容、研究等）期间发生错误时，现在会自动在保管库根目录中创建一个详细的日志文件。
    *   该文件包含错误上下文和会话历史记录，使用户更容易报告错误，也便于开发人员诊断问题。

---

## Implementation of Functionality

### English
*   **Extract Specific Original Text**:
    *   Introduced a new feature to extract verbatim text segments from notes based on user-defined questions.
    *   **Merged Query Mode**: Efficiently processes all questions in a single API call.
    *   **Translation Support**: Optionally includes translations of the extracted text.
    *   **Custom Output**: Configurable output paths and filenames.
    *   **Batch Mermaid Fix Enhancements**:
    *   **Advanced Fix Mode**: Added robust handling for unquoted Mermaid node labels containing nested brackets (e.g., `Node[Label [Text]]`) and special characters.
    *   **Note Conversion**: Added functionality to automatically convert `note right/left of` comments in Mermaid graphs to edge labels, ensuring better rendering and adherence to standard graph syntax.
    *   **Malformed Arrow Fix**: Implemented deep debugging logic to correct malformed arrow labels where the arrow syntax is incorrectly embedded within quotes (e.g., `-->"` becomes `" -->`), ensuring valid Mermaid syntax.
    *   **Standardize Pipe Labels**: Added logic to robustly handle and quote edge labels containing pipes (e.g., `|Text|` -> `|"Text"|`), resolving syntax errors in complex diagrams involving mathematical notation or loose pipe usage.
    *   **Merge Double Labels**: Introduced a fix for conflicting double edge labels (e.g., `-- "A" -->|"B"|`), merging them into a single descriptive label (`-- "A<br>(B)" -->`) to resolve rendering ambiguities.
    *   **Error Reporting**: Automatically generates a `mermaid_error_{foldername}.md` report listing files with remaining errors.
    *   **Move Error Files**: Added an option to automatically move files with persistent errors to a specific folder for manual review.

### Chinese (中文)
*   **提取特定原始内容**:
    *   引入了一项新功能，可根据用户定义的问题从笔记中逐字提取文本段落。
    *   **合并查询模式**: 在单个API调用中高效处理所有问题。
    *   **翻译支持**: 可选包含提取文本的翻译。
    *   **自定义输出**: 可配置输出路径和文件名。
*   **批量Mermaid修复增强**:
    *   **高级修复模式**: 增加了对包含嵌套括号（例如 `Node[标签 [文本]]`）和特殊字符的未加引号Mermaid节点标签的稳健处理。
    *   **注释转换**: 增加了自动将 Mermaid 图表中的 `note right/left of` 注释转换为连接线标签的功能，确保更好的渲染效果并符合标准图表语法。
    *   **畸形箭头修复**: 实现了深度调试逻辑，用于纠正箭头语法被错误嵌入引号内的畸形箭头标签（例如 `-->"` 变为 `" -->`），确保 Mermaid 语法的有效性。
    *   **标准化管道标签**: 添加了稳健处理和引用包含管道符的连接线标签的逻辑（例如 `|文本|` -> `|"文本"|`），解决了涉及数学符号或松散管道符用法的复杂图表中的语法错误。
    *   **合并双重标签**: 引入了对冲突双重边缘标签（例如 `-- "A" -->|"B"|`）的修复，将其合并为单个描述性标签（`-- "A<br>(B)" -->`），以解决渲染歧义。
    *   **错误报告**: 自动生成 `mermaid_error_{foldername}.md` 报告，列出仍有错误的文件。    *   **移动错误文件**: 添加了一个选项，可自动将存在持久错误的文件移动到特定文件夹以供手动审查。

---

## Code/Architecture Update

### English
*   **Robust Regex for Mermaid**: Implemented a sophisticated regex pattern in `mermaidProcessor.ts` to correctly identify and quote complex node labels without breaking existing valid syntax.
*   **Documentation Synchronization**: Fully synchronized `README.md` and `README_zh.md` to ensure all new features (Extract Text, Mermaid Fixes) are documented in both languages.

### Chinese (中文)
*   **Mermaid的稳健正则表达式**: 在 `mermaidProcessor.ts` 中实现了复杂的正则表达式模式，以正确识别并引用复杂的节点标签，而不会破坏现有的有效语法。
*   **文档同步**: 完全同步了 `README.md` 和 `README_zh.md`，确保所有新功能（提取文本，Mermaid修复）都以两种语言记录。

---
## Code/Architecture Update

### English
*   **Improved Progress Bar Logic**: Enhanced the logic for progress bar updates to ensure it accurately reflects the completion status of operations, preventing it from getting stuck at intermediate percentages.

### Chinese (中文)
*   **改进的进度条逻辑**: 增强了进度条更新逻辑，确保其准确反映操作的完成状态，防止其卡在中间百分比。

---
## Implementation of Functionality

### English
*   **Accurate UI Feedback for Wiki-Link Command**: The "Create Wiki-Link & Generate Note from Selection" command now provides accurate progress updates, reaching 100% completion and automatically closing the progress modal upon successful execution.

### Chinese (中文)
*   **Wiki-Link命令的准确UI反馈**: “从选中文本创建维基链接并生成笔记”命令现在提供准确的进度更新，在成功执行后达到100%完成并自动关闭进度模态框。

---
## Code/Architecture Update

### English
*   **Refined Concurrent Processing**: Implemented a staggered launch mechanism in the `createConcurrentProcessor` utility. This ensures that API calls within a parallel batch are spaced out by the configured `apiCallIntervalMs`, preventing request bursts and resolving potential 429 rate-limit errors from LLM providers.
*   **Modularized Syntax Fixing**: Refactored the `batchFixMermaidSyntaxInFolder` function by extracting the core logic into a new, reusable `fixMermaidSyntaxInFile` function. This improves code modularity and maintainability.

### Chinese (中文)
*   **优化并发处理**: 在 `createConcurrentProcessor` 工具函数中实现了交错启动机制。这确保了并行批处理中的API调用能根据配置的 `apiCallIntervalMs` 间隔执行，防止了请求爆发并解决了来自LLM提供商的潜在429速率限制错误。
*   **模块化语法修复**: 重构了 `batchFixMermaidSyntaxInFolder` 函数，将核心逻辑提取到一个新的、可复用的 `fixMermaidSyntaxInFile` 函数中。这提高了代码的模块化和可维护性。

---
## Implementation of Functionality

### English
*   **Enabled "Auto Mermaid Fix" Feature**: Implemented the core logic for the "Auto Mermaid Fix" feature by adding the `fixMermaidSyntaxInFile` function. This feature, when enabled in settings, automatically corrects Mermaid and LaTeX syntax in notes generated by various commands, ensuring diagram validity.
*   **Updated Documentation**: Updated `README.md` and `README_zh.md` to reflect the improved reliability of batch processing.

### Chinese (中文)
*   **启用“自动Mermaid修复”功能**: 通过添加 `fixMermaidSyntaxInFile` 函数，实现了“自动Mermaid修复”功能的核心逻辑。该功能在设置中启用后，会自动校正由各种命令生成的笔记中的Mermaid和LaTeX语法，确保图表的有效性。
*   **更新文档**: 更新了 `README.md` 和 `README_zh.md`，以反映批处理可靠性的提升。

---

## Code/Architecture Update

### English

*   **Parallel Processing Framework**: Introduced a parallel processing framework for batch operations. This was achieved by implementing a custom `Semaphore` for concurrency control and a `createConcurrentProcessor` factory function in `utils.ts`.
*   **Refactored Batch Commands**: Refactored all major batch processing commands (`processFolderWithNotemdCommand`, `batchGenerateContentForTitles`, `batchExtractConceptsForFolderCommand`) in `main.ts` and `fileUtils.ts`. These commands now utilize the new concurrent processor, allowing for serial I/O operations while executing LLM API calls in parallel. This significantly improves performance for large folders.
*   **Enhanced Progress Reporting**: Updated the `ProgressReporter` interface and its UI implementations (`ProgressModal`, `NotemdSidebarView`) to display the number of active parallel tasks, providing users with more detailed feedback during batch operations.
*   **Robustness and Error Handling**:
    *   Resolved various TypeScript build errors, including incorrect import paths for `normalizeNameForFilePath` and type mismatches for `view.file?.basename`.
    *   Added safeguards to prevent runtime errors, such as ensuring a note is successfully created before attempting to generate content for it.

### Chinese (中文)

*   **并行处理框架**: 为批量操作引入了并行处理框架。通过在 `utils.ts` 中实现自定义的 `Semaphore` (信号量) 和 `createConcurrentProcessor` 工厂函数来完成此项工作。
*   **重构批量处理命令**: 重构了 `main.ts` 和 `fileUtils.ts` 中的所有主要批量处理命令 (`processFolderWithNotemdCommand`, `batchGenerateContentForTitles`, `batchExtractConceptsForFolderCommand`)。这些命令现在利用新的并发处理器，允许在并行执行 LLM API 调用的同时进行串行 I/O 操作，从而显著提高了处理大文件夹时的性能。
*   **增强的进度报告**: 更新了 `ProgressReporter` 接口及其 UI 实现 (`ProgressModal`, `NotemdSidebarView`)，以显示活动并行任务的数量，在批量操作期间为用户提供更详细的反馈。
*   **健壮性与错误处理**:
    *   解决了多个 TypeScript 构建错误，包括 `normalizeNameForFilePath` 的不正确导入路径以及 `view.file?.basename` 的类型不匹配问题。
    *   增加了安全措施以防止运行时错误，例如在尝试为笔记生成内容之前，确保笔记已成功创建。

---

## Implementation of Functionality

### English

*   **New Batch Processing Settings**: Added new user settings in the UI to control the parallel processing behavior:
    *   `Enable Batch Parallelism`
    *   `Batch Concurrency`
    *   `Batch Size`
    *   `Delay Between Batches (ms)`
    *   `API Call Interval (ms)`
*   **New Command: "Create Wiki-Link & Generate Note from Selection"**:
    *   This new command streamlines the knowledge creation workflow.
    *   It allows a user to select text, which is then automatically converted to a `[[wiki-link]]`.
    *   A corresponding concept note is created in the designated "Concept Note Folder". If the note already exists, a backlink is added instead.
    *   Finally, its content is automatically generated by the LLM using the "Generate Content from Title" functionality.
*   **New Setting: "Auto-run Mermaid Syntax Fix"**: Added a setting to automatically run a syntax-fixing pass on notes after content generation tasks to ensure generated Mermaid diagrams are valid.
*   **Updated Documentation**: Updated `README.md` and `README_zh.md` to comprehensively document all new settings and the new "Create Wiki-Link & Generate Note" command.

### Chinese (中文)

*   **新增批量处理设置**: 在UI中添加了新的用户设置以控制并行处理行为：
    *   `启用批处理并行化`
    *   `批处理并发数`
    *   `批处理大小`
    *   `批处理间隔延迟 (毫秒)`
    *   `API 调用间隔 (毫秒)`
*   **新命令：“从选中文本创建维基链接并生成笔记”**:
    *   这个新命令简化了知识创建的工作流程。
    *   它允许用户选择文本，然后自动将其转换为 `[[维基链接]]`。
    *   在指定的“概念笔记文件夹”中创建一个相应的概念笔记。如果笔记已存在，则会添加反向链接。
    *   最后，使用“根据标题生成内容”功能，由 LLM 自动为该笔记生成内容。
*   **新设置：“生成后自动修复Mermaid语法”**: 添加了一个设置，用于在内容生成任务后自动对笔记运行语法修复，以确保生成的Mermaid图表有效。
*   **更新文档**: 更新了 `README.md` 和 `README_zh.md`，以全面记录所有新设置和“从选中文本创建维基链接并生成笔记”的新命令。
