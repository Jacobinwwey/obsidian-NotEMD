![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

# Notemd doplněk pro Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Přečtěte si dokumentaci v dalších jazycích: [Jazykové centrum](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 AI-poháněné vícejazyčné rozšiřování znalostí
==================================================
```

Snadný způsob, jak si vytvořit vlastní znalostní bázi.

Notemd vylepšuje váš pracovní postup v Obsidianu integrací s různými velkými jazykovými modely, LLM, aby zpracovával vaše vícejazyčné poznámky, automaticky vytvářel wiki-links pro klíčové koncepty, generoval odpovídající concept notes, prováděl webový průzkum a pomáhal vám budovat silné grafy znalostí a další.

**Verze:** 1.8.3

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Obsah

- [Rychlý start](#rychlý-start)
- [Jazyková podpora](#jazyková-podpora)
- [Funkce](#funkce)
- [Instalace](#instalace)
- [Konfigurace](#konfigurace)
- [Návod k použití](#návod-k-použití)
- [Podporovaní poskytovatelé LLM](#podporovaní-poskytovatelé-llm)
- [Použití sítě a zpracování dat](#použití-sítě-a-zpracování-dat)
- [Řešení problémů](#řešení-problémů)
- [Přispívání](#přispívání)
- [Dokumentace pro správce](#dokumentace-pro-správce)
- [Licence](#licence)

## Rychlý start

1. **Nainstalujte a povolte**: získejte doplněk z Obsidian Marketplace.
2. **Nakonfigurujte LLM**: přejděte do `Settings -> Notemd`, vyberte poskytovatele LLM, kterého chcete používat, například OpenAI nebo lokálního poskytovatele jako Ollama, a zadejte API klíč nebo URL.
3. **Otevřete sidebar**: klikněte na ikonu kouzelné hůlky Notemd v levém ribbonu a otevřete sidebar.
4. **Zpracujte poznámku**: otevřete libovolnou poznámku a klikněte na **"Process File (Add Links)"** v sidebaru, aby se automaticky přidaly `[[wiki-links]]` ke klíčovým konceptům.
5. **Spusťte rychlý workflow**: použijte výchozí tlačítko **"One-Click Extract"**, které z jednoho místa zřetězí zpracování, dávkové generování a Mermaid cleanup.

To je vše. Prozkoumejte nastavení a odemkněte další funkce, jako je webový průzkum, překlad a generování obsahu.

## Jazyková podpora

### Smlouva o jazykovém chování

| Oblast | Rozsah | Výchozí | Poznámky |
|---|---|---|---|
| `Jazyk rozhraní` | Pouze text pluginového rozhraní, tedy nastavení, postranní panel, oznámení a dialogy | `auto` | Řídí se locale Obsidianu; aktuální UI katalogy jsou `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Jazyk výstupu úloh` | Výstup úloh generovaný LLM, jako odkazy, shrnutí, generování, extrakce a cíl překladu | `en` | Může být globální nebo per-task, pokud je zapnuto `Používat různé jazyky pro úlohy`. |
| `Vypnout automatický překlad` | Úlohy mimo Translate zachovávají kontext zdrojového jazyka | `false` | Explicitní úlohy `Translate` stále vynucují nakonfigurovaný cílový jazyk. |
| Záložní lokalizace | Řešení chybějících UI klíčů | locale -> `en` | Udržuje UI stabilní, když některé klíče ještě nejsou přeložené. |

- Udržované zdrojové dokumenty jsou angličtina a zjednodušená čínština a publikované překlady README jsou odkazovány v záhlaví výše.
- Pokrytí UI locale v aplikaci nyní přesně odpovídá explicitnímu katalogu v kódu: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Anglický fallback zůstává implementační bezpečnostní sítí, ale podporované viditelné plochy jsou pokryty regresními testy a při běžném použití by se neměly tiše vracet do angličtiny.
- Další detaily a pravidla pro přispívání jsou sledovány v [Jazykovém centru](./docs/i18n/README.md).

## Funkce

### AI-poháněné zpracování dokumentů
- **Podpora Multi-LLM**: připojte se k různým cloudovým i lokálním poskytovatelům LLM. Viz [Podporovaní poskytovatelé LLM](#podporovaní-poskytovatelé-llm).
- **Chytré chunking**: automaticky rozděluje velké dokumenty na zpracovatelné části podle počtu slov.
- **Zachování obsahu**: snaží se zachovat původní formátování při přidávání struktury a odkazů.
- **Sledování postupu**: aktualizace v reálném čase přes Notemd Sidebar nebo progress modal.
- **Zrušitelné operace**: každou úlohu zpracování, jednotlivou i dávkovou, spuštěnou ze sidebaru lze zrušit vyhrazeným tlačítkem. Operace spuštěné z palety příkazů používají modal, který lze také zrušit.
- **Konfigurace více modelů**: používejte různé poskytovatele LLM i konkrétní modely pro různé úlohy, jako Add Links, Research, Generate Title a Translate, nebo jednoho poskytovatele pro vše.
- **Stable API Calls (Retry Logic)**: volitelně povolte automatické opakování neúspěšných volání LLM API s konfigurovatelným intervalem a limitem pokusů.
- **Odolnější testy připojení poskytovatele**: pokud první test poskytovatele narazí na přechodné odpojení sítě, Notemd nyní přejde na stabilní sekvenci opakování ještě před konečným selháním. To pokrývá přenosy OpenAI-compatible, Anthropic, Google, Azure OpenAI a Ollama.
- **Záložní transport podle běhového prostředí**: když je dlouho běžící požadavek na poskytovatele shozen přes `requestUrl` kvůli přechodným síťovým chybám, například `ERR_CONNECTION_CLOSED`, Notemd nejprve zopakuje stejný pokus přes environment-specific fallback transport a teprve poté vstoupí do nakonfigurované retry smyčky. Desktop buildy používají Node `http/https`, zatímco non-desktop prostředí používají browserový `fetch`. To snižuje počet falešných selhání na pomalých gateway a reverse proxy.
- **Zpevnění stable long-request chain pro OpenAI-compatible**: ve stable mode používají OpenAI-compatible volání nyní explicitní tříkrokové pořadí pro každý pokus: primární direct streaming transport, potom direct non-stream transport a poté `requestUrl` fallback, který se může v případě potřeby ještě povýšit na streamed parsing. To snižuje falešně negativní selhání, když poskytovatel dokončí buffered response, ale streaming pipe je nestabilní.
- **Protocol-aware streaming fallback napříč LLM API**: dlouhé fallback pokusy nyní přecházejí na protocol-aware streamed parsing ve všech vestavěných LLM cestách, nejen na OpenAI-compatible endpoint. Notemd nyní zvládá OpenAI/Azure-style SSE, Anthropic Messages streaming, Google Gemini SSE responses a Ollama NDJSON streamy jak na desktop `http/https`, tak na non-desktop `fetch`, a zbývající direct OpenAI-style provider entrypoint používají stejnou sdílenou fallback path.
- **Presety poskytovatelů připravené pro Čínu**: vestavěné presety nyní pokrývají `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` a `SiliconFlow` vedle existujících globálních a lokálních poskytovatelů.
- **Spolehlivé dávkové zpracování**: vylepšená logika souběžného zpracování s **časově rozloženými API voláními** pomáhá předcházet rate-limit chybám a zajišťuje stabilní výkon při velkých batch jobech. Nová implementace zajišťuje, že úlohy startují v různých intervalech, ne všechny naráz.
- **Přesné hlášení průběhu**: byla opravena chyba, kvůli níž mohl progress bar zamrznout, takže UI nyní vždy odráží skutečný stav operace.
- **Odolné paralelní dávkové zpracování**: byl vyřešen problém, kdy se paralelní dávkové operace zastavovaly příliš brzy, takže nyní jsou všechny soubory zpracovány spolehlivě a efektivně.
- **Přesnost progress baru**: byla opravena chyba, kvůli níž se progress bar příkazu "Create Wiki-Link & Generate Note" mohl zastavit na 95 %, a nyní po dokončení správně zobrazuje 100 %.
- **Rozšířené ladění API**: režim "API Error Debugging Mode" nyní zachytává celé response body od poskytovatelů LLM a vyhledávacích služeb, jako jsou Tavily a DuckDuckGo, a navíc zaznamenává časovou osu přenosu pro každý pokus se sanitizovanými request URL, dobou trvání, response headers, částečnými response body, částečně parsovaným stream výstupem a trasováním zásobníku pro lepší řešení problémů napříč fallback cestami OpenAI-compatible, Anthropic, Google, Azure OpenAI a Ollama.
- **Panel Developer Mode**: settings nyní obsahují vyhrazený panel diagnostiky pouze pro vývojáře, který zůstává skrytý, dokud není povolen "Developer mode". Podporuje výběr diagnostic call path a opakované stability probe pro zvolený režim.
- **Přepracovaný sidebar**: vestavěné akce jsou seskupeny do zaměřenějších sekcí s jasnějšími štítky, živým stavem, zrušitelným průběhem a kopírovatelnými logy, aby se snížilo zahlcení sidebaru. Patička s průběhem a logem zůstává viditelná i při rozbalení všech sekcí a stav připravenosti používá přehlednější standby progress track.
- **Vyladěná interakce a čitelnost sidebaru**: tlačítka v sidebaru nyní poskytují jasnější hover, press a focus feedback a barevná CTA tlačítka, včetně `One-Click Extract` a `Batch generate from titles`, používají silnější kontrast textu pro lepší čitelnost napříč motivy.
- **CTA mapování jen pro single-file akce**: barevný CTA styl je nyní vyhrazen pouze pro akce nad jednotlivými soubory. Dávkové a složkové akce i smíšené workflow používají ne-CTA styl, aby se omezily chyby vycházející z nesprávného odhadu rozsahu akce.
- **Vlastní one-click workflow**: přeměňte vestavěné nástroje sidebaru na znovupoužitelné vlastní tlačítka s definovanými názvy a řetězci akcí. Výchozí workflow `One-Click Extract` je k dispozici hned po instalaci.

### Rozšiřování grafu znalostí
- **Automatické wiki-propojování**: identifikuje klíčové koncepty a přidává `[[wiki-links]]` do zpracovaných poznámek na základě výstupu LLM.
- **Vytváření concept notes, volitelné a konfigurovatelné**: automaticky vytváří nové poznámky pro zjištěné koncepty ve zvolené složce vaultu.
- **Konfigurovatelné výstupní cesty**: nastavte samostatné relativní cesty ve vaultu pro ukládání zpracovaných souborů a nově vytvářených concept notes.
- **Konfigurovatelné názvy výstupních souborů pro Add Links**: můžete volitelně **přepsat původní soubor** nebo použít vlastní suffix či replacement string místo výchozího `_processed.md`, když jsou soubory zpracovávány pro přidání odkazů.
- **Zachování integrity odkazů**: základní podpora aktualizace odkazů, když jsou poznámky ve vaultu přejmenovány nebo odstraněny.
- **Čistá extrakce konceptů**: extrahujte koncepty a vytvářejte odpovídající concept notes bez úpravy zdrojového dokumentu. Je to vhodné pro rychlé budování znalostní báze z existujících dokumentů bez jejich změny. Funkce má konfigurovatelné volby pro minimální concept notes a backlinky.

### Překlad

- **AI-poháněný překlad**:
  - Překládejte obsah poznámek pomocí nakonfigurovaného LLM.
  - **Podpora velkých souborů**: velké soubory jsou automaticky rozděleny na menší části podle nastavení `Chunk word count` před odesláním do LLM. Přeložené části jsou pak plynule spojeny zpět do jednoho dokumentu.
  - Podporuje překlad mezi mnoha jazyky.
  - Konfigurovatelný cílový jazyk v settings nebo UI.
  - Automaticky otevírá přeložený text vpravo od originálu pro pohodlnější čtení.
- **Dávkový překlad**:
  - Přeložte všechny soubory ve vybrané složce.
  - Podporuje paralelní zpracování, pokud je povoleno "Enable Batch Parallelism".
  - Používá vlastní prompt pro překlad, pokud jste je nastavili.
  - Přidává volbu "Batch translate this folder" do kontextové nabídky file exploreru.
- **Zakázat automatický překlad**: pokud je tato volba zapnuta, úlohy mimo Translate již nevynucují konkrétní jazyk výstupu a zachovávají kontext zdrojového jazyka. Explicitní úloha "Translate" stále provede překlad podle konfigurace.

### Webový průzkum a generování obsahu
- **Webový výzkum a shrnutí**:
  - Provádějte webové vyhledávání pomocí Tavily, které vyžaduje API klíč, nebo DuckDuckGo, které je experimentální.
  - **Lepší robustnost vyhledávání**: vyhledávání DuckDuckGo nyní používá vylepšenou logiku parsování, `DOMParser` s Regex fallbackem, aby lépe zvládalo změny rozvržení a vracelo spolehlivé výsledky.
  - Shrnujte výsledky vyhledávání pomocí nakonfigurovaného LLM.
  - Výstupní jazyk shrnutí lze nastavit v settings.
  - Připojujte shrnutí k aktuální poznámce.
  - Konfigurovatelný limit tokenů pro research content posílaný do LLM.
- **Generování obsahu z názvu**:
  - Použijte název poznámky k vygenerování počátečního obsahu přes LLM, který nahradí stávající obsah.
  - **Volitelný průzkum**: nastavte, zda se má provádět webový průzkum pomocí zvoleného poskytovatele, aby poskytl kontext pro generování.
- **Dávkové generování obsahu z názvů**: generujte obsah pro všechny poznámky ve vybrané složce podle jejich názvů s respektováním volitelného nastavení průzkumu. Úspěšně zpracované soubory jsou přesunuty do **konfigurovatelné pod-složky "complete"**, například `[foldername]_complete` nebo pod vlastní název, aby se zabránilo opětovnému zpracování.
- **Mermaid auto-fix coupling**: když je povolen Mermaid auto-fix, Mermaid-related workflow nyní po zpracování automaticky opravují vygenerované soubory nebo výstupní složky. To pokrývá Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid a Translate.

### Užitkové funkce
- **Shrnutí jako diagram Mermaid**:
  - Tato funkce vám umožní shrnout obsah poznámky do Mermaid diagramu.
  - Výstupní jazyk Mermaid diagramu lze přizpůsobit v settings.
  - **Mermaid Output Folder**: nastavte složku, kam budou ukládány vygenerované soubory Mermaid diagramů.
  - **Translate Summarize to Mermaid Output**: volitelně přeložte vygenerovaný obsah Mermaid diagramu do nastaveného cílového jazyka.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Jednoduchá korekce formátu vzorců**:
  - Rychle opravuje jednořádkové matematické vzorce ohraničené jedním `$` na standardní bloky `$$`.
  - **Single File**: zpracujte aktuální soubor pomocí tlačítka v sidebaru nebo z palety příkazů.
  - **Batch Fix**: zpracujte všechny soubory ve vybrané složce pomocí tlačítka v sidebaru nebo z palety příkazů.

- **Check for Duplicates in Current File**: tento příkaz pomáhá identifikovat potenciálně duplicitní výrazy v aktivním souboru.
- **Duplicate Detection**: základní kontrola duplicitních slov v obsahu právě zpracovávaného souboru, výsledky se zapisují do console.
- **Check and Remove Duplicate Concept Notes**: identifikuje potenciální duplicitní poznámky v nakonfigurované **Concept Note Folder** na základě přesné shody názvu, plurálů, normalizace a containment jednoho slova ve srovnání s poznámkami mimo složku. Rozsah porovnání, tedy které poznámky mimo concept folder se mají kontrolovat, lze nastavit na **celý vault**, **jen konkrétní zahrnuté složky** nebo **všechny složky kromě konkrétně vyloučených**. Zobrazuje podrobný seznam s důvody a konfliktními soubory a poté žádá potvrzení před přesunutím nalezených duplicit do system trash. Během mazání zobrazuje průběh.
- **Batch Mermaid Fix**: aplikuje opravy syntaxe Mermaid a LaTeX na všechny Markdown soubory ve složce vybrané uživatelem.
  - **Připraveno pro workflow**: může být použito jako samostatný nástroj nebo jako krok uvnitř vlastního one-click workflow tlačítka.
  - **Hlášení chyb**: generuje report `mermaid_error_{foldername}.md`, který vypisuje soubory, jež po zpracování stále obsahují potenciální chyby Mermaid.
  - **Přesun souborů s chybami**: volitelně přesouvá soubory s nalezenými chybami do určené složky pro manuální review.
  - **Chytrá detekce**: nyní inteligentně kontroluje soubory na syntax errors pomocí `mermaid.parse` ještě před pokusem o opravu, čímž šetří čas zpracování a zabraňuje zbytečným úpravám.
  - **Bezpečné zpracování**: zajišťuje, že opravy syntaxe jsou aplikovány výhradně na Mermaid code blocks, aby nedošlo k nechtěné úpravě Markdown tabulek nebo jiného obsahu. Obsahuje i robustní ochranu syntaxe tabulek, například `| :--- |`, proti příliš agresivním debug opravám.
  - **Deep Debug Mode**: pokud po první opravě chyby přetrvávají, spustí se pokročilý deep debug režim. Ten řeší složité edge case, včetně:
    - **Comment Integration**: automaticky spojuje koncové komentáře začínající `%` do edge labelu, například `A -- Label --> B; % Comment` se změní na `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: opravuje šipky pohlcené uvnitř uvozovek, například `A -- "Label -->" B` na `A -- "Label" --> B`.
    - **Inline Subgraphs**: převádí inline subgraph labels na edge labels.
    - **Reverse Arrow Fix**: opravuje nestandardní šipky `X <-- Y` na `Y --> X`.
    - **Direction Keyword Fix**: zajišťuje, že klíčové slovo `direction` je uvnitř subgraphů malými písmeny, například `Direction TB` -> `direction TB`.
    - **Comment Conversion**: převádí komentáře `//` na edge labels, například `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: zjednodušuje opakované labely v hranatých závorkách, například `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: převádí neplatnou syntaxi šipky `--|>` na standardní `-->`.
    - **Robustní práce s labely a poznámkami**: vylepšené zpracování labelů obsahujících speciální znaky, například `/`, a lepší podpora vlastního note syntaxe `note for ...`, přičemž se čistě odstraňují artefakty jako zbylé závorky na konci.
    - **Advanced Fix Mode**: obsahuje robustní opravy neuzavřených nebo neoznačených node labelů obsahujících mezery, speciální znaky nebo vnořené závorky, například `Node[Label [Text]]` -> `Node["Label [Text]"]`, což zajišťuje kompatibilitu se složitými diagramy typu Stellar Evolution. Zároveň opravuje poškozené edge labels, například `--["Label["-->` na `-- "Label" -->`. Kromě toho převádí inline komentáře jako `Consensus --> Adaptive; # Some advanced consensus` na `Consensus -- "Some advanced consensus" --> Adaptive` a opravuje nedokončené uvozovky na konci řádku, kdy finální `;"` nahrazuje `"]`.
    - **Note Conversion**: automaticky převádí `note right/left of` a samostatné komentáře `note :` na standardní Mermaid node definitions a spojení, například `note right of A: text` se změní na `NoteA["Note: text"]` propojený s `A`, což zabraňuje syntaktickým chybám a zlepšuje layout. Nyní podporuje jak šipkové odkazy (`-->`), tak plné spojnice (`---`).
    - **Extended Note Support**: automaticky převádí `note for Node "Content"` a `note of Node "Content"` na standardní propojené note nodes, například `NoteNode[" Content"]` propojený s `Node`, aby byla zajištěna kompatibilita s uživatelsky rozšířenou syntaxí.
    - **Enhanced Note Correction**: automaticky přejmenovává poznámky sekvenčním číslováním, například `Note1`, `Note2`, aby nedocházelo k problémům s aliasy při výskytu více poznámek.
    - **Parallelogram/Shape Fix**: opravuje poškozené tvary uzlů, například `[/["Label["/]`, na standardní `["Label"]`, čímž zajišťuje kompatibilitu s generovaným obsahem.
    - **Standardize Pipe Labels**: automaticky opravuje a sjednocuje edge labels obsahující svislé čáry tak, aby byly správně uzavřené v uvozovkách, například `-->|Text|` se změní na `-->|"Text"|` a `-->|Math|^2|` na `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: opravuje edge labels umístěné chybně před šipkou, například `>|"Label"| A --> B` na `A -->|"Label"| B`.
    - **Merge Double Labels**: detekuje a slučuje složité dvojité labely na jedné hraně, například `A -- Label1 -- Label2 --> B` nebo `A -- Label1 -- Label2 --- B`, do jednoho čistého labelu s oddělením řádků: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: automaticky uzavírá do uvozovek node labely obsahující potenciálně problematické znaky, jako jsou uvozovky, rovnítka nebo matematické operátory, ale bez vnějších uvozovek, například `Plot[Plot "A"]` na `Plot["Plot "A""]`, aby se zabránilo render chybám.
    - **Intermediate Node Fix**: rozděluje hrany obsahující definici prostředního uzlu do dvou samostatných hran, například `A -- B[...] --> C` na `A --> B[...]` a `B[...] --> C`, čímž zajišťuje validní Mermaid syntaxi.
    - **Concatenated Label Fix**: robustně opravuje definice uzlů, kde je ID spojeno s labelem, například `SubdivideSubdivide...` na `Subdivide["Subdivide..."]`, i když mu předcházejí pipe labels nebo když duplicita není přesná, a to validací proti známým node ID.
- **Extract Specific Original Text**:
  - Definujte seznam otázek v settings.
  - Extrahuje doslovné textové úseky z aktivní poznámky, které odpovídají těmto otázkám.
  - **Merged Query Mode**: možnost zpracovat všechny otázky jedním API voláním kvůli vyšší efektivitě.
  - **Translation**: možnost zahrnout do výstupu překlady extrahovaného textu.
  - **Custom Output**: konfigurovatelná cesta uložení a suffix názvu souboru pro extrahovaný text.
- **LLM Connection Test**: ověřte API settings pro aktivního poskytovatele.

## Instalace

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Z Obsidian Marketplace (doporučeno)
1. Otevřete v Obsidianu **Settings** -> **Community plugins**.
2. Ujistěte se, že je "Restricted mode" **vypnutý**.
3. Klikněte na **Browse** community plugins a vyhledejte "Notemd".
4. Klikněte na **Install**.
5. Po instalaci klikněte na **Enable**.

### Ruční instalace
1. Stáhněte si nejnovější release assety ze [stránky GitHub Releases](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Každý release také obsahuje `README.md` jako referenci v balíčku, ale pro ruční instalaci potřebujete jen `main.js`, `styles.css` a `manifest.json`.
2. Přejděte do konfigurační složky vašeho Obsidian vaultu: `<YourVault>/.obsidian/plugins/`.
3. Vytvořte novou složku s názvem `notemd`.
4. Zkopírujte `main.js`, `styles.css` a `manifest.json` do složky `notemd`.
5. Restartujte Obsidian.
6. Přejděte do **Settings** -> **Community plugins** a zapněte "Notemd".

## Konfigurace

Přístup ke settings pluginu:
**Settings** -> **Community Plugins** -> **Notemd** (klikněte na ikonu ozubeného kola).

### Konfigurace poskytovatele LLM
1. **Aktivní poskytovatel**: vyberte z rozbalovacího seznamu poskytovatele LLM, kterého chcete používat.
2. **Nastavení poskytovatele**: nakonfigurujte konkrétní nastavení pro vybraného poskytovatele:
   - **API Key**: vyžadován pro většinu cloudových poskytovatelů, například OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks a Requesty. Není potřeba pro Ollama. Je volitelný pro LM Studio a obecný preset `OpenAI Compatible`, pokud váš endpoint přijímá anonymní nebo placeholder přístup.
   - **Base URL / Endpoint**: API endpoint služby. Výchozí hodnoty jsou dodány, ale může být nutné je změnit pro lokální modely, jako LMStudio a Ollama, gatewaye typu OpenRouter, Requesty a OpenAI Compatible, nebo pro konkrétní Azure deploymenty. **Povinné pro Azure OpenAI.**
   - **Model**: konkrétní název nebo ID modelu, který chcete použít, například `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5` nebo `anthropic/claude-3-7-sonnet-latest`. Ujistěte se, že je model u vašeho poskytovatele nebo endpointu dostupný.
   - **Temperature**: řídí náhodnost výstupu LLM, kde 0 = deterministické a 1 = maximální kreativita. Nižší hodnoty, například 0.2-0.5, bývají lepší pro strukturované úlohy.
   - **API Version (Azure Only)**: povinné pro Azure OpenAI deploymenty, například `2024-02-15-preview`.
3. **Otestovat připojení**: použijte tlačítko "Otestovat připojení" pro aktivního poskytovatele, abyste ověřili svá settings. OpenAI-compatible poskytovatelé nyní používají provider-aware kontroly: endpointy jako `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` a `OpenAI Compatible` testují `chat/completions` přímo, zatímco poskytovatelé se spolehlivým `/models` endpointem mohou stále použít listing modelů jako první. Pokud první probe selže kvůli přechodnému síťovému odpojení, například `ERR_CONNECTION_CLOSED`, Notemd automaticky přejde na stabilní retry sekvenci místo okamžitého selhání.
4. **Spravovat konfigurace poskytovatelů**: použijte tlačítka "Export Providers" a "Import Providers" pro uložení nebo načtení settings poskytovatelů LLM do nebo z souboru `notemd-providers.json` ve konfiguračním adresáři pluginu. To usnadňuje backup a sdílení.
5. **Pokrytí presetů**: kromě původních poskytovatelů nyní Notemd obsahuje předdefinované záznamy pro `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` a obecný cíl `OpenAI Compatible` pro LiteLLM, vLLM, Perplexity, Vercel AI Gateway nebo vlastní proxy.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Konfigurace více modelů
- **Používat různé poskytovatele pro úlohy**:
  - **Vypnuto (výchozí)**: používá jediného „aktivního poskytovatele“, zvoleného výše, pro všechny úlohy.
  - **Zapnuto**: umožňuje vybrat konkrétního poskytovatele a volitelně přepsat název modelu pro každou úlohu, například "Add Links", "Research & Summarize", "Generate from Title", "Translate" a "Extract Concepts". Pokud pole pro přepsání modelu u dané úlohy zůstane prázdné, použije se výchozí model nakonfigurovaný pro poskytovatele zvoleného pro tuto úlohu.
- **Vybrat různé jazyky pro různé úlohy**:
  - **Vypnuto (výchozí)**: používá jeden výstupní jazyk pro všechny úlohy.
  - **Zapnuto**: umožňuje vybrat konkrétní jazyk pro každou úlohu, například "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram" a "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Jazyková architektura (jazyk rozhraní a jazyk výstupu úloh)

- **Jazyk rozhraní** řídí pouze text pluginového rozhraní, tedy štítky nastavení, tlačítka postranního panelu, oznámení a dialogy. Výchozí režim `auto` sleduje aktuální jazyk UI v Obsidianu.
- Regionální a písmové varianty se nyní mapují na nejbližší vydaný katalog, místo aby rovnou spadly do angličtiny. Například `fr-CA` používá francouzštinu, `es-419` španělštinu, `pt-PT` portugalštinu, `zh-Hans` zjednodušenou čínštinu a `zh-Hant-HK` tradiční čínštinu.
- **Jazyk výstupu úloh** řídí modelově generovaný výstup úloh, jako odkazy, shrnutí, generování názvů, Mermaid summary, extrakci konceptů a cílový jazyk překladu.
- **Per-task language mode** umožňuje, aby si každá úloha určovala svůj výstupní jazyk z jedné společné policy vrstvy namísto rozptýlených override v jednotlivých modulech.
- **Zakázat automatický překlad** drží úlohy mimo Translate v kontextu zdrojového jazyka, zatímco explicitní úlohy Translate stále vynucují nakonfigurovaný cílový jazyk.
- Mermaid-related generovací cesty následují stejnou jazykovou policy a při aktivaci mohou stále spouštět Mermaid auto-fix.

### Nastavení stabilních API volání
- **Povolit stabilní volání API (logika opakování)**:
  - **Vypnuto (výchozí)**: jediné selhání API callu zastaví aktuální úlohu.
  - **Zapnuto**: automaticky opakuje neúspěšná volání LLM API, což je užitečné při přerušovaných síťových problémech nebo rate limitech.
  - **Connection Test Fallback**: i když běžná volání ještě neběží ve stable mode, testy připojení poskytovatelů nyní po první přechodné síťové chybě přecházejí na stejnou retry sekvenci.
  - **Runtime Transport Fallback (Environment-Aware)**: dlouhé task requesty, které `requestUrl` přechodně shodí, nyní opakují stejný pokus nejprve přes environment-aware fallback. Desktop buildy používají Node `http/https`, non-desktop prostředí browserový `fetch`. Tyto fallback pokusy nyní používají protocol-aware streamed parsing napříč vestavěnými LLM cestami, včetně OpenAI-compatible SSE, Azure OpenAI SSE, Anthropic Messages SSE, Google Gemini SSE a Ollama NDJSON outputu, takže pomalé gatewaye mohou vracet body chuny dříve. Zbývající direct OpenAI-style provider entrypointy používají tutéž shared fallback path.
  - **OpenAI-Compatible Stable Order**: ve stable mode se každý OpenAI-compatible pokus nyní řídí sekvencí `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` předtím, než je započítán jako neúspěšný pokus. To brání příliš agresivnímu selhání v situaci, kdy je flaky jen jeden transport mode.
- **Retry Interval (seconds)**: viditelné pouze při zapnutí. Doba čekání mezi retry pokusy, 1-300 sekund. Výchozí: 5.
- **Maximum Retries**: viditelné pouze při zapnutí. Maximální počet retry pokusů, 0-10. Výchozí: 3.
- **Režim ladění chyb API**:
  - **Vypnuto (výchozí)**: používá standardní a stručné hlášení chyb.
  - **Zapnuto**: aktivuje detailní logování chyb, podobné podrobnému výstupu DeepSeek, pro všechny poskytovatele a úlohy, včetně Translate, Search a Connection Tests. Zahrnuje HTTP status kódy, surový text odpovědi, časovou osu přenosu requestů, sanitizované request URL a hlavičky, dobu trvání pokusů, hlavičky odpovědí, částečná těla odpovědí, parsovaný částečný stream výstup a trasování zásobníku, což je zásadní pro řešení problémů s API připojením a resetů z upstream gateway.
- **Developer Mode**:
  - **Vypnuto (výchozí)**: skrývá všechny diagnostické ovládací prvky určené pouze vývojářům před běžnými uživateli.
  - **Zapnuto**: zobrazuje ve Settings vyhrazený panel diagnostiky pro vývojáře.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: vyberte runtime path pro každý probe. OpenAI-compatible poskytovatelé podporují vedle runtime režimů i další vynucené režimy `direct streaming`, `direct buffered` a `requestUrl-only`.
  - **Run Diagnostic**: spustí jeden long-request probe se zvoleným call mode a zapíše `Notemd_Provider_Diagnostic_*.txt` do kořene vaultu.
  - **Run Stability Test**: opakuje probe konfigurovatelný početkrát, 1-10, se zvoleným call mode a ukládá agregovaný stability report.
  - **Diagnostic Timeout**: konfigurovatelný timeout pro jeden běh, 15-3600 sekund.
  - **Why Use It**: rychlejší než manuální reprodukce, když poskytovatel projde "Test connection", ale selhává na reálných dlouhých úlohách, například na překladu přes pomalý gateway.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Obecná nastavení

#### Výstup zpracovaného souboru
- **Customize Processed File Save Path**:
  - **Vypnuto (výchozí)**: zpracované soubory, například `YourNote_processed.md`, se ukládají do *stejné složky* jako původní poznámka.
  - **Zapnuto**: umožňuje zadat vlastní umístění ukládání.
- **Processed File Folder Path**: viditelné jen při zapnutí předchozí volby. Zadejte *relativní cestu* uvnitř vaultu, například `Processed Notes` nebo `Output/LLM`, kam se mají ukládat zpracované soubory. Složky budou vytvořeny, pokud neexistují. **Nepoužívejte absolutní cesty, jako `C:\...`, ani neplatné znaky.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Vypnuto (výchozí)**: zpracované soubory vytvořené příkazem "Add Links" používají výchozí suffix `_processed.md`, například `YourNote_processed.md`.
  - **Zapnuto**: umožňuje přizpůsobit výstupní název souboru pomocí nastavení níže.
- **Custom Suffix/Replacement String**: viditelné jen při zapnutí předchozí volby. Zadejte řetězec, který se má použít ve výstupním názvu souboru.
  - Pokud zůstane pole **prázdné**, původní soubor bude **přepsán** zpracovaným obsahem.
  - Pokud zadáte řetězec, například `_linked`, přidá se k původnímu názvu, například `YourNote_linked.md`. Ujistěte se, že suffix neobsahuje neplatné znaky názvu souboru.

- **Remove Code Fences on Add Links**:
  - **Vypnuto (výchozí)**: code fences **(\`\\\`\`)** zůstávají v obsahu při přidávání odkazů a **(\`\\\`markdown)** je automaticky odstraněno.
  - **Zapnuto**: odstraní code fences z obsahu ještě před přidáním odkazů.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Výstup konceptuální poznámky
- **Customize Concept Note Path**:
  - **Vypnuto (výchozí)**: automatické vytváření poznámek pro `[[linked concepts]]` je vypnuté.
  - **Zapnuto**: umožňuje určit složku, ve které budou vytvářeny nové concept notes.
- **Concept Note Folder Path**: viditelné pouze při zapnutí předchozí volby. Zadejte *relativní cestu* uvnitř vaultu, například `Concepts` nebo `Generated/Topics`, kam se budou ukládat nové concept notes. Složky budou vytvořeny, pokud neexistují. **Musí být vyplněno, pokud je přizpůsobení zapnuté.** **Nepoužívejte absolutní cesty ani neplatné znaky.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Výstup log souboru konceptů
- **Generate Concept Log File**:
  - **Vypnuto (výchozí)**: log soubor se nevytváří.
  - **Zapnuto**: vytváří log soubor se seznamem nově vytvořených concept notes po zpracování. Formát je:
    ```
    vygenerovat xx md souborů s koncepty
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: viditelné jen pokud je "Generate Concept Log File" zapnuto.
  - **Vypnuto (výchozí)**: log soubor se ukládá do **Concept Note Folder Path**, pokud je zadána, nebo jinak do kořene vaultu.
  - **Zapnuto**: umožňuje určit vlastní složku pro log soubor.
- **Concept Log Folder Path**: viditelné jen pokud je "Customize Log File Save Path" zapnuto. Zadejte *relativní cestu* uvnitř vaultu, například `Logs/Notemd`, kam se má log soubor uložit. **Musí být vyplněno, pokud je přizpůsobení zapnuto.**
- **Customize Log File Name**: viditelné jen pokud je "Generate Concept Log File" zapnuto.
  - **Vypnuto (výchozí)**: log soubor se jmenuje `Generate.log`.
  - **Zapnuto**: umožňuje zadat vlastní název log souboru.
- **Concept Log File Name**: viditelné jen pokud je "Customize Log File Name" zapnuto. Zadejte požadovaný název souboru, například `ConceptCreation.log`. **Musí být vyplněno, pokud je přizpůsobení zapnuto.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Úloha extrakce pojmů
- **Vytvářet minimální poznámky ke konceptům**:
  - **On (Default)**: nově vytvořené concept notes budou obsahovat pouze titul, například `# Concept`.
  - **Off**: concept notes mohou obsahovat další obsah, například backlink "Linked From", pokud to není vypnuto nastavením níže.
- **Add "Linked From" backlink**:
  - **Off (Default)**: během extrakce nepřidává backlink na zdrojový dokument do concept note.
  - **On**: přidává sekci "Linked From" s backlinkem na zdrojový soubor.

#### Extrahovat konkrétní původní text
- **Questions for extraction**: zadejte seznam otázek, jednu na řádek, pro které chcete, aby AI vyhledala doslovné odpovědi ve vašich poznámkách.
- **Translate output to corresponding language**:
  - **Off (Default)**: vypíše pouze extrahovaný text v jeho původním jazyce.
  - **On**: připojí překlad extrahovaného textu v jazyce vybraném pro tuto úlohu.
- **Merged query mode**:
  - **Off**: zpracovává každou otázku samostatně, s vyšší přesností, ale za cenu více API volání.
  - **On**: pošle všechny otázky v jednom promptu, což je rychlejší a používá méně API volání.
- **Customise extracted text save path & filename**:
  - **Off**: ukládá do stejné složky jako původní soubor se suffixem `_Extracted`.
  - **On**: umožňuje nastavit vlastní výstupní složku a suffix názvu souboru.

#### Dávková oprava Mermaid
- **Enable Mermaid Error Detection**:
  - **Off (Default)**: detekce chyb se po zpracování přeskočí.
  - **On**: skenuje zpracované soubory na zbývající Mermaid syntax errors a generuje report `mermaid_error_{foldername}.md`.
- **Move files with Mermaid errors to specified folder**:
  - **Off**: soubory s chybami zůstávají na místě.
  - **On**: přesune všechny soubory, které i po pokusu o opravu stále obsahují Mermaid syntax errors, do vyhrazené složky pro ruční kontrolu.
- **Mermaid error folder path**: viditelné při zapnutí předchozí volby. Složka, do které se mají chybové soubory přesouvat.

#### Parametry zpracování
- **Enable Batch Parallelism**:
  - **Vypnuto (výchozí)**: dávkové úlohy, například "Process Folder" nebo "Batch Generate from Titles", zpracovávají soubory jeden po druhém, sériově.
  - **Zapnuto**: umožňuje pluginu zpracovávat více souborů současně, což může výrazně urychlit velké dávkové úlohy.
- **Batch Concurrency**: viditelné jen při zapnutém parallelismu. Nastavuje maximální počet souborů zpracovávaných paralelně. Vyšší číslo může být rychlejší, ale používá více prostředků a může narazit na API rate limits. Výchozí: 1, rozsah: 1-20.
- **Batch Size**: viditelné jen při zapnutém parallelismu. Počet souborů sdružených do jednoho batch. Výchozí: 50, rozsah: 10-200.
- **Delay Between Batches (ms)**: viditelné jen při zapnutém parallelismu. Volitelná prodleva v milisekundách mezi zpracováním jednotlivých batchů, která může pomoci řídit API rate limits. Výchozí: 1000 ms.
- **API Call Interval (ms)**: minimální prodleva v milisekundách *před a po* každém jednotlivém volání LLM API. Zásadní pro low-rate API nebo pro prevenci chyb 429. Nastavte 0, pokud nechcete žádnou umělou prodlevu. Výchozí: 500 ms.
- **Chunk Word Count**: maximální počet slov na chunk odeslaný do LLM. Ovlivňuje počet API volání u velkých souborů. Výchozí: 3000.
- **Enable Duplicate Detection**: přepínač základní kontroly duplicitních slov ve zpracovaném obsahu, výsledky se zapisují do console. Výchozí: zapnuto.
- **Max Tokens**: maximální počet tokenů, které má LLM vygenerovat pro jeden response chunk. Ovlivňuje cenu i míru detailu. Výchozí: 4096.
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Překlad
- **Default Target Language**: vyberte výchozí jazyk, do kterého chcete své poznámky překládat. To lze přepsat v UI při spuštění překladového příkazu. Výchozí: English.
- **Customise Translation File Save Path**:
  - **Vypnuto (výchozí)**: přeložené soubory se ukládají do *stejné složky* jako původní poznámka.
  - **Zapnuto**: umožňuje určit *relativní cestu* ve vaultu, například `Translations`, kam se mají přeložené soubory ukládat. Složky budou vytvořeny, pokud neexistují.
- **Use custom suffix for translated files**:
  - **Vypnuto (výchozí)**: přeložené soubory používají výchozí suffix `_translated.md`, například `YourNote_translated.md`.
  - **Zapnuto**: umožňuje zadat vlastní suffix.
- **Custom Suffix**: viditelné jen při zapnutí předchozí volby. Zadejte vlastní suffix, který se připojí k názvu přeloženého souboru, například `_es` nebo `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Generování obsahu
- **Enable Research in "Generate from Title"**:
  - **Vypnuto (výchozí)**: "Generate from Title" používá jako vstup pouze název.
  - **Zapnuto**: provádí web research pomocí nakonfigurovaného **Web Research Provider** a zahrne zjištění jako kontext pro LLM při generování obsahu z názvu.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Zapnuto (výchozí)**: automaticky spouští Mermaid syntax-fixing pass po Mermaid-related workflow, jako jsou Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid a Translate.
  - **Vypnuto**: ponechává vygenerovaný Mermaid výstup beze změny, pokud nespustíte `Batch Mermaid Fix` ručně nebo jej nepřidáte do vlastního workflow.
- **Output Language**: nové. Vyberte požadovaný výstupní jazyk pro úlohy "Generate from Title" a "Batch Generate from Title".
  - **English (Default)**: prompt se zpracovávají a výstup vzniká v angličtině.
  - **Other Languages**: LLM je instruováno, aby uvažovalo v angličtině, ale výslednou dokumentaci poskytlo ve vašem zvoleném jazyce, například Español, Français, 简体中文, 繁體中文, العربية, हिन्दी a podobně.
- **Change Prompt Word**: nové.
  - **Change Prompt Word**: umožňuje změnit prompt word pro konkrétní úlohu.
  - **Custom Prompt Word**: zadejte vlastní prompt word pro danou úlohu.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Vypnuto (výchozí)**: úspěšně vygenerované soubory jsou přesunuty do podsložky pojmenované `[OriginalFolderName]_complete` relativně k rodičovské složce původní složky, případně `Vault_complete`, pokud původní složka byla root.
  - **Zapnuto**: umožňuje zadat vlastní název podsložky, do které budou přesunuty dokončené soubory.
- **Custom Output Folder Name**: viditelné jen při zapnutí předchozí volby. Zadejte požadovaný název podsložky, například `Generated Content` nebo `_complete`. Neplatné znaky nejsou povoleny. Pokud pole zůstane prázdné, použije se `_complete`. Tato složka se vytváří relativně k rodičovské složce původní složky.

#### Tlačítka pracovního postupu na jedno kliknutí
- **Visual Workflow Builder**: vytvářejte vlastní workflow tlačítka z vestavěných akcí bez ručního psaní DSL.
- **Custom Workflow Buttons DSL**: pokročilí uživatelé mohou stále upravovat definiční text workflow přímo. Neplatné DSL bezpečně spadne zpět na výchozí workflow a zobrazí varování v UI sidebaru nebo settings.
- **Workflow Error Strategy**:
  - **Stop on Error (Default)**: zastaví workflow okamžitě při selhání jednoho kroku.
  - **Continue on Error**: pokračuje v dalších krocích a na konci nahlásí počet neúspěšných akcí.
- **Default Workflow Included**: `One-Click Extract` řetězí `Process File (Add Links)`, `Batch Generate from Titles` a `Batch Mermaid Fix`.

#### Nastavení vlastních pokynů
Tato funkce vám umožňuje přepsat výchozí instrukce, tedy prompty, posílané do LLM pro konkrétní úlohy, a poskytuje vám jemnozrnnou kontrolu nad výstupem.

- **Enable Custom Prompts for Specific Tasks**:
  - **Vypnuto (výchozí)**: plugin používá své vestavěné výchozí prompty pro všechny operace.
  - **Zapnuto**: aktivuje možnost nastavit vlastní prompty pro úlohy vypsané níže. Jde o hlavní přepínač celé funkce.

- **Use Custom Prompt for [Task Name]**: viditelné pouze při zapnutí předchozí volby.
  - U každé podporované úlohy, například "Add Links", "Generate from Title", "Research & Summarize" a "Extract Concepts", můžete vlastní prompt jednotlivě povolit nebo zakázat.
  - **Disabled**: tato konkrétní úloha použije výchozí prompt.
  - **Zapnuto**: tato úloha použije text, který zadáte do odpovídajícího pole "Custom Prompt" níže.

- **Custom Prompt Text Area**: viditelné pouze tehdy, když je vlastní prompt u dané úlohy zapnut.
  - **Default Prompt Display**: pro referenci plugin zobrazuje výchozí prompt, který by pro danou úlohu normálně použil. Můžete využít tlačítko **"Copy Default Prompt"** a zkopírovat si tento text jako výchozí bod pro vlastní prompt.
  - **Custom Prompt Input**: sem zapisujete vlastní instrukce pro LLM.
  - **Placeholders**: ve svém promptu můžete a měli byste používat speciální placeholders, které plugin před odesláním požadavku do LLM nahradí skutečným obsahem. Podívejte se do výchozího promptu, které placeholders jsou pro danou úlohu dostupné. Běžné placeholders zahrnují:
    - `{TITLE}`: název aktuální poznámky.
    - `{RESEARCH_CONTEXT_SECTION}`: obsah shromážděný z web research.
    - `{USER_PROMPT}`: obsah právě zpracovávané poznámky.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Rozsah kontroly duplicit
- **Duplicate Check Scope Mode**: řídí, které soubory se budou porovnávat s poznámkami ve vaší Concept Note Folder kvůli potenciálním duplicitám.
  - **Entire Vault (Default)**: porovnává concept notes se všemi ostatními poznámkami ve vaultu kromě samotné Concept Note Folder.
  - **Include Specific Folders Only**: porovnává concept notes jen s poznámkami uvnitř složek uvedených níže.
  - **Exclude Specific Folders**: porovnává concept notes se všemi poznámkami *kromě* těch ve složkách uvedených níže a zároveň vylučuje i samotnou Concept Note Folder.
  - **Concept Folder Only**: porovnává concept notes jen s *ostatními poznámkami uvnitř Concept Note Folder*. To pomáhá nacházet duplicity čistě uvnitř generovaných konceptů.
- **Include/Exclude Folders**: viditelné pouze pokud je Mode nastaven na 'Include' nebo 'Exclude'. Zadejte *relativní cesty* složek, které chcete zahrnout nebo vyloučit, **jednu cestu na řádek**. Cesty rozlišují velikost písmen a používají `/` jako oddělovač, například `Reference Material/Papers` nebo `Daily Notes`. Tyto složky nesmí být totožné s Concept Note Folder ani v ní ležet.

#### Poskytovatel webového průzkumu
- **Search Provider**: vyberte mezi `Tavily`, který vyžaduje API klíč a je doporučený, a `DuckDuckGo`, který je experimentální a vyhledávač jej při automatizovaných požadavcích často blokuje. Používá se pro "Research & Summarize Topic" a volitelně i pro "Generate from Title".
- **Tavily API Key**: viditelné jen pokud je zvoleno Tavily. Zadejte svůj API klíč z [tavily.com](https://tavily.com/).
- **Tavily Max Results**: viditelné jen pokud je zvoleno Tavily. Maximální počet search výsledků, které má Tavily vrátit, 1-20. Výchozí: 5.
- **Tavily Search Depth**: viditelné jen pokud je zvoleno Tavily. Vyberte `basic`, výchozí, nebo `advanced`. Poznámka: `advanced` poskytuje lepší výsledky, ale stojí 2 API kredity na jedno vyhledání namísto 1.
- **DuckDuckGo Max Results**: viditelné jen pokud je zvoleno DuckDuckGo. Maximální počet search výsledků k parsování, 1-10. Výchozí: 5.
- **DuckDuckGo Content Fetch Timeout**: viditelné jen pokud je zvoleno DuckDuckGo. Maximální počet sekund čekání při pokusu načíst obsah z každého URL výsledku DuckDuckGo. Výchozí: 15.
- **Max Research Content Tokens**: přibližný maximální počet tokenů z kombinovaných výsledků web research, snippets nebo fetched content, které mají být zahrnuty do sumarizačního promptu. Pomáhá řídit velikost context window a náklady. Výchozí: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Zaměřená studijní oblast
- **Enable Focused Learning Domain**:
  - **Vypnuto (výchozí)**: prompty posílané do LLM používají standardní obecné instrukce.
  - **Zapnuto**: umožňuje určit jednu nebo více oblastí studia, aby se zlepšilo kontextové porozumění LLM.
- **Learning Domain**: viditelné pouze při zapnutí předchozí volby. Zadejte své konkrétní obory, například 'Materials Science', 'Polymer Physics', 'Machine Learning'. To přidá na začátek promptů řádek "Relevant Fields: [...]", který pomůže LLM generovat přesnější a relevantnější links i obsah pro vaši konkrétní oblast.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Návod k použití

### Rychlé pracovní postupy a postranní panel

- Otevřete Notemd sidebar a získejte přístup ke seskupeným sekcím akcí pro základní zpracování, generování, překlad, znalosti a utility.
- Použijte oblast **Rychlé pracovní postupy** v horní části sidebaru pro spouštění vlastních multi-step tlačítek.
- Výchozí workflow **One-Click Extract** spouští `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Průběh workflow, logy jednotlivých kroků a selhání se zobrazují v sidebaru a připnutá patička chrání progress bar i log oblast před vytlačením rozbalenými sekcemi.
- Karta průběhu udržuje status text, samostatný percentage pill i zbývající čas přehledně čitelné a stejné custom workflow lze znovu konfigurovat ze settings.

### Původní zpracování (přidávání Wiki-Links)
Toto je základní funkcionalita zaměřená na identifikaci konceptů a přidávání `[[wiki-links]]`.

**Důležité:** tento proces funguje pouze na souborech `.md` nebo `.txt`. PDF soubory můžete zdarma převést na MD pomocí [Mineru](https://github.com/opendatalab/MinerU) ještě před dalším zpracováním.

1. **Použití Sidebaru**:
   - Otevřete Notemd Sidebar, ikonou kouzelné hůlky nebo přes paletu příkazů.
   - Otevřete soubor `.md` nebo `.txt`.
   - Klikněte na **"Process File (Add Links)"**.
   - Pro zpracování složky klikněte na **"Process Folder (Add Links)"**, vyberte složku a klikněte na "Process".
   - Průběh se zobrazuje v sidebaru. Úlohu lze zrušit pomocí tlačítka "Cancel Processing" v sidebaru.
   - *Poznámka pro zpracování složek:* soubory se zpracovávají na pozadí, aniž by se otevíraly v editoru.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Použití palety příkazů** (`Ctrl+P` nebo `Cmd+P`):
   - **Single File**: otevřete soubor a spusťte `Notemd: Process Current File`.
   - **Folder**: spusťte `Notemd: Process Folder`, pak vyberte složku. Soubory se zpracovávají na pozadí, aniž by se otevíraly v editoru.
   - U akcí vyvolaných z palety příkazů se zobrazí modální okno průběhu, které obsahuje tlačítko pro zrušení.
   - *Poznámka:* plugin automaticky odstraňuje počáteční řádky `\boxed{` a koncové řádky `}` z finálního zpracovaného obsahu před uložením, pokud se vyskytují.

### Nové funkce

1. **Shrnutí jako diagram Mermaid**:
   - Otevřete poznámku, kterou chcete shrnout.
   - Spusťte příkaz `Notemd: Summarise as Mermaid diagram` přes paletu příkazů nebo tlačítko v sidebaru.
   - Plugin vygeneruje novou poznámku s Mermaid diagramem.

2. **Translate Note/Selection**:
   - Vyberte text v poznámce, pokud chcete přeložit pouze označenou část, nebo spusťte příkaz bez výběru a přeložte celou poznámku.
   - Spusťte příkaz `Notemd: Translate Note/Selection` přes paletu příkazů nebo tlačítko v sidebaru.
   - Zobrazí se modal, ve kterém můžete potvrdit nebo změnit **Target Language**, výchozí hodnota vychází z nastavení v Configuration.
   - Plugin používá nakonfigurovaného **LLM Provider**, podle Multi-Model settings, k provedení překladu.
   - Přeložený obsah se uloží do nastavené **Translation Save Path** s odpovídajícím suffixem a otevře se v **novém panelu vpravo** od původního obsahu pro snadné porovnání.
   - Tuto úlohu lze zrušit tlačítkem v sidebaru nebo tlačítkem cancel v modal okně.
3. **Dávkový překlad**:
   - Spusťte příkaz `Notemd: Batch Translate Folder` z palety příkazů a vyberte složku, nebo klikněte pravým tlačítkem na složku v průzkumníku souborů a zvolte "Batch translate this folder".
   - Plugin přeloží všechny Markdown soubory ve vybrané složce.
   - Přeložené soubory se ukládají do nastavené translation path, ale automaticky se neotevírají.
   - Tento proces lze zrušit přes progress modal.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Vyberte text v poznámce NEBO se ujistěte, že poznámka má název, který poslouží jako téma vyhledávání.
   - Spusťte příkaz `Notemd: Research and Summarize Topic` přes paletu příkazů nebo tlačítko v sidebaru.
   - Plugin používá nakonfigurovaného **Search Provider**, tedy Tavily nebo DuckDuckGo, a vhodného **LLM Provider**, podle Multi-Model settings, aby nalezl a shrnul informace.
   - Shrnutí se připojí k aktuální poznámce.
   - Tuto úlohu lze zrušit tlačítkem v sidebaru nebo tlačítkem cancel v modal okně.
   - *Poznámka:* vyhledávání DuckDuckGo může selhat kvůli detekci botů. Doporučuje se Tavily.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Otevřete poznámku, může být i prázdná.
   - Spusťte příkaz `Notemd: Generate Content from Title` přes paletu příkazů nebo tlačítko v sidebaru.
   - Plugin používá odpovídajícího **LLM Provider**, podle Multi-Model settings, k vygenerování obsahu podle názvu poznámky a nahradí jím dosavadní obsah.
   - Pokud je zapnuto nastavení **"Enable Research in 'Generate from Title'"**, provede se nejprve webový průzkum pomocí nakonfigurovaného **Web Research Provider** a zjištěný kontext bude připojen k promptu posílanému do LLM.
   - Tuto úlohu lze zrušit tlačítkem v sidebaru nebo tlačítkem cancel v modal okně.

5. **Batch Generate Content from Titles**:
   - Spusťte příkaz `Notemd: Batch Generate Content from Titles` přes paletu příkazů nebo tlačítko v sidebaru.
   - Vyberte složku obsahující poznámky, které chcete zpracovat.
   - Plugin projde každý `.md` soubor ve složce, vyjma `_processed.md` souborů a souborů v určené složce "complete", vygeneruje obsah podle názvu poznámky a nahradí stávající obsah. Soubory se zpracovávají na pozadí, aniž by se otevíraly v editoru.
   - Úspěšně zpracované soubory jsou přesunuty do nakonfigurované složky "complete".
   - Tento příkaz respektuje nastavení **"Enable Research in 'Generate from Title'"** pro každou zpracovávanou poznámku.
   - Tuto úlohu lze zrušit tlačítkem v sidebaru nebo tlačítkem cancel v modal okně.
   - Průběh a výsledky, například počet upravených souborů a chyby, se zobrazují v logu sidebaru nebo modal okna.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Ujistěte se, že **Concept Note Folder Path** je správně nakonfigurována v settings.
   - Spusťte `Notemd: Check and Remove Duplicate Concept Notes` přes paletu příkazů nebo tlačítko v sidebaru.
   - Plugin prohledá concept note folder a porovná názvy souborů s poznámkami mimo tuto složku pomocí několika pravidel, jako exact match, plurály, normalizace a containment.
   - Pokud jsou nalezeny potenciální duplicity, objeví se modal okno se seznamem souborů, důvodem označení a konfliktními soubory.
   - Seznam pečlivě zkontrolujte. Klikněte na **"Delete Files"**, pokud chcete uvedené soubory přesunout do system trash, nebo na **"Cancel"**, pokud nechcete nic měnit.
   - Průběh a výsledky se zobrazují v logu sidebaru nebo modal okna.

7. **Extract Concepts (Pure Mode)**:
   - Tato funkce umožňuje extrahovat koncepty z dokumentu a vytvářet odpovídající concept notes *bez* úpravy původního souboru. Je ideální pro rychlé naplnění znalostní báze ze sady dokumentů.
   - **Single File**: otevřete soubor a spusťte příkaz `Notemd: Extract concepts (create concept notes only)` z palety příkazů nebo klikněte na tlačítko **"Extract concepts (current file)"** v sidebaru.
   - **Folder**: spusťte příkaz `Notemd: Batch extract concepts from folder` z palety příkazů nebo klikněte na tlačítko **"Extract concepts (folder)"** v sidebaru a pak vyberte složku, jejíž poznámky chcete zpracovat.
   - Plugin načte soubory, identifikuje koncepty a vytvoří pro ně nové poznámky ve vaší **Concept Note Folder**, aniž by změnil původní soubory.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Tento silný příkaz zjednodušuje proces vytváření a plnění nových concept notes.
   - Vyberte v editoru slovo nebo frázi.
   - Spusťte příkaz `Notemd: Create Wiki-Link & Generate Note from Selection`; doporučuje se přiřadit mu hotkey, například `Cmd+Shift+W`.
   - Plugin provede:
     1. Nahrazení vybraného textu za `[[wiki-link]]`.
     2. Kontrolu, zda už v **Concept Note Folder** existuje poznámka s tímto názvem.
     3. Pokud existuje, přidá backlink do aktuální poznámky.
     4. Pokud neexistuje, vytvoří novou prázdnou poznámku.
     5. Poté automaticky spustí příkaz **"Generate Content from Title"** nad novou nebo existující poznámkou a doplní ji AI-generovaným obsahem.

9. **Extract Concepts and Generate Titles**:
   - Tento příkaz propojuje dvě silné funkce do jednoho hladkého workflow.
   - Spusťte příkaz `Notemd: Extract Concepts and Generate Titles` z palety příkazů; doporučuje se přiřadit mu hotkey.
   - Plugin provede:
     1. Nejprve úlohu **"Extract concepts (current file)"** na právě aktivním souboru.
     2. Poté automaticky spustí úlohu **"Batch generate from titles"** nad složkou, kterou máte v settings nastavenou jako **Concept note folder path**.
   - To vám umožní nejdříve obohatit znalostní bázi novými koncepty ze zdrojového dokumentu a pak tyto nové concept notes okamžitě rozšířit AI-generovaným obsahem v jediném kroku.

10. **Extract Specific Original Text**:
    - Nakonfigurujte své otázky v settings v části "Extract Specific Original Text".
    - Použijte tlačítko "Extract Specific Original Text" v sidebaru ke zpracování aktivního souboru.
    - **Merged Mode**: umožňuje rychlejší zpracování tím, že odešle všechny otázky v jednom promptu.
    - **Translation**: volitelně překládá extrahovaný text do vašeho nakonfigurovaného jazyka.
    - **Custom Output**: nakonfigurujte, kam a jak se má extrahovaný soubor ukládat.

11. **Batch Mermaid Fix**:
    - Pomocí tlačítka "Batch Mermaid Fix" v sidebaru proskenujte složku a opravte běžné Mermaid syntax errors.
    - Plugin nahlásí soubory, které stále obsahují chyby, do souboru `mermaid_error_{foldername}.md`.
    - Volitelně můžete plugin nastavit tak, aby tyto problematické soubory přesouval do samostatné složky pro review.

## Podporovaní poskytovatelé LLM

| Poskytovatel      | Typ      | Vyžadován API klíč     | Poznámky                                                              |
|-------------------|----------|------------------------|-----------------------------------------------------------------------|
| DeepSeek          | Cloudový | Ano                    | Nativní DeepSeek endpoint s podporou reasoning modelů                 |
| Qwen              | Cloudový | Ano                    | DashScope compatible-mode preset pro modely Qwen / QwQ                |
| Qwen Code         | Cloudový | Ano                    | DashScope preset zaměřený na code modely Qwen                         |
| Doubao            | Cloudový | Ano                    | Volcengine Ark preset; model field se obvykle nastavuje na vaše endpoint ID |
| Moonshot          | Cloudový | Ano                    | Oficiální Kimi / Moonshot endpoint                                    |
| GLM               | Cloudový | Ano                    | Oficiální Zhipu BigModel OpenAI-compatible endpoint                   |
| Z AI              | Cloudový | Ano                    | Mezinárodní GLM/Zhipu OpenAI-compatible endpoint; doplňuje `GLM`      |
| MiniMax           | Cloudový | Ano                    | Oficiální MiniMax chat-completions endpoint                           |
| Huawei Cloud MaaS | Cloudový | Ano                    | Huawei ModelArts MaaS OpenAI-compatible endpoint pro hosted modely    |
| Baidu Qianfan     | Cloudový | Ano                    | Oficiální Qianfan OpenAI-compatible endpoint pro modely ERNIE         |
| SiliconFlow       | Cloudový | Ano                    | Oficiální SiliconFlow OpenAI-compatible endpoint pro hosted OSS modely |
| OpenAI            | Cloudový | Ano                    | Podporuje GPT a modely řady o                                         |
| Anthropic         | Cloudový | Ano                    | Podporuje modely Claude                                               |
| Google            | Cloudový | Ano                    | Podporuje modely Gemini                                               |
| Mistral           | Cloudový | Ano                    | Podporuje rodiny Mistral a Codestral                                  |
| Azure OpenAI      | Cloudový | Ano                    | Vyžaduje Endpoint, API Key, deployment name a API Version             |
| OpenRouter        | Brána    | Ano                    | Přístup k mnoha poskytovatelům přes OpenRouter model ID               |
| xAI               | Cloudový | Ano                    | Nativní Grok endpoint                                                 |
| Groq              | Cloudový | Ano                    | Rychlá OpenAI-compatible inference pro hosted OSS modely              |
| Together          | Cloudový | Ano                    | OpenAI-compatible endpoint pro hosted OSS modely                      |
| Fireworks         | Cloudový | Ano                    | OpenAI-compatible inference endpoint                                  |
| Requesty          | Brána    | Ano                    | Multi-provider router za jedním API klíčem                            |
| OpenAI Compatible | Brána    | Volitelné              | Obecný preset pro LiteLLM, vLLM, Perplexity, Vercel AI Gateway atd.   |
| LMStudio          | Lokální  | Volitelné (`EMPTY`)    | Spouští modely lokálně přes server LM Studio                          |
| Ollama            | Lokální  | Ne                     | Spouští modely lokálně přes server Ollama                             |

*Poznámka: pro lokální poskytovatele, LMStudio a Ollama, se ujistěte, že příslušná serverová aplikace běží a je dostupná na nakonfigurovaném Base URL.*
*Poznámka: pro OpenRouter a Requesty používejte identifikátor modelu s prefixem poskytovatele nebo plný model ID zobrazený gatewayem, například `google/gemini-flash-1.5` nebo `anthropic/claude-3-7-sonnet-latest`.*
*Poznámka: `Doubao` obvykle očekává v poli model Ark endpoint nebo deployment ID, nikoli surový název model family. Obrazovka settings nyní upozorní, pokud je stále přítomna placeholder hodnota, a blokuje connection testy, dokud ji nenahradíte skutečným endpoint ID.*
*Poznámka: `Z AI` cílí na mezinárodní linku `api.z.ai`, zatímco `GLM` zachovává mainland China BigModel endpoint. Zvolte preset odpovídající regionu vašeho účtu.*
*Poznámka: China-focused presety používají chat-first connection kontroly, takže test ověřuje skutečně nakonfigurovaný model nebo deployment, nejen dostupnost API klíče.*
*Poznámka: `OpenAI Compatible` je určen pro vlastní gatewaye a proxy. Nastavte Base URL, politiku API klíče a model ID podle dokumentace vašeho poskytovatele.*

## Použití sítě a zpracování dat

Notemd běží lokálně uvnitř Obsidianu, ale některé funkce odesílají odchozí požadavky.

### Volání poskytovatelů LLM (konfigurovatelné)

- Trigger: zpracování souborů, generování, překlad, shrnutí výzkumu, Mermaid shrnutí a connection nebo diagnostic akce.
- Endpoint: vaše nakonfigurované provider base URL v settings Notemd.
- Odesílaná data: text promptu a task content potřebný ke zpracování.
- Poznámka k datům: API klíče se konfigurují lokálně v settings pluginu a používají se k podepisování requestů z vašeho zařízení.

### Volání webového průzkumu (volitelné)

- Trigger: když je web research zapnutý a je zvolen search provider.
- Endpoint: Tavily API nebo DuckDuckGo endpointy.
- Odesílaná data: váš research dotaz a potřebná request metadata.

### Diagnostika pro vývojáře a ladicí logy (volitelné)

- Trigger: API debug mode a developer diagnostic akce.
- Uložení: diagnostic a error logy se zapisují do rootu vašeho vaultu, například `Notemd_Provider_Diagnostic_*.txt` a `Notemd_Error_Log_*.txt`.
- Poznámka k riziku: logy mohou obsahovat úryvky requestů a response. Před veřejným sdílením je zkontrolujte.

### Lokální úložiště

- Konfigurace pluginu je uložena v `.obsidian/plugins/notemd/data.json`.
- Vygenerované soubory, reporty a volitelné logy se ukládají do vašeho vaultu podle nastavení.

## Řešení problémů

### Běžné potíže
- **Plugin se nenačítá**: ujistěte se, že `manifest.json`, `main.js` a `styles.css` jsou ve správné složce, tedy `<Vault>/.obsidian/plugins/notemd/`, a restartujte Obsidian. Zkontrolujte Developer Console pomocí `Ctrl+Shift+I` nebo `Cmd+Option+I`, zda při startu nevznikají chyby.
- **Selhání zpracování / API errors**:
  1. **Zkontrolujte formát souboru**: ujistěte se, že soubor, který chcete zpracovat nebo zkontrolovat, má příponu `.md` nebo `.txt`. Notemd aktuálně podporuje pouze tyto textové formáty.
  2. Použijte příkaz nebo tlačítko "Test LLM Connection" pro ověření settings aktivního poskytovatele.
  3. Znovu zkontrolujte API Key, Base URL, Model Name a API Version, u Azure. Ujistěte se, že API klíč je správný a má dostatek kreditů nebo oprávnění.
  4. Ujistěte se, že váš lokální LLM server, LMStudio nebo Ollama, běží a Base URL je správné, například `http://localhost:1234/v1` pro LMStudio.
  5. Zkontrolujte internetové připojení pro cloudové poskytovatele.
  6. **Pro chyby zpracování jednoho souboru:** projděte Developer Console kvůli detailním error message. V případě potřeby je zkopírujte tlačítkem v error modal okně.
  7. **Pro dávkové chyby:** zkontrolujte soubor `error_processing_filename.log` v rootu vaultu kvůli detailním error message ke každému neúspěšnému souboru. Developer Console nebo error modal může zobrazit jen shrnutí nebo obecnou batch chybu.
  8. **Automatické chybové logy:** pokud proces selže, plugin automaticky uloží detailní log soubor s názvem `Notemd_Error_Log_[Timestamp].txt` do kořenového adresáře vaultu. Tento soubor obsahuje chybovou zprávu, trasování zásobníku a session logy. Pokud se problémy opakují, zkontrolujte tento soubor. Zapnutí "API Error Debugging Mode" v nastavení naplní tento log ještě detailnějšími API response daty.
  9. **Diagnostika dlouhých requestů na skutečný endpoint, pro vývojáře**:
     - Cesta uvnitř pluginu, doporučená jako první: použijte **Settings -> Notemd -> Developer provider diagnostic (long request)** pro spuštění runtime probe na aktivním poskytovateli a vygenerování `Notemd_Provider_Diagnostic_*.txt` v rootu vaultu.
     - CLI cesta, mimo Obsidian runtime: pro reprodukovatelné srovnání buffered a streaming behavior na úrovni endpointu použijte:
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
       Vygenerovaný report obsahuje timing pro každý pokus, `First Byte` a `Duration`, sanitizovaná request metadata, response headers, raw nebo partial body fragmenty, parsované stream fragmenty a místa selhání transportní vrstvy.
- **Potíže s připojením LM Studio/Ollama**:
  - **Test připojení selže**: ujistěte se, že lokální server, LM Studio nebo Ollama, běží a že je načten správný model nebo je dostupný.
  - **CORS Errors, Ollama na Windows**: pokud při používání Ollama na Windows narazíte na CORS, tedy Cross-Origin Resource Sharing errors, může být potřeba nastavit environment proměnnou `OLLAMA_ORIGINS`. Uděláte to spuštěním `set OLLAMA_ORIGINS=*` v command promptu před startem Ollama. To umožní požadavky z libovolného originu.
  - **Enable CORS in LM Studio**: u LM Studio můžete CORS povolit přímo v server settings; může to být nutné, pokud Obsidian běží v browseru nebo má přísné origin policy.
- **Chyby při vytváření složek ("File name cannot contain...")**:
  - Obvykle to znamená, že cesta zadaná v settings, tedy **Processed File Folder Path** nebo **Concept Note Folder Path**, je *pro Obsidian* neplatná.
  - **Ujistěte se, že používáte relativní cesty**, například `Processed` nebo `Notes/Concepts`, a **ne absolutní cesty**, jako `C:\Users\...` nebo `/Users/...`.
  - Zkontrolujte neplatné znaky: `* " \ / < > : | ? # ^ [ ]`. Všimněte si, že `\` je neplatné i na Windows pro cesty v Obsidianu. Používejte `/` jako oddělovač cest.
- **Výkonové problémy**: zpracování velkých souborů nebo mnoha souborů může trvat. Snižte nastavení "Chunk Word Count", pokud chcete potenciálně rychlejší, ale četnější API volání. Zkuste jiného poskytovatele LLM nebo jiný model.
- **Neočekávané propojování**: kvalita propojování silně závisí na LLM a promptu. Experimentujte s různými modely nebo nastavením teploty.

## Přispívání

Příspěvky jsou vítány. Pokyny najdete v GitHub repozitáři: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Dokumentace pro správce

- [Průběh vydání (angličtina)](./docs/maintainer/release-workflow.md)
- [Průběh vydání (zjednodušená čínština)](./docs/maintainer/release-workflow.zh-CN.md)

## Licence

Licence MIT. Podrobnosti naleznete v souboru [LICENSE](LICENSE).

---

If you love using Notemd, please consider [⭐ Give a Star on GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) or [☕️ Buy Me a Coffee](https://ko-fi.com/jacobinwwey).

*Notemd v1.8.3 - Vylepšete svůj graf znalostí v Obsidianu pomocí AI.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
