# Notemd Change Log

This document summarizes the major functional and architectural changes implemented.

---

## [Unreleased]

### English
*   **Protocol-Aware Streaming Fallback Across All LLM Paths**: Extended long-request fallback parsing beyond OpenAI-compatible providers so Anthropic Messages, Google Gemini, Azure OpenAI, and Ollama now also use protocol-aware streamed fallback handling on desktop `http/https` and non-desktop `fetch`. Legacy exported OpenAI-style provider wrappers now delegate to the same shared streamed fallback path instead of keeping buffered-only logic.
*   **Cross-Transport Partial Stream Debugging**: Shared debug output now preserves parsed partial stream text for Anthropic, Google/Azure-style SSE flows, and Ollama NDJSON fallbacks, not just OpenAI-compatible calls.
*   **Stable-Mode Primary Transport Preference (OpenAI-Compatible)**: In stable mode, OpenAI-compatible runtime calls now prefer direct desktop/web streaming transport as the primary long-request path before trying `requestUrl`. This reduces false-fail chains where `requestUrl` disconnects even though upstream providers eventually return successful non-stream responses.
*   **Regression Coverage**: Added focused runtime tests for Anthropic, Google, Azure OpenAI, Ollama, and the remaining direct OpenAI-style provider wrappers on streamed fallback success and interruption scenarios.
*   **Real Endpoint Diagnostic CLI**: Added `scripts/diagnose-llm-provider.js` (and `npm run diagnose:llm`) to run reproducible buffered/streaming long-request diagnostics against real provider endpoints with sanitized per-attempt timing, headers, partial bodies, and parsed stream fragments.
*   **Settings Developer Diagnostic Button**: Added `Developer provider diagnostic (long request)` in settings to run an in-plugin runtime probe for the active provider and persist a full report (`Notemd_Provider_Diagnostic_*.txt`) in vault root.
*   **Diagnostic Runtime Helper + Tests**: Added `src/providerDiagnostics.ts` and trigger-chain coverage in `src/tests/providerDiagnostics.test.ts` to lock report generation behavior for both success and provider-failure debug paths.
*   **Docs and Agent Guide Alignment**: Updated both READMEs and `AGENTS.md` so in-plugin diagnostics and CLI diagnostics are documented and required to stay semantically aligned.

### Chinese (中文)
*   **全 LLM 路径的协议感知流式回退**: 长请求回退解析能力已从 OpenAI-compatible 扩展到 Anthropic Messages、Google Gemini、Azure OpenAI 和 Ollama，使这些 transport 在桌面 `http/https` 与非桌面 `fetch` 下都能走协议感知的流式回退链路。遗留的 OpenAI 风格导出 Provider 包装函数也已收敛到同一套共享流式回退路径，不再保留 buffered-only 旧逻辑。
*   **跨 Transport 的部分流式调试**: 共享调试输出现在不仅覆盖 OpenAI-compatible，也会为 Anthropic、Google/Azure 风格 SSE，以及 Ollama NDJSON 回退保留“已解析的部分流式文本”。
*   **稳定模式下的主传输优先策略（OpenAI-Compatible）**: 在稳定 API 调用模式下，OpenAI-compatible 运行时链路会优先使用桌面/网页流式传输作为主长请求路径，再回退到 `requestUrl`。这可以减少“`requestUrl` 先断连，但上游最终成功返回”导致的误失败链路。
*   **回归测试覆盖**: 新增 Anthropic、Google、Azure OpenAI、Ollama，以及剩余直连 OpenAI 风格 Provider 包装函数在流式回退成功与中途中断场景下的定向运行时测试。
*   **真实 Endpoint 诊断 CLI**: 新增 `scripts/diagnose-llm-provider.js`（以及 `npm run diagnose:llm`），可直接对真实 Provider 执行 buffered/streaming 长请求对照诊断，并输出脱敏后的每次尝试耗时、响应头、部分响应体与已解析流式片段。
*   **设置页开发者诊断按钮**: 在设置页新增 `Developer provider diagnostic (long request)` 按钮，可直接对当前活动 Provider 发起插件内运行时探针，并在仓库根目录保存完整报告（`Notemd_Provider_Diagnostic_*.txt`）。
*   **诊断运行时模块与测试**: 新增 `src/providerDiagnostics.ts`，并在 `src/tests/providerDiagnostics.test.ts` 中补齐按钮触发链路对应的成功/失败路径测试，确保报告输出与调试信息稳定可回归。
*   **文档与代理指南对齐**: 已同步更新中英文 README 与 `AGENTS.md`，明确插件内诊断与 CLI 诊断需要保持协议语义一致。

