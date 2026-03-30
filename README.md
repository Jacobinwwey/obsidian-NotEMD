![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd Plugin for Obsidian

[English](./README.md) | [简体中文](./README_zh.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 AI-Powered Multi-Languages Knowledge Enhancement
==================================================
```

A Easy way to create your own Knowledge-base!

Notemd enhances your Obsidian workflow by integrating with various Large Language Models (LLMs) to process your multi-languages notes, automatically generate wiki-links for key concepts, create corresponding concept notes, perform web research, helping you build powerful knowledge graphs and more.

**Version:** 1.7.11

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Supported LLM Providers](#supported-llm-providers)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

1.  **Install & Enable**: Get the plugin from the Obsidian Marketplace.
2.  **Configure LLM**: Go to `Settings -> Notemd`, select your LLM provider (like OpenAI or a local one like Ollama), and enter your API key/URL.
3.  **Open Sidebar**: Click the Notemd wand icon in the left ribbon to open the sidebar.
4.  **Process a Note**: Open any note and click **"Process File (Add Links)"** in the sidebar to automatically add `[[wiki-links]]` to key concepts.
5.  **Run a Quick Workflow**: Use the default **"One-Click Extract"** button to chain processing, batch generation, and Mermaid cleanup from one entry point.

That's it! Explore the settings to unlock more features like web research, translation, and content generation.

## Features

### AI-Powered Document Processing
- **Multi-LLM Support**: Connect to various cloud and local LLM providers (see [Supported LLM Providers](#supported-llm-providers)).
- **Smart Chunking**: Automatically splits large documents into manageable chunks based on word count for processing.
- **Content Preservation**: Aims to maintain original formatting while adding structure and links.
- **Progress Tracking**: Real-time updates via the Notemd Sidebar or a progress modal.
- **Cancellable Operations**: Cancel any processing task (single or batch) initiated from the sidebar via its dedicated cancel button. Command palette operations use a modal which can also be cancelled.
- **Multi-Model Configuration**: Use different LLM providers *and* specific models for different tasks (Add Links, Research, Generate Title, Translate) or use a single provider for all.
- **Stable API Calls (Retry Logic)**: Optionally enable automatic retries for failed LLM API calls with configurable interval and attempt limits.
- **Resilient Provider Connection Tests**: If the first provider test hits a transient network disconnect, Notemd now falls back to the stable retry sequence before failing, covering OpenAI-compatible, Anthropic, Google, Azure OpenAI, and Ollama transports.
- **Runtime Environment Transport Fallback**: When a long-running provider request is dropped by `requestUrl` with transient network errors such as `ERR_CONNECTION_CLOSED`, Notemd now retries the same attempt through environment-specific fallback transport before entering the configured retry loop: desktop builds use Node `http/https`, while non-desktop environments use browser `fetch`. This reduces false failures on slow gateways and reverse proxies.
- **OpenAI-Compatible Stable Long-Request Chain Hardening**: In stable mode, OpenAI-compatible calls now use an explicit 3-stage order for each attempt: primary direct streaming transport, then direct non-stream transport, then `requestUrl` fallback (which can still upgrade to streamed parsing when needed). This reduces false negatives where providers complete buffered responses but streaming pipes are unstable.
- **Protocol-Aware Streaming Fallback Across LLM APIs**: Long-running fallback attempts now upgrade to protocol-aware streamed parsing across every built-in LLM path, not just OpenAI-compatible endpoints. Notemd now handles OpenAI/Azure-style SSE, Anthropic Messages streaming, Google Gemini SSE responses, and Ollama NDJSON streams on both desktop `http/https` and non-desktop `fetch`, and the remaining direct OpenAI-style provider entrypoints reuse that same shared fallback path.
- **China-Ready Provider Presets**: Built-in presets now cover `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, and `SiliconFlow` in addition to the existing global and local providers.
- **Reliable Batch Processing**: Improved concurrent processing logic with **staggered API calls** to prevent rate-limiting errors and ensure stable performance during large batch jobs. The new implementation ensures that tasks are initiated at different intervals rather than all at once.
- **Accurate Progress Reporting**: Fixed a bug where the progress bar could get stuck, ensuring that the UI always reflects the true status of the operation.
- **Robust Parallel Batch Processing**: Resolved an issue where parallel batch operations would stall prematurely, ensuring all files are processed reliably and efficiently.
- **Progress Bar Accuracy**: Fixed a bug where the progress bar for the "Create Wiki-Link & Generate Note" command would get stuck at 95%, ensuring it now correctly shows 100% upon completion.
- **Enhanced API Debugging**: The "API Error Debugging Mode" now captures full response bodies from LLM providers and search services (Tavily/DuckDuckGo), and also records a per-attempt transport timeline with sanitized request URLs, elapsed duration, response headers, partial response bodies, parsed partial stream content, and stack traces for better troubleshooting across OpenAI-compatible, Anthropic, Google, Azure OpenAI, and Ollama fallbacks.
- **Developer Mode Panel**: Settings now include a dedicated developer-only diagnostics panel that stays hidden unless "Developer mode" is enabled. It supports selecting diagnostic call paths and running repeated stability probes for the selected mode.
- **Redesigned Sidebar**: Built-in actions are grouped into focused sections with clearer labels, live status, cancellable progress, and copyable logs to reduce sidebar clutter. The progress/log footer now stays visible even when every section is expanded, and the ready state uses a clearer standby progress track.
- **Custom One-Click Workflows**: Turn built-in sidebar utilities into reusable custom buttons with user-defined names and assembled action chains. A default `One-Click Extract` workflow is included out of the box.


### Knowledge Graph Enhancement
- **Automatic Wiki-Linking**: Identifies and adds `[[wiki-links]]` to core concepts within your processed notes based on LLM output.
- **Concept Note Creation (Optional & Customizable)**: Automatically creates new notes for discovered concepts in a specified vault folder.
- **Customizable Output Paths**: Configure separate relative paths within your vault for saving processed files and newly created concept notes.
- **Customizable Output Filenames (Add Links)**: Optionally **overwrite the original file** or use a custom suffix/replacement string instead of the default `_processed.md` when processing files for links.
- **Link Integrity Maintenance**: Basic handling for updating links when notes are renamed or deleted within the vault.
- **Pure Concept Extraction**: Extract concepts and create corresponding concept notes without modifying the original document. This is ideal for populating a knowledge base from existing documents without altering them. This feature has configurable options for creating minimal concept notes and adding backlinks. This feature has configurable options for creating minimal concept notes and adding backlinks.


### Translation

- **AI-Powered Translation**:
    - Translate note content using the configured LLM.
    - **Large File Support**: Automatically splits large files into smaller chunks based on the `Chunk word count` setting before sending them to the LLM. The translated chunks are then seamlessly combined back into a single document.
    - Supports translation between multiple languages.
    - Customizable target language in settings or in UI.
    - Automatically open the translated text on the right side of the original text for easy reading.
- **Batch Translate**:
    - Translate all files within a selected folder.
    - Supports parallel processing when "Enable Batch Parallelism" is on.
    - Uses custom prompts for translation if configured.
	- Adds a "Batch translate this folder" option to the file explorer context menu.
- **Disable auto translation**: When this option is enabled, non-Translate tasks will no longer force outputs into a specific language, preserving the original language context. The explicit "Translate" task will still perform translation as configured.


### Web Research & Content Generation
- **Web Research & Summarization**:
    - Perform web searches using Tavily (requires API key) or DuckDuckGo (experimental).
    - **Improved Search Robustness**: DuckDuckGo search now features enhanced parsing logic (DOMParser with Regex fallback) to handle layout changes and ensure reliable results.
    - Summarize search results using the configured LLM.
    - The output language of the summary can be customized in the settings.
    - Append summaries to the current note.
    - Configurable token limit for research content sent to the LLM.
- **Content Generation from Title**:
    - Use the note title to generate initial content via LLM, replacing existing content.
    - **Optional Research**: Configure whether to perform web research (using the selected provider) to provide context for generation.
- **Batch Content Generation from Titles**: Generate content for all notes within a selected folder based on their titles (respects the optional research setting). Successfully processed files are moved to a **configurable "complete" subfolder** (e.g., `[foldername]_complete` or a custom name) to avoid reprocessing.
- **Mermaid Auto-Fix Coupling**: When Mermaid auto-fix is enabled, Mermaid-related workflows now automatically repair generated files or output folders after processing. This covers Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid, and Translate flows.


### Utility Features
- **Summarise as Mermaid diagram**:
    - This feature allows you to summarize the content of a note into a Mermaid diagram.
    - The output language of the Mermaid diagram can be customized in the settings.
    - **Mermaid Output Folder**: Configure the folder where the generated Mermaid diagram files will be saved.
    - **Translate Summarize to Mermaid Output**: Optionally translate the generated Mermaid diagram content into the configured target language.
    - 
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Simple Formula Format Correction**:
    - Quickly fixes single-line math formulas delimited by single `$` to standard double `$$` blocks.
    - **Single File**: Process the current file via the sidebar button or command palette.
    - **Batch Fix**: Process all files in a selected folder via the sidebar button or command palette.

- **Check for Duplicates in Current File**: This command helps identify potential duplicate terms within the active file.
- **Duplicate Detection**: Basic check for duplicate words within the currently processed file's content (results logged to console).
- **Check and Remove Duplicate Concept Notes**: Identifies potential duplicate notes within the configured **Concept Note Folder** based on exact name matches, plurals, normalization, and single-word containment compared to notes outside the folder. The scope of the comparison (which notes outside the concept folder are checked) can be configured to the **entire vault**, **specific included folders**, or **all folders excluding specific ones**. Presents a detailed list with reasons and conflicting files, then prompts for confirmation before moving identified duplicates to system trash. Shows progress during deletion.
- **Batch Mermaid Fix**: Applies Mermaid and LaTeX syntax corrections to all Markdown files within a user-selected folder.
    - **Workflow Ready**: Can be used as a standalone utility or as a step inside a custom one-click workflow button.
    - **Error Reporting**: Generates a `mermaid_error_{foldername}.md` report listing files that still contain potential Mermaid errors after processing.
    - **Move Error Files**: Optionally moves files with detected errors to a specified folder for manual review.
    - **Smart Detection**: Now intelligently checks files for syntax errors using `mermaid.parse` before attempting fixes, saving processing time and avoiding unnecessary edits.
    - **Safe Processing**: Ensures syntax fixes are applied exclusively to Mermaid code blocks, preventing accidental modification of Markdown tables or other content. Includes robust safeguards to protect table syntax (e.g., `| :--- |`) from aggressive debug fixes.
    - **Deep Debug Mode**: If errors persist after the initial fix, an advanced deep debug mode is triggered. This mode handles complex edge cases, including:
        - **Comment Integration**: Automatically merges trailing comments (starting with `%`) into the edge label (e.g., `A -- Label --> B; % Comment` becomes `A -- "Label(Comment)" --> B;`).
        - **Malformed Arrows**: Fixes arrows absorbed into quotes (e.g., `A -- "Label -->" B` becomes `A -- "Label" --> B`).
        - **Inline Subgraphs**: Converts inline subgraph labels to edge labels.
        - **Reverse Arrow Fix**: Corrects non-standard `X <-- Y` arrows to `Y --> X`.
        - **Direction Keyword Fix**: Ensures `direction` keyword is lowercase inside subgraphs (e.g., `Direction TB` -> `direction TB`).
        - **Comment Conversion**: Converts `//` comments into edge labels (e.g., `A --> B; // Comment` -> `A -- "Comment" --> B;`).
        - **Duplicate Label Fix**: Simplifies repeated bracketed labels (e.g., `Node["Label"]["Label"]` -> `Node["Label"]`).
        - **Invalid Arrow Fix**: Converts invalid arrow syntax `--|>` to the standard `-->`.
        - **Robust Label & Note Handling**: Improved handling for labels containing special characters (like `/`) and better support for custom note syntax (`note for ...`), ensuring artifacts like trailing brackets are cleanly removed.
        - **Advanced Fix Mode**: Includes robust fixes for unquoted node labels containing spaces, special characters, or nested brackets (e.g., `Node[Label [Text]]` -> `Node["Label [Text]"]`), ensuring compatibility with complex diagrams like Stellar Evolution paths. Also corrects malformed edge labels (e.g., `--["Label["-->` to `-- "Label" -->`). Additionally converts inline comments (`Consensus --> Adaptive; # Some advanced consensus` to `Consensus -- "Some advanced consensus" --> Adaptive`) and fixes incomplete quotes at line ends (`;"` at the end replaced with `"]`).
                        - **Note Conversion**: Automatically converts `note right/left of` and standalone `note :` comments into standard Mermaid node definitions and connections (e.g., `note right of A: text` becomes `NoteA["Note: text"]` linked to `A`), preventing syntax errors and improving layout. Now supports both arrow links (`-->`) and solid links (`---`).
                        - **Extended Note Support**: Automatically converts `note for Node "Content"` and `note of Node "Content"` into standard linked note nodes (e.g. `NoteNode[" Content"]` linked to `Node`), ensuring compatibility with user-extended syntax.
                        - **Enhanced Note Correction**: Automatically renames notes with sequential numbering (e.g., `Note1`, `Note2`) to prevent aliasing issues when multiple notes are present.                - **Parallelogram/Shape Fix**: Corrects malformed node shapes like `[/["Label["/]` to standard `["Label"]`, ensuring compatibility with generated content.
                        - **Standardize Pipe Labels**: Automatically fixes and standardizes edge labels containing pipes, ensuring they are properly quoted (e.g., `-->|Text|` becomes `-->|"Text"|` and `-->|Math|^2|` becomes `-->|"Math|^2"|`).
        - **Misplaced Pipe Fix**: Corrects misplaced edge labels appearing before the arrow (e.g., `>|"Label"| A --> B` becomes `A -->|"Label"| B`).
                - **Merge Double Labels**: Detects and merges complex double labels on a single edge (e.g., `A -- Label1 -- Label2 --> B` or `A -- Label1 -- Label2 --- B`) into a single, clean label with line breaks (`A -- "Label1<br>Label2" --> B`).
                        - **Unquoted Label Fix**: Automatically quotes node labels that contain potentially problematic characters (e.g., quotes, equals signs, math operators) but are missing outer quotes (e.g., `Plot[Plot "A"]` becomes `Plot["Plot "A""]`), preventing render errors.
                        - **Intermediate Node Fix**: Splits edges that contain an intermediate node definition into two separate edges (e.g., `A -- B[...] --> C` becomes `A --> B[...]` and `B[...] --> C`), ensuring valid Mermaid syntax.
                        - **Concatenated Label Fix**: Robustly fixes node definitions where the ID is concatenated with the label (e.g., `SubdivideSubdivide...` becomes `Subdivide["Subdivide..."]`), even when preceded by pipe labels or when the duplication isn't exact, by validating against known node IDs.
                        - **Extract Specific Original Text**:    - Define a list of questions in settings.
                    - Extracts verbatim text segments from the active note that answer these questions.
                    - **Merged Query Mode**: Option to process all questions in a single API call for efficiency.
                    - **Translation**: Option to include translations of the extracted text in the output.
                    - **Custom Output**: Configurable save path and filename suffix for the extracted text file.- **LLM Connection Test**: Verify API settings for the active provider.


## Installation

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### From Obsidian Marketplace (Recommended)
1. Open Obsidian **Settings** → **Community plugins**.
2. Ensure "Restricted mode" is **off**.
3. Click **Browse** community plugins and search for "Notemd".
4. Click **Install**.
5. Once installed, click **Enable**.

### Manual Installation
1. Download the latest release assets from the [GitHub Releases page](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Each release also includes `README.md` for packaged reference, but manual installation only requires `main.js`, `styles.css`, and `manifest.json`.
2. Navigate to your Obsidian vault's configuration folder: `<YourVault>/.obsidian/plugins/`.
3. Create a new folder named `notemd`.
4. Copy `main.js`, `styles.css`, and `manifest.json` into the `notemd` folder.
5. Restart Obsidian.
6. Go to **Settings** → **Community plugins** and enable "Notemd".

## Configuration

Access plugin settings via:
**Settings** → **Community Plugins** → **Notemd** (Click the gear icon).

### LLM Provider Configuration
1.  **Active Provider**: Select the LLM provider you want to use from the dropdown menu.
2.  **Provider Settings**: Configure the specific settings for the selected provider:
    *   **API Key**: Required for most cloud providers (e.g., OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Not needed for Ollama. Optional for LM Studio and the generic `OpenAI Compatible` preset when your endpoint accepts anonymous or placeholder access.
    *   **Base URL / Endpoint**: The API endpoint for the service. Defaults are provided, but you may need to change this for local models (LMStudio, Ollama), gateways (OpenRouter, Requesty, OpenAI Compatible), or specific Azure deployments. **Required for Azure OpenAI.**
    *   **Model**: The specific model name/ID to use (e.g., `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Ensure the model is available at your endpoint/provider.
    *   **Temperature**: Controls the randomness of the LLM's output (0=deterministic, 1=max creativity). Lower values (e.g., 0.2-0.5) are generally better for structured tasks.
    *   **API Version (Azure Only)**: Required for Azure OpenAI deployments (e.g., `2024-02-15-preview`).
3.  **Test Connection**: Use the "Test Connection" button for the active provider to verify your settings. OpenAI-compatible providers now use provider-aware checks: endpoints such as `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio`, and `OpenAI Compatible` probe `chat/completions` directly, while providers with a reliable `/models` endpoint can still use model listing first. If the first probe fails with a transient network disconnect such as `ERR_CONNECTION_CLOSED`, Notemd automatically falls back to the stable retry sequence instead of failing immediately.
4.  **Manage Provider Configurations**: Use the "Export Providers" and "Import Providers" buttons to save/load your LLM provider settings to/from a `notemd-providers.json` file within the plugin's configuration directory. This allows for easy backup and sharing.
5.  **Preset Coverage**: In addition to the original providers, Notemd now includes preset entries for `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty`, and a generic `OpenAI Compatible` target for LiteLLM, vLLM, Perplexity, Vercel AI Gateway, or custom proxies.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Multi-Model Configuration
-   **Use Different Providers for Tasks**:
    *   **Disabled (Default)**: Uses the single "Active Provider" (selected above) for all tasks.
    *   **Enabled**: Allows you to select a specific provider *and* optionally override the model name for each task ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts"). If the model override field for a task is left blank, it will use the default model configured for that task's selected provider.
-   **Select different languages for different tasks**:
    *   **Disabled (Default)**: Uses the single "Output language" for all tasks.
    *   **Enabled**: Allows you to select a specific language for each task ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Stable API Call Settings
-   **Enable Stable API Calls (Retry Logic)**:
    *   **Disabled (Default)**: A single API call failure will stop the current task.
    *   **Enabled**: Automatically retries failed LLM API calls (useful for intermittent network issues or rate limits).
    *   **Connection Test Fallback**: Even when normal calls are not already running in stable mode, provider connection tests now switch into the same retry sequence after the first transient network failure.
    *   **Runtime Transport Fallback (Environment-Aware)**: Long-running task requests that are transiently dropped by `requestUrl` now retry the same attempt through an environment-aware fallback first. Desktop builds use Node `http/https`; non-desktop environments use browser `fetch`. Those fallback attempts now use protocol-aware streaming parsing across the built-in LLM paths, covering OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE, and Ollama NDJSON output, so slow gateways can return body chunks earlier. The remaining direct OpenAI-style provider entrypoints reuse that same shared fallback path.
    *   **OpenAI-Compatible Stable Order**: In stable mode, each OpenAI-compatible attempt now follows `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` before counting as a failed attempt. This prevents overly aggressive failures when only one transport mode is flaky.
-   **Retry Interval (seconds)**: (Visible only when enabled) Time to wait between retry attempts (1-300 seconds). Default: 5.
-   **Maximum Retries**: (Visible only when enabled) Maximum number of retry attempts (0-10). Default: 3.
-   **API Error Debugging Mode**:
    *   **Disabled (Default)**: Uses standard, concise error reporting.
    *   **Enabled**: Activates detailed error logging (similar to DeepSeek's verbose output) for all providers and tasks (including Translate, Search, and Connection Tests). This includes HTTP status codes, raw response text, request transport timelines, sanitized request URLs and headers, elapsed attempt durations, response headers, partial response bodies, parsed partial stream output, and stack traces, which is crucial for troubleshooting API connection issues and upstream gateway resets.
-   **Developer Mode**:
    *   **Disabled (Default)**: Hides all developer-only diagnostics controls from normal users.
    *   **Enabled**: Shows a dedicated developer diagnostics panel in Settings.
-   **Developer Provider Diagnostic (Long Request)**:
    *   **Diagnostic Call Mode**: Choose runtime path per probe. OpenAI-compatible providers support additional forced modes (`direct streaming`, `direct buffered`, `requestUrl-only`) besides runtime modes.
    *   **Run Diagnostic**: Runs one long-request probe with the selected call mode and writes `Notemd_Provider_Diagnostic_*.txt` in vault root.
    *   **Run Stability Test**: Repeats the probe for configurable runs (1-10) using the selected call mode and saves an aggregated stability report.
    *   **Diagnostic Timeout**: Configurable timeout per run (15-3600 seconds).
    *   **Why Use It**: Faster than manual reproduction when a provider passes "Test connection" but fails on real long-running tasks (for example, translation on slow gateways).
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### General Settings

#### Processed File Output
-   **Customize Processed File Save Path**:
    *   **Disabled (Default)**: Processed files (e.g., `YourNote_processed.md`) are saved in the *same folder* as the original note.
    *   **Enabled**: Allows you to specify a custom save location.
-   **Processed File Folder Path**: (Visible only when the above is enabled) Enter a *relative path* within your vault (e.g., `Processed Notes` or `Output/LLM`) where processed files should be saved. Folders will be created if they don't exist. **Do not use absolute paths (like C:\...) or invalid characters.**
-   **Use Custom Output Filename for 'Add Links'**:
    *   **Disabled (Default)**: Processed files created by the 'Add Links' command use the default `_processed.md` suffix (e.g., `YourNote_processed.md`).
    *   **Enabled**: Allows you to customize the output filename using the setting below.
-   **Custom Suffix/Replacement String**: (Visible only when the above is enabled) Enter the string to use for the output filename.
    *   If left **empty**, the original file will be **overwritten** with the processed content.
    *   If you enter a string (e.g., `_linked`), it will be appended to the original base name (e.g., `YourNote_linked.md`). Ensure the suffix doesn't contain invalid filename characters.

-   **Remove Code Fences on Add Links**:
    *   **Disabled (Default)**: Code fences **(\`\\\`\`)** are kept in the content when adding links, and **(\`\\\`markdown)** will be delete automaticly.
    *   **Enabled**: Removes code fences from the content before adding links.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Concept Note Output
-   **Customize Concept Note Path**:
    *   **Disabled (Default)**: Automatic creation of notes for `[[linked concepts]]` is disabled.
    *   **Enabled**: Allows you to specify a folder where new concept notes will be created.
-   **Concept Note Folder Path**: (Visible only when the above is enabled) Enter a *relative path* within your vault (e.g., `Concepts` or `Generated/Topics`) where new concept notes should be saved. Folders will be created if they don't exist. **Must be filled if customization is enabled.** **Do not use absolute paths or invalid characters.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Concept Log File Output
-   **Generate Concept Log File**:
    *   **Disabled (Default)**: No log file is generated.
    *   **Enabled**: Creates a log file listing newly created concept notes after processing. The format is:
        ```
        generate xx concepts md file
        1. concepts1
        2. concepts2
        ...
        n. conceptsn
        ```
-   **Customize Log File Save Path**: (Visible only when "Generate Concept Log File" is enabled)
    *   **Disabled (Default)**: The log file is saved in the **Concept Note Folder Path** (if specified) or the vault root otherwise.
    *   **Enabled**: Allows you to specify a custom folder for the log file.
-   **Concept Log Folder Path**: (Visible only when "Customize Log File Save Path" is enabled) Enter a *relative path* within your vault (e.g., `Logs/Notemd`) where the log file should be saved. **Must be filled if customization is enabled.**
-   **Customize Log File Name**: (Visible only when "Generate Concept Log File" is enabled)
    *   **Disabled (Default)**: The log file is named `Generate.log`.
    *   **Enabled**: Allows you to specify a custom name for the log file.
-   **Concept Log File Name**: (Visible only when "Customize Log File Name" is enabled) Enter the desired file name (e.g., `ConceptCreation.log`). **Must be filled if customization is enabled.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Extract Concepts Task
-   **Create minimal concept notes**:
    *   **On (Default)**: Newly created concept notes will only contain the title (e.g., `# Concept`).
    *   **Off**: Concept notes may include additional content, such as a "Linked From" backlink, if not disabled by the setting below.
-   **Add "Linked From" backlink**:
    *   **Off (Default)**: Does not add a backlink to the source document in the concept note during extraction.
    *   **On**: Adds a "Linked From" section with a backlink to the source file.

#### Extract Specific Original Text
-   **Questions for extraction**: Enter a list of questions (one per line) that you want the AI to extract verbatim answers for from your notes.
-   **Translate output to corresponding language**:
    *   **Off (Default)**: Outputs only the extracted text in its original language.
    *   **On**: Appends a translation of the extracted text in the language selected for this task.
-   **Merged query mode**:
    *   **Off**: Processes each question individually (higher precision but more API calls).
    *   **On**: Sends all questions in a single prompt (faster and fewer API calls).
-   **Customise extracted text save path & filename**:
    *   **Off**: Saves to the same folder as the original file with `_Extracted` suffix.
    *   **On**: Allows you to specify a custom output folder and filename suffix.

#### Batch Mermaid Fix
-   **Enable Mermaid Error Detection**:
    *   **Off (Default)**: Error detection is skipped after processing.
    *   **On**: Scans processed files for remaining Mermaid syntax errors and generates a `mermaid_error_{foldername}.md` report.
-   **Move files with Mermaid errors to specified folder**:
    *   **Off**: Files with errors remain in place.
    *   **On**: Moves any files that still contain Mermaid syntax errors after the fix attempt to a dedicated folder for manual review.
-   **Mermaid error folder path**: (Visible if above is enabled) The folder to move error files to.

#### Processing Parameters
-   **Enable Batch Parallelism**:
    *   **Disabled (Default)**: Batch processing tasks (like "Process Folder" or "Batch Generate from Titles") process files one by one (serially).
    *   **Enabled**: Allows the plugin to process multiple files concurrently, which can significantly speed up large batch jobs.
-   **Batch Concurrency**: (Visible only when parallelism is enabled) Sets the maximum number of files to process in parallel. A higher number can be faster but uses more resources and may hit API rate limits. (Default: 1, Range: 1-20)
-   **Batch Size**: (Visible only when parallelism is enabled) The number of files to group into a single batch. (Default: 50, Range: 10-200)
-   **Delay Between Batches (ms)**: (Visible only when parallelism is enabled) An optional delay in milliseconds between processing each batch, which can help manage API rate limits. (Default: 1000ms)
-   **API Call Interval (ms)**: Minimum delay in milliseconds *before and after* each individual LLM API call. Crucial for low-rate APIs or to prevent 429 errors. Set to 0 for no artificial delay. (Default: 500ms)
-   **Chunk Word Count**: Maximum words per chunk sent to the LLM. Affects the number of API calls for large files. (Default: 3000)
-   **Enable Duplicate Detection**: Toggles the basic check for duplicate words within processed content (results in console). (Default: Enabled)
-   **Max Tokens**: Maximum tokens the LLM should generate per response chunk. Affects cost and detail. (Default: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Translation
-   **Default Target Language**: Select the default language you want to translate your notes into. This can be overridden in the UI when running the translation command. (Default: English)
-   **Customise Translation File Save Path**:
    *   **Disabled (Default)**: Translated files are saved in the *same folder* as the original note.
    *   **Enabled**: Allows you to specify a *relative path* within your vault (e.g., `Translations`) where translated files should be saved. Folders will be created if they don't exist.
-   **Use custom suffix for translated files**:
    *   **Disabled (Default)**: Translated files use the default `_translated.md` suffix (e.g., `YourNote_translated.md`).
    *   **Enabled**: Allows you to specify a custom suffix.
-   **Custom Suffix**: (Visible only when the above is enabled) Enter the custom suffix to append to translated filenames (e.g., `_es` or `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Content Generation
-   **Enable Research in "Generate from Title"**:
    *   **Disabled (Default)**: "Generate from Title" uses only the title as input.
    *   **Enabled**: Performs web research using the configured **Web Research Provider** and includes the findings as context for the LLM during title-based generation.
-   **Auto-run Mermaid Syntax Fix after Generation**:
    *   **Enabled (Default)**: Automatically runs a Mermaid syntax-fixing pass after Mermaid-related workflows such as Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid, and Translate.
    *   **Disabled**: Leaves generated Mermaid output untouched unless you run `Batch Mermaid Fix` manually or add it to a custom workflow.
-   **Output Language**: (New) Select the desired output language for "Generate from Title" and "Batch Generate from Title" tasks.
    *   **English (Default)**: Prompts are processed and output in English.
    *   **Other Languages**: The LLM is instructed to perform its reasoning in English but provide the final documentation in your selected language (e.g., Español, Français, 简体中文, 繁體中文, العربية, हिन्दी, etc.).
-   **Change Prompt Word**: (New)
    *   **Change Prompt Word**: Allows you to change the prompt word for a specific task.
    *   **Custom Prompt Word**: Enter your custom prompt word for the task.
-   **Use Custom Output Folder for 'Generate from Title'**:
    *   **Disabled (Default)**: Successfully generated files are moved to a subfolder named `[OriginalFolderName]_complete` relative to the original folder's parent (or `Vault_complete` if the original folder was the root).
    *   **Enabled**: Allows you to specify a custom name for the subfolder where completed files are moved.
-   **Custom Output Folder Name**: (Visible only when the above is enabled) Enter the desired name for the subfolder (e.g., `Generated Content`, `_complete`). Invalid characters are not allowed. Defaults to `_complete` if left empty. This folder is created relative to the original folder's parent directory.

#### One-click Workflow Buttons
-   **Visual Workflow Builder**: Create custom workflow buttons from built-in actions without hand-writing the DSL.
-   **Custom Workflow Buttons DSL**: Advanced users can still edit the workflow definition text directly. Invalid DSL falls back to the default workflow safely and shows a warning in the sidebar/settings UI.
-   **Workflow Error Strategy**:
    *   **Stop on Error (Default)**: Stops the workflow immediately when one step fails.
    *   **Continue on Error**: Continues running later steps and reports the number of failed actions at the end.
-   **Default Workflow Included**: `One-Click Extract` chains `Process File (Add Links)`, `Batch Generate from Titles`, and `Batch Mermaid Fix`.

#### Custom Prompt Settings
This feature allows you to override the default instructions (prompts) sent to the LLM for specific tasks, giving you fine-grained control over the output.

-   **Enable Custom Prompts for Specific Tasks**:
    *   **Disabled (Default)**: The plugin uses its built-in default prompts for all operations.
    *   **Enabled**: Activates the ability to set custom prompts for the tasks listed below. This is the master switch for this feature.

-   **Use Custom Prompt for [Task Name]**: (Visible only when the above is enabled)
    *   For each supported task ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts"), you can individually enable or disable your custom prompt.
    *   **Disabled**: This specific task will use the default prompt.
    *   **Enabled**: This task will use the text you provide in the corresponding "Custom Prompt" text area below.

-   **Custom Prompt Text Area**: (Visible only when a task's custom prompt is enabled)
    *   **Default Prompt Display**: For your reference, the plugin displays the default prompt that it would normally use for the task. You can use the **"Copy Default Prompt"** button to copy this text as a starting point for your own custom prompt.
    *   **Custom Prompt Input**: This is where you write your own instructions for the LLM.
    *   **Placeholders**: You can (and should) use special placeholders in your prompt, which the plugin will replace with actual content before sending the request to the LLM. Refer to the default prompt to see which placeholders are available for each task. Common placeholders include:
        *   `{TITLE}`: The title of the current note.
        *   `{RESEARCH_CONTEXT_SECTION}`: The content gathered from web research.
        *   `{USER_PROMPT}`: The content of the note being processed.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Duplicate Check Scope
-   **Duplicate Check Scope Mode**: Controls which files are checked against the notes in your Concept Note Folder for potential duplicates.
    *   **Entire Vault (Default)**: Compares concept notes against all other notes in the vault (excluding the Concept Note Folder itself).
    *   **Include Specific Folders Only**: Compares concept notes only against notes within the folders listed below.
    *   **Exclude Specific Folders**: Compares concept notes against all notes *except* those within the folders listed below (and also excluding the Concept Note Folder).
    *   **Concept Folder Only**: Compares concept notes only against *other notes within the Concept Note Folder*. This helps find duplicates purely inside your generated concepts.
-   **Include/Exclude Folders**: (Visible only if Mode is 'Include' or 'Exclude') Enter the *relative paths* of the folders you want to include or exclude, **one path per line**. Paths are case-sensitive and use `/` as the separator (e.g., `Reference Material/Papers` or `Daily Notes`). These folders cannot be the same as or inside the Concept Note Folder.

#### Web Research Provider
-   **Search Provider**: Choose between `Tavily` (requires API key, recommended) and `DuckDuckGo` (experimental, often blocked by the search engine for automated requests). Used for "Research & Summarize Topic" and optionally for "Generate from Title".
-   **Tavily API Key**: (Visible only if Tavily is selected) Enter your API key from [tavily.com](https://tavily.com/).
-   **Tavily Max Results**: (Visible only if Tavily is selected) Maximum number of search results Tavily should return (1-20). Default: 5.
-   **Tavily Search Depth**: (Visible only if Tavily is selected) Choose `basic` (default) or `advanced`. Note: `advanced` provides better results but costs 2 API credits per search instead of 1.
-   **DuckDuckGo Max Results**: (Visible only if DuckDuckGo is selected) Maximum number of search results to parse (1-10). Default: 5.
-   **DuckDuckGo Content Fetch Timeout**: (Visible only if DuckDuckGo is selected) Maximum seconds to wait when trying to fetch content from each DuckDuckGo result URL. Default: 15.
-   **Max Research Content Tokens**: Approximate maximum tokens from combined web research results (snippets/fetched content) to include in the summarization prompt. Helps manage context window size and cost. (Default: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Focused Learning Domain
-   **Enable Focused Learning Domain**:
    *   **Disabled (Default)**: Prompts sent to the LLM use the standard, general-purpose instructions.
    *   **Enabled**: Allows you to specify one or more fields of study to improve the LLM's contextual understanding.
-   **Learning Domain**: (Visible only when the above is enabled) Enter your specific field(s), e.g., 'Materials Science', 'Polymer Physics', 'Machine Learning'. This will add a "Relevant Fields: [...]" line to the beginning of prompts, helping the LLM generate more accurate and relevant links and content for your specific area of study.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />


## Usage Guide

### Quick Workflows & Sidebar

-   Open the Notemd sidebar to access grouped action sections for core processing, generation, translation, knowledge, and utilities.
-   Use the **Quick Workflows** area at the top of the sidebar to launch custom multi-step buttons.
-   The default **One-Click Extract** workflow runs `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
-   Workflow progress, per-step logs, and failures are shown in the sidebar, with a pinned footer that protects the progress bar and log area from being squeezed out by expanded sections.
-   The progress card keeps status text, a dedicated percentage pill, and time remaining readable at a glance, and the same custom workflows can be reconfigured from settings.

### Original Processing (Adding Wiki-Links)
This is the core functionality focused on identifying concepts and adding `[[wiki-links]]`.

**Important:** This process only works on `.md` or `.txt` files. You can convert PDF files to MD files for free using [Mineru](https://github.com/opendatalab/MinerU) before further processing.

1.  **Using the Sidebar**:
    *   Open the Notemd Sidebar (wand icon or command palette).
    *   Open the `.md` or `.txt` file.
    *   Click **"Process File (Add Links)"**.
    *   To process a folder: Click **"Process Folder (Add Links)"**, select the folder, and click "Process".
    *   Progress is shown in the sidebar. You can cancel the task using the "Cancel Processing" button in the sidebar.
    *   *Note for folder processing:* Files are processed in the background without being opened in the editor.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Using the Command Palette** (`Ctrl+P` or `Cmd+P`):
    *   **Single File**: Open the file and run `Notemd: Process Current File`.
    *   **Folder**: Run `Notemd: Process Folder`, then select the folder. Files are processed in the background without being opened in the editor.
    *   A progress modal appears for command palette actions, which includes a cancel button.
    *   *Note:* the plugin automatically removes leading `\boxed{` and trailing `}` lines if found in the final processed content before saving.

### New Features

1.  **Summarise as Mermaid diagram**:
    *   Open the note you want to summarize.
    *   Run the command `Notemd: Summarise as Mermaid diagram` (via command palette or sidebar button).
    *   The plugin will generate a new note with the Mermaid diagram.

2.  **Translate Note/Selection**:
    *   Select text in a note to translate just that selection, or invoke the command with no selection to translate the entire note.
    *   Run the command `Notemd: Translate Note/Selection` (via command palette or sidebar button).
    *   A modal will appear allowing you to confirm or change the **Target Language** (defaulting to the setting specified in Configuration).
    *   The plugin uses the configured **LLM Provider** (based on Multi-Model settings) to perform the translation.
    *   The translated content is saved to the configured **Translation Save Path** with the appropriate suffix, and opened in a **new pane to the right** of the original content for easy comparison.
    *   You can cancel this task via the sidebar button or modal cancel button.
3.  **Batch Translate**:
    *   Run the command `Notemd: Batch Translate Folder` from the command palette and select a folder, or right-click a folder in the file explorer and choose "Batch translate this folder".
    *   The plugin will translate all Markdown files in the selected folder.
    *   Translated files are saved to the configured translation path but are not opened automatically.
    *   This process can be cancelled via the progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Research & Summarize Topic**:
    *   Select text in a note OR ensure the note has a title (this will be the search topic).
    *   Run the command `Notemd: Research and Summarize Topic` (via command palette or sidebar button).
    *   The plugin uses the configured **Search Provider** (Tavily/DuckDuckGo) and the appropriate **LLM Provider** (based on Multi-Model settings) to find and summarize information.
    *   The summary is appended to the current note.
    *   You can cancel this task via the sidebar button or modal cancel button.
    *   *Note:* DuckDuckGo searches may fail due to bot detection. Tavily is recommended.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Generate Content from Title**:
    *   Open a note (it can be empty).
    *   Run the command `Notemd: Generate Content from Title` (via command palette or sidebar button).
    *   The plugin uses the appropriate **LLM Provider** (based on Multi-Model settings) to generate content based on the note's title, replacing any existing content.
    *   If the **"Enable Research in 'Generate from Title'"** setting is enabled, it will first perform web research (using the configured **Web Research Provider**) and include that context in the prompt sent to the LLM.
    *   You can cancel this task via the sidebar button or modal cancel button.

5.  **Batch Generate Content from Titles**:
    *   Run the command `Notemd: Batch Generate Content from Titles` (via command palette or sidebar button).
    *   Select the folder containing the notes you want to process.
    *   The plugin will iterate through each `.md` file in the folder (excluding `_processed.md` files and files in the designated "complete" folder), generating content based on the note's title and replacing existing content. Files are processed in the background without being opened in the editor.
    *   Successfully processed files are moved to the configured "complete" folder.
    *   This command respects the **"Enable Research in 'Generate from Title'"** setting for each note processed.
    *   You can cancel this task via the sidebar button or modal cancel button.
    *   Progress and results (number of files modified, errors) are shown in the sidebar/modal log.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Check and Remove Duplicate Concept Notes**:
    *   Ensure the **Concept Note Folder Path** is correctly configured in settings.
    *   Run `Notemd: Check and Remove Duplicate Concept Notes` (via command palette or sidebar button).
    *   The plugin scans the concept note folder and compares filenames against notes outside the folder using several rules (exact match, plurals, normalization, containment).
    *   If potential duplicates are found, a modal window appears listing the files, the reason they were flagged, and the conflicting files.
    *   Review the list carefully. Click **"Delete Files"** to move the listed files to the system trash, or **"Cancel"** to take no action.
    *   Progress and results are shown in the sidebar/modal log.

7.  **Extract Concepts (Pure Mode)**:
    *   This feature allows you to extract concepts from a document and create the corresponding concept notes *without* altering the original file. It's perfect for quickly populating your knowledge base from a set of documents.
    *   **Single File**: Open a file and run the command `Notemd: Extract concepts (create concept notes only)` from the command palette or click the **"Extract concepts (current file)"** button in the sidebar.
    *   **Folder**: Run the command `Notemd: Batch extract concepts from folder` from the command palette or click the **"Extract concepts (folder)"** button in the sidebar, then select a folder to process all its notes.
    *   The plugin will read the files, identify concepts, and create new notes for them in your designated **Concept Note Folder**, leaving your original files untouched.

8.  **Create Wiki-Link & Generate Note from Selection**:
    *   This powerful command streamlines the process of creating and populating new concept notes.
    *   Select a word or phrase in your editor.
    *   Run the command `Notemd: Create Wiki-Link & Generate Note from Selection` (it is recommended to assign a hotkey to this, like `Cmd+Shift+W`).
    *   The plugin will:
        1.  Replace your selected text with a `[[wiki-link]]`.
        2.  Check if a note with that title already exists in your **Concept Note Folder**.
        3.  If it exists, it adds a backlink to the current note.
        4.  If it doesn't exist, it creates a new, empty note.
        5.  It then automatically runs the **"Generate Content from Title"** command on the new or existing note, populating it with AI-generated content.

9.  **Extract Concepts and Generate Titles**:
    *   This command chains two powerful features together for a streamlined workflow.
    *   Run the command `Notemd: Extract Concepts and Generate Titles` from the command palette (it is recommended to assign a hotkey to this).
    *   The plugin will:
        1.  First, run the **"Extract concepts (current file)"** task on the currently active file.
        2.  Then, it will automatically run the **"Batch generate from titles"** task on the folder you have configured as your **Concept note folder path** in the settings.
    *   This allows you to first populate your knowledge base with new concepts from a source document and then immediately flesh out those new concept notes with AI-generated content in a single step.

10. **Extract Specific Original Text**:
    *   Configure your questions in the settings under "Extract Specific Original Text".
    *   Use the "Extract Specific Original Text" button in the sidebar to process the active file.
    *   **Merged Mode**: Enables faster processing by sending all questions in one prompt.
    *   **Translation**: Optionally translates the extracted text to your configured language.
    *   **Custom Output**: Configure where and how the extracted file is saved.

11. **Batch Mermaid Fix**:
    *   Use the "Batch Mermaid Fix" button in the sidebar to scan a folder and fix common Mermaid syntax errors.
    *   The plugin will report any files that still contain errors in a `mermaid_error_{foldername}.md` file.
    *   Optionally configure the plugin to move these problematic files to a separate folder for review.

## Supported LLM Providers

| Provider           | Type    | API Key Required       | Notes                                                                 |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Cloud   | Yes                    | Native DeepSeek endpoint with reasoning-model handling                |
| Qwen               | Cloud   | Yes                    | DashScope compatible-mode preset for Qwen / QwQ models               |
| Qwen Code          | Cloud   | Yes                    | DashScope coding-focused preset for Qwen coder models                 |
| Doubao             | Cloud   | Yes                    | Volcengine Ark preset; usually set the model field to your endpoint ID |
| Moonshot           | Cloud   | Yes                    | Official Kimi / Moonshot endpoint                                     |
| GLM                | Cloud   | Yes                    | Official Zhipu BigModel OpenAI-compatible endpoint                    |
| Z AI               | Cloud   | Yes                    | International GLM/Zhipu OpenAI-compatible endpoint; complements `GLM` |
| MiniMax            | Cloud   | Yes                    | Official MiniMax chat-completions endpoint                            |
| Huawei Cloud MaaS  | Cloud   | Yes                    | Huawei ModelArts MaaS OpenAI-compatible endpoint for hosted models    |
| Baidu Qianfan      | Cloud   | Yes                    | Official Qianfan OpenAI-compatible endpoint for ERNIE models          |
| SiliconFlow        | Cloud   | Yes                    | Official SiliconFlow OpenAI-compatible endpoint for hosted OSS models |
| OpenAI             | Cloud   | Yes                    | Supports GPT and o-series models                                      |
| Anthropic          | Cloud   | Yes                    | Supports Claude models                                                |
| Google             | Cloud   | Yes                    | Supports Gemini models                                                |
| Mistral            | Cloud   | Yes                    | Supports Mistral and Codestral families                               |
| Azure OpenAI       | Cloud   | Yes                    | Requires Endpoint, API Key, deployment name, and API Version          |
| OpenRouter         | Gateway | Yes                    | Access many providers through OpenRouter model IDs                    |
| xAI                | Cloud   | Yes                    | Native Grok endpoint                                                  |
| Groq               | Cloud   | Yes                    | Fast OpenAI-compatible inference for hosted OSS models                |
| Together           | Cloud   | Yes                    | OpenAI-compatible endpoint for hosted OSS models                      |
| Fireworks          | Cloud   | Yes                    | OpenAI-compatible inference endpoint                                  |
| Requesty           | Gateway | Yes                    | Multi-provider router behind one API key                              |
| OpenAI Compatible  | Gateway | Optional               | Generic preset for LiteLLM, vLLM, Perplexity, Vercel AI Gateway, etc. |
| LMStudio           | Local   | Optional (`EMPTY`)     | Runs models locally via LM Studio server                              |
| Ollama             | Local   | No                     | Runs models locally via Ollama server                                 |

*Note: For local providers (LMStudio, Ollama), ensure the respective server application is running and accessible at the configured Base URL.*
*Note: For OpenRouter and Requesty, use the provider-prefixed/full model identifier shown by the gateway (for example `google/gemini-flash-1.5` or `anthropic/claude-3-7-sonnet-latest`).*
*Note: `Doubao` usually expects an Ark endpoint/deployment ID in the model field rather than a raw model family name. The settings screen now warns when the placeholder value is still present and blocks connection tests until you replace it with a real endpoint ID.*
*Note: `Z AI` targets the international `api.z.ai` line, while `GLM` keeps the mainland China BigModel endpoint. Choose the preset that matches your account region.*
*Note: China-focused presets use chat-first connection checks so the test validates the actual configured model/deployment, not only API-key reachability.*
*Note: `OpenAI Compatible` is intended for custom gateways and proxies. Set the Base URL, API key policy, and model ID according to your provider's documentation.*

## Troubleshooting

### Common Issues
-   **Plugin Not Loading**: Ensure `manifest.json`, `main.js`, `styles.css` are in the correct folder (`<Vault>/.obsidian/plugins/notemd/`) and restart Obsidian. Check the Developer Console (`Ctrl+Shift+I` or `Cmd+Option+I`) for errors on startup.
-   **Processing Failures / API Errors**:
    1.  **Check File Format**: Ensure the file you are trying to process or check has a `.md` or `.txt` extension. Notemd currently only supports these text-based formats.
    2.  Use the "Test LLM Connection" command/button to verify settings for the active provider.
    3.  Double-check API Key, Base URL, Model Name, and API Version (for Azure). Ensure the API key is correct and has sufficient credits/permissions.
    4.  Ensure your local LLM server (LMStudio, Ollama) is running and the Base URL is correct (e.g., `http://localhost:1234/v1` for LMStudio).
    5.  Check your internet connection for cloud providers.
    6.  **For single file processing errors:** Review the Developer Console for detailed error messages. Copy them using the button in the error modal if needed.
    7.  **For batch processing errors:** Check the `error_processing_filename.log` file in your vault root for detailed error messages for each failed file. The Developer Console or error modal might show a summary or general batch error.
    8.  **Automatic Error Logs:** If a process fails, the plugin automatically saves a detailed log file named `Notemd_Error_Log_[Timestamp].txt` in your vault's root directory. This file contains the error message, stack trace, and session logs. If you encounter persistent issues, please check this file. Enabling "API Error Debugging Mode" in settings will populate this log with even more detailed API response data.
    9.  **Real Endpoint Long-Request Diagnostics (Developer)**:
        - In-plugin path (recommended first): use **Settings -> Notemd -> Developer provider diagnostic (long request)** to run a runtime probe on the active provider and generate `Notemd_Provider_Diagnostic_*.txt` in vault root.
        - CLI path (outside Obsidian runtime): for reproducible endpoint-level comparison between buffered and streaming behavior, use:
        ```bash
        npm run diagnose:llm -- \
          --transport openai-compatible \
          --provider-name OpenRouter \
          --base-url https://openrouter.ai/api/v1 \
          --api-key "$OPENROUTER_API_KEY" \
          --model anthropic/claude-3.7-sonnet \
          --prompt-file ./tmp/prompt.txt \
          --content-file ./tmp/content.txt \
          --mode compare \
          --timeout-ms 360000 \
          --output ./tmp/openrouter-diagnostic.txt
        ```
        The generated report contains per-attempt timing (`First Byte`, `Duration`), sanitized request metadata, response headers, raw/partial body fragments, parsed stream fragments, and transport-layer failure points.
-   **LM Studio/Ollama Connection Issues**:
    *   **Test Connection Fails**: Ensure the local server (LM Studio or Ollama) is running and the correct model is loaded/available.
    *   **CORS Errors (Ollama on Windows)**: If you encounter CORS (Cross-Origin Resource Sharing) errors when using Ollama on Windows, you may need to set the `OLLAMA_ORIGINS` environment variable. You can do this by running `set OLLAMA_ORIGINS=*` in your command prompt before starting Ollama. This allows requests from any origin.
    *   **Enable CORS in LM Studio**: For LM Studio, you can enable CORS directly in the server settings, which may be necessary if Obsidian is running in a browser or has strict origin policies.
-   **Folder Creation Errors ("File name cannot contain...")**:
    *   This usually means the path provided in the settings (**Processed File Folder Path** or **Concept Note Folder Path**) is invalid *for Obsidian*.
    *   **Ensure you are using relative paths** (e.g., `Processed`, `Notes/Concepts`) and **not absolute paths** (e.g., `C:\Users\...`, `/Users/...`).
    *   Check for invalid characters: `* " \ / < > : | ? # ^ [ ]`. Note that `\` is invalid even on Windows for Obsidian paths. Use `/` as the path separator.
-   **Performance Problems**: Processing large files or many files can take time. Reduce the "Chunk Word Count" setting for potentially faster (but more numerous) API calls. Try a different LLM provider or model.
-   **Unexpected Linking**: The quality of linking depends heavily on the LLM and the prompt. Experiment with different models or temperature settings.

## Contributing

Contributions are welcome! Please refer to the GitHub repository for guidelines: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

*Notemd v1.6.2 - Enhance your Obsidian knowledge graph with AI.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
