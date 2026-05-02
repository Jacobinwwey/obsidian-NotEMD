![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

# Obsidian-এর জন্য Notemd প্লাগইন

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

আরও ভাষায় ডকুমেন্টেশন পড়ুন: [ভাষা কেন্দ্র](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 এআই-চালিত বহুভাষিক জ্ঞান সমৃদ্ধকরণ
==================================================
```

নিজের জ্ঞানভাণ্ডার তৈরি করার একটি সহজ উপায়।

Notemd আপনার Obsidian ওয়ার্কফ্লোকে শক্তিশালী করে। এটি বিভিন্ন বৃহৎ ভাষা মডেল (LLMs)-এর সাথে একীভূত হয়ে বহুভাষিক নোট প্রক্রিয়াকরণ করে, গুরুত্বপূর্ণ ধারণাগুলোর জন্য স্বয়ংক্রিয়ভাবে wiki-links তৈরি করে, সংশ্লিষ্ট concept notes তৈরি করে, ওয়েব গবেষণা চালায় এবং আপনাকে শক্তিশালী knowledge graph গঠনে সাহায্য করে।

আপনি যদি Notemd ব্যবহার করতে ভালোবাসেন, অনুগ্রহ করে [⭐ GitHub-এ স্টার দিন](https://github.com/Jacobinwwey/obsidian-NotEMD) অথবা [☕️ আমাকে কফি কিনুন](https://ko-fi.com/jacobinwwey).

**সংস্করণ:** 1.8.3

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## সূচিপত্র

- [দ্রুত শুরু](#দ্রুত-শুরু)
- [ভাষা সমর্থন](#ভাষা-সমর্থন)
- [বৈশিষ্ট্যসমূহ](#বৈশিষ্ট্যসমূহ)
- [ইনস্টলেশন](#ইনস্টলেশন)
- [কনফিগারেশন](#কনফিগারেশন)
- [ব্যবহার নির্দেশিকা](#ব্যবহার-নির্দেশিকা)
- [সমর্থিত LLM প্রদানকারী](#সমর্থিত-llm-প্রদানকারী)
- [নেটওয়ার্ক ব্যবহার ও ডেটা ব্যবস্থাপনা](#নেটওয়ার্ক-ব্যবহার-ও-ডেটা-ব্যবস্থাপনা)
- [সমস্যা সমাধান](#সমস্যা-সমাধান)
- [অবদান](#অবদান)
- [রক্ষণাবেক্ষণকারীর নথি](#রক্ষণাবেক্ষণকারীর-নথি)
- [লাইসেন্স](#লাইসেন্স)

## দ্রুত শুরু

1.  **ইনস্টল ও সক্রিয় করুন**: প্লাগইনটি Obsidian Marketplace থেকে সংগ্রহ করুন।
2.  **LLM কনফিগার করুন**: `Settings -> Notemd`-এ যান, আপনার পছন্দের LLM প্রদানকারী (যেমন OpenAI অথবা স্থানীয় প্রদানকারী যেমন Ollama) নির্বাচন করুন, এবং API key/URL লিখুন।
3.  **সাইডবার খুলুন**: বাম পাশের ribbon-এ থাকা Notemd wand আইকনে ক্লিক করে সাইডবার খুলুন।
4.  **একটি নোট প্রসেস করুন**: যেকোনো নোট খুলে সাইডবারে **"Process File (Add Links)"**-এ ক্লিক করুন, যাতে গুরুত্বপূর্ণ ধারণাগুলিতে স্বয়ংক্রিয়ভাবে `[[wiki-links]]` যোগ হয়।
5.  **দ্রুত ওয়ার্কফ্লো চালান**: প্রসেসিং, ব্যাচ জেনারেশন এবং Mermaid cleanup একসাথে চালাতে ডিফল্ট **"One-Click Extract"** বোতাম ব্যবহার করুন।

এতেই হয়ে গেল। ওয়েব গবেষণা, অনুবাদ ও কনটেন্ট জেনারেশনের মতো আরও সুবিধা আনলক করতে সেটিংস ঘুরে দেখুন।

## ভাষা সমর্থন

### ভাষাগত আচরণ চুক্তি

| বিষয় | পরিধি | ডিফল্ট | নোট |
|---|---|---|---|
| `ইন্টারফেস ভাষা` | শুধুমাত্র প্লাগইনের UI টেক্সট (সেটিংস, সাইডবার, নোটিস, ডায়ালগ) | `auto` | Obsidian-এর locale অনুসরণ করে; বর্তমান UI catalog হলো `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`। |
| `কাজের আউটপুট ভাষা` | LLM-সৃষ্ট task output (লিংক, সারাংশ, জেনারেশন, এক্সট্র্যাকশন, অনুবাদের লক্ষ্য ভাষা) | `en` | `কাজভেদে ভিন্ন ভাষা ব্যবহার করুন` চালু থাকলে এটি global বা per-task হতে পারে। |
| `স্বয়ংক্রিয় অনুবাদ বন্ধ` | `Translate` ছাড়া অন্যান্য task source-language context ধরে রাখে | `false` | Explicit `Translate` task এখনো configured target language প্রয়োগ করে। |
| লোকেল fallback | অনুপস্থিত UI key সমাধান | locale -> `en` | কিছু key অনূদিত না হলেও UI স্থিতিশীল রাখে। |

- রক্ষণাবেক্ষণকৃত উৎস ডকুমেন্ট ইংরেজি ও সরলীকৃত চীনা, এবং প্রকাশিত README অনুবাদগুলো উপরের শিরোনামে লিঙ্ক করা আছে।
- অ্যাপের ভেতরের UI locale কাভারেজ বর্তমানে কোডের স্পষ্ট ক্যাটালগের সঙ্গে হুবহু মেলে: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`।
- ইংরেজি fallback বাস্তবায়নগত সেফটি নেট হিসেবে থাকে, কিন্তু সমর্থিত দৃশ্যমান UI regression tests দ্বারা আচ্ছাদিত এবং স্বাভাবিক ব্যবহারে নীরবে ইংরেজিতে ফিরে যাওয়া উচিত নয়।
- আরও বিস্তারিত ও অবদান নির্দেশিকা [ভাষা কেন্দ্র](./docs/i18n/README.md)-এ সংরক্ষিত।

## বৈশিষ্ট্যসমূহ

### এআই-চালিত ডকুমেন্ট প্রসেসিং
- **Multi-LLM সমর্থন**: বিভিন্ন cloud এবং local LLM প্রদানকারীর সাথে সংযোগ করুন (দেখুন [সমর্থিত LLM প্রদানকারী](#সমর্থিত-llm-প্রদানকারী))।
- **স্মার্ট chunking**: শব্দসংখ্যার ভিত্তিতে বড় ডকুমেন্টকে স্বয়ংক্রিয়ভাবে ছোট, পরিচালনাযোগ্য অংশে ভাগ করে।
- **কনটেন্ট সংরক্ষণ**: কাঠামো ও লিঙ্ক যোগ করার সময় মূল ফরম্যাটিং ধরে রাখার চেষ্টা করে।
- **প্রগ্রেস ট্র্যাকিং**: Notemd Sidebar বা একটি progress modal-এর মাধ্যমে real-time আপডেট।
- **বাতিলযোগ্য অপারেশন**: sidebar থেকে চালু করা যেকোনো processing task (single বা batch) তার dedicated cancel button দিয়ে থামানো যায়। কমান্ড প্যালেট action একটি modal ব্যবহার করে, সেটিও cancel করা যায়।
- **Multi-model configuration**: বিভিন্ন task (Add Links, Research, Generate Title, Translate)-এর জন্য আলাদা LLM provider *এবং* নির্দিষ্ট model ব্যবহার করুন, অথবা সবকিছুর জন্য একটিই provider রাখুন।
- **Stable API Calls (Retry Logic)**: failed LLM API calls-এর জন্য configurable interval ও attempt limit সহ automatic retry চালু করা যায়।
- **সহনশীল provider connection test**: যদি প্রথম provider test কোনো transient network disconnect-এর মুখোমুখি হয়, তাহলে Notemd এখন ব্যর্থ হওয়ার আগে stable retry sequence-এ fallback করে; এতে OpenAI-compatible, Anthropic, Google, Azure OpenAI এবং Ollama transport অন্তর্ভুক্ত।
- **Runtime environment transport fallback**: যখন দীর্ঘমেয়াদি provider request `requestUrl`-এ `ERR_CONNECTION_CLOSED`-এর মতো transient network error-এর কারণে drop হয়ে যায়, তখন Notemd এখন configured retry loop-এ ঢোকার আগে environment-specific fallback transport দিয়ে একই attempt পুনরায় চালায়: desktop builds Node `http/https` ব্যবহার করে, আর non-desktop environment browser `fetch` ব্যবহার করে। এতে slow gateway ও reverse proxy-তে false failure কমে।
- **OpenAI-compatible stable long-request chain hardening**: stable mode-এ OpenAI-compatible calls এখন প্রতিটি attempt-এর জন্য একটি স্পষ্ট 3-stage order অনুসরণ করে: primary direct streaming transport, তারপর direct non-stream transport, তারপর `requestUrl` fallback (যা প্রয়োজন হলে streamed parsing-এ upgrade হতে পারে)। এর ফলে buffered response সম্পূর্ণ হলেও streaming pipe অস্থির থাকলে false negative কম হয়।
- **সব LLM API-তে protocol-aware streaming fallback**: দীর্ঘমেয়াদি fallback attempt এখন শুধু OpenAI-compatible endpoint-এ নয়, সব built-in LLM path-এ protocol-aware streamed parsing ব্যবহার করে। Notemd এখন OpenAI/Azure-style SSE, Anthropic Messages streaming, Google Gemini SSE responses এবং Ollama NDJSON streams-কে desktop `http/https` এবং non-desktop `fetch` উভয় ক্ষেত্রেই হ্যান্ডেল করে, এবং বাকি direct OpenAI-style provider entrypoint-ও একই shared fallback path ব্যবহার করে।
- **China-ready provider presets**: built-in presets এখন `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` এবং `SiliconFlow`-কে বিদ্যমান global এবং local providers-এর পাশাপাশি কভার করে।
- **নির্ভরযোগ্য batch processing**: **ধাপে ধাপে API কল**-সহ উন্নত concurrent processing logic rate-limit error কমাতে এবং বড় batch job-এ স্থিতিশীল performance নিশ্চিত করতে সাহায্য করে। নতুন implementation নিশ্চিত করে যে task-গুলো একসাথে নয়, বরং ভিন্ন ভিন্ন ব্যবধানে শুরু হয়।
- **সঠিক progress reporting**: একটি bug ঠিক করা হয়েছে যার কারণে progress bar আটকে যেতে পারত, ফলে UI এখন সবসময় কাজের প্রকৃত অবস্থা দেখায়।
- **মজবুত parallel batch processing**: parallel batch operations অকালেই থেমে যাওয়ার সমস্যা সমাধান করা হয়েছে, ফলে এখন সব file নির্ভরযোগ্য ও দক্ষভাবে প্রসেস হয়।
- **Progress bar-এর নির্ভুলতা**: "Create Wiki-Link & Generate Note" command-এর progress bar 95%-এ আটকে থাকার bug ঠিক করা হয়েছে, ফলে এটি এখন সম্পূর্ণ হলে সঠিকভাবে 100% দেখায়।
- **উন্নত API ডিবাগিং**: "API Error Debugging Mode" এখন LLM provider এবং search service (Tavily/DuckDuckGo)-এর সম্পূর্ণ response body ধারণ করে, এবং প্রতিটি attempt-এর জন্য transport timeline-ও রেকর্ড করে যেখানে sanitized request URLs, elapsed duration, response headers, partial response bodies, parsed partial stream content ও স্ট্যাক ট্রেস অন্তর্ভুক্ত থাকে; এতে OpenAI-compatible, Anthropic, Google, Azure OpenAI ও Ollama fallback-এর troubleshooting আরও সহজ হয়।
- **Developer Mode panel**: settings-এ এখন একটি dedicated developer-only diagnostics panel রয়েছে, যা "Developer mode" চালু না করা পর্যন্ত লুকানো থাকে। এটি diagnostic call path নির্বাচন এবং নির্বাচিত mode-এর জন্য repeated stability probe চালানোর সুবিধা দেয়।
- **পুনঃনকশাকৃত sidebar**: built-in action-গুলো এখন আরও ফোকাসড section-এ ভাগ করা হয়েছে, যেখানে clearer labels, live status, cancellable progress এবং copyable logs রয়েছে, যাতে sidebar clutter কমে। progress/log footer সব section expanded থাকলেও দৃশ্যমান থাকে, এবং ready state আরও পরিষ্কার standby progress track ব্যবহার করে।
- **Sidebar interaction ও readability polish**: sidebar button-গুলো এখন আরও পরিষ্কার hover/press/focus feedback দেয়, এবং `One-Click Extract` ও `Batch generate from titles`-সহ রঙিন CTA button-গুলো উন্নত text contrast ব্যবহার করে, ফলে বিভিন্ন theme-এও পড়া সহজ হয়।
- **Single-file CTA mapping**: রঙিন CTA styling এখন শুধু single-file action-এর জন্য সংরক্ষিত। batch/folder-level action এবং mixed workflow non-CTA styling ব্যবহার করে, যাতে action scope ভুল বোঝার কারণে misclick কমে।
- **Custom one-click workflows**: built-in sidebar utility-গুলোকে user-defined name এবং assembled action chain সহ reusable custom button-এ রূপান্তর করুন। একটি ডিফল্ট `One-Click Extract` workflow শুরু থেকেই অন্তর্ভুক্ত আছে।

### নলেজ গ্রাফ উন্নয়ন
- **স্বয়ংক্রিয় wiki-linking**: LLM আউটপুটের ভিত্তিতে আপনার processed note-এর মূল ধারণাগুলিতে `[[wiki-links]]` যোগ করে।
- **Concept note তৈরি (ঐচ্ছিক ও কাস্টমাইজযোগ্য)**: নির্দিষ্ট vault folder-এ আবিষ্কৃত ধারণাগুলোর জন্য স্বয়ংক্রিয়ভাবে নতুন note তৈরি করে।
- **কাস্টমাইজযোগ্য output path**: processed file এবং newly created concept note সেভ করার জন্য আপনার vault-এর মধ্যে আলাদা relative path কনফিগার করুন।
- **কাস্টমাইজযোগ্য output filename (Add Links)**: file processing-এর সময় ডিফল্ট `_processed.md`-এর বদলে চাইলে **মূল file overwrite** করতে পারেন বা custom suffix/replacement string ব্যবহার করতে পারেন।
- **লিংকের অখণ্ডতা রক্ষা**: vault-এর মধ্যে note rename বা delete হলে link update করার মৌলিক ব্যবস্থাপনা।
- **Pure concept extraction**: মূল document পরিবর্তন না করে concept বের করে corresponding concept note তৈরি করে। এটি existing document থেকে knowledge base পূরণ করার জন্য আদর্শ। এই feature-এ minimal concept note তৈরি এবং backlink যোগ করার configurable বিকল্প রয়েছে।

### অনুবাদ

- **এআই-চালিত অনুবাদ**:
    - configured LLM ব্যবহার করে note-এর content অনুবাদ করুন।
    - **বড় ফাইল সমর্থন**: বড় file-গুলোকে `Chunk word count` setting অনুযায়ী ছোট chunk-এ ভাগ করে LLM-এ পাঠানো হয়। অনূদিত chunk পরে একত্রে একটি document-এ মিলিত হয়।
    - একাধিক ভাষার মধ্যে অনুবাদ সমর্থন করে।
    - target language settings বা UI থেকে কাস্টমাইজ করা যায়।
    - অনূদিত টেক্সটটি সহজে তুলনা করার জন্য মূল টেক্সটের ডান পাশে স্বয়ংক্রিয়ভাবে খোলে।
- **ব্যাচ অনুবাদ**:
    - নির্বাচিত folder-এর সব file অনুবাদ করে।
    - "Enable Batch Parallelism" চালু থাকলে parallel processing সমর্থন করে।
    - configure করা থাকলে translation-এর জন্য custom prompt ব্যবহার করে।
	- file explorer context menu-তে "Batch translate this folder" অপশন যোগ করে।
- **স্বয়ংক্রিয় অনুবাদ বন্ধ করুন**: এই অপশন চালু থাকলে `Translate` ছাড়া অন্য task আর আউটপুটকে নির্দিষ্ট ভাষায় বাধ্য করে না, ফলে মূল ভাষার context বজায় থাকে। explicit "Translate" task তবু configuration অনুযায়ী অনুবাদ চালায়।

### ওয়েব গবেষণা ও কনটেন্ট তৈরি
- **ওয়েব গবেষণা ও সারসংক্ষেপ**:
    - Tavily (API key প্রয়োজন) বা DuckDuckGo (experimental) ব্যবহার করে web search চালান।
    - **উন্নত search robustness**: DuckDuckGo search এখন DOMParser with Regex fallback parsing logic ব্যবহার করে, যাতে layout change সামলে আরও নির্ভরযোগ্য ফল পাওয়া যায়।
    - configured LLM ব্যবহার করে search result summarize করে।
    - summary-এর output language settings-এ কাস্টমাইজ করা যায়।
    - current note-এর সাথে summary append করে।
    - LLM-এ পাঠানো research content-এর জন্য configurable token limit রয়েছে।
- **শিরোনাম থেকে কনটেন্ট তৈরি**:
    - note title ব্যবহার করে LLM-এর মাধ্যমে initial content তৈরি করে এবং বিদ্যমান content প্রতিস্থাপন করে।
    - **ঐচ্ছিক গবেষণা**: generation-এর জন্য context দিতে web research (selected provider ব্যবহার করে) করা হবে কি না, তা কনফিগার করা যায়।
- **শিরোনাম থেকে batch content generation**: নির্বাচিত folder-এর সব note-এর title অনুযায়ী content তৈরি করে (optional research setting অনুসরণ করে)। সফলভাবে processed file-গুলো **configurable "complete" subfolder**-এ (যেমন `[foldername]_complete` বা custom name) move হয় যাতে পুনরায় processing এড়ানো যায়।
- **Mermaid auto-fix coupling**: Mermaid auto-fix চালু থাকলে Mermaid-সম্পর্কিত workflow generated file বা output folder processing-এর পরে স্বয়ংক্রিয়ভাবে repair করে। এর মধ্যে Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid ও Translate flow অন্তর্ভুক্ত।

### ইউটিলিটি বৈশিষ্ট্য
- **Mermaid ডায়াগ্রাম হিসেবে সারসংক্ষেপ করুন**:
    - এই feature আপনাকে একটি note-এর content Mermaid diagram-এ summarize করতে দেয়।
    - Mermaid diagram-এর output language settings থেকে কাস্টমাইজ করা যায়।
    - **Mermaid Output Folder**: generated Mermaid diagram file কোথায় সংরক্ষণ হবে সেই folder নির্ধারণ করুন।
    - **Translate Summarize to Mermaid Output**: generated Mermaid diagram content-কে configured target language-এ ঐচ্ছিকভাবে অনুবাদ করে।
    - 
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **সহজ সূত্র ফরম্যাট সংশোধন**:
    - single `$` দ্বারা ঘেরা single-line গাণিতিক সূত্র দ্রুত standard double `$$` block-এ রূপান্তর করে।
    - **Single File**: sidebar button বা কমান্ড প্যালেট-এর মাধ্যমে বর্তমান file প্রসেস করুন।
    - **Batch Fix**: sidebar button বা কমান্ড প্যালেট দিয়ে নির্বাচিত folder-এর সব file প্রসেস করুন।

- **বর্তমান ফাইলে duplicate চেক**: এই command সক্রিয় file-এর মধ্যে সম্ভাব্য duplicate term চিহ্নিত করতে সাহায্য করে।
- **Duplicate detection**: বর্তমানে processed file-এর content-এ duplicate word আছে কি না, তার একটি মৌলিক পরীক্ষা করে (ফলাফল console-এ log হয়)।
- **Check and Remove Duplicate Concept Notes**: configured **Concept Note Folder**-এ সম্ভাব্য duplicate notes শনাক্ত করে exact name match, plurals, normalization এবং single-word containment-এর ভিত্তিতে, এবং সেগুলোকে folder-এর বাইরের notes-এর সাথে তুলনা করে। তুলনার পরিধি (অর্থাৎ concept folder-এর বাইরের কোন notes চেক হবে) **পুরো vault**, **নির্দিষ্ট included folders**, অথবা **নির্দিষ্ট folders বাদে সব folders** হিসেবে সেট করা যায়। এটি কারণ ও conflicting files সহ একটি বিস্তারিত তালিকা দেখায়, এবং তারপর identified duplicates-কে system trash-এ পাঠানোর আগে নিশ্চিতকরণ চায়। deletion-এর সময় progress দেখায়।
- **Batch Mermaid Fix**: ব্যবহারকারী নির্বাচিত folder-এর সব Markdown file-এ Mermaid এবং LaTeX syntax correction প্রয়োগ করে।
    - **Workflow Ready**: standalone utility হিসেবে বা custom one-click workflow button-এর step হিসেবে ব্যবহার করা যায়।
    - **Error Reporting**: `mermaid_error_{foldername}.md` রিপোর্ট তৈরি করে, যেখানে সেই file-গুলো তালিকাভুক্ত থাকে যেগুলোতে processing-এর পরও সম্ভাব্য Mermaid error রয়েছে।
    - **Move Error Files**: detected error-সহ file-গুলোকে ঐচ্ছিকভাবে manual review-এর জন্য নির্দিষ্ট folder-এ move করে।
    - **Smart Detection**: fix attempt করার আগে এখন `mermaid.parse` ব্যবহার করে বুদ্ধিমত্তার সাথে file-এ syntax error আছে কিনা পরীক্ষা করে, ফলে processing time বাঁচে এবং unnecessary edit এড়ানো যায়।
    - **Safe Processing**: নিশ্চিত করে যে syntax fix শুধুমাত্র Mermaid code block-এর ওপর প্রযোজ্য হয়, ফলে Markdown table বা অন্য content-এ দুর্ঘটনাজনিত পরিবর্তন এড়ানো যায়। table syntax (যেমন `| :--- |`) aggressive debug fix থেকে সুরক্ষার জন্য robust safeguard অন্তর্ভুক্ত রয়েছে।
    - **Deep Debug Mode**: initial fix-এর পরও error থাকলে advanced deep debug mode সক্রিয় হয়। এই mode জটিল edge case হ্যান্ডেল করে, যেমন:
        - **Comment Integration**: trailing comment (যা `%` দিয়ে শুরু হয়) স্বয়ংক্রিয়ভাবে edge label-এর মধ্যে merge করে (যেমন `A -- Label --> B; % Comment` -> `A -- "Label(Comment)" --> B;`)।
        - **Malformed Arrows**: quote-এর মধ্যে ঢুকে যাওয়া arrow ঠিক করে (যেমন `A -- "Label -->" B` -> `A -- "Label" --> B`)।
        - **Inline Subgraphs**: inline subgraph label-কে edge label-এ রূপান্তর করে।
        - **Reverse Arrow Fix**: non-standard `X <-- Y` arrow-কে `Y --> X`-এ ঠিক করে।
        - **Direction Keyword Fix**: subgraph-এর মধ্যে `direction` keyword-কে lowercase নিশ্চিত করে (যেমন `Direction TB` -> `direction TB`)।
        - **Comment Conversion**: `//` comment-কে edge label-এ রূপান্তর করে (যেমন `A --> B; // Comment` -> `A -- "Comment" --> B;`)।
        - **Duplicate Label Fix**: repeated bracketed label সহজ করে (যেমন `Node["Label"]["Label"]` -> `Node["Label"]`)।
        - **Invalid Arrow Fix**: invalid arrow syntax `--|>`-কে standard `-->`-এ রূপান্তর করে।
        - **Robust Label & Note Handling**: special character (যেমন `/`) থাকা label-এর উন্নত handling এবং custom note syntax (`note for ...`) এর ভালো support দেয়, ফলে trailing bracket-এর মতো artifact পরিষ্কারভাবে সরানো যায়।
        - **Advanced Fix Mode**: space, special character বা nested bracket-সহ unquoted node label-এর জন্য robust fix অন্তর্ভুক্ত (যেমন `Node[Label [Text]]` -> `Node["Label [Text]"]`), ফলে Stellar Evolution path-এর মতো complex diagram-এর সাথে compatibility নিশ্চিত হয়। এটি malformed edge label-ও ঠিক করে (যেমন `--["Label["-->` -> `-- "Label" -->`)। পাশাপাশি inline comment (`Consensus --> Adaptive; # Some advanced consensus` -> `Consensus -- "Some advanced consensus" --> Adaptive`) রূপান্তর করে এবং line ending-এ incomplete quote (`;"` -> `"]`) ঠিক করে।
                        - **Note Conversion**: `note right/left of` এবং standalone `note :` comment-কে standard Mermaid node definition ও connection-এ স্বয়ংক্রিয়ভাবে রূপান্তর করে (যেমন `note right of A: text` -> `NoteA["Note: text"]`, যা `A`-র সাথে যুক্ত থাকে), ফলে syntax error কমে এবং layout ভালো হয়। এখন এটি arrow link (`-->`) এবং solid link (`---`)—দুটিই সমর্থন করে।
                        - **Extended Note Support**: `note for Node "Content"` এবং `note of Node "Content"`-কে standard linked note node-এ রূপান্তর করে (যেমন `NoteNode[" Content"]`-কে `Node`-এর সাথে যুক্ত করা), ফলে user-extended syntax-এর সাথে compatibility নিশ্চিত হয়।
                        - **Enhanced Note Correction**: একাধিক note থাকলে aliasing সমস্যা এড়াতে note-গুলোকে sequential numbering (যেমন `Note1`, `Note2`) সহ স্বয়ংক্রিয়ভাবে rename করে।                - **Parallelogram/Shape Fix**: malformed node shape যেমন `[/["Label["/]`-কে standard `["Label"]`-এ ঠিক করে, যাতে generated content-এর সাথে compatibility বজায় থাকে।
                        - **Standardize Pipe Labels**: pipe-সহ edge label-গুলোকে স্বয়ংক্রিয়ভাবে ঠিক এবং standardize করে, যাতে সেগুলো সঠিকভাবে উদ্ধৃত থাকে (যেমন `-->|Text|` -> `-->|"Text"|` এবং `-->|Math|^2|` -> `-->|"Math|^2"|`)।
        - **Misplaced Pipe Fix**: arrow-এর আগে ভুল জায়গায় থাকা edge label-কে ঠিক করে (যেমন `>|"Label"| A --> B` -> `A -->|"Label"| B`)।
                - **Merge Double Labels**: একটি edge-এ থাকা জটিল double label (যেমন `A -- Label1 -- Label2 --> B` বা `A -- Label1 -- Label2 --- B`) line-break সহ একটি clean label-এ merge করে (`A -- "Label1<br>Label2" --> B`)।
                        - **Unquoted Label Fix**: quotes, equals sign বা mathematical operator-এর মতো সম্ভাব্য সমস্যাযুক্ত character থাকা কিন্তু outer quote না থাকা node label-গুলোকে স্বয়ংক্রিয়ভাবে উদ্ধৃত করে (যেমন `Plot[Plot "A"]` -> `Plot["Plot "A""]`), ফলে render error প্রতিরোধ হয়।
                        - **Intermediate Node Fix**: intermediate node definition থাকা edge-কে দুইটি আলাদা edge-এ ভাগ করে (যেমন `A -- B[...] --> C` -> `A --> B[...]` এবং `B[...] --> C`), ফলে Mermaid syntax বৈধ থাকে।
                        - **Concatenated Label Fix**: যেসব node definition-এ ID label-এর সাথে লেগে থাকে (যেমন `SubdivideSubdivide...` -> `Subdivide["Subdivide..."]`), সেগুলোকে robust ভাবে ঠিক করে, এমনকি pipe label আগে থাকলে বা duplication একেবারে সঠিক না হলেও known node ID দিয়ে validate করে ঠিক করে।
                        - **Extract Specific Original Text**:    - settings-এ প্রশ্নের তালিকা নির্ধারণ করুন।
                    - সক্রিয় note থেকে ঐ প্রশ্নগুলোর উত্তর দেয় এমন text segment হুবহু বের করে।
                    - **Merged Query Mode**: দক্ষতার জন্য সব প্রশ্ন এক API call-এ প্রসেস করার বিকল্প।
                    - **Translation**: extracted text-এর অনুবাদ output-এ যোগ করার বিকল্প।
                    - **Custom Output**: extracted text file-এর জন্য configurable save path ও filename suffix.- **LLM Connection Test**: সক্রিয় provider-এর API settings যাচাই করে।

## ইনস্টলেশন

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Obsidian Marketplace থেকে (প্রস্তাবিত)
1. Obsidian-এ **Settings** -> **Community plugins** খুলুন।
2. নিশ্চিত করুন যে "Restricted mode" **বন্ধ** আছে।
3. Community plugins-এর **Browse**-এ ক্লিক করুন এবং "Notemd" খুঁজুন।
4. **Install**-এ ক্লিক করুন।
5. ইনস্টল হওয়ার পর **Enable**-এ ক্লিক করুন।

### ম্যানুয়াল ইনস্টলেশন
1. [GitHub Releases page](https://github.com/Jacobinwwey/obsidian-NotEMD/releases) থেকে সর্বশেষ release assets ডাউনলোড করুন। প্রতিটি release-এ reference-এর জন্য `README.md`-ও থাকে, কিন্তু manual installation-এর জন্য শুধুমাত্র `main.js`, `styles.css`, এবং `manifest.json` প্রয়োজন।
2. আপনার Obsidian vault-এর configuration folder-এ যান: `<YourVault>/.obsidian/plugins/`।
3. `notemd` নামে একটি নতুন folder তৈরি করুন।
4. `main.js`, `styles.css` এবং `manifest.json`-কে `notemd` folder-এ কপি করুন।
5. Obsidian পুনরায় চালু করুন।
6. **Settings** -> **Community plugins**-এ গিয়ে "Notemd" সক্রিয় করুন।

## কনফিগারেশন

প্লাগইনের settings-এ প্রবেশ:
**Settings** -> **Community Plugins** -> **Notemd** (gear আইকনে ক্লিক করুন)।

### LLM প্রদানকারী কনফিগারেশন
1.  **সক্রিয় প্রোভাইডার**: dropdown menu থেকে আপনি যে LLM provider ব্যবহার করতে চান তা নির্বাচন করুন।
2.  **প্রোভাইডার সেটিংস**: নির্বাচিত provider-এর জন্য নির্দিষ্ট settings কনফিগার করুন:
    *   **API Key**: অধিকাংশ cloud provider-এর জন্য প্রয়োজনীয় (যেমন OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty)। Ollama-এর জন্য প্রয়োজন হয় না। LM Studio এবং generic `OpenAI Compatible` preset-এর জন্য এটি ঐচ্ছিক, যদি আপনার endpoint anonymous বা placeholder access সমর্থন করে।
    *   **Base URL / Endpoint**: পরিষেবার API endpoint। ডিফল্ট মান দেওয়া আছে, কিন্তু local model (LMStudio, Ollama), gateway (OpenRouter, Requesty, OpenAI Compatible), অথবা নির্দিষ্ট Azure deployment-এর জন্য এটি বদলাতে হতে পারে। **Azure OpenAI-এর জন্য আবশ্যক।**
    *   **Model**: ব্যবহারের জন্য নির্দিষ্ট model name/ID (যেমন `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`)। নিশ্চিত করুন যে model আপনার endpoint/provider-এ উপলব্ধ।
    *   **Temperature**: LLM-এর output-এর randomness নিয়ন্ত্রণ করে (0 = deterministic, 1 = সর্বোচ্চ সৃজনশীলতা)। কম মান (যেমন 0.2-0.5) সাধারণত structured task-এর জন্য ভালো।
    *   **API Version (Azure Only)**: Azure OpenAI deployment-এর জন্য প্রয়োজনীয় (যেমন `2024-02-15-preview`)।
3.  **সংযোগ পরীক্ষা**: সক্রিয় provider-এর settings যাচাই করতে "সংযোগ পরীক্ষা" বাটন ব্যবহার করুন। OpenAI-compatible provider-রা এখন provider-aware check ব্যবহার করে: `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` এবং `OpenAI Compatible`-এর মতো endpoint সরাসরি `chat/completions` probe করে, আর নির্ভরযোগ্য `/models` endpoint থাকা provider চাইলে এখনও model listing দিয়ে শুরু করতে পারে। যদি প্রথম probe `ERR_CONNECTION_CLOSED`-এর মতো transient network disconnect-এর কারণে ব্যর্থ হয়, তাহলে Notemd অবিলম্বে ব্যর্থ না হয়ে automatic stable retry sequence-এ সরে যায়।
4.  **প্রোভাইডার কনফিগারেশন পরিচালনা**: plugin configuration directory-এর `notemd-providers.json` file-এ আপনার LLM provider settings save/load করতে "Export Providers" এবং "Import Providers" button ব্যবহার করুন। এতে backup এবং sharing সহজ হয়।
5.  **প্রিসেট কভারেজ**: মূল provider-গুলোর পাশাপাশি Notemd এখন `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty`, এবং LiteLLM, vLLM, Perplexity, Vercel AI Gateway বা custom proxy-এর জন্য generic `OpenAI Compatible` target অন্তর্ভুক্ত করে।
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### বহু-মডেল কনফিগারেশন
-   **কাজের জন্য ভিন্ন প্রোভাইডার ব্যবহার করুন**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: উপর থেকে নির্বাচিত একটি "সক্রিয় প্রোভাইডার" সব task-এর জন্য ব্যবহার করে।
    *   **সক্রিয়**: প্রতিটি task ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts")-এর জন্য নির্দিষ্ট provider নির্বাচন এবং প্রয়োজনে model name override করার সুযোগ দেয়। যদি কোনো task-এর model override field ফাঁকা থাকে, তাহলে ওই task-এর জন্য নির্বাচিত provider-এর default model ব্যবহৃত হবে।
-   **ভিন্ন কাজের জন্য ভিন্ন ভাষা নির্বাচন করুন**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: সব task-এর জন্য একটি আউটপুট ভাষা ব্যবহার করে।
    *   **সক্রিয়**: প্রতিটি task ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts")-এর জন্য আলাদা ভাষা নির্বাচন করতে দেয়।

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### ভাষা স্থাপত্য (ইন্টারফেস ভাষা বনাম কাজের আউটপুট ভাষা)

-   **ইন্টারফেস ভাষা** শুধুমাত্র প্লাগইন ইন্টারফেসের টেক্সট (সেটিংস লেবেল, সাইডবার বাটন, নোটিস এবং ডায়ালগ) নিয়ন্ত্রণ করে। ডিফল্ট `auto` mode Obsidian-এর বর্তমান UI language অনুসরণ করে।
-   আঞ্চলিক বা লিপিভিত্তিক ভ্যারিয়েন্ট এখন সরাসরি ইংরেজিতে না নেমে নিকটতম প্রকাশিত ক্যাটালগে ম্যাপ হয়। উদাহরণস্বরূপ, `fr-CA` ফরাসি, `es-419` স্প্যানিশ, `pt-PT` পর্তুগিজ, `zh-Hans` সরলীকৃত চীনা এবং `zh-Hant-HK` প্রথাগত চীনা ব্যবহার করে।
-   **কাজের আউটপুট ভাষা** model-generated task output (লিঙ্ক, সারাংশ, title generation, Mermaid summary, concept extraction, translation target) নিয়ন্ত্রণ করে।
-   **Per-task language mode** প্রতিটি task-কে scattered per-module override-এর বদলে unified policy layer থেকে তার output language নির্ধারণ করতে দেয়।
-   **স্বয়ংক্রিয় অনুবাদ বন্ধ করুন** non-`Translate` task-কে source-language context-এ রাখে, কিন্তু explicit `Translate` task এখনও configured target language প্রয়োগ করে।
-   Mermaid-সম্পর্কিত generation path-ও একই language policy অনুসরণ করে এবং enabled থাকলে Mermaid auto-fix ট্রিগার করতে পারে।

### স্থিতিশীল API কল সেটিংস
-   **স্থিতিশীল API কল সক্রিয় করুন (রিট্রাই লজিক)**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: একটি API call failure বর্তমান task বন্ধ করে দেবে।
    *   **সক্রিয়**: failed LLM API call-গুলো স্বয়ংক্রিয়ভাবে retry করে (intermittent network issue বা rate limit-এর জন্য উপযোগী)।
    *   **Connection Test Fallback**: সাধারণ call stable mode-এ না চললেও provider connection test এখন প্রথম transient network failure-এর পর একই retry sequence-এ সরে যায়।
    *   **Runtime Transport Fallback (Environment-Aware)**: `requestUrl` দ্বারা transiently drop হওয়া দীর্ঘমেয়াদি task request এখন প্রথমে environment-aware fallback দিয়ে একই attempt retry করে। Desktop build Node `http/https` ব্যবহার করে; non-desktop environment browser `fetch` ব্যবহার করে। এসব fallback attempt এখন built-in LLM path-জুড়ে protocol-aware streaming parsing ব্যবহার করে, যার মধ্যে OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE এবং Ollama NDJSON output অন্তর্ভুক্ত; ফলে slow gateway আগে body chunk ফেরত দিতে পারে। বাকি direct OpenAI-style provider entrypoint-ও একই shared fallback path ব্যবহার করে।
    *   **OpenAI-Compatible Stable Order**: stable mode-এ প্রতিটি OpenAI-compatible attempt এখন `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` ক্রম অনুসরণ করে, তারপরই সেটি failed attempt হিসেবে গণনা হয়। ফলে কেবল একটি transport mode flaky হলে অতিরিক্ত aggressive failure হয় না।
-   **Retry Interval (seconds)**: (শুধু enabled হলে দৃশ্যমান) retry attempt-এর মাঝের অপেক্ষার সময় (1-300 seconds)। ডিফল্ট: 5।
-   **Maximum Retries**: (শুধু enabled হলে দৃশ্যমান) retry attempt-এর সর্বোচ্চ সংখ্যা (0-10)। ডিফল্ট: 3।
-   **API ত্রুটি ডিবাগ মোড**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: স্ট্যান্ডার্ড, সংক্ষিপ্ত error reporting ব্যবহার করে।
    *   **সক্রিয়**: সব provider এবং task (Translate, Search, এবং Connection Tests সহ)-এর জন্য detailed error logging সক্রিয় করে (DeepSeek-এর verbose output-এর অনুরূপ)। এতে HTTP status codes, raw response text, request transport timelines, sanitized request URLs এবং headers, elapsed attempt durations, response headers, partial response bodies, parsed partial stream output এবং স্ট্যাক ট্রেস অন্তর্ভুক্ত থাকে—যা API connection issue এবং upstream gateway reset troubleshooting-এর জন্য গুরুত্বপূর্ণ।
-   **Developer Mode**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: সাধারণ ব্যবহারকারীদের কাছ থেকে সব developer-only diagnostic control লুকিয়ে রাখে।
    *   **সক্রিয়**: Settings-এ dedicated developer diagnostics panel দেখায়।
-   **Developer Provider Diagnostic (Long Request)**:
    *   **Diagnostic Call Mode**: প্রতিটি probe-এর জন্য runtime path বেছে নিন। OpenAI-compatible provider runtime mode-এর পাশাপাশি forced mode (`direct streaming`, `direct buffered`, `requestUrl-only`) সমর্থন করে।
    *   **Run Diagnostic**: নির্বাচিত call mode দিয়ে একটি long-request probe চালায় এবং vault root-এ `Notemd_Provider_Diagnostic_*.txt` লিখে।
    *   **Run Stability Test**: নির্বাচিত call mode ব্যবহার করে configurable runs (1-10) জুড়ে probe পুনরাবৃত্তি করে এবং aggregated stability report সেভ করে।
    *   **Diagnostic Timeout**: প্রতি run-এর জন্য configurable timeout (15-3600 seconds)।
    *   **Why Use It**: যখন কোনো provider "Test connection" পাস করে কিন্তু বাস্তব long-running task (যেমন slow gateway-এ translation)-এ ব্যর্থ হয়, তখন manual reproduction-এর তুলনায় এটি দ্রুততর।
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### সাধারণ সেটিংস

#### প্রক্রিয়াকৃত ফাইল আউটপুট
-   **Customize Processed File Save Path**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: processed file (যেমন `YourNote_processed.md`) মূল note-এর *একই folder*-এ সেভ হয়।
    *   **সক্রিয়**: custom save location নির্ধারণ করতে দেয়।
-   **Processed File Folder Path**: (উপরের অপশন enabled হলে তবেই দৃশ্যমান) আপনার vault-এর মধ্যে একটি *relative path* লিখুন (যেমন `Processed Notes` বা `Output/LLM`) যেখানে processed file সেভ হবে। folder না থাকলে স্বয়ংক্রিয়ভাবে তৈরি হবে। **Absolute path (যেমন C:\...) বা invalid character ব্যবহার করবেন না।**
-   **Use Custom Output Filename for 'Add Links'**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: 'Add Links' command দ্বারা তৈরি processed file ডিফল্ট `_processed.md` suffix ব্যবহার করে (যেমন `YourNote_processed.md`)।
    *   **সক্রিয়**: নিচের setting ব্যবহার করে output filename কাস্টমাইজ করতে দেয়।
-   **Custom Suffix/Replacement String**: (উপরের অপশন enabled হলে দৃশ্যমান) output filename-এর জন্য ব্যবহৃত string লিখুন।
    *   এটি **খালি** রাখলে মূল file processed content দিয়ে **overwrite** হবে।
    *   যদি string দেন (যেমন `_linked`), সেটি মূল base name-এর সাথে যুক্ত হবে (যেমন `YourNote_linked.md`)। নিশ্চিত করুন suffix-এ invalid filename character না থাকে।

-   **Remove Code Fences on Add Links**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: link যোগ করার সময় code fence **(\`\\\`\`)** content-এ থাকে, এবং **(\`\\\`markdown)** স্বয়ংক্রিয়ভাবে মুছে যায়।
    *   **সক্রিয়**: link যোগ করার আগে content থেকে code fence সরিয়ে দেয়।
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### কনসেপ্ট নোট আউটপুট
-   **Customize Concept Note Path**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: `[[linked concepts]]`-এর জন্য note-এর automatic creation বন্ধ থাকে।
    *   **সক্রিয়**: নতুন concept note কোথায় তৈরি হবে সেই folder নির্ধারণ করতে দেয়।
-   **Concept Note Folder Path**: (উপরের customization enabled হলে দৃশ্যমান) আপনার vault-এর মধ্যে একটি *relative path* লিখুন (যেমন `Concepts` বা `Generated/Topics`) যেখানে নতুন concept note সেভ হবে। folder না থাকলে তৈরি হবে। **Customization enabled হলে এটি পূরণ করতেই হবে।** **Absolute path বা invalid character ব্যবহার করবেন না।**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### কনসেপ্ট লগ ফাইল আউটপুট
-   **Generate Concept Log File**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: কোনো log file তৈরি হয় না।
    *   **সক্রিয়**: processing-এর পর newly created concept note-এর তালিকা সম্বলিত log file তৈরি করে। ফরম্যাট:
        ```
        xxটি ধারণা md ফাইল তৈরি করুন
        1. concepts1
        2. concepts2
        ...
        n. conceptsn
        ```
-   **Customize Log File Save Path**: (শুধুমাত্র "Generate Concept Log File" enabled হলে দৃশ্যমান)
    *   **নিষ্ক্রিয় (ডিফল্ট)**: log file **Concept Note Folder Path**-এ (যদি নির্ধারিত থাকে) বা নতুবা vault root-এ সেভ হয়।
    *   **সক্রিয়**: log file-এর জন্য custom folder নির্ধারণ করতে দেয়।
-   **Concept Log Folder Path**: (শুধুমাত্র "Customize Log File Save Path" enabled হলে দৃশ্যমান) আপনার vault-এর মধ্যে *relative path* লিখুন (যেমন `Logs/Notemd`) যেখানে log file সেভ হবে। **Customization enabled হলে এটি পূরণ করা আবশ্যক।**
-   **Customize Log File Name**: (শুধুমাত্র "Generate Concept Log File" enabled হলে দৃশ্যমান)
    *   **নিষ্ক্রিয় (ডিফল্ট)**: log file-এর নাম `Generate.log`।
    *   **সক্রিয়**: log file-এর জন্য custom name নির্ধারণ করতে দেয়।
-   **Concept Log File Name**: (শুধুমাত্র "Customize Log File Name" enabled হলে দৃশ্যমান) পছন্দের filename লিখুন (যেমন `ConceptCreation.log`)। **Customization enabled হলে এটি পূরণ করা আবশ্যক।**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### ধারণা নিষ্কাশন টাস্ক
-   **ন্যূনতম concept note তৈরি করুন**:
    *   **On (Default)**: নতুন concept note-এ শুধু title থাকবে (যেমন `# Concept`)।
    *   **Off**: concept note-এ অতিরিক্ত content থাকতে পারে, যেমন "Linked From" backlink, যদি নিচের setting-এ তা নিষ্ক্রিয় না করা হয়।
-   **Add "Linked From" backlink**:
    *   **Off (Default)**: extraction চলাকালে concept note-এ source document-এর backlink যোগ করে না।
    *   **On**: source file-এর backlink সহ একটি "Linked From" section যোগ করে।

#### নির্দিষ্ট মূল পাঠ নিষ্কাশন
-   **Questions for extraction**: আপনার note থেকে word-for-word answer বের করার জন্য প্রশ্নের তালিকা লিখুন (প্রতি লাইনে একটি)।
-   **Translate output to corresponding language**:
    *   **Off (Default)**: শুধুমাত্র extracted text-কে তার মূল ভাষায় output করে।
    *   **On**: এই task-এর জন্য নির্বাচিত ভাষায় extracted text-এর অনুবাদ যুক্ত করে।
-   **Merged query mode**:
    *   **Off**: প্রতিটি প্রশ্ন আলাদা করে প্রসেস করে (বেশি নির্ভুলতা, কিন্তু বেশি API call)।
    *   **On**: সব প্রশ্ন একসাথে একটি prompt-এ পাঠায় (দ্রুত এবং কম API call)।
-   **Customise extracted text save path & filename**:
    *   **Off**: মূল file-এর একই folder-এ `_Extracted` suffix সহ সেভ করে।
    *   **On**: custom output folder এবং filename suffix নির্ধারণ করতে দেয়।

#### ব্যাচ Mermaid সংশোধন
-   **Enable Mermaid Error Detection**:
    *   **Off (Default)**: processing-এর পর error detection করা হয় না।
    *   **On**: processed file-এ অবশিষ্ট Mermaid syntax error স্ক্যান করে এবং `mermaid_error_{foldername}.md` রিপোর্ট তৈরি করে।
-   **Move files with Mermaid errors to specified folder**:
    *   **Off**: error-সহ file একই জায়গায় থাকে।
    *   **On**: fix attempt-এর পরও Mermaid syntax error থাকা file-কে manual review-এর জন্য নির্দিষ্ট folder-এ move করে।
-   **Mermaid error folder path**: (উপরের অপশন enabled হলে দৃশ্যমান) error file move করার folder path।

#### প্রসেসিং প্যারামিটার
-   **Enable Batch Parallelism**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: batch processing task (যেমন "Process Folder" বা "Batch Generate from Titles") file-গুলো একটির পর একটি (serially) প্রসেস করে।
    *   **সক্রিয়**: plugin-কে একাধিক file সমান্তরালে প্রসেস করার সুযোগ দেয়, যা বড় batch job অনেক দ্রুত করতে পারে।
-   **Batch Concurrency**: (শুধু parallelism enabled হলে দৃশ্যমান) একসাথে প্রসেস হওয়া file-এর সর্বোচ্চ সংখ্যা নির্ধারণ করে। বেশি মান দ্রুত হতে পারে, কিন্তু বেশি resource ব্যবহার করে এবং API rate limit-এ লাগতে পারে। (Default: 1, Range: 1-20)
-   **Batch Size**: (শুধু parallelism enabled হলে দৃশ্যমান) এক batch-এ group করা file-এর সংখ্যা। (Default: 50, Range: 10-200)
-   **Delay Between Batches (ms)**: (শুধু parallelism enabled হলে দৃশ্যমান) প্রতিটি batch-এর মধ্যে optional delay, যা API rate limit সামলাতে সাহায্য করে। (Default: 1000ms)
-   **API Call Interval (ms)**: প্রতিটি individual LLM API call-এর *আগে ও পরে* milliseconds-এ ন্যূনতম delay। low-rate API বা 429 error এড়াতে গুরুত্বপূর্ণ। কোনো artificial delay না চাইলে 0 সেট করুন। (Default: 500ms)
-   **Chunk Word Count**: LLM-এ পাঠানো প্রতি chunk-এর সর্বোচ্চ শব্দসংখ্যা। বড় file-এর জন্য API call-এর সংখ্যা প্রভাবিত করে। (Default: 3000)
-   **Enable Duplicate Detection**: processed content-এ duplicate word চেককে on/off করে (ফলাফল console-এ যায়)। (ডিফল্ট: সক্রিয়)
-   **Max Tokens**: প্রতি response chunk-এ LLM সর্বোচ্চ যত token তৈরি করবে। এটি খরচ এবং বিশদ দুটোকেই প্রভাবিত করে। (Default: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### অনুবাদ
-   **Default Target Language**: আপনি কোন ডিফল্ট ভাষায় আপনার note অনুবাদ করতে চান তা নির্বাচন করুন। Translation command চালানোর সময় UI থেকে এটি override করা যায়। (Default: English)
-   **Customise Translation File Save Path**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: translated file মূল note-এর *একই folder*-এ সেভ হয়।
    *   **সক্রিয়**: আপনার vault-এর মধ্যে *relative path* (যেমন `Translations`) নির্ধারণ করতে দেয়, যেখানে translated file সেভ হবে। folder না থাকলে তৈরি হবে।
-   **Use custom suffix for translated files**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: translated file ডিফল্ট `_translated.md` suffix ব্যবহার করে (যেমন `YourNote_translated.md`)।
    *   **সক্রিয়**: custom suffix নির্ধারণ করতে দেয়।
-   **Custom Suffix**: (উপরের অপশন enabled হলে দৃশ্যমান) translated filename-এ যুক্ত হওয়ার জন্য custom suffix লিখুন (যেমন `_es` বা `_fr`)।
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### কনটেন্ট জেনারেশন
-   **Enable Research in "Generate from Title"**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: "Generate from Title" শুধুমাত্র title-কে input হিসেবে ব্যবহার করে।
    *   **সক্রিয়**: configured **Web Research Provider** ব্যবহার করে web research করে এবং title-based generation-এর সময় তার ফলাফল LLM-এর জন্য context হিসেবে যোগ করে।
-   **Auto-run Mermaid Syntax Fix after Generation**:
    *   **সক্রিয় (ডিফল্ট)**: Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid এবং Translate-এর মতো Mermaid-সম্পর্কিত workflow-এর পরে Mermaid syntax fix স্বয়ংক্রিয়ভাবে চালায়।
    *   **নিষ্ক্রিয়**: generated Mermaid output অপরিবর্তিত রাখে, যদি না আপনি `Batch Mermaid Fix` manually চালান বা custom workflow-তে যোগ করেন।
-   **Output Language**: (নতুন) "Generate from Title" এবং "Batch Generate from Title" task-এর জন্য কাঙ্ক্ষিত output language নির্বাচন করুন।
    *   **English (Default)**: prompt ইংরেজিতে প্রসেস হয় এবং output ইংরেজিতে দেওয়া হয়।
    *   **Other Languages**: LLM-কে নির্দেশ দেওয়া হয় যেন reasoning ইংরেজিতে করে কিন্তু চূড়ান্ত ডকুমেন্টেশন আপনার নির্বাচিত ভাষায় দেয় (যেমন Español, Français, 简体中文, 繁體中文, العربية, हिन्दी ইত্যাদি)।
-   **Change Prompt Word**: (নতুন)
    *   **Change Prompt Word**: নির্দিষ্ট task-এর জন্য prompt word পরিবর্তনের সুযোগ দেয়।
    *   **Custom Prompt Word**: task-এর জন্য আপনার custom prompt word লিখুন।
-   **Use Custom Output Folder for 'Generate from Title'**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: সফলভাবে generated file-গুলো মূল folder-এর parent-এর সাপেক্ষে `[OriginalFolderName]_complete` নামে subfolder-এ move হয় (বা মূল folder root হলে `Vault_complete`)।
    *   **সক্রিয়**: complete file move করার subfolder-এর জন্য custom name নির্ধারণ করতে দেয়।
-   **Custom Output Folder Name**: (উপরের অপশন enabled হলে দৃশ্যমান) subfolder-এর পছন্দের নাম লিখুন (যেমন `Generated Content`, `_complete`)। invalid character অনুমোদিত নয়। ফাঁকা রাখলে ডিফল্ট `_complete` হবে। এই folder মূল folder-এর parent directory-এর সাপেক্ষে তৈরি হয়।

#### এক-ক্লিক ওয়ার্কফ্লো বাটন
-   **Visual Workflow Builder**: built-in action থেকে custom workflow button তৈরি করুন, DSL হাতে না লিখেই।
-   **Custom Workflow Buttons DSL**: advanced user-রা workflow definition text সরাসরি edit করতে পারেন। invalid DSL নিরাপদে default workflow-এ fallback করে এবং sidebar/settings UI-তে warning দেখায়।
-   **Workflow Error Strategy**:
    *   **Stop on Error (Default)**: কোনো step ব্যর্থ হলেই workflow সঙ্গে সঙ্গে বন্ধ করে দেয়।
    *   **Continue on Error**: পরের step চালিয়ে যায় এবং শেষে কতগুলো action ব্যর্থ হয়েছে তা জানায়।
-   **Default Workflow Included**: `One-Click Extract` `Process File (Add Links)`, `Batch Generate from Titles`, এবং `Batch Mermaid Fix`-কে chain করে।

#### কাস্টম প্রম্পট সেটিংস
এই feature আপনাকে নির্দিষ্ট task-এর জন্য LLM-এ পাঠানো default instruction (prompt) override করতে দেয়, ফলে output-এর ওপর আরও সূক্ষ্ম নিয়ন্ত্রণ পাওয়া যায়।

-   **Enable Custom Prompts for Specific Tasks**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: plugin সব operation-এর জন্য built-in default prompt ব্যবহার করে।
    *   **সক্রিয়**: নিচে দেওয়া task-গুলোর জন্য custom prompt সেট করার সুবিধা সক্রিয় করে। এটি এই feature-এর master switch।

-   **Use Custom Prompt for [Task Name]**: (শুধু উপরোক্ত অপশন enabled হলে দৃশ্যমান)
    *   প্রতিটি supported task ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts")-এর জন্য আপনি আলাদাভাবে custom prompt enable বা disable করতে পারবেন।
    *   **Disabled**: এই task default prompt ব্যবহার করবে।
    *   **সক্রিয়**: এই task নিচের সংশ্লিষ্ট "Custom Prompt" text area-তে দেওয়া আপনার কাস্টম নির্দেশনা ব্যবহার করবে।

-   **Custom Prompt Text Area**: (শুধু task-এর custom prompt enabled হলে দৃশ্যমান)
    *   **Default Prompt Display**: reference হিসেবে plugin সেই default prompt দেখায় যা এটি সাধারণত task-এর জন্য ব্যবহার করে। আপনি **"Copy Default Prompt"** button ব্যবহার করে সেই টেক্সট কপি করে নিজের custom prompt-এর ভিত্তি হিসেবে নিতে পারেন।
    *   **Custom Prompt Input**: এখানে আপনি LLM-এর জন্য নিজের নির্দেশনা লিখবেন।
    *   **Placeholders**: আপনি (এবং ব্যবহার করা উচিত) আপনার prompt-এ special placeholder ব্যবহার করতে পারেন, যেগুলো plugin request পাঠানোর আগে বাস্তব content দিয়ে প্রতিস্থাপন করবে। প্রতিটি task-এর জন্য কোন placeholder উপলভ্য তা দেখতে default prompt দেখুন। সাধারণ placeholder-এর মধ্যে রয়েছে:
        *   `{TITLE}`: বর্তমান note-এর title।
        *   `{RESEARCH_CONTEXT_SECTION}`: web research থেকে সংগৃহীত content।
        *   `{USER_PROMPT}`: processed note-এর content।

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### ডুপ্লিকেট পরীক্ষা পরিসর
-   **Duplicate Check Scope Mode**: আপনার Concept Note Folder-এর note-এর বিপরীতে সম্ভাব্য duplicate চেকের জন্য কোন file দেখা হবে তা নিয়ন্ত্রণ করে।
    *   **Entire Vault (Default)**: concept note-কে vault-এর বাকি সব note-এর সাথে তুলনা করে (Concept Note Folder নিজে বাদে)।
    *   **Include Specific Folders Only**: concept note-কে শুধু নিচে তালিকাভুক্ত folder-এর note-এর সাথে তুলনা করে।
    *   **Exclude Specific Folders**: concept note-কে নিচে তালিকাভুক্ত folder ছাড়া vault-এর সব note-এর সাথে তুলনা করে (এবং Concept Note Folder-ও বাদ দেয়)।
    *   **Concept Folder Only**: concept note-কে শুধুমাত্র *Concept Note Folder-এর ভেতরের অন্য note*-এর সাথে তুলনা করে। এটি generated concept-এর মধ্যেকার duplicate শনাক্ত করতে সাহায্য করে।
-   **Include/Exclude Folders**: (শুধু Mode `Include` বা `Exclude` হলে দৃশ্যমান) আপনি যেসব folder অন্তর্ভুক্ত বা বাদ দিতে চান, তাদের *relative path* লিখুন, **প্রতি লাইনে একটি path**। Path case-sensitive এবং separator হিসেবে `/` ব্যবহার করে (যেমন `Reference Material/Papers` বা `Daily Notes`)। এসব folder Concept Note Folder-এর সমান বা তার ভেতরে হতে পারবে না।

#### ওয়েব গবেষণা প্রদানকারী
-   **Search Provider**: `Tavily` (API key প্রয়োজন, প্রস্তাবিত) এবং `DuckDuckGo` (experimental, automated request-এর কারণে search engine প্রায়ই block করে)-এর মধ্যে বেছে নিন। "Research & Summarize Topic" এবং চাইলে "Generate from Title"-এ ব্যবহার হয়।
-   **Tavily API Key**: (শুধু Tavily নির্বাচন করা থাকলে দৃশ্যমান) [tavily.com](https://tavily.com/) থেকে প্রাপ্ত API key লিখুন।
-   **Tavily Max Results**: (শুধু Tavily নির্বাচন করা থাকলে দৃশ্যমান) Tavily কতগুলো search result ফেরত দেবে তার সর্বোচ্চ সংখ্যা (1-20)। ডিফল্ট: 5।
-   **Tavily Search Depth**: (শুধু Tavily নির্বাচন করা থাকলে দৃশ্যমান) `basic` (ডিফল্ট) বা `advanced` নির্বাচন করুন। নোট: `advanced` ভালো ফলাফল দেয়, তবে search প্রতি 1-এর বদলে 2 API credit খরচ করে।
-   **DuckDuckGo Max Results**: (শুধু DuckDuckGo নির্বাচন করা থাকলে দৃশ্যমান) parse করার জন্য search result-এর সর্বোচ্চ সংখ্যা (1-10)। ডিফল্ট: 5।
-   **DuckDuckGo Content Fetch Timeout**: (শুধু DuckDuckGo নির্বাচন করা থাকলে দৃশ্যমান) প্রতিটি DuckDuckGo result URL থেকে content fetch করার সময় সর্বোচ্চ কত সেকেন্ড অপেক্ষা করা হবে। ডিফল্ট: 15।
-   **Max Research Content Tokens**: summarization prompt-এ অন্তর্ভুক্ত combined web research result (snippet/fetched content)-এর আনুমানিক সর্বোচ্চ token। এটি context window size ও খরচ নিয়ন্ত্রণে সাহায্য করে। (Default: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### কেন্দ্রীভূত শিক্ষাক্ষেত্র
-   **Enable Focused Learning Domain**:
    *   **নিষ্ক্রিয় (ডিফল্ট)**: LLM-এ পাঠানো prompt standard, general-purpose instruction ব্যবহার করে।
    *   **সক্রিয়**: আপনাকে এক বা একাধিক study field নির্ধারণ করতে দেয়, যাতে LLM-এর contextual understanding উন্নত হয়।
-   **Learning Domain**: (শুধু উপরোক্ত অপশন enabled হলে দৃশ্যমান) আপনার নির্দিষ্ট field(s) লিখুন, যেমন 'Materials Science', 'Polymer Physics', 'Machine Learning'। এতে prompt-এর শুরুতে "Relevant Fields: [...]" লাইন যোগ হয়, যা LLM-কে আপনার নির্দিষ্ট অধ্যয়নক্ষেত্রের জন্য আরও নির্ভুল ও প্রাসঙ্গিক link এবং content তৈরি করতে সাহায্য করে।
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## ব্যবহার নির্দেশিকা

### দ্রুত ওয়ার্কফ্লো ও সাইডবার

-   মূল প্রসেসিং, জেনারেশন, অনুবাদ, জ্ঞান ও utility action-এর grouped section-এ পৌঁছাতে Notemd sidebar খুলুন।
-   custom multi-step button চালাতে sidebar-এর শীর্ষে থাকা **দ্রুত ওয়ার্কফ্লো** এলাকা ব্যবহার করুন।
-   ডিফল্ট **One-Click Extract** workflow `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix` চালায়।
-   workflow progress, per-step log এবং failure sidebar-এ দেখা যায়; pinned footer progress bar ও log area-কে expanded section-এর চাপে ছোট হয়ে যেতে দেয় না।
-   progress card status text, percentage indicator এবং remaining time স্পষ্টভাবে পড়তে সাহায্য করে, এবং একই custom workflow settings থেকে পুনরায় কনফিগার করা যায়।

### মূল প্রসেসিং (wiki-links যোগ করা)
এটি মূল কার্যকারিতা, যার লক্ষ্য concept শনাক্ত করা এবং `[[wiki-links]]` যোগ করা।

**গুরুত্বপূর্ণ:** এই প্রক্রিয়া শুধুমাত্র `.md` বা `.txt` file-এ কাজ করে। আপনি আরও processing-এর আগে [Mineru](https://github.com/opendatalab/MinerU) ব্যবহার করে PDF file-কে বিনামূল্যে MD file-এ রূপান্তর করতে পারেন।

1.  **Sidebar ব্যবহার করে**:
    *   Notemd Sidebar খুলুন (wand icon বা কমান্ড প্যালেট-এর মাধ্যমে)।
    *   `.md` বা `.txt` file খুলুন।
    *   **"Process File (Add Links)"**-এ ক্লিক করুন।
    *   কোনো folder প্রসেস করতে: **"Process Folder (Add Links)"**-এ ক্লিক করুন, folder নির্বাচন করুন, তারপর "Process" চাপুন।
    *   sidebar-এ progress দেখা যাবে। sidebar-এর "Cancel Processing" button দিয়ে task cancel করা যায়।
    *   *Folder processing note:* file-গুলো editor-এ না খুলেই background-এ প্রসেস হয়।

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Command Palette ব্যবহার করে** (`Ctrl+P` বা `Cmd+P`):
    *   **Single File**: file খুলে `Notemd: Process Current File` চালান।
    *   **Folder**: `Notemd: Process Folder` চালিয়ে folder নির্বাচন করুন। file-গুলো editor-এ না খুলেই background-এ প্রসেস হয়।
    *   কমান্ড প্যালেট action-এর জন্য একটি progress modal দেখা যায়, যাতে cancel button থাকে।
    *   *নোট:* final processed content save করার আগে plugin স্বয়ংক্রিয়ভাবে শুরুর `\boxed{` এবং শেষের `}` line সরিয়ে দেয়, যদি সেগুলো উপস্থিত থাকে।

### নতুন বৈশিষ্ট্য

1.  **Mermaid ডায়াগ্রাম হিসেবে সারসংক্ষেপ করুন**:
    *   যে note-টি summarize করতে চান সেটি খুলুন।
    *   `Notemd: Summarise as Mermaid diagram` command চালান (কমান্ড প্যালেট বা sidebar button-এর মাধ্যমে)।
    *   plugin Mermaid diagram-সহ একটি নতুন note তৈরি করবে।

2.  **Translate Note/Selection**:
    *   কোনো note-এ text select করুন যাতে শুধুমাত্র সেই অংশ অনুবাদ হয়, অথবা selection ছাড়া command চালিয়ে পুরো note অনুবাদ করুন।
    *   `Notemd: Translate Note/Selection` command চালান (কমান্ড প্যালেট বা sidebar button-এর মাধ্যমে)।
    *   একটি modal আসবে যেখানে আপনি **Target Language** নিশ্চিত বা পরিবর্তন করতে পারবেন (ডিফল্ট হিসেবে Configuration-এ নির্ধারিত মান ব্যবহৃত হবে)।
    *   plugin configured **LLM Provider** (Multi-Model settings অনুযায়ী) ব্যবহার করে অনুবাদ সম্পন্ন করে।
    *   translated content configured **Translation Save Path**-এ উপযুক্ত suffix সহ সেভ হয়, এবং সহজ তুলনার জন্য **মূল content-এর ডান পাশে নতুন pane-এ** খোলে।
    *   এই task sidebar button বা modal cancel button থেকে cancel করা যায়।
3.  **ব্যাচ অনুবাদ**:
    *   কমান্ড প্যালেট থেকে `Notemd: Batch Translate Folder` চালিয়ে folder নির্বাচন করুন, অথবা file explorer-এ folder-এ right-click করে "Batch translate this folder" বেছে নিন।
    *   plugin নির্বাচিত folder-এর সব Markdown file অনুবাদ করবে।
    *   translated file configured translation path-এ সেভ হয়, তবে স্বয়ংক্রিয়ভাবে খোলে না।
    *   এই প্রক্রিয়া progress modal-এর মাধ্যমে cancel করা যায়।

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Research & Summarize Topic**:
    *   note-এর মধ্যে text নির্বাচন করুন অথবা নিশ্চিত করুন যে note-এর একটি title আছে (এটিই search topic হবে)।
    *   `Notemd: Research and Summarize Topic` command চালান (কমান্ড প্যালেট বা sidebar button-এর মাধ্যমে)।
    *   plugin configured **Search Provider** (Tavily/DuckDuckGo) এবং উপযুক্ত **LLM Provider** (Multi-Model settings অনুযায়ী) ব্যবহার করে তথ্য খুঁজে বের করে ও summarize করে।
    *   summary বর্তমান note-এ append হয়।
    *   task sidebar button বা modal cancel button দিয়ে cancel করা যায়।
    *   *নোট:* bot detection-এর কারণে DuckDuckGo search ব্যর্থ হতে পারে। Tavily প্রস্তাবিত।

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Generate Content from Title**:
    *   একটি note খুলুন (এটি খালি হতে পারে)।
    *   `Notemd: Generate Content from Title` command চালান (কমান্ড প্যালেট বা sidebar button-এর মাধ্যমে)।
    *   plugin উপযুক্ত **LLM Provider** (Multi-Model settings অনুযায়ী) ব্যবহার করে note title-এর ভিত্তিতে content তৈরি করে এবং বিদ্যমান content replace করে।
    *   যদি **"Enable Research in 'Generate from Title'"** setting enabled থাকে, তবে প্রথমে web research করা হবে (configured **Web Research Provider** ব্যবহার করে), এবং সেই context LLM-এ পাঠানো prompt-এ যোগ হবে।
    *   task sidebar button বা modal cancel button দিয়ে cancel করা যায়।

5.  **Batch Generate Content from Titles**:
    *   `Notemd: Batch Generate Content from Titles` command চালান (কমান্ড প্যালেট বা sidebar button-এর মাধ্যমে)।
    *   যে folder-এ প্রসেস করার note আছে সেটি নির্বাচন করুন।
    *   plugin folder-এর প্রতিটি `.md` file-এ iterate করবে (`_processed.md` file এবং নির্দিষ্ট "complete" folder-এর file বাদ দিয়ে), note title-এর ভিত্তিতে content তৈরি করবে এবং বিদ্যমান content replace করবে। file-গুলো editor-এ না খুলেই background-এ প্রসেস হয়।
    *   সফলভাবে processed file configured "complete" folder-এ move করা হয়।
    *   এই command প্রতিটি note-এর জন্য **"Enable Research in 'Generate from Title'"** setting মান্য করে।
    *   task sidebar button বা modal cancel button দিয়ে cancel করা যায়।
    *   progress এবং result (পরিবর্তিত file-এর সংখ্যা, error) sidebar/modal log-এ দেখা যায়।
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Check and Remove Duplicate Concept Notes**:
    *   নিশ্চিত করুন যে **Concept Note Folder Path** settings-এ সঠিকভাবে configured আছে।
    *   `Notemd: Check and Remove Duplicate Concept Notes` চালান (কমান্ড প্যালেট বা sidebar button-এর মাধ্যমে)।
    *   plugin concept note folder স্ক্যান করে এবং exact match, plural, normalization ও containment-এর মতো নিয়মের সাহায্যে folder-এর বাইরের note-এর সাথে filename তুলনা করে।
    *   সম্ভাব্য duplicate পাওয়া গেলে একটি modal window দেখা যায় যেখানে file, flag হওয়ার কারণ এবং conflicting file তালিকাভুক্ত থাকে।
    *   তালিকাটি ভালোভাবে দেখুন। system trash-এ file পাঠাতে **"Delete Files"**-এ ক্লিক করুন, অথবা কিছু না করতে **"Cancel"** চাপুন।
    *   progress ও result sidebar/modal log-এ দেখায়।

7.  **Extract Concepts (Pure Mode)**:
    *   এই feature আপনাকে কোনো document থেকে concept বের করে corresponding concept note *মূল file না বদলে* তৈরি করতে দেয়। এটি ডকুমেন্টের একটি সেট থেকে দ্রুত আপনার knowledge base পূরণ করার জন্য উপযুক্ত।
    *   **Single File**: একটি file খুলুন এবং কমান্ড প্যালেট থেকে `Notemd: Extract concepts (create concept notes only)` চালান, অথবা sidebar-এর **"Extract concepts (current file)"** button-এ ক্লিক করুন।
    *   **Folder**: কমান্ড প্যালেট থেকে `Notemd: Batch extract concepts from folder` চালান, অথবা sidebar-এর **"Extract concepts (folder)"** button-এ ক্লিক করে folder নির্বাচন করুন, যাতে ওই folder-এর সব note প্রসেস হয়।
    *   plugin file পড়বে, concept শনাক্ত করবে, এবং আপনার নির্দিষ্ট **Concept Note Folder**-এ নতুন note তৈরি করবে, মূল file অপরিবর্তিত রেখে।

8.  **Create Wiki-Link & Generate Note from Selection**:
    *   এই শক্তিশালী command নতুন concept note তৈরি ও পূরণের প্রক্রিয়া সহজ করে।
    *   editor-এ কোনো শব্দ বা বাক্যাংশ নির্বাচন করুন।
    *   `Notemd: Create Wiki-Link & Generate Note from Selection` command চালান (এতে `Cmd+Shift+W`-এর মতো hotkey assign করা প্রস্তাবিত)।
    *   plugin:
        1.  নির্বাচিত text-কে `[[wiki-link]]` দিয়ে replace করবে।
        2.  **Concept Note Folder**-এ ওই title-এর note আগে থেকেই আছে কি না তা পরীক্ষা করবে।
        3.  থাকলে বর্তমান note-এর backlink যোগ করবে।
        4.  না থাকলে একটি নতুন, খালি note তৈরি করবে।
        5.  এরপর নতুন বা বিদ্যমান note-এ **"Generate Content from Title"** command স্বয়ংক্রিয়ভাবে চালিয়ে AI-generated content দিয়ে পূর্ণ করবে।

9.  **Extract Concepts and Generate Titles**:
    *   এই command দুটি শক্তিশালী feature-কে একত্র করে একটি streamlined workflow তৈরি করে।
    *   কমান্ড প্যালেট থেকে `Notemd: Extract Concepts and Generate Titles` command চালান (এটিতে hotkey assign করা প্রস্তাবিত)।
    *   plugin:
        1.  প্রথমে বর্তমান active file-এর ওপর **"Extract concepts (current file)"** task চালাবে।
        2.  এরপর settings-এ **Concept note folder path** হিসেবে configured folder-এ **"Batch generate from titles"** task স্বয়ংক্রিয়ভাবে চালাবে।
    *   এতে আপনি source document থেকে নতুন concept যোগ করে সঙ্গে সঙ্গে AI-generated content দিয়ে সেই concept note-গুলো প্রসারিত করতে পারবেন।

10. **Extract Specific Original Text**:
    *   settings-এ "Extract Specific Original Text" অংশে আপনার প্রশ্নগুলো কনফিগার করুন।
    *   active file প্রসেস করতে sidebar-এর "Extract Specific Original Text" button ব্যবহার করুন।
    *   **Merged Mode**: সব প্রশ্ন এক prompt-এ পাঠিয়ে দ্রুত প্রসেসিং সক্ষম করে।
    *   **Translation**: extracted text-কে configured language-এ ঐচ্ছিকভাবে অনুবাদ করে।
    *   **Custom Output**: extracted file কোথায় ও কীভাবে সেভ হবে তা নির্ধারণ করুন।

11. **Batch Mermaid Fix**:
    *   sidebar-এর "Batch Mermaid Fix" button ব্যবহার করে কোনো folder স্ক্যান করুন এবং সাধারণ Mermaid syntax error ঠিক করুন।
    *   plugin যেসব file-এ error রয়ে গেছে সেগুলোকে `mermaid_error_{foldername}.md` file-এ রিপোর্ট করবে।
    *   চাইলে plugin-কে configure করে এই problematic file-গুলোকে review-এর জন্য আলাদা folder-এ move করাতে পারেন।

## সমর্থিত LLM প্রদানকারী

| প্রদানকারী        | ধরন        | API key প্রয়োজন       | নোট                                                                    |
|-------------------|------------|------------------------|-------------------------------------------------------------------------|
| DeepSeek          | ক্লাউড      | হ্যাঁ                   | reasoning-model handling-সহ native DeepSeek endpoint                   |
| Qwen              | ক্লাউড      | হ্যাঁ                   | Qwen / QwQ model-এর জন্য DashScope compatible-mode preset              |
| Qwen Code         | ক্লাউড      | হ্যাঁ                   | Qwen coder model-এর জন্য DashScope coding-focused preset               |
| Doubao            | ক্লাউড      | হ্যাঁ                   | Volcengine Ark preset; সাধারণত model field আপনার endpoint ID-এ সেট করুন |
| Moonshot          | ক্লাউড      | হ্যাঁ                   | অফিসিয়াল Kimi / Moonshot endpoint                                     |
| GLM               | ক্লাউড      | হ্যাঁ                   | অফিসিয়াল Zhipu BigModel OpenAI-compatible endpoint                    |
| Z AI              | ক্লাউড      | হ্যাঁ                   | আন্তর্জাতিক GLM/Zhipu OpenAI-compatible endpoint; `GLM`-এর পরিপূরক    |
| MiniMax           | ক্লাউড      | হ্যাঁ                   | অফিসিয়াল MiniMax chat-completions endpoint                            |
| Huawei Cloud MaaS | ক্লাউড      | হ্যাঁ                   | hosted model-এর জন্য Huawei ModelArts MaaS OpenAI-compatible endpoint |
| Baidu Qianfan     | ক্লাউড      | হ্যাঁ                   | ERNIE model-এর জন্য অফিসিয়াল Qianfan OpenAI-compatible endpoint      |
| SiliconFlow       | ক্লাউড      | হ্যাঁ                   | hosted OSS model-এর জন্য অফিসিয়াল SiliconFlow OpenAI-compatible endpoint |
| OpenAI            | ক্লাউড      | হ্যাঁ                   | GPT এবং o-series model সমর্থন করে                                      |
| Anthropic         | ক্লাউড      | হ্যাঁ                   | Claude model সমর্থন করে                                                |
| Google            | ক্লাউড      | হ্যাঁ                   | Gemini model সমর্থন করে                                                |
| Mistral           | ক্লাউড      | হ্যাঁ                   | Mistral এবং Codestral family সমর্থন করে                               |
| Azure OpenAI      | ক্লাউড      | হ্যাঁ                   | Endpoint, API Key, deployment name এবং API Version প্রয়োজন           |
| OpenRouter        | গেটওয়ে     | হ্যাঁ                   | OpenRouter model ID-এর মাধ্যমে বহু provider-এ প্রবেশাধিকার           |
| xAI               | ক্লাউড      | হ্যাঁ                   | native Grok endpoint                                                   |
| Groq              | ক্লাউড      | হ্যাঁ                   | hosted OSS model-এর জন্য দ্রুত OpenAI-compatible inference            |
| Together          | ক্লাউড      | হ্যাঁ                   | hosted OSS model-এর জন্য OpenAI-compatible endpoint                   |
| Fireworks         | ক্লাউড      | হ্যাঁ                   | OpenAI-compatible inference endpoint                                   |
| Requesty          | গেটওয়ে     | হ্যাঁ                   | এক API key-এর পেছনে multi-provider router                             |
| OpenAI Compatible | গেটওয়ে     | ঐচ্ছিক                 | LiteLLM, vLLM, Perplexity, Vercel AI Gateway ইত্যাদির জন্য generic preset |
| LMStudio          | লোকাল       | ঐচ্ছিক (`EMPTY`)       | LM Studio server-এর মাধ্যমে লোকালভাবে model চালায়                   |
| Ollama            | লোকাল       | না                      | Ollama server-এর মাধ্যমে লোকালভাবে model চালায়                      |

*নোট: local provider (LMStudio, Ollama)-এর ক্ষেত্রে নিশ্চিত করুন যে সংশ্লিষ্ট server application চালু আছে এবং configured Base URL-এ পৌঁছানো যাচ্ছে।*
*নোট: OpenRouter এবং Requesty-এর জন্য gateway-তে দেখানো provider-prefixed/full model identifier ব্যবহার করুন (যেমন `google/gemini-flash-1.5` বা `anthropic/claude-3-7-sonnet-latest`)।*
*নোট: `Doubao` সাধারণত model field-এ raw model family name-এর বদলে Ark endpoint/deployment ID প্রত্যাশা করে। settings screen এখন placeholder value থেকে গেলে সতর্ক করে এবং বাস্তব endpoint ID না দেওয়া পর্যন্ত connection test বন্ধ রাখে।*
*নোট: `Z AI` আন্তর্জাতিক `api.z.ai` line লক্ষ্য করে, যেখানে `GLM` mainland China BigModel endpoint ধরে রাখে। আপনার account region অনুযায়ী সঠিক preset নির্বাচন করুন।*
*নোট: China-focused preset chat-first connection check ব্যবহার করে, তাই test প্রকৃত configured model/deployment যাচাই করে, শুধু API key পৌঁছানো যাচ্ছে কি না তা নয়।*
*নোট: `OpenAI Compatible` custom gateway ও proxy-এর জন্য। আপনার provider-এর documentation অনুযায়ী Base URL, API key policy এবং model ID সেট করুন।*

## নেটওয়ার্ক ব্যবহার ও ডেটা ব্যবস্থাপনা

Notemd Obsidian-এর ভেতরে local-ভাবে চলে, তবে কিছু feature outgoing request পাঠায়।

### LLM প্রদানকারী কল (কনফিগারযোগ্য)

- ট্রিগার: file processing, generation, translation, research summarization, Mermaid summarization, এবং connection/diagnostic action।
- Endpoint: Notemd settings-এ configured provider base URL(s)।
- পাঠানো ডেটা: processing-এর জন্য প্রয়োজনীয় prompt text এবং task content।
- ডেটা ব্যবস্থাপনা নোট: API key প্লাগইনের settings-এ local-ভাবে সংরক্ষিত থাকে এবং আপনার device থেকে request sign করতে ব্যবহৃত হয়।

### ওয়েব গবেষণা কল (ঐচ্ছিক)

- ট্রিগার: যখন web research enabled থাকে এবং কোনো search provider নির্বাচন করা হয়।
- Endpoint: Tavily API বা DuckDuckGo endpoints।
- পাঠানো ডেটা: আপনার research query এবং প্রয়োজনীয় request metadata।

### ডেভেলপার ডায়াগনস্টিকস ও ডিবাগ লগ (ঐচ্ছিক)

- ট্রিগার: API debug mode এবং developer diagnostic action।
- Storage: diagnostic এবং error log আপনার vault root-এ লেখা হয় (যেমন `Notemd_Provider_Diagnostic_*.txt` এবং `Notemd_Error_Log_*.txt`)।
- ঝুঁকি নোট: log-এ request/response-এর অংশ থাকতে পারে। পাবলিকভাবে শেয়ার করার আগে log পরীক্ষা করুন।

### স্থানীয় সংরক্ষণ

- plugin configuration `.obsidian/plugins/notemd/data.json`-এ সংরক্ষিত হয়।
- generated file, report এবং optional log আপনার settings অনুযায়ী vault-এ সংরক্ষিত হয়।

## সমস্যা সমাধান

### সাধারণ সমস্যা
-   **প্লাগইন লোড হচ্ছে না**: নিশ্চিত করুন `manifest.json`, `main.js`, `styles.css` সঠিক folder (`<Vault>/.obsidian/plugins/notemd/`)-এ রয়েছে এবং Obsidian পুনরায় চালু করুন। startup error-এর জন্য Developer Console (`Ctrl+Shift+I` বা `Cmd+Option+I`) দেখুন।
-   **Processing failure / API error**:
    1.  **File format পরীক্ষা করুন**: আপনি যে file প্রসেস বা পরীক্ষা করতে চান তার extension `.md` বা `.txt` কি না নিশ্চিত করুন। Notemd বর্তমানে শুধুমাত্র এই text-based format সমর্থন করে।
    2.  সক্রিয় provider-এর settings যাচাই করতে "Test LLM Connection" command/button ব্যবহার করুন।
    3.  API Key, Base URL, Model Name এবং API Version (Azure-এর জন্য) আবার পরীক্ষা করুন। নিশ্চিত করুন API key সঠিক এবং যথেষ্ট credit/permission রয়েছে।
    4.  নিশ্চিত করুন যে local LLM server (LMStudio, Ollama) চালু আছে এবং Base URL সঠিক (যেমন LMStudio-এর জন্য `http://localhost:1234/v1`)।
    5.  cloud provider-এর জন্য internet connection পরীক্ষা করুন।
    6.  **Single file processing error-এর জন্য:** বিস্তারিত error message পেতে Developer Console দেখুন। প্রয়োজনে error modal-এর button ব্যবহার করে তা কপি করুন।
    7.  **Batch processing error-এর জন্য:** প্রতিটি ব্যর্থ file-এর বিস্তারিত error message পেতে vault root-এর `error_processing_filename.log` file দেখুন। Developer Console বা error modal শুধুমাত্র summary বা সাধারণ batch error দেখাতে পারে।
    8.  **স্বয়ংক্রিয় ত্রুটি লগ:** কোনো process ব্যর্থ হলে plugin `Notemd_Error_Log_[Timestamp].txt` নামে বিস্তারিত log file vault-এর root directory-তে স্বয়ংক্রিয়ভাবে সেভ করে। এতে error message, স্ট্যাক ট্রেস এবং session log থাকে। সমস্যা বারবার হলে এই file পরীক্ষা করুন। settings-এ "API Error Debugging Mode" চালু করলে এই log-এ আরও বিশদ API response data যুক্ত হবে।
    9.  **বাস্তব endpoint long-request diagnostics (Developer)**:
        - In-plugin path (প্রথমে প্রস্তাবিত): সক্রিয় provider-এ runtime probe চালাতে এবং vault root-এ `Notemd_Provider_Diagnostic_*.txt` তৈরি করতে **Settings -> Notemd -> Developer provider diagnostic (long request)** ব্যবহার করুন।
        - CLI path (Obsidian runtime-এর বাইরে): buffered এবং streaming behavior-এর reproducible endpoint-level তুলনার জন্য ব্যবহার করুন:
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
        generated report-এ প্রতি attempt timing (`First Byte`, `Duration`), sanitized request metadata, response headers, raw/partial body fragments, parsed stream fragments এবং transport-layer failure points থাকে।
-   **LM Studio/Ollama connection issue**:
    *   **টেস্ট কানেকশন ব্যর্থ হলে**: নিশ্চিত করুন local server (LM Studio বা Ollama) চালু আছে এবং সঠিক model loaded/available আছে।
    *   **CORS Errors (Windows-এ Ollama)**: Windows-এ Ollama ব্যবহার করার সময় যদি CORS (Cross-Origin Resource Sharing) error আসে, তবে `OLLAMA_ORIGINS` environment variable সেট করতে হতে পারে। Ollama চালুর আগে command prompt-এ `set OLLAMA_ORIGINS=*` চালিয়ে এটি করতে পারেন। এতে যেকোনো origin থেকে request অনুমোদিত হবে।
    *   **Enable CORS in LM Studio**: LM Studio-এর ক্ষেত্রে server settings থেকেই CORS চালু করতে পারেন, যা Obsidian browser-এ চললে বা strict origin policy থাকলে দরকার হতে পারে।
-   **Folder creation error ("File name cannot contain...")**:
    *   সাধারণত এর মানে হলো settings-এ দেওয়া path (**Processed File Folder Path** বা **Concept Note Folder Path**) *Obsidian-এর জন্য* invalid।
    *   **নিশ্চিত করুন আপনি relative path ব্যবহার করছেন** (যেমন `Processed`, `Notes/Concepts`) এবং **absolute path নয়** (যেমন `C:\Users\...`, `/Users/...`)।
    *   invalid character পরীক্ষা করুন: `* " \ / < > : | ? # ^ [ ]`। মনে রাখুন Obsidian path-এর ক্ষেত্রে Windows-এও `\` অবৈধ। path separator হিসেবে `/` ব্যবহার করুন।
-   **পারফরম্যান্স সমস্যা**: বড় file বা অনেক file প্রসেস করতে সময় লাগতে পারে। সম্ভাব্য দ্রুত (কিন্তু বেশি) API call-এর জন্য "Chunk Word Count" setting কমান। অন্য LLM provider বা model চেষ্টা করুন।
-   **অপ্রত্যাশিত লিঙ্ক-সংযোজন**: লিঙ্ক-সংযোজনের গুণমান LLM এবং prompt-এর ওপর খুব বেশি নির্ভর করে। বিভিন্ন model বা তাপমাত্রা setting দিয়ে পরীক্ষা করুন।

## অবদান

অবদান স্বাগত। নির্দেশিকার জন্য GitHub repository দেখুন: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## রক্ষণাবেক্ষণকারীর নথি

- [রিলিজ ওয়ার্কফ্লো (ইংরেজি)](./docs/maintainer/release-workflow.md)
- [রিলিজ ওয়ার্কফ্লো (সরলীকৃত চীনা)](./docs/maintainer/release-workflow.zh-CN.md)

## লাইসেন্স

MIT লাইসেন্স - বিস্তারিত জানতে [LICENSE](LICENSE) file দেখুন।

---


*Notemd v1.8.3 - AI-এর সাহায্যে আপনার Obsidian knowledge graph আরও উন্নত করুন।*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
