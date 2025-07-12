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

Notemd enhances your Obsidian workflow by integrating with various Large Language Models (LLMs) to process your multi-languages notes, automatically generate wiki-links for key concepts, create corresponding concept notes, perform web research, and more.

**Version:** 1.3.2

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Supported LLM Providers](#supported-llm-providers)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

### AI-Powered Document Processing
- **Multi-LLM Support**: Connect to various cloud and local LLM providers (see [Supported LLM Providers](#supported-llm-providers)).
- **Smart Chunking**: Automatically splits large documents into manageable chunks based on word count for processing.
- **Content Preservation**: Aims to maintain original formatting while adding structure and links.
- **Progress Tracking**: Real-time updates via the Notemd Sidebar or a progress modal.
- **Cancellable Operations**: Cancel any processing task (single or batch) initiated from the sidebar via its dedicated cancel button. Command palette operations use a modal which can also be cancelled.
- **Multi-Model Configuration**: Use different LLM providers *and* specific models for different tasks (Add Links, Research, Generate Title, Translate) or use a single provider for all.
- **Stable API Calls (Retry Logic)**: Optionally enable automatic retries for failed LLM API calls with configurable interval and attempt limits.

### Knowledge Graph Enhancement
- **Automatic Wiki-Linking**: Identifies and adds `[[wiki-links]]` to core concepts within your processed notes based on LLM output.
- **Concept Note Creation (Optional & Customizable)**: Automatically creates new notes for discovered concepts in a specified vault folder.
- **Customizable Output Paths**: Configure separate relative paths within your vault for saving processed files and newly created concept notes.
- **Customizable Output Filenames (Add Links)**: Optionally **overwrite the original file** or use a custom suffix/replacement string instead of the default `_processed.md` when processing files for links.
- **Link Integrity Maintenance**: Basic handling for updating links when notes are renamed or deleted within the vault.

### Translation
- **AI-Powered Translation**:
    - Translate note content using the configured LLM.
    - Supports translation between multiple languages.
    - Customizable target language in settings or in UI.
    - Automatically open the translated text on the right side of the original text for easy reading.

### Web Research & Content Generation
- **Web Research & Summarization**:
    - Perform web searches using Tavily (requires API key) or DuckDuckGo (experimental).
    - Summarize search results using the configured LLM.
    - Append summaries to the current note.
    - Configurable token limit for research content sent to the LLM.
- **Content Generation from Title**:
    - Use the note title to generate initial content via LLM, replacing existing content.
    - **Optional Research**: Configure whether to perform web research (using the selected provider) to provide context for generation.
- **Batch Content Generation from Titles**: Generate content for all notes within a selected folder based on their titles (respects the optional research setting). Successfully processed files are moved to a **configurable "complete" subfolder** (e.g., `[foldername]_complete` or a custom name) to avoid reprocessing.

### Utility Features
- **Duplicate Detection**: Basic check for duplicate words within the currently processed file's content (results logged to console).
- **Check and Remove Duplicate Concept Notes**: Identifies potential duplicate notes within the configured **Concept Note Folder** based on exact name matches, plurals, normalization, and single-word containment compared to notes outside the folder. The scope of the comparison (which notes outside the concept folder are checked) can be configured to the **entire vault**, **specific included folders**, or **all folders excluding specific ones**. Presents a detailed list with reasons and conflicting files, then prompts for confirmation before moving identified duplicates to system trash. Shows progress during deletion.
- **Batch Mermaid Fix**: Applies Mermaid and LaTeX syntax corrections (`refineMermaidBlocks` and `cleanupLatexDelimiters`) to all Markdown files within a user-selected folder.
- **LLM Connection Test**: Verify API settings for the active provider.

## Installation

### From Obsidian Marketplace (Recommended)
1. Open Obsidian **Settings** → **Community plugins**.
2. Ensure "Restricted mode" is **off**.
3. Click **Browse** community plugins and search for "Notemd".
4. Click **Install**.
5. Once installed, click **Enable**.

### Manual Installation
1. Download the latest release files (`main.js`, `styles.css`, `manifest.json`) from the [GitHub Releases page](https://github.com/Jacobinwwey/obsidian-NotEMD/releases) .
2. Navigate to your Obsidian vault's configuration folder: `<YourVault>/.obsidian/plugins/`.
3. Create a new folder named `notemd`.
4. Copy the downloaded `main.js`, `styles.css`, and `manifest.json` files into the `notemd` folder.
5. Restart Obsidian.
6. Go to **Settings** → **Community plugins** and enable "Notemd".

## Configuration

Access plugin settings via:
**Settings** → **Community Plugins** → **Notemd** (Click the gear icon).

### LLM Provider Configuration
1.  **Active Provider**: Select the LLM provider you want to use from the dropdown menu.
2.  **Provider Settings**: Configure the specific settings for the selected provider:
    *   **API Key**: Required for most cloud providers (e.g., OpenAI, Anthropic, DeepSeek, Google, Mistral, Azure, OpenRouter). Not needed for Ollama. LMStudio often uses `EMPTY` or can be left blank.
    *   **Base URL / Endpoint**: The API endpoint for the service. Defaults are provided, but you may need to change this for local models (LMStudio, Ollama), OpenRouter, or specific Azure deployments. **Required for Azure OpenAI.**
    *   **Model**: The specific model name/ID to use (e.g., `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `llama3`, `mistral-large-latest`). Ensure the model is available at your endpoint/provider. For OpenRouter, use the model ID shown on their site (e.g., `gryphe/mythomax-l2-13b`).
    *   **Temperature**: Controls the randomness of the LLM's output (0=deterministic, 1=max creativity). Lower values (e.g., 0.2-0.5) are generally better for structured tasks.
    *   **API Version (Azure Only)**: Required for Azure OpenAI deployments (e.g., `2024-02-15-preview`).
3.  **Test Connection**: Use the "Test Connection" button for the active provider to verify your settings. This now uses a more reliable method for LM Studio.
4.  **Manage Provider Configurations**: Use the "Export Providers" and "Import Providers" buttons to save/load your LLM provider settings to/from a `notemd-providers.json` file within the plugin's configuration directory. This allows for easy backup and sharing.

### Multi-Model Configuration
-   **Use Different Providers for Tasks**:
    *   **Disabled (Default)**: Uses the single "Active Provider" (selected above) for all tasks.
    *   **Enabled**: Allows you to select a specific provider *and* optionally override the model name for each task ("Add Links", "Research & Summarize", "Generate from Title", "Translate"). If the model override field for a task is left blank, it will use the default model configured for that task's selected provider.

### Stable API Call Settings
-   **Enable Stable API Calls (Retry Logic)**:
    *   **Disabled (Default)**: A single API call failure will stop the current task.
    *   **Enabled**: Automatically retries failed LLM API calls (useful for intermittent network issues or rate limits).
-   **Retry Interval (seconds)**: (Visible only when enabled) Time to wait between retry attempts (1-300 seconds). Default: 5.
-   **Maximum Retries**: (Visible only when enabled) Maximum number of retry attempts (0-10). Default: 3.

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
    *   **Disabled (Default)**: Code fences **(\`\`\`)** are kept in the content when adding links, and **(\`\`\`markdown)** will be delete automaticly.
    *   **Enabled**: Removes code fences from the content before adding links.

#### Concept Note Output
-   **Customize Concept Note Path**:
    *   **Disabled (Default)**: Automatic creation of notes for `[[linked concepts]]` is disabled.
    *   **Enabled**: Allows you to specify a folder where new concept notes will be created.
-   **Concept Note Folder Path**: (Visible only when the above is enabled) Enter a *relative path* within your vault (e.g., `Concepts` or `Generated/Topics`) where new concept notes should be saved. Folders will be created if they don't exist. **Must be filled if customization is enabled.** **Do not use absolute paths or invalid characters.**

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

#### Processing Parameters
-   **Chunk Word Count**: Maximum words per chunk sent to the LLM. Affects the number of API calls for large files. (Default: 3000)
-   **Enable Duplicate Detection**: Toggles the basic check for duplicate words within processed content (results in console). (Default: Enabled)
-   **Max Tokens**: Maximum tokens the LLM should generate per response chunk. Affects cost and detail. (Default: 4096)

#### Translation
-   **Target Language**: Select the language you want to translate your notes into. (Default: English)

#### Content Generation
-   **Enable Research in "Generate from Title"**:
    *   **Disabled (Default)**: "Generate from Title" uses only the title as input.
    *   **Enabled**: Performs web research using the configured **Web Research Provider** and includes the findings as context for the LLM during title-based generation.
-   **Output Language**: (New) Select the desired output language for "Generate from Title" and "Batch Generate from Title" tasks.
    *   **English (Default)**: Prompts are processed and output in English.
    *   **Other Languages**: The LLM is instructed to perform its reasoning in English but provide the final documentation in your selected language (e.g., Español, Français, 简体中文, العربية, हिन्दी, etc.).
-   **Change Prompt Word**: (New)
    *   **Change Prompt Word**: Allows you to change the prompt word for a specific task.
    *   **Custom Prompt Word**: Enter your custom prompt word for the task.
-   **Use Custom Output Folder for 'Generate from Title'**:
    *   **Disabled (Default)**: Successfully generated files are moved to a subfolder named `[OriginalFolderName]_complete` relative to the original folder's parent (or `Vault_complete` if the original folder was the root).
    *   **Enabled**: Allows you to specify a custom name for the subfolder where completed files are moved.
-   **Custom Output Folder Name**: (Visible only when the above is enabled) Enter the desired name for the subfolder (e.g., `Generated Content`, `_complete`). Invalid characters are not allowed. Defaults to `_complete` if left empty. This folder is created relative to the original folder's parent directory.

#### Web Research Provider
-   **Search Provider**: Choose between `Tavily` (requires API key, recommended) and `DuckDuckGo` (experimental, often blocked by the search engine for automated requests). Used for "Research & Summarize Topic" and optionally for "Generate from Title".
-   **Tavily API Key**: (Visible only if Tavily is selected) Enter your API key from [tavily.com](https://tavily.com/).
-   **Tavily Max Results**: (Visible only if Tavily is selected) Maximum number of search results Tavily should return (1-20). Default: 5.
-   **Tavily Search Depth**: (Visible only if Tavily is selected) Choose `basic` (default) or `advanced`. Note: `advanced` provides better results but costs 2 API credits per search instead of 1.
-   **DuckDuckGo Max Results**: (Visible only if DuckDuckGo is selected) Maximum number of search results to parse (1-10). Default: 5.
-   **DuckDuckGo Content Fetch Timeout**: (Visible only if DuckDuckGo is selected) Maximum seconds to wait when trying to fetch content from each DuckDuckGo result URL. Default: 15.
-   **Max Research Content Tokens**: Approximate maximum tokens from combined web research results (snippets/fetched content) to include in the summarization prompt. Helps manage context window size and cost. (Default: 3000)

#### Duplicate Check Scope
-   **Duplicate Check Scope Mode**: Controls which files are checked against the notes in your Concept Note Folder for potential duplicates.
    *   **Entire Vault (Default)**: Compares concept notes against all other notes in the vault (excluding the Concept Note Folder itself).
    *   **Include Specific Folders Only**: Compares concept notes only against notes within the folders listed below.
    *   **Exclude Specific Folders**: Compares concept notes against all notes *except* those within the folders listed below (and also excluding the Concept Note Folder).
    *   **Concept Folder Only**: Compares concept notes only against *other notes within the Concept Note Folder*. This helps find duplicates purely inside your generated concepts.
-   **Include/Exclude Folders**: (Visible only if Mode is 'Include' or 'Exclude') Enter the *relative paths* of the folders you want to include or exclude, **one path per line**. Paths are case-sensitive and use `/` as the separator (e.g., `Reference Material/Papers` or `Daily Notes`). These folders cannot be the same as or inside the Concept Note Folder.

## Usage Guide

### Original Processing (Adding Wiki-Links)
This is the core functionality focused on identifying concepts and adding `[[wiki-links]]`.

**Important:** This process only works on `.md` or `.txt` files.

1.  **Using the Sidebar**:
    *   Open the Notemd Sidebar (wand icon or command palette).
    *   Open the `.md` or `.txt` file.
    *   Click **"Process File (Add Links)"**.
    *   To process a folder: Click **"Process Folder (Add Links)"**, select the folder, and click "Process".
    *   Progress is shown in the sidebar. You can cancel the task using the "Cancel Processing" button in the sidebar.
    *   *Note for folder processing:* Files are processed in the background without being opened in the editor.

2.  **Using the Command Palette** (`Ctrl+P` or `Cmd+P`):
    *   **Single File**: Open the file and run `Notemd: Process Current File`.
    *   **Folder**: Run `Notemd: Process Folder`, then select the folder. Files are processed in the background without being opened in the editor.
    *   A progress modal appears for command palette actions, which includes a cancel button.
    *   *Note:* The plugin automatically removes leading `\boxed{` and trailing `}` lines if found in the final processed content before saving.

### New Features (Translation, Web Research & Content Generation)

1.  **Translate Note/Selection**:
    *   Select text in a note to translate just that selection, or invoke the command with no selection to translate the entire note.
    *   Run the command `Notemd: Translate Note/Selection` (via command palette or sidebar button).
    *   The plugin uses the configured **LLM Provider** (based on Multi-Model settings) to translate the content to the **Target Language** specified in settings.
    *   The translated content replaces the original selection or the entire note content.
    *   You can cancel this task via the sidebar button or modal cancel button.

2.  **Research & Summarize Topic**:
    *   Select text in a note OR ensure the note has a title (this will be the search topic).
    *   Run the command `Notemd: Research and Summarize Topic` (via command palette or sidebar button).
    *   The plugin uses the configured **Search Provider** (Tavily/DuckDuckGo) and the appropriate **LLM Provider** (based on Multi-Model settings) to find and summarize information.
    *   The summary is appended to the current note.
    *   You can cancel this task via the sidebar button or modal cancel button.
    *   *Note:* DuckDuckGo searches may fail due to bot detection. Tavily is recommended.

3.  **Generate Content from Title**:
    *   Open a note (it can be empty).
    *   Run the command `Notemd: Generate Content from Title` (via command palette or sidebar button).
    *   The plugin uses the appropriate **LLM Provider** (based on Multi-Model settings) to generate content based on the note's title, replacing any existing content.
    *   If the **"Enable Research in 'Generate from Title'"** setting is enabled, it will first perform web research (using the configured **Web Research Provider**) and include that context in the prompt sent to the LLM.
    *   You can cancel this task via the sidebar button or modal cancel button.

4.  **Batch Generate Content from Titles**:
    *   Run the command `Notemd: Batch Generate Content from Titles` (via command palette or sidebar button).
    *   Select the folder containing the notes you want to process.
    *   The plugin will iterate through each `.md` file in the folder (excluding `_processed.md` files and files in the designated "complete" folder), generating content based on the note's title and replacing existing content. Files are processed in the background without being opened in the editor.
    *   Successfully processed files are moved to the configured "complete" folder.
    *   This command respects the **"Enable Research in 'Generate from Title'"** setting for each note processed.
    *   You can cancel this task via the sidebar button or modal cancel button.

### Utilities

1.  **Check for Duplicates**:
    *   Open the `.md` or `.txt` file.
    *   Run `Notemd: Check for Duplicates in Current File` (via command palette or sidebar button).
    *   Results are logged to the Developer Console (`Ctrl+Shift+I`) and mentioned in a notice/sidebar log.

2.  **Test LLM Connection**:
    *   Run `Notemd: Test LLM Connection` (via command palette or sidebar button).
    *   Tests the connection to the **Active Provider** selected in the main dropdown.
    *   Results appear as notices and in the sidebar log/console.

3.  **Batch Mermaid Fix**:
    *   Run `Notemd: Batch Fix Mermaid Syntax` (via command palette or sidebar button).
    *   Select the folder containing the Markdown files you want to fix.
    *   The plugin will iterate through each `.md` file, apply syntax corrections, and save the changes if any were made. Corrections include:
        *   Ensuring proper Mermaid block structure.
        *   Removing extraneous parentheses `()` and curly braces `{}` from within Mermaid diagrams.
        *   Normalizing LaTeX math delimiters (e.g., `\(\)` to `$`).
    *   Progress and results (number of files modified, errors) are shown in the sidebar/modal log.

4.  **Check and Remove Duplicate Concept Notes**:
    *   Ensure the **Concept Note Folder Path** is correctly configured in settings.
    *   Run `Notemd: Check and Remove Duplicate Concept Notes` (via command palette or sidebar button).
    *   The plugin scans the concept note folder and compares filenames against notes outside the folder using several rules (exact match, plurals, normalization, containment).
    *   If potential duplicates are found, a modal window appears listing the files, the reason they were flagged, and the conflicting files.
    *   Review the list carefully. Click **"Delete Files"** to move the listed files to the system trash, or **"Cancel"** to take no action.
    *   Progress and results are shown in the sidebar/modal log.

## Supported LLM Providers

| Provider     | Type  | API Key Required | Notes                                                    |
|--------------|-------|------------------|----------------------------------------------------------|
| DeepSeek     | Cloud | Yes              |                                                          |
| OpenAI       | Cloud | Yes              | Supports various models like GPT-4o, GPT-3.5             |
| Anthropic    | Cloud | Yes              | Supports Claude models                                   |
| Google       | Cloud | Yes              | Supports Gemini models                                   |
| Mistral      | Cloud | Yes              | Supports Mistral models                                  |
| Azure OpenAI | Cloud | Yes              | Requires Endpoint, API Key, API Version                  |
| OpenRouter   | Cloud | Yes              | Accesses many models via OpenRouter API                  |
| LMStudio     | Local | No (Use `EMPTY`) | Runs models locally via LM Studio server                 |
| Ollama       | Local | No               | Runs models locally via Ollama server                    |

*Note: For local providers (LMStudio, Ollama), ensure the respective server application is running and accessible at the configured Base URL.*
*Note: For OpenRouter, use the full model identifier from their website (e.g., `google/gemini-flash-1.5`) in the Model setting.*

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
-   **LM Studio Test Connection Fails**: Ensure LM Studio server is running and the correct model is loaded and selected within LM Studio. The test now uses the chat completions endpoint, which should be more reliable.
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

*Notemd v1.3.0 - Enhance your Obsidian knowledge graph with AI.*
