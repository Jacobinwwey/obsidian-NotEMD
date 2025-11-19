# 2025-11-19 - v1.0.0

## English

### 1. Add Custom Translate Prompt Setting

- **File:** `src/types.ts`
  - Add `useCustomPromptForTranslate: boolean;` and `translatePrompt: string;` to the `NotemdSettings` interface.
- **File:** `src/constants.ts`
  - Add `DEFAULT_TRANSLATE_PROMPT` to `DEFAULT_SETTINGS`.
- **File:** `src/ui/NotemdSettingTab.ts`
  - In the `display()` method, add a new section for "Translate Settings".
  - Add a `Setting` for "Use custom prompt for translation" (toggle).
  - Add a `TextAreaComponent` for the custom prompt, which is shown/hidden based on the toggle.

### 2. Refactor Translate Logic to Use Custom Prompt

- **File:** `src/translate.ts`
  - Modify the `translateFile` function to accept `prompt: string` as an argument.
  - Use the passed `prompt` instead of the hardcoded one.
- **File:** `src/main.ts`
  - Update `translateFileCommand` to get the prompt from settings using a new helper function `getTranslatePrompt()`.
  - Create `getTranslatePrompt()` which returns `this.settings.translatePrompt` if `this.settings.useCustomPromptForTranslate` is true, otherwise returns the default prompt.

### 3. Implement "Batch Translate" Command

- **File:** `src/main.ts`
  - Add a new command `batchTranslateFolderCommand` in `onload`.
  - The command should:
    1.  Use `this.getFolderSelection(this.app)` to get the folder path.
    2.  Get all Markdown files in the folder recursively.
    3.  Create a `ProgressModal` to show the progress.
    4.  Use `createConcurrentProcessor` from `src/utils.ts` to process the files.
    5.  The processing function for each file will call `translateFile`, but with an option to not open the file.
- **File:** `src/translate.ts`
  - Modify `translateFile` to accept an `options` object with a `openFile: boolean` property. The default should be `true`.
  - The function should only open the file if `openFile` is `true`.

### 4. Add File Explorer Context Menu

- **File:** `src/main.ts`
  - In `onload`, register a `file-menu` event listener.
  - In the event listener, check if the clicked item is a folder.
  - If it is a folder, add a menu item "Batch translate this folder".
  - When clicked, this menu item should execute the `batchTranslateFolderCommand` logic for that folder.

## Chinese (中文)

### 1. 添加自定义翻译提示词设置

- **文件:** `src/types.ts`
  - 在 `NotemdSettings` 接口中添加 `useCustomPromptForTranslate: boolean;` 和 `translatePrompt: string;`。
- **文件:** `src/constants.ts`
  - 在 `DEFAULT_SETTINGS` 中添加 `DEFAULT_TRANSLATE_PROMPT`。
- **文件:** `src/ui/NotemdSettingTab.ts`
  - 在 `display()` 方法中，为“翻译设置”添加一个新的部分。
  - 添加一个“为翻译使用自定义提示词”的 `Setting` (开关)。
  - 添加一个 `TextAreaComponent` 用于自定义提示词，根据开关的状态显示/隐藏。

### 2. 重构翻译逻辑以使用自定义提示词

- **文件:** `src/translate.ts`
  - 修改 `translateFile` 函数，使其接受 `prompt: string` 作为参数。
  - 使用传入的 `prompt` 替代硬编码的提示词。
- **文件:** `src/main.ts`
  - 更新 `translateFileCommand`，使用一个新的辅助函数 `getTranslatePrompt()` 从设置中获取提示词。
  - 创建 `getTranslatePrompt()` 函数，如果 `this.settings.useCustomPromptForTranslate` 为 `true`，则返回 `this.settings.translatePrompt`，否则返回默认提示词。

### 3. 实现“批量翻译”命令

- **文件:** `src/main.ts`
  - 在 `onload` 中添加一个新的命令 `batchTranslateFolderCommand`。
  - 该命令应：
    1.  使用 `this.getFolderSelection(this.app)` 获取文件夹路径。
    2.  递归获取文件夹中的所有 Markdown 文件。
    3.  创建一个 `ProgressModal` 以显示进度。
    4.  使用 `src/utils.ts` 中的 `createConcurrentProcessor` 来处理文件。
    5.  每个文件的处理函数将调用 `translateFile`，但带有一个不打开文件的选项。
- **文件:** `src/translate.ts`
  - 修改 `translateFile` 以接受一个带有 `openFile: boolean` 属性的 `options` 对象。默认值应为 `true`。
  - 函数仅在 `openFile` 为 `true` 时才打开文件。

### 4. 添加文件浏览器上下文菜单

- **文件:** `src/main.ts`
  - 在 `onload` 中，注册一个 `file-menu` 事件监听器。
  - 在事件监听器中，检查点击的项目是否为文件夹。
  - 如果是文件夹，则添加一个“批量翻译此文件夹”的菜单项。
  - 点击后，此菜单项应执行该文件夹的 `batchTranslateFolderCommand` 逻辑。