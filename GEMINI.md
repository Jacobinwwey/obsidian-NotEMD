# GEMINI.md - Notemd Obsidian Plugin

This document provides a comprehensive overview of the Notemd Obsidian plugin project, intended to serve as a guide for developers and contributors.

## Project Overview

Notemd is an Obsidian plugin that enhances note-taking and knowledge management by integrating with various Large Language Models (LLMs). Its core purpose is to help users build a personal knowledge graph automatically.

Key features include:
- **AI-Powered Content Processing**: Automatically adds `[[wiki-links]]` to key concepts in notes and creates corresponding "concept notes".
- **Parallel Batch Processing**: Significantly speeds up batch operations by processing files concurrently, with configurable settings.
- **Multi-LLM Support**: Supports various cloud and local LLM providers (OpenAI, Anthropic, Ollama, etc.).
- **Web Research**: Performs web searches via Tavily or DuckDuckGo to summarize topics and generate content.
- **Content Generation & Translation**: Generates new content from note titles and translates notes into different languages.
- **Streamlined Note Creation**: A new command to create a wiki-link from selected text and automatically generate the content for the corresponding note.
- **Utility Features**: Includes tools for summarizing notes into Mermaid diagrams, checking for duplicate notes, and batch processing files.

The project is written in **TypeScript** and uses **esbuild** for fast bundling. It is structured as a standard Obsidian plugin.

## Building and Running

The project uses `npm` for package management. The main scripts are defined in `package.json`.

### Prerequisites

- Node.js and npm
- An Obsidian vault for testing

### Installation

```bash
npm install
```

### Building the Plugin

- **Development Build**: To create a development build with sourcemaps and enable watch mode for automatic rebuilding on file changes:
  ```bash
  npm run dev
  ```
  This will generate a `main.js` file in the project root. You can then create a symbolic link to this file within your Obsidian vault's `plugins/notemd` directory to test the plugin live.

- **Production Build**: To create an optimized, minified production build:
  ```bash
  npm run build
  ```
  This command first runs the TypeScript compiler (`tsc`) to perform a type check and then bundles the code for production.

### Running Tests

The project uses **Jest** for unit testing. Test files are located in the `src/tests` directory.

To run the test suite:
```bash
npm test
```

### Linting

The project uses **ESLint** for code quality and style checking.

To lint the entire codebase:
```bash
npm run lint
```

## Development Conventions

### Code Structure

- **`src/main.ts`**: The main entry point for the plugin. The `NotemdPlugin` class initializes all features, commands, and UI elements.
- **`src/fileUtils.ts`, `src/llmUtils.ts`, `src/searchUtils.ts`**: These files contain the core logic for file operations, interacting with LLMs, and performing web searches, respectively.
- **`src/utils.ts`**: Contains core utility functions, including a concurrent processor for handling parallel tasks, content chunking logic, and other helpers.
- **`src/ui/`**: This directory contains all UI components, including the settings tab (`NotemdSettingTab.ts`), the sidebar (`NotemdSidebarView.ts`), and various modals.
- **`src/types.ts`**: Defines all major data structures and TypeScript types used throughout the plugin, such as `NotemdSettings` and `LLMProviderConfig`.
- **`src/constants.ts`**: Contains constant values used across the application.
- **`src/tests/`**: Contains all Jest unit tests. Mocks for Obsidian-specific APIs are located in `src/__mocks__/`.

### Coding Style

- The project follows standard TypeScript and ESLint best practices, as defined in the `.eslintrc` and `tsconfig.json` files.
- All major features are organized into commands that can be triggered from the command palette or the plugin's sidebar.
- Asynchronous operations are handled extensively with `async/await`.
- User-facing operations provide feedback through Obsidian's `Notice` API or custom modals and progress bars.
- The plugin state, including all user settings, is managed through the `NotemdSettings` object, which is loaded and saved via Obsidian's plugin data storage.
