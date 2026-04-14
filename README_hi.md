![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Obsidian के लिए Notemd प्लगइन

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

दूसरी भाषाओं में दस्तावेज़ पढ़ें: [भाषा केंद्र](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 AI-संचालित बहुभाषी ज्ञान संवर्धन
==================================================
```

अपना स्वयं का ज्ञान-आधार बनाने का एक आसान तरीका।

Notemd आपके Obsidian वर्कफ़्लो को बेहतर बनाता है। यह विभिन्न बड़े भाषा मॉडल (LLMs) के साथ एकीकृत होकर आपके बहुभाषी नोट्स को संसाधित करता है, मुख्य अवधारणाओं के लिए स्वचालित रूप से wiki-links बनाता है, संबंधित concept notes तैयार करता है, वेब शोध करता है और शक्तिशाली ज्ञान ग्राफ़ बनाने में आपकी मदद करता है।

**संस्करण:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## विषय सूची

- [त्वरित शुरुआत](#त्वरित-शुरुआत)
- [भाषा समर्थन](#भाषा-समर्थन)
- [विशेषताएँ](#विशेषताएँ)
- [इंस्टॉलेशन](#इंस्टॉलेशन)
- [कॉन्फ़िगरेशन](#कॉन्फ़िगरेशन)
- [उपयोग गाइड](#उपयोग-गाइड)
- [समर्थित LLM प्रदाता](#समर्थित-llm-प्रदाता)
- [नेटवर्क उपयोग और डेटा प्रबंधन](#नेटवर्क-उपयोग-और-डेटा-प्रबंधन)
- [समस्या निवारण](#समस्या-निवारण)
- [योगदान](#योगदान)
- [मेंटेनर दस्तावेज़](#मेंटेनर-दस्तावेज़)
- [लाइसेंस](#लाइसेंस)

## त्वरित शुरुआत

1.  **इंस्टॉल और सक्षम करें**: प्लगइन को Obsidian Marketplace से प्राप्त करें।
2.  **LLM कॉन्फ़िगर करें**: `Settings -> Notemd` पर जाएँ, अपना LLM प्रदाता चुनें (जैसे OpenAI या स्थानीय प्रदाता जैसे Ollama), और अपनी API कुंजी/URL दर्ज करें।
3.  **साइडबार खोलें**: बाएँ रिबन में Notemd वैंड आइकन पर क्लिक करके साइडबार खोलें।
4.  **एक नोट संसाधित करें**: कोई भी नोट खोलें और साइडबार में **"Process File (Add Links)"** पर क्लिक करें ताकि मुख्य अवधारणाओं में स्वचालित रूप से `[[wiki-links]]` जोड़े जा सकें।
5.  **त्वरित वर्कफ़्लो चलाएँ**: प्रोसेसिंग, बैच जनरेशन और Mermaid सफ़ाई को एक ही स्थान से जोड़ने के लिए डिफ़ॉल्ट **"One-Click Extract"** बटन का उपयोग करें।

बस इतना ही। वेब रिसर्च, अनुवाद और कंटेंट जनरेशन जैसी और सुविधाएँ अनलॉक करने के लिए सेटिंग्स देखें।

## भाषा समर्थन

### भाषा व्यवहार अनुबंध

| विषय | दायरा | डिफ़ॉल्ट | नोट्स |
|---|---|---|---|
| `इंटरफ़ेस भाषा` | केवल प्लगइन UI टेक्स्ट (सेटिंग्स, साइडबार, नोटिस, डायलॉग) | `auto` | Obsidian लोकेल का अनुसरण करता है; वर्तमान UI कैटलॉग `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW` हैं। |
| `कार्य आउटपुट भाषा` | LLM द्वारा उत्पन्न कार्य आउटपुट (लिंक, सारांश, जनरेशन, एक्सट्रैक्शन, अनुवाद लक्ष्य) | `en` | यह वैश्विक हो सकता है या प्रति-कार्य, जब `कार्यों के लिए अलग-अलग भाषाएँ उपयोग करें` सक्षम हो। |
| `स्वचालित अनुवाद अक्षम करें` | गैर-`Translate` कार्य स्रोत-भाषा संदर्भ बनाए रखते हैं | `false` | स्पष्ट `Translate` कार्य अभी भी कॉन्फ़िगर की गई लक्ष्य भाषा लागू करते हैं। |
| लोकेल फ़ॉलबैक | अनुपलब्ध UI कुंजियों का समाधान | locale -> `en` | कुछ कुंजियाँ अनूदित न होने पर भी UI को स्थिर रखता है। |

- अनुरक्षित स्रोत दस्तावेज़ अंग्रेज़ी और सरलीकृत चीनी हैं, और प्रकाशित README अनुवाद ऊपर हेडर में लिंक किए गए हैं।
- ऐप के भीतर UI locale कवरेज अभी कोड में मौजूद स्पष्ट कैटलॉग से बिल्कुल मेल खाता है: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`।
- अंग्रेज़ी fallback कार्यान्वयन-स्तरीय सुरक्षा जाल के रूप में बना रहता है, लेकिन समर्थित दृश्य सतहें regression tests से कवर हैं और सामान्य उपयोग में चुपचाप अंग्रेज़ी पर वापस नहीं जानी चाहिए।
- अधिक विवरण और योगदान दिशानिर्देश [भाषा केंद्र](./docs/i18n/README.md) में उपलब्ध हैं।

## विशेषताएँ

### AI-संचालित दस्तावेज़ प्रसंस्करण
- **Multi-LLM समर्थन**: विभिन्न क्लाउड और स्थानीय LLM प्रदाताओं से जुड़ें (देखें [समर्थित LLM प्रदाता](#समर्थित-llm-प्रदाता))।
- **स्मार्ट चंकिंग**: बड़े दस्तावेज़ों को शब्द संख्या के आधार पर स्वचालित रूप से प्रबंधनीय हिस्सों में बाँटता है।
- **सामग्री संरक्षण**: संरचना और लिंक जोड़ते समय मूल फ़ॉर्मैटिंग बनाए रखने का प्रयास करता है।
- **प्रगति ट्रैकिंग**: Notemd Sidebar या प्रोग्रेस modal के माध्यम से रियल-टाइम अपडेट।
- **रद्द करने योग्य ऑपरेशन**: साइडबार से शुरू किए गए किसी भी प्रोसेसिंग कार्य (single या batch) को उसके समर्पित cancel बटन से रोका जा सकता है। कमांड पैलेट ऑपरेशन modal का उपयोग करते हैं, जिसे भी cancel किया जा सकता है।
- **मल्टी-मॉडल कॉन्फ़िगरेशन**: अलग-अलग कार्यों (Add Links, Research, Generate Title, Translate) के लिए अलग-अलग LLM प्रदाता *और* विशिष्ट मॉडल उपयोग करें, या सबके लिए एक प्रदाता रखें।
- **Stable API Calls (Retry Logic)**: विफल LLM API कॉल के लिए कॉन्फ़िगर करने योग्य अंतराल और प्रयास सीमा के साथ स्वचालित पुनः प्रयास सक्षम करें।
- **सुदृढ़ प्रदाता कनेक्शन परीक्षण**: यदि पहला प्रदाता परीक्षण किसी अस्थायी नेटवर्क डिस्कनेक्ट से टकराता है, तो Notemd अब विफल होने से पहले stable retry sequence पर फ़ॉलबैक करता है। यह OpenAI-compatible, Anthropic, Google, Azure OpenAI और Ollama ट्रांसपोर्ट्स को कवर करता है।
- **रनटाइम पर्यावरण ट्रांसपोर्ट फ़ॉलबैक**: जब किसी प्रदाता का लंबा चलने वाला अनुरोध `requestUrl` के माध्यम से `ERR_CONNECTION_CLOSED` जैसी अस्थायी नेटवर्क त्रुटियों के कारण गिर जाता है, तो Notemd अब कॉन्फ़िगर किए गए retry loop में प्रवेश करने से पहले उसी प्रयास को environment-specific fallback transport के माध्यम से पुनः प्रयास करता है: desktop builds Node `http/https` का उपयोग करते हैं, जबकि non-desktop environments browser `fetch` का उपयोग करते हैं। इससे धीमे gateway और reverse proxy पर false failure कम होते हैं।
- **OpenAI-compatible stable long-request chain hardening**: stable mode में OpenAI-compatible कॉल अब हर प्रयास के लिए स्पष्ट 3-चरणीय क्रम अपनाती हैं: primary direct streaming transport, फिर direct non-stream transport, फिर `requestUrl` fallback (जो आवश्यक होने पर streamed parsing तक उन्नत हो सकता है)। इससे false negatives कम होते हैं जब providers buffered responses पूरा कर देते हैं लेकिन streaming pipes अस्थिर होते हैं।
- **LLM API में protocol-aware streaming fallback**: लंबी fallback कोशिशें अब सिर्फ OpenAI-compatible endpoints पर नहीं, बल्कि हर built-in LLM path पर protocol-aware streamed parsing का उपयोग करती हैं। Notemd अब OpenAI/Azure-style SSE, Anthropic Messages streaming, Google Gemini SSE responses और Ollama NDJSON streams को desktop `http/https` और non-desktop `fetch` दोनों पर संभालता है, और बाकी direct OpenAI-style provider entrypoints भी उसी shared fallback path का उपयोग करते हैं।
- **China-ready provider presets**: built-in presets अब `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` और `SiliconFlow` को मौजूदा global और local providers के साथ कवर करते हैं।
- **विश्वसनीय बैच प्रोसेसिंग**: **अंतरालबद्ध API कॉल** के साथ बेहतर concurrent processing logic rate-limiting errors को रोकने और बड़े batch jobs में स्थिर प्रदर्शन सुनिश्चित करने में मदद करती है। नई implementation सुनिश्चित करती है कि tasks अलग-अलग अंतराल पर शुरू हों, सब एक साथ नहीं।
- **सटीक प्रगति रिपोर्टिंग**: एक बग ठीक किया गया है जिसके कारण progress bar अटक सकता था, ताकि UI अब हमेशा वास्तविक स्थिति को दर्शाए।
- **मजबूत parallel batch processing**: वह समस्या हल की गई है जिसमें parallel batch operations समय से पहले रुक जाती थीं, जिससे अब सभी फ़ाइलें विश्वसनीय और कुशलतापूर्वक संसाधित होती हैं।
- **प्रोग्रेस बार सटीकता**: "Create Wiki-Link & Generate Note" कमांड के progress bar के 95% पर अटकने वाले बग को ठीक किया गया है, जिससे अब पूरा होने पर सही 100% दिखता है।
- **विस्तृत API डिबगिंग**: "API Error Debugging Mode" अब LLM providers और search services (Tavily/DuckDuckGo) से पूर्ण response bodies कैप्चर करता है, और प्रति-प्रयास transport timeline भी रिकॉर्ड करता है, जिसमें sanitized request URLs, elapsed duration, response headers, partial response bodies, parsed partial stream content और स्टैक ट्रेस शामिल हैं, ताकि OpenAI-compatible, Anthropic, Google, Azure OpenAI और Ollama fallbacks में बेहतर troubleshooting हो सके।
- **Developer Mode panel**: settings में अब एक dedicated developer-only diagnostics panel शामिल है, जो "Developer mode" सक्षम होने तक छिपा रहता है। यह diagnostic call paths चुनने और चयनित mode के लिए repeated stability probes चलाने का समर्थन करता है।
- **पुनःडिज़ाइन किया गया साइडबार**: built-in actions को स्पष्ट लेबल, live status, cancellable progress और copyable logs के साथ अधिक केंद्रित सेक्शनों में समूहित किया गया है, ताकि sidebar clutter कम हो। progress/log footer अब तब भी दिखाई देता है जब हर सेक्शन expanded हो, और ready state अधिक स्पष्ट standby progress track का उपयोग करती है।
- **साइडबार interaction और readability polish**: sidebar buttons अब बेहतर hover/press/focus feedback प्रदान करते हैं, और रंगीन CTA buttons (जैसे `One-Click Extract` और `Batch generate from titles`) बेहतर readability के लिए मजबूत text contrast का उपयोग करते हैं।
- **Single-file CTA mapping**: रंगीन CTA styling अब केवल single-file actions के लिए आरक्षित है। batch/folder-level actions और mixed workflows non-CTA styling का उपयोग करते हैं, ताकि action-scope misclicks कम हों।
- **Custom one-click workflows**: built-in sidebar utilities को उपयोगकर्ता-निर्धारित नामों और assembled action chains के साथ reusable custom buttons में बदलें। डिफ़ॉल्ट `One-Click Extract` workflow पहले से शामिल है।

### ज्ञान ग्राफ़ संवर्धन
- **स्वचालित wiki-linking**: LLM आउटपुट के आधार पर आपकी प्रोसेस की गई नोट्स में मुख्य अवधारणाओं की पहचान करता है और `[[wiki-links]]` जोड़ता है।
- **Concept note निर्माण (वैकल्पिक और अनुकूलन योग्य)**: एक निर्दिष्ट vault folder में खोजी गई अवधारणाओं के लिए स्वचालित रूप से नई नोट्स बनाता है।
- **अनुकूलन योग्य आउटपुट पथ**: processed files और नई concept notes को सहेजने के लिए अपने vault के भीतर अलग-अलग relative paths कॉन्फ़िगर करें।
- **अनुकूलन योग्य आउटपुट फ़ाइलनाम (Add Links)**: फ़ाइलों को प्रोसेस करते समय डिफ़ॉल्ट `_processed.md` के बजाय वैकल्पिक रूप से **मूल फ़ाइल को overwrite** करें या custom suffix/replacement string का उपयोग करें।
- **लिंक अखंडता रखरखाव**: vault के भीतर नोट्स के rename या delete होने पर links अपडेट करने का बुनियादी प्रबंधन।
- **शुद्ध concept extraction**: मूल दस्तावेज़ को बदले बिना concepts निकालें और उनके corresponding concept notes बनाएँ। मौजूदा दस्तावेज़ों से ज्ञान-आधार भरने के लिए यह आदर्श है। इस सुविधा में minimal concept notes बनाने और backlinks जोड़ने के विकल्प उपलब्ध हैं।

### अनुवाद

- **AI-संचालित अनुवाद**:
    - कॉन्फ़िगर किए गए LLM का उपयोग करके नोट सामग्री का अनुवाद करें।
    - **बड़ी फ़ाइलों का समर्थन**: बड़े फ़ाइलों को LLM को भेजने से पहले `Chunk word count` सेटिंग के आधार पर छोटे हिस्सों में बाँट दिया जाता है। फिर अनूदित हिस्सों को सहज रूप से एक दस्तावेज़ में जोड़ा जाता है।
    - अनेक भाषाओं के बीच अनुवाद का समर्थन करता है।
    - लक्ष्य भाषा को settings या UI में अनुकूलित किया जा सकता है।
    - आसान पढ़ने के लिए अनूदित पाठ को मूल पाठ के दाएँ ओर स्वचालित रूप से खोलता है।
- **बैच अनुवाद**:
    - चयनित folder के भीतर सभी files का अनुवाद करें।
    - "Enable Batch Parallelism" चालू होने पर parallel processing का समर्थन करता है।
    - यदि कॉन्फ़िगर किया गया हो, तो translation के लिए custom prompts का उपयोग करता है।
	- file explorer context menu में "Batch translate this folder" विकल्प जोड़ता है।
- **स्वचालित अनुवाद अक्षम करें**: जब यह विकल्प सक्षम होता है, तो गैर-`Translate` कार्य अब आउटपुट को किसी विशिष्ट भाषा में बाध्य नहीं करते, जिससे मूल भाषा संदर्भ सुरक्षित रहता है। स्पष्ट "Translate" कार्य फिर भी कॉन्फ़िगरेशन के अनुसार अनुवाद करेगा।

### वेब शोध और सामग्री निर्माण
- **वेब शोध और सारांश**:
    - Tavily (API key आवश्यक) या DuckDuckGo (प्रायोगिक) का उपयोग करके वेब खोज करें।
    - **बेहतर खोज मज़बूती**: DuckDuckGo खोज अब बेहतर parsing logic (DOMParser with Regex fallback) का उपयोग करती है ताकि layout परिवर्तन संभाले जा सकें और विश्वसनीय परिणाम मिलें।
    - कॉन्फ़िगर किए गए LLM का उपयोग करके खोज परिणामों का सारांश बनाती है।
    - सारांश की आउटपुट भाषा settings में अनुकूलित की जा सकती है।
    - वर्तमान नोट में सारांश जोड़ती है।
    - LLM को भेजी जाने वाली research content के लिए configurable token limit।
- **शीर्षक से सामग्री निर्माण**:
    - नोट शीर्षक का उपयोग करके LLM के माध्यम से प्रारंभिक सामग्री उत्पन्न करता है, मौजूदा सामग्री को बदलते हुए।
    - **वैकल्पिक शोध**: सामग्री जनरेशन के लिए संदर्भ प्रदान करने हेतु web research (selected provider के माध्यम से) करना है या नहीं, इसे कॉन्फ़िगर करें।
- **शीर्षकों से बैच सामग्री जनरेशन**: चयनित folder की सभी नोट्स के लिए उनके title के आधार पर सामग्री उत्पन्न करता है (वैकल्पिक research setting का सम्मान करता है)। सफलतापूर्वक प्रोसेस की गई फ़ाइलें पुनःप्रसंस्करण से बचने के लिए **configurable "complete" subfolder** (जैसे `[foldername]_complete` या custom name) में ले जाई जाती हैं।
- **Mermaid auto-fix coupling**: जब Mermaid auto-fix सक्षम होता है, Mermaid-संबंधित workflows प्रोसेसिंग के बाद generated files या output folders को स्वचालित रूप से repair करते हैं। इसमें Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid और Translate flows शामिल हैं।

### उपयोगी सुविधाएँ
- **Mermaid आरेख के रूप में सारांशित करें**:
    - यह सुविधा आपको किसी नोट की सामग्री को Mermaid diagram में सारांशित करने देती है।
    - Mermaid diagram की output language settings में बदली जा सकती है।
    - **Mermaid Output Folder**: वह folder कॉन्फ़िगर करें जहाँ generated Mermaid diagram files सहेजी जाएँगी।
    - **Translate Summarize to Mermaid Output**: generated Mermaid diagram content को configured target language में वैकल्पिक रूप से अनुवाद करता है।
    - 
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **सरल सूत्र प्रारूप सुधार**:
    - single `$` से घिरे single-line गणितीय सूत्रों को standard double `$$` blocks में तेज़ी से बदलता है।
    - **Single File**: वर्तमान फ़ाइल को sidebar button या कमांड पैलेट के माध्यम से प्रोसेस करें।
    - **Batch Fix**: चयनित folder की सभी files को sidebar button या कमांड पैलेट से प्रोसेस करें।

- **वर्तमान फ़ाइल में duplicates की जाँच**: यह command सक्रिय फ़ाइल के भीतर संभावित duplicate terms पहचानने में मदद करती है।
- **Duplicate detection**: वर्तमान में प्रोसेस की जा रही फ़ाइल की सामग्री में duplicate words की बुनियादी जाँच करता है (परिणाम console में log होते हैं)।
- **Check and Remove Duplicate Concept Notes**: configured **Concept Note Folder** के भीतर exact name matches, plurals, normalization और single-word containment के आधार पर संभावित duplicate notes पहचानता है, और उन्हें folder के बाहर की notes से तुलना करता है। तुलना का दायरा (यानी concept folder के बाहर किन notes की जाँच होगी) **पूरे vault**, **विशिष्ट included folders**, या **कुछ folders को छोड़कर बाकी सभी folders** पर सेट किया जा सकता है। यह कारणों और conflicting files के साथ विस्तृत सूची दिखाता है, फिर identified duplicates को system trash में ले जाने से पहले पुष्टि माँगता है। deletion के दौरान progress दिखाता है।
- **Batch Mermaid Fix**: उपयोगकर्ता-चयनित folder के भीतर सभी Markdown files पर Mermaid और LaTeX syntax corrections लागू करता है।
    - **Workflow Ready**: standalone utility के रूप में या custom one-click workflow button के एक step के रूप में उपयोग किया जा सकता है।
    - **Error Reporting**: `mermaid_error_{foldername}.md` रिपोर्ट बनाता है, जिसमें वे files सूचीबद्ध होती हैं जिनमें प्रोसेसिंग के बाद भी संभावित Mermaid errors मौजूद हैं।
    - **Move Error Files**: detected errors वाली files को वैकल्पिक रूप से manual review के लिए किसी specified folder में move करता है।
    - **Smart Detection**: fixes करने से पहले अब `mermaid.parse` का उपयोग करके syntax errors के लिए बुद्धिमानी से files की जाँच करता है, जिससे processing time बचता है और अनावश्यक edits से बचाव होता है।
    - **Safe Processing**: सुनिश्चित करता है कि syntax fixes केवल Mermaid code blocks पर लागू हों, जिससे Markdown tables या अन्य content में अनजाने परिवर्तन न हों। इसमें table syntax (जैसे `| :--- |`) को aggressive debug fixes से बचाने के लिए मजबूत safeguards शामिल हैं।
    - **Deep Debug Mode**: यदि पहली fix के बाद भी errors बने रहते हैं, तो advanced deep debug mode सक्रिय होता है। यह mode जटिल edge cases संभालता है, जिनमें शामिल हैं:
        - **Comment Integration**: trailing comments (जो `%` से शुरू होते हैं) को edge label में स्वचालित रूप से merge करता है (जैसे `A -- Label --> B; % Comment` -> `A -- "Label(Comment)" --> B;`)।
        - **Malformed Arrows**: quotes में समा गए arrows को ठीक करता है (जैसे `A -- "Label -->" B` -> `A -- "Label" --> B`)।
        - **Inline Subgraphs**: inline subgraph labels को edge labels में बदलता है।
        - **Reverse Arrow Fix**: non-standard `X <-- Y` arrows को `Y --> X` में बदलता है।
        - **Direction Keyword Fix**: सुनिश्चित करता है कि subgraphs के भीतर `direction` keyword lowercase में हो (जैसे `Direction TB` -> `direction TB`)।
        - **Comment Conversion**: `//` comments को edge labels में बदलता है (जैसे `A --> B; // Comment` -> `A -- "Comment" --> B;`)।
        - **Duplicate Label Fix**: repeated bracketed labels को सरल करता है (जैसे `Node["Label"]["Label"]` -> `Node["Label"]`)।
        - **Invalid Arrow Fix**: invalid arrow syntax `--|>` को standard `-->` में बदलता है।
        - **Robust Label & Note Handling**: special characters (जैसे `/`) वाले labels के लिए बेहतर handling और custom note syntax (`note for ...`) के लिए बेहतर support देता है, ताकि trailing brackets जैसी artifacts साफ़ तरीके से हट सकें।
        - **Advanced Fix Mode**: spaces, special characters या nested brackets वाले unquoted node labels के लिए robust fixes शामिल हैं (जैसे `Node[Label [Text]]` -> `Node["Label [Text]"]`), जिससे Stellar Evolution paths जैसे complex diagrams के साथ compatibility सुनिश्चित होती है। यह malformed edge labels (जैसे `--["Label["-->` को `-- "Label" -->`) भी ठीक करता है। साथ ही inline comments (`Consensus --> Adaptive; # Some advanced consensus` को `Consensus -- "Some advanced consensus" --> Adaptive`) में बदलता है और line endings पर incomplete quotes (`;"` को `"]`) भी ठीक करता है।
                        - **Note Conversion**: `note right/left of` और standalone `note :` comments को standard Mermaid node definitions और connections में स्वचालित रूप से बदलता है (जैसे `note right of A: text` -> `NoteA["Note: text"]` और इसे `A` से लिंक करता है), जिससे syntax errors रुकते हैं और layout बेहतर होता है। अब यह arrow links (`-->`) और solid links (`---`) दोनों का समर्थन करता है।
                        - **Extended Note Support**: `note for Node "Content"` और `note of Node "Content"` को standard linked note nodes (जैसे `NoteNode[" Content"]` को `Node` से लिंक करना) में बदलता है, जिससे user-extended syntax के साथ compatibility मिलती है।
                        - **Enhanced Note Correction**: multiple notes होने पर aliasing issues से बचने के लिए notes का sequential numbering (जैसे `Note1`, `Note2`) के साथ स्वचालित रूप से नाम बदलता है।                - **Parallelogram/Shape Fix**: malformed node shapes जैसे `[/["Label["/]` को standard `["Label"]` में सुधारता है, जिससे generated content के साथ compatibility बनी रहती है।
                        - **Standardize Pipe Labels**: pipes वाले edge labels को स्वचालित रूप से ठीक और standardize करता है, ताकि वे ठीक से quotes में रहें (जैसे `-->|Text|` -> `-->|"Text"|` और `-->|Math|^2|` -> `-->|"Math|^2"|`)।
        - **Misplaced Pipe Fix**: arrow से पहले दिखाई देने वाले गलत place किए गए edge labels को ठीक करता है (जैसे `>|"Label"| A --> B` -> `A -->|"Label"| B`)।
                - **Merge Double Labels**: एक ही edge पर जटिल double labels (जैसे `A -- Label1 -- Label2 --> B` या `A -- Label1 -- Label2 --- B`) को line breaks के साथ एक साफ़ label में बदलता है (`A -- "Label1<br>Label2" --> B`)।
                        - **Unquoted Label Fix**: उन node labels को quotes में डालता है जिनमें quotes, equals signs या mathematical operators जैसे संभावित समस्या वाले characters हों, लेकिन बाहरी quotes न हों (जैसे `Plot[Plot "A"]` -> `Plot["Plot "A""]`), जिससे render errors रोके जाते हैं।
                        - **Intermediate Node Fix**: उन edges को, जिनमें intermediate node definition होती है, दो अलग edges में विभाजित करता है (जैसे `A -- B[...] --> C` -> `A --> B[...]` और `B[...] --> C`), जिससे Mermaid syntax वैध रहती है।
                        - **Concatenated Label Fix**: उन node definitions को robust तरीके से ठीक करता है जहाँ ID label के साथ जुड़ी हो (जैसे `SubdivideSubdivide...` -> `Subdivide["Subdivide..."]`), चाहे उससे पहले pipe labels हों या duplication सटीक न हो, known node IDs के आधार पर validate करके।
                        - **Extract Specific Original Text**:    - settings में प्रश्नों की सूची परिभाषित करें।
                    - सक्रिय नोट से उन प्रश्नों का उत्तर देने वाले text segments को word-for-word निकालता है।
                    - **Merged Query Mode**: अधिक दक्षता के लिए सभी प्रश्नों को एक ही API call में प्रोसेस करने का विकल्प।
                    - **Translation**: आउटपुट में निकाले गए पाठ के अनुवाद शामिल करने का विकल्प।
                    - **Custom Output**: extracted text file के लिए configurable save path और filename suffix.- **LLM Connection Test**: सक्रिय प्रदाता की API settings सत्यापित करता है।

## इंस्टॉलेशन

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Obsidian Marketplace से (अनुशंसित)
1. Obsidian में **Settings** -> **Community plugins** खोलें।
2. सुनिश्चित करें कि "Restricted mode" **बंद** है।
3. **Browse** पर क्लिक करें और "Notemd" खोजें।
4. **Install** पर क्लिक करें।
5. इंस्टॉल होने के बाद **Enable** पर क्लिक करें।

### मैनुअल इंस्टॉलेशन
1. नवीनतम release assets को [GitHub Releases page](https://github.com/Jacobinwwey/obsidian-NotEMD/releases) से डाउनलोड करें। प्रत्येक release में reference के लिए `README.md` भी शामिल होता है, लेकिन मैनुअल इंस्टॉलेशन के लिए केवल `main.js`, `styles.css` और `manifest.json` की आवश्यकता होती है।
2. अपने Obsidian vault के configuration folder में जाएँ: `<YourVault>/.obsidian/plugins/`।
3. `notemd` नाम का नया folder बनाएँ।
4. `main.js`, `styles.css` और `manifest.json` को `notemd` folder में कॉपी करें।
5. Obsidian को पुनः आरंभ करें।
6. **Settings** -> **Community plugins** पर जाएँ और "Notemd" सक्षम करें।

## कॉन्फ़िगरेशन

प्लगइन settings तक पहुँच:
**Settings** -> **Community Plugins** -> **Notemd** (गियर आइकन पर क्लिक करें)।

### LLM प्रदाता कॉन्फ़िगरेशन
1.  **सक्रिय प्रदाता**: dropdown menu से वह LLM provider चुनें जिसे आप उपयोग करना चाहते हैं।
2.  **प्रदाता सेटिंग्स**: चयनित provider के लिए विशिष्ट settings कॉन्फ़िगर करें:
    *   **API Key**: अधिकांश cloud providers के लिए आवश्यक (जैसे OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty)। Ollama के लिए आवश्यक नहीं। LM Studio और generic `OpenAI Compatible` preset के लिए वैकल्पिक है, यदि आपका endpoint anonymous या placeholder access स्वीकार करता है।
    *   **Base URL / Endpoint**: सेवा का API endpoint। डिफ़ॉल्ट मान दिए गए हैं, लेकिन local models (LMStudio, Ollama), gateways (OpenRouter, Requesty, OpenAI Compatible), या specific Azure deployments के लिए इसे बदलना पड़ सकता है। **Azure OpenAI के लिए आवश्यक।**
    *   **Model**: उपयोग किए जाने वाले विशिष्ट मॉडल का नाम/ID (जैसे `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`)। सुनिश्चित करें कि मॉडल आपके provider या endpoint पर उपलब्ध है।
    *   **Temperature**: LLM के आउटपुट की randomness नियंत्रित करता है (0 = deterministic, 1 = maximum creativity)। कम मान (जैसे 0.2-0.5) सामान्यतः structured tasks के लिए बेहतर होते हैं।
    *   **API Version (Azure Only)**: Azure OpenAI deployments के लिए आवश्यक (जैसे `2024-02-15-preview`)।
3.  **कनेक्शन जाँचें**: सक्रिय provider के लिए "कनेक्शन जाँचें" बटन का उपयोग करके अपनी settings सत्यापित करें। OpenAI-compatible providers अब provider-aware checks का उपयोग करते हैं: `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` और `OpenAI Compatible` जैसे endpoints सीधे `chat/completions` को probe करते हैं, जबकि विश्वसनीय `/models` endpoint वाले providers पहले model listing का उपयोग कर सकते हैं। यदि पहली probe `ERR_CONNECTION_CLOSED` जैसी transient network disconnect से विफल होती है, तो Notemd तुरंत विफल होने के बजाय automatic stable retry sequence पर चला जाता है।
4.  **प्रदाता कॉन्फ़िगरेशन प्रबंधित करें**: "Export Providers" और "Import Providers" बटन का उपयोग करके अपने LLM provider settings को plugin configuration directory के भीतर `notemd-providers.json` फ़ाइल में save/load करें। इससे backup और sharing आसान हो जाती है।
5.  **प्रीसेट कवरेज**: मूल providers के अतिरिक्त, Notemd अब `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` और LiteLLM, vLLM, Perplexity, Vercel AI Gateway या custom proxies के लिए generic `OpenAI Compatible` target शामिल करता है।
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### मल्टी-मॉडल कॉन्फ़िगरेशन
-   **कार्यों के लिए अलग-अलग प्रदाताओं का उपयोग करें**:
    *   **अक्षम (डिफ़ॉल्ट)**: सभी कार्यों के लिए ऊपर चुने गए एक ही "सक्रिय प्रदाता" का उपयोग करता है।
    *   **सक्षम**: आपको प्रत्येक कार्य ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts") के लिए अलग provider चुनने और वैकल्पिक रूप से model name override करने देता है। यदि किसी task का model override field खाली छोड़ा जाता है, तो उस task के चयनित provider का डिफ़ॉल्ट मॉडल उपयोग होगा।
-   **अलग-अलग कार्यों के लिए अलग-अलग भाषाएँ चुनें**:
    *   **अक्षम (डिफ़ॉल्ट)**: सभी कार्यों के लिए एक ही आउटपुट भाषा उपयोग करता है।
    *   **सक्षम**: आपको प्रत्येक कार्य ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts") के लिए अलग भाषा चुनने देता है।

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### भाषा आर्किटेक्चर (इंटरफ़ेस भाषा बनाम कार्य आउटपुट भाषा)

-   **इंटरफ़ेस भाषा** केवल प्लगइन इंटरफ़ेस टेक्स्ट (सेटिंग्स लेबल, साइडबार बटन, नोटिस और डायलॉग) को नियंत्रित करता है। डिफ़ॉल्ट `auto` mode Obsidian की वर्तमान UI भाषा का अनुसरण करता है।
-   क्षेत्रीय या लिपि-आधारित variants अब सीधे अंग्रेज़ी पर fallback होने के बजाय सबसे निकट के प्रकाशित catalog से map होते हैं। उदाहरण के लिए, `fr-CA` फ़्रेंच, `es-419` स्पेनिश, `pt-PT` पुर्तगाली, `zh-Hans` सरलीकृत चीनी और `zh-Hant-HK` पारंपरिक चीनी का उपयोग करता है।
-   **कार्य आउटपुट भाषा** मॉडल द्वारा उत्पन्न task output (लिंक, सारांश, title generation, Mermaid summary, concept extraction, translation target) को नियंत्रित करता है।
-   **Per-task language mode** प्रत्येक task को scattered per-module overrides के बजाय unified policy layer से अपनी output language निर्धारित करने देता है।
-   **स्वचालित अनुवाद अक्षम करें** गैर-`Translate` कार्यों को source-language context में रखता है, जबकि explicit `Translate` कार्य अभी भी configured target language लागू करते हैं।
-   Mermaid-संबंधित generation paths भी उसी language policy का पालन करती हैं और सक्षम होने पर Mermaid auto-fix चालू कर सकती हैं।

### स्थिर API कॉल सेटिंग्स
-   **स्थिर API कॉल सक्षम करें (रीट्राइ लॉजिक)**:
    *   **अक्षम (डिफ़ॉल्ट)**: एक API call failure वर्तमान task को रोक देगा।
    *   **सक्षम**: विफल LLM API calls को स्वचालित रूप से retry करता है (intermittent network issues या rate limits के लिए उपयोगी)।
    *   **Connection Test Fallback**: जब सामान्य calls अभी stable mode में न भी चल रही हों, provider connection tests अब पहली transient network failure के बाद उसी retry sequence पर स्विच करती हैं।
    *   **Runtime Transport Fallback (Environment-Aware)**: लंबे चलने वाले task requests जो `requestUrl` द्वारा transiently drop हो जाते हैं, अब पहले environment-aware fallback के माध्यम से उसी attempt को retry करते हैं। Desktop builds Node `http/https` का उपयोग करती हैं, non-desktop environments browser `fetch` का। ये fallback attempts अब built-in LLM paths पर protocol-aware streaming parsing का उपयोग करती हैं, जिसमें OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE और Ollama NDJSON output शामिल हैं, ताकि धीमे gateways जल्दी body chunks लौटाएँ। बाकी direct OpenAI-style provider entrypoints भी यही shared fallback path reuse करते हैं।
    *   **OpenAI-Compatible Stable Order**: stable mode में प्रत्येक OpenAI-compatible attempt अब `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` क्रम का पालन करती है, फिर ही उसे failed attempt के रूप में गिना जाता है। इससे केवल एक transport mode के flaky होने पर अत्यधिक aggressive failures नहीं होतीं।
-   **Retry Interval (seconds)**: (केवल enabled होने पर दिखाई देता है) retry attempts के बीच प्रतीक्षा समय (1-300 seconds)। डिफ़ॉल्ट: 5।
-   **Maximum Retries**: (केवल enabled होने पर दिखाई देता है) retry attempts की अधिकतम संख्या (0-10)। डिफ़ॉल्ट: 3।
-   **API त्रुटि डीबग मोड**:
    *   **अक्षम (डिफ़ॉल्ट)**: मानक, संक्षिप्त error reporting का उपयोग करता है।
    *   **सक्षम**: सभी providers और tasks (Translate, Search और Connection Tests सहित) के लिए विस्तृत error logging सक्रिय करता है (DeepSeek के verbose output के समान)। इसमें HTTP status codes, raw response text, request transport timelines, sanitized request URLs और headers, elapsed attempt durations, response headers, partial response bodies, parsed partial stream output और स्टैक ट्रेस शामिल हैं, जो API connection issues और upstream gateway resets की troubleshooting के लिए महत्वपूर्ण हैं।
-   **Developer Mode**:
    *   **अक्षम (डिफ़ॉल्ट)**: सभी developer-only diagnostic controls को सामान्य उपयोगकर्ताओं से छुपाता है।
    *   **सक्षम**: Settings में समर्पित developer diagnostics panel दिखाता है।
-   **Developer Provider Diagnostic (Long Request)**:
    *   **Diagnostic Call Mode**: प्रत्येक probe के लिए runtime path चुनें। OpenAI-compatible providers runtime modes के अतिरिक्त forced modes (`direct streaming`, `direct buffered`, `requestUrl-only`) का भी समर्थन करते हैं।
    *   **Run Diagnostic**: चयनित call mode के साथ एक long-request probe चलाता है और vault root में `Notemd_Provider_Diagnostic_*.txt` लिखता है।
    *   **Run Stability Test**: चयनित call mode के साथ configurable runs (1-10) के लिए probe दोहराता है और aggregated stability report सहेजता है।
    *   **Diagnostic Timeout**: प्रति-run configurable timeout (15-3600 seconds)।
    *   **Why Use It**: तब manual reproduction से तेज़ है जब कोई provider "Test connection" पास कर लेता है लेकिन वास्तविक long-running tasks (जैसे धीमे gateways पर translation) में विफल हो जाता है।
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### सामान्य सेटिंग्स

#### संसाधित फ़ाइल आउटपुट
-   **Customize Processed File Save Path**:
    *   **अक्षम (डिफ़ॉल्ट)**: processed files (जैसे `YourNote_processed.md`) मूल नोट के *उसी folder* में सहेजी जाती हैं।
    *   **सक्षम**: आपको custom save location निर्दिष्ट करने देता है।
-   **Processed File Folder Path**: (केवल तब दिखाई देता है जब ऊपर वाला विकल्प enabled हो) अपने vault के भीतर एक *relative path* दर्ज करें (जैसे `Processed Notes` या `Output/LLM`) जहाँ processed files सहेजी जाएँ। यदि folders मौजूद न हों तो बनाए जाएँगे। **Absolute paths (जैसे C:\...) या invalid characters का उपयोग न करें।**
-   **Use Custom Output Filename for 'Add Links'**:
    *   **अक्षम (डिफ़ॉल्ट)**: 'Add Links' command द्वारा बनाई गई processed files डिफ़ॉल्ट `_processed.md` suffix का उपयोग करती हैं (जैसे `YourNote_processed.md`)।
    *   **सक्षम**: आपको नीचे दी गई setting के माध्यम से output filename अनुकूलित करने देता है।
-   **Custom Suffix/Replacement String**: (केवल ऊपर वाला विकल्प enabled होने पर दिखाई देता है) output filename के लिए उपयोग होने वाला string दर्ज करें।
    *   यदि इसे **खाली** छोड़ा जाता है, तो मूल फ़ाइल processed content के साथ **overwrite** हो जाएगी।
    *   यदि आप कोई string दर्ज करते हैं (जैसे `_linked`), तो वह मूल base name में जोड़ा जाएगा (जैसे `YourNote_linked.md`)। सुनिश्चित करें कि suffix में invalid filename characters न हों।

-   **Remove Code Fences on Add Links**:
    *   **अक्षम (डिफ़ॉल्ट)**: link जोड़ते समय code fences **(\`\\\`\`)** content में रखे जाते हैं, और **(\`\\\`markdown)** अपने आप हटाया जाता है।
    *   **सक्षम**: link जोड़ने से पहले content से code fences हटा देता है।
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### कॉन्सेप्ट नोट आउटपुट
-   **Customize Concept Note Path**:
    *   **अक्षम (डिफ़ॉल्ट)**: `[[linked concepts]]` के लिए notes का automatic creation अक्षम रहता है।
    *   **सक्षम**: आपको वह folder निर्दिष्ट करने देता है जहाँ नई concept notes बनाई जाएँगी।
-   **Concept Note Folder Path**: (केवल तब दिखाई देता है जब ऊपर वाला विकल्प enabled हो) अपने vault के भीतर एक *relative path* दर्ज करें (जैसे `Concepts` या `Generated/Topics`) जहाँ नई concept notes सहेजी जाएँ। यदि folders मौजूद न हों तो बनाए जाएँगे। **यदि customization enabled है तो यह भरना आवश्यक है।** **Absolute paths या invalid characters का उपयोग न करें।**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### कॉन्सेप्ट लॉग फ़ाइल आउटपुट
-   **Generate Concept Log File**:
    *   **अक्षम (डिफ़ॉल्ट)**: कोई log file नहीं बनाई जाती।
    *   **सक्षम**: प्रोसेसिंग के बाद नई concept notes सूचीबद्ध करने वाली log file बनाता है। प्रारूप इस प्रकार है:
        ```
        xx अवधारणा md फ़ाइलें बनाएँ
        1. concepts1
        2. concepts2
        ...
        n. conceptsn
        ```
-   **Customize Log File Save Path**: (केवल तब दिखाई देता है जब "Generate Concept Log File" enabled हो)
    *   **अक्षम (डिफ़ॉल्ट)**: log file **Concept Note Folder Path** में (यदि निर्दिष्ट हो) या अन्यथा vault root में सहेजी जाती है।
    *   **सक्षम**: आपको log file के लिए custom folder निर्दिष्ट करने देता है।
-   **Concept Log Folder Path**: (केवल तब दिखाई देता है जब "Customize Log File Save Path" enabled हो) अपने vault के भीतर एक *relative path* दर्ज करें (जैसे `Logs/Notemd`) जहाँ log file सहेजी जानी चाहिए। **Customization enabled होने पर यह आवश्यक है।**
-   **Customize Log File Name**: (केवल तब दिखाई देता है जब "Generate Concept Log File" enabled हो)
    *   **अक्षम (डिफ़ॉल्ट)**: log file का नाम `Generate.log` होता है।
    *   **सक्षम**: आपको log file के लिए custom name निर्दिष्ट करने देता है।
-   **Concept Log File Name**: (केवल तब दिखाई देता है जब "Customize Log File Name" enabled हो) इच्छित filename दर्ज करें (जैसे `ConceptCreation.log`)। **Customization enabled होने पर यह आवश्यक है।**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### कॉन्सेप्ट निष्कर्षण कार्य
-   **न्यूनतम कॉन्सेप्ट नोट्स बनाएं**:
    *   **On (Default)**: नई concept notes केवल शीर्षक रखेंगी (जैसे `# Concept`)।
    *   **Off**: concept notes अतिरिक्त सामग्री रख सकती हैं, जैसे "Linked From" backlink, यदि नीचे की setting इसे अक्षम न करती हो।
-   **Add "Linked From" backlink**:
    *   **Off (Default)**: extraction के दौरान concept note में source document का backlink नहीं जोड़ता।
    *   **On**: source file के backlink के साथ "Linked From" section जोड़ता है।

#### विशिष्ट मूल पाठ निष्कर्षण
-   **Questions for extraction**: उन प्रश्नों की सूची (प्रति पंक्ति एक) दर्ज करें जिनके लिए आप चाहते हैं कि AI आपकी notes से शब्दशः उत्तर निकाले।
-   **Translate output to corresponding language**:
    *   **Off (Default)**: केवल निकाला गया पाठ उसकी मूल भाषा में आउटपुट करता है।
    *   **On**: इस task के लिए चयनित भाषा में निकाले गए पाठ का अनुवाद जोड़ता है।
-   **Merged query mode**:
    *   **Off**: प्रत्येक प्रश्न को अलग-अलग प्रोसेस करता है (अधिक सटीकता लेकिन अधिक API calls)।
    *   **On**: सभी प्रश्नों को एक ही prompt में भेजता है (तेज़ और कम API calls)।
-   **Customise extracted text save path & filename**:
    *   **Off**: मूल फ़ाइल के उसी folder में `_Extracted` suffix के साथ सहेजता है।
    *   **On**: custom output folder और filename suffix निर्दिष्ट करने देता है।

#### बैच Mermaid सुधार
-   **Enable Mermaid Error Detection**:
    *   **Off (Default)**: प्रोसेसिंग के बाद error detection छोड़ दी जाती है।
    *   **On**: processed files को शेष Mermaid syntax errors के लिए स्कैन करता है और `mermaid_error_{foldername}.md` रिपोर्ट बनाता है।
-   **Move files with Mermaid errors to specified folder**:
    *   **Off**: errors वाली files वहीं रहती हैं।
    *   **On**: fix attempt के बाद भी Mermaid syntax errors रखने वाली files को manual review के लिए समर्पित folder में move कर देता है।
-   **Mermaid error folder path**: (ऊपर enabled होने पर दिखाई देता है) वह folder जहाँ error files move की जाएँगी।

#### प्रसंस्करण पैरामीटर
-   **Enable Batch Parallelism**:
    *   **अक्षम (डिफ़ॉल्ट)**: batch processing tasks (जैसे "Process Folder" या "Batch Generate from Titles") files को एक-एक करके (serially) प्रोसेस करते हैं।
    *   **सक्षम**: प्लगइन को कई files एक साथ प्रोसेस करने देता है, जिससे बड़े batch jobs तेज़ हो सकते हैं।
-   **Batch Concurrency**: (केवल parallelism enabled होने पर दिखाई देता है) समानांतर रूप से प्रोसेस की जाने वाली files की अधिकतम संख्या सेट करता है। अधिक संख्या तेज़ हो सकती है, लेकिन अधिक संसाधन उपयोग करती है और API rate limits तक पहुँच सकती है। (Default: 1, Range: 1-20)
-   **Batch Size**: (केवल parallelism enabled होने पर दिखाई देता है) एक batch में समूहित files की संख्या। (Default: 50, Range: 10-200)
-   **Delay Between Batches (ms)**: (केवल parallelism enabled होने पर दिखाई देता है) प्रत्येक batch के बीच optional delay milliseconds में, जो API rate limits प्रबंधित करने में सहायक हो सकती है। (Default: 1000ms)
-   **API Call Interval (ms)**: प्रत्येक individual LLM API call के *पहले और बाद* milliseconds में न्यूनतम delay। low-rate APIs या 429 errors रोकने के लिए महत्वपूर्ण। किसी artificial delay के बिना 0 पर सेट करें। (Default: 500ms)
-   **Chunk Word Count**: LLM को भेजे जाने वाले प्रति chunk अधिकतम शब्द। बड़ी files के लिए API calls की संख्या को प्रभावित करता है। (Default: 3000)
-   **Enable Duplicate Detection**: processed content में duplicate words की बुनियादी जाँच को toggle करता है (परिणाम console में)। (डिफ़ॉल्ट: सक्षम)
-   **Max Tokens**: प्रति response chunk LLM द्वारा उत्पन्न किए जाने वाले अधिकतम tokens। यह cost और detail दोनों को प्रभावित करता है। (Default: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### अनुवाद
-   **Default Target Language**: वह डिफ़ॉल्ट भाषा चुनें जिसमें आप अपनी notes का अनुवाद करना चाहते हैं। Translation command चलाते समय इसे UI से override किया जा सकता है। (Default: English)
-   **Customise Translation File Save Path**:
    *   **अक्षम (डिफ़ॉल्ट)**: translated files मूल नोट के *उसी folder* में सहेजी जाती हैं।
    *   **सक्षम**: आपको अपने vault के भीतर एक *relative path* (जैसे `Translations`) निर्दिष्ट करने देता है जहाँ translated files सहेजी जाएँगी। यदि folders मौजूद न हों तो बनाए जाएँगे।
-   **Use custom suffix for translated files**:
    *   **अक्षम (डिफ़ॉल्ट)**: translated files डिफ़ॉल्ट `_translated.md` suffix का उपयोग करती हैं (जैसे `YourNote_translated.md`)।
    *   **सक्षम**: आपको custom suffix निर्दिष्ट करने देता है।
-   **Custom Suffix**: (केवल ऊपर वाला विकल्प enabled होने पर दिखाई देता है) translated filenames में जोड़ा जाने वाला custom suffix दर्ज करें (जैसे `_es` या `_fr`)।
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### सामग्री निर्माण
-   **Enable Research in "Generate from Title"**:
    *   **अक्षम (डिफ़ॉल्ट)**: "Generate from Title" केवल title को input के रूप में उपयोग करता है।
    *   **सक्षम**: configured **Web Research Provider** का उपयोग करके web research करता है और निष्कर्षों को title-based generation के दौरान LLM के लिए context के रूप में शामिल करता है।
-   **Auto-run Mermaid Syntax Fix after Generation**:
    *   **सक्षम (डिफ़ॉल्ट)**: Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid और Translate जैसी Mermaid-संबंधित workflows के बाद Mermaid syntax-fixing pass स्वचालित रूप से चलाता है।
    *   **अक्षम**: generated Mermaid output को तब तक untouched छोड़ देता है जब तक आप `Batch Mermaid Fix` manually न चलाएँ या उसे किसी custom workflow में न जोड़ें।
-   **Output Language**: (नया) "Generate from Title" और "Batch Generate from Title" कार्यों के लिए इच्छित output language चुनें।
    *   **English (Default)**: prompts अंग्रेज़ी में प्रोसेस होते हैं और आउटपुट अंग्रेज़ी में आता है।
    *   **Other Languages**: LLM को निर्देश दिया जाता है कि वह reasoning अंग्रेज़ी में करे लेकिन अंतिम दस्तावेज़ आपके चुने हुए भाषा में प्रदान करे (जैसे Español, Français, 简体中文, 繁體中文, العربية, हिन्दी आदि)।
-   **Change Prompt Word**: (नया)
    *   **Change Prompt Word**: आपको किसी विशिष्ट task के लिए prompt word बदलने देता है।
    *   **Custom Prompt Word**: task के लिए अपनी custom prompt word दर्ज करें।
-   **Use Custom Output Folder for 'Generate from Title'**:
    *   **अक्षम (डिफ़ॉल्ट)**: सफलतापूर्वक generated files मूल folder के parent के सापेक्ष `[OriginalFolderName]_complete` नामक subfolder में ले जाई जाती हैं (या यदि मूल folder root था तो `Vault_complete`)।
    *   **सक्षम**: आपको उस subfolder के लिए custom name निर्दिष्ट करने देता है जहाँ complete files move की जाएँगी।
-   **Custom Output Folder Name**: (केवल ऊपर वाला विकल्प enabled होने पर दिखाई देता है) subfolder के लिए इच्छित नाम दर्ज करें (जैसे `Generated Content`, `_complete`)। Invalid characters की अनुमति नहीं है। खाली छोड़ने पर डिफ़ॉल्ट `_complete` होगा। यह folder मूल folder की parent directory के सापेक्ष बनाया जाता है।

#### एक-क्लिक वर्कफ़्लो बटन
-   **Visual Workflow Builder**: built-in actions से custom workflow buttons बनाएँ, बिना हाथ से DSL लिखे।
-   **Custom Workflow Buttons DSL**: advanced users सीधे workflow definition text को संपादित कर सकते हैं। Invalid DSL सुरक्षित रूप से default workflow पर वापस चला जाता है और sidebar/settings UI में चेतावनी दिखाता है।
-   **Workflow Error Strategy**:
    *   **Stop on Error (Default)**: किसी step के विफल होते ही workflow को तुरंत रोक देता है।
    *   **Continue on Error**: बाद के steps चलाता रहता है और अंत में failed actions की संख्या रिपोर्ट करता है।
-   **Default Workflow Included**: `One-Click Extract` `Process File (Add Links)`, `Batch Generate from Titles` और `Batch Mermaid Fix` को जोड़ता है।

#### कस्टम प्रॉम्प्ट सेटिंग्स
यह सुविधा आपको विशिष्ट tasks के लिए LLM को भेजे जाने वाले default prompts को override करने देती है, जिससे आप output पर सूक्ष्म नियंत्रण प्राप्त करते हैं।

-   **Enable Custom Prompts for Specific Tasks**:
    *   **अक्षम (डिफ़ॉल्ट)**: प्लगइन सभी operations के लिए built-in default prompts का उपयोग करता है।
    *   **सक्षम**: नीचे सूचीबद्ध tasks के लिए custom prompts सेट करने की क्षमता सक्रिय करता है। यह इस feature का master switch है।

-   **Use Custom Prompt for [Task Name]**: (केवल ऊपर वाला विकल्प enabled होने पर दिखाई देता है)
    *   प्रत्येक समर्थित task ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts") के लिए आप अपने custom prompt को अलग-अलग enabled या disabled कर सकते हैं।
    *   **Disabled**: यह task default prompt का उपयोग करेगा।
    *   **सक्षम**: यह task नीचे दिए गए corresponding "Custom Prompt" text area में आपके द्वारा प्रदान किए गए पाठ का उपयोग करेगा।

-   **Custom Prompt Text Area**: (केवल तब दिखाई देता है जब task का custom prompt enabled हो)
    *   **Default Prompt Display**: संदर्भ के लिए, प्लगइन वह default prompt दिखाता है जिसे वह सामान्यतः task के लिए उपयोग करता। आप **"Copy Default Prompt"** बटन का उपयोग करके इसे अपने custom prompt के लिए starting point के रूप में कॉपी कर सकते हैं।
    *   **Custom Prompt Input**: यहाँ आप LLM के लिए अपनी instructions लिखते हैं।
    *   **Placeholders**: आप अपने prompt में special placeholders का उपयोग कर सकते हैं (और करना चाहिए), जिन्हें प्लगइन request भेजने से पहले वास्तविक content से बदल देगा। प्रत्येक task के लिए उपलब्ध placeholders देखने हेतु default prompt देखें। सामान्य placeholders में शामिल हैं:
        *   `{TITLE}`: वर्तमान नोट का शीर्षक।
        *   `{RESEARCH_CONTEXT_SECTION}`: वेब शोध से एकत्रित सामग्री।
        *   `{USER_PROMPT}`: प्रोसेस की जा रही नोट की सामग्री।

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### डुप्लिकेट जाँच का दायरा
-   **Duplicate Check Scope Mode**: नियंत्रित करता है कि आपके Concept Note Folder की notes के मुकाबले कौन-सी files संभावित duplicates के लिए जाँची जाएँगी।
    *   **Entire Vault (Default)**: concept notes की तुलना vault की अन्य सभी notes से करता है (Concept Note Folder स्वयं छोड़कर)।
    *   **Include Specific Folders Only**: concept notes की तुलना केवल नीचे सूचीबद्ध folders की notes से करता है।
    *   **Exclude Specific Folders**: concept notes की तुलना उन सभी notes से करता है जो नीचे सूचीबद्ध folders *में नहीं* हैं (और Concept Note Folder को भी छोड़कर)।
    *   **Concept Folder Only**: concept notes की तुलना केवल *Concept Note Folder के भीतर की अन्य notes* से करता है। इससे generated concepts के भीतर duplicates ढूँढने में मदद मिलती है।
-   **Include/Exclude Folders**: (केवल तब दिखाई देता है जब mode `Include` या `Exclude` हो) उन folders के *relative paths* दर्ज करें जिन्हें आप शामिल या बाहर करना चाहते हैं, **प्रति पंक्ति एक path**। Paths case-sensitive हैं और `/` separator का उपयोग करती हैं (जैसे `Reference Material/Papers` या `Daily Notes`)। ये folders Concept Note Folder के समान या उसके भीतर नहीं हो सकते।

#### वेब अनुसंधान प्रदाता
-   **Search Provider**: `Tavily` (API key आवश्यक, अनुशंसित) और `DuckDuckGo` (प्रायोगिक, खोज इंजन द्वारा automated requests के लिए अक्सर blocked) के बीच चुनें। "Research & Summarize Topic" और वैकल्पिक रूप से "Generate from Title" के लिए उपयोग होता है।
-   **Tavily API Key**: (केवल तब दिखाई देता है जब Tavily चुना गया हो) [tavily.com](https://tavily.com/) से अपनी API key दर्ज करें।
-   **Tavily Max Results**: (केवल तब दिखाई देता है जब Tavily चुना गया हो) Tavily द्वारा लौटाए जाने वाले परिणामों की अधिकतम संख्या (1-20)। डिफ़ॉल्ट: 5।
-   **Tavily Search Depth**: (केवल तब दिखाई देता है जब Tavily चुना गया हो) `basic` (डिफ़ॉल्ट) या `advanced` चुनें। नोट: `advanced` बेहतर परिणाम देता है, लेकिन प्रति खोज 1 के बजाय 2 API credits खर्च करता है।
-   **DuckDuckGo Max Results**: (केवल तब दिखाई देता है जब DuckDuckGo चुना गया हो) parse किए जाने वाले खोज परिणामों की अधिकतम संख्या (1-10)। डिफ़ॉल्ट: 5।
-   **DuckDuckGo Content Fetch Timeout**: (केवल तब दिखाई देता है जब DuckDuckGo चुना गया हो) प्रत्येक DuckDuckGo result URL से content fetch करते समय अधिकतम प्रतीक्षा समय seconds में। डिफ़ॉल्ट: 15।
-   **Max Research Content Tokens**: summarization prompt में शामिल किए जाने वाले combined web research results (snippets/fetched content) से लगभग अधिकतम tokens। यह context window size और cost प्रबंधन में मदद करता है। (Default: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### केंद्रित सीखने का क्षेत्र
-   **Enable Focused Learning Domain**:
    *   **अक्षम (डिफ़ॉल्ट)**: LLM को भेजे जाने वाले prompts मानक, सामान्य-उद्देश्य निर्देशों का उपयोग करते हैं।
    *   **सक्षम**: आपको एक या अधिक अध्ययन क्षेत्रों को निर्दिष्ट करने देता है ताकि LLM की contextual understanding सुधर सके।
-   **Learning Domain**: (केवल तब दिखाई देता है जब ऊपर वाला विकल्प enabled हो) अपना विशिष्ट क्षेत्र/क्षेत्र दर्ज करें, जैसे 'Materials Science', 'Polymer Physics', 'Machine Learning'। इससे prompts की शुरुआत में "Relevant Fields: [...]" पंक्ति जुड़ती है, जिससे LLM आपके अध्ययन क्षेत्र के लिए अधिक सटीक और अधिक प्रासंगिक links और content बना पाता है।
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## उपयोग गाइड

### त्वरित वर्कफ़्लो और साइडबार

-   मुख्य प्रोसेसिंग, जनरेशन, अनुवाद, ज्ञान और utility actions के समूहित सेक्शनों तक पहुँचने के लिए Notemd sidebar खोलें।
-   custom multi-step buttons लॉन्च करने के लिए sidebar के शीर्ष पर **त्वरित वर्कफ़्लो** क्षेत्र का उपयोग करें।
-   डिफ़ॉल्ट **One-Click Extract** workflow `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix` चलाता है।
-   workflow progress, per-step logs और failures sidebar में दिखते हैं, और pinned footer यह सुनिश्चित करता है कि progress bar और log area expanded sections द्वारा दब न जाएँ।
-   progress card status text, percentage pill और remaining time को एक नज़र में पढ़ने योग्य रखता है, और वही custom workflows settings से दोबारा कॉन्फ़िगर की जा सकती हैं।

### मूल प्रसंस्करण (wiki-links जोड़ना)
यह मुख्य कार्यक्षमता है जो concepts की पहचान करने और `[[wiki-links]]` जोड़ने पर केंद्रित है।

**महत्वपूर्ण:** यह प्रक्रिया केवल `.md` या `.txt` फ़ाइलों पर काम करती है। आप आगे की प्रोसेसिंग से पहले [Mineru](https://github.com/opendatalab/MinerU) का उपयोग करके PDF files को मुफ़्त में MD files में बदल सकते हैं।

1.  **साइडबार का उपयोग**:
    *   Notemd Sidebar खोलें (वैंड आइकन या कमांड पैलेट)।
    *   `.md` या `.txt` फ़ाइल खोलें।
    *   **"Process File (Add Links)"** पर क्लिक करें।
    *   किसी folder को प्रोसेस करने के लिए: **"Process Folder (Add Links)"** पर क्लिक करें, folder चुनें, और "Process" पर क्लिक करें।
    *   प्रगति sidebar में दिखाई जाती है। आप sidebar में "Cancel Processing" बटन का उपयोग करके task cancel कर सकते हैं।
    *   *Folder processing के लिए नोट:* files editor में खोले बिना background में प्रोसेस की जाती हैं।

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Command Palette का उपयोग** (`Ctrl+P` या `Cmd+P`):
    *   **Single File**: फ़ाइल खोलें और `Notemd: Process Current File` चलाएँ।
    *   **Folder**: `Notemd: Process Folder` चलाएँ, फिर folder चुनें। files editor में खोले बिना background में प्रोसेस होती हैं।
    *   कमांड पैलेट actions के लिए एक progress modal दिखाई देता है, जिसमें cancel button शामिल होता है।
    *   *नोट:* plugin सेव करने से पहले final processed content में पाए जाने पर शुरुआती `\boxed{` और अंतिम `}` lines को स्वचालित रूप से हटा देता है।

### नई सुविधाएँ

1.  **Mermaid आरेख के रूप में सारांशित करें**:
    *   वह नोट खोलें जिसे आप summarize करना चाहते हैं।
    *   `Notemd: Summarise as Mermaid diagram` command चलाएँ (कमांड पैलेट या sidebar button के माध्यम से)।
    *   plugin Mermaid diagram के साथ एक नई note बनाएगा।

2.  **Translate Note/Selection**:
    *   किसी note में text चुनें ताकि केवल उसी selection का अनुवाद हो, या बिना selection के command चलाकर पूरी note का अनुवाद करें।
    *   `Notemd: Translate Note/Selection` command चलाएँ (कमांड पैलेट या sidebar button के माध्यम से)।
    *   एक modal प्रकट होगा जो आपको **Target Language** की पुष्टि या परिवर्तन करने देगा (डिफ़ॉल्ट रूप से Configuration में निर्दिष्ट मान के साथ)।
    *   plugin अनुवाद करने के लिए configured **LLM Provider** (Multi-Model settings के आधार पर) का उपयोग करता है।
    *   translated content configured **Translation Save Path** में उचित suffix के साथ सहेजी जाती है, और आसान तुलना के लिए **मूल सामग्री के दाईं ओर एक नए pane में** खोली जाती है।
    *   आप इस task को sidebar button या modal cancel button के माध्यम से cancel कर सकते हैं।
3.  **बैच अनुवाद**:
    *   कमांड पैलेट से `Notemd: Batch Translate Folder` चलाएँ और folder चुनें, या file explorer में किसी folder पर right-click करके "Batch translate this folder" चुनें।
    *   plugin चयनित folder के सभी Markdown files का अनुवाद करेगा।
    *   translated files configured translation path में सहेजी जाती हैं लेकिन स्वचालित रूप से नहीं खुलतीं।
    *   यह प्रक्रिया progress modal के माध्यम से cancel की जा सकती है।

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Research & Summarize Topic**:
    *   किसी note में text चुनें या सुनिश्चित करें कि note का शीर्षक हो (यही search topic बनेगा)।
    *   `Notemd: Research and Summarize Topic` command चलाएँ (कमांड पैलेट या sidebar button के माध्यम से)।
    *   plugin configured **Search Provider** (Tavily/DuckDuckGo) और उचित **LLM Provider** (Multi-Model settings के आधार पर) का उपयोग करके जानकारी खोजता और summarize करता है।
    *   summary वर्तमान note में append की जाती है।
    *   आप इस task को sidebar button या modal cancel button के माध्यम से cancel कर सकते हैं।
    *   *नोट:* DuckDuckGo searches bot detection के कारण विफल हो सकती हैं। Tavily अनुशंसित है।

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Generate Content from Title**:
    *   कोई note खोलें (यह खाली भी हो सकती है)।
    *   `Notemd: Generate Content from Title` command चलाएँ (कमांड पैलेट या sidebar button के माध्यम से)।
    *   plugin उपयुक्त **LLM Provider** (Multi-Model settings के आधार पर) का उपयोग करके note के title के आधार पर content उत्पन्न करता है, और मौजूदा content को replace कर देता है।
    *   यदि **"Enable Research in 'Generate from Title'"** setting enabled है, तो पहले web research की जाएगी (configured **Web Research Provider** का उपयोग करके) और वही context LLM को भेजे गए prompt में शामिल होगा।
    *   आप इस task को sidebar button या modal cancel button के माध्यम से cancel कर सकते हैं।

5.  **Batch Generate Content from Titles**:
    *   `Notemd: Batch Generate Content from Titles` command चलाएँ (कमांड पैलेट या sidebar button के माध्यम से)।
    *   वह folder चुनें जिसमें वे notes हों जिन्हें आप प्रोसेस करना चाहते हैं।
    *   plugin folder की प्रत्येक `.md` फ़ाइल पर iterate करेगा ( `_processed.md` files और निर्दिष्ट "complete" folder की files को छोड़कर), note title के आधार पर content उत्पन्न करेगा और मौजूदा content बदल देगा। files editor में खोले बिना background में प्रोसेस होती हैं।
    *   सफलतापूर्वक प्रोसेस की गई files configured "complete" folder में move की जाती हैं।
    *   यह command प्रत्येक note के लिए **"Enable Research in 'Generate from Title'"** setting का सम्मान करती है।
    *   आप इस task को sidebar button या modal cancel button के माध्यम से cancel कर सकते हैं।
    *   प्रगति और परिणाम (संशोधित files की संख्या, errors) sidebar/modal log में दिखाई देते हैं।
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Check and Remove Duplicate Concept Notes**:
    *   सुनिश्चित करें कि **Concept Note Folder Path** settings में सही तरह से configured है।
    *   `Notemd: Check and Remove Duplicate Concept Notes` चलाएँ (कमांड पैलेट या sidebar button के माध्यम से)।
    *   plugin concept note folder को स्कैन करता है और exact match, plurals, normalization और containment जैसे कई नियमों से folder के बाहर की notes के साथ filenames की तुलना करता है।
    *   यदि संभावित duplicates मिलते हैं, तो एक modal window दिखाई देती है जिसमें files, flag होने का कारण और conflicting files सूचीबद्ध होती हैं।
    *   सूची की सावधानीपूर्वक समीक्षा करें। सूचीबद्ध files को system trash में ले जाने के लिए **"Delete Files"** पर क्लिक करें, या कोई कार्रवाई न करने के लिए **"Cancel"** पर क्लिक करें।
    *   प्रगति और परिणाम sidebar/modal log में दिखते हैं।

7.  **Extract Concepts (Pure Mode)**:
    *   यह सुविधा आपको किसी document से concepts निकालने और संबंधित concept notes *मूल फ़ाइल को बदले बिना* बनाने देती है। यह दस्तावेज़ों के एक सेट से आपकी ज्ञान-आधार को तेज़ी से भरने के लिए आदर्श है।
    *   **Single File**: कोई फ़ाइल खोलें और कमांड पैलेट से `Notemd: Extract concepts (create concept notes only)` चलाएँ, या sidebar में **"Extract concepts (current file)"** बटन पर क्लिक करें।
    *   **Folder**: कमांड पैलेट से `Notemd: Batch extract concepts from folder` चलाएँ, या sidebar में **"Extract concepts (folder)"** बटन पर क्लिक करें, और फिर वह folder चुनें जिसकी सभी notes को प्रोसेस करना है।
    *   plugin files पढ़ेगा, concepts पहचानेगा और आपके निर्दिष्ट **Concept Note Folder** में उनके लिए नई notes बनाएगा, जबकि आपकी मूल files को untouched छोड़ेगा।

8.  **Create Wiki-Link & Generate Note from Selection**:
    *   यह शक्तिशाली command नई concept notes बनाने और भरने की प्रक्रिया को सरल करती है।
    *   अपने editor में कोई शब्द या वाक्यांश चुनें।
    *   `Notemd: Create Wiki-Link & Generate Note from Selection` command चलाएँ (इस पर `Cmd+Shift+W` जैसी hotkey assign करना अनुशंसित है)।
    *   plugin:
        1.  आपके selected text को `[[wiki-link]]` से replace करेगा।
        2.  जाँच करेगा कि उसी title की note आपके **Concept Note Folder** में पहले से मौजूद है या नहीं।
        3.  यदि मौजूद है, तो वर्तमान note से backlink जोड़ देगा।
        4.  यदि नहीं है, तो नई खाली note बनाएगा।
        5.  फिर नई या मौजूदा note पर **"Generate Content from Title"** command स्वचालित रूप से चलाएगा और उसे AI-generated content से भर देगा।

9.  **Extract Concepts and Generate Titles**:
    *   यह command दो शक्तिशाली सुविधाओं को एक सरल workflow में जोड़ती है।
    *   कमांड पैलेट से `Notemd: Extract Concepts and Generate Titles` command चलाएँ (इसके लिए hotkey assign करना अनुशंसित है)।
    *   plugin:
        1.  पहले वर्तमान सक्रिय फ़ाइल पर **"Extract concepts (current file)"** task चलाएगा।
        2.  फिर settings में आपके **Concept note folder path** के रूप में configured folder पर **"Batch generate from titles"** task स्वचालित रूप से चलाएगा।
    *   इससे आप पहले source document से अपनी ज्ञान-आधार में नए concepts जोड़ सकते हैं और फिर तुरंत उन्हीं नए concept notes को AI-generated content से विस्तृत कर सकते हैं।

10. **Extract Specific Original Text**:
    *   "Extract Specific Original Text" के तहत settings में अपने प्रश्न कॉन्फ़िगर करें।
    *   सक्रिय फ़ाइल को प्रोसेस करने के लिए sidebar में "Extract Specific Original Text" बटन का उपयोग करें।
    *   **Merged Mode**: सभी प्रश्नों को एक prompt में भेजकर तेज़ प्रोसेसिंग सक्षम करता है।
    *   **Translation**: निकाले गए पाठ को आपकी configured भाषा में वैकल्पिक रूप से अनुवाद करता है।
    *   **Custom Output**: extracted file कहाँ और कैसे सहेजी जाए, इसे कॉन्फ़िगर करें।

11. **Batch Mermaid Fix**:
    *   किसी folder को स्कैन करने और सामान्य Mermaid syntax errors ठीक करने के लिए sidebar में "Batch Mermaid Fix" बटन का उपयोग करें।
    *   plugin उन files की रिपोर्ट `mermaid_error_{foldername}.md` फ़ाइल में करेगा जिनमें अभी भी errors मौजूद हैं।
    *   वैकल्पिक रूप से plugin को configure करें ताकि वह इन problematic files को review के लिए अलग folder में move कर सके।

## समर्थित LLM प्रदाता

| प्रदाता           | प्रकार      | API कुंजी आवश्यक       | नोट्स                                                                  |
|-------------------|-------------|------------------------|------------------------------------------------------------------------|
| DeepSeek          | क्लाउड      | हाँ                    | reasoning-model handling के साथ native DeepSeek endpoint              |
| Qwen              | क्लाउड      | हाँ                    | Qwen / QwQ models के लिए DashScope compatible-mode preset             |
| Qwen Code         | क्लाउड      | हाँ                    | Qwen coder models के लिए DashScope coding-focused preset              |
| Doubao            | क्लाउड      | हाँ                    | Volcengine Ark preset; सामान्यतः model field को आपके endpoint ID पर सेट करें |
| Moonshot          | क्लाउड      | हाँ                    | आधिकारिक Kimi / Moonshot endpoint                                     |
| GLM               | क्लाउड      | हाँ                    | आधिकारिक Zhipu BigModel OpenAI-compatible endpoint                    |
| Z AI              | क्लाउड      | हाँ                    | अंतर्राष्ट्रीय GLM/Zhipu OpenAI-compatible endpoint; `GLM` का पूरक      |
| MiniMax           | क्लाउड      | हाँ                    | आधिकारिक MiniMax chat-completions endpoint                            |
| Huawei Cloud MaaS | क्लाउड      | हाँ                    | hosted models के लिए Huawei ModelArts MaaS OpenAI-compatible endpoint |
| Baidu Qianfan     | क्लाउड      | हाँ                    | ERNIE models के लिए आधिकारिक Qianfan OpenAI-compatible endpoint      |
| SiliconFlow       | क्लाउड      | हाँ                    | hosted OSS models के लिए आधिकारिक SiliconFlow OpenAI-compatible endpoint |
| OpenAI            | क्लाउड      | हाँ                    | GPT और o-series models का समर्थन                                      |
| Anthropic         | क्लाउड      | हाँ                    | Claude models का समर्थन                                                |
| Google            | क्लाउड      | हाँ                    | Gemini models का समर्थन                                                |
| Mistral           | क्लाउड      | हाँ                    | Mistral और Codestral families का समर्थन                               |
| Azure OpenAI      | क्लाउड      | हाँ                    | Endpoint, API Key, deployment name और API Version आवश्यक              |
| OpenRouter        | गेटवे       | हाँ                    | OpenRouter model IDs के माध्यम से कई providers तक पहुँच              |
| xAI               | क्लाउड      | हाँ                    | native Grok endpoint                                                   |
| Groq              | क्लाउड      | हाँ                    | hosted OSS models के लिए तेज़ OpenAI-compatible inference             |
| Together          | क्लाउड      | हाँ                    | hosted OSS models के लिए OpenAI-compatible endpoint                   |
| Fireworks         | क्लाउड      | हाँ                    | OpenAI-compatible inference endpoint                                   |
| Requesty          | गेटवे       | हाँ                    | एक API key के पीछे multi-provider router                             |
| OpenAI Compatible | गेटवे       | वैकल्पिक              | LiteLLM, vLLM, Perplexity, Vercel AI Gateway आदि के लिए generic preset |
| LMStudio          | लोकल        | वैकल्पिक (`EMPTY`)     | LM Studio server के माध्यम से स्थानीय रूप से models चलाता है         |
| Ollama            | लोकल        | नहीं                   | Ollama server के माध्यम से स्थानीय रूप से models चलाता है            |

*नोट: स्थानीय प्रदाताओं (LMStudio, Ollama) के लिए सुनिश्चित करें कि संबंधित server application चल रही हो और configured Base URL पर उपलब्ध हो।*
*नोट: OpenRouter और Requesty के लिए gateway द्वारा दिखाए गए provider-prefixed/full model identifier का उपयोग करें (उदाहरण `google/gemini-flash-1.5` या `anthropic/claude-3-7-sonnet-latest`)।*
*नोट: `Doubao` सामान्यतः model field में raw model family name के बजाय Ark endpoint/deployment ID अपेक्षित करता है। settings screen अब चेतावनी देती है जब placeholder value अभी भी मौजूद हो और वास्तविक endpoint ID से बदलने तक connection tests रोक देती है।*
*नोट: `Z AI` अंतर्राष्ट्रीय `api.z.ai` लाइन को लक्षित करता है, जबकि `GLM` मुख्यभूमि चीन BigModel endpoint बनाए रखता है। अपने account region से मेल खाने वाला preset चुनें।*
*नोट: China-focused presets chat-first connection checks का उपयोग करते हैं ताकि test वास्तविक configured model/deployment को validate करे, न कि केवल API-key reachability को।*
*नोट: `OpenAI Compatible` custom gateways और proxies के लिए अभिप्रेत है। Base URL, API key policy और model ID अपने provider के documentation के अनुसार सेट करें।*

## नेटवर्क उपयोग और डेटा प्रबंधन

Notemd स्थानीय रूप से Obsidian के अंदर चलता है, लेकिन कुछ सुविधाएँ बाहरी requests भेजती हैं।

### LLM प्रदाता कॉल (कॉन्फ़िगर करने योग्य)

- Trigger: file processing, generation, translation, research summarization, Mermaid summarization, और connection/diagnostic actions।
- Endpoint: Notemd settings में configured provider base URL(s)।
- भेजा गया डेटा: processing के लिए आवश्यक prompt text और task content।
- डेटा प्रबंधन नोट: API keys plugin settings में स्थानीय रूप से कॉन्फ़िगर की जाती हैं और आपके device से requests sign करने के लिए उपयोग होती हैं।

### वेब अनुसंधान कॉल (वैकल्पिक)

- Trigger: जब web research enabled हो और search provider चुना गया हो।
- Endpoint: Tavily API या DuckDuckGo endpoints।
- भेजा गया डेटा: आपका research query और आवश्यक request metadata।

### डेवलपर डायग्नॉस्टिक्स और डिबग लॉग (वैकल्पिक)

- Trigger: API debug mode और developer diagnostic actions।
- Storage: diagnostic और error logs आपके vault root में लिखे जाते हैं (जैसे `Notemd_Provider_Diagnostic_*.txt` और `Notemd_Error_Log_*.txt`)।
- जोखिम नोट: logs में request/response अंश हो सकते हैं। सार्वजनिक रूप से साझा करने से पहले logs की समीक्षा करें।

### स्थानीय संग्रहण

- plugin configuration `.obsidian/plugins/notemd/data.json` में संग्रहीत होती है।
- generated files, reports और optional logs आपकी settings के अनुसार आपके vault में संग्रहीत होते हैं।

## समस्या निवारण

### सामान्य समस्याएँ
-   **प्लगइन लोड नहीं हो रहा**: सुनिश्चित करें कि `manifest.json`, `main.js`, `styles.css` सही folder (`<Vault>/.obsidian/plugins/notemd/`) में हों और Obsidian पुनः आरंभ करें। startup errors के लिए Developer Console (`Ctrl+Shift+I` या `Cmd+Option+I`) जाँचें।
-   **प्रोसेसिंग विफलताएँ / API त्रुटियाँ**:
    1.  **फ़ाइल प्रारूप जाँचें**: सुनिश्चित करें कि जिस फ़ाइल को आप प्रोसेस या जाँचना चाहते हैं उसमें `.md` या `.txt` extension हो। Notemd वर्तमान में केवल इन्हीं text-based formats का समर्थन करता है।
    2.  सक्रिय provider की settings सत्यापित करने के लिए "Test LLM Connection" command/button का उपयोग करें।
    3.  API Key, Base URL, Model Name और API Version (Azure के लिए) दोबारा जाँचें। सुनिश्चित करें कि API key सही है और पर्याप्त credits/permissions रखती है।
    4.  सुनिश्चित करें कि आपका local LLM server (LMStudio, Ollama) चल रहा हो और Base URL सही हो (जैसे LMStudio के लिए `http://localhost:1234/v1`)।
    5.  cloud providers के लिए अपना internet connection जाँचें।
    6.  **Single file processing errors के लिए:** विस्तृत error messages के लिए Developer Console की समीक्षा करें। आवश्यकता हो तो error modal में दिए गए बटन से उन्हें कॉपी करें।
    7.  **Batch processing errors के लिए:** प्रत्येक विफल फ़ाइल के विस्तृत error messages के लिए vault root में `error_processing_filename.log` फ़ाइल जाँचें। Developer Console या error modal केवल summary या सामान्य batch error दिखा सकते हैं।
    8.  **स्वचालित त्रुटि लॉग:** यदि कोई प्रक्रिया विफल होती है, तो plugin स्वचालित रूप से `Notemd_Error_Log_[Timestamp].txt` नाम की विस्तृत log file आपके vault root directory में सहेजता है। इस फ़ाइल में error message, स्टैक ट्रेस और session logs होते हैं। यदि आपको लगातार समस्याएँ मिल रही हैं, तो इस फ़ाइल को जाँचें। settings में "API Error Debugging Mode" सक्षम करने से यह log और भी विस्तृत API response data से भर जाएगा।
    9.  **वास्तविक endpoint long-request diagnostics (डेवलपर)**:
        - In-plugin path (पहले अनुशंसित): सक्रिय provider पर runtime probe चलाने और vault root में `Notemd_Provider_Diagnostic_*.txt` बनाने के लिए **Settings -> Notemd -> Developer provider diagnostic (long request)** का उपयोग करें।
        - CLI path (Obsidian runtime के बाहर): buffered और streaming behavior की reproducible endpoint-level comparison के लिए उपयोग करें:
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
        generated report प्रति-प्रयास timing (`First Byte`, `Duration`), sanitized request metadata, response headers, raw/partial body fragments, parsed stream fragments और transport-layer failure points रखती है।
-   **LM Studio/Ollama connection issues**:
    *   **टेस्ट कनेक्शन विफल होता है**: सुनिश्चित करें कि local server (LM Studio या Ollama) चल रहा हो और सही model loaded/available हो।
    *   **CORS Errors (Windows पर Ollama)**: यदि Windows पर Ollama उपयोग करते समय CORS (Cross-Origin Resource Sharing) errors मिलती हैं, तो आपको `OLLAMA_ORIGINS` environment variable सेट करनी पड़ सकती है। Ollama शुरू करने से पहले command prompt में `set OLLAMA_ORIGINS=*` चलाकर ऐसा किया जा सकता है। इससे किसी भी origin से requests की अनुमति मिलती है।
    *   **Enable CORS in LM Studio**: LM Studio के लिए आप server settings में सीधे CORS सक्षम कर सकते हैं, जो आवश्यक हो सकता है यदि Obsidian browser में चल रहा हो या strict origin policies हों।
-   **फ़ोल्डर निर्माण त्रुटियाँ ("File name cannot contain...")**:
    *   इसका सामान्य अर्थ है कि settings में दिया गया path (**Processed File Folder Path** या **Concept Note Folder Path**) *Obsidian के लिए* invalid है।
    *   **सुनिश्चित करें कि आप relative paths का उपयोग कर रहे हैं** (जैसे `Processed`, `Notes/Concepts`) और **absolute paths का नहीं** (जैसे `C:\Users\...`, `/Users/...`)।
    *   invalid characters की जाँच करें: `* " \ / < > : | ? # ^ [ ]`। ध्यान दें कि Obsidian paths के लिए Windows पर भी `\` invalid है। Path separator के रूप में `/` उपयोग करें।
-   **प्रदर्शन समस्याएँ**: बड़ी फ़ाइलों या बहुत सी फ़ाइलों को प्रोसेस करने में समय लग सकता है। संभावित रूप से तेज़ (लेकिन अधिक) API calls के लिए "Chunk Word Count" setting कम करें। किसी अलग LLM provider या model को आज़माएँ।
-   **अप्रत्याशित लिंक-निर्माण**: लिंक-निर्माण की गुणवत्ता काफी हद तक LLM और prompt पर निर्भर करती है। अलग-अलग models या तापमान सेटिंग्स के साथ प्रयोग करें।

## योगदान

योगदानों का स्वागत है। दिशानिर्देशों के लिए GitHub repository देखें: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## मेंटेनर दस्तावेज़

- [रिलीज़ वर्कफ़्लो (अंग्रेज़ी)](./docs/maintainer/release-workflow.md)
- [रिलीज़ वर्कफ़्लो (सरलीकृत चीनी)](./docs/maintainer/release-workflow.zh-CN.md)

## लाइसेंस

MIT लाइसेंस - विवरण के लिए [LICENSE](LICENSE) फ़ाइल देखें।

---

*Notemd v1.8.1 - AI के साथ अपने Obsidian knowledge graph को बेहतर बनाएँ।*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