---

## [1.7.8] - 2026-03-29

### English
*   **OpenAI-Compatible Streaming Fallback**: Long-running OpenAI-compatible task calls now upgrade their desktop `http/https` and non-desktop `fetch` fallback attempts to streaming response parsing after an initial transient `requestUrl` disconnect. This helps slow gateways and reverse proxies return body chunks earlier instead of failing the whole request while waiting for one large buffered response.
*   **Parsed Partial Stream Debugging**: Shared deep-debug output now records both raw partial bodies and parsed partial stream text when a streamed fallback attempt is interrupted. This gives developers enough evidence to distinguish between transport resets and upstream provider-side error payloads.
*   **Regression Coverage**: Added focused tests for desktop and web streaming fallback assembly, plus interrupted streaming fallback diagnostics.

### Chinese (中文)
*   **OpenAI-compatible 流式回退**: 长耗时的 OpenAI-compatible 任务调用在首次 `requestUrl` 瞬时断连后，现在会把桌面端 `http/https` 与非桌面环境 `fetch` 的回退尝试升级为流式响应解析。这样慢速网关和反向代理可以更早返回 body 分片，而不是一直等待整块缓冲响应后直接判定整次请求失败。
*   **已解析流式片段调试**: 共享深度调试输出现在会在流式回退被中途打断时，同时记录原始部分响应体和“已解析的部分流式文本”。开发者可以更清楚地区分到底是传输层重置，还是上游 Provider 已经返回了可用于定位问题的错误/内容片段。
*   **回归测试覆盖**: 新增桌面端与 Web 流式回退拼装测试，以及流式回退中断时的诊断信息测试。

---

## [1.7.7] - 2026-03-26

### English
*   **Cross-Provider Deep Debugging**: The shared LLM transport/error path now records per-attempt debug metadata for every provider, including transport name, sanitized request URL and headers, elapsed duration, response headers, partial response bodies, and stack traces. This makes slow upstream gateway resets and proxy disconnects visible without relying on provider-specific logging.
*   **Connection Test Debug Consistency**: Provider connection probes now use the same instrumented request path as runtime calls, so debug mode exposes the same transport-level evidence during "Test Connection" failures.
*   **Non-Desktop Runtime Fallback**: When desktop Node transport is unavailable, transient `requestUrl` disconnects now retry the same attempt through browser `fetch`, extending runtime resilience and provider connection testing to mobile/non-desktop environments.
*   **Chinese Preset Refresh**: Synced selected China-focused preset defaults with current `cline` model baselines, including `Qwen` -> `qwen3-235b-a22b`, `Moonshot` -> `kimi-k2-0905-preview`, and `MiniMax` -> `MiniMax-M2.7`.
*   **Regression Coverage**: Added focused tests for shared debug metadata rendering and interrupted desktop fallback responses with partial-body capture.

