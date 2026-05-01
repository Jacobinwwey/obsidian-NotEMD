![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json) ![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)

# תוסף Notemd עבור Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

קראו את התיעוד בשפות נוספות: [מרכז השפות](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 העשרת ידע רב-לשוני המונעת על ידי AI
==================================================
```

דרך קלה ליצור בסיס ידע משלכם.

Notemd משפר את תהליך העבודה שלכם ב-Obsidian באמצעות אינטגרציה עם מודלי שפה גדולים שונים (LLMs), כדי לעבד הערות רב-לשוניות, ליצור אוטומטית wiki-links עבור מושגי מפתח, ליצור concept notes תואמים, לבצע מחקר ברשת ולעזור לכם לבנות גרפי ידע חזקים ועוד.

**גרסה:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## תוכן עניינים

- [התחלה מהירה](#התחלה-מהירה)
- [תמיכה בשפות](#תמיכה-בשפות)
- [תכונות](#תכונות)
- [התקנה](#התקנה)
- [תצורה](#תצורה)
- [מדריך שימוש](#מדריך-שימוש)
- [ספקי LLM נתמכים](#ספקי-llm-נתמכים)
- [שימוש ברשת וטיפול בנתונים](#שימוש-ברשת-וטיפול-בנתונים)
- [פתרון בעיות](#פתרון-בעיות)
- [תרומה](#תרומה)
- [תיעוד למתחזקים](#תיעוד-למתחזקים)
- [רישיון](#רישיון)

## התחלה מהירה

1.  **התקינו והפעילו**: קבלו את התוסף מ-Obsidian Marketplace.
2.  **הגדירו LLM**: עברו אל `Settings -> Notemd`, בחרו את ספק ה-LLM שבו תרצו להשתמש (למשל OpenAI או ספק מקומי כמו Ollama), והזינו את מפתח ה-API / כתובת ה-URL.
3.  **פתחו את סרגל הצד**: לחצו על אייקון המטה של Notemd ברצועה השמאלית כדי לפתוח את סרגל הצד.
4.  **עיבוד הערה**: פתחו כל הערה ולחצו על **"Process File (Add Links)"** בסרגל הצד כדי להוסיף אוטומטית `[[wiki-links]]` למושגי מפתח.
5.  **הריצו זרימת עבודה מהירה**: השתמשו בכפתור ברירת המחדל **"One-Click Extract"** כדי לשרשר עיבוד, יצירה באצווה וניקוי Mermaid מנקודת כניסה אחת.

זה הכול. חקרו את ההגדרות כדי לפתוח אפשרויות נוספות כמו מחקר ברשת, תרגום ויצירת תוכן.

## תמיכה בשפות

### חוזה התנהגות שפה

| היבט | היקף | ברירת מחדל | הערות |
|---|---|---|---|
| `שפת הממשק` | טקסט ממשק התוסף בלבד (הגדרות, סרגל צד, הודעות, דיאלוגים) | `auto` | עוקב אחר שפת Obsidian; קטלוגי ה-UI הנוכחיים הם `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `שפת פלט המשימות` | פלט משימות שנוצר על ידי LLM (קישורים, סיכומים, יצירה, חילוץ, שפת יעד לתרגום) | `en` | יכול להיות גלובלי או לפי משימה כאשר `השתמש בשפות שונות למשימות` מופעל. |
| `השבת תרגום אוטומטי` | משימות שאינן `Translate` שומרות על הקשר שפת המקור | `false` | משימות `Translate` מפורשות עדיין אוכפות את שפת היעד שהוגדרה. |
| גיבוי מקומי | פתרון מפתחות UI חסרים | locale -> `en` | שומר על יציבות ה-UI כאשר חלק מהמפתחות אינם מתורגמים. |

- מסמכי המקור המתוחזקים הם באנגלית ובסינית מפושטת, ותרגומי README שפורסמו מקושרים בכותרת למעלה.
- כיסוי שפות הממשק בתוך האפליקציה תואם כעת במדויק לקטלוג המפורש שבקוד: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- הנפילה חזרה לאנגלית נשארת כרשת ביטחון מימושית, אך המשטחים הגלויים הנתמכים מכוסים בבדיקות רגרסיה ואינם אמורים לחזור בשקט לאנגלית בשימוש רגיל.
- פרטים נוספים והנחיות לתרומה מתועדים ב-[מרכז השפות](./docs/i18n/README.md).

## תכונות

### עיבוד מסמכים מונע AI
- **תמיכה ב-Multi-LLM**: התחברו לספקי LLM שונים בענן ובאופן מקומי (ראו [ספקי LLM נתמכים](#ספקי-llm-נתמכים)).
- **חלוקה חכמה**: מפצל אוטומטית מסמכים גדולים למקטעים ניתנים לניהול על בסיס מספר מילים.
- **שמירת תוכן**: שואף לשמור על הפורמט המקורי תוך הוספת מבנה וקישורים.
- **מעקב התקדמות**: עדכונים בזמן אמת דרך Notemd Sidebar או חלון התקדמות.
- **פעולות ניתנות לביטול**: ניתן לבטל כל משימת עיבוד (בודדת או אצווה) שהופעלה מסרגל הצד דרך כפתור ביטול ייעודי. פעולות מלוח הפקודות משתמשות בחלון התקדמות שניתן גם לבטל.
- **תצורת ריבוי מודלים**: השתמשו בספקי LLM שונים *וב*מודלים ספציפיים למשימות שונות (Add Links, Research, Generate Title, Translate), או השתמשו בספק יחיד לכל המשימות.
- **Stable API Calls (Retry Logic)**: אפשרו באופן אופציונלי ניסיונות חוזרים אוטומטיים לקריאות LLM API שנכשלו, עם מרווחי זמן ומגבלות ניסיונות שניתנים להגדרה.
- **בדיקות חיבור עמידות לספקים**: אם בדיקת הספק הראשונה נתקלת בניתוק רשת זמני, Notemd עובר כעת לרצף ניסיונות חוזרים יציב לפני כישלון, כולל transport של OpenAI-compatible, Anthropic, Google, Azure OpenAI ו-Ollama.
- **Fallback של transport לפי סביבת ריצה**: כאשר בקשה ארוכה לספק נופלת דרך `requestUrl` בשל שגיאות רשת זמניות כגון `ERR_CONNECTION_CLOSED`, Notemd מנסה כעת שוב את אותו ניסיון דרך transport חלופי תואם-סביבה לפני כניסה ללולאת ה-retry שהוגדרה: build-ים שולחניים משתמשים ב-Node `http/https`, וסביבות שאינן שולחניות משתמשות ב-`fetch` של הדפדפן. כך מצטמצמים כישלונות שווא ב-gateway איטיים ו-reverse proxy.
- **חיזוק שרשרת בקשות ארוכות ב-OpenAI-compatible**: במצב יציב, קריאות OpenAI-compatible משתמשות כעת בסדר מפורש של 3 שלבים לכל ניסיון: direct streaming transport ראשי, לאחריו direct non-stream transport, ואז fallback דרך `requestUrl` (שעדיין יכול להשתדרג ל-streamed parsing בעת הצורך). הדבר מפחית false negative במצבים שבהם הספק משלים buffered responses אך streaming pipes אינם יציבים.
- **Fallback של streaming מודע-פרוטוקול בכל API-י LLM**: ניסיונות fallback ארוכי-טווח משדרגים כעת ל-streamed parsing מודע-פרוטוקול בכל נתיב LLM מובנה, לא רק ב-endpoint מסוג OpenAI-compatible. Notemd מטפל כעת ב-OpenAI/Azure-style SSE, ב-Anthropic Messages streaming, ב-Google Gemini SSE responses וב-Ollama NDJSON streams הן ב-`http/https` שולחני והן ב-`fetch` שאינו שולחני, ושאר direct OpenAI-style provider entrypoints ממחזרים את אותו shared fallback path.
- **Presets מוכנים לשוק הסיני**: ה-presets המובנים מכסים כעת את `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` ו-`SiliconFlow`, בנוסף לספקים הגלובליים והמקומיים הקיימים.
- **עיבוד אצווה אמין**: לוגיקת עיבוד מקבילי משופרת עם **קריאות API מדורגות** עוזרת למנוע שגיאות rate-limit ולהבטיח ביצועים יציבים בעבודות אצווה גדולות. היישום החדש מבטיח שהמשימות מתחילות במרווחי זמן שונים ולא כולן יחד.
- **דיווח התקדמות מדויק**: תוקן באג שבו פס ההתקדמות היה עלול להיתקע, כך שה-UI משקף כעת תמיד את מצב הפעולה האמיתי.
- **עיבוד אצווה מקבילי קשיח יותר**: נפתרה בעיה שבה פעולות אצווה מקבילות נעצרו מוקדם מדי, כך שכעת כל הקבצים מעובדים באופן אמין ויעיל.
- **דיוק פס ההתקדמות**: תוקן באג שבו פס ההתקדמות עבור הפקודה "Create Wiki-Link & Generate Note" נתקע ב-95%, וכעת מוצג 100% בסיום.
- **ניפוי API מורחב**: "API Error Debugging Mode" לוכד כעת גופי תגובה מלאים מספקי LLM ומשירותי חיפוש (Tavily/DuckDuckGo), וגם מתעד ציר זמן של transport לכל ניסיון עם request URLs מנוקים, משך זמן, response headers, partial response bodies, parsed partial stream content ועקבות מחסנית לצורך פתרון תקלות טוב יותר ב-OpenAI-compatible, Anthropic, Google, Azure OpenAI ו-Ollama fallbacks.
- **פאנל Developer Mode**: ההגדרות כוללות כעת פאנל diagnostics ייעודי למפתחים בלבד, אשר נשאר מוסתר עד שהאפשרות "Developer mode" מופעלת. הוא תומך בבחירת diagnostic call paths ובהרצת stability probes חוזרים למצב שנבחר.
- **סרגל צד מעוצב מחדש**: הפעולות המובנות מקובצות כעת למקטעים ממוקדים יותר, עם תוויות ברורות יותר, סטטוס חי, התקדמות ניתנת לביטול ו-logs ניתנים להעתקה כדי להפחית עומס בסרגל הצד. ה-footer של progress/log נשאר גלוי גם כאשר כל המקטעים מורחבים, והמצב המוכן משתמש ב-standby progress track ברור יותר.
- **שיפור אינטראקציה וקריאות בסרגל הצד**: כפתורי הסרגל מספקים כעת משוב ברור יותר במעבר/לחיצה/פוקוס, והכפתורים הצבעוניים של CTA, כולל `One-Click Extract` ו-`Batch generate from titles`, משתמשים בניגודיות טקסט חזקה יותר לקריאות טובה יותר במגוון ערכות נושא.
- **מיפוי CTA לפעולות קובץ יחיד בלבד**: סגנון CTA צבעוני שמור כעת רק לפעולות על קובץ בודד. פעולות אצווה/ברמת תיקייה וזרימות עבודה מעורבות משתמשות בסגנון שאינו CTA כדי לצמצם לחיצות שגויות הנובעות מהערכת היקף פעולה לא נכונה.
- **זרימות עבודה מותאמות בלחיצה אחת**: הפכו כלי עזר מובנים בסרגל הצד לכפתורים מותאמים לשימוש חוזר, עם שמות בהגדרת המשתמש ושרשראות פעולות מורכבות. זרימת `One-Click Extract` ברירת מחדל כלולה מהקופסה.

### שיפור גרף ידע
- **wiki-linking אוטומטי**: מזהה מושגי ליבה ומוסיף `[[wiki-links]]` להערות המעובדות שלכם על בסיס פלט ה-LLM.
- **יצירת concept notes (אופציונלית וניתנת להתאמה)**: יוצרת אוטומטית הערות חדשות עבור מושגים שהתגלו בתיקייה מוגדרת ב-vault.
- **נתיבי פלט ניתנים להתאמה**: הגדירו נתיבים יחסיים נפרדים בתוך ה-vault לשמירת קבצים מעובדים ו-concept notes חדשים.
- **שמות קובצי פלט ניתנים להתאמה (Add Links)**: ניתן *לדרוס את הקובץ המקורי* או להשתמש ב-suffix / replacement string מותאם במקום `_processed.md` בעת עיבוד קבצים לקישורים.
- **שמירה על שלמות קישורים**: טיפול בסיסי בעדכון קישורים כאשר הערות משנות שם או נמחקות בתוך ה-vault.
- **חילוץ מושגים טהור**: חלצו מושגים וצרו concept notes תואמים בלי לשנות את המסמך המקורי. תכונה זו אידיאלית למילוי בסיס ידע ממסמכים קיימים מבלי לשנותם. היא כוללת אפשרויות מתכווננות ליצירת concept notes מינימליים ולהוספת backlinks.

### תרגום

- **תרגום מבוסס AI**:
    - תרגמו תוכן של הערות באמצעות ה-LLM שהוגדר.
    - **תמיכה בקבצים גדולים**: קבצים גדולים מפוצלים אוטומטית לקטעים קטנים יותר על בסיס `Chunk word count` לפני שליחתם ל-LLM. לאחר מכן הקטעים המתורגמים מאוחדים מחדש למסמך יחיד.
    - תומך בתרגום בין שפות מרובות.
    - שפת היעד ניתנת להתאמה בהגדרות או ב-UI.
    - פותח אוטומטית את הטקסט המתורגם בצד ימין של הטקסט המקורי לקריאה קלה.
- **תרגום אצווה**:
    - תרגמו את כל הקבצים בתוך תיקייה שנבחרה.
    - תומך בעיבוד מקבילי כאשר "Enable Batch Parallelism" מופעל.
    - משתמש ב-custom prompts לתרגום אם הוגדרו.
	- מוסיף אפשרות "Batch translate this folder" לתפריט ההקשר של סייר הקבצים.
- **השבתת תרגום אוטומטי**: כאשר אפשרות זו מופעלת, משימות שאינן `Translate` אינן כופות עוד פלט לשפה מסוימת, וכך נשמר הקשר השפה המקורית. משימת "Translate" המפורשת עדיין תבצע תרגום בהתאם להגדרה.

### מחקר אינטרנט ויצירת תוכן
- **מחקר אינטרנט וסיכום**:
    - בצעו חיפוש באינטרנט באמצעות Tavily (דורש API key) או DuckDuckGo (ניסיוני).
    - **עמידות חיפוש משופרת**: חיפוש DuckDuckGo כולל כעת לוגיקת parsing משופרת (DOMParser עם Regex fallback) כדי להתמודד עם שינויי פריסה ולהבטיח תוצאות אמינות.
    - סכמו את תוצאות החיפוש באמצעות ה-LLM שהוגדר.
    - שפת הפלט של הסיכום ניתנת להתאמה בהגדרות.
    - הוסיפו את הסיכומים להערה הנוכחית.
    - מגבלת token ניתנת להגדרה לתוכן מחקרי שנשלח ל-LLM.
- **יצירת תוכן מכותרת**:
    - השתמשו בכותרת ההערה כדי ליצור תוכן ראשוני דרך LLM, תוך החלפת התוכן הקיים.
    - **מחקר אופציונלי**: הגדירו האם לבצע מחקר אינטרנט (באמצעות הספק הנבחר) כדי לספק הקשר ליצירה.
- **יצירת תוכן באצווה מכותרות**: יוצרת תוכן לכל ההערות בתוך תיקייה שנבחרה על בסיס הכותרות שלהן (תוך כיבוד הגדרת המחקר האופציונלית). קבצים שמעובדים בהצלחה מועברים ל-**תת-תיקיית "complete" ניתנת להגדרה** (למשל `[foldername]_complete` או שם מותאם) כדי למנוע עיבוד חוזר.
- **צימוד ל-Mermaid Auto-Fix**: כאשר תיקון Mermaid האוטומטי מופעל, זרימות עבודה שקשורות ל-Mermaid מתקנות אוטומטית קבצים שנוצרו או תיקיות פלט לאחר העיבוד. זה כולל את הזרימות Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid ו-Translate.

### תכונות עזר
- **סיכום כתרשים Mermaid**:
    - תכונה זו מאפשרת לכם לסכם את תוכן ההערה לדיאגרמת Mermaid.
    - שפת הפלט של דיאגרמת Mermaid ניתנת להתאמה בהגדרות.
    - **Mermaid Output Folder**: הגדירו את התיקייה שבה יישמרו קבצי הדיאגרמות שנוצרו.
    - **Translate Summarize to Mermaid Output**: מתרגם אופציונלית את תוכן דיאגרמת Mermaid שנוצר לשפת היעד שהוגדרה.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **תיקון פשוט של פורמט נוסחאות**:
    - מתקן במהירות נוסחאות מתמטיות בשורה אחת שמופרדות ב-`$` יחיד לבלוקים תקניים עם `$$`.
    - **קובץ יחיד**: עבדו את הקובץ הנוכחי דרך כפתור הסרגל הצדדי או דרך לוח הפקודות.
    - **תיקון אצווה**: עבדו את כל הקבצים בתיקייה נבחרת דרך כפתור הסרגל הצדדי או דרך לוח הפקודות.

- **בדיקת כפילויות בקובץ הנוכחי**: פקודה זו מסייעת בזיהוי מונחים כפולים פוטנציאליים בתוך הקובץ הפעיל.
- **איתור כפילויות**: בדיקה בסיסית למילים כפולות בתוכן הקובץ המעובד כעת (התוצאות נרשמות לקונסול).
- **Check and Remove Duplicate Concept Notes**: מזהה הערות כפולות פוטנציאליות בתוך **Concept Note Folder** שהוגדר, על בסיס התאמות שמות מדויקות, ריבוי, נרמול והכלה של מילה בודדת ביחס להערות שמחוץ לתיקייה. ניתן להגדיר את היקף ההשוואה (**כל ה-vault**, **תיקיות מסוימות בלבד**, או **כל התיקיות פרט למוחרגות מסוימות**). מציג רשימה מפורטת עם סיבות וקבצים מתנגשים, ואז מבקש אישור לפני העברת הכפילויות שזוהו לאשפת המערכת. מציג התקדמות במהלך המחיקה.
- **Batch Mermaid Fix**: מחיל תיקוני תחביר של Mermaid ו-LaTeX על כל קבצי Markdown שבתיקייה שנבחרה על ידי המשתמש.
    - **Workflow Ready**: ניתן להשתמש בו ככלי עזר עצמאי או כשלב בתוך כפתור זרימת עבודה מותאם בלחיצה אחת.
    - **Error Reporting**: יוצר דוח `mermaid_error_{foldername}.md` המפרט קבצים שעדיין מכילים שגיאות Mermaid פוטנציאליות לאחר העיבוד.
    - **Move Error Files**: מעביר אופציונלית קבצים עם שגיאות שזוהו לתיקייה ייעודית לבדיקת ידנית.
    - **Smart Detection**: כעת בודק באופן חכם קבצים לשגיאות תחביר באמצעות `mermaid.parse` לפני ניסיון תיקון, וכך חוסך זמן עיבוד ונמנע מעריכות מיותרות.
    - **Safe Processing**: מבטיח שתיקוני תחביר יוחלו רק על בלוקי קוד של Mermaid, ובכך מונע שינוי מקרי של טבלאות Markdown או תוכן אחר. כולל אמצעי הגנה חזקים להגנה על תחביר טבלאות (למשל `| :--- |`) מפני תיקוני debug אגרסיביים.
    - **Deep Debug Mode**: אם שגיאות נשארות לאחר התיקון הראשוני, מופעל מצב deep debug מתקדם. מצב זה מטפל במקרי קצה מורכבים, כולל:
        - **Comment Integration**: ממזג אוטומטית הערות סופיות (המתחילות ב-`%`) אל תוך תווית הקשת (למשל `A -- Label --> B; % Comment` הופך ל-`A -- "Label(Comment)" --> B;`).
        - **Malformed Arrows**: מתקן חיצים שנבלעו בתוך מרכאות (למשל `A -- "Label -->" B` הופך ל-`A -- "Label" --> B`).
        - **Inline Subgraphs**: ממיר תוויות subgraph inline לתוויות קשת.
        - **Reverse Arrow Fix**: מתקן חיצים לא סטנדרטיים `X <-- Y` ל-`Y --> X`.
        - **Direction Keyword Fix**: מבטיח שמילת המפתח `direction` תהיה באותיות קטנות בתוך subgraphs (למשל `Direction TB` -> `direction TB`).
        - **Comment Conversion**: ממיר הערות `//` לתוויות קשת (למשל `A --> B; // Comment` -> `A -- "Comment" --> B;`).
        - **Duplicate Label Fix**: מפשט תוויות כפולות בסוגריים מרובעים (למשל `Node["Label"]["Label"]` -> `Node["Label"]`).
        - **Invalid Arrow Fix**: ממיר תחביר חץ שגוי `--|>` ל-`-->` התקני.
        - **Robust Label & Note Handling**: טיפול משופר בתוויות המכילות תווים מיוחדים (כמו `/`) ותמיכה טובה יותר בתחביר note מותאם (`note for ...`), כדי להבטיח שארטיפקטים כמו סוגריים מיותרים יוסרו באופן נקי.
        - **Advanced Fix Mode**: כולל תיקונים חזקים לתוויות צומת ללא מרכאות המכילות רווחים, תווים מיוחדים או סוגריים מקוננים (למשל `Node[Label [Text]]` -> `Node["Label [Text]"]`), להבטחת תאימות עם דיאגרמות מורכבות כמו מסלולי Stellar Evolution. בנוסף מתקן תוויות קשת פגומות (למשל `--["Label["-->` ל-`-- "Label" -->`). כמו כן ממיר הערות inline (`Consensus --> Adaptive; # Some advanced consensus` ל-`Consensus -- "Some advanced consensus" --> Adaptive`) ומתקן מרכאות לא סגורות בסוף שורות (`;"` בסוף מוחלף ב-`"]`).
                        - **Note Conversion**: ממיר אוטומטית `note right/left of` והערות `note :` עצמאיות להגדרות סטנדרטיות של צמתי Mermaid וקשרים (למשל `note right of A: text` הופך ל-`NoteA["Note: text"]` המקושר ל-`A`), מה שמונע שגיאות תחביר ומשפר את הפריסה. תומך כעת הן בקשרי חץ (`-->`) והן בקשרים מלאים (`---`).
                        - **Extended Note Support**: ממיר אוטומטית `note for Node "Content"` ו-`note of Node "Content"` לצמתי note מקושרים סטנדרטיים (למשל `NoteNode[" Content"]` המחובר ל-`Node`), כדי להבטיח תאימות לתחביר מורחב של המשתמש.
                        - **Enhanced Note Correction**: משנה אוטומטית שמות של notes עם מספור רציף (למשל `Note1`, `Note2`) כדי למנוע בעיות aliasing כאשר קיימות מספר הערות.                - **Parallelogram/Shape Fix**: מתקן צורות צומת פגומות כמו `[/["Label["/]` ל-`["Label"]` הסטנדרטי, כדי להבטיח תאימות עם התוכן שנוצר.
                        - **Standardize Pipe Labels**: מתקן ומתקנן אוטומטית תוויות קשת המכילות pipe, ומוודא שהן מצוטטות נכון (למשל `-->|Text|` הופך ל-`-->|"Text"|` ו-`-->|Math|^2|` ל-`-->|"Math|^2"|`).
        - **Misplaced Pipe Fix**: מתקן תוויות קשת שמופיעות בטעות לפני החץ (למשל `>|"Label"| A --> B` הופך ל-`A -->|"Label"| B`).
                - **Merge Double Labels**: מזהה וממזג תוויות כפולות מורכבות על אותה קשת (למשל `A -- Label1 -- Label2 --> B` או `A -- Label1 -- Label2 --- B`) לתווית יחידה ונקייה עם שבירות שורה (`A -- "Label1<br>Label2" --> B`).
                        - **Unquoted Label Fix**: מצטט אוטומטית תוויות צומת המכילות תווים בעייתיים פוטנציאליים (למשל מרכאות, סימני שוויון, אופרטורים מתמטיים) אך חסרות מרכאות חיצוניות (למשל `Plot[Plot "A"]` הופך ל-`Plot["Plot "A""]`), כדי למנוע שגיאות רינדור.
                        - **Intermediate Node Fix**: מפצל קשתות המכילות הגדרת צומת ביניים לשתי קשתות נפרדות (למשל `A -- B[...] --> C` הופך ל-`A --> B[...]` ו-`B[...] --> C`), כדי להבטיח תחביר Mermaid תקין.
                        - **Concatenated Label Fix**: מתקן באופן קשיח הגדרות צומת שבהן ה-ID מוצמד לתווית (למשל `SubdivideSubdivide...` הופך ל-`Subdivide["Subdivide..."]`), גם כאשר מופיעות לפניו pipe labels או כשהכפילות אינה מדויקת, באמצעות ולידציה מול node IDs מוכרים.
                        - **Extract Specific Original Text**:    - הגדירו רשימת שאלות בהגדרות.
                    - מחלץ מקטעי טקסט מילוליים מההערה הפעילה שעונים על השאלות הללו.
                    - **Merged Query Mode**: אפשרות לעבד את כל השאלות בקריאת API אחת לשם יעילות.
                    - **Translation**: אפשרות לכלול תרגומים של הטקסט שחולץ בפלט.
                    - **Custom Output**: נתיב שמירה ו-suffix לשם הקובץ של טקסט שחולץ ניתנים להתאמה.- **LLM Connection Test**: מאמת את הגדרות ה-API עבור הספק הפעיל.

## התקנה

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### מתוך Obsidian Marketplace (מומלץ)
1. פתחו ב-Obsidian את **Settings** -> **Community plugins**.
2. ודאו כי "Restricted mode" **כבוי**.
3. לחצו על **Browse** בתוספי הקהילה וחפשו "Notemd".
4. לחצו על **Install**.
5. לאחר ההתקנה לחצו על **Enable**.

### התקנה ידנית
1. הורידו את נכסי הגרסה האחרונים מ-[GitHub Releases page](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). כל גרסה כוללת גם את `README.md` לעיון, אך להתקנה ידנית דרושים רק `main.js`, `styles.css` ו-`manifest.json`.
2. נווטו אל תיקיית ההגדרות של vault ה-Obsidian שלכם: `<YourVault>/.obsidian/plugins/`.
3. צרו תיקייה חדשה בשם `notemd`.
4. העתיקו את `main.js`, `styles.css` ו-`manifest.json` אל תיקיית `notemd`.
5. הפעילו מחדש את Obsidian.
6. עברו אל **Settings** -> **Community plugins** והפעילו את "Notemd".

## תצורה

גשו להגדרות התוסף דרך:
**Settings** -> **Community Plugins** -> **Notemd** (לחצו על אייקון גלגל השיניים).

### תצורת ספק LLM
1.  **הספק הפעיל**: בחרו את ספק ה-LLM שבו תרצו להשתמש מתוך הרשימה הנפתחת.
2.  **הגדרות הספק**: הגדירו את ההגדרות הספציפיות עבור הספק שנבחר:
    *   **API Key**: נדרש עבור רוב ספקי הענן (למשל OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). אינו נדרש עבור Ollama. אופציונלי עבור LM Studio ועבור preset כללי `OpenAI Compatible` כאשר ה-endpoint שלכם מאפשר גישה אנונימית או placeholder access.
    *   **Base URL / Endpoint**: ה-API endpoint של השירות. ערכי ברירת מחדל מסופקים, אך ייתכן שתצטרכו לשנותם עבור מודלים מקומיים (LMStudio, Ollama), gateways (OpenRouter, Requesty, OpenAI Compatible), או Azure deployments מסוימים. **נדרש עבור Azure OpenAI.**
    *   **Model**: שם/מזהה המודל הספציפי שבו ייעשה שימוש (למשל `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). ודאו שהמודל זמין אצל הספק / endpoint.
    *   **Temperature**: שולט באקראיות הפלט של ה-LLM (0 = דטרמיניסטי, 1 = יצירתיות מרבית). ערכים נמוכים יותר (למשל 0.2-0.5) מתאימים בדרך כלל למשימות מובנות.
    *   **API Version (Azure Only)**: נדרש עבור Azure OpenAI deployments (למשל `2024-02-15-preview`).
3.  **בדיקת חיבור**: השתמשו בכפתור "בדיקת חיבור" עבור הספק הפעיל כדי לאמת את ההגדרות. ספקי OpenAI-compatible משתמשים כעת בבדיקות מודעות-ספק: endpoints כגון `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` ו-`OpenAI Compatible` בודקים `chat/completions` ישירות, בעוד ספקים בעלי `/models` אמין עדיין יכולים להתחיל ברשימת מודלים. אם הבדיקה הראשונה נכשלת עקב ניתוק רשת זמני כגון `ERR_CONNECTION_CLOSED`, Notemd עובר אוטומטית לרצף ה-retry היציב במקום להיכשל מיד.
4.  **ניהול תצורות ספקים**: השתמשו בכפתורי "Export Providers" ו-"Import Providers" כדי לשמור/לטעון את הגדרות הספקים שלכם אל/מ־`notemd-providers.json` בתוך תיקיית התצורה של התוסף. זה מאפשר גיבוי ושיתוף קלים.
5.  **כיסוי תצורות מוכנות**: בנוסף לספקים המקוריים, Notemd כולל כעת presets עבור `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty`, וכן יעד כללי `OpenAI Compatible` עבור LiteLLM, vLLM, Perplexity, Vercel AI Gateway או proxies מותאמים.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### תצורת ריבוי מודלים
-   **שימוש בספקים שונים למשימות**:
    *   **מושבת (ברירת מחדל)**: משתמש בספק "הספק הפעיל" יחיד לכל המשימות.
    *   **מופעל**: מאפשר לבחור ספק שונה *וגם* להחליף אופציונלית את שם המודל עבור כל משימה ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts"). אם שדה ה-model override נשאר ריק, ייעשה שימוש במודל ברירת המחדל של הספק שנבחר עבור המשימה.
-   **בחירת שפות שונות למשימות שונות**:
    *   **מושבת (ברירת מחדל)**: משתמש בשפת פלט יחידה לכל המשימות.
    *   **מופעל**: מאפשר לבחור שפה שונה לכל משימה ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### ארכיטקטורת שפה (שפת הממשק לעומת שפת פלט המשימות)

-   **שפת הממשק** שולטת רק בטקסט הממשק של התוסף (תוויות הגדרות, כפתורי סרגל צד, הודעות ודיאלוגים). מצב ברירת המחדל `auto` עוקב אחר שפת ה-UI הנוכחית של Obsidian.
-   וריאנטים אזוריים או של מערכת כתב ממופים כעת לקטלוג שפורסם הקרוב ביותר במקום ליפול מיד לאנגלית. לדוגמה, `fr-CA` משתמש בצרפתית, `es-419` משתמש בספרדית, `pt-PT` משתמש בפורטוגזית, `zh-Hans` משתמש בסינית מפושטת ו-`zh-Hant-HK` משתמש בסינית מסורתית.
-   **שפת פלט המשימות** שולטת בפלט משימות שנוצר על ידי המודל (קישורים, סיכומים, יצירת כותרות, סיכום Mermaid, חילוץ מושגים, שפת יעד לתרגום).
-   **Per-task language mode** מאפשר לכל משימה לפתור את שפת הפלט שלה מתוך שכבת מדיניות מאוחדת במקום overrides מפוזרים בכל מודול.
-   **השבתת תרגום אוטומטי** משאיר משימות שאינן `Translate` בהקשר שפת המקור, בעוד שמשימות `Translate` מפורשות עדיין אוכפות את שפת היעד שהוגדרה.
-   נתיבי יצירה הקשורים ל-Mermaid פועלים תחת אותה מדיניות שפה ויכולים עדיין להפעיל Mermaid auto-fix כשהוא זמין.

### הגדרות קריאות API יציבות
-   **הפעלת קריאות API יציבות (לוגיקת ניסיון חוזר)**:
    *   **מושבת (ברירת מחדל)**: כשל של קריאת API אחת יעצור את המשימה הנוכחית.
    *   **מופעל**: מנסה שוב אוטומטית קריאות LLM API שנכשלו (שימושי לבעיות רשת זמניות או rate limits).
    *   **Connection Test Fallback**: גם כאשר קריאות רגילות אינן פועלות עדיין ב-stable mode, בדיקות החיבור של הספקים עוברות כעת לאותו רצף retry אחרי כשל רשת זמני ראשון.
    *   **Runtime Transport Fallback (Environment-Aware)**: בקשות ארוכות שנופלות זמנית דרך `requestUrl` מנסות כעת תחילה את אותו ניסיון דרך fallback תואם-סביבה. Build-ים שולחניים משתמשים ב-Node `http/https`; סביבות שאינן שולחניות משתמשות ב-browser `fetch`. ניסיונות ה-fallback האלה משתמשים כעת ב-protocol-aware streaming parsing בכל נתיבי LLM המובנים, כולל OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE ו-Ollama NDJSON output, כך שגם gateway איטיים יוכלו להחזיר body chunks מוקדם יותר. שאר direct OpenAI-style provider entrypoints ממחזרים את אותה shared fallback path.
    *   **OpenAI-Compatible Stable Order**: ב-stable mode כל ניסיון OpenAI-compatible עוקב כעת אחרי `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` לפני שהוא נספר כניסיון שנכשל. כך נמנעים כישלונות אגרסיביים מדי כאשר רק transport mode אחד אינו יציב.
-   **Retry Interval (seconds)**: (גלוי רק כשהאפשרות מופעלת) משך ההמתנה בין ניסיונות חוזרים (1-300 שניות). ברירת מחדל: 5.
-   **Maximum Retries**: (גלוי רק כשהאפשרות מופעלת) מספר ניסיונות החזרה המרבי (0-10). ברירת מחדל: 3.
-   **מצב ניפוי שגיאות API**:
    *   **מושבת (ברירת מחדל)**: משתמש בדיווח שגיאות סטנדרטי ותמציתי.
    *   **מופעל**: מפעיל רישום שגיאות מפורט (בדומה ל-verbose output של DeepSeek) עבור כל הספקים והמשימות (כולל Translate, Search ו-Connection Tests). זה כולל HTTP status codes, raw response text, request transport timelines, request URLs מנוקים ו-headers, משכי ניסיונות, response headers, partial response bodies, parsed partial stream output ועקבות מחסנית — נתונים חיוניים לפתרון תקלות חיבור API ואיפוסי upstream gateway.
-   **Developer Mode**:
    *   **מושבת (ברירת מחדל)**: מסתיר את כל פקדי האבחון המיועדים למפתחים ממשתמשים רגילים.
    *   **מופעל**: מציג פאנל diagnostics ייעודי למפתחים ב-Settings.
-   **Developer Provider Diagnostic (Long Request)**:
    *   **Diagnostic Call Mode**: בחרו נתיב ריצה לכל probe. ספקי OpenAI-compatible תומכים בנוסף במצבים מאולצים (`direct streaming`, `direct buffered`, `requestUrl-only`) מעבר למצבי runtime.
    *   **Run Diagnostic**: מריץ probe יחיד של בקשה ארוכה עם מצב הקריאה שנבחר וכותב `Notemd_Provider_Diagnostic_*.txt` בשורש ה-vault.
    *   **Run Stability Test**: חוזר על ה-probe למספר ריצות שניתן להגדרה (1-10) עם מצב הקריאה שנבחר ושומר דוח יציבות מצטבר.
    *   **Diagnostic Timeout**: timeout הניתן להגדרה לכל ריצה (15-3600 שניות).
    *   **Why Use It**: מהיר יותר מהעתקה ידנית של הבעיה כאשר ספק עובר "Test connection" אך נכשל במשימות ארוכות אמיתיות (למשל תרגום דרך gateway איטי).
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### הגדרות כלליות

#### פלט קובץ מעובד
-   **Customize Processed File Save Path**:
    *   **מושבת (ברירת מחדל)**: קבצים מעובדים (למשל `YourNote_processed.md`) נשמרים ב-*אותה תיקייה* כמו ההערה המקורית.
    *   **מופעל**: מאפשר להגדיר מיקום שמירה מותאם.
-   **Processed File Folder Path**: (גלוי רק כאשר האפשרות לעיל מופעלת) הזינו *נתיב יחסי* בתוך ה-vault שלכם (למשל `Processed Notes` או `Output/LLM`) שבו יישמרו הקבצים המעובדים. תיקיות ייווצרו אוטומטית אם אינן קיימות. **אין להשתמש בנתיבים מוחלטים (כמו C:\...) או בתווים לא חוקיים.**
-   **Use Custom Output Filename for 'Add Links'**:
    *   **מושבת (ברירת מחדל)**: קבצים מעובדים שנוצרים על ידי פקודת 'Add Links' משתמשים ב-suffix ברירת המחדל `_processed.md` (למשל `YourNote_processed.md`).
    *   **מופעל**: מאפשר להגדיר שם פלט מותאם באמצעות ההגדרה שמתחת.
-   **Custom Suffix/Replacement String**: (גלוי רק כאשר ההגדרה שלעיל מופעלת) הזינו את המחרוזת לשם קובץ הפלט.
    *   אם נשאר **ריק**, הקובץ המקורי **יוחלף** בתוכן המעובד.
    *   אם מזינים מחרוזת (למשל `_linked`), היא תתווסף לשם הבסיסי של הקובץ (למשל `YourNote_linked.md`). ודאו שה-suffix אינו מכיל תווים לא חוקיים.

-   **Remove Code Fences on Add Links**:
    *   **מושבת (ברירת מחדל)**: code fences **(\`\\\`\`)** נשמרים בתוכן בעת הוספת קישורים, ואילו **(\`\\\`markdown)** יוסר אוטומטית.
    *   **מופעל**: מסיר code fences מהתוכן לפני הוספת קישורים.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### פלט הערת מושג
-   **Customize Concept Note Path**:
    *   **מושבת (ברירת מחדל)**: יצירה אוטומטית של הערות עבור `[[linked concepts]]` מושבתת.
    *   **מופעל**: מאפשר לציין תיקייה שבה ייווצרו concept notes חדשים.
-   **Concept Note Folder Path**: (גלוי רק כאשר ההתאמה לעיל מופעלת) הזינו *נתיב יחסי* בתוך ה-vault שלכם (למשל `Concepts` או `Generated/Topics`) שבו יישמרו concept notes חדשים. תיקיות ייווצרו אם לא קיימות. **חובה למלא כאשר ההתאמה פעילה.** **אין להשתמש בנתיבים מוחלטים או בתווים לא חוקיים.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### פלט קובץ יומן מושגים
-   **Generate Concept Log File**:
    *   **מושבת (ברירת מחדל)**: לא נוצר קובץ יומן.
    *   **מופעל**: יוצר קובץ יומן שמפרט concept notes חדשים לאחר העיבוד. הפורמט הוא:
        ```
        יצירת xx קובצי md של מושגים
        1. concepts1
        2. concepts2
        ...
        n. conceptsn
        ```
-   **Customize Log File Save Path**: (גלוי רק כאשר "Generate Concept Log File" מופעל)
    *   **מושבת (ברירת מחדל)**: קובץ היומן נשמר ב-**Concept Note Folder Path** (אם הוגדר) או בשורש ה-vault אחרת.
    *   **מופעל**: מאפשר להגדיר תיקייה מותאמת לשמירת היומן.
-   **Concept Log Folder Path**: (גלוי רק כאשר "Customize Log File Save Path" מופעל) הזינו *נתיב יחסי* בתוך ה-vault (למשל `Logs/Notemd`) שבו יישמר קובץ היומן. **חובה למלא כאשר ההתאמה פעילה.**
-   **Customize Log File Name**: (גלוי רק כאשר "Generate Concept Log File" מופעל)
    *   **מושבת (ברירת מחדל)**: שם קובץ היומן הוא `Generate.log`.
    *   **מופעל**: מאפשר להגדיר שם קובץ מותאם.
-   **Concept Log File Name**: (גלוי רק כאשר "Customize Log File Name" מופעל) הזינו את שם הקובץ הרצוי (למשל `ConceptCreation.log`). **חובה למלא כאשר ההתאמה פעילה.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### משימת חילוץ מושגים
-   **יצירת הערות מושג מינימליות**:
    *   **On (Default)**: concept notes חדשים יכילו רק את הכותרת (למשל `# Concept`)।
    *   **Off**: concept notes עשויים לכלול תוכן נוסף, כגון backlink "Linked From", אם הוא לא כובה על ידי ההגדרה הבאה.
-   **Add "Linked From" backlink**:
    *   **Off (Default)**: לא מוסיף backlink למסמך המקור ב-concept note במהלך החילוץ.
    *   **On**: מוסיף מקטע "Linked From" עם backlink לקובץ המקור.

#### חילוץ טקסט מקורי מסוים
-   **Questions for extraction**: הזינו רשימת שאלות (שאלה בכל שורה) שעבורן תרצו שה-AI יחלץ תשובות מילוליות מההערות שלכם.
-   **Translate output to corresponding language**:
    *   **Off (Default)**: מפיק רק את הטקסט שחולץ בשפת המקור שלו.
    *   **On**: מוסיף תרגום של הטקסט שחולץ לשפה שנבחרה למשימה זו.
-   **Merged query mode**:
    *   **Off**: מעבד כל שאלה בנפרד (דיוק גבוה יותר אך יותר קריאות API).
    *   **On**: שולח את כל השאלות ב-prompt יחיד (מהיר יותר ופחות קריאות API).
-   **Customise extracted text save path & filename**:
    *   **Off**: שומר באותה תיקייה כמו הקובץ המקורי עם suffix `_Extracted`.
    *   **On**: מאפשר להגדיר תיקיית פלט ו-suffix מותאמים.

#### תיקון Mermaid באצווה
-   **Enable Mermaid Error Detection**:
    *   **Off (Default)**: זיהוי השגיאות לאחר העיבוד מושמט.
    *   **On**: סורק קבצים מעובדים לשגיאות תחביר Mermaid שנותרו ומייצר דוח `mermaid_error_{foldername}.md`.
-   **Move files with Mermaid errors to specified folder**:
    *   **Off**: קבצים עם שגיאות נשארים במקומם.
    *   **On**: מעביר קבצים שעדיין מכילים שגיאות תחביר Mermaid לאחר ניסיון התיקון לתיקייה ייעודית לבדיקה ידנית.
-   **Mermaid error folder path**: (גלוי כאשר האפשרות לעיל מופעלת) התיקייה שאליה יועברו קבצים שגויים.

#### פרמטרי עיבוד
-   **Enable Batch Parallelism**:
    *   **מושבת (ברירת מחדל)**: משימות עיבוד באצווה (כגון "Process Folder" או "Batch Generate from Titles") מעבדות קבצים אחד-אחד (serially).
    *   **מופעל**: מאפשר לתוסף לעבד מספר קבצים במקביל, דבר שיכול להאיץ משמעותית עבודות אצווה גדולות.
-   **Batch Concurrency**: (גלוי רק כאשר parallelism מופעל) קובע את מספר הקבצים המרבי לעיבוד במקביל. מספר גבוה יותר עשוי להיות מהיר יותר, אך משתמש ביותר משאבים ועלול להיתקל ב-API rate limits. (ברירת מחדל: 1, טווח: 1-20)
-   **Batch Size**: (גלוי רק כאשר parallelism מופעל) מספר הקבצים המאוגדים לאצווה אחת. (ברירת מחדל: 50, טווח: 10-200)
-   **Delay Between Batches (ms)**: (גלוי רק כאשר parallelism מופעל) השהיה אופציונלית באלפיות שנייה בין עיבוד כל אצווה, שעשויה לעזור בניהול API rate limits. (ברירת מחדל: 1000ms)
-   **API Call Interval (ms)**: השהיה מינימלית באלפיות שנייה *לפני ואחרי* כל קריאת LLM API בודדת. קריטי ל-API-ים בעלי קצב נמוך או למניעת שגיאות 429. קבעו 0 כדי לבטל השהיה מלאכותית. (ברירת מחדל: 500ms)
-   **Chunk Word Count**: מספר מילים מרבי לכל chunk שנשלח ל-LLM. משפיע על מספר קריאות ה-API עבור קבצים גדולים. (ברירת מחדל: 3000)
-   **Enable Duplicate Detection**: מפעיל/מכבה את הבדיקה הבסיסית של מילים כפולות בתוכן המעובד (התוצאות נרשמות לקונסול). (ברירת מחדל: מופעל)
-   **Max Tokens**: מספר ה-token-ים המרבי שה-LLM אמור לייצר לכל response chunk. משפיע על עלות ועל רמת הפירוט. (ברירת מחדל: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### תרגום
-   **Default Target Language**: בחרו את שפת היעד ברירת המחדל שאליה תרצו לתרגם את ההערות. ניתן לעקוף זאת ב-UI בעת הרצת פקודת התרגום. (ברירת מחדל: English)
-   **Customise Translation File Save Path**:
    *   **מושבת (ברירת מחדל)**: קבצים מתורגמים נשמרים ב-*אותה תיקייה* כמו ההערה המקורית.
    *   **מופעל**: מאפשר להגדיר *נתיב יחסי* בתוך ה-vault (למשל `Translations`) שבו יישמרו קבצים מתורגמים. תיקיות ייווצרו אם אינן קיימות.
-   **Use custom suffix for translated files**:
    *   **מושבת (ברירת מחדל)**: קבצים מתורגמים משתמשים ב-suffix ברירת המחדל `_translated.md` (למשל `YourNote_translated.md`).
    *   **מופעל**: מאפשר להגדיר suffix מותאם.
-   **Custom Suffix**: (גלוי רק כאשר האפשרות לעיל מופעלת) הזינו את ה-suffix המותאם שיצורף לשמות הקבצים המתורגמים (למשל `_es` או `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### יצירת תוכן
-   **Enable Research in "Generate from Title"**:
    *   **מושבת (ברירת מחדל)**: "Generate from Title" משתמש רק בכותרת כקלט.
    *   **מופעל**: מבצע מחקר אינטרנט באמצעות **Web Research Provider** שהוגדר ומוסיף את הממצאים כהקשר ל-LLM בעת יצירה המבוססת על כותרת.
-   **Auto-run Mermaid Syntax Fix after Generation**:
    *   **מופעל (ברירת מחדל)**: מריץ אוטומטית שלב תיקון תחביר Mermaid לאחר זרימות עבודה הקשורות ל-Mermaid, כמו Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid ו-Translate.
    *   **מושבת**: משאיר את פלט ה-Mermaid שנוצר ללא שינוי, אלא אם כן מריצים ידנית `Batch Mermaid Fix` או מוסיפים אותו לזרימת עבודה מותאמת.
-   **Output Language**: (חדש) בחרו את שפת הפלט הרצויה עבור משימות "Generate from Title" ו-"Batch Generate from Title".
    *   **English (Default)**: ה-prompts מעובדים והפלט נוצר באנגלית.
    *   **Other Languages**: ה-LLM מונחה לבצע את ה-reasoning באנגלית אך להחזיר את התיעוד הסופי בשפה שבחרתם (למשל Español, Français, 简体中文, 繁體中文, العربية, हिन्दी וכו').
-   **Change Prompt Word**: (חדש)
    *   **Change Prompt Word**: מאפשר לשנות את מילת ה-prompt עבור משימה מסוימת.
    *   **Custom Prompt Word**: הזינו את מילת ה-prompt המותאמת שלכם למשימה.
-   **Use Custom Output Folder for 'Generate from Title'**:
    *   **מושבת (ברירת מחדל)**: קבצים שנוצרו בהצלחה מועברים לתת-תיקייה בשם `[OriginalFolderName]_complete` יחסית לתיקיית האב של התיקייה המקורית (או `Vault_complete` אם התיקייה המקורית הייתה השורש).
    *   **מופעל**: מאפשר להגדיר שם מותאם לתת-התיקייה שאליה יועברו הקבצים המושלמים.
-   **Custom Output Folder Name**: (גלוי רק כאשר האפשרות לעיל מופעלת) הזינו את השם הרצוי לתת-התיקייה (למשל `Generated Content`, `_complete`). תווים לא חוקיים אינם מורשים. אם נשאר ריק ברירת המחדל היא `_complete`. התיקייה נוצרת יחסית לתיקיית האב של התיקייה המקורית.

#### כפתורי זרימת עבודה בלחיצה אחת
-   **Visual Workflow Builder**: צרו כפתורי workflow מותאמים מפעולות מובנות בלי לכתוב DSL ידנית.
-   **Custom Workflow Buttons DSL**: משתמשים מתקדמים עדיין יכולים לערוך ישירות את טקסט הגדרת ה-workflow. DSL לא חוקי מחזיר בבטחה ל-workflow ברירת המחדל ומציג אזהרה ב-UI של sidebar/settings.
-   **Workflow Error Strategy**:
    *   **Stop on Error (Default)**: עוצר מיידית את ה-workflow כאשר שלב כלשהו נכשל.
    *   **Continue on Error**: ממשיך להריץ שלבים מאוחרים יותר ומדווח בסוף על מספר הפעולות שנכשלו.
-   **Default Workflow Included**: `One-Click Extract` משרשר את `Process File (Add Links)`, `Batch Generate from Titles` ו-`Batch Mermaid Fix`.

#### הגדרות הנחיה מותאמת
תכונה זו מאפשרת לכם לעקוף את ה-prompts ברירת המחדל שנשלחים ל-LLM עבור משימות מסוימות, וכך לקבל שליטה מדויקת יותר על הפלט.

-   **Enable Custom Prompts for Specific Tasks**:
    *   **מושבת (ברירת מחדל)**: התוסף משתמש ב-prompts המובנים שלו לכל הפעולות.
    *   **מופעל**: מפעיל את היכולת להגדיר prompts מותאמים למשימות המפורטות להלן. זהו מתג העל של התכונה.

-   **Use Custom Prompt for [Task Name]**: (גלוי רק כאשר האפשרות לעיל מופעלת)
    *   עבור כל משימה נתמכת ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts"), תוכלו להפעיל או לכבות את ה-prompt המותאם שלכם בנפרד.
    *   **Disabled**: המשימה תשתמש ב-prompt ברירת המחדל.
    *   **מופעל**: המשימה תשתמש בטקסט שתספקו בשדה "Custom Prompt" המתאים בהמשך.

-   **Custom Prompt Text Area**: (גלוי רק כאשר prompt מותאם של משימה מופעל)
    *   **Default Prompt Display**: לעיונכם, התוסף מציג את ה-prompt ברירת המחדל שבו היה משתמש למשימה. תוכלו להשתמש בכפתור **"Copy Default Prompt"** כדי להעתיק אותו כנקודת מוצא ל-prompt המותאם שלכם.
    *   **Custom Prompt Input**: כאן אתם כותבים את ההוראות שלכם ל-LLM.
    *   **Placeholders**: ניתן (ומומלץ) להשתמש ב-placeholders מיוחדים בתוך ה-prompt, שהתוסף יחליף בתוכן אמיתי לפני שליחת הבקשה ל-LLM. עיינו ב-prompt ברירת המחדל כדי לראות אילו placeholders זמינים לכל משימה. placeholders נפוצים כוללים:
        *   `{TITLE}`: כותרת ההערה הנוכחית.
        *   `{RESEARCH_CONTEXT_SECTION}`: התוכן שנאסף ממחקר ברשת.
        *   `{USER_PROMPT}`: תוכן ההערה המעובדת.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### היקף בדיקת כפילויות
-   **Duplicate Check Scope Mode**: שולט אילו קבצים ייבדקו מול ההערות שב-Concept Note Folder לאיתור כפילויות אפשריות.
    *   **Entire Vault (Default)**: משווה concept notes לכל שאר ההערות ב-vault (למעט Concept Note Folder עצמו).
    *   **Include Specific Folders Only**: משווה concept notes רק להערות שבתיקיות המפורטות למטה.
    *   **Exclude Specific Folders**: משווה concept notes לכל ההערות *מלבד* אלו שבתיקיות המפורטות למטה (וגם ללא Concept Note Folder).
    *   **Concept Folder Only**: משווה concept notes רק ל-*הערות אחרות בתוך Concept Note Folder*. זה עוזר למצוא כפילויות בתוך המושגים שנוצרו.
-   **Include/Exclude Folders**: (גלוי רק אם המצב הוא `Include` או `Exclude`) הזינו את *הנתיבים היחסיים* של התיקיות שברצונכם לכלול או להחריג, **נתיב אחד בכל שורה**. הנתיבים רגישים לאותיות גדולות/קטנות ומשתמשים ב-`/` כמפריד (למשל `Reference Material/Papers` או `Daily Notes`). תיקיות אלו אינן יכולות להיות זהות ל-Concept Note Folder או בתוכו.

#### ספק מחקר אינטרנט
-   **Search Provider**: בחרו בין `Tavily` (דורש API key, מומלץ) לבין `DuckDuckGo` (ניסיוני, ולעיתים קרובות חסום על ידי מנוע החיפוש לבקשות אוטומטיות). משמש ל-"Research & Summarize Topic" ואופציונלית ל-"Generate from Title".
-   **Tavily API Key**: (גלוי רק אם Tavily נבחר) הזינו את ה-API key שלכם מ-[tavily.com](https://tavily.com/).
-   **Tavily Max Results**: (גלוי רק אם Tavily נבחר) מספר התוצאות המרבי ש-Tavily יחזיר (1-20). ברירת מחדל: 5.
-   **Tavily Search Depth**: (גלוי רק אם Tavily נבחר) בחרו `basic` (ברירת מחדל) או `advanced`. הערה: `advanced` מספק תוצאות טובות יותר אך צורך 2 API credits לכל חיפוש במקום 1.
-   **DuckDuckGo Max Results**: (גלוי רק אם DuckDuckGo נבחר) מספר תוצאות החיפוש המרבי לעיבוד (1-10). ברירת מחדל: 5.
-   **DuckDuckGo Content Fetch Timeout**: (גלוי רק אם DuckDuckGo נבחר) מספר השניות המרבי להמתנה בעת ניסיון להביא תוכן מכל DuckDuckGo result URL. ברירת מחדל: 15.
-   **Max Research Content Tokens**: מספר token-ים מרבי משוער של תוצאות המחקר ברשת (snippets/fetched content) שיוכנסו ל-prompt הסיכום. עוזר לנהל את גודל חלון ההקשר והעלות. (ברירת מחדל: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### תחום למידה ממוקד
-   **Enable Focused Learning Domain**:
    *   **מושבת (ברירת מחדל)**: prompts שנשלחים ל-LLM משתמשים בהוראות כלליות סטנדרטיות.
    *   **מופעל**: מאפשר להגדיר תחום או תחומים לימודיים לשיפור ההבנה ההקשרית של ה-LLM.
-   **Learning Domain**: (גלוי רק כאשר האפשרות לעיל מופעלת) הזינו את התחום/תחומים הספציפיים שלכם, לדוגמה 'Materials Science', 'Polymer Physics', 'Machine Learning'. כך תתווסף שורה "Relevant Fields: [...]" בתחילת ה-prompts, מה שיעזור ל-LLM ליצור קישורים ותוכן מדויקים ורלוונטיים יותר לתחום שלכם.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## מדריך שימוש

### זרימות עבודה מהירות וסרגל צד

-   פתחו את סרגל הצד של Notemd כדי לגשת למקטעי פעולות מקובצות עבור עיבוד ליבה, יצירה, תרגום, ידע וכלי עזר.
-   השתמשו באזור **זרימות עבודה מהירות** בראש סרגל הצד כדי להפעיל כפתורים מותאמים מרובי-שלבים.
-   זרימת העבודה **One-Click Extract** מפעילה את `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
-   התקדמות ה-workflow, logs לכל שלב וכשלים מוצגים בסרגל הצד, עם footer מוצמד שמגן על פס ההתקדמות ואזור ה-logs מפני דחיסה כאשר כל המקטעים מורחבים.
-   כרטיס ההתקדמות שומר את טקסט הסטטוס, מחוון האחוזים והזמן שנותר קריאים במבט אחד, וניתן להגדיר מחדש את אותן זרימות עבודה מותאמות גם מתוך ההגדרות.

### עיבוד מקורי (הוספת wiki-links)
זו הפונקציונליות המרכזית שממוקדת בזיהוי מושגים ובהוספת `[[wiki-links]]`.

**חשוב:** תהליך זה עובד רק על קבצי `.md` או `.txt`. ניתן להמיר קובצי PDF ל-MD בחינם באמצעות [Mineru](https://github.com/opendatalab/MinerU) לפני עיבוד נוסף.

1.  **שימוש בסרגל הצד**:
    *   פתחו את Notemd Sidebar (אייקון המטה או לוח הפקודות).
    *   פתחו קובץ `.md` או `.txt`.
    *   לחצו על **"Process File (Add Links)"**.
    *   כדי לעבד תיקייה: לחצו על **"Process Folder (Add Links)"**, בחרו את התיקייה ולחצו על "Process".
    *   ההתקדמות מוצגת בסרגל הצד. ניתן לבטל את המשימה דרך כפתור "Cancel Processing" שבסרגל הצד.
    *   *הערה לעיבוד תיקיות:* הקבצים מעובדים ברקע מבלי להיפתח בעורך.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **שימוש בלוח הפקודות** (`Ctrl+P` או `Cmd+P`):
    *   **קובץ יחיד**: פתחו את הקובץ והפעילו `Notemd: Process Current File`.
    *   **תיקייה**: הפעילו `Notemd: Process Folder`, ואז בחרו את התיקייה. הקבצים יעובדו ברקע מבלי להיפתח בעורך.
    *   עבור פעולות מלוח הפקודות מופיע חלון התקדמות הכולל כפתור ביטול.
    *   *הערה:* התוסף מסיר אוטומטית שורות פתיחה `\boxed{` ושורות סיום `}` אם נמצאו בתוכן המעובד הסופי לפני שמירה.

### תכונות חדשות

1.  **סיכום כתרשים Mermaid**:
    *   פתחו את ההערה שברצונכם לסכם.
    *   הפעילו את `Notemd: Summarise as Mermaid diagram` (דרך לוח הפקודות או כפתור sidebar).
    *   התוסף ייצור הערה חדשה עם דיאגרמת Mermaid.

2.  **Translate Note/Selection**:
    *   בחרו טקסט בתוך הערה אם תרצו לתרגם רק את הבחירה, או הפעילו את הפקודה ללא בחירה כדי לתרגם את כל ההערה.
    *   הפעילו את `Notemd: Translate Note/Selection` (דרך לוח הפקודות או כפתור sidebar).
    *   יופיע חלון שיאפשר לכם לאשר או לשנות את **Target Language** (ברירת המחדל היא הערך מה-Configuration).
    *   התוסף משתמש ב-**LLM Provider** שהוגדר (על בסיס הגדרות Multi-Model) כדי לבצע את התרגום.
    *   התוכן המתורגם נשמר ב-**Translation Save Path** המוגדר עם ה-suffix המתאים, ונפתח ב-**pane חדש מימין** לתוכן המקורי לצורך השוואה נוחה.
    *   ניתן לבטל משימה זו דרך כפתור sidebar או כפתור cancel במודל.
3.  **תרגום באצווה**:
    *   הפעילו את `Notemd: Batch Translate Folder` מלוח הפקודות ובחרו תיקייה, או לחצו לחיצה ימנית על תיקייה ב-file explorer ובחרו "Batch translate this folder".
    *   התוסף יתרגם את כל קובצי Markdown שבתיקייה שנבחרה.
    *   הקבצים המתורגמים נשמרים ב-translation path המוגדר אך אינם נפתחים אוטומטית.
    *   ניתן לבטל תהליך זה דרך progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Research & Summarize Topic**:
    *   בחרו טקסט בהערה או ודאו שלפתק יש כותרת (שתשמש כנושא לחיפוש).
    *   הפעילו את `Notemd: Research and Summarize Topic` (דרך לוח הפקודות או כפתור sidebar).
    *   התוסף משתמש ב-**Search Provider** שהוגדר (Tavily/DuckDuckGo) וב-**LLM Provider** המתאים (על בסיס Multi-Model settings) כדי למצוא ולסכם מידע.
    *   הסיכום מצורף להערה הנוכחית.
    *   ניתן לבטל משימה זו דרך כפתור sidebar או כפתור cancel במודל.
    *   *הערה:* חיפושי DuckDuckGo עלולים להיכשל עקב זיהוי בוטים. Tavily מומלץ.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Generate Content from Title**:
    *   פתחו הערה (היא יכולה להיות גם ריקה).
    *   הפעילו את `Notemd: Generate Content from Title` (דרך לוח הפקודות או כפתור sidebar).
    *   התוסף משתמש ב-**LLM Provider** המתאים (על בסיס Multi-Model settings) כדי ליצור תוכן על סמך כותרת ההערה ולהחליף את התוכן הקיים.
    *   אם ההגדרה **"Enable Research in 'Generate from Title'"** מופעלת, הוא יבצע תחילה מחקר באינטרנט (באמצעות **Web Research Provider** שהוגדר) ויכלול את ההקשר הזה ב-prompt הנשלח ל-LLM.
    *   ניתן לבטל משימה זו דרך כפתור sidebar או כפתור cancel במודל.

5.  **Batch Generate Content from Titles**:
    *   הפעילו את `Notemd: Batch Generate Content from Titles` (דרך לוח הפקודות או כפתור sidebar).
    *   בחרו את התיקייה המכילה את ההערות שברצונכם לעבד.
    *   התוסף יעבור על כל קובץ `.md` בתיקייה (למעט קובצי `_processed.md` וקבצים שבתיקיית "complete" הייעודית), ייצור תוכן על בסיס כותרת ההערה ויחליף את התוכן הקיים. הקבצים יעובדו ברקע ללא פתיחה בעורך.
    *   קבצים שמעובדים בהצלחה מועברים לתיקיית "complete" שהוגדרה.
    *   פקודה זו מכבדת את ההגדרה **"Enable Research in 'Generate from Title'"** עבור כל הערה שעובדה.
    *   ניתן לבטל משימה זו דרך כפתור sidebar או כפתור cancel במודל.
    *   התקדמות ותוצאות (מספר קבצים ששונו, שגיאות) מוצגות ב-log של sidebar / modal.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Check and Remove Duplicate Concept Notes**:
    *   ודאו ש-**Concept Note Folder Path** הוגדר כראוי בהגדרות.
    *   הפעילו `Notemd: Check and Remove Duplicate Concept Notes` (דרך לוח הפקודות או כפתור sidebar).
    *   התוסף סורק את תיקיית ה-concept notes ומשווה שמות קבצים מול הערות שמחוץ לתיקייה באמצעות כללים שונים (התאמה מדויקת, רבים, נרמול, הכלה).
    *   אם נמצאות כפילויות אפשריות, מופיע חלון modal המציג את הקבצים, את הסיבה לסימון ואת הקבצים המתנגשים.
    *   עברו על הרשימה בזהירות. לחצו על **"Delete Files"** כדי להעביר את הקבצים לאשפת המערכת, או על **"Cancel"** כדי לא לבצע פעולה.
    *   ההתקדמות והתוצאות מוצגות ב-log של sidebar / modal.

7.  **Extract Concepts (Pure Mode)**:
    *   תכונה זו מאפשרת לחלץ מושגים ממסמך וליצור concept notes תואמים *בלי* לשנות את הקובץ המקורי. היא אידיאלית לאכלוס מהיר של בסיס הידע שלכם מתוך אוסף מסמכים.
    *   **קובץ יחיד**: פתחו קובץ והפעילו את `Notemd: Extract concepts (create concept notes only)` מלוח הפקודות או לחצו על הכפתור **"Extract concepts (current file)"** ב-sidebar.
    *   **תיקייה**: הפעילו את `Notemd: Batch extract concepts from folder` מלוח הפקודות או לחצו על **"Extract concepts (folder)"** ב-sidebar, ואז בחרו תיקייה כדי לעבד את כל ההערות שבה.
    *   התוסף יקרא את הקבצים, יזהה מושגים וייצור עבורם הערות חדשות בתוך **Concept Note Folder** שהוגדר, תוך השארת הקבצים המקוריים ללא שינוי.

8.  **Create Wiki-Link & Generate Note from Selection**:
    *   פקודה חזקה זו מפשטת את תהליך היצירה והמילוי של concept notes חדשים.
    *   בחרו מילה או ביטוי בעורך.
    *   הפעילו את `Notemd: Create Wiki-Link & Generate Note from Selection` (מומלץ להקצות לה קיצור דרך, למשל `Cmd+Shift+W`).
    *   התוסף:
        1.  יחליף את הטקסט שנבחר ב-`[[wiki-link]]`.
        2.  יבדוק אם כבר קיימת הערה עם כותרת זו ב-**Concept Note Folder**.
        3.  אם כן, הוא יוסיף backlink להערה הנוכחית.
        4.  אם לא, הוא ייצור הערה חדשה וריקה.
        5.  לאחר מכן הוא יריץ אוטומטית את הפקודה **"Generate Content from Title"** על ההערה החדשה או הקיימת, וימלא אותה בתוכן שנוצר על ידי AI.

9.  **Extract Concepts and Generate Titles**:
    *   פקודה זו משלבת שתי תכונות חזקות ל-workflow יעיל יותר.
    *   הפעילו את `Notemd: Extract Concepts and Generate Titles` מלוח הפקודות (מומלץ להקצות גם לה קיצור דרך).
    *   התוסף:
        1.  יריץ תחילה את המשימה **"Extract concepts (current file)"** על הקובץ הפעיל.
        2.  לאחר מכן יריץ אוטומטית את המשימה **"Batch generate from titles"** על התיקייה שהגדרתם כ-**Concept note folder path**.
    *   כך תוכלו תחילה לאכלס את בסיס הידע במושגים חדשים ממסמך מקור ואז מיד להעשיר את ה-concept notes החדשים בתוכן שנוצר על ידי AI.

10. **Extract Specific Original Text**:
    *   הגדירו את השאלות שלכם תחת "Extract Specific Original Text" בהגדרות.
    *   השתמשו בכפתור "Extract Specific Original Text" ב-sidebar כדי לעבד את הקובץ הפעיל.
    *   **Merged Mode**: מאפשר עיבוד מהיר יותר על ידי שליחת כל השאלות ב-prompt יחיד.
    *   **Translation**: מתרגם אופציונלית את הטקסט שחולץ לשפה שהוגדרה.
    *   **Custom Output**: הגדירו היכן וכיצד יישמר הקובץ שחולץ.

11. **Batch Mermaid Fix**:
    *   השתמשו בכפתור "Batch Mermaid Fix" ב-sidebar כדי לסרוק תיקייה ולתקן שגיאות תחביר Mermaid נפוצות.
    *   התוסף ידווח על קבצים שעדיין מכילים שגיאות בתוך `mermaid_error_{foldername}.md`.
    *   ניתן להגדיר אופציונלית שהתוסף יעביר את הקבצים הבעייתיים הללו לתיקייה נפרדת לבדיקה.

## ספקי LLM נתמכים

| ספק               | סוג        | נדרש API Key           | הערות                                                                  |
|-------------------|------------|------------------------|-------------------------------------------------------------------------|
| DeepSeek          | ענן        | כן                     | Native DeepSeek endpoint עם טיפול ב-reasoning models                   |
| Qwen              | ענן        | כן                     | DashScope compatible-mode preset עבור מודלי Qwen / QwQ                |
| Qwen Code         | ענן        | כן                     | DashScope preset ממוקד קידוד עבור Qwen coder models                   |
| Doubao            | ענן        | כן                     | Volcengine Ark preset; בדרך כלל שדה model מוגדר ל-endpoint ID שלכם   |
| Moonshot          | ענן        | כן                     | Official Kimi / Moonshot endpoint                                      |
| GLM               | ענן        | כן                     | Official Zhipu BigModel OpenAI-compatible endpoint                     |
| Z AI              | ענן        | כן                     | International GLM/Zhipu OpenAI-compatible endpoint; משלים את `GLM`    |
| MiniMax           | ענן        | כן                     | Official MiniMax chat-completions endpoint                             |
| Huawei Cloud MaaS | ענן        | כן                     | Huawei ModelArts MaaS OpenAI-compatible endpoint עבור hosted models   |
| Baidu Qianfan     | ענן        | כן                     | Official Qianfan OpenAI-compatible endpoint עבור מודלי ERNIE          |
| SiliconFlow       | ענן        | כן                     | Official SiliconFlow OpenAI-compatible endpoint עבור hosted OSS models |
| OpenAI            | ענן        | כן                     | תומך במודלי GPT ובסדרת o                                              |
| Anthropic         | ענן        | כן                     | תומך במודלי Claude                                                     |
| Google            | ענן        | כן                     | תומך במודלי Gemini                                                     |
| Mistral           | ענן        | כן                     | תומך במשפחות Mistral ו-Codestral                                      |
| Azure OpenAI      | ענן        | כן                     | דורש Endpoint, API Key, deployment name ו-API Version                 |
| OpenRouter        | Gateway    | כן                     | גישה לספקים רבים דרך OpenRouter model IDs                             |
| xAI               | ענן        | כן                     | Native Grok endpoint                                                   |
| Groq              | ענן        | כן                     | Fast OpenAI-compatible inference עבור hosted OSS models                |
| Together          | ענן        | כן                     | OpenAI-compatible endpoint עבור hosted OSS models                      |
| Fireworks         | ענן        | כן                     | OpenAI-compatible inference endpoint                                   |
| Requesty          | Gateway    | כן                     | Multi-provider router מאחורי API key אחד                              |
| OpenAI Compatible | Gateway    | אופציונלי              | Generic preset עבור LiteLLM, vLLM, Perplexity, Vercel AI Gateway וכו' |
| LMStudio          | מקומי      | אופציונלי (`EMPTY`)    | מריץ מודלים מקומית דרך LM Studio server                               |
| Ollama            | מקומי      | לא                     | מריץ מודלים מקומית דרך Ollama server                                  |

*הערה: עבור ספקים מקומיים (LMStudio, Ollama), ודאו שאפליקציית השרת המתאימה פועלת ונגישה דרך Base URL שהוגדר.*
*הערה: עבור OpenRouter ו-Requesty, השתמשו במזהה המודל המלא / עם prefix של הספק כפי שמוצג ב-gateway (למשל `google/gemini-flash-1.5` או `anthropic/claude-3-7-sonnet-latest`).*
*הערה: `Doubao` בדרך כלל מצפה ל-Ark endpoint / deployment ID בשדה model ולא לשם משפחת מודל גולמי. מסך ההגדרות מזהיר כעת כאשר ערך placeholder עדיין קיים וחוסם connection tests עד שמחליפים אותו ב-endpoint ID אמיתי.*
*הערה: `Z AI` מכוון לקו הבינלאומי `api.z.ai`, בעוד `GLM` שומר על BigModel endpoint של סין היבשתית. בחרו את ה-preset המתאים לאזור החשבון שלכם.*
*הערה: presets הממוקדים לסין משתמשים ב-chat-first connection checks כך שהבדיקה מאמתת את המודל / deployment שהוגדרו בפועל, ולא רק את זמינות ה-API key.*
*הערה: `OpenAI Compatible` מיועד ל-gateway ו-proxy מותאמים. הגדירו את Base URL, מדיניות ה-API key ו-model ID בהתאם לתיעוד של הספק שלכם.*

## שימוש ברשת וטיפול בנתונים

Notemd פועל מקומית בתוך Obsidian, אך חלק מהתכונות שולחות בקשות יוצאות.

### קריאות לספקי LLM (ניתנות להגדרה)

- טריגר: עיבוד קבצים, יצירה, תרגום, סיכום מחקר, סיכום Mermaid ופעולות חיבור / diagnostics.
- Endpoint: ה-provider base URL(s) שהגדרתם בהגדרות Notemd.
- נתונים שנשלחים: טקסט ה-prompt ותוכן המשימה הנדרשים לעיבוד.
- הערת טיפול בנתונים: מפתחות API מוגדרים מקומית בהגדרות התוסף ומשמשים לחתימה על בקשות מהמכשיר שלכם.

### קריאות למחקר אינטרנט (אופציונלי)

- טריגר: כאשר מחקר אינטרנט מופעל ונבחר ספק חיפוש.
- Endpoint: Tavily API או DuckDuckGo endpoints.
- נתונים שנשלחים: query המחקר שלכם ו-request metadata נדרשים.

### אבחון למפתחים ויומני ניפוי שגיאות (אופציונלי)

- טריגר: מצב API debug ופעולות developer diagnostic.
- אחסון: diagnostic ו-error logs נכתבים לשורש ה-vault (למשל `Notemd_Provider_Diagnostic_*.txt` ו-`Notemd_Error_Log_*.txt`).
- הערת סיכון: logs עשויים להכיל קטעי request / response. עברו עליהם לפני שיתוף פומבי.

### אחסון מקומי

- תצורת התוסף נשמרת ב-`.obsidian/plugins/notemd/data.json`.
- קבצים שנוצרים, דוחות ו-logs אופציונליים נשמרים ב-vault שלכם בהתאם להגדרות.

## פתרון בעיות

### בעיות נפוצות
-   **התוסף לא נטען**: ודאו שהקבצים `manifest.json`, `main.js`, `styles.css` נמצאים בתיקייה הנכונה (`<Vault>/.obsidian/plugins/notemd/`) והפעילו מחדש את Obsidian. בדקו את Developer Console (`Ctrl+Shift+I` או `Cmd+Option+I`) לשגיאות בעת האתחול.
-   **כישלונות עיבוד / שגיאות API**:
    1.  **בדקו את פורמט הקובץ**: ודאו שהקובץ שברצונכם לעבד או לבדוק הוא עם סיומת `.md` או `.txt`. Notemd תומך כרגע רק בפורמטים טקסטואליים אלה.
    2.  השתמשו בפקודה / בכפתור "Test LLM Connection" כדי לאמת את הגדרות הספק הפעיל.
    3.  בדקו מחדש את API Key, Base URL, Model Name ו-API Version (עבור Azure). ודאו שמפתח ה-API נכון ושיש לו מספיק credits / permissions.
    4.  ודאו שה-LLM server המקומי שלכם (LMStudio, Ollama) פועל וש-Base URL נכון (למשל `http://localhost:1234/v1` עבור LMStudio).
    5.  בדקו את חיבור האינטרנט שלכם עבור ספקי ענן.
    6.  **לשגיאות עיבוד של קובץ יחיד:** עברו על Developer Console לקבלת הודעות שגיאה מפורטות. העתיקו אותן דרך הכפתור ב-error modal אם צריך.
    7.  **לשגיאות עיבוד באצווה:** בדקו את הקובץ `error_processing_filename.log` בשורש ה-vault לקבלת הודעות שגיאה מפורטות לכל קובץ שנכשל. Developer Console או error modal עשויים להציג רק סיכום או שגיאת אצווה כללית.
    8.  **יומני שגיאה אוטומטיים:** אם תהליך נכשל, התוסף שומר אוטומטית קובץ log מפורט בשם `Notemd_Error_Log_[Timestamp].txt` בספריית השורש של ה-vault. הקובץ מכיל את הודעת השגיאה, עקבות המחסנית ו-session logs. אם אתם נתקלים בבעיות עקביות, בדקו קובץ זה. הפעלת "API Error Debugging Mode" בהגדרות תמלא log זה בנתוני API response מפורטים עוד יותר.
    9.  **אבחון בקשות ארוכות ל-endpoint אמיתי (מפתחים)**:
        - נתיב בתוך התוסף (מומלץ ראשון): השתמשו ב-**Settings -> Notemd -> Developer provider diagnostic (long request)** כדי להריץ runtime probe על הספק הפעיל וליצור `Notemd_Provider_Diagnostic_*.txt` בשורש ה-vault.
        - נתיב CLI (מחוץ ל-Obsidian runtime): להשוואה משתחזרת ברמת endpoint בין buffered ל-streaming behavior, השתמשו ב:
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
        הדוח שנוצר כולל תזמונים לכל ניסיון (`First Byte`, `Duration`), request metadata מנוקים, response headers, raw / partial body fragments, parsed stream fragments ונקודות כשל של transport layer.
-   **בעיות חיבור של LM Studio / Ollama**:
    *   **בדיקת החיבור נכשלת**: ודאו שהשרת המקומי (LM Studio או Ollama) פועל ושהמודל הנכון נטען / זמין.
    *   **CORS Errors (Ollama on Windows)**: אם אתם נתקלים בשגיאות CORS (Cross-Origin Resource Sharing) בעת שימוש ב-Ollama ב-Windows, ייתכן שתצטרכו להגדיר את המשתנה `OLLAMA_ORIGINS`. ניתן לעשות זאת באמצעות הרצת `set OLLAMA_ORIGINS=*` ב-command prompt לפני הפעלת Ollama. כך תותרנה בקשות מכל מקור.
    *   **Enable CORS in LM Studio**: ב-LM Studio ניתן להפעיל CORS ישירות בהגדרות השרת, וייתכן שזה נחוץ אם Obsidian רץ בדפדפן או תחת מדיניות origin מחמירה.
-   **שגיאות יצירת תיקיות ("File name cannot contain...")**:
    *   בדרך כלל פירוש הדבר שהנתיב שסופק בהגדרות (**Processed File Folder Path** או **Concept Note Folder Path**) אינו תקין *עבור Obsidian*.
    *   **ודאו שאתם משתמשים בנתיבים יחסיים** (למשל `Processed`, `Notes/Concepts`) ולא ב-**נתיבים מוחלטים** (למשל `C:\Users\...`, `/Users/...`)।
    *   בדקו תווים לא חוקיים: `* " \ / < > : | ? # ^ [ ]`. שימו לב שגם ב-Windows התו `\` אינו תקין עבור נתיבי Obsidian. השתמשו ב-`/` כמפריד נתיבים.
-   **בעיות ביצועים**: עיבוד קבצים גדולים או רבים עשוי לקחת זמן. הפחיתו את ההגדרה "Chunk Word Count" כדי לאפשר קריאות API מהירות יותר (אך מרובות יותר). נסו ספק LLM או מודל אחר.
-   **קישוריות בלתי צפויה**: איכות ה-linking תלויה מאוד ב-LLM וב-prompt. נסו מודלים שונים או הגדרות טמפרטורה שונות.

## תרומה

תרומות יתקבלו בברכה. אנא עיינו במאגר GitHub להנחיות: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## תיעוד למתחזקים

- [תהליך שחרור (אנגלית)](./docs/maintainer/release-workflow.md)
- [תהליך שחרור (סינית מפושטת)](./docs/maintainer/release-workflow.zh-CN.md)

## רישיון

רישיון MIT - ראו את קובץ [LICENSE](LICENSE) לפרטים.

---

If you love using Notemd, please consider [⭐ Give a Star on GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) or [☕️ Buy Me a Coffee](https://ko-fi.com/jacobinwwey).

*Notemd v1.8.3 - שפרו את גרף הידע שלכם ב-Obsidian בעזרת AI.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
