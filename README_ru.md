![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Плагин Notemd для Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Документация на других языках: [Language Hub](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
  Многоязычное расширение базы знаний с помощью ИИ
==================================================
```

Простой способ создать собственную базу знаний.

Notemd расширяет рабочий процесс в Obsidian, интегрируясь с различными большими языковыми моделями (LLM) для обработки многоязычных заметок, автоматического создания wiki-ссылок для ключевых понятий, генерации соответствующих concept-note, выполнения веб-исследований и многого другого, чтобы вы могли строить мощные графы знаний.

**Версия:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Содержание

- [Быстрый старт](#быстрый-старт)
- [Поддержка языков](#поддержка-языков)
- [Возможности](#возможности)
- [Установка](#установка)
- [Настройка](#настройка)
- [Руководство по использованию](#руководство-по-использованию)
- [Поддерживаемые LLM-провайдеры](#поддерживаемые-llm-провайдеры)
- [Использование сети и обработка данных](#использование-сети-и-обработка-данных)
- [Устранение неполадок](#устранение-неполадок)
- [Вклад в проект](#вклад-в-проект)
- [Документация для мейнтейнера](#документация-для-мейнтейнера)
- [Лицензия](#лицензия)

## Быстрый старт

1. **Установите и включите**: получите плагин из Obsidian Marketplace.
2. **Настройте LLM**: откройте `Settings -> Notemd`, выберите LLM-провайдера (например, OpenAI или локальный Ollama) и укажите API-ключ/URL.
3. **Откройте боковую панель**: нажмите на значок волшебной палочки Notemd в ленте слева, чтобы открыть sidebar.
4. **Обработайте заметку**: откройте любую заметку и нажмите **"Обработать файл (добавить ссылки)"** в боковой панели, чтобы автоматически добавить `[[wiki-links]]` для ключевых понятий.
5. **Запустите быстрый workflow**: используйте стандартную кнопку **"One-Click Extract"**, чтобы одной точкой входа запустить обработку, пакетную генерацию и очистку Mermaid.

Готово. Изучите настройки, чтобы включить веб-исследование, перевод и генерацию контента.

## Поддержка языков

### Контракт языкового поведения

| Аспект | Область | По умолчанию | Примечания |
|---|---|---|---|
| `UI Locale` | Только текст интерфейса плагина (настройки, sidebar, уведомления, диалоги) | `auto` | Следует за языком Obsidian. Текущие UI-каталоги: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Task Output Language` | Сгенерированный моделью вывод задач (ссылки, резюме, генерация, извлечение, целевой язык перевода) | `en` | Может быть глобальным или отдельным для каждой задачи, если включён `Use different languages for tasks`. |
| `Disable auto translation` | Не-Translate задачи сохраняют контекст исходного языка | `false` | Явные задачи `Translate` всё равно принудительно используют настроенный целевой язык. |
| Fallback локали | Разрешение отсутствующих UI-ключей | локаль -> `en` | Позволяет интерфейсу оставаться стабильным, даже если часть ключей не переведена. |

- Поддерживаемые исходные документы ведутся на английском и упрощённом китайском, а опубликованные переводы README перечислены в шапке выше.
- Текущее покрытие UI locale внутри приложения в точности соответствует явному каталогу в коде: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Английский fallback остаётся страховочной сеткой реализации, но поддерживаемые видимые поверхности покрыты регрессионными тестами и не должны незаметно откатываться на английский при обычном использовании.
- Дополнительные детали и правила внесения вкладов отслеживаются в [Language Hub](./docs/i18n/README.md).

## Возможности

### Обработка документов с помощью ИИ
- **Поддержка множества LLM**: подключение к облачным и локальным LLM-провайдерам (см. [Поддерживаемые LLM-провайдеры](#поддерживаемые-llm-провайдеры)).
- **Умное разбиение на чанки**: большие документы автоматически делятся на управляемые части по количеству слов.
- **Сохранение структуры контента**: плагин старается сохранять исходное форматирование, добавляя структуру и ссылки.
- **Отслеживание прогресса**: обновления в реальном времени через Notemd Sidebar или progress modal.
- **Отменяемые операции**: любую задачу обработки, запущенную из sidebar, можно отменить отдельной кнопкой Cancel. Команды из палитры команд используют modal, который тоже можно отменить.
- **Многомодельная конфигурация**: можно назначать разные LLM-провайдеры и конкретные модели для разных задач (Add Links, Research, Generate Title, Translate) или использовать одного провайдера для всего.
- **Стабильные API-вызовы (логика повторов)**: при необходимости можно включить автоматические повторы неудачных LLM-запросов с настраиваемым интервалом и лимитом попыток.
- **Устойчивые тесты соединения провайдера**: если первый тест соединения падает из-за временного сетевого разрыва, Notemd автоматически переключается на стабильную retry-последовательность перед финальной ошибкой. Это покрывает OpenAI-compatible, Anthropic, Google, Azure OpenAI и Ollama.
- **Fallback транспорта на уровне среды выполнения**: если длительный запрос к провайдеру обрывается внутри `requestUrl` из-за временных сетевых ошибок, например `ERR_CONNECTION_CLOSED`, Notemd повторяет ту же попытку через fallback-транспорт, зависящий от среды: на desktop используется Node `http/https`, а вне desktop — браузерный `fetch`. Это уменьшает число ложных сбоев на медленных шлюзах и обратных прокси.
- **Усиление цепочки стабильных длинных запросов для OpenAI-compatible**: в stable-режиме OpenAI-compatible вызовы теперь используют явный 3-шаговый порядок для каждой попытки: прямой streaming transport, затем direct non-stream transport, затем `requestUrl` fallback, который при необходимости может снова перейти к потоковому разбору. Это уменьшает число ложных отрицаний, когда провайдер отдаёт буферизованный ответ, но streaming pipe нестабилен.
- **Fallback потокового разбора с учётом протокола для разных LLM API**: длительные fallback-попытки теперь используют protocol-aware streaming parsing во всех встроенных LLM-путях, а не только для OpenAI-compatible endpoint. Notemd умеет разбирать OpenAI/Azure SSE, Anthropic Messages streaming, Google Gemini SSE и Ollama NDJSON как в desktop `http/https`, так и в non-desktop `fetch`, а остальные прямые OpenAI-style entrypoint используют тот же общий fallback-путь.
- **Готовые пресеты для китайских провайдеров**: встроенные пресеты охватывают `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` и `SiliconFlow`, помимо уже существующих глобальных и локальных провайдеров.
- **Надёжная пакетная обработка**: улучшена логика конкурентной обработки с **разнесёнными по времени API-вызовами**, что помогает избежать rate limit и делает большие batch-задачи стабильнее. Новая реализация гарантирует, что задачи стартуют с интервалом, а не одновременно.
- **Точное отображение прогресса**: исправлена ошибка, из-за которой progress bar мог зависнуть, теперь UI всегда отражает реальный статус операции.
- **Надёжная параллельная batch-обработка**: устранена проблема, при которой параллельные batch-операции преждевременно останавливались, благодаря чему все файлы обрабатываются надёжно и эффективно.
- **Точность progress bar**: исправлена ошибка, из-за которой progress bar для команды "Create Wiki-Link & Generate Note" мог зависнуть на 95%; теперь по завершении корректно показывается 100%.
- **Расширенная API-отладка**: режим "API Error Debugging Mode" теперь сохраняет полные response body от LLM-провайдеров и поисковых сервисов (Tavily/DuckDuckGo), а также журнал транспорта по каждой попытке с обезличенными request URL, длительностью, response headers, частичными response body, частично разобранным stream output и stack trace — это полезно для диагностики OpenAI-compatible, Anthropic, Google, Azure OpenAI и Ollama fallback-сценариев.
- **Панель developer mode**: в settings появилась отдельная developer-only панель диагностики, скрытая до включения "Developer mode". Она позволяет выбирать диагностический call-path и запускать repeated stability probe для выбранного режима.
- **Переработанная sidebar**: встроенные действия сгруппированы по тематическим секциям с более ясными названиями, живым статусом, отменяемым прогрессом и копируемыми логами, чтобы уменьшить захламление sidebar. Footer с прогрессом и логами теперь остаётся видимым даже при раскрытии всех секций, а состояние ready отображается понятнее.
- **Полировка взаимодействия и читаемости sidebar**: кнопки sidebar теперь дают более ясную hover/press/focus-обратную связь, а цветные CTA-кнопки (включая `One-Click Extract` и `Batch generate from titles`) используют более контрастный текст для лучшей читаемости в разных темах.
- **CTA только для single-file действий**: цветной CTA-стиль теперь зарезервирован только для действий над одним файлом. Batch/folder-level действия и смешанные workflow используют обычный стиль, чтобы снизить риск неверного запуска по области действия.
- **Собственные one-click workflow**: встроенные утилиты sidebar можно объединять в пользовательские кнопки с произвольными именами и цепочками действий. Стандартный workflow `One-Click Extract` включён из коробки.

### Расширение графа знаний
- **Автоматическое wiki-linking**: плагин определяет ключевые понятия и добавляет `[[wiki-links]]` в обработанные заметки на основе вывода LLM.
- **Создание concept-note (опционально и настраиваемо)**: для найденных понятий автоматически создаются новые заметки в указанной папке vault.
- **Настраиваемые output path**: можно задать отдельные относительные пути внутри vault для сохранения обработанных файлов и новых concept-note.
- **Настраиваемые имена файлов output (Add Links)**: можно либо **перезаписывать исходный файл**, либо использовать собственный суффикс/строку замены вместо стандартного `_processed.md` при обработке файлов с добавлением ссылок.
- **Поддержание целостности ссылок**: реализована базовая обработка обновления ссылок при переименовании и удалении заметок внутри vault.
- **Чистое извлечение понятий**: можно извлекать понятия и создавать соответствующие concept-note без изменения исходного документа. Это удобно для наполнения базы знаний из существующих документов без их модификации. Для режима доступны настройки создания минимальных concept-note и добавления backlink.

### Перевод

- **Перевод с помощью ИИ**:
  - Перевод содержимого заметки через настроенную LLM.
  - **Поддержка больших файлов**: большие файлы автоматически делятся на smaller chunk согласно настройке `Chunk word count`, затем переведённые части бесшовно собираются обратно в один документ.
  - Поддерживается перевод между множеством языков.
  - Целевой язык можно настраивать в settings или через UI.
  - Переведённый текст автоматически открывается справа от оригинала для удобного чтения.
- **Batch Translate**:
  - Перевод всех файлов внутри выбранной папки.
  - Поддерживается параллельная обработка, если включён "Enable Batch Parallelism".
  - Используются custom prompt для перевода, если они настроены.
  - В контекстное меню папки в file explorer добавляется действие "Batch translate this folder".
- **Disable auto translation**: если этот параметр включён, не-Translate задачи больше не будут принудительно переводить output на заданный язык и сохранят контекст оригинального языка. Явная задача `Translate` продолжит перевод по настройкам.

### Веб-исследование и генерация контента
- **Web Research & Summarization**:
  - Поиск через Tavily (нужен API key) или DuckDuckGo (экспериментально).
  - **Повышенная устойчивость поиска**: DuckDuckGo теперь использует улучшенную логику парсинга (DOMParser с Regex fallback), чтобы выдерживать изменения layout и возвращать более надёжные результаты.
  - Суммаризация результатов поиска через настроенную LLM.
  - Язык output summary можно настроить в settings.
  - Резюме дописывается в текущую заметку.
  - Для research content, отправляемого в LLM, есть настраиваемый token limit.
- **Content Generation from Title**:
  - Генерация начального контента по заголовку заметки через LLM с заменой существующего содержимого.
  - **Опциональное исследование**: можно включить предварительный web research через выбранный search provider, чтобы передать его результаты модели как контекст.
- **Batch Content Generation from Titles**: генерация контента для всех заметок в выбранной папке по их заголовкам с учётом опционального research. Успешно обработанные файлы переносятся в **настраиваемую подпапку "complete"** (например, `[foldername]_complete` или пользовательское имя), чтобы исключить повторную обработку.
- **Mermaid Auto-Fix Coupling**: при включённом Mermaid auto-fix все Mermaid-связанные workflow автоматически исправляют сгенерированные файлы или output folder после обработки. Это касается Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid и Translate.

### Вспомогательные возможности
- **Summarise as Mermaid diagram**:
  - Позволяет суммаризировать содержимое заметки в Mermaid-диаграмму.
  - Язык output Mermaid-диаграммы можно настроить в settings.
  - **Mermaid Output Folder**: можно задать папку, в которую будут сохраняться generated Mermaid diagram files.
  - **Translate Summarize to Mermaid Output**: можно дополнительно переводить generated Mermaid content на настроенный целевой язык.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Простая коррекция формата формул**:
  - Быстро исправляет однострочные математические формулы, ограниченные одиночным `$`, переводя их в стандартные блоки `$$`.
  - **Single File**: обработка текущего файла через кнопку sidebar или палитру команд.
  - **Batch Fix**: обработка всех файлов в выбранной папке через кнопку sidebar или палитру команд.

- **Check for Duplicates in Current File**: помогает находить потенциальные дубликаты терминов в активном файле.
- **Duplicate Detection**: выполняет базовую проверку повторяющихся слов в содержимом текущего обработанного файла; результат пишется в консоль.
- **Check and Remove Duplicate Concept Notes**: ищет потенциальные дубликаты заметок в настроенной **Concept Note Folder** по точному совпадению имён, множественным формам, нормализации и включению одного слова по отношению к заметкам вне этой папки. Область сравнения настраивается: **весь vault**, **только включённые папки** или **все папки, кроме исключённых**. Затем показывается подробный список с причинами и конфликтующими файлами, после чего плагин запрашивает подтверждение перед переносом найденных дубликатов в системную корзину. Во время удаления отображается прогресс.
- **Batch Mermaid Fix**: применяет исправления синтаксиса Mermaid и LaTeX ко всем Markdown-файлам внутри выбранной пользователем папки.
  - **Готовность к workflow**: утилиту можно использовать как отдельное действие или как шаг внутри пользовательского one-click workflow.
  - **Отчёт об ошибках**: создаётся файл `mermaid_error_{foldername}.md` со списком файлов, в которых после обработки всё ещё присутствуют потенциальные Mermaid-ошибки.
  - **Перемещение проблемных файлов**: при желании файлы с обнаруженными ошибками можно перенести в отдельную папку для ручной проверки.
  - **Умное обнаружение**: перед попыткой исправления плагин теперь сначала проверяет файлы на синтаксические ошибки через `mermaid.parse`, чтобы не тратить время на лишние правки.
  - **Безопасная обработка**: исправления синтаксиса применяются только к Mermaid code block, без случайного изменения Markdown-таблиц и остального контента. Включены дополнительные защитные проверки, чтобы не ломать синтаксис таблиц вроде `| :--- |`.
  - **Режим Deep Debug**: если ошибки сохраняются после базового исправления, включается продвинутый режим deep debug. Он обрабатывает сложные edge-case, в том числе:
    - **Интеграция комментариев**: автоматическое слияние хвостовых комментариев (с `%`) в label ребра, например `A -- Label --> B; % Comment` превращается в `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: исправляет стрелки, случайно "засосанные" в кавычки, например `A -- "Label -->" B` -> `A -- "Label" --> B`.
    - **Inline Subgraphs**: переводит inline-label подграфов в edge label.
    - **Reverse Arrow Fix**: исправляет нестандартные стрелки `X <-- Y` в `Y --> X`.
    - **Direction Keyword Fix**: приводит `direction` к нижнему регистру внутри подграфов, например `Direction TB` -> `direction TB`.
    - **Comment Conversion**: преобразует `//` comments в edge label, например `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: упрощает повторяющиеся bracketed label, например `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: заменяет невалидный синтаксис `--|>` на стандартный `-->`.
    - **Robust Label & Note Handling**: улучшено обращение с label, содержащими special character (например `/`), и улучшена поддержка пользовательского note syntax (`note for ...`), при этом лишние артефакты вроде хвостовых `]` корректно удаляются.
    - **Advanced Fix Mode**: включает устойчивые исправления для unquoted node label с пробелами, special character и вложенными скобками (например `Node[Label [Text]]` -> `Node["Label [Text]"]`), чтобы поддерживать сложные диаграммы наподобие путей эволюции звёзд. Также исправляет повреждённые edge label, например `--["Label["-->` -> `-- "Label" -->`.
    - **Note Conversion**: автоматически преобразует `note right/left of` и standalone `note :` comments в стандартные Mermaid node definition и связи, например `note right of A: text` превращается в `NoteA["Note: text"]`, связанный с `A`. Поддерживаются как arrow link (`-->`), так и solid link (`---`).
    - **Extended Note Support**: автоматически преобразует `note for Node "Content"` и `note of Node "Content"` в стандартные linked note node, например `NoteNode[" Content"]`, связанные с `Node`.
    - **Enhanced Note Correction**: автоматически переименовывает notes последовательной нумерацией (`Note1`, `Note2` и т. д.), чтобы избежать alias-конфликтов при наличии нескольких notes.
    - **Parallelogram/Shape Fix**: исправляет повреждённые node shape наподобие `[/["Label["/]` в стандартный `["Label"]`.
    - **Standardize Pipe Labels**: автоматически исправляет и стандартизирует edge label с pipe, корректно оборачивая их в кавычки, например `-->|Text|` -> `-->|"Text"|`, а `-->|Math|^2|` -> `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: исправляет label, ошибочно стоящий перед стрелкой, например `>|"Label"| A --> B` -> `A -->|"Label"| B`.
    - **Merge Double Labels**: распознаёт и объединяет сложные double label на одном ребре, например `A -- Label1 -- Label2 --> B` или `A -- Label1 -- Label2 --- B`, превращая их в единый label с переносами строк: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: автоматически заключает в кавычки node label, содержащие проблемные символы (кавычки, `=`, математические операторы), если внешние кавычки отсутствуют.
    - **Intermediate Node Fix**: разделяет рёбра, в которых содержится промежуточное определение узла, на два отдельных ребра. Например, `A -- B[...] --> C` превращается в `A --> B[...]` и `B[...] --> C`.
    - **Concatenated Label Fix**: надёжно исправляет node definition, где идентификатор склеен с label, например `SubdivideSubdivide...` превращается в `Subdivide["Subdivide..."]`, даже если перед ним стоял pipe label или дублирование не является точным.
    - **Extract Specific Original Text**:
      - В settings можно задать список вопросов.
      - Плагин извлекает дословные фрагменты из активной заметки, отвечающие на эти вопросы.
      - **Merged Query Mode**: все вопросы можно обрабатывать одним API-вызовом для повышения эффективности.
      - **Translation**: можно добавлять переводы извлечённого текста в output.
      - **Custom Output**: настраиваются путь сохранения и суффикс имени файла для extracted text.
  - **LLM Connection Test**: проверка API-настроек для активного провайдера.

## Установка

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Из Obsidian Marketplace (рекомендуется)
1. Откройте в Obsidian **Settings** -> **Community plugins**.
2. Убедитесь, что "Restricted mode" **выключен**.
3. Нажмите **Browse** и найдите "Notemd".
4. Нажмите **Install**.
5. После установки нажмите **Enable**.

### Ручная установка
1. Скачайте assets последнего релиза со [страницы GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Каждый релиз также содержит `README.md` для справки, но для ручной установки нужны только `main.js`, `styles.css` и `manifest.json`.
2. Перейдите в конфигурационную папку вашего Obsidian vault: `<YourVault>/.obsidian/plugins/`.
3. Создайте новую папку с именем `notemd`.
4. Скопируйте `main.js`, `styles.css` и `manifest.json` в папку `notemd`.
5. Перезапустите Obsidian.
6. Откройте **Settings** -> **Community plugins** и включите "Notemd".

## Настройка

Открыть настройки плагина можно через:
**Settings** -> **Community Plugins** -> **Notemd** (значок шестерёнки).

### Настройка LLM-провайдера
1. **Active Provider**: выберите LLM-провайдера из выпадающего списка.
2. **Provider Settings**: настройте конкретные параметры выбранного провайдера:
   - **API Key**: обязателен для большинства облачных провайдеров (например, OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Для Ollama не нужен. Для LM Studio и generic `OpenAI Compatible` пресета может быть опциональным, если endpoint допускает анонимный или placeholder-доступ.
   - **Base URL / Endpoint**: API endpoint сервиса. Значения по умолчанию уже подставлены, но их может понадобиться изменить для локальных моделей (LMStudio, Ollama), шлюзов (OpenRouter, Requesty, OpenAI Compatible) или конкретных Azure deployment. Для Azure OpenAI поле **обязательно**.
   - **Model**: конкретное имя/ID модели, например `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`. Убедитесь, что модель доступна у вашего провайдера/endpoint.
   - **Temperature**: управляет степенью случайности output модели (`0` = детерминированно, `1` = максимальная вариативность). Для структурных задач обычно лучше низкие значения, например `0.2-0.5`.
   - **API Version (только Azure)**: обязательное поле для Azure OpenAI deployment, например `2024-02-15-preview`.
3. **Test Connection**: используйте кнопку "Test Connection" для активного провайдера, чтобы проверить настройки. OpenAI-compatible провайдеры теперь используют provider-aware проверки: endpoint вроде `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` и `OpenAI Compatible` проверяют `chat/completions` напрямую, а провайдеры с надёжным `/models` endpoint по-прежнему могут сначала использовать listing models. Если первый probe падает из-за временного сетевого разрыва, например `ERR_CONNECTION_CLOSED`, Notemd автоматически переключается на стабильную retry-последовательность вместо немедленной ошибки.
4. **Manage Provider Configurations**: используйте кнопки "Export Providers" и "Import Providers", чтобы сохранять/загружать настройки LLM-провайдеров в/из файла `notemd-providers.json` внутри конфигурационной директории плагина. Это удобно для резервного копирования и совместного использования.
5. **Preset Coverage**: помимо исходных провайдеров, Notemd теперь включает готовые пресеты для `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` и generic `OpenAI Compatible` target для LiteLLM, vLLM, Perplexity, Vercel AI Gateway или кастомных прокси.

<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Multi-Model Configuration
- **Use Different Providers for Tasks**:
  - **Disabled (по умолчанию)**: для всех задач используется один "Active Provider".
  - **Enabled**: можно выбрать отдельного провайдера и, при желании, переопределить имя модели для каждой задачи ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts"). Если поле override model для задачи оставить пустым, будет использоваться модель по умолчанию, заданная у выбранного для этой задачи провайдера.
- **Select different languages for different tasks**:
  - **Disabled (по умолчанию)**: для всех задач используется единый "Output language".
  - **Enabled**: позволяет задать отдельный язык для каждой задачи ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Языковая архитектура (UI Locale vs Task Output Language)

- **UI Locale** управляет только текстом интерфейса плагина (labels в Settings, кнопками sidebar, notices и dialog).
- **Task Output Language** управляет output, генерируемым моделью (ссылки, summary, генерация заголовков, Mermaid summary, извлечение понятий, целевой язык перевода).
- **Per-task language mode** позволяет каждой задаче разрешать собственный output language через единый policy layer, а не через разбросанные override по модулям.
- **Disable auto translation** сохраняет контекст исходного языка для не-Translate задач, при этом явные Translate-задачи по-прежнему используют заданный target language.
- Все Mermaid-related пути генерации следуют той же language policy и при необходимости по-прежнему могут запускать Mermaid auto-fix.

### Stable API Call Settings
- **Enable Stable API Calls (Retry Logic)**:
  - **Disabled (по умолчанию)**: единичная ошибка API немедленно останавливает текущую задачу.
  - **Enabled**: неудачные LLM API-вызовы автоматически повторяются, что полезно при нестабильной сети или rate limit.
  - **Connection Test Fallback**: даже если обычные вызовы не работают в stable mode, test connection после первой временной сетевой ошибки переключается на тот же retry-сценарий.
  - **Runtime Transport Fallback (Environment-Aware)**: длительные task-request, временно оборванные `requestUrl`, сначала повторяют ту же попытку через environment-aware fallback. На desktop это Node `http/https`, вне desktop — браузерный `fetch`. Такие fallback-попытки используют protocol-aware streaming parsing для OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE и Ollama NDJSON output, так что медленные gateway успевают вернуть body chunks раньше. Остальные прямые OpenAI-style entrypoint используют этот же общий fallback-путь.
  - **OpenAI-Compatible Stable Order**: в stable mode каждая попытка для OpenAI-compatible теперь идёт по порядку `direct streaming -> direct non-stream -> requestUrl (со streamed fallback при необходимости)` и только потом засчитывается как неудачная. Это снижает число слишком агрессивных отказов, когда нестабилен только один transport mode.
- **Retry Interval (seconds)**: отображается только при включённой стабильности. Задает время между retry-попытками, диапазон 1-300 секунд. По умолчанию: 5.
- **Maximum Retries**: отображается только при включённой стабильности. Максимум retry-попыток, диапазон 0-10. По умолчанию: 3.
- **API Error Debugging Mode**:
  - **Disabled (по умолчанию)**: обычный краткий error reporting.
  - **Enabled**: включает подробный журнал ошибок для всех провайдеров и задач, в том числе Translate, Search и Connection Tests. Сохраняются HTTP status code, сырой response text, timeline транспорта, обезличенные request URL и headers, длительность попытки, response headers, частичные response body, частично разобранный stream output и stack trace.
- **Developer Mode**:
  - **Disabled (по умолчанию)**: скрывает все developer-only diagnostics control.
  - **Enabled**: показывает dedicated developer diagnostics panel в settings.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: позволяет выбрать runtime path для probe. Для OpenAI-compatible доступны forced mode (`direct streaming`, `direct buffered`, `requestUrl-only`) помимо обычных runtime mode.
  - **Run Diagnostic**: запускает один long-request probe в выбранном call mode и создаёт `Notemd_Provider_Diagnostic_*.txt` в корне vault.
  - **Run Stability Test**: повторяет probe заданное число раз (1-10) в выбранном call mode и сохраняет aggregated stability report.
  - **Diagnostic Timeout**: настраиваемый timeout на один запуск (15-3600 секунд).
  - **Почему это полезно**: такой probe быстрее ручного воспроизведения, когда провайдер проходит "Test connection", но падает на реальных длинных задачах, например при переводе через медленный gateway.

<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Общие настройки

#### Output обработанных файлов
- **Customize Processed File Save Path**:
  - **Disabled (по умолчанию)**: обработанные файлы, например `YourNote_processed.md`, сохраняются в **той же папке**, что и оригинал.
  - **Enabled**: позволяет указать собственный путь сохранения.
- **Processed File Folder Path**: отображается только если пункт выше включён. Укажите **относительный путь** внутри vault, например `Processed Notes` или `Output/LLM`, куда будут сохраняться обработанные файлы. Если папки не существует, она будет создана. **Не используйте абсолютные пути (`C:\...`) и запрещённые символы.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Disabled (по умолчанию)**: обработанные файлы, создаваемые командой Add Links, используют стандартный суффикс `_processed.md`, например `YourNote_processed.md`.
  - **Enabled**: позволяет настроить output filename через настройку ниже.
- **Custom Suffix/Replacement String**: отображается только если пункт выше включён.
  - Если оставить поле **пустым**, исходный файл будет **перезаписан** обработанным содержимым.
  - Если указать строку, например `_linked`, она будет добавлена к исходному имени файла, например `YourNote_linked.md`. Убедитесь, что суффикс не содержит запрещённых для имени файла символов.
- **Remove Code Fences on Add Links**:
  - **Disabled (по умолчанию)**: code fence **(\`\\\`\`)** сохраняются при добавлении ссылок, а **(\`\\\`markdown)** удаляются автоматически.
  - **Enabled**: удаляет code fence перед обработкой Add Links.

<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Output concept-note
- **Customize Concept Note Path**:
  - **Disabled (по умолчанию)**: автоматическое создание заметок для `[[linked concepts]]` выключено.
  - **Enabled**: позволяет указать папку, где будут создаваться новые concept-note.
- **Concept Note Folder Path**: отображается только при включённой настройке выше. Укажите **относительный путь** внутри vault, например `Concepts` или `Generated/Topics`. Папки будут созданы автоматически. **Поле обязательно при включённой настройке.** **Не используйте абсолютные пути и запрещённые символы.**

<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Output concept log file
- **Generate Concept Log File**:
  - **Disabled (по умолчанию)**: log file не создаётся.
  - **Enabled**: после обработки создаётся log file со списком новых concept-note в формате:
    ```
    generate xx concepts md file
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: отображается только если включён "Generate Concept Log File".
  - **Disabled (по умолчанию)**: log file сохраняется в **Concept Note Folder Path** (если она указана) либо в корне vault.
  - **Enabled**: позволяет задать отдельную папку для log file.
- **Concept Log Folder Path**: отображается только при включённом "Customize Log File Save Path". Укажите **относительный путь** внутри vault, например `Logs/Notemd`, куда будет сохраняться лог.
- **Customize Log File Name**: отображается только если включён "Generate Concept Log File".
  - **Disabled (по умолчанию)**: имя log file — `Generate.log`.
  - **Enabled**: позволяет указать своё имя файла.
- **Concept Log File Name**: отображается только при включённом "Customize Log File Name". Введите желаемое имя файла, например `ConceptCreation.log`. **Поле обязательно при включённой настройке.**

<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Задача Extract Concepts
- **Create minimal concept notes**:
  - **On (по умолчанию)**: новые concept-note будут содержать только заголовок, например `# Concept`.
  - **Off**: concept-note могут включать дополнительное содержимое, например backlink "Linked From", если это не запрещено настройкой ниже.
- **Add "Linked From" backlink**:
  - **Off (по умолчанию)**: backlink на исходный документ во время extraction не добавляется.
  - **On**: добавляет секцию "Linked From" со ссылкой на исходный файл.

#### Extract Specific Original Text
- **Questions for extraction**: введите список вопросов, по одному на строку, для которых ИИ должен извлечь дословные ответы из ваших заметок.
- **Translate output to corresponding language**:
  - **Off (по умолчанию)**: output содержит только extracted text на исходном языке.
  - **On**: к extracted text добавляется перевод на язык, выбранный для этой задачи.
- **Merged query mode**:
  - **Off**: каждый вопрос обрабатывается отдельно; это обычно точнее, но требует больше API-вызовов.
  - **On**: все вопросы отправляются одной prompt; это быстрее и экономит API-вызовы.
- **Customise extracted text save path & filename**:
  - **Off**: файл сохраняется рядом с оригиналом с суффиксом `_Extracted`.
  - **On**: можно указать собственную папку output и суффикс имени файла.

#### Batch Mermaid Fix
- **Enable Mermaid Error Detection**:
  - **Off (по умолчанию)**: проверка на Mermaid errors после обработки не выполняется.
  - **On**: обработанные файлы сканируются на оставшиеся Mermaid syntax error и создаётся отчёт `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Off**: файлы с ошибками остаются на месте.
  - **On**: файлы, в которых после попытки исправления всё ещё обнаруживаются Mermaid syntax error, переносятся в отдельную папку для ручной проверки.
- **Mermaid error folder path**: отображается только если включён предыдущий пункт. Это путь к папке, куда перемещаются проблемные файлы.

#### Параметры обработки
- **Enable Batch Parallelism**:
  - **Disabled (по умолчанию)**: batch-задачи, например "Process Folder" или "Batch Generate from Titles", обрабатывают файлы последовательно.
  - **Enabled**: позволяет обрабатывать несколько файлов параллельно, что существенно ускоряет крупные batch-job.
- **Batch Concurrency**: отображается только при включённом parallelism. Задаёт максимум файлов, обрабатываемых параллельно. Большие значения ускоряют выполнение, но требуют больше ресурсов и могут уткнуться в rate limit API. По умолчанию: `1`, диапазон: `1-20`.
- **Batch Size**: отображается только при включённом parallelism. Количество файлов в одной batch-группе. По умолчанию: `50`, диапазон: `10-200`.
- **Delay Between Batches (ms)**: отображается только при включённом parallelism. Опциональная пауза между пакетами. По умолчанию: `1000ms`.
- **API Call Interval (ms)**: минимальная задержка в миллисекундах **до и после** каждого отдельного LLM API-вызова. Полезно для low-rate API и для предотвращения 429. Значение `0` означает отсутствие искусственной задержки. По умолчанию: `500ms`.
- **Chunk Word Count**: максимальное количество слов в одном chunk, отправляемом в LLM. Влияет на количество API-вызовов для больших файлов. По умолчанию: `3000`.
- **Enable Duplicate Detection**: включает базовую проверку повторяющихся слов в обработанном контенте; результат пишется в консоль. По умолчанию: включено.
- **Max Tokens**: максимальное число токенов, которое LLM должна сгенерировать на один response chunk. Влияет на стоимость и детализацию. По умолчанию: `4096`.

<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Перевод
- **Default Target Language**: выберите язык, на который по умолчанию будут переводиться заметки. Это значение можно переопределить через UI при запуске команды перевода. По умолчанию: English.
- **Customise Translation File Save Path**:
  - **Disabled (по умолчанию)**: translated file сохраняются в **той же папке**, что и оригинал.
  - **Enabled**: позволяет указать **относительный путь** внутри vault, например `Translations`, куда будут сохраняться translated file. Папки будут созданы автоматически.
- **Use custom suffix for translated files**:
  - **Disabled (по умолчанию)**: translated file используют стандартный суффикс `_translated.md`, например `YourNote_translated.md`.
  - **Enabled**: позволяет указать свой суффикс.
- **Custom Suffix**: отображается только если пункт выше включён. Введите пользовательский суффикс, который будет добавляться к translated filename, например `_es` или `_fr`.

<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Генерация контента
- **Enable Research in "Generate from Title"**:
  - **Disabled (по умолчанию)**: "Generate from Title" использует только заголовок как input.
  - **Enabled**: перед генерацией выполняется web research через настроенный **Web Research Provider**, а результаты передаются модели как контекст.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Enabled (по умолчанию)**: после Mermaid-related workflow, таких как Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid и Translate, автоматически запускается проход исправления Mermaid syntax.
  - **Disabled**: generated Mermaid output остаётся без изменений, пока вы не запустите `Batch Mermaid Fix` вручную или не добавите его в custom workflow.
- **Output Language**:
  - Выберите желаемый язык output для задач "Generate from Title" и "Batch Generate from Title".
  - **English (по умолчанию)**: prompt обрабатывается и output формируется на английском.
  - **Другие языки**: модели даётся указание выполнять рассуждение на английском, но финальную документацию возвращать на выбранном языке, например Español, Français, 简体中文, 繁體中文, العربية, हिन्दी и др.
- **Change Prompt Word**:
  - Позволяет изменить prompt word для конкретной задачи.
  - В поле **Custom Prompt Word** можно ввести собственную формулировку.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Disabled (по умолчанию)**: успешно сгенерированные файлы перемещаются в подпапку `[OriginalFolderName]_complete` относительно родителя исходной папки (или `Vault_complete`, если исходная папка была корнем vault).
  - **Enabled**: позволяет указать своё имя подпапки, куда будут перемещаться completed file.
- **Custom Output Folder Name**: отображается только если предыдущий пункт включён. Укажите желаемое имя подпапки, например `Generated Content` или `_complete`. Недопустимые символы запрещены. Если оставить поле пустым, используется `_complete`.

#### One-click Workflow Buttons
- **Visual Workflow Builder**: позволяет создавать custom workflow button из встроенных действий без ручного написания DSL.
- **Custom Workflow Buttons DSL**: для продвинутых пользователей остаётся возможность править текстовое описание workflow напрямую. Невалидный DSL безопасно откатывается к стандартному workflow и сопровождается предупреждением в sidebar/settings UI.
- **Workflow Error Strategy**:
  - **Stop on Error (по умолчанию)**: workflow сразу останавливается при падении любого шага.
  - **Continue on Error**: workflow продолжает запускать следующие шаги и в конце сообщает число failed action.
- **Default Workflow Included**: `One-Click Extract` объединяет `Process File (Add Links)`, `Batch Generate from Titles` и `Batch Mermaid Fix`.

#### Настройки custom prompt
Эта возможность позволяет переопределить стандартные инструкции, отправляемые в LLM для конкретных задач, и получить тонкий контроль над output.

- **Enable Custom Prompts for Specific Tasks**:
  - **Disabled (по умолчанию)**: плагин использует встроенные prompt для всех операций.
  - **Enabled**: включает возможность задавать custom prompt для задач, перечисленных ниже. Это мастер-переключатель всей функции.
- **Use Custom Prompt for [Task Name]**:
  - Для каждой поддерживаемой задачи ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts") custom prompt можно включать и выключать отдельно.
  - **Disabled**: эта конкретная задача использует стандартный prompt.
  - **Enabled**: задача использует текст, который вы укажете в соответствующем поле "Custom Prompt".
- **Custom Prompt Text Area**:
  - **Default Prompt Display**: для справки плагин показывает стандартный prompt, который обычно использовался бы для задачи. Кнопка **"Copy Default Prompt"** копирует его как основу для вашего custom prompt.
  - **Custom Prompt Input**: здесь вы пишете собственные инструкции для LLM.
  - **Placeholders**: в prompt можно и нужно использовать специальные placeholder, которые плагин заменит реальным содержимым перед отправкой запроса. Посмотрите на default prompt, чтобы понять, какие placeholder доступны для конкретной задачи. Наиболее частые:
    - `{TITLE}`: заголовок текущей заметки.
    - `{RESEARCH_CONTEXT_SECTION}`: контент, собранный веб-исследованием.
    - `{USER_PROMPT}`: содержимое обрабатываемой заметки.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Duplicate Check Scope
- **Duplicate Check Scope Mode**: определяет, какие файлы сравниваются с заметками в вашей Concept Note Folder для поиска потенциальных дубликатов.
  - **Entire Vault (по умолчанию)**: сравнивает concept-note со всеми остальными заметками в vault, кроме самой Concept Note Folder.
  - **Include Specific Folders Only**: сравнивает concept-note только с заметками из папок, перечисленных ниже.
  - **Exclude Specific Folders**: сравнивает concept-note со всеми заметками, кроме находящихся в перечисленных ниже папках, а также исключает саму Concept Note Folder.
  - **Concept Folder Only**: сравнивает concept-note только с **другими заметками внутри самой Concept Note Folder**. Это полезно для поиска дубликатов только среди сгенерированных concept-note.
- **Include/Exclude Folders**: отображается, если mode — `Include` или `Exclude`. Укажите **относительные пути** папок, по **одному пути на строку**. Путь чувствителен к регистру и использует `/` как разделитель, например `Reference Material/Papers` или `Daily Notes`. Эти папки не должны совпадать с Concept Note Folder и не должны лежать внутри неё.

#### Web Research Provider
- **Search Provider**: выбор между `Tavily` (нужен API key, рекомендуется) и `DuckDuckGo` (экспериментально, поиск часто блокирует автоматические запросы). Используется для "Research & Summarize Topic" и, при желании, для "Generate from Title".
- **Tavily API Key**: отображается только если выбран Tavily. Введите API key с [tavily.com](https://tavily.com/).
- **Tavily Max Results**: отображается только при выбранном Tavily. Максимум результатов поиска, который должен вернуть Tavily: `1-20`. По умолчанию: `5`.
- **Tavily Search Depth**: отображается только при выбранном Tavily. Можно выбрать `basic` (по умолчанию) или `advanced`. `advanced` даёт лучшие результаты, но тратит 2 API credits вместо 1.
- **DuckDuckGo Max Results**: отображается только при выбранном DuckDuckGo. Максимум результатов, которые будет пытаться распарсить плагин: `1-10`. По умолчанию: `5`.
- **DuckDuckGo Content Fetch Timeout**: отображается только при выбранном DuckDuckGo. Максимальное число секунд ожидания при попытке получить контент по каждому URL результата DuckDuckGo. По умолчанию: `15`.
- **Max Research Content Tokens**: примерный максимум токенов из совокупных результатов web research, которые будут включены в summarization prompt. Это помогает контролировать размер контекстного окна и стоимость. По умолчанию: `3000`.

<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Focused Learning Domain
- **Enable Focused Learning Domain**:
  - **Disabled (по умолчанию)**: prompt, отправляемые в LLM, используют стандартные инструкции общего назначения.
  - **Enabled**: позволяет указать одну или несколько предметных областей, чтобы улучшить контекстное понимание модели.
- **Learning Domain**: отображается только если предыдущий пункт включён. Укажите вашу предметную область, например `Materials Science`, `Polymer Physics`, `Machine Learning`. Это добавляет в начало prompt строку вида `Relevant Fields: [...]`, что помогает модели точнее строить ссылки и генерировать контент в нужной области.

<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Руководство по использованию

### Быстрые workflow и sidebar

- Откройте Notemd sidebar, чтобы получить доступ к сгруппированным секциям действий для core processing, generation, translation, knowledge и utilities.
- Используйте область **Quick Workflows** в верхней части sidebar для запуска пользовательских многошаговых кнопок.
- Стандартный workflow **One-Click Extract** запускает `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Прогресс workflow, per-step logs и ошибки отображаются прямо в sidebar; закреплённый footer не даёт progress bar и log area исчезнуть при раскрытии секций.
- Карточка прогресса держит status text, отдельную плашку с процентом и оставшееся время в читаемом виде, а те же custom workflow можно перенастраивать из settings.

### Исходная обработка (добавление wiki-links)
Это базовая функция плагина: обнаружение понятий и добавление `[[wiki-links]]`.

**Важно:** процесс работает только с файлами `.md` или `.txt`. PDF можно бесплатно перевести в MD через [Mineru](https://github.com/opendatalab/MinerU), а затем уже обрабатывать дальше.

1. **Через sidebar**:
   - Откройте Notemd Sidebar (значок волшебной палочки или палитра команд).
   - Откройте `.md` или `.txt` файл.
   - Нажмите **"Process File (Add Links)"**.
   - Чтобы обработать папку, нажмите **"Process Folder (Add Links)"**, выберите папку и подтвердите обработку.
   - Прогресс отображается в sidebar. Задачу можно отменить кнопкой "Cancel Processing".
   - *Примечание для folder processing:* файлы обрабатываются в фоне и не открываются в редакторе.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Через палитру команд** (`Ctrl+P` или `Cmd+P`):
   - **Один файл**: откройте файл и запустите `Notemd: Process Current File`.
   - **Папка**: запустите `Notemd: Process Folder`, затем выберите папку. Файлы будут обработаны в фоне, без открытия в редакторе.
   - Для действий из палитры команд появляется progress modal с кнопкой отмены.
   - *Примечание:* перед сохранением плагин автоматически удаляет ведущие строки `\boxed{` и хвостовые `}` из финального обработанного контента, если они встречаются.

### Новые возможности

1. **Summarise as Mermaid diagram**:
   - Откройте заметку, которую хотите суммаризировать.
   - Запустите команду `Notemd: Summarise as Mermaid diagram` через палитру команд или кнопку в sidebar.
   - Плагин сгенерирует новую заметку с Mermaid-диаграммой.

2. **Translate Note/Selection**:
   - Выделите текст в заметке, чтобы перевести только его, или запустите команду без выделения, чтобы перевести всю заметку.
   - Запустите `Notemd: Translate Note/Selection` через палитру команд или кнопку в sidebar.
   - Появится modal, в котором можно подтвердить или изменить **Target Language**; по умолчанию используется значение из settings.
   - Для перевода плагин использует настроенный **LLM Provider** с учётом multi-model settings.
   - Переведённый контент сохраняется по настроенному **Translation Save Path** с корректным суффиксом и открывается в **новой панели справа** от оригинала для удобного сравнения.
   - Задачу можно отменить через кнопку в sidebar или cancel button в modal.

3. **Batch Translate**:
   - Запустите `Notemd: Batch Translate Folder` из палитры команд и выберите папку, либо нажмите правой кнопкой по папке в file explorer и выберите "Batch translate this folder".
   - Плагин переведёт все Markdown-файлы в выбранной папке.
   - Переведённые файлы сохраняются по настроенному translation path, но не открываются автоматически.
   - Процесс можно отменить через progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

4. **Research & Summarize Topic**:
   - Выделите текст в заметке **или** убедитесь, что у заметки есть заголовок; он и будет search topic.
   - Запустите `Notemd: Research and Summarize Topic` через палитру команд или кнопку в sidebar.
   - Плагин использует настроенный **Search Provider** (Tavily/DuckDuckGo) и соответствующий **LLM Provider** с учётом multi-model settings, чтобы найти и суммаризировать информацию.
   - Сгенерированное summary дописывается в текущую заметку.
   - Задачу можно отменить через кнопку в sidebar или через modal.
   - *Примечание:* DuckDuckGo может сбоить из-за bot detection; Tavily рекомендуется.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

5. **Generate Content from Title**:
   - Откройте заметку; она может быть пустой.
   - Запустите `Notemd: Generate Content from Title` через палитру команд или кнопку в sidebar.
   - Плагин использует подходящий **LLM Provider** согласно multi-model settings, чтобы сгенерировать контент по заголовку заметки, заменяя существующее содержимое.
   - Если включена настройка **"Enable Research in 'Generate from Title'"**, перед генерацией выполняется web research через выбранный **Web Research Provider**, а результаты включаются в prompt.
   - Задачу можно отменить через sidebar или modal.

6. **Batch Generate Content from Titles**:
   - Запустите `Notemd: Batch Generate Content from Titles` через палитру команд или кнопку в sidebar.
   - Выберите папку с заметками, которые хотите обработать.
   - Плагин пройдёт по каждому `.md` файлу в папке, исключая `_processed.md` и файлы внутри designated "complete" folder, сгенерирует контент по заголовку и заменит существующее содержимое. Файлы обрабатываются в фоне и не открываются в редакторе.
   - Успешно обработанные файлы перемещаются в настроенную "complete" folder.
   - Команда учитывает настройку **"Enable Research in 'Generate from Title'"** для каждого файла.
   - Задачу можно отменить через sidebar или modal.
   - Progress и результаты (число изменённых файлов, ошибки) выводятся в лог sidebar/modal.

<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

7. **Check and Remove Duplicate Concept Notes**:
   - Убедитесь, что **Concept Note Folder Path** корректно настроен.
   - Запустите `Notemd: Check and Remove Duplicate Concept Notes` через палитру команд или кнопку в sidebar.
   - Плагин сканирует папку concept-note и сравнивает её имена файлов с заметками вне этой папки по нескольким правилам: exact match, plurals, normalization и containment.
   - Если потенциальные дубликаты найдены, открывается modal со списком файлов, причиной попадания и конфликтующими файлами.
   - Внимательно проверьте список. Нажмите **"Delete Files"**, чтобы перенести перечисленные файлы в системную корзину, либо **"Cancel"**, чтобы ничего не делать.
   - Ход и результат операции отображаются в sidebar/modal log.

8. **Extract Concepts (Pure Mode)**:
   - Эта функция извлекает понятия из документа и создаёт соответствующие concept-note **без изменения исходного файла**. Это удобно для быстрого наполнения базы знаний по набору документов.
   - **Single File**: откройте файл и запустите `Notemd: Extract concepts (create concept notes only)` через палитру команд или нажмите кнопку **"Extract concepts (current file)"** в sidebar.
   - **Folder**: запустите `Notemd: Batch extract concepts from folder` через палитру команд или нажмите **"Extract concepts (folder)"** в sidebar, затем выберите папку для обработки всех заметок внутри неё.
   - Плагин прочитает файлы, выделит понятия и создаст новые заметки в вашей **Concept Note Folder**, не меняя оригинальные файлы.

9. **Create Wiki-Link & Generate Note from Selection**:
   - Эта команда упрощает создание и автоматическое наполнение новых concept-note.
   - Выделите слово или фразу в редакторе.
   - Запустите `Notemd: Create Wiki-Link & Generate Note from Selection`; рекомендуется назначить hotkey, например `Cmd+Shift+W`.
   - Плагин:
     1. заменит выделенный текст на `[[wiki-link]]`;
     2. проверит, существует ли уже заметка с таким заголовком в **Concept Note Folder**;
     3. если заметка уже есть, добавит в неё backlink на текущую заметку;
     4. если заметки нет, создаст новую пустую заметку;
     5. затем автоматически запустит **"Generate Content from Title"** для новой или существующей заметки и заполнит её AI-содержимым.

10. **Extract Concepts and Generate Titles**:
    - Эта команда объединяет две мощные функции в один workflow.
    - Запустите `Notemd: Extract Concepts and Generate Titles` из палитры команд; рекомендуется назначить ей hotkey.
    - Плагин:
      1. сначала выполнит **"Extract concepts (current file)"** для активного файла;
      2. затем автоматически выполнит **"Batch generate from titles"** для папки, настроенной в settings как **Concept note folder path**.
    - Такой workflow позволяет сначала быстро пополнить базу знаний новыми concept-note из исходного документа, а затем сразу наполнить эти note AI-содержимым за один запуск.

11. **Extract Specific Original Text**:
    - Настройте вопросы в settings в разделе "Extract Specific Original Text".
    - Используйте кнопку "Extract Specific Original Text" в sidebar для обработки активного файла.
    - **Merged Mode**: ускоряет обработку, отправляя все вопросы в одном prompt.
    - **Translation**: при желании переводит извлечённый текст на ваш настроенный язык.
    - **Custom Output**: позволяет настроить, куда и под каким именем сохраняется extracted file.

12. **Batch Mermaid Fix**:
    - Используйте кнопку "Batch Mermaid Fix" в sidebar, чтобы просканировать папку и исправить распространённые Mermaid syntax error.
    - Плагин создаст файл `mermaid_error_{foldername}.md` со списком файлов, в которых всё ещё остались ошибки.
    - Дополнительно можно настроить автоматическое перемещение проблемных файлов в отдельную папку для проверки.

## Поддерживаемые LLM-провайдеры

| Провайдер | Тип | Нужен API Key | Примечания |
|---|---|---|---|
| DeepSeek | Облачный | Да | Нативный endpoint DeepSeek с обработкой reasoning-model |
| Qwen | Облачный | Да | Preset совместимого режима DashScope для моделей Qwen / QwQ |
| Qwen Code | Облачный | Да | Preset DashScope для кодовых моделей Qwen |
| Doubao | Облачный | Да | Preset Volcengine Ark; в поле model обычно указывается endpoint ID |
| Moonshot | Облачный | Да | Официальный endpoint Kimi / Moonshot |
| GLM | Облачный | Да | Официальный OpenAI-compatible endpoint Zhipu BigModel |
| Z AI | Облачный | Да | Международный OpenAI-compatible endpoint GLM/Zhipu; дополняет `GLM` |
| MiniMax | Облачный | Да | Официальный chat-completions endpoint MiniMax |
| Huawei Cloud MaaS | Облачный | Да | OpenAI-compatible endpoint Huawei ModelArts MaaS |
| Baidu Qianfan | Облачный | Да | Официальный OpenAI-compatible endpoint Qianfan для моделей ERNIE |
| SiliconFlow | Облачный | Да | Официальный OpenAI-compatible endpoint SiliconFlow для размещённых OSS-моделей |
| OpenAI | Облачный | Да | Поддерживает модели GPT и серии o |
| Anthropic | Облачный | Да | Поддерживает модели Claude |
| Google | Облачный | Да | Поддерживает модели Gemini |
| Mistral | Облачный | Да | Поддерживает семейства Mistral и Codestral |
| Azure OpenAI | Облачный | Да | Требуются Endpoint, API Key, deployment name и API Version |
| OpenRouter | Gateway | Да | Доступ ко многим провайдерам через OpenRouter model ID |
| xAI | Облачный | Да | Нативный endpoint Grok |
| Groq | Облачный | Да | Быстрый OpenAI-compatible inference для размещённых OSS-моделей |
| Together | Облачный | Да | OpenAI-compatible endpoint для размещённых OSS-моделей |
| Fireworks | Облачный | Да | OpenAI-compatible inference endpoint |
| Requesty | Gateway | Да | Multi-provider router за одним API key |
| OpenAI Compatible | Gateway | Опционально | Generic preset для LiteLLM, vLLM, Perplexity, Vercel AI Gateway и т. п. |
| LMStudio | Локальный | Опционально (`EMPTY`) | Запускает модели локально через сервер LM Studio |
| Ollama | Локальный | Нет | Запускает модели локально через сервер Ollama |

*Примечание: для локальных провайдеров (LMStudio, Ollama) убедитесь, что сервер запущен и доступен по настроенному Base URL.*
*Примечание: для OpenRouter и Requesty используйте полные model identifier от gateway, например `google/gemini-flash-1.5` или `anthropic/claude-3-7-sonnet-latest`.*
*Примечание: `Doubao` обычно ожидает Ark endpoint/deployment ID в поле model, а не сырое family-name модели. Settings UI предупреждает, если там всё ещё placeholder, и блокирует test connection, пока вы не замените его настоящим endpoint ID.*
*Примечание: `Z AI` нацелен на международную линию `api.z.ai`, тогда как `GLM` оставляет endpoint материкового BigModel China. Выбирайте preset в зависимости от региона аккаунта.*
*Примечание: пресеты для китайских провайдеров используют chat-first connection check, чтобы тест проверял именно реальную модель/deployment, а не только достижимость API key.*
*Примечание: `OpenAI Compatible` предназначен для кастомных gateway и proxy. Настройте Base URL, политику API key и model ID согласно документации вашего провайдера.*

## Использование сети и обработка данных

Notemd работает локально внутри Obsidian, но некоторые возможности выполняют исходящие сетевые запросы.

### Вызовы к LLM-провайдерам (настраиваемо)

- Trigger: обработка файлов, генерация, перевод, research summarization, Mermaid summarization, а также connection/diagnostic action.
- Endpoint: base URL провайдера, настроенный в settings Notemd.
- Передаваемые данные: prompt-текст и task-content, необходимые для обработки.
- Примечание по данным: API key настраиваются локально в settings плагина и используются для подписи запросов непосредственно с вашего устройства.

### Запросы веб-исследования (опционально)

- Trigger: выполняются, когда включено web research и выбран search provider.
- Endpoint: Tavily API или endpoint DuckDuckGo.
- Передаваемые данные: ваш search query и необходимые request metadata.

### Developer diagnostics и debug log (опционально)

- Trigger: включённый API debug mode и developer diagnostic action.
- Хранение: diagnostic и error log записываются в корень vault, например `Notemd_Provider_Diagnostic_*.txt` и `Notemd_Error_Log_*.txt`.
- Риск: лог может содержать фрагменты request/response. Перед публикацией или отправкой логов кому-либо проверьте их содержимое.

### Локальное хранение

- Конфигурация плагина хранится в `.obsidian/plugins/notemd/data.json`.
- Сгенерированные файлы, отчёты и optional log сохраняются в ваш vault согласно настройкам.

## Устранение неполадок

### Типичные проблемы
- **Плагин не загружается**: убедитесь, что `manifest.json`, `main.js` и `styles.css` лежат в правильной папке: `<Vault>/.obsidian/plugins/notemd/`. Перезапустите Obsidian. Также проверьте Developer Console (`Ctrl+Shift+I` или `Cmd+Option+I`) на ошибки во время старта.
- **Сбой обработки / API-ошибки**:
  1. **Проверьте формат файла**: сейчас Notemd работает только с `.md` и `.txt`.
  2. Используйте команду или кнопку "Test LLM Connection", чтобы проверить настройки активного провайдера.
  3. Ещё раз проверьте API Key, Base URL, Model Name и API Version (для Azure). Убедитесь, что ключ действителен и у него хватает квоты/прав.
  4. Для локальных LLM (LMStudio, Ollama) проверьте, что сервер запущен, а Base URL указан верно, например `http://localhost:1234/v1` для LMStudio.
  5. Для облачных провайдеров проверьте доступ в интернет.
  6. **Для ошибок single-file processing**: смотрите подробные сообщения в Developer Console. При необходимости используйте кнопку копирования в error modal.
  7. **Для batch-processing ошибок**: проверяйте файл `error_processing_filename.log` в корне vault. Там будут подробные сообщения для каждого неудачного файла. Developer Console или error modal обычно покажут только summary или общую batch-ошибку.
  8. **Автоматические error log**: если процесс падает, плагин автоматически сохраняет подробный лог `Notemd_Error_Log_[Timestamp].txt` в корень vault. В нём есть сообщение об ошибке, stack trace и session log. Если проблема воспроизводится, первым делом проверьте этот файл. При включённом "API Error Debugging Mode" лог будет содержать ещё больше деталей API-ответов.
  9. **Диагностика реального endpoint для длинных запросов (Developer)**:
     - Внутри плагина: используйте **Settings -> Notemd -> Developer provider diagnostic (long request)**, чтобы запустить runtime probe для активного провайдера и создать `Notemd_Provider_Diagnostic_*.txt` в корне vault.
     - Через CLI, вне рантайма Obsidian: для воспроизводимого сравнения buffered и streaming поведения endpoint можно выполнить:
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
       Сгенерированный отчёт включает тайминги по попыткам (`First Byte`, `Duration`), обезличенные request metadata, response headers, сырой/частичный body, parsed stream fragment и точку transport-level failure.
- **Проблемы соединения с LM Studio/Ollama**:
  - **Test Connection Fails**: убедитесь, что локальный сервер запущен и нужная модель действительно загружена/доступна.
  - **CORS-ошибки (Ollama на Windows)**: если при использовании Ollama в Windows вы сталкиваетесь с CORS, задайте переменную окружения `OLLAMA_ORIGINS`. Например, выполните `set OLLAMA_ORIGINS=*` в командной строке перед запуском Ollama.
  - **Включите CORS в LM Studio**: для LM Studio CORS можно активировать прямо в server settings; это бывает необходимо, если Obsidian работает в браузере или под жёсткой политикой origin.
- **Ошибки создания папок ("File name cannot contain...")**:
  - Обычно это означает, что путь в settings (**Processed File Folder Path** или **Concept Note Folder Path**) некорректен **с точки зрения Obsidian**.
  - Используйте только **относительные пути**, например `Processed`, `Notes/Concepts`, а не абсолютные (`C:\Users\...`, `/Users/...`).
  - Проверьте недопустимые символы: `* " \ / < > : | ? # ^ [ ]`. Обратите внимание: даже в Windows для путей Obsidian символ `\` недопустим; используйте `/`.
- **Проблемы производительности**: обработка больших файлов и больших batch-наборов может занимать время. Попробуйте уменьшить `Chunk Word Count` для более коротких, но более частых API-вызовов. Также можно попробовать другого провайдера или модель.
- **Неожиданные ссылки**: качество link-результата сильно зависит от модели и prompt. Экспериментируйте с разными моделями и параметрами temperature.

## Вклад в проект

Вклад приветствуется. Руководствуйтесь информацией в GitHub-репозитории: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Документация для мейнтейнера

- [Release Workflow (English)](./docs/maintainer/release-workflow.md)
- [Release Workflow (简体中文)](./docs/maintainer/release-workflow.zh-CN.md)

## Лицензия

MIT License — подробности см. в файле [LICENSE](LICENSE).

---

*Notemd v1.8.1 — усиливайте граф знаний Obsidian с помощью ИИ.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