### Chinese (中文)
*   **跨 Provider 深度调试**: 共享的 LLM 传输/错误处理链路现在会为所有 Provider 记录按尝试维度展开的调试元数据，包括 transport 名称、脱敏后的请求 URL/请求头、耗时、响应头、部分响应体与堆栈信息。这样即使没有 Provider 特定日志，也能直接看见慢速上游网关重置或代理断连发生在哪一段链路上。
*   **连接测试调试一致性**: Provider 的连接探测现在复用与运行时调用相同的带仪表化请求路径，因此“测试连接”失败时，调试模式也会输出同等级别的 transport 证据。
*   **非桌面运行时回退**: 当桌面 Node 传输不可用时，`requestUrl` 的瞬时断连现在会在同一次调用内切换到浏览器 `fetch` 重试，从而将运行时鲁棒性和 Provider 连接测试能力扩展到移动端/非桌面环境。
*   **中国区预设刷新**: 已将部分中国区 Provider 预设默认模型同步到当前 `cline` 基线，包括 `Qwen` -> `qwen3-235b-a22b`、`Moonshot` -> `kimi-k2-0905-preview`、`MiniMax` -> `MiniMax-M2.7`。
*   **回归测试覆盖**: 新增共享调试元数据渲染测试，以及桌面端 fallback 在响应中途断开时对部分响应体的捕获测试。

---

## [1.7.6] - 2026-03-26

### English
*   **Runtime Transport Robustness**: Long-running LLM task calls now switch from Obsidian `requestUrl` to desktop `http/https` transport after transient disconnects such as `ERR_CONNECTION_CLOSED`, then continue into the existing stable retry sequence only if the fallback also fails. This hardens slow translation and generation jobs against proxy or gateway drops.
*   **China Provider Expansion Round 2**: Added first-class presets for `Qwen Code`, `Z AI`, and `Huawei Cloud MaaS`, with routing coverage, connection-test coverage, and synchronized English/Chinese provider documentation.
*   **Sidebar Footer Stability**: Refined the sidebar footer into a docked status/log area with a clearer standby progress state so the log panel remains visible and the ready-state progress area is readable even when every section is expanded.
*   **Regression Coverage**: Added focused runtime fallback tests for every active transport path plus sidebar DOM tests for the docked footer and standby progress state.

### Chinese (中文)
*   **运行时传输鲁棒性增强**: 长耗时 LLM 任务在遇到 `ERR_CONNECTION_CLOSED` 等瞬时断连时，现在会先从 Obsidian 的 `requestUrl` 切换到桌面端 `http/https` 传输；只有该回退也失败时，才进入原有稳定重试序列。慢速翻译和生成任务对代理/网关断连的容忍度明显提升。
*   **中国区 Provider 第二轮扩展**: 新增 `Qwen Code`、`Z AI`、`Huawei Cloud MaaS` 三个一等预设，并补齐运行时路由测试、连接测试覆盖以及中英文 Provider 文档说明。
*   **侧边栏底部区域稳定性提升**: 将侧边栏底部进一步整理为停靠式状态/日志区域，并增强 Ready 状态下的待机进度显示；即使所有分组全部展开，日志面板也不会继续被挤压到不可见。
*   **回归测试覆盖**: 新增覆盖全部活跃 transport 路径的运行时回退测试，以及锁定 docked footer 与 standby 进度态的 sidebar DOM 测试。

---

## [1.7.5] - 2026-03-26

### English
*   **Provider Connection Test Robustness**: Connection tests now fall back to the stable retry sequence after the first transient network disconnect instead of failing immediately, aligning the "Test Connection" button with the runtime resilience already used by task execution.
*   **Full Transport Coverage**: The transient-failure fallback now covers every transport used by built-in provider presets, including OpenAI-compatible providers, Anthropic, Google, Azure OpenAI, and Ollama.
*   **Regression Coverage**: Added focused provider-support tests for both runtime API calls and connection-test probes so transient disconnect handling stays locked in across transports.
*   **Documentation**: Updated the English and Chinese READMEs plus version metadata to document the new provider-connection retry behavior for `1.7.5`.

