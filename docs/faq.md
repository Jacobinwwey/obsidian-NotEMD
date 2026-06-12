# Frequently Asked Questions

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I install Notemd in Obsidian?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Open Obsidian Settings → Community Plugins → Browse → search 'Notemd' → Install → Enable. Requires Obsidian 0.15.0+. The plugin has 4k+ downloads, 44 releases, and is MIT licensed. You can also install manually by downloading main.js, styles.css, and manifest.json from GitHub Releases into your vault's .obsidian/plugins/notemd/ folder."
      }
    },
    {
      "@type": "Question",
      "name": "What LLM providers does Notemd support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Notemd supports 30+ providers including OpenAI, Anthropic (Claude), Google (Gemini), DeepSeek, Qwen, Qwen Code, Ollama, Azure OpenAI, SiliconFlow, Moonshot, GLM, Z AI, xAI, Groq, Together AI, LM Studio, Mistral, OpenRouter, and any OpenAI-compatible endpoint. You can configure different providers per task (linking, research, translation, generation) with per-task model selection."
      }
    },
    {
      "@type": "Question",
      "name": "How does Notemd differ from ChatGPT for paper reading?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ChatGPT gives you an answer in the current chat session; Notemd writes results back into your Obsidian vault as wiki-links, concept notes, translations, diagrams, and workflow artifacts. Your reading accumulation persists in your knowledge base as structured files, not in ephemeral chat history. You can reference, link, and build upon these artifacts weeks or months later."
      }
    },
    {
      "@type": "Question",
      "name": "Can Notemd work with local LLMs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Notemd fully supports Ollama and any OpenAI-Compatible local gateway (LM Studio, vLLM, LocalAI, etc.). Local models work for all tasks: wiki-linking, concept note generation, translation, research summarization, and diagram generation. You can mix local and cloud providers — for example, use Ollama for linking and OpenAI for research."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Notemd one-click workflow?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Notemd lets you chain multiple actions (add links → extract concepts → research → generate mermaid) into a single sidebar button. The default 'One-Click Extract' runs 4 steps in sequence. You can create custom chains with a DSL format like: process-current-add-links>extract-concepts-current>research-and-summarize>summarize-as-mermaid. Each workflow button appears in the sidebar for instant reuse."
      }
    },
    {
      "@type": "Question",
      "name": "Does Notemd support Chinese or other languages?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Notemd's UI supports 21+ languages including Chinese (Simplified and Traditional), Japanese, Korean, Arabic, German, French, Spanish, Russian, and more. Task output language is independently configurable — you can use a Chinese UI with English output, or vice versa. This is particularly useful for bilingual research workflows."
      }
    },
    {
      "@type": "Question",
      "name": "How does Notemd add wiki-links to notes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Notemd sends your note text to an LLM which identifies key concepts in context, then inserts Obsidian [[wiki-links]] at each occurrence. It can optionally auto-create concept notes in a configurable folder with backlinks to the source document. The concept extraction supports synonym suppression to avoid near-duplicate concepts, and maintains link integrity on rename/delete operations."
      }
    },
    {
      "@type": "Question",
      "name": "Which search services work with Notemd research?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Notemd supports Tavily (recommended, requires API key) and DuckDuckGo (experimental, no API key needed). When you run 'Research & summarize', Notemd queries the search service, sends results to your configured LLM for summarization, and appends the summary to your current note with source context. This creates a persistent research trail in your vault."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use Notemd for paper/PDF reading?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. First convert PDF to Markdown using tools like MinerU (recommended for academic papers), then open in Obsidian. Notemd can: add wiki-links to key terms, generate concept notes for unfamiliar concepts, extract specific original text via custom questions, research background topics, translate sections, and compress understanding into Mermaid diagrams. All results stay in your vault as persistent, linkable artifacts. Version 1.9.1+ includes chapter structure extraction with TOC support."
      }
    },
    {
      "@type": "Question",
      "name": "What graph/diagram types can Notemd generate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Notemd generates Mermaid flowcharts, sequence diagrams, class diagrams, state diagrams, entity-relationship diagrams, Gantt charts, JSON Canvas layouts, and Vega-Lite data charts. It includes a Mermaid syntax auto-fix feature with deep debug mode that repairs arrows, labels, comments, subgraphs, shapes, pipes, and notes. An experimental spec-first diagram pipeline can produce multiple chart types from a single natural-language prompt, with preview and export (SVG, PNG) support."
      }
    },
    {
      "@type": "Question",
      "name": "Is Notemd free and open source?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Notemd is fully open source under the MIT license. All source code is available on GitHub at https://github.com/Jacobinwwey/obsidian-NotEMD. There are no paid tiers, cloud dependencies, or proprietary components. You own your data and workflows. The project welcomes contributions and has 234+ stars and an active community."
      }
    },
    {
      "@type": "Question",
      "name": "How do I configure different models for different tasks?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In Notemd settings, each task type (linking, concept generation, research, translation, diagram generation) has an independent provider and model selector. For example, you might use: DeepSeek for linking (fast, cheap), Claude Opus for research (high quality), Gemini Flash for translation (multimodal), and local Ollama for diagram generation (private, no cost). This per-task configuration optimizes for speed, cost, and quality across your workflow."
      }
    }
  ]
}
</script>

