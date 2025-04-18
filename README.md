# Notemd Plugin for Obsidian

```
=============================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
=============================================
      AI-Powered Knowledge Enhancement
=============================================
```

Notemd enhances your Obsidian workflow by integrating with various Large Language Models (LLMs) to process your notes, automatically generate wiki-links for key concepts, create corresponding concept notes, and perform basic duplicate checks.

**Version:** 1.1.0

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
- **Cancellable Operations**: Cancel processing via the modal or sidebar.

### Knowledge Graph Enhancement
- **Automatic Wiki-Linking**: Identifies and adds `[[wiki-links]]` to core concepts within your processed notes based on LLM output.
- **Concept Note Creation (Optional & Customizable)**: Automatically creates new notes for discovered concepts in a specified vault folder.
- **Customizable Output Paths**: Configure separate relative paths within your vault for saving processed files and newly created concept notes.
- **Link Integrity Maintenance**: Basic handling for updating links when notes are renamed or deleted within the vault.

### Duplicate Detection
- **Basic Duplicate Check**: Identifies potential duplicate words within the currently processed file's content (results logged to console).

## Installation

### From Obsidian Marketplace (Recommended)
1. Open Obsidian **Settings** → **Community plugins**.
2. Ensure "Restricted mode" is **off**.
3. Click **Browse** community plugins and search for "Notemd".
4. Click **Install**.
5. Once installed, click **Enable**.

### Manual Installation
1. Download the latest release files (`main.js`, `styles.css`, `manifest.json`) from the [GitHub Releases page](https://github.com/Jacobinwwey/Notemd/releases) (Replace with actual link if available).
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

### General Settings

#### Processed File Output
-   **Customize Processed File Save Path**:
    *   **Disabled (Default)**: Processed files (e.g., `YourNote_processed.md`) are saved in the *same folder* as the original note.
    *   **Enabled**: Allows you to specify a custom save location.
-   **Processed File Folder Path**: (Visible only when the above is enabled) Enter a *relative path* within your vault (e.g., `Processed Notes` or `Output/LLM`) where processed files should be saved. Folders will be created if they don't exist. **Do not use absolute paths (like C:\...) or invalid characters.**

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

## Usage Guide

### Processing Documents
**Important:** Notemd currently only processes files with `.md` or `.txt` extensions. Please ensure your files are in one of these formats before processing.

You can process notes using the **Notemd Sidebar** or the **Command Palette**.

1.  **Using the Sidebar**:
    *   Open the Notemd Sidebar using the ribbon icon (wand icon) or the command palette (`Open Sidebar`).
    *   Open the `.md` or `.txt` file you want to process.
    *   Click **"Process Current File"** in the sidebar.
    *   Progress will be shown in the sidebar's log area. You can click "Cancel Processing" if needed.
    *   To process all supported files (`.md`, `.txt`) in a folder: Click **"Process Folder"**, select the folder from the dropdown, and click "Process" (or "Cancel"). Processing will begin for each supported file, showing progress in the sidebar.

2.  **Using the Command Palette** (`Ctrl+P` or `Cmd+P`):
    *   **Single File**: Open the desired `.md` or `.txt` file and run the command `Notemd: Process Current File`. A progress modal will appear with a cancel button.
    *   **Folder**: Run the command `Notemd: Process Folder`. You will be prompted to select a folder and click "Process" or "Cancel". If you proceed, processing will start for all `.md` and `.txt` files in that folder, and a progress modal will appear with a cancel button.

### Checking for Duplicates
-   Open the `.md` or `.txt` file you want to check.
-   Run the command `Notemd: Check for Duplicates in Current File` via the command palette or the sidebar button.
-   Results (potential duplicate words found in the file) will be logged to the Obsidian Developer Console (`Ctrl+Shift+I` or `Cmd+Option+I`) and mentioned in a notice/sidebar log. *Note: This is a basic check within the single file's content.*

### Testing LLM Connection
-   Run the command `Notemd: Test LLM Connection` via the command palette or the sidebar button.
-   This will test the connection to the currently **Active Provider** configured in the settings.
-   Success or failure messages will appear as Obsidian notices and in the sidebar log/console.

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
    6.  Review the Developer Console for detailed error messages. Copy them using the button in the error modal if needed.
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

*Notemd v1.1.0 - Enhance your Obsidian knowledge graph with AI.*