### Chinese (中文)
*   **Provider 连接测试鲁棒性增强**: 连接测试在首次遇到瞬时网络断连后，不会再立刻失败，而是会回退到稳定重试序列，使“测试连接”按钮与实际任务执行路径的鲁棒性保持一致。
*   **全 Transport 覆盖**: 这套瞬时失败回退机制现已覆盖所有内置 Provider 预设所使用的传输链路，包括 OpenAI-compatible、Anthropic、Google、Azure OpenAI 与 Ollama。
*   **回归测试覆盖**: 新增针对运行时 API 调用与连接测试探测链路的 Provider 支持测试，确保跨 transport 的瞬时断连处理不会回退。
*   **文档更新**: 已同步更新中英文 README 与版本元数据，记录 `1.7.5` 的 Provider 连接测试重试行为。

---

## [1.7.4] - 2026-03-26

### English
*   **Sidebar Layout Stability**: Reworked the sidebar into a scrollable action area plus a persistent footer so the progress card and log output remain visible even when all action groups are expanded.
*   **Clearer Progress Feedback**: Moved the percentage text into a dedicated status pill, kept the progress bar visible in the ready state, and improved visual contrast for the sidebar progress area.
*   **Regression Coverage**: Added focused sidebar DOM tests to lock in the persistent footer layout and the new progress summary behavior.
*   **Documentation**: Updated the English and Chinese READMEs to reflect the pinned sidebar telemetry layout.

### Chinese (中文)
*   **侧边栏布局稳定性**: 将侧边栏重构为可滚动的工作区加固定底部区域，即使所有动作分组全部展开，进度卡片和日志输出也不会被挤出视野。
*   **更清晰的进度反馈**: 将百分比文本移到独立状态标签中，保留 Ready 状态下可见的进度条，并增强侧边栏进度区域的视觉对比度。
*   **回归测试覆盖**: 新增聚焦侧边栏 DOM 的测试，锁定固定底部布局与新的进度摘要展示行为。
*   **文档更新**: 同步更新中英文 README，补充固定底部进度/日志布局说明。

---

## [1.6.5] - 2026-01-27

## Bug Fixes

### English
*   **Fix installation Error**: Delete the unused js files, Fix the Severe installation difficulties

### Chinese (中文)
*   **解决安装问题**: 删除无用js文件，解决了严重的安装问题。


---

## [1.6.4] - 2026-01-27

### English
*   **Search Engine Support**: Resolved issues with DuckDuckGo search by implementing a robust, modular architecture. The new `DuckDuckGoProvider` now uses DOMParser for reliable HTML parsing with a regex fallback, ensuring consistent search results even if the layout changes.
*   **Modular Architecture**: Refactored the search logic into a modular `SearchProvider` system, making it easier to add new search engines and maintain existing ones.
*   **Code Quality**: Integrated comprehensive unit tests for search providers to prevent regression.

### Chinese (中文)
*   **搜索引擎支持**: 通过实施稳健的模块化架构解决了DuckDuckGo搜索的问题。新的 `DuckDuckGoProvider` 现在使用 DOMParser 进行可靠的 HTML 解析，并带有正则表达式回退机制，即使布局发生变化也能确保一致的搜索结果。
*   **模块化架构**: 将搜索逻辑重构为模块化的 `SearchProvider` 系统，从而更易于添加新的搜索引擎和维护现有引擎。
*   **代码质量**: 集成了针对搜索提供商的全面单元测试，以防止回归。

## [1.6.3] - 2026-01-27

### English
*   **API Error Debugging**: Fixed an issue where the "API Error Debugging Mode" would not show the full error response body for certain providers (like LMStudio 429 errors). Now, detailed JSON responses and status codes are correctly captured and logged when this mode is enabled, aiding significantly in troubleshooting connectivity and rate-limit issues.

### Chinese (中文)
*   **API 错误调试**: 修复了“API 错误调试模式”无法显示某些提供商（如 LMStudio 429 错误）的完整错误响应正文的问题。现在，启用此模式后，可以正确捕获并记录详细的 JSON 响应和状态代码，极大地帮助排查连接和速率限制问题。

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