## Installation & Setup

### How do I install Notemd in Obsidian?

Open Obsidian **Settings → Community Plugins → Browse** → search **"Notemd"** → **Install** → **Enable**.

**Requirements:**
- Obsidian 0.15.0+
- Supported on Desktop (Windows, macOS, Linux) and Mobile (iOS, Android)

**Manual installation:**
1. Download `main.js`, `styles.css`, `manifest.json` from [GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases)
2. Place them in `<your-vault>/.obsidian/plugins/notemd/`
3. Reload Obsidian and enable the plugin

**Stats:** 4k+ downloads, 44 releases, MIT licensed.

---

## LLM Configuration

### What LLM providers does Notemd support?

Notemd supports **30+ providers**:

**Cloud providers:**
- OpenAI (GPT-4, GPT-4o, GPT-4o-mini, o1, o3)
- Anthropic (Claude Opus, Sonnet, Haiku)
- Google (Gemini Pro, Flash, Ultra)
- xAI (Grok)
- Mistral, DeepSeek, Qwen, Moonshot, GLM

**China-focused:**
- Qwen, Qwen Code, Doubao, Moonshot, Xiaomi MiMo, GLM, Z AI, MiniMax
- Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow

**Local/self-hosted:**
- Ollama
- LM Studio
- Any OpenAI-compatible endpoint

**Gateways:**
- Azure OpenAI, OpenRouter, Together AI, Groq, AIHubMix
- GitHub Models, Fireworks, LiteLLM, Nebius, Cerebras
- Hugging Face, Vercel AI Gateway, Requesty

### Can Notemd work with local LLMs?

**Yes, fully supported.** Notemd works with:
- **Ollama** (native integration)
- **LM Studio** (via OpenAI-compatible endpoint)
- **vLLM, LocalAI, text-generation-webui** (via OpenAI-compatible mode)

All tasks work with local models: linking, concept generation, translation, research, and diagram generation.

**Mix & match example:**
- Ollama (local) for linking → fast, private, no cost
- OpenAI for research → high quality, web search integration
- Gemini for translation → multimodal support

### How do I configure different models for different tasks?

In **Notemd Settings**, each task has independent provider/model selectors:

| Task | Example Configuration |
|------|----------------------|
| **Linking** | DeepSeek (fast, cheap) |
| **Concept Generation** | Claude Opus (high quality) |
| **Research** | Perplexity or GPT-4o (web-grounded) |
| **Translation** | Gemini Flash (multimodal) |
| **Diagram Generation** | Ollama (local, private) |

This per-task optimization balances speed, cost, and quality.

---

## Core Features

### How does Notemd differ from ChatGPT for paper reading?

| Dimension | ChatGPT | Notemd |
|-----------|---------|--------|
| **Output location** | Chat history (ephemeral) | Obsidian vault (persistent files) |
| **Result format** | Text answer | Wiki-links, concept notes, diagrams, translations |
| **Long-term value** | Disappears after session | Accumulates into knowledge base |
| **Reusability** | Must re-query | Files stay, link, evolve |

**Use ChatGPT for:** Quick Q&A, one-off explanations  
**Use Notemd for:** Building a persistent, structured knowledge base over weeks/months

### How does Notemd add wiki-links to notes?

**Process:**
1. You run "Process file (add links)" on a note
2. Notemd sends the text to your configured LLM
3. The LLM identifies key concepts in context
4. Notemd inserts `[[wiki-links]]` at each concept occurrence
5. Optionally, it auto-creates concept notes in a folder you specify

**Features:**
- Synonym suppression (avoids "transformer" vs "transformers" duplicates)
- Backlinks from concept notes to source
- Link integrity on rename/delete
- Pure extraction mode (extract concepts without modifying the original)

### What is the Notemd one-click workflow?

**One-click workflows** chain multiple actions into a **single sidebar button**.

**Default workflow:** `One-Click Extract`
```
process-current-add-links > extract-concepts-current > research-and-summarize > summarize-as-mermaid
```

**Result:** One click runs:
1. Add wiki-links to current note
2. Generate concept notes for new terms
3. Research & append background
4. Compress into a Mermaid diagram

**Custom workflows:** Define your own in Settings with the DSL format. Each workflow becomes a reusable sidebar button.

