![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# إضافة Notemd لـ Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

اقرأ الوثائق بلغات إضافية من: [مركز اللغات](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
  تعزيز قاعدة المعرفة متعددة اللغات بالذكاء الاصطناعي
==================================================
```

طريقة سهلة لبناء قاعدة المعرفة الخاصة بك.

يقوم Notemd بتوسيع سير العمل داخل Obsidian من خلال التكامل مع نماذج لغوية كبيرة متعددة (LLMs) لمعالجة ملاحظاتك متعددة اللغات، وإنشاء wiki-links تلقائيا للمفاهيم الأساسية، وإنشاء concept notes مقابلة، وإجراء بحث ويب وغير ذلك، بما يساعدك على بناء رسوم معرفية قوية.

**الإصدار:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## جدول المحتويات

- [البدء السريع](#البدء-السريع)
- [دعم اللغات](#دعم-اللغات)
- [الميزات](#الميزات)
- [التثبيت](#التثبيت)
- [الإعداد](#الإعداد)
- [دليل الاستخدام](#دليل-الاستخدام)
- [موفرو LLM المدعومون](#موفرو-llm-المدعومون)
- [استخدام الشبكة ومعالجة البيانات](#استخدام-الشبكة-ومعالجة-البيانات)
- [استكشاف الأخطاء وإصلاحها](#استكشاف-الأخطاء-وإصلاحها)
- [المساهمة](#المساهمة)
- [وثائق المشرف](#وثائق-المشرف)
- [الترخيص](#الترخيص)

## البدء السريع

1. **ثبّت وقم بالتفعيل**: احصل على الإضافة من Obsidian Marketplace.
2. **اضبط LLM**: انتقل إلى `Settings -> Notemd`، واختر مزود LLM الخاص بك، مثل OpenAI أو مزود محلي مثل Ollama، ثم أدخل API key أو URL.
3. **افتح الشريط الجانبي**: انقر على أيقونة العصا السحرية الخاصة بـ Notemd في الشريط الأيسر لفتح sidebar.
4. **عالج ملاحظة**: افتح أي ملاحظة واضغط **"Process File (Add Links)"** في الشريط الجانبي لإضافة `[[wiki-links]]` تلقائيا إلى المفاهيم الأساسية.
5. **شغّل Quick Workflow**: استخدم الزر الافتراضي **"One-Click Extract"** لربط المعالجة والتوليد والتنظيف الخاص بـ Mermaid من نقطة دخول واحدة.

هذا كل شيء. استكشف الإعدادات لفتح مزيد من الإمكانات مثل البحث على الويب والترجمة وتوليد المحتوى.

## دعم اللغات

### عقد سلوك اللغة

| الجانب | النطاق | الافتراضي | الملاحظات |
|---|---|---|---|
| `لغة الواجهة` | نص واجهة الإضافة فقط (الإعدادات، الشريط الجانبي، الإشعارات، الحوارات) | `auto` | يتبع لغة Obsidian الحالية؛ كتالوجات الواجهة الحالية هي `en` و `ar` و `de` و `es` و `fa` و `fr` و `id` و `it` و `ja` و `ko` و `nl` و `pl` و `pt` و `pt-BR` و `ru` و `th` و `tr` و `uk` و `vi` و `zh-CN` و `zh-TW`. |
| `لغة خرج المهام` | خرج المهام المولَّد بواسطة LLM (الروابط، الملخصات، التوليد، الاستخراج، وهدف الترجمة) | `en` | يمكن أن يكون عاما أو لكل مهمة عندما يتم تفعيل `استخدام لغات مختلفة للمهام`. |
| `تعطيل الترجمة التلقائية` | المهام غير الخاصة بالترجمة تحتفظ بسياق لغة المصدر | `false` | مهام `Translate` الصريحة تستمر في فرض اللغة الهدف المضبوطة. |
| اللغة الاحتياطية للواجهة | حل مفاتيح الواجهة الناقصة | locale -> `en` | يحافظ على استقرار الواجهة عندما تكون بعض المفاتيح غير مترجمة. |

- الوثائق المصدرية التي تتم صيانتها هي الإنجليزية والصينية المبسطة، وروابط ترجمات README المنشورة موجودة في الترويسة أعلاه.
- تغطية لغة الواجهة داخل التطبيق تطابق حالياً الكتالوج الصريح في الشيفرة تماماً: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- يظل الرجوع إلى الإنجليزية شبكة أمان على مستوى التنفيذ، لكن الأسطح المرئية المدعومة مغطاة باختبارات انحدار ولا ينبغي أن تعود بصمت إلى الإنجليزية أثناء الاستخدام العادي.
- تتبع التفاصيل الإضافية وإرشادات المساهمة في [مركز اللغات](./docs/i18n/README.md).

## الميزات

### معالجة المستندات بالذكاء الاصطناعي
- **دعم متعدد لمزودي LLM**: الاتصال بمزودي LLM السحابيين والمحليين المختلفين. راجع [موفرو LLM المدعومون](#موفرو-llm-المدعومون).
- **تقسيم ذكي إلى أجزاء**: تقسيم المستندات الكبيرة تلقائيا إلى chunks قابلة للإدارة بناء على عدد الكلمات.
- **الحفاظ على المحتوى**: يسعى للحفاظ على التنسيق الأصلي مع إضافة البنية والروابط.
- **تتبع التقدم**: تحديثات فورية عبر Notemd Sidebar أو progress modal.
- **عمليات قابلة للإلغاء**: يمكن إلغاء أي مهمة معالجة تبدأ من الشريط الجانبي بواسطة زر الإلغاء المخصص. أما أوامر Command Palette فتستخدم modal يمكن إلغاؤه كذلك.
- **تهيئة متعددة النماذج**: يمكنك استخدام مزودين مختلفين أو نماذج محددة لكل مهمة (Add Links و Research و Generate Title و Translate) أو مزود واحد لجميع المهام.
- **استدعاءات API مستقرة (منطق إعادة المحاولة)**: يمكنك اختيار تفعيل إعادة المحاولة تلقائيا عند فشل استدعاء LLM API مع إمكانية ضبط الفاصل الزمني وعدد المحاولات.
- **اختبارات اتصال أكثر صمودا**: إذا فشل أول اختبار اتصال للمزود بسبب انقطاع شبكي مؤقت، فإن Notemd ينتقل تلقائيا إلى تسلسل إعادة المحاولة المستقر قبل إعلان الفشل، ويغطي ذلك OpenAI-compatible و Anthropic و Google و Azure OpenAI و Ollama.
- **Fallback للنقل حسب بيئة التشغيل**: عندما يسقط طلب طويل إلى المزود داخل `requestUrl` بسبب أخطاء شبكية مؤقتة مثل `ERR_CONNECTION_CLOSED`، يعيد Notemd المحاولة نفسها عبر fallback transport يعتمد على البيئة: إصدارات سطح المكتب تستخدم Node `http/https`، والبيئات غير المكتبية تستخدم browser `fetch`. هذا يقلل الإخفاقات الكاذبة على البوابات البطيئة و reverse proxies.
- **تقوية سلسلة الطلبات الطويلة المستقرة لمزودي OpenAI-compatible**: في الوضع المستقر، تستخدم طلبات OpenAI-compatible ترتيبا صريحا من ثلاث مراحل لكل محاولة: direct streaming transport ثم direct non-stream transport ثم `requestUrl` fallback، والذي يستطيع الترقية إلى parsing متدفق عند الحاجة. هذا يخفض الإخفاقات الكاذبة عندما تكون استجابة المزود bufferized لكن أنابيب streaming غير مستقرة.
- **Fallback متدفق واعٍ بالبروتوكول عبر واجهات LLM المختلفة**: محاولات fallback الطويلة أصبحت تستخدم parsing متدفقا واعيا بالبروتوكول عبر جميع المسارات المدمجة، وليس فقط مع OpenAI-compatible. بات Notemd يتعامل مع OpenAI/Azure SSE، وAnthropic Messages streaming، وGoogle Gemini SSE، وOllama NDJSON على `http/https` المكتبي وكذلك `fetch` في البيئات غير المكتبية، كما تستفيد entrypoints الأخرى ذات النمط OpenAI من هذا المسار المشترك.
- **Presets مناسبة للبيئة الصينية**: تتضمن الإعدادات المسبقة الآن `Qwen` و `Qwen Code` و `Doubao` و `Moonshot` و `GLM` و `Z AI` و `MiniMax` و `Huawei Cloud MaaS` و `Baidu Qianfan` و `SiliconFlow`، إضافة إلى المزودين المحليين والعالميين الموجودين مسبقا.
- **معالجة دفعية موثوقة**: تم تحسين منطق المعالجة المتوازية مع **استدعاءات API متدرجة زمنيا** لتجنب rate limiting وضمان أداء ثابت أثناء الأعمال الدفعية الكبيرة. التنفيذ الجديد يجعل المهام تبدأ على فترات بدلا من الانطلاق دفعة واحدة.
- **عرض تقدم دقيق**: تم إصلاح مشكلة كانت تؤدي إلى تجمد شريط التقدم، بحيث يعكس الـ UI الآن الحالة الحقيقية للعملية.
- **معالجة دفعية متوازية أكثر متانة**: تم حل مشكلة كانت تؤدي إلى توقف العمليات الدفعية المتوازية مبكرا، مما يضمن معالجة جميع الملفات بشكل موثوق وفعّال.
- **دقة Progress Bar**: تم إصلاح خطأ كان يجعل شريط التقدم في أمر "Create Wiki-Link & Generate Note" يتوقف عند 95%، وهو الآن يعرض 100% بشكل صحيح عند الاكتمال.
- **تصحيح API محسّن**: أصبح "API Error Debugging Mode" يلتقط full response bodies من مزودي LLM وخدمات البحث (Tavily/DuckDuckGo)، ويسجل timeline للنقل لكل محاولة مع sanitized request URLs، والمدة المنقضية، وresponse headers، وpartial response bodies، وparsed partial stream content، وstack traces لتسهيل الاستكشاف عبر OpenAI-compatible وAnthropic وGoogle وAzure OpenAI وOllama fallbacks.
- **لوحة Developer Mode**: تتضمن الإعدادات الآن لوحة تشخيصية خاصة بالمطورين تبقى مخفية ما لم يتم تفعيل "Developer mode". وتدعم اختيار مسارات التشخيص وإجراء repeated stability probes للمسار المحدد.
- **شريط جانبي معاد التصميم**: تم تجميع الإجراءات المدمجة ضمن أقسام أوضح مع labels أوضح وحالة حية وتقدم قابل للإلغاء وسجلات قابلة للنسخ لتقليل ازدحام الشريط الجانبي. كما يظل footer الخاص بالتقدم والسجل مرئيا حتى عند توسيع جميع الأقسام.
- **تحسين التفاعل والوضوح في الشريط الجانبي**: أزرار sidebar أصبحت توفر تفاعلات hover وpress وfocus أوضح، كما أن أزرار CTA الملونة، بما فيها `One-Click Extract` و `Batch generate from titles`، تستخدم تباينا أقوى للنص لسهولة القراءة مع السمات المختلفة.
- **حصر CTA في إجراءات الملف الواحد**: أصبح التنسيق الملون مخصصا فقط لإجراءات الملف الواحد. أما إجراءات المجلد أو الدفعيات وmixed workflows فتستخدم تنسيقا غير CTA لتقليل أخطاء النقر المتعلقة بنطاق العملية.
- **One-click workflows مخصصة**: يمكنك تحويل أدوات sidebar المدمجة إلى أزرار قابلة لإعادة الاستخدام بأسماء مخصصة وسلاسل إجراءات مركبة. كما يأتي workflow افتراضي باسم `One-Click Extract` بشكل جاهز.

### تعزيز الرسم المعرفي
- **إضافة wiki-links تلقائيا**: يحدد المفاهيم الأساسية ويضيف `[[wiki-links]]` إلى الملاحظات المعالجة اعتمادا على خرج LLM.
- **إنشاء concept notes اختياريا وقابلا للتخصيص**: إنشاء ملاحظات جديدة تلقائيا للمفاهيم المكتشفة داخل مجلد محدد في الـ vault.
- **مسارات output قابلة للتخصيص**: يمكنك ضبط مسارات نسبية منفصلة داخل vault لحفظ الملفات المعالجة والملاحظات المفاهيمية المنشأة.
- **أسماء ملفات output قابلة للتخصيص (Add Links)**: يمكنك اختيار **الكتابة فوق الملف الأصلي** أو استخدام suffix أو replacement string مخصص بدلا من `_processed.md` الافتراضي عند معالجة الملفات لإضافة الروابط.
- **المحافظة على سلامة الروابط**: هناك معالجة أساسية لتحديث الروابط عندما يعاد تسمية الملاحظات أو حذفها داخل الـ vault.
- **استخراج مفاهيم خالص**: يمكنك استخراج المفاهيم وإنشاء concept notes مقابلة دون تعديل المستند الأصلي. هذا مناسب لتعبئة قاعدة معرفية من مستندات موجودة دون تغييرها. تتوفر إعدادات لإنشاء ملاحظات مفاهيمية minimal وإضافة backlinks.

### الترجمة

- **الترجمة بالذكاء الاصطناعي**:
  - ترجمة محتوى الملاحظة باستخدام LLM المهيأ.
  - **دعم الملفات الكبيرة**: يقسم الملفات الكبيرة تلقائيا إلى chunks أصغر حسب إعداد `Chunk word count` قبل إرسالها إلى LLM، ثم يعيد دمج الأجزاء المترجمة بسلاسة في مستند واحد.
  - يدعم الترجمة بين لغات متعددة.
  - اللغة الهدف قابلة للتخصيص في الإعدادات أو من الـ UI.
  - يمكن فتح النص المترجم تلقائيا في pane على يمين النص الأصلي لسهولة القراءة.
- **الترجمة المجمعة**:
  - ترجمة جميع الملفات داخل مجلد محدد.
  - يدعم المعالجة المتوازية عند تفعيل "Enable Batch Parallelism".
  - يستخدم custom prompts للترجمة إذا تم إعدادها.
  - يضيف خيار "Batch translate this folder" إلى قائمة السياق في file explorer.
- **تعطيل الترجمة التلقائية**: عندما يتم تفعيل هذا الخيار، فإن المهام غير الخاصة بالترجمة لن تفرض لغة خرج محددة، وبذلك تحافظ على سياق اللغة الأصلية. أما مهمة `Translate` الصريحة فستستمر في تنفيذ الترجمة كما هو مضبوط.

### بحث الويب وتوليد المحتوى
- **البحث على الويب والتلخيص**:
  - إجراء بحث عبر Tavily، الذي يتطلب API key، أو عبر DuckDuckGo، وهو خيار تجريبي.
  - **صلابة بحث محسنة**: بحث DuckDuckGo يستخدم الآن منطق parsing محسنا يعتمد على DOMParser مع Regex fallback للتعامل مع تغييرات layout وضمان نتائج أكثر اعتمادية.
  - تلخيص نتائج البحث عبر LLM المهيأ.
  - يمكن تخصيص لغة خرج الملخص من الإعدادات.
  - يتم إلحاق الملخص بالملاحظة الحالية.
  - يوجد حد tokens قابل للتخصيص لمحتوى البحث الذي يرسل إلى LLM.
- **توليد المحتوى من العنوان**:
  - استخدام عنوان الملاحظة لتوليد محتوى أولي عبر LLM مع استبدال المحتوى الحالي.
  - **بحث اختياري**: يمكن إعداد تنفيذ web research عبر المزود المختار لتوفير context إضافي عند التوليد.
- **Batch Content Generation from Titles**: توليد المحتوى لجميع الملاحظات في مجلد محدد بناء على عناوينها، مع احترام إعداد البحث الاختياري. يتم نقل الملفات المعالجة بنجاح إلى **مجلد فرعي "complete" قابل للتخصيص** مثل `[foldername]_complete` أو اسم مخصص لتجنب إعادة المعالجة.
- **ربط Mermaid Auto-Fix**: عندما يكون Mermaid auto-fix مفعلا، تقوم المسارات المتعلقة بتوليد Mermaid بإصلاح الملفات أو مجلدات الإخراج الناتجة تلقائيا بعد المعالجة. ويشمل ذلك Process وGenerate from Title وBatch Generate from Titles وResearch & Summarize وSummarise as Mermaid وTranslate.

### الميزات المساعدة
- **التلخيص كمخطط Mermaid**:
  - تسمح هذه الميزة بتلخيص محتوى الملاحظة في Mermaid diagram.
  - لغة خرج Mermaid قابلة للتخصيص في الإعدادات.
  - **Mermaid Output Folder**: يمكن تحديد المجلد الذي تحفظ فيه ملفات Mermaid الناتجة.
  - **Translate Summarize to Mermaid Output**: يمكن اختيار ترجمة محتوى Mermaid الناتج إلى اللغة الهدف المضبوطة.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **تصحيح بسيط لتنسيق المعادلات**:
  - يصلح بسرعة المعادلات الرياضية أحادية السطر المحاطة بعلامة `$` واحدة إلى كتل `$$` القياسية.
  - **Single File**: معالجة الملف الحالي من خلال زر sidebar أو Command Palette.
  - **Batch Fix**: معالجة كل الملفات في مجلد محدد عبر زر sidebar أو Command Palette.

- **Check for Duplicates in Current File**: يساعد هذا الأمر في تحديد المصطلحات المكررة المحتملة داخل الملف النشط.
- **Duplicate Detection**: فحص أساسي للكلمات المكررة داخل محتوى الملف الجاري معالجته، وتظهر النتائج في console.
- **Check and Remove Duplicate Concept Notes**: يحدد الملاحظات المكررة المحتملة داخل **Concept Note Folder** المهيأة بناء على تطابق الاسم الكامل، والصيغ الجمع، والتطبيع، واحتواء الكلمات الأحادية مقارنة بالملاحظات خارج المجلد. ويمكن ضبط نطاق المقارنة ليكون **الـ vault بالكامل** أو **مجلدات مضمّنة محددة** أو **كل المجلدات باستثناء مجلدات محددة**. ثم تعرض نافذة قائمة مفصلة تتضمن الأسباب والملفات المتعارضة، ويطلب بعدها التأكيد قبل نقل الملفات المكررة إلى system trash، مع إظهار التقدم أثناء الحذف.
- **Batch Mermaid Fix**: يطبق تصحيحات Mermaid وLaTeX syntax على جميع ملفات Markdown داخل مجلد يختاره المستخدم.
  - **جاهز للـ Workflow**: يمكن استخدامه كأداة مستقلة أو كخطوة داخل custom one-click workflow button.
  - **تقارير الأخطاء**: ينشئ ملف `mermaid_error_{foldername}.md` يسرد الملفات التي لا تزال تحتوي على أخطاء Mermaid محتملة بعد المعالجة.
  - **نقل ملفات الخطأ**: يمكن اختيار نقل الملفات التي لا تزال تحتوي على أخطاء إلى مجلد مخصص للمراجعة اليدوية.
  - **كشف ذكي**: يفحص الملفات أولا باستخدام `mermaid.parse` قبل محاولة الإصلاح، لتقليل وقت المعالجة وتجنب التعديلات غير الضرورية.
  - **معالجة آمنة**: يتم تطبيق الإصلاحات فقط داخل Mermaid code blocks، ما يمنع تعديل جداول Markdown أو المحتوى الآخر عن طريق الخطأ. هناك أيضا safeguards قوية لحماية table syntax مثل `| :--- |`.
  - **Deep Debug Mode**: إذا استمرت الأخطاء بعد الإصلاح الأولي، يتم تشغيل وضع deep debug متقدم يعالج حالات حافة معقدة، مثل:
    - **دمج التعليقات**: دمج التعليقات اللاحقة التي تبدأ بـ `%` داخل edge label. مثال: `A -- Label --> B; % Comment` تصبح `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: إصلاح الأسهم التي تم ابتلاعها داخل علامات الاقتباس، مثل `A -- "Label -->" B` لتصبح `A -- "Label" --> B`.
    - **Inline Subgraphs**: تحويل subgraph labels المضمنة إلى edge labels.
    - **Reverse Arrow Fix**: تصحيح الأسهم غير القياسية `X <-- Y` إلى `Y --> X`.
    - **Direction Keyword Fix**: التأكد من أن الكلمة `direction` تكون lowercase داخل subgraphs، مثل `Direction TB` -> `direction TB`.
    - **Comment Conversion**: تحويل تعليقات `//` إلى edge labels، مثل `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: تبسيط labels المتكررة داخل الأقواس، مثل `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: تحويل الصياغة غير الصحيحة `--|>` إلى الصيغة القياسية `-->`.
    - **Robust Label & Note Handling**: تحسين التعامل مع labels التي تحتوي على special characters مثل `/`، ودعم أفضل لصياغة الملاحظات المخصصة (`note for ...`) مع إزالة الآثار الجانبية مثل الأقواس الزائدة.
    - **Advanced Fix Mode**: يتضمن إصلاحات قوية لـ unquoted node labels التي تحتوي على مسافات أو special characters أو أقواس متداخلة، مثل `Node[Label [Text]]` إلى `Node["Label [Text]"]`، لتعمل مع الرسوم المعقدة مثل Stellar Evolution. كما يصلح edge labels التالفة، مثل `--["Label["-->` إلى `-- "Label" -->`.
    - **Note Conversion**: يحول `note right/left of` و standalone `note :` comments إلى Mermaid nodes وروابط قياسية، مثل `note right of A: text` التي تصبح `NoteA["Note: text"]` مرتبطة بـ `A`. ويدعم ذلك arrow links (`-->`) وsolid links (`---`).
    - **Extended Note Support**: يحول `note for Node "Content"` و `note of Node "Content"` إلى linked note nodes قياسية مثل `NoteNode[" Content"]` مرتبطة بالعقدة الأصلية.
    - **Enhanced Note Correction**: يعيد تسمية notes تلقائيا بأرقام متسلسلة مثل `Note1` و `Note2` لتجنب مشاكل alias عند وجود ملاحظات متعددة.
    - **Parallelogram/Shape Fix**: يصحح الأشكال التالفة مثل `[/["Label["/]` إلى `["Label"]`.
    - **Standardize Pipe Labels**: يصلح labels المحتوية على pipe ويوحدها بإحاطتها بعلامات اقتباس بشكل صحيح، مثل `-->|Text|` إلى `-->|"Text"|` و `-->|Math|^2|` إلى `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: يصحح edge labels الموضوعة قبل السهم، مثل `>|"Label"| A --> B` إلى `A -->|"Label"| B`.
    - **Merge Double Labels**: يكتشف labels المزدوجة المعقدة على edge واحد ويجمعها في label واحد مع line breaks، مثل `A -- Label1 -- Label2 --> B` لتصبح `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: يضيف الاقتباس التلقائي حول node labels التي تحتوي على characters قد تسبب مشكلات، مثل علامات الاقتباس أو `=` أو operators الرياضية، عندما تكون هذه labels بلا اقتباس خارجي.
    - **Intermediate Node Fix**: يقسم الحواف التي تحتوي على تعريف عقدة وسيطة إلى حافتين منفصلتين، مثل `A -- B[...] --> C` إلى `A --> B[...]` و `B[...] --> C`.
    - **Concatenated Label Fix**: يصلح node definitions التي يكون فيها الـ ID ملتصقا بالـ label، مثل `SubdivideSubdivide...` إلى `Subdivide["Subdivide..."]`، حتى مع وجود pipe labels أو عدم تطابق التكرار بدقة.
    - **Extract Specific Original Text**:
      - تعريف قائمة من الأسئلة داخل الإعدادات.
      - استخراج مقاطع نصية حرفية من الملاحظة النشطة تجيب عن هذه الأسئلة.
      - **Merged Query Mode**: خيار لمعالجة جميع الأسئلة في استدعاء API واحد لتحسين الكفاءة.
      - **Translation**: خيار لإضافة ترجمة للنص المستخرج داخل output.
      - **Custom Output**: مسار حفظ وsuffix مخصصان لملف النص المستخرج.
  - **LLM Connection Test**: للتحقق من إعدادات API الخاصة بالمزود النشط.

## التثبيت

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### من Obsidian Marketplace (موصى به)
1. افتح **Settings** -> **Community plugins** في Obsidian.
2. تأكد من أن "Restricted mode" **متوقف**.
3. اضغط **Browse** وابحث عن "Notemd".
4. اضغط **Install**.
5. بعد اكتمال التثبيت اضغط **Enable**.

### التثبيت اليدوي
1. قم بتنزيل أصول الإصدار الأحدث من [صفحة GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). يتضمن كل إصدار أيضا `README.md` كمرجع، لكن التثبيت اليدوي يحتاج فقط إلى `main.js` و `styles.css` و `manifest.json`.
2. انتقل إلى مجلد إعدادات الـ vault الخاص بك في Obsidian: `<YourVault>/.obsidian/plugins/`.
3. أنشئ مجلدا جديدا باسم `notemd`.
4. انسخ `main.js` و `styles.css` و `manifest.json` إلى مجلد `notemd`.
5. أعد تشغيل Obsidian.
6. اذهب إلى **Settings** -> **Community plugins** وقم بتفعيل "Notemd".

## الإعداد

يمكن الوصول إلى إعدادات الإضافة من خلال:
**Settings** -> **Community Plugins** -> **Notemd** (اضغط على أيقونة الترس).

### إعداد مزود LLM
1. **المزود النشط**: اختر مزود LLM الذي تريد استخدامه من القائمة المنسدلة.
2. **إعدادات المزود**: اضبط الإعدادات الخاصة بالمزود المحدد:
   - **API Key**: مطلوب لمعظم المزودين السحابيين، مثل OpenAI وAnthropic وDeepSeek وQwen وQwen Code وDoubao وMoonshot وGLM وZ AI وMiniMax وHuawei Cloud MaaS وBaidu Qianfan وSiliconFlow وGoogle وMistral وAzure OpenAI وOpenRouter وxAI وGroq وTogether وFireworks وRequesty. لا يلزم لـ Ollama. وهو اختياري لـ LM Studio و preset `OpenAI Compatible` العامة إذا كان endpoint يقبل الوصول المجهول أو placeholder.
   - **Base URL / Endpoint**: عنوان API endpoint للخدمة. توجد قيم افتراضية، لكن قد تحتاج إلى تغييرها للموديلات المحلية (LMStudio وOllama)، أو للبوابات (OpenRouter وRequesty وOpenAI Compatible)، أو لنشر Azure المحدد. وهو **مطلوب لـ Azure OpenAI**.
   - **Model**: اسم أو معرف النموذج المحدد الذي تريد استخدامه، مثل `gpt-4o` أو `claude-3-5-sonnet-20240620` أو `google/gemini-flash-1.5` أو `grok-4` أو `moonshotai/kimi-k2-instruct-0905` أو `accounts/fireworks/models/kimi-k2p5` أو `anthropic/claude-3-7-sonnet-latest`. تأكد من توفر النموذج على endpoint الخاص بك.
   - **Temperature**: تتحكم في عشوائية الخرج. `0` يعني سلوكا أكثر حتمية و`1` أعلى إبداعا. القيم المنخفضة مثل `0.2-0.5` عادة أفضل للمهام المنظمة.
   - **API Version (Azure فقط)**: مطلوب لنشرات Azure OpenAI، مثل `2024-02-15-preview`.
3. **اختبار الاتصال**: استخدم زر "اختبار الاتصال" للمزود النشط للتحقق من صحة الإعدادات. مزودو OpenAI-compatible يستخدمون الآن اختبارات تراعي نوع المزود: endpoints مثل `Qwen` و `Qwen Code` و `Doubao` و `Moonshot` و `GLM` و `Z AI` و `MiniMax` و `Huawei Cloud MaaS` و `Baidu Qianfan` و `SiliconFlow` و `Groq` و `Together` و `Fireworks` و `LMStudio` و `OpenAI Compatible` تقوم باختبار `chat/completions` مباشرة، بينما يمكن للمزودين الذين يملكون endpoint `/models` موثوق أن يبدأوا بسرد النماذج. وإذا فشل أول probe بسبب انقطاع شبكي مؤقت مثل `ERR_CONNECTION_CLOSED`، يقوم Notemd تلقائيا بالانتقال إلى stable retry sequence بدلا من الفشل الفوري.
4. **إدارة إعدادات المزودين**: استخدم زري "تصدير المزودين" و"استيراد المزودين" لحفظ وتحميل إعدادات مزودي LLM إلى أو من ملف `notemd-providers.json` داخل مجلد إعدادات الإضافة. يفيد ذلك في النسخ الاحتياطي والمشاركة.
5. **نطاق الإعدادات المسبقة**: بالإضافة إلى المزودين الأصليين، يتضمن Notemd الآن إعدادات مسبقة جاهزة لـ `Qwen` و `Qwen Code` و `Doubao` و `Moonshot` و `GLM` و `Z AI` و `MiniMax` و `Huawei Cloud MaaS` و `Baidu Qianfan` و `SiliconFlow` و `xAI` و `Groq` و `Together` و `Fireworks` و `Requesty` وهدف `OpenAI Compatible` عام لسيناريوهات LiteLLM و vLLM و Perplexity و Vercel AI Gateway أو الوكلاء المخصصين.

<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### تهيئة متعددة النماذج
- **استخدام مزودين مختلفين للمهام**:
  - **Disabled (الافتراضي)**: يستخدم "المزود النشط" الواحد لكل المهام.
  - **مفعّل**: يسمح لك باختيار مزود محدد، ومعه اختياريا override لاسم النموذج لكل مهمة من المهام ("Add Links" و "Research & Summarize" و "Generate from Title" و "Translate" و "Extract Concepts"). وإذا تُرك حقل override model فارغا لمهمة ما، فسيستخدم النموذج الافتراضي المهيأ للمزود المختار لتلك المهمة.
- **اختيار لغات مختلفة للمهام المختلفة**:
  - **Disabled (الافتراضي)**: يستخدم لغة خرج واحدة لكل المهام.
  - **مفعّل**: يتيح لك اختيار لغة محددة لكل مهمة ("Add Links" و "Research & Summarize" و "Generate from Title" و "Summarise as Mermaid diagram" و "Extract Concepts").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### بنية اللغة (لغة الواجهة مقابل لغة خرج المهام)

- يتحكم **لغة الواجهة** فقط في نص واجهة الإضافة، مثل تسميات الإعدادات وأزرار الشريط الجانبي والإشعارات والحوارات. الوضع الافتراضي `auto` يتبع لغة واجهة Obsidian الحالية.
- يتم الآن ربط المتغيرات الإقليمية ومتغيرات أنظمة الكتابة بأقرب كتالوج منشور بدل السقوط مباشرةً إلى الإنجليزية. على سبيل المثال، يستخدم `fr-CA` الفرنسية، ويستخدم `es-419` الإسبانية، ويستخدم `pt-PT` البرتغالية، ويستخدم `zh-Hans` الصينية المبسطة، ويستخدم `zh-Hant-HK` الصينية التقليدية.
- تتحكم **لغة خرج المهام** في خرج المهام المولَّد بواسطة النموذج، مثل الروابط والملخصات وتوليد العناوين وملخصات Mermaid واستخراج المفاهيم واللغة الهدف للترجمة.
- يسمح **وضع اللغة لكل مهمة** لكل مهمة بحل لغة الخرج الخاصة بها عبر طبقة سياسات موحدة بدلا من وجود تجاوزات متناثرة عبر الوحدات المختلفة.
- يحافظ **تعطيل الترجمة التلقائية** على سياق اللغة الأصلية للمهام غير الخاصة بالترجمة، بينما تستمر مهام Translate الصريحة في فرض اللغة الهدف المضبوطة.
- تتبع المسارات المتعلقة بـ Mermaid السياسة اللغوية نفسها، ويمكنها الاستمرار في تشغيل Mermaid auto-fix عندما يكون مفعلا.

### إعدادات استدعاءات API المستقرة
- **تفعيل استدعاءات API المستقرة (منطق إعادة المحاولة)**:
  - **Disabled (الافتراضي)**: أي فشل في استدعاء API يوقف المهمة الحالية مباشرة.
  - **مفعّل**: يعيد محاولة استدعاءات LLM الفاشلة تلقائيا، وهو مفيد مع الشبكات المتقطعة أو rate limits.
  - **Connection Test Fallback**: حتى عندما لا تعمل الاستدعاءات العادية مسبقا في stable mode، فإن اختبارات الاتصال تتحول بعد أول فشل شبكي مؤقت إلى نفس retry sequence.
  - **Runtime Transport Fallback (Environment-Aware)**: الطلبات الطويلة التي تسقط مؤقتا عبر `requestUrl` تعاد محاولتها أولا باستخدام transport fallback يعتمد على البيئة. على desktop يستخدم Node `http/https`، وفي البيئات غير المكتبية يستخدم browser `fetch`. كما تستخدم هذه المحاولات parsing متدفقا واعيا بالبروتوكول عبر مسارات LLM المدمجة، بما في ذلك OpenAI-compatible SSE وAzure OpenAI SSE وAnthropic Messages SSE وGoogle Gemini SSE وOllama NDJSON، بحيث يمكن للبوابات البطيئة أن تعيد body chunks قبل انتهاء المهلة. أما entrypoints الأخرى ذات النمط OpenAI المباشر فتستخدم نفس fallback path المشترك.
  - **OpenAI-Compatible Stable Order**: في stable mode، تتبع كل محاولة لـ OpenAI-compatible الترتيب `direct streaming -> direct non-stream -> requestUrl (مع streamed fallback عند الحاجة)` قبل احتسابها محاولة فاشلة. وهذا يمنع الإخفاقات العدوانية عندما يكون transport mode واحد فقط هو المشكلة.
- **Retry Interval (seconds)**: يظهر فقط عند تفعيل الميزة. يحدد زمن الانتظار بين المحاولات، من 1 إلى 300 ثانية. الافتراضي: 5.
- **Maximum Retries**: يظهر فقط عند التفعيل. يحدد الحد الأقصى للمحاولات، من 0 إلى 10. الافتراضي: 3.
- **وضع تصحيح أخطاء API**:
  - **Disabled (الافتراضي)**: يستخدم تقارير أخطاء مختصرة ومعيارية.
  - **مفعّل**: يفعّل logging تفصيليا للأخطاء عبر جميع المزودين والمهام، بما في ذلك Translate وSearch وConnection Tests. ويشمل ذلك HTTP status codes وraw response text وtransport timelines وsanitized request URLs والheaders ومدد المحاولات وresponse headers وpartial response bodies وparsed partial stream output وstack traces.
- **Developer Mode**:
  - **Disabled (الافتراضي)**: يخفي كل controls الخاصة بالمطورين.
  - **مفعّل**: يعرض developer diagnostics panel مخصصة داخل الإعدادات.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: اختيار runtime path لكل probe. مزودو OpenAI-compatible يدعمون أوضاعا forced إضافية مثل `direct streaming` و `direct buffered` و `requestUrl-only` بالإضافة إلى أوضاع runtime.
  - **Run Diagnostic**: يشغل long-request probe واحدا بالـ call mode المحدد ويكتب ملف `Notemd_Provider_Diagnostic_*.txt` في جذر الـ vault.
  - **Run Stability Test**: يكرر الـ probe لعدد مرات قابل للضبط من 1 إلى 10 باستخدام call mode المختار ويحفظ aggregated stability report.
  - **Diagnostic Timeout**: timeout قابل للتخصيص لكل تشغيل من 15 إلى 3600 ثانية.
  - **الفائدة**: هذا أسرع من إعادة الإنتاج اليدوي عندما ينجح "Test connection" لكن المهام الطويلة الحقيقية تفشل، مثل الترجمة عبر بوابة بطيئة.

<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### الإعدادات العامة

#### إخراج الملفات المعالجة
- **Customize Processed File Save Path**:
  - **Disabled (الافتراضي)**: تحفظ الملفات المعالجة مثل `YourNote_processed.md` في **المجلد نفسه** الذي يوجد فيه الملف الأصلي.
  - **مفعّل**: يسمح لك بتحديد موقع حفظ مخصص.
- **Processed File Folder Path**: يظهر فقط عند تفعيل الخيار أعلاه. أدخل **مسارا نسبيا** داخل الـ vault، مثل `Processed Notes` أو `Output/LLM`، حيث سيتم حفظ الملفات المعالجة. سيتم إنشاء المجلدات إذا لم تكن موجودة. **لا تستخدم المسارات المطلقة مثل `C:\...` أو الرموز غير المسموح بها.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Disabled (الافتراضي)**: الملفات الناتجة عن أمر Add Links تستخدم اللاحقة الافتراضية `_processed.md` مثل `YourNote_processed.md`.
  - **مفعّل**: يتيح لك تخصيص اسم الملف الناتج باستخدام الإعداد أدناه.
- **Custom Suffix/Replacement String**:
  - إذا تُرك الحقل **فارغا**، فسيتم **الكتابة فوق الملف الأصلي** بالمحتوى المعالج.
  - إذا أدخلت سلسلة مثل `_linked`، فسيتم إلحاقها باسم الملف الأصلي الأساسي، مثل `YourNote_linked.md`. تأكد من أن suffix لا يحتوي على رموز غير صالحة لأسماء الملفات.
- **Remove Code Fences on Add Links**:
  - **Disabled (الافتراضي)**: تبقى code fences **(\`\\\`\`)** داخل المحتوى عند إضافة الروابط، بينما تزال **(\`\\\`markdown)** تلقائيا.
  - **مفعّل**: يزيل code fences من المحتوى قبل إضافة الروابط.

<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### إخراج الملاحظات المفاهيمية
- **Customize Concept Note Path**:
  - **Disabled (الافتراضي)**: يكون الإنشاء التلقائي لملاحظات `[[linked concepts]]` معطلا.
  - **مفعّل**: يسمح لك بتحديد المجلد الذي تنشأ فيه concept notes الجديدة.
- **Concept Note Folder Path**: يظهر فقط عند التفعيل. أدخل **مسارا نسبيا** داخل الـ vault، مثل `Concepts` أو `Generated/Topics`. سيتم إنشاء المجلدات تلقائيا إذا لم تكن موجودة. **يجب تعبئة الحقل عند تفعيل الميزة.** **لا تستخدم المسارات المطلقة أو الرموز غير الصالحة.**

<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### إخراج ملف سجل المفاهيم
- **Generate Concept Log File**:
  - **Disabled (الافتراضي)**: لا يتم إنشاء log file.
  - **مفعّل**: ينشئ ملف سجل يسرد concept notes المنشأة حديثا بعد المعالجة. ويكون التنسيق كما يلي:
    ```
    إنشاء xx ملف md للمفاهيم
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: يظهر فقط إذا كان "Generate Concept Log File" مفعلا.
  - **Disabled (الافتراضي)**: يتم حفظ log file داخل **Concept Note Folder Path**، إذا كانت محددة، أو في جذر الـ vault خلاف ذلك.
  - **مفعّل**: يسمح لك بتحديد مجلد مخصص لحفظ السجل.
- **Concept Log Folder Path**: يظهر فقط عندما يكون "Customize Log File Save Path" مفعلا. أدخل **مسارا نسبيا** داخل الـ vault، مثل `Logs/Notemd`. **يجب تعبئته إذا كانت الميزة مفعلة.**
- **Customize Log File Name**: يظهر فقط إذا كان "Generate Concept Log File" مفعلا.
  - **Disabled (الافتراضي)**: اسم ملف السجل هو `Generate.log`.
  - **مفعّل**: يسمح لك بتحديد اسم مخصص.
- **Concept Log File Name**: يظهر فقط عندما يكون "Customize Log File Name" مفعلا. أدخل اسم الملف المطلوب، مثل `ConceptCreation.log`. **يجب تعبئته إذا كانت الميزة مفعلة.**

<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### مهمة استخراج المفاهيم
- **إنشاء ملاحظات مفاهيمية دنيا**:
  - **On (الافتراضي)**: لا تحتوي concept notes الجديدة إلا على العنوان، مثل `# Concept`.
  - **Off**: قد تحتوي concept notes على محتوى إضافي، مثل backlink بعنوان "Linked From"، إذا لم يتم تعطيله في الإعداد التالي.
- **Add "Linked From" backlink**:
  - **Off (الافتراضي)**: لا تتم إضافة backlink إلى المستند المصدر أثناء extraction.
  - **On**: تتم إضافة قسم "Linked From" مع backlink إلى الملف المصدر.

#### استخراج نص أصلي محدد
- **Questions for extraction**: أدخل قائمة بالأسئلة، سؤال في كل سطر، تريد من الذكاء الاصطناعي استخراج إجابات حرفية لها من ملاحظاتك.
- **Translate output to corresponding language**:
  - **Off (الافتراضي)**: يخرج النص المستخرج فقط بلغته الأصلية.
  - **On**: يضيف ترجمة للنص المستخرج باللغة المضبوطة لهذه المهمة.
- **Merged query mode**:
  - **Off**: يعالج كل سؤال بشكل منفصل، ما قد يعطي دقة أعلى لكنه يتطلب مزيدا من استدعاءات API.
  - **On**: يرسل جميع الأسئلة في prompt واحدة، وهو أسرع ويستهلك عددا أقل من الاستدعاءات.
- **Customise extracted text save path & filename**:
  - **Off**: يحفظ الملف في المجلد نفسه مع suffix `_Extracted`.
  - **On**: يسمح بتحديد output folder وfilename suffix مخصصين.

#### إصلاح Mermaid دفعة واحدة
- **Enable Mermaid Error Detection**:
  - **Off (الافتراضي)**: يتم تجاوز فحص الأخطاء بعد المعالجة.
  - **On**: يفحص الملفات المعالجة بحثا عن أخطاء Mermaid syntax متبقية وينشئ تقريرا باسم `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Off**: تبقى الملفات ذات الأخطاء في أماكنها.
  - **On**: ينقل أي ملف ما زال يحتوي على أخطاء Mermaid syntax بعد محاولة الإصلاح إلى مجلد مخصص للمراجعة اليدوية.
- **Mermaid error folder path**: يظهر إذا تم تفعيل الخيار السابق. وهو المجلد الذي ستنقل إليه الملفات ذات الأخطاء.

#### معلمات المعالجة
- **Enable Batch Parallelism**:
  - **Disabled (الافتراضي)**: تتم مهام المعالجة الدفعية، مثل "Process Folder" أو "Batch Generate from Titles"، بشكل تسلسلي ملفا بعد ملف.
  - **مفعّل**: يسمح للإضافة بمعالجة عدة ملفات بالتوازي، ما قد يسرّع الأعمال الدفعية الكبيرة بصورة ملموسة.
- **Batch Concurrency**: يظهر فقط عند تفعيل المعالجة المتوازية. يحدد الحد الأقصى لعدد الملفات المعالجة في وقت واحد. القيم الأعلى قد تكون أسرع، لكنها تستخدم موارد أكثر وقد تصطدم بـ API rate limits. الافتراضي: `1`، المجال: `1-20`.
- **Batch Size**: يظهر فقط عند تفعيل المعالجة المتوازية. عدد الملفات التي تجمع في batch واحدة. الافتراضي: `50`، المجال: `10-200`.
- **Delay Between Batches (ms)**: يظهر فقط عند تفعيل المعالجة المتوازية. تأخير اختياري بالميلي ثانية بين كل batch وأخرى، وهو مفيد للتحكم في rate limits. الافتراضي: `1000ms`.
- **API Call Interval (ms)**: الحد الأدنى للتأخير قبل وبعد كل استدعاء فردي لـ LLM API. وهو مهم مع APIs ذات المعدل المنخفض أو لتقليل أخطاء 429. ضبطه على `0` يعني عدم وجود تأخير اصطناعي. الافتراضي: `500ms`.
- **Chunk Word Count**: الحد الأقصى لعدد الكلمات في كل chunk ترسل إلى LLM. يؤثر في عدد استدعاءات API للملفات الكبيرة. الافتراضي: `3000`.
- **Enable Duplicate Detection**: يبدّل التحقق الأساسي من الكلمات المكررة داخل المحتوى المعالج، وتظهر النتائج في console. الافتراضي: مفعّل.
- **Max Tokens**: أقصى عدد من tokens يجب أن تولدها LLM لكل response chunk. يؤثر في الكلفة ومستوى التفصيل. الافتراضي: `4096`.

<img width="795" height="274" alt="معلمات المعالجة   إعدادات اللغة" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### الترجمة
- **Default Target Language**: اختر اللغة الهدف الافتراضية التي تريد ترجمة ملاحظاتك إليها. يمكن override هذا الاختيار من الـ UI عند تشغيل أمر الترجمة. الافتراضي: English.
- **Customise Translation File Save Path**:
  - **Disabled (الافتراضي)**: تحفظ الملفات المترجمة في **المجلد نفسه** الخاص بالملف الأصلي.
  - **مفعّل**: يسمح لك بتحديد **مسار نسبي** داخل الـ vault، مثل `Translations`، حيث تحفظ الملفات المترجمة. سيتم إنشاء المجلدات إذا لم تكن موجودة.
- **Use custom suffix for translated files**:
  - **Disabled (الافتراضي)**: تستخدم الملفات المترجمة suffix افتراضية هي `_translated.md`، مثل `YourNote_translated.md`.
  - **مفعّل**: يسمح لك بتحديد suffix مخصصة.
- **Custom Suffix**: يظهر فقط عند تفعيل الخيار السابق. أدخل suffix مخصصة تريد إضافتها إلى أسماء الملفات المترجمة، مثل `_es` أو `_fr`.

<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### توليد المحتوى
- **Enable Research in "Generate from Title"**:
  - **Disabled (الافتراضي)**: تستخدم مهمة "Generate from Title" العنوان فقط كمدخل.
  - **مفعّل**: تجري بحثا على الويب باستخدام **Web Research Provider** المهيأ، وتضيف نتائجه كسياق ضمن prompt المرسلة إلى LLM.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **مفعّل (الافتراضي)**: ينفذ تلقائيا تمريرة إصلاح Mermaid syntax بعد workflows المرتبطة بـ Mermaid مثل Process وGenerate from Title وBatch Generate from Titles وResearch & Summarize وSummarise as Mermaid وTranslate.
  - **Disabled**: يترك Mermaid output المولَّد كما هو حتى تشغل `Batch Mermaid Fix` يدويا أو تضيفه إلى custom workflow.
- **Output Language**:
  - اختر لغة الخرج المرغوبة لمهام "Generate from Title" و"Batch Generate from Title".
  - **English (الافتراضي)**: تتم معالجة الـ prompt وإرجاع التوثيق النهائي باللغة الإنجليزية.
  - **لغات أخرى**: يطلب من LLM أن يقوم بالاستدلال باللغة الإنجليزية، ثم يعيد التوثيق النهائي بلغتك المختارة، مثل Español أو Français أو 简体中文 أو 繁體中文 أو العربية أو हिन्दी وغيرها.
- **Change Prompt Word**:
  - تسمح بتغيير prompt word الخاصة بمهمة محددة.
  - في **Custom Prompt Word** يمكنك إدخال الصياغة الخاصة بك.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Disabled (الافتراضي)**: تنقل الملفات التي تم توليدها بنجاح إلى مجلد فرعي باسم `[OriginalFolderName]_complete` نسبة إلى والد المجلد الأصلي، أو `Vault_complete` إذا كان المجلد الأصلي هو جذر الـ vault.
  - **مفعّل**: يسمح لك بتحديد اسم مخصص للمجلد الفرعي الذي تنقل إليه الملفات المكتملة.
- **Custom Output Folder Name**: يظهر فقط عند تفعيل الخيار السابق. أدخل اسم المجلد الفرعي المطلوب، مثل `Generated Content` أو `_complete`. لا يسمح بالرموز غير الصالحة. وإذا تُرك فارغا، يستخدم `_complete`.

#### أزرار سير العمل بنقرة واحدة
- **Visual Workflow Builder**: ينشئ custom workflow buttons من الإجراءات المدمجة دون كتابة DSL يدويا.
- **Custom Workflow Buttons DSL**: يمكن للمستخدمين المتقدمين تعديل تعريف الـ workflow نصيا مباشرة. وإذا كان DSL غير صالح، يتم الرجوع بأمان إلى الـ workflow الافتراضي ويظهر warning في sidebar والإعدادات.
- **Workflow Error Strategy**:
  - **Stop on Error (الافتراضي)**: يتوقف الـ workflow فورا عند فشل أي خطوة.
  - **Continue on Error**: يواصل تنفيذ الخطوات اللاحقة ويبلغ في النهاية بعدد الإجراءات التي فشلت.
- **Default Workflow Included**: يقوم `One-Click Extract` بربط `Process File (Add Links)` و `Batch Generate from Titles` و `Batch Mermaid Fix`.

#### إعدادات الموجه المخصص
تتيح لك هذه الميزة تجاوز التعليمات الافتراضية المرسلة إلى LLM لبعض المهام، ومن ثم امتلاك تحكم أدق في الخرج.

- **Enable Custom Prompts for Specific Tasks**:
  - **Disabled (الافتراضي)**: تستخدم الإضافة الـ prompts الافتراضية المدمجة لكل العمليات.
  - **مفعّل**: يفعّل القدرة على تعيين custom prompts للمهام المدرجة أدناه. وهو المفتاح الرئيسي لهذه الميزة.
- **Use Custom Prompt for [Task Name]**:
  - لكل مهمة مدعومة ("Add Links" و "Generate from Title" و "Research & Summarize" و "Extract Concepts") يمكنك تفعيل أو تعطيل الـ custom prompt بشكل منفصل.
  - **Disabled**: تستخدم هذه المهمة الـ prompt الافتراضية.
  - **مفعّل**: تستخدم هذه المهمة النص الذي تكتبه في textarea المقابلة.
- **Custom Prompt Text Area**:
  - **Default Prompt Display**: تعرض الإضافة الـ prompt الافتراضية كمرجع. ويمكنك استخدام زر **"Copy Default Prompt"** لنسخها كنقطة انطلاق.
  - **Custom Prompt Input**: هنا تكتب التعليمات الخاصة بك لـ LLM.
  - **Placeholders**: يمكنك، ومن الأفضل أن تفعل، استخدام placeholders خاصة داخل الـ prompt، وسيقوم البرنامج باستبدالها بالمحتوى الفعلي قبل إرسال الطلب. راجع default prompt لمعرفة placeholders المتوفرة لكل مهمة. ومن الأمثلة الشائعة:
    - `{TITLE}`: عنوان الملاحظة الحالية.
    - `{RESEARCH_CONTEXT_SECTION}`: المحتوى الذي تم جمعه من web research.
    - `{USER_PROMPT}`: محتوى الملاحظة الجاري معالجتها.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="نطاق فحص التكرار   إعدادات الموجه المخصص" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### نطاق فحص التكرار
- **Duplicate Check Scope Mode**: يتحكم في الملفات التي ستتم مقارنتها مع الملاحظات الموجودة داخل Concept Note Folder بحثا عن duplicates محتملة.
  - **Entire Vault (الافتراضي)**: يقارن concept notes بكل الملاحظات الأخرى في الـ vault، باستثناء Concept Note Folder نفسها.
  - **Include Specific Folders Only**: يقارن concept notes فقط مع الملاحظات الموجودة داخل المجلدات المدرجة أدناه.
  - **Exclude Specific Folders**: يقارن concept notes بكل الملاحظات ما عدا ما يوجد داخل المجلدات المدرجة أدناه، مع استبعاد Concept Note Folder أيضا.
  - **Concept Folder Only**: يقارن concept notes فقط مع **الملاحظات الأخرى داخل Concept Note Folder نفسها**. يفيد هذا في العثور على duplicates داخل المفاهيم المولدة فقط.
- **Include/Exclude Folders**: يظهر فقط إذا كان الوضع `Include` أو `Exclude`. أدخل **المسارات النسبية** للمجلدات التي تريد تضمينها أو استبعادها، **مسار واحد في كل سطر**. المسارات حساسة لحالة الأحرف وتستخدم `/` كفاصل، مثل `Reference Material/Papers` أو `Daily Notes`. ولا يجوز أن تكون هذه المجلدات مساوية لـ Concept Note Folder أو داخلها.

#### مزود بحث الويب
- **Search Provider**: اختر بين `Tavily`، والذي يتطلب API key ويوصى به، و `DuckDuckGo`، وهو خيار تجريبي وغالبا ما يتم حظره بسبب الطلبات الآلية. يستخدم هذا في "Research & Summarize Topic" واختياريا في "Generate from Title".
- **Tavily API Key**: يظهر فقط عند اختيار Tavily. أدخل API key الخاصة بك من [tavily.com](https://tavily.com/).
- **Tavily Max Results**: يظهر فقط عند اختيار Tavily. الحد الأقصى لعدد النتائج التي يجب أن يعيدها Tavily هو من 1 إلى 20. الافتراضي: 5.
- **Tavily Search Depth**: يظهر فقط عند اختيار Tavily. يمكنك اختيار `basic`، وهو الافتراضي، أو `advanced`. يوفر `advanced` نتائج أفضل لكنه يستهلك رصيدين لكل عملية بحث بدلا من واحد.
- **DuckDuckGo Max Results**: يظهر فقط عند اختيار DuckDuckGo. الحد الأقصى لعدد نتائج البحث التي سيتم parsing لها، من 1 إلى 10. الافتراضي: 5.
- **DuckDuckGo Content Fetch Timeout**: يظهر فقط عند اختيار DuckDuckGo. الحد الأقصى لعدد الثواني التي ينتظرها البرنامج عند جلب المحتوى من URL كل نتيجة. الافتراضي: 15.
- **Max Research Content Tokens**: الحد التقريبي الأقصى لعدد tokens من نتائج web research المجمعة التي ستضمّن في summarization prompt. يساعد هذا على التحكم في حجم نافذة السياق والكلفة. الافتراضي: 3000.

<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### مجال التعلم المركّز
- **Enable Focused Learning Domain**:
  - **Disabled (الافتراضي)**: تستخدم الـ prompts المرسلة إلى LLM التعليمات العامة القياسية.
  - **مفعّل**: يتيح لك تحديد مجال أو أكثر لتحسين الفهم السياقي للنموذج.
- **Learning Domain**: يظهر فقط عند تفعيل الخيار السابق. أدخل مجال الدراسة الخاص بك، مثل `Materials Science` أو `Polymer Physics` أو `Machine Learning`. سيضيف ذلك سطرا في بداية الـ prompts مثل `Relevant Fields: [...]`، مما يساعد LLM على توليد روابط ومحتوى أكثر دقة وملاءمة لمجالك.

<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## دليل الاستخدام

### عمليات سير العمل السريعة والشريط الجانبي

- افتح Notemd sidebar للوصول إلى الأقسام المجمعة الخاصة بالمعالجة الأساسية والتوليد والترجمة والمعرفة والأدوات.
- استخدم قسم **عمليات سير العمل السريعة** أعلى الشريط الجانبي لتشغيل أزرار متعددة الخطوات مخصصة.
- يقوم workflow الافتراضي **One-Click Extract** بتشغيل `Process File (Add Links)` ثم `Batch Generate from Titles` ثم `Batch Mermaid Fix`.
- يتم عرض تقدم workflow وسجلات كل خطوة والإخفاقات في الشريط الجانبي، مع footer مثبت يحافظ على بقاء progress bar ومنطقة السجلات مرئيتين حتى مع توسيع الأقسام.
- تحافظ بطاقة التقدم على readability جيدة للنص الحالي ونسبة الإنجاز والوقت المتبقي، ويمكن إعادة ضبط هذه الـ workflows المخصصة أيضا من داخل الإعدادات.

### المعالجة الأصلية (إضافة Wiki-Links)
هذه هي الوظيفة الأساسية التي تركز على تحديد المفاهيم وإضافة `[[wiki-links]]`.

**مهم:** تعمل هذه العملية فقط مع ملفات `.md` أو `.txt`. يمكنك تحويل ملفات PDF إلى MD مجانا باستخدام [Mineru](https://github.com/opendatalab/MinerU) قبل المعالجة.

1. **استخدام الشريط الجانبي**:
   - افتح Notemd Sidebar، عبر أيقونة العصا السحرية أو من Command Palette.
   - افتح ملفا من نوع `.md` أو `.txt`.
   - اضغط **"Process File (Add Links)"**.
   - لمعالجة مجلد كامل، اضغط **"Process Folder (Add Links)"**، اختر المجلد ثم اضغط "Process".
   - يتم عرض progress في الشريط الجانبي. ويمكنك إلغاء المهمة عبر زر "Cancel Processing".
   - *ملاحظة لمعالجة المجلد:* تتم معالجة الملفات في الخلفية دون فتحها في المحرر.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **استخدام Command Palette** (`Ctrl+P` أو `Cmd+P`):
   - **Single File**: افتح الملف وشغّل `Notemd: Process Current File`.
   - **Folder**: شغّل `Notemd: Process Folder` ثم اختر المجلد. تتم معالجة الملفات في الخلفية دون فتحها في المحرر.
   - تظهر progress modal عند تشغيل الأوامر من palette، وهي تتضمن زر إلغاء.
   - *ملاحظة:* تقوم الإضافة تلقائيا بإزالة الأسطر التي تبدأ بـ `\boxed{` وتنتهي بـ `}` إذا وجدت داخل المحتوى النهائي قبل الحفظ.

### الميزات الجديدة

1. **التلخيص كمخطط Mermaid**:
   - افتح الملاحظة التي تريد تلخيصها.
   - شغّل الأمر `Notemd: Summarise as Mermaid diagram` من Command Palette أو من زر sidebar.
   - ستنشئ الإضافة ملاحظة جديدة تحتوي على Mermaid diagram.

2. **Translate Note/Selection**:
   - حدد نصا داخل الملاحظة لترجمة هذا التحديد فقط، أو شغّل الأمر دون تحديد لترجمة الملاحظة كاملة.
   - شغّل `Notemd: Translate Note/Selection` من Command Palette أو من زر sidebar.
   - ستظهر modal تسمح لك بتأكيد أو تغيير **Target Language**، مع استخدام القيمة الافتراضية المحددة في Configuration.
   - تستخدم الإضافة **LLM Provider** المهيأ، تبعا لإعدادات Multi-Model، لتنفيذ الترجمة.
   - يحفظ المحتوى المترجم في **Translation Save Path** المهيأة مع suffix المناسبة، ويفتح في **pane جديدة إلى يمين** المحتوى الأصلي لتسهيل المقارنة.
   - يمكنك إلغاء هذه المهمة عبر زر sidebar أو زر الإلغاء في modal.

3. **الترجمة المجمعة**:
   - شغّل `Notemd: Batch Translate Folder` من Command Palette واختر مجلدا، أو انقر بزر الفأرة الأيمن على مجلد داخل file explorer واختر "Batch translate this folder".
   - تقوم الإضافة بترجمة جميع ملفات Markdown داخل المجلد المحدد.
   - تحفظ الملفات المترجمة في المسار المضبوط للترجمة، لكنها لا تفتح تلقائيا.
   - يمكن إلغاء العملية من progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

4. **Research & Summarize Topic**:
   - حدد نصا داخل الملاحظة، أو تأكد من أن الملاحظة لها عنوان، وسيستخدم العنوان كموضوع للبحث.
   - شغّل الأمر `Notemd: Research and Summarize Topic` من Command Palette أو من زر sidebar.
   - تستخدم الإضافة **Search Provider** المهيأ، Tavily أو DuckDuckGo، ومعه **LLM Provider** المناسب بحسب إعدادات Multi-Model للعثور على المعلومات وتلخيصها.
   - يضاف الملخص إلى نهاية الملاحظة الحالية.
   - يمكنك إلغاء المهمة عبر زر sidebar أو زر الإلغاء في modal.
   - *ملاحظة:* قد تفشل عمليات DuckDuckGo بسبب bot detection. ويوصى باستخدام Tavily.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

5. **Generate Content from Title**:
   - افتح ملاحظة، ويمكن أن تكون فارغة.
   - شغّل الأمر `Notemd: Generate Content from Title` من Command Palette أو من زر sidebar.
   - تستخدم الإضافة **LLM Provider** المناسب، تبعا لإعدادات Multi-Model، لتوليد محتوى بناء على عنوان الملاحظة مع استبدال أي محتوى موجود.
   - إذا كان الإعداد **"Enable Research in 'Generate from Title'"** مفعلا، فسيتم أولا إجراء web research باستخدام **Web Research Provider** المهيأ، وسيضمّن هذا السياق في prompt المرسلة إلى LLM.
   - يمكنك إلغاء هذه المهمة عبر زر sidebar أو زر الإلغاء في modal.

6. **Batch Generate Content from Titles**:
   - شغّل الأمر `Notemd: Batch Generate Content from Titles` من Command Palette أو من زر sidebar.
   - اختر المجلد الذي يحتوي على الملاحظات التي تريد معالجتها.
   - ستقوم الإضافة بالمرور على كل ملف `.md` داخل المجلد، باستثناء ملفات `_processed.md` والملفات الموجودة داخل designated "complete" folder، ثم تولد محتوى بناء على عنوان الملاحظة مع استبدال المحتوى الحالي. تتم المعالجة في الخلفية دون فتح الملفات في المحرر.
   - تنقل الملفات المعالجة بنجاح إلى "complete" folder المهيأة.
   - يحترم هذا الأمر إعداد **"Enable Research in 'Generate from Title'"** لكل ملاحظة.
   - يمكنك إلغاء هذه المهمة من sidebar أو modal.
   - تظهر progress والنتائج، مثل عدد الملفات المعدلة وعدد الأخطاء، داخل سجل sidebar أو modal.

<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

7. **Check and Remove Duplicate Concept Notes**:
   - تأكد من ضبط **Concept Note Folder Path** بشكل صحيح.
   - شغّل `Notemd: Check and Remove Duplicate Concept Notes` من Command Palette أو من زر sidebar.
   - تفحص الإضافة مجلد concept notes وتقارن أسماء الملفات مع الملاحظات خارج المجلد وفق عدة قواعد، مثل exact match، وصيغ الجمع، والتطبيع، والاحتواء.
   - إذا تم العثور على duplicates محتملة، تظهر modal تعرض الملفات والأسباب والملفات المتعارضة.
   - راجع القائمة بعناية. اضغط **"Delete Files"** لنقل الملفات إلى system trash، أو **"Cancel"** لعدم تنفيذ أي شيء.
   - تظهر progress والنتائج في sidebar أو modal log.

8. **Extract Concepts (Pure Mode)**:
   - تسمح هذه الميزة باستخراج المفاهيم من المستند وإنشاء concept notes مقابلة **من دون تعديل الملف الأصلي**. وهذا مناسب لتعبئة قاعدة المعرفة بسرعة من مجموعة مستندات.
   - **Single File**: افتح ملفا ثم شغّل `Notemd: Extract concepts (create concept notes only)` من Command Palette أو اضغط الزر **"Extract concepts (current file)"** في sidebar.
   - **Folder**: شغّل `Notemd: Batch extract concepts from folder` من Command Palette أو اضغط **"Extract concepts (folder)"** في sidebar، ثم اختر مجلدا لمعالجة كل الملاحظات الموجودة فيه.
   - ستقرأ الإضافة الملفات، وتحدد المفاهيم، وتنشئ ملاحظات جديدة لها داخل **Concept Note Folder** المخصصة، مع إبقاء ملفاتك الأصلية دون تغيير.

9. **Create Wiki-Link & Generate Note from Selection**:
   - هذا الأمر القوي يبسّط عملية إنشاء concept notes جديدة وتعبئتها.
   - حدد كلمة أو عبارة داخل المحرر.
   - شغّل الأمر `Notemd: Create Wiki-Link & Generate Note from Selection`، ويفضل ربطه باختصار لوحة مفاتيح مثل `Cmd+Shift+W`.
   - ستقوم الإضافة بما يلي:
     1. استبدال النص المحدد بـ `[[wiki-link]]`.
     2. التحقق مما إذا كانت هناك ملاحظة تحمل العنوان نفسه داخل **Concept Note Folder**.
     3. إذا كانت موجودة، فستضيف backlink إلى الملاحظة الحالية.
     4. وإذا لم تكن موجودة، فستنشىء ملاحظة جديدة فارغة.
     5. ثم ستشغّل تلقائيا أمر **"Generate Content from Title"** على الملاحظة الجديدة أو الموجودة مسبقا لتعبئتها بمحتوى مولد بالذكاء الاصطناعي.

10. **Extract Concepts and Generate Titles**:
    - هذا الأمر يربط ميزتين قويتين ضمن workflow واحد.
    - شغّل الأمر `Notemd: Extract Concepts and Generate Titles` من Command Palette، ويفضل تخصيص hotkey له.
    - تقوم الإضافة بما يلي:
      1. تشغيل مهمة **"Extract concepts (current file)"** أولا على الملف النشط حاليا.
      2. ثم تشغيل **"Batch generate from titles"** تلقائيا على المجلد المضبوط في settings كـ **Concept note folder path**.
    - يتيح لك ذلك إنشاء قاعدة مفاهيم من مستند مصدر ثم ملء تلك concept notes الجديدة بمحتوى مولد بالذكاء الاصطناعي في خطوة واحدة.

11. **Extract Specific Original Text**:
    - اضبط أسئلتك داخل الإعدادات في قسم "Extract Specific Original Text".
    - استخدم زر "Extract Specific Original Text" في sidebar لمعالجة الملف النشط.
    - **Merged Mode**: يسرّع العملية بإرسال جميع الأسئلة في prompt واحدة.
    - **Translation**: يضيف ترجمة للنص المستخرج إلى اللغة التي اخترتها.
    - **Custom Output**: يسمح لك بتحديد مكان الحفظ وطريقة تسمية الملف المستخرج.

12. **Batch Mermaid Fix**:
    - استخدم زر "Batch Mermaid Fix" في sidebar لفحص مجلد وتصحيح أخطاء Mermaid syntax الشائعة.
    - ستنشئ الإضافة ملفا باسم `mermaid_error_{foldername}.md` يسرد الملفات التي لا تزال تحتوي على أخطاء.
    - ويمكن أيضا ضبط الإضافة لنقل هذه الملفات إلى مجلد منفصل لمراجعتها.

## موفرو LLM المدعومون

| المزود | النوع | هل يتطلب API Key | ملاحظات |
|---|---|---|---|
| DeepSeek | سحابي | نعم | endpoint أصلي لـ DeepSeek مع handling خاص بنماذج reasoning |
| Qwen | سحابي | نعم | preset لوضع DashScope compatible لموديلات Qwen / QwQ |
| Qwen Code | سحابي | نعم | preset برمجي لموديلات Qwen coder |
| Doubao | سحابي | نعم | preset لـ Volcengine Ark؛ عادة يضبط حقل model على endpoint ID |
| Moonshot | سحابي | نعم | endpoint رسمي لـ Kimi / Moonshot |
| GLM | سحابي | نعم | endpoint رسمي OpenAI-compatible لـ Zhipu BigModel |
| Z AI | سحابي | نعم | endpoint دولي OpenAI-compatible لـ GLM/Zhipu ويكمل `GLM` |
| MiniMax | سحابي | نعم | endpoint رسمي لـ chat-completions من MiniMax |
| Huawei Cloud MaaS | سحابي | نعم | endpoint OpenAI-compatible لـ Huawei ModelArts MaaS |
| Baidu Qianfan | سحابي | نعم | endpoint رسمي OpenAI-compatible لـ Qianfan من أجل نماذج ERNIE |
| SiliconFlow | سحابي | نعم | endpoint رسمي OpenAI-compatible لـ SiliconFlow لموديلات OSS المستضافة |
| OpenAI | سحابي | نعم | يدعم نماذج GPT وسلسلة o |
| Anthropic | سحابي | نعم | يدعم Claude |
| Google | سحابي | نعم | يدعم Gemini |
| Mistral | سحابي | نعم | يدعم Mistral وCodestral |
| Azure OpenAI | سحابي | نعم | يتطلب Endpoint وAPI Key وdeployment name وAPI Version |
| OpenRouter | بوابة | نعم | وصول إلى مزودين متعددين عبر OpenRouter model IDs |
| xAI | سحابي | نعم | endpoint أصلي لـ Grok |
| Groq | سحابي | نعم | OpenAI-compatible inference سريع للموديلات المفتوحة المستضافة |
| Together | سحابي | نعم | endpoint OpenAI-compatible للموديلات المفتوحة المستضافة |
| Fireworks | سحابي | نعم | endpoint استدلال OpenAI-compatible |
| Requesty | بوابة | نعم | موجّه متعدد المزودين خلف API key واحدة |
| OpenAI Compatible | بوابة | اختياري | preset عام لـ LiteLLM وvLLM وPerplexity وVercel AI Gateway وغير ذلك |
| LMStudio | محلي | اختياري (`EMPTY`) | تشغيل النماذج محليا عبر خادم LM Studio |
| Ollama | محلي | لا | تشغيل النماذج محليا عبر خادم Ollama |

*ملاحظة: بالنسبة للمزودين المحليين، مثل LMStudio وOllama، تأكد من أن الخادم المحلي يعمل ويمكن الوصول إليه عبر Base URL المضبوطة.*
*ملاحظة: بالنسبة لـ OpenRouter وRequesty، استخدم model identifier الكامل الذي تظهره البوابة، مثل `google/gemini-flash-1.5` أو `anthropic/claude-3-7-sonnet-latest`.*
*ملاحظة: `Doubao` يتوقع عادة Ark endpoint أو deployment ID داخل حقل model بدلا من اسم family model الخام. وتعرض شاشة الإعدادات تحذيرا إذا كانت القيمة placeholder وما زالت تمنع test connection حتى تستبدلها بـ endpoint ID حقيقي.*
*ملاحظة: `Z AI` يستهدف الخط الدولي `api.z.ai`، بينما يحتفظ `GLM` بـ mainland China BigModel endpoint. اختر الـ preset الموافقة لمنطقة حسابك.*
*ملاحظة: presets التي تركز على المزودين الصينيين تستخدم chat-first connection checks بحيث يتحقق الاختبار من model أو deployment الفعلي وليس فقط من وصول API key.*
*ملاحظة: `OpenAI Compatible` مخصص للبوابات والـ proxies المخصصة. اضبط Base URL وسياسة API key وmodel ID حسب وثائق مزودك.*

## استخدام الشبكة ومعالجة البيانات

يعمل Notemd محليا داخل Obsidian، لكن بعض الميزات ترسل طلبات خارجية.

### استدعاءات مزودي LLM (قابلة للضبط)

- Trigger: معالجة الملفات، والتوليد، والترجمة، وتلخيص البحث، وتلخيص Mermaid، وإجراءات الاتصال والتشخيص.
- Endpoint: Base URL الخاصة بالمزود كما تضبطها داخل إعدادات Notemd.
- البيانات المرسلة: prompt text ومحتوى المهمة المطلوب للمعالجة.
- ملاحظة عن التعامل مع البيانات: يتم ضبط API keys محليا داخل إعدادات الإضافة وتستخدم لتوقيع الطلبات من جهازك مباشرة.

### طلبات بحث الويب (اختيارية)

- Trigger: عند تفعيل web research واختيار search provider.
- Endpoint: Tavily API أو DuckDuckGo endpoints.
- البيانات المرسلة: search query الخاصة بك وrequest metadata اللازمة.

### تشخيصات المطور وسجلات التصحيح (اختيارية)

- Trigger: API debug mode وإجراءات developer diagnostic.
- التخزين: يتم حفظ diagnostic logs وerror logs داخل جذر الـ vault، مثل `Notemd_Provider_Diagnostic_*.txt` و `Notemd_Error_Log_*.txt`.
- ملاحظة المخاطر: قد تتضمن السجلات مقاطع من requests وresponses. راجعها قبل مشاركتها علنا.

### التخزين المحلي

- يتم حفظ إعدادات الإضافة في `.obsidian/plugins/notemd/data.json`.
- يتم حفظ الملفات المولدة والتقارير والسجلات الاختيارية داخل الـ vault حسب إعداداتك.

## استكشاف الأخطاء وإصلاحها

### المشاكل الشائعة
- **الإضافة لا يتم تحميلها**: تأكد من وجود `manifest.json` و `main.js` و `styles.css` داخل المجلد الصحيح: `<Vault>/.obsidian/plugins/notemd/` ثم أعد تشغيل Obsidian. كما يجدر فحص Developer Console عبر (`Ctrl+Shift+I` أو `Cmd+Option+I`) لرؤية أخطاء الإقلاع.
- **فشل المعالجة أو أخطاء API**:
  1. **تحقق من نوع الملف**: تأكد من أن الملف الذي تحاول معالجته أو التحقق منه يحمل الامتداد `.md` أو `.txt`. يدعم Notemd حاليا هذه الصيغ النصية فقط.
  2. استخدم الأمر أو الزر "Test LLM Connection" للتحقق من إعدادات المزود النشط.
  3. راجع API Key وBase URL وModel Name وAPI Version، بالنسبة لـ Azure، وتأكد من صحة API key ووجود رصيد وصلاحيات كافية.
  4. تأكد من أن خادم LLM المحلي، مثل LMStudio أو Ollama، يعمل وأن Base URL صحيحة، مثل `http://localhost:1234/v1` بالنسبة لـ LMStudio.
  5. تحقق من اتصال الإنترنت عند استخدام مزودين سحابيين.
  6. **لأخطاء معالجة ملف واحد:** راجع Developer Console للحصول على رسائل الخطأ التفصيلية. ويمكنك نسخها من زر النسخ الموجود في error modal إذا لزم الأمر.
  7. **لأخطاء المعالجة الدفعية:** تحقق من ملف `error_processing_filename.log` داخل جذر الـ vault للحصول على رسائل مفصلة لكل ملف فشل. وقد تعرض Developer Console أو error modal ملخصا فقط.
  8. **سجلات الخطأ التلقائية:** إذا فشلت عملية ما، فإن الإضافة تحفظ تلقائيا ملف سجل مفصلا باسم `Notemd_Error_Log_[Timestamp].txt` في جذر الـ vault. يحتوي هذا الملف على رسالة الخطأ وstack trace وسجلات الجلسة. إذا واجهت مشكلة متكررة، فابدأ بمراجعته. وعند تفعيل "API Error Debugging Mode" سيحتوي الملف على تفاصيل أوسع عن استجابات API.
  9. **تشخيص الطلبات الطويلة على endpoint الحقيقي (للمطورين)**:
     - داخل الإضافة، وهو المسار الموصى به أولا: استخدم **Settings -> Notemd -> Developer provider diagnostic (long request)** لتشغيل runtime probe على المزود النشط وإنشاء `Notemd_Provider_Diagnostic_*.txt` في جذر الـ vault.
     - عبر CLI وخارج runtime الخاص بـ Obsidian: للحصول على مقارنة قابلة للإعادة بين buffered behavior وstreaming behavior على مستوى endpoint، استخدم:
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
       يحتوي التقرير الناتج على توقيتات كل محاولة، مثل `First Byte` و `Duration`، بالإضافة إلى sanitized request metadata وresponse headers وraw أو partial body fragments وparsed stream fragments ونقاط الفشل على مستوى transport layer.
- **مشاكل الاتصال مع LM Studio أو Ollama**:
  - **فشل اختبار الاتصال**: تأكد من أن الخادم المحلي، سواء LM Studio أو Ollama، قيد التشغيل وأن النموذج المطلوب محمل أو متاح.
  - **أخطاء CORS مع Ollama على Windows**: إذا ظهرت أخطاء CORS، فقد تحتاج إلى ضبط متغير البيئة `OLLAMA_ORIGINS`. مثلا يمكنك تشغيل `set OLLAMA_ORIGINS=*` في command prompt قبل تشغيل Ollama.
  - **فعّل CORS في LM Studio**: بالنسبة إلى LM Studio، يمكنك تفعيل CORS مباشرة من إعدادات الخادم، وقد يكون ذلك ضروريا إذا كان Obsidian يعمل داخل متصفح أو يخضع لسياسات origin صارمة.
- **أخطاء إنشاء المجلدات ("File name cannot contain...")**:
  - يعني هذا عادة أن المسار الذي أدخلته في الإعدادات، مثل **Processed File Folder Path** أو **Concept Note Folder Path**، غير صالح **بالنسبة لـ Obsidian**.
  - تأكد من أنك تستخدم **مسارات نسبية**، مثل `Processed` أو `Notes/Concepts`، وليس مسارات مطلقة، مثل `C:\Users\...` أو `/Users/...`.
  - افحص وجود الرموز غير المسموح بها: `* " \ / < > : | ? # ^ [ ]`. لاحظ أن `\` غير صالح في مسارات Obsidian حتى على Windows. استخدم `/` كفاصل مسار.
- **مشاكل الأداء**: قد تستغرق معالجة الملفات الكبيرة أو الكثير من الملفات وقتا. جرّب تقليل إعداد "Chunk Word Count" للحصول على استدعاءات أكثر ولكن أسرع. كما يمكن تجربة مزود أو نموذج آخر.
- **روابط غير متوقعة**: تعتمد جودة إضافة الروابط بدرجة كبيرة على LLM والـ prompt. جرّب نماذج أخرى أو درجات Temperature مختلفة.

## المساهمة

المساهمات مرحب بها. يرجى الرجوع إلى مستودع GitHub للإرشادات: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## وثائق المشرف

- [سير عمل الإصدار (بالإنجليزية)](./docs/maintainer/release-workflow.md)
- [سير عمل الإصدار (بالصينية المبسطة)](./docs/maintainer/release-workflow.zh-CN.md)

## الترخيص

رخصة MIT. راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

*Notemd v1.8.3 - عزّز الرسم المعرفي في Obsidian باستخدام الذكاء الاصطناعي.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