---

## Research & Translation

### Which search services work with Notemd research?

| Service | API Key Required | Quality | Notes |
|---------|-----------------|---------|-------|
| **Tavily** | Yes | High | Recommended, AI-optimized search |
| **DuckDuckGo** | No | Experimental | No setup, lower quality |

**How "Research & summarize" works:**
1. You select a topic or run it on current note
2. Notemd queries the search service
3. Results → LLM summarization
4. Summary appended to your note with source citations

**Result:** Persistent research trail in your vault, not browser tabs.

### Does Notemd support Chinese or other languages?

**UI languages:** 21+ supported
- English, 中文 (简体), 中文 (繁體), 日本語, 한국어
- Arabic, German, French, Spanish, Russian, Portuguese, Italian
- Hindi, Bengali, Thai, Vietnamese, Turkish, Polish, Czech, and more

**Task output language:** Independent configuration
- UI in Chinese + output in English: ✅
- UI in English + output in Chinese: ✅

**Use case:** Bilingual researchers can keep UI in native language while generating English notes for publication.

---

## PDF & Academic Workflows

### Can I use Notemd for paper/PDF reading?

**Yes.** Workflow:
1. **Convert PDF → Markdown** using [MinerU](https://github.com/opendatalab/MinerU) (recommended for academic papers)
2. Open the Markdown file in Obsidian
3. Run Notemd tasks:
   - **Add wiki-links** to key terms
   - **Generate concept notes** for unfamiliar terminology
   - **Extract original text** via custom questions (e.g., "What are the limitations?")
   - **Research background** for cited methods/datasets
   - **Translate** difficult sections
   - **Compress to Mermaid** diagram for structural understanding

**Version 1.9.1+:** Chapter structure extraction with TOC support

**Result:** Your paper reading becomes a structured, linkable knowledge artifact in your vault.

---

## Diagrams & Visualization

### What graph/diagram types can Notemd generate?

| Type | Support | Features |
|------|---------|----------|
| **Mermaid** | Full | Flowchart, sequence, class, state, ER, Gantt, syntax auto-fix, batch validation |
| **JSON Canvas** | Full | Obsidian native canvas layouts |
| **Vega-Lite** | Full | Data charts, time series, bar, scatter, customizable |
| **HTML** | Fallback | For unsupported diagram types |

**Mermaid auto-fix:** Deep debug mode repairs:
- Broken arrows (`-->`, `-.->`, `==>`)
- Invalid labels, comments
- Subgraph syntax errors
- Shape notation (`[`, `(`, `{`, `((`)
- Pipe characters in labels
- Note attachments

**Workflow:**
1. Run "Summarize as Mermaid diagram" on a note
2. Preview in modal
3. Export as SVG or PNG
4. Or save as `.mmd` file in vault

---

## Open Source & Community

### Is Notemd free and open source?

**Yes.**
- **License:** MIT (permissive, commercial use OK)
- **Source code:** https://github.com/Jacobinwwey/obsidian-NotEMD
- **No paid tiers, no cloud lock-in, no telemetry**
- **Community:** 234+ GitHub stars, active Discord

**You own:**
- Your data (stays in your vault)
- Your workflows (customize prompts, models, chains)
- Your privacy (local LLM support)

**Contribute:** Pull requests welcome. See [CONTRIBUTING.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/CONTRIBUTING.md)

---

## Troubleshooting

### My LLM calls are failing. What should I check?

1. **API key valid?** Check Settings → Provider Configuration
2. **Model name correct?** Use "获取模型列表" (Get Model List) button in settings
3. **Network accessible?** Some providers require VPN
4. **Rate limits?** Check provider dashboard
5. **Diagnostics:** Run "Connection Test" in settings for detailed error logs

### Notemd is slow. How can I speed it up?

1. **Use faster models:** DeepSeek, Gemini Flash, GPT-4o-mini
2. **Reduce chunk size:** Settings → Smart Chunking → lower word count
3. **Parallel processing:** Settings → Batch Processing → increase concurrency
4. **Local models:** Ollama for tasks that don't need web search

### Can I use Notemd without an API key?

**Partial functionality:**
- **With local Ollama:** Full offline workflow (linking, concepts, translation, diagrams)
- **DuckDuckGo research:** No API key needed (experimental quality)
- **Formula fixing, chapter split:** No LLM required

**Requires API key:** Provider-based tasks (OpenAI, Anthropic, Google, etc.)

---

## Getting Help

- **Documentation:** https://jacobinwwey.github.io/obsidian-NotEMD/
- **GitHub Issues:** https://github.com/Jacobinwwey/obsidian-NotEMD/issues
- **Discord:** https://discord.gg/qnGgsQ9W
- **Sponsor:** https://github.com/sponsors/Jacobinwwey
