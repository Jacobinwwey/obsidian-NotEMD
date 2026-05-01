![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd bővítmény az Obsidianhez

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Olvassa el a dokumentációt további nyelveken is: [Nyelvi központ](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 AI-alapú többnyelvű tudásbővítés
==================================================
```

Egyszerű módja annak, hogy létrehozza saját tudásbázisát.

A Notemd az Obsidian munkafolyamatát fejleszti azáltal, hogy különféle nagy nyelvi modellekkel (LLM-ekkel) integrálódik a többnyelvű jegyzetek feldolgozásához, automatikusan wiki-linkeket hoz létre a kulcsfontosságú fogalmakhoz, elkészíti a hozzájuk tartozó fogalomjegyzeteket, webes kutatást végez, és segít erőteljes tudásgráfok felépítésében.

**Verzió:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Tartalomjegyzék

- [Gyorsindítás](#gyorsindítás)
- [Nyelvi támogatás](#nyelvi-támogatás)
- [Funkciók](#funkciók)
- [Telepítés](#telepítés)
- [Konfiguráció](#konfiguráció)
- [Használati útmutató](#használati-útmutató)
- [Támogatott LLM-szolgáltatók](#támogatott-llm-szolgáltatók)
- [Hálózathasználat és adatkezelés](#hálózathasználat-és-adatkezelés)
- [Hibaelhárítás](#hibaelhárítás)
- [Közreműködés](#közreműködés)
- [Karbantartói dokumentáció](#karbantartói-dokumentáció)
- [Licenc](#licenc)

## Gyorsindítás

1.  **Telepítés és engedélyezés**: szerezze be a bővítményt az Obsidian Marketplace-ről.
2.  **LLM konfigurálása**: lépjen a `Settings -> Notemd` menübe, válassza ki a használni kívánt LLM-szolgáltatót (például OpenAI vagy egy helyi szolgáltató, például Ollama), majd adja meg az API-kulcsot vagy az URL-t.
3.  **Oldalsáv megnyitása**: kattintson a Notemd varázspálca ikonjára a bal oldali szalagon az oldalsáv megnyitásához.
4.  **Jegyzet feldolgozása**: nyisson meg egy tetszőleges jegyzetet, és kattintson az oldalsávon a **"Process File (Add Links)"** gombra, hogy a rendszer automatikusan hozzáadja a `[[wiki-links]]` hivatkozásokat a kulcsfogalmakhoz.
5.  **Gyors munkafolyamat futtatása**: használja az alapértelmezett **"One-Click Extract"** gombot a feldolgozás, a kötegelt generálás és a Mermaid-tisztítás összekapcsolásához egyetlen belépési pontból.

Ennyi az egész. Fedezze fel a beállításokat, hogy további lehetőségeket nyisson meg, például a webes kutatást, a fordítást és a tartalomgenerálást.

## Nyelvi támogatás

### Nyelvi viselkedési szerződés

| Szempont | Hatókör | Alapértelmezett | Megjegyzések |
|---|---|---|---|
| `Felületi nyelv` | Csak a bővítmény kezelőfelületének szövege (beállítások, oldalsáv, értesítések, párbeszédablakok) | `auto` | Követi az Obsidian nyelvét; a jelenlegi felületi katalógusok: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Feladatkimeneti nyelv` | LLM által generált feladatkimenet (hivatkozások, összefoglalók, generálás, kivonatolás, fordítási célnyelv) | `en` | Lehet globális vagy feladatonkénti, ha a `Feladatonként eltérő nyelvek használata` be van kapcsolva. |
| `Automatikus fordítás kikapcsolása` | A nem `Translate` feladatok megtartják a forrásnyelvi kontextust | `false` | Az explicit `Translate` feladatok továbbra is a konfigurált célnyelvet alkalmazzák. |
| Területi beállítási tartalék | Hiányzó UI-kulcsok feloldása | locale -> `en` | Stabilan tartja a felületet akkor is, ha néhány kulcs még nincs lefordítva. |

- A karbantartott forrásdokumentumok az angol és az egyszerűsített kínai, és a közzétett README-fordítások a fenti fejlécben vannak belinkelve.
- Az alkalmazáson belüli UI-lokál lefedettség jelenleg pontosan megegyezik a kódban szereplő explicit katalógussal: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Az angol fallback továbbra is megvalósítási védőháló, de a támogatott látható felületeket regressziós tesztek fedik le, és normál használat közben nem szabad csendben angolra visszaesniük.
- További részletek és hozzájárulási irányelvek a [Nyelvi központban](./docs/i18n/README.md) találhatók.

## Funkciók

### AI-alapú dokumentumfeldolgozás
- **Multi-LLM támogatás**: kapcsolódjon különféle felhőalapú és helyi LLM-szolgáltatókhoz (lásd: [Támogatott LLM-szolgáltatók](#támogatott-llm-szolgáltatók)).
- **Intelligens darabolás**: automatikusan feldolgozható részekre bontja a nagy dokumentumokat a szószám alapján.
- **Tartalommegőrzés**: igyekszik megőrizni az eredeti formázást, miközben struktúrát és hivatkozásokat ad hozzá.
- **Folyamatkövetés**: valós idejű frissítések a Notemd oldalsávban vagy egy folyamatjelző modális ablakban.
- **Megszakítható műveletek**: bármely, az oldalsávról indított feldolgozási feladat (egyes vagy kötegelt) megszakítható a dedikált megszakító gombbal. A parancspalettáról indított műveletek modális ablakot használnak, amely szintén megszakítható.
- **Többmodell-es konfiguráció**: használjon különböző LLM-szolgáltatókat *és* konkrét modelleket különböző feladatokhoz (Add Links, Research, Generate Title, Translate), vagy használjon egyetlen szolgáltatót mindenhez.
- **Stable API Calls (Retry Logic)**: opcionálisan engedélyezze a sikertelen LLM API-hívások automatikus újrapróbálását konfigurálható időközzel és próbálkozási korláttal.
- **Ellenálló szolgáltatói kapcsolattesztek**: ha az első szolgáltatói teszt átmeneti hálózati bontásba ütközik, a Notemd most a stabil újrapróbálási sorozatra vált, mielőtt hibát jelezne; ez lefedi az OpenAI-compatible, Anthropic, Google, Azure OpenAI és Ollama szállítási útvonalakat.
- **Futtatási környezetfüggő szállítási tartalék**: amikor egy hosszú futású szolgáltatói kérés `requestUrl` útvonalon átmeneti hálózati hibák, például `ERR_CONNECTION_CLOSED` miatt megszakad, a Notemd most először ugyanazt a próbálkozást a környezethez illeszkedő tartalék szállítási útvonalon ismétli meg, mielőtt belépne a konfigurált újrapróbálási ciklusba: az asztali build-ek Node `http/https` útvonalat használnak, a nem asztali környezetek pedig böngészős `fetch`-et. Ez csökkenti a hamis hibákat lassú gateway-ek és reverz proxyk esetén.
- **OpenAI-compatible stabil hosszú kéréslánc megerősítése**: stabil módban az OpenAI-compatible hívások most egy explicit háromlépcsős sorrendet követnek minden próbálkozásnál: elsődleges közvetlen streaming szállítás, majd közvetlen nem streaming szállítás, végül `requestUrl` tartalék (amely szükség esetén továbbra is átválthat streamelt feldolgozásra). Ez csökkenti a hamis negatív eredményeket, amikor a szolgáltatók pufferelt válaszokat sikeresen lezárnak, de a streaming csatornák instabilak.
- **Protokolltudatos streaming tartalék az LLM API-kon át**: a hosszú futású tartalék próbálkozások most minden beépített LLM útvonalon protokolltudatos streamelt feldolgozásra váltanak, nem csak az OpenAI-compatible végpontokon. A Notemd most kezeli az OpenAI/Azure-stílusú SSE-t, az Anthropic Messages streaminget, a Google Gemini SSE válaszokat és az Ollama NDJSON folyamokat mind asztali `http/https`, mind nem asztali `fetch` környezetben, és a megmaradó közvetlen OpenAI-stílusú szolgáltatói belépési pontok is ugyanezt a közös tartalék útvonalat használják.
- **Kínára optimalizált szolgáltatói előbeállítások**: a beépített előbeállítások most lefedik a `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` és `SiliconFlow` szolgáltatókat a meglévő globális és helyi szolgáltatók mellett.
- **Megbízható kötegelt feldolgozás**: a továbbfejlesztett párhuzamos feldolgozási logika **időben eltolva indított API-hívásokkal** segít elkerülni a rate-limit hibákat, és stabil teljesítményt biztosít a nagy kötegelt feladatoknál. Az új megvalósítás biztosítja, hogy a feladatok különböző időpontokban induljanak, ne egyszerre.
- **Pontos folyamatjelentés**: javítva lett egy hiba, amely miatt az előrehaladási sáv elakadhatott, így a felület most mindig a művelet valós állapotát tükrözi.
- **Robusztus párhuzamos kötegelt feldolgozás**: megoldódott egy probléma, amely miatt a párhuzamos kötegelt műveletek túl korán megálltak, így most minden fájl megbízhatóan és hatékonyan feldolgozható.
- **Előrehaladási sáv pontossága**: javítva lett egy hiba, amely miatt a "Create Wiki-Link & Generate Note" parancs előrehaladási sávja 95%-nál megragadt; most a folyamat végén helyesen 100%-ot mutat.
- **Fejlettebb API-hibakeresés**: az "API Error Debugging Mode" most teljes választesteket rögzít az LLM-szolgáltatóktól és a keresőszolgáltatásoktól (Tavily/DuckDuckGo), valamint próbálkozásonként egy szállítási idővonalat is naplóz megtisztított kérés-URL-ekkel, eltelt idővel, válaszfejlécekkel, részleges választestekkel, részben elemzett stream tartalommal és veremnyomokkal az OpenAI-compatible, Anthropic, Google, Azure OpenAI és Ollama tartalék útvonalak hibakereséséhez.
- **Developer Mode panel**: a beállítások most egy dedikált, csak fejlesztőknek szóló diagnosztikai panelt is tartalmaznak, amely rejtve marad, amíg a "Developer mode" nincs bekapcsolva. Támogatja a diagnosztikai hívási útvonalak kiválasztását és ismételt stabilitási tesztek futtatását a kiválasztott módhoz.
- **Újratervezett oldalsáv**: a beépített műveletek fókuszált szakaszokba vannak csoportosítva, tisztább címkékkel, élő állapottal, megszakítható előrehaladással és másolható naplókkal az oldalsáv zsúfoltságának csökkentése érdekében. Az előrehaladási/napló lábléc most akkor is látható marad, amikor minden szakasz ki van nyitva, és a készenléti állapot is egyértelműbb várakozó folyamatjelző sávot használ.
- **Oldalsáv interakciós és olvashatósági finomítások**: az oldalsáv gombjai most világosabb hover/lenyomás/fókusz visszajelzést adnak, a színes CTA-gombok pedig, beleértve a `One-Click Extract` és `Batch generate from titles` gombokat, erősebb szövegkontrasztot használnak a jobb olvashatóság érdekében különböző témákban.
- **CTA-hozzárendelés csak egyfájlos műveletekhez**: a színes CTA-stílus most kizárólag az egyetlen fájlon végrehajtott műveletekhez van fenntartva. A kötegelt/mappaszintű műveletek és a vegyes munkafolyamatok nem CTA stílust használnak az akciókörből fakadó félrekattintások csökkentésére.
- **Egykattintásos egyéni munkafolyamatok**: a beépített oldalsáv-eszközök újrafelhasználható egyéni gombokká alakíthatók felhasználó által megadott nevekkel és összefűzött műveletláncokkal. Egy alapértelmezett `One-Click Extract` munkafolyamat már a telepítéskor rendelkezésre áll.

### Tudásgráf-fejlesztés
- **Automatikus wiki-linkelés**: azonosítja az alapfogalmakat, és az LLM kimenete alapján `[[wiki-links]]` hivatkozásokat ad hozzá a feldolgozott jegyzetekben.
- **Fogalomjegyzetek létrehozása (opcionális és testreszabható)**: automatikusan új jegyzeteket hoz létre a felfedezett fogalmakhoz egy megadott vault-mappában.
- **Testreszabható kimeneti útvonalak**: külön relatív útvonalak állíthatók be a vaulton belül a feldolgozott fájlok és az új fogalomjegyzetek mentéséhez.
- **Testreszabható kimeneti fájlnevek (Add Links)**: opcionálisan **felülírhatja az eredeti fájlt**, vagy egyéni utótagot/cserekarakterláncot használhat az alapértelmezett `_processed.md` helyett a linkfeldolgozásnál.
- **Hivatkozásintegritás fenntartása**: alapvető kezelés biztosított a linkek frissítésére, amikor a jegyzeteket átnevezi vagy törli a vaulton belül.
- **Tiszta fogalomkivonatolás**: kivonatolja a fogalmakat, és létrehozza a hozzájuk tartozó fogalomjegyzeteket az eredeti dokumentum módosítása nélkül. Ez ideális tudásbázis feltöltésére meglévő dokumentumokból azok megváltoztatása nélkül. A funkció konfigurálható lehetőségeket kínál minimális fogalomjegyzetek létrehozására és visszamutató hivatkozások hozzáadására.

### Fordítás

- **AI-alapú fordítás**:
    - Fordítsa le a jegyzetek tartalmát a konfigurált LLM segítségével.
    - **Nagy fájlok támogatása**: a rendszer automatikusan kisebb részekre bontja a nagy fájlokat a `Chunk word count` beállítás alapján, mielőtt azokat elküldené az LLM-nek. A lefordított részek ezután zökkenőmentesen egyetlen dokumentummá állnak össze.
    - Több nyelv közötti fordítást is támogat.
    - A célnyelv testreszabható a beállításokban vagy a felületen.
    - A lefordított szöveget automatikusan az eredeti szöveg jobb oldalán nyitja meg a kényelmes olvasáshoz.
- **Kötegelt fordítás**:
    - Lefordít minden fájlt egy kiválasztott mappában.
    - Támogatja a párhuzamos feldolgozást, ha az "Enable Batch Parallelism" be van kapcsolva.
    - A konfigurációtól függően egyéni promptokat is használhat a fordításhoz.
	- A fájlkezelő helyi menüjébe hozzáad egy "Batch translate this folder" lehetőséget.
- **Automatikus fordítás kikapcsolása**: ha ez be van kapcsolva, a nem `Translate` feladatok nem erőltetik többé a kimeneteket egy adott nyelvre, így megőrzik az eredeti nyelvi kontextust. Az explicit "Translate" feladat továbbra is a konfiguráció szerint fordít.

### Webes kutatás és tartalomgenerálás
- **Webes kutatás és összefoglalás**:
    - Végezzen webes keresést a Tavily (API-kulcs szükséges) vagy a DuckDuckGo (kísérleti) használatával.
    - **Javított keresési robusztusság**: a DuckDuckGo keresés most továbbfejlesztett feldolgozási logikát használ (DOMParser Regex tartalékkal), hogy jobban kezelje az elrendezésváltozásokat és megbízhatóbb eredményeket adjon.
    - A keresési eredményeket a konfigurált LLM segítségével foglalja össze.
    - Az összefoglaló kimeneti nyelve a beállításokban testreszabható.
    - Az összefoglalókat hozzáfűzi az aktuális jegyzethez.
    - A kutatási tartalom LLM-hez küldött tokenkorlátja konfigurálható.
- **Tartalomgenerálás címből**:
    - A jegyzet címét használja fel kezdeti tartalom előállítására LLM segítségével, lecserélve a meglévő tartalmat.
    - **Opcionális kutatás**: beállítható, hogy történjen-e webes kutatás (a kiválasztott szolgáltatóval) a generáláshoz szükséges kontextus biztosításához.
- **Kötegelt tartalomgenerálás címekből**: tartalmat generál az összes jegyzethez egy kiválasztott mappában a címük alapján (figyelembe veszi az opcionális kutatási beállítást). A sikeresen feldolgozott fájlok egy **konfigurálható "complete" almappába** kerülnek (például `[foldername]_complete` vagy egyéni név), hogy ne legyenek újra feldolgozva.
- **Mermaid auto-fix csatolás**: ha a Mermaid automatikus javítás engedélyezve van, a Mermaidhez kapcsolódó munkafolyamatok a feldolgozás után automatikusan javítják a generált fájlokat vagy kimeneti mappákat. Ez lefedi a Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid és Translate folyamatokat.

### Segédfunkciók
- **Összefoglalás Mermaid-diagramként**:
    - Ez a funkció lehetővé teszi, hogy egy jegyzet tartalmát Mermaid-diagram formájában foglalja össze.
    - A Mermaid-diagram kimeneti nyelve a beállításokban testreszabható.
    - **Mermaid Output Folder**: állítsa be azt a mappát, ahová a generált Mermaid-diagramfájlok kerülnek.
    - **Translate Summarize to Mermaid Output**: opcionálisan lefordítja a generált Mermaid-diagram tartalmát a konfigurált célnyelvre.
    - 
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Egyszerű képletformázási javítás**:
    - Gyorsan javítja az egyetlen `$` karakterrel határolt egysoros matematikai képleteket szabványos dupla `$$` blokkokra.
    - **Single File**: dolgozza fel az aktuális fájlt az oldalsáv gombjával vagy a parancspalettáról.
    - **Batch Fix**: dolgozza fel egy kiválasztott mappa összes fájlját az oldalsáv gombjával vagy a parancspalettáról.

- **Duplikátumok ellenőrzése az aktuális fájlban**: ez a parancs segít az aktív fájlban lévő lehetséges ismétlődő kifejezések azonosításában.
- **Duplikátumészlelés**: alapvető ellenőrzés az aktuálisan feldolgozott fájl tartalmában előforduló ismétlődő szavakra (az eredmények a konzolba kerülnek).
- **Check and Remove Duplicate Concept Notes**: azonosítja a lehetséges duplikált jegyzeteket a konfigurált **Concept Note Folder** mappában névazonosság, többes szám, normalizálás és egyszavas tartalmazás alapján, a mappán kívüli jegyzetekhez hasonlítva. Az összehasonlítás hatóköre (vagyis hogy a fogalommappán kívüli mely jegyzeteket ellenőrzi) beállítható **az egész vaultra**, **konkrét felvett mappákra**, vagy **minden mappára bizonyos mappák kizárásával**. Részletes listát mutat az okokkal és az ütköző fájlokkal, majd megerősítést kér, mielőtt a talált duplikátumokat a rendszer lomtárába helyezné. A törlés közben előrehaladást is mutat.
- **Batch Mermaid Fix**: Mermaid- és LaTeX-szintaxisjavításokat alkalmaz egy felhasználó által kiválasztott mappa összes Markdown-fájljára.
    - **Workflow Ready**: használható önálló segédeszközként vagy egy egyéni, egykattintásos munkafolyamat lépéseként.
    - **Error Reporting**: létrehoz egy `mermaid_error_{foldername}.md` jelentést, amely felsorolja azokat a fájlokat, amelyek a feldolgozás után még mindig potenciális Mermaid-hibákat tartalmaznak.
    - **Move Error Files**: opcionálisan áthelyezi az észlelt hibákat tartalmazó fájlokat egy megadott mappába kézi felülvizsgálatra.
    - **Smart Detection**: most intelligensen ellenőrzi a fájlokat szintaktikai hibákra a `mermaid.parse` segítségével még a javítás megkísérlése előtt, így feldolgozási időt takarít meg és elkerüli a szükségtelen módosításokat.
    - **Safe Processing**: biztosítja, hogy a szintaxisjavítások kizárólag Mermaid-kódblokkokra vonatkozzanak, megelőzve a Markdown-táblák vagy más tartalmak véletlen módosítását. Robusztus védelmet tartalmaz a táblaszintaxis (például `| :--- |`) agresszív hibakereső javításokkal szemben.
    - **Deep Debug Mode**: ha a hibák az első javítás után is fennmaradnak, egy fejlett mély hibakeresési mód aktiválódik. Ez a mód összetett szélső eseteket kezel, többek között:
        - **Comment Integration**: automatikusan beolvasztja a sorvégi megjegyzéseket (amelyek `%` jellel kezdődnek) az él címkéjébe (például `A -- Label --> B; % Comment` átalakul `A -- "Label(Comment)" --> B;` formára).
        - **Malformed Arrows**: kijavítja az idézőjelekbe került nyilakat (például `A -- "Label -->" B` -> `A -- "Label" --> B`).
        - **Inline Subgraphs**: az inline algráf-címkéket élcímkékké alakítja.
        - **Reverse Arrow Fix**: a nem szabványos `X <-- Y` nyilakat `Y --> X` formára javítja.
        - **Direction Keyword Fix**: biztosítja, hogy a `direction` kulcsszó kisbetűs legyen az algráfokon belül (például `Direction TB` -> `direction TB`).
        - **Comment Conversion**: a `//` megjegyzéseket élcímkékké alakítja (például `A --> B; // Comment` -> `A -- "Comment" --> B;`).
        - **Duplicate Label Fix**: egyszerűsíti az ismétlődő szögletes zárójelezett címkéket (például `Node["Label"]["Label"]` -> `Node["Label"]`).
        - **Invalid Arrow Fix**: az érvénytelen `--|>` nyíl-szintaxist szabványos `-->` formára alakítja.
        - **Robust Label & Note Handling**: javított kezelést biztosít speciális karaktereket (például `/`) tartalmazó címkékhez és jobb támogatást ad az egyéni jegyzetszintaxishoz (`note for ...`), biztosítva, hogy a zavaró maradványok, például a felesleges zárójelek tisztán eltűnjenek.
        - **Advanced Fix Mode**: robusztus javításokat tartalmaz szóközt, speciális karaktereket vagy egymásba ágyazott zárójeleket tartalmazó, idézőjelek nélküli csomópontcímkékhez (például `Node[Label [Text]]` -> `Node["Label [Text]"]`), biztosítva a kompatibilitást összetett diagramoknál, például a Stellar Evolution útvonalaknál. Emellett kijavítja a hibás élcímkéket (például `--["Label["-->` -> `-- "Label" -->`). Továbbá az inline megjegyzéseket is átalakítja (`Consensus --> Adaptive; # Some advanced consensus` -> `Consensus -- "Some advanced consensus" --> Adaptive`), és kijavítja a sorvégi hiányos idézőjeleket (a sor végén lévő `;"` -> `"]`).
                        - **Note Conversion**: automatikusan szabványos Mermaid-csomópont-definíciókká és kapcsolódásokká alakítja a `note right/left of` és az önálló `note :` megjegyzéseket (például `note right of A: text` -> `NoteA["Note: text"]`, amely `A`-hoz kapcsolódik), megelőzve a szintaktikai hibákat és javítva az elrendezést. Most már támogatja mind a nyíllal összekötött (`-->`), mind a folytonos (`---`) kapcsolatokat.
                        - **Extended Note Support**: automatikusan szabványos kapcsolt jegyzetcsomópontokká alakítja a `note for Node "Content"` és `note of Node "Content"` formákat (például `NoteNode[" Content"]`, amely a `Node`-hoz kapcsolódik), biztosítva a kompatibilitást a felhasználói kiterjesztett szintaxissal.
                        - **Enhanced Note Correction**: automatikusan sorszámozással nevezi át a jegyzeteket (például `Note1`, `Note2`), hogy elkerülje az aliasolási problémákat több jegyzet jelenléte esetén.                - **Parallelogram/Shape Fix**: kijavítja a hibás csomópontalakokat, például `[/["Label["/]` -> szabványos `["Label"]`, biztosítva a generált tartalom kompatibilitását.
                        - **Standardize Pipe Labels**: automatikusan javítja és egységesíti a pipe karaktereket tartalmazó élcímkéket, biztosítva, hogy megfelelően idézőjelezettek legyenek (például `-->|Text|` -> `-->|"Text"|`, valamint `-->|Math|^2|` -> `-->|"Math|^2"|`).
        - **Misplaced Pipe Fix**: kijavítja a nyíl elé tévesen került élcímkéket (például `>|"Label"| A --> B` -> `A -->|"Label"| B`).
                - **Merge Double Labels**: felismeri és egyesíti az egyetlen élen lévő összetett kettős címkéket (például `A -- Label1 -- Label2 --> B` vagy `A -- Label1 -- Label2 --- B`) egy tiszta, sortöréses címkévé (`A -- "Label1<br>Label2" --> B`).
                        - **Unquoted Label Fix**: automatikusan idézőjelek közé teszi azokat a csomópontcímkéket, amelyek potenciálisan problémás karaktereket (például idézőjelet, egyenlőségjelet, matematikai operátorokat) tartalmaznak, de hiányoznak róluk a külső idézőjelek (például `Plot[Plot "A"]` -> `Plot["Plot "A""]`), megelőzve a renderelési hibákat.
                        - **Intermediate Node Fix**: két külön élre bontja azokat az éleket, amelyek köztes csomópont-definíciót tartalmaznak (például `A -- B[...] --> C` -> `A --> B[...]` és `B[...] --> C`), biztosítva az érvényes Mermaid-szintaxist.
                        - **Concatenated Label Fix**: robusztusan javítja azokat a csomópontdefiníciókat, ahol az azonosító a címkével össze van fűzve (például `SubdivideSubdivide...` -> `Subdivide["Subdivide..."]`), még akkor is, ha pipe címkék előzik meg, vagy a duplikáció nem pontos, ismert csomópontazonosítókhoz való validálással.
                        - **Extract Specific Original Text**:    - Adjon meg egy kérdéslistát a beállításokban.
                    - Kivonatolja az aktív jegyzetből azokat a szó szerinti szövegrészleteket, amelyek válaszolnak ezekre a kérdésekre.
                    - **Merged Query Mode**: lehetőség arra, hogy az összes kérdést egyetlen API-hívásban dolgozza fel a nagyobb hatékonyság érdekében.
                    - **Translation**: lehetőség a kivonatolt szöveg fordításainak beillesztésére a kimenetbe.
                    - **Custom Output**: a kivonatolt szövegfájl mentési útvonala és fájlnév-utótagja konfigurálható.- **LLM Connection Test**: ellenőrizze az aktív szolgáltató API-beállításait.

## Telepítés

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Obsidian Marketplace-ről (ajánlott)
1. Nyissa meg az Obsidianban a **Settings** -> **Community plugins** menüpontot.
2. Győződjön meg arról, hogy a "Restricted mode" **ki van kapcsolva**.
3. Kattintson a **Browse** gombra a közösségi bővítményeknél, és keressen rá a "Notemd" kifejezésre.
4. Kattintson az **Install** gombra.
5. A telepítés után kattintson az **Enable** gombra.

### Kézi telepítés
1. Töltse le a legfrissebb kiadási fájlokat a [GitHub Releases oldalról](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Minden kiadás tartalmazza a `README.md` fájlt is csomagolt referenciaként, de a kézi telepítéshez csak a `main.js`, `styles.css` és `manifest.json` fájlokra van szükség.
2. Navigáljon az Obsidian vault konfigurációs mappájába: `<YourVault>/.obsidian/plugins/`.
3. Hozzon létre egy új `notemd` nevű mappát.
4. Másolja a `main.js`, `styles.css` és `manifest.json` fájlokat a `notemd` mappába.
5. Indítsa újra az Obsidian alkalmazást.
6. Menjen a **Settings** -> **Community plugins** menübe, és kapcsolja be a "Notemd" bővítményt.

## Konfiguráció

A bővítmény beállításai itt érhetők el:
**Settings** -> **Community Plugins** -> **Notemd** (kattintson a fogaskerék ikonra).

### LLM-szolgáltató konfigurálása
1.  **Aktív szolgáltató**: válassza ki a használni kívánt LLM-szolgáltatót a legördülő listából.
2.  **Szolgáltatói beállítások**: konfigurálja a kiválasztott szolgáltatóhoz tartozó konkrét beállításokat:
    *   **API Key**: a legtöbb felhőalapú szolgáltatóhoz szükséges (például OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Ollamához nem szükséges. LM Studio és az általános `OpenAI Compatible` előbeállítás esetén opcionális, ha a végpont anonim vagy helykitöltő hozzáférést enged.
    *   **Base URL / Endpoint**: a szolgáltatás API-végpontja. Az alapértékek meg vannak adva, de előfordulhat, hogy módosítani kell helyi modellek (LMStudio, Ollama), gateway-ek (OpenRouter, Requesty, OpenAI Compatible) vagy egyedi Azure-telepítések esetén. **Azure OpenAI esetén kötelező.**
    *   **Model**: a használni kívánt konkrét modellnév/azonosító (például `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Győződjön meg arról, hogy a modell elérhető a szolgáltatónál vagy a végponton.
    *   **Temperature**: az LLM kimenetének véletlenszerűségét szabályozza (0 = determinisztikus, 1 = maximális kreativitás). Az alacsonyabb értékek (például 0.2-0.5) általában jobbak strukturált feladatokhoz.
    *   **API Version (Azure Only)**: az Azure OpenAI telepítésekhez szükséges (például `2024-02-15-preview`).
3.  **Kapcsolat tesztelése**: használja az aktív szolgáltató "Kapcsolat tesztelése" gombját a beállítások ellenőrzéséhez. Az OpenAI-compatible szolgáltatók most szolgáltatótudatos ellenőrzéseket alkalmaznak: az olyan végpontok, mint a `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` és `OpenAI Compatible` közvetlenül a `chat/completions` útvonalat próbálják, míg a megbízható `/models` végponttal rendelkező szolgáltatók továbbra is kezdhetnek modelllistázással. Ha az első próba átmeneti hálózati bontás, például `ERR_CONNECTION_CLOSED` miatt meghiúsul, a Notemd automatikusan a stabil újrapróbálási sorozatra vált, ahelyett hogy azonnal hibát jelezne.
4.  **Szolgáltatói konfigurációk kezelése**: az "Export Providers" és "Import Providers" gombokkal mentheti/töltheti be az LLM-szolgáltatói beállításokat a bővítmény konfigurációs könyvtárában található `notemd-providers.json` fájlba. Ez megkönnyíti a biztonsági mentést és a megosztást.
5.  **Előbeállítási lefedettség**: az eredeti szolgáltatókon túl a Notemd most előre beállított elemeket tartalmaz a `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` és egy általános `OpenAI Compatible` célpont számára LiteLLM, vLLM, Perplexity, Vercel AI Gateway vagy egyéni proxyk esetén.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Többmodell-es konfiguráció
-   **Különböző szolgáltatók használata feladatokhoz**:
    *   **Kikapcsolva (alapértelmezett)**: a fenti egyetlen "aktív szolgáltatót" használja minden feladathoz.
    *   **Bekapcsolva**: lehetővé teszi, hogy minden feladathoz külön szolgáltatót válasszon, és opcionálisan felülírja a modell nevét ("Add Links", "Research & Summarize", "Generate from Title", "Translate", "Extract Concepts"). Ha egy feladat modellfelülírási mezője üres marad, akkor az adott feladathoz kiválasztott szolgáltató alapértelmezett modelljét használja.
-   **Különböző nyelvek kiválasztása különböző feladatokhoz**:
    *   **Kikapcsolva (alapértelmezett)**: minden feladathoz ugyanazt a "kimeneti nyelv" beállítást használja.
    *   **Bekapcsolva**: lehetővé teszi, hogy minden feladathoz külön nyelvet válasszon ("Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram", "Extract Concepts").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Nyelvi architektúra (felületi nyelv és feladatkimeneti nyelv)

-   **Felületi nyelv** csak a bővítmény felületi szövegét szabályozza (beállításcímkék, oldalsáv-gombok, értesítések és párbeszédablakok). Az alapértelmezett `auto` mód az Obsidian aktuális felületi nyelvét követi.
-   A regionális vagy írásrendszer szerinti változatok most a legközelebbi kiadott katalógusra oldódnak fel ahelyett, hogy azonnal angolra esnének vissza. Például a `fr-CA` francia nyelvet, az `es-419` spanyolt, a `pt-PT` portugált, a `zh-Hans` egyszerűsített kínait, a `zh-Hant-HK` pedig hagyományos kínait használ.
-   **Feladatkimeneti nyelv** a modell által generált feladatkimenetet szabályozza (hivatkozások, összefoglalók, címgenerálás, Mermaid-összefoglaló, fogalomkivonatolás, fordítási célnyelv).
-   **Per-task language mode** lehetővé teszi, hogy minden feladat ugyanabból az egységes szabályrétegből oldja fel a kimeneti nyelvet, ahelyett hogy modulonként szétszórt felülírásokra támaszkodna.
-   **Automatikus fordítás kikapcsolása** a nem `Translate` feladatokat a forrásnyelvi kontextusban tartja, miközben az explicit `Translate` feladatok továbbra is a konfigurált célnyelvet kényszerítik.
-   A Mermaidhez kapcsolódó generálási útvonalak ugyanazt a nyelvi szabályrendszert követik, és ha engedélyezve vannak, továbbra is aktiválhatják a Mermaid automatikus javítását.

### Stabil API-hívási beállítások
-   **Stabil API-hívások engedélyezése (újrapróbálkozási logika)**:
    *   **Kikapcsolva (alapértelmezett)**: egyetlen API-hívási hiba leállítja az aktuális feladatot.
    *   **Bekapcsolva**: automatikusan újrapróbálja a sikertelen LLM API-hívásokat (hasznos időszakos hálózati problémák vagy rate limit esetén).
    *   **Connection Test Fallback**: még akkor is, ha a normál hívások még nem futnak stabil módban, a szolgáltatói kapcsolattesztek most ugyanabba az újrapróbálási sorozatba váltanak az első átmeneti hálózati hiba után.
    *   **Runtime Transport Fallback (Environment-Aware)**: a `requestUrl` által átmenetileg megszakított hosszú futású feladatkérések most először környezetfüggő tartalék útvonalon ismétlik meg ugyanazt a próbát. Az asztali build-ek Node `http/https` útvonalat, a nem asztali környezetek böngészős `fetch`-et használnak. Ezek a tartalék próbálkozások most protokolltudatos streamelt feldolgozást használnak a beépített LLM-útvonalakon, lefedve az OpenAI-compatible SSE-t, az Azure OpenAI SSE-t, az Anthropic Messages SSE-t, a Google Gemini SSE-t és az Ollama NDJSON-kimenetet is, így a lassú gateway-ek hamarabb tudnak törzsdarabokat visszaadni. A megmaradó közvetlen OpenAI-stílusú belépési pontok ugyanazt a közös tartalék útvonalat használják.
    *   **OpenAI-Compatible Stable Order**: stabil módban minden OpenAI-compatible próbálkozás a `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` sorrendet követi, mielőtt hibás próbálkozásként lenne elszámolva. Ez megelőzi a túl agresszív hibázást, amikor csak egyetlen szállítási mód bizonytalan.
-   **Retry Interval (seconds)**: (csak bekapcsolás esetén látható) az újrapróbálások közötti várakozási idő (1-300 másodperc). Alapértelmezett: 5.
-   **Maximum Retries**: (csak bekapcsolás esetén látható) az újrapróbálási kísérletek maximális száma (0-10). Alapértelmezett: 3.
-   **API-hibakeresési mód**:
    *   **Kikapcsolva (alapértelmezett)**: szabványos, tömör hibajelentést használ.
    *   **Bekapcsolva**: részletes hibalogolást aktivál (hasonlóan a DeepSeek részletes kimenetéhez) minden szolgáltatóhoz és feladathoz (beleértve a Translate, Search és Connection Tests feladatokat). Ide tartoznak a HTTP-állapotkódok, nyers válaszszövegek, kérés-szállítási idővonalak, megtisztított kérés-URL-ek és fejlécek, próbálkozási idők, válaszfejlécek, részleges választestek, elemzett részleges stream-kimenet és veremnyomok, ami kulcsfontosságú az API-kapcsolati problémák és a felsőbb gateway-ek visszaállításainak hibakereséséhez.
-   **Developer Mode**:
    *   **Kikapcsolva (alapértelmezett)**: elrejti az összes csak fejlesztőknek szánt diagnosztikai vezérlőt a normál felhasználók elől.
    *   **Bekapcsolva**: megjelenít egy dedikált fejlesztői diagnosztikai panelt a Settings felületen.
-   **Developer Provider Diagnostic (Long Request)**:
    *   **Diagnostic Call Mode**: válassza ki a futtatási útvonalat próbánként. Az OpenAI-compatible szolgáltatók a futási módokon túl további kényszerített módokat is támogatnak (`direct streaming`, `direct buffered`, `requestUrl-only`).
    *   **Run Diagnostic**: futtat egy hosszú kérésre irányuló próbát a kiválasztott hívási móddal, és a vault gyökerébe ír egy `Notemd_Provider_Diagnostic_*.txt` fájlt.
    *   **Run Stability Test**: megismétli a próbát a megadott számú futásra (1-10) a kiválasztott móddal, és összesített stabilitási jelentést ment.
    *   **Diagnostic Timeout**: futásonként konfigurálható időkorlát (15-3600 másodperc).
    *   **Why Use It**: gyorsabb, mint a kézi reprodukció, amikor a szolgáltató átmegy a "Test connection" ellenőrzésen, de valós, hosszú futású feladatoknál (például lassú gateway-en végzett fordításnál) mégis hibázik.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Általános beállítások

#### Feldolgozott fájlok kimenete
-   **Customize Processed File Save Path**:
    *   **Kikapcsolva (alapértelmezett)**: a feldolgozott fájlok (például `YourNote_processed.md`) ugyanabba a mappába kerülnek, mint az eredeti jegyzet.
    *   **Bekapcsolva**: lehetővé teszi egyéni mentési hely megadását.
-   **Processed File Folder Path**: (csak akkor látható, ha a fenti beállítás engedélyezve van) adjon meg egy *relatív útvonalat* a vaulton belül (például `Processed Notes` vagy `Output/LLM`), ahová a feldolgozott fájlok kerüljenek. A mappák automatikusan létrejönnek, ha még nem léteznek. **Ne használjon abszolút útvonalakat (például C:\...) vagy érvénytelen karaktereket.**
-   **Use Custom Output Filename for 'Add Links'**:
    *   **Kikapcsolva (alapértelmezett)**: az 'Add Links' parancs által létrehozott feldolgozott fájlok az alapértelmezett `_processed.md` utótagot kapják (például `YourNote_processed.md`).
    *   **Bekapcsolva**: lehetővé teszi a kimeneti fájlnév testreszabását az alábbi beállítással.
-   **Custom Suffix/Replacement String**: (csak a fenti beállítás engedélyezésekor látható) adja meg a kimeneti fájlnévhez használni kívánt karakterláncot.
    *   Ha **üresen** hagyja, az eredeti fájl **felülíródik** a feldolgozott tartalommal.
    *   Ha megad egy karakterláncot (például `_linked`), az hozzáfűződik az eredeti fájlnév alapjához (például `YourNote_linked.md`). Győződjön meg arról, hogy az utótag nem tartalmaz érvénytelen fájlnévkaraktereket.

-   **Remove Code Fences on Add Links**:
    *   **Kikapcsolva (alapértelmezett)**: a kódkeretek **(\`\\\`\`)** megmaradnak a tartalomban a linkek hozzáadásakor, míg a **(\`\\\`markdown)** rész automatikusan törlődik.
    *   **Bekapcsolva**: eltávolítja a kódkereteket a tartalomból a linkek hozzáadása előtt.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Fogalomjegyzetek kimenete
-   **Customize Concept Note Path**:
    *   **Kikapcsolva (alapértelmezett)**: a `[[linked concepts]]` jegyzetek automatikus létrehozása ki van kapcsolva.
    *   **Bekapcsolva**: lehetővé teszi annak a mappának a megadását, ahová az új fogalomjegyzetek kerülnek.
-   **Concept Note Folder Path**: (csak akkor látható, ha a fenti testreszabás engedélyezve van) adjon meg egy *relatív útvonalat* a vaulton belül (például `Concepts` vagy `Generated/Topics`), ahová az új fogalomjegyzetek kerüljenek. A mappák automatikusan létrejönnek, ha még nem léteznek. **A testreszabás engedélyezése esetén kötelező megadni.** **Ne használjon abszolút útvonalakat vagy érvénytelen karaktereket.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Fogalomnapló fájl kimenete
-   **Generate Concept Log File**:
    *   **Kikapcsolva (alapértelmezett)**: nem készül naplófájl.
    *   **Bekapcsolva**: létrehoz egy naplófájlt, amely a feldolgozás után felsorolja az újonnan létrehozott fogalomjegyzeteket. A formátum a következő:
        ```
        xx fogalom md fájl generálása
        1. concepts1
        2. concepts2
        ...
        n. conceptsn
        ```
-   **Customize Log File Save Path**: (csak akkor látható, ha a "Generate Concept Log File" be van kapcsolva)
    *   **Kikapcsolva (alapértelmezett)**: a naplófájl a **Concept Note Folder Path** mappába kerül (ha meg van adva), egyébként a vault gyökerébe.
    *   **Bekapcsolva**: lehetővé teszi egyéni naplómappa megadását.
-   **Concept Log Folder Path**: (csak akkor látható, ha a "Customize Log File Save Path" be van kapcsolva) adjon meg egy *relatív útvonalat* a vaulton belül (például `Logs/Notemd`), ahová a naplófájl kerüljön. **A testreszabás engedélyezése esetén kötelező megadni.**
-   **Customize Log File Name**: (csak akkor látható, ha a "Generate Concept Log File" be van kapcsolva)
    *   **Kikapcsolva (alapértelmezett)**: a naplófájl neve `Generate.log`.
    *   **Bekapcsolva**: lehetővé teszi egyéni naplófájlnév megadását.
-   **Concept Log File Name**: (csak akkor látható, ha a "Customize Log File Name" be van kapcsolva) adja meg a kívánt fájlnevet (például `ConceptCreation.log`). **A testreszabás engedélyezése esetén kötelező megadni.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Fogalomkinyerési feladat
-   **Minimális fogalomjegyzetek létrehozása**:
    *   **On (Default)**: az újonnan létrehozott fogalomjegyzetek csak a címet tartalmazzák (például `# Concept`).
    *   **Off**: a fogalomjegyzetek további tartalmat is tartalmazhatnak, például "Linked From" visszahivatkozást, ha azt az alábbi beállítás nem tiltja le.
-   **Add "Linked From" backlink**:
    *   **Off (Default)**: a kivonatolás során nem ad hozzá visszahivatkozást a forrásdokumentumra a fogalomjegyzetben.
    *   **On**: hozzáad egy "Linked From" szakaszt a forrásfájlra mutató visszahivatkozással.

#### Meghatározott eredeti szöveg kinyerése
-   **Questions for extraction**: adjon meg egy kérdéslistát (soronként egyet), amelyre az AI szó szerinti válaszokat keressen ki a jegyzeteiből.
-   **Translate output to corresponding language**:
    *   **Off (Default)**: csak a kivonatolt szöveget adja ki az eredeti nyelvén.
    *   **On**: hozzáfűzi a kivonatolt szöveg fordítását az ehhez a feladathoz kiválasztott nyelven.
-   **Merged query mode**:
    *   **Off**: minden kérdést külön dolgoz fel (nagyobb pontosság, de több API-hívás).
    *   **On**: az összes kérdést egyetlen promptban küldi el (gyorsabb és kevesebb API-hívást igényel).
-   **Customise extracted text save path & filename**:
    *   **Off**: ugyanabba a mappába menti, mint az eredeti fájl, `_Extracted` utótaggal.
    *   **On**: lehetővé teszi egyéni kimeneti mappa és fájlnév-utótag megadását.

#### Kötegelt Mermaid-javítás
-   **Enable Mermaid Error Detection**:
    *   **Off (Default)**: a feldolgozás utáni hibafelismerés ki van kapcsolva.
    *   **On**: átvizsgálja a feldolgozott fájlokat megmaradt Mermaid-szintaktikai hibák után, és létrehoz egy `mermaid_error_{foldername}.md` jelentést.
-   **Move files with Mermaid errors to specified folder**:
    *   **Off**: a hibás fájlok a helyükön maradnak.
    *   **On**: azokat a fájlokat, amelyek a javítási kísérlet után is Mermaid-szintaktikai hibát tartalmaznak, egy dedikált mappába helyezi át kézi felülvizsgálatra.
-   **Mermaid error folder path**: (csak akkor látható, ha a fenti beállítás engedélyezve van) a mappa, ahová a hibás fájlokat áthelyezi.

#### Feldolgozási paraméterek
-   **Enable Batch Parallelism**:
    *   **Kikapcsolva (alapértelmezett)**: a kötegelt feldolgozási feladatok (például "Process Folder" vagy "Batch Generate from Titles") egyesével, sorosan dolgozzák fel a fájlokat.
    *   **Bekapcsolva**: lehetővé teszi, hogy a bővítmény több fájlt párhuzamosan dolgozzon fel, ami jelentősen felgyorsíthatja a nagy kötegelt munkákat.
-   **Batch Concurrency**: (csak akkor látható, ha a párhuzamosság engedélyezve van) beállítja a párhuzamosan feldolgozható fájlok maximális számát. A magasabb érték gyorsabb lehet, de több erőforrást használ, és API rate limitbe ütközhet. (Alapértelmezett: 1, Tartomány: 1-20)
-   **Batch Size**: (csak akkor látható, ha a párhuzamosság engedélyezve van) megadja, hány fájl tartozzon egyetlen kötegbe. (Alapértelmezett: 50, Tartomány: 10-200)
-   **Delay Between Batches (ms)**: (csak akkor látható, ha a párhuzamosság engedélyezve van) opcionális késleltetés ezredmásodpercben az egyes kötegek feldolgozása között, amely segíthet az API rate limit kezelésében. (Alapértelmezett: 1000ms)
-   **API Call Interval (ms)**: minimális késleltetés ezredmásodpercben minden egyes LLM API-hívás *előtt és után*. Fontos alacsony limitű API-k esetén, vagy a 429 hibák megelőzésére. Állítsa 0-ra, ha nincs szükség mesterséges késleltetésre. (Alapértelmezett: 500ms)
-   **Chunk Word Count**: az LLM-nek elküldött egyetlen rész maximális szószáma. Befolyásolja a nagy fájlokhoz szükséges API-hívások számát. (Alapértelmezett: 3000)
-   **Enable Duplicate Detection**: kapcsolja ki/be az alapvető ismétlődő szóellenőrzést a feldolgozott tartalomban (eredmények a konzolban). (Alapértelmezett: Engedélyezett)
-   **Max Tokens**: az LLM által egyetlen válaszrészben generálható tokenek maximális száma. Kihat a költségre és a részletezettségre. (Alapértelmezett: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Fordítás
-   **Default Target Language**: válassza ki azt az alapértelmezett nyelvet, amelyre a jegyzeteit fordítani szeretné. Ez a fordítási parancs futtatásakor a felületen felülírható. (Alapértelmezett: English)
-   **Customise Translation File Save Path**:
    *   **Kikapcsolva (alapértelmezett)**: a lefordított fájlok ugyanabba a mappába kerülnek, mint az eredeti jegyzet.
    *   **Bekapcsolva**: lehetővé teszi egy *relatív útvonal* megadását a vaulton belül (például `Translations`), ahová a lefordított fájlok kerülnek. A mappák automatikusan létrejönnek, ha nem léteznek.
-   **Use custom suffix for translated files**:
    *   **Kikapcsolva (alapértelmezett)**: a lefordított fájlok az alapértelmezett `_translated.md` utótagot kapják (például `YourNote_translated.md`).
    *   **Bekapcsolva**: lehetővé teszi egyéni utótag megadását.
-   **Custom Suffix**: (csak akkor látható, ha a fenti beállítás engedélyezve van) adja meg a lefordított fájlnevekhez hozzáfűzendő egyéni utótagot (például `_es` vagy `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Tartalomgenerálás
-   **Enable Research in "Generate from Title"**:
    *   **Kikapcsolva (alapértelmezett)**: a "Generate from Title" csak a címet használja bemenetként.
    *   **Bekapcsolva**: webes kutatást végez a konfigurált **Web Research Provider** segítségével, és a találatokat kontextusként hozzáadja az LLM-nek küldött címalapú generáláshoz.
-   **Auto-run Mermaid Syntax Fix after Generation**:
    *   **Bekapcsolva (alapértelmezett)**: automatikusan lefuttat egy Mermaid-szintaxisjavító lépést a Mermaidhez kapcsolódó munkafolyamatok után, mint például Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid és Translate.
    *   **Kikapcsolva**: a generált Mermaid-kimenetet érintetlenül hagyja, hacsak nem futtatja kézzel a `Batch Mermaid Fix` műveletet, vagy nem adja hozzá egy egyéni munkafolyamathoz.
-   **Output Language**: (új) válassza ki a kívánt kimeneti nyelvet a "Generate from Title" és a "Batch Generate from Title" feladatokhoz.
    *   **English (Default)**: a promptok feldolgozása és a kimenet angolul történik.
    *   **Other Languages**: az LLM angolul végzi a gondolatmenetet, de a végső dokumentációt a kiválasztott nyelven adja vissza (például Español, Français, 简体中文, 繁體中文, العربية, हिन्दी stb.).
-   **Change Prompt Word**: (új)
    *   **Change Prompt Word**: lehetővé teszi a prompt szó cseréjét egy adott feladatnál.
    *   **Custom Prompt Word**: adja meg az egyéni promptszót az adott feladathoz.
-   **Use Custom Output Folder for 'Generate from Title'**:
    *   **Kikapcsolva (alapértelmezett)**: a sikeresen generált fájlok egy `[OriginalFolderName]_complete` nevű almappába kerülnek az eredeti mappa szülőkönyvtárához képest (vagy `Vault_complete` mappába, ha az eredeti mappa a gyökér volt).
    *   **Bekapcsolva**: lehetővé teszi, hogy egyéni nevet adjon meg annak az almappának, ahová a kész fájlok kerüljenek.
-   **Custom Output Folder Name**: (csak akkor látható, ha a fenti beállítás engedélyezve van) adja meg az almappa kívánt nevét (például `Generated Content`, `_complete`). Érvénytelen karakterek nem használhatók. Üresen hagyva az alapértelmezett érték `_complete`. Ez a mappa az eredeti mappa szülőkönyvtárához képest jön létre.

#### Egykattintásos munkafolyamatgombok
-   **Visual Workflow Builder**: hozzon létre egyéni munkafolyamatgombokat a beépített műveletekből anélkül, hogy kézzel írná a DSL-t.
-   **Custom Workflow Buttons DSL**: haladó felhasználók közvetlenül is szerkeszthetik a munkafolyamat szöveges definícióját. Érvénytelen DSL esetén a rendszer biztonságosan visszatér az alapértelmezett munkafolyamathoz, és figyelmeztetést jelenít meg az oldalsávon/beállításokban.
-   **Workflow Error Strategy**:
    *   **Stop on Error (Default)**: azonnal leállítja a munkafolyamatot, ha egy lépés meghiúsul.
    *   **Continue on Error**: tovább futtatja a későbbi lépéseket, és a végén jelenti a hibás műveletek számát.
-   **Default Workflow Included**: a `One-Click Extract` összefűzi a `Process File (Add Links)`, `Batch Generate from Titles` és `Batch Mermaid Fix` lépéseket.

#### Egyéni utasításbeállítások
Ez a funkció lehetővé teszi, hogy felülírja az adott feladatokhoz az LLM-nek küldött alapértelmezett utasításokat (promptokat), finomhangolt kontrollt adva a kimenet felett.

-   **Enable Custom Prompts for Specific Tasks**:
    *   **Kikapcsolva (alapértelmezett)**: a bővítmény minden művelethez a beépített alapértelmezett promptokat használja.
    *   **Bekapcsolva**: aktiválja annak lehetőségét, hogy a lent felsorolt feladatokhoz egyéni promptokat állítson be. Ez ennek a funkciónak a főkapcsolója.

-   **Use Custom Prompt for [Task Name]**: (csak akkor látható, ha a fenti beállítás engedélyezve van)
    *   Minden támogatott feladatnál ("Add Links", "Generate from Title", "Research & Summarize", "Extract Concepts") külön-külön be- vagy kikapcsolhatja a saját egyéni promptját.
    *   **Disabled**: ez a konkrét feladat az alapértelmezett promptot használja.
    *   **Bekapcsolva**: ez a feladat az alábbi, megfelelő "Custom Prompt" szövegmezőben megadott szöveget használja.

-   **Custom Prompt Text Area**: (csak akkor látható, ha az adott feladathoz az egyéni prompt be van kapcsolva)
    *   **Default Prompt Display**: referenciaként a bővítmény megjeleníti azt az alapértelmezett promptot, amelyet normál esetben az adott feladathoz használna. A **"Copy Default Prompt"** gombbal ezt a szöveget kiindulópontként másolhatja a saját egyéni promptjához.
    *   **Custom Prompt Input**: itt írhatja meg a saját utasításait az LLM számára.
    *   **Placeholders**: a promptban speciális helyőrzők is használhatók (és ajánlott is), amelyeket a bővítmény tényleges tartalommal helyettesít, mielőtt elküldené a kérést az LLM-nek. Az alapértelmezett promptból kiderül, hogy az egyes feladatokhoz milyen helyőrzők érhetők el. A gyakori helyőrzők közé tartozik:
        *   `{TITLE}`: az aktuális jegyzet címe.
        *   `{RESEARCH_CONTEXT_SECTION}`: a webes kutatás során összegyűjtött tartalom.
        *   `{USER_PROMPT}`: a feldolgozás alatt álló jegyzet tartalma.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Duplikátumellenőrzési hatókör
-   **Duplicate Check Scope Mode**: szabályozza, hogy a fogalomjegyzet-mappában lévő jegyzetekhez képest mely fájlok legyenek ellenőrizve lehetséges duplikátumként.
    *   **Entire Vault (Default)**: a fogalomjegyzeteket a vault összes többi jegyzetéhez hasonlítja (magát a fogalomjegyzet-mappát kivéve).
    *   **Include Specific Folders Only**: a fogalomjegyzeteket csak az alább felsorolt mappákban található jegyzetekhez hasonlítja.
    *   **Exclude Specific Folders**: a fogalomjegyzeteket a felsorolt mappák *kivételével* minden más jegyzethez hasonlítja (a fogalomjegyzet-mappát is kizárva).
    *   **Concept Folder Only**: a fogalomjegyzeteket csak a *fogalomjegyzet-mappán belüli más jegyzetekhez* hasonlítja. Ez segít a generált fogalmakon belüli duplikátumok megtalálásában.
-   **Include/Exclude Folders**: (csak akkor látható, ha a mód `Include` vagy `Exclude`) adja meg a be- vagy kizárni kívánt mappák *relatív útvonalait*, **soronként egyet**. Az útvonalak megkülönböztetik a kis- és nagybetűket, és `/` karaktert használnak elválasztóként (például `Reference Material/Papers` vagy `Daily Notes`). Ezek a mappák nem lehetnek azonosak a fogalomjegyzet-mappával, és nem lehetnek annak részei.

#### Webes kutatási szolgáltató
-   **Search Provider**: válasszon a `Tavily` (API-kulcs szükséges, ajánlott) és a `DuckDuckGo` (kísérleti, a keresőmotor gyakran blokkolja az automatizált kéréseket) között. A "Research & Summarize Topic" feladathoz és opcionálisan a "Generate from Title" művelethez használatos.
-   **Tavily API Key**: (csak akkor látható, ha a Tavily van kiválasztva) adja meg a [tavily.com](https://tavily.com/) oldalról kapott API-kulcsát.
-   **Tavily Max Results**: (csak akkor látható, ha a Tavily van kiválasztva) a Tavily által visszaadott keresési eredmények maximális száma (1-20). Alapértelmezett: 5.
-   **Tavily Search Depth**: (csak akkor látható, ha a Tavily van kiválasztva) válassza a `basic` (alapértelmezett) vagy az `advanced` módot. Megjegyzés: az `advanced` jobb eredményeket ad, de keresésenként 2 API-kreditet fogyaszt 1 helyett.
-   **DuckDuckGo Max Results**: (csak akkor látható, ha a DuckDuckGo van kiválasztva) a feldolgozandó keresési eredmények maximális száma (1-10). Alapértelmezett: 5.
-   **DuckDuckGo Content Fetch Timeout**: (csak akkor látható, ha a DuckDuckGo van kiválasztva) maximális várakozási idő másodpercben, amikor a rendszer megpróbál tartalmat letölteni az egyes DuckDuckGo-eredmények URL-jeiről. Alapértelmezett: 15.
-   **Max Research Content Tokens**: a webes kutatásból származó egyesített eredményekből (kivonatok/letöltött tartalmak) összefoglalási promptba bevont tokenek hozzávetőleges maximális száma. Segít a kontextusablak méretének és a költségeknek a kezelésében. (Alapértelmezett: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Fókuszált tanulási terület
-   **Enable Focused Learning Domain**:
    *   **Kikapcsolva (alapértelmezett)**: az LLM-nek küldött promptok a standard, általános célú utasításokat használják.
    *   **Bekapcsolva**: lehetővé teszi, hogy egy vagy több szakterületet adjon meg az LLM kontextuális megértésének javítására.
-   **Learning Domain**: (csak akkor látható, ha a fenti beállítás engedélyezve van) adja meg a konkrét szakterület(ek)et, például 'Materials Science', 'Polymer Physics', 'Machine Learning'. Ez egy "Relevant Fields: [...]" sort ad a promptok elejére, így az LLM pontosabb és relevánsabb linkeket és tartalmat tud létrehozni a saját tanulási területére.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Használati útmutató

### Gyors munkafolyamatok és oldalsáv

-   Nyissa meg a Notemd oldalsávot, hogy hozzáférjen a csoportosított műveletszakaszokhoz az alapfeldolgozás, generálás, fordítás, tudáskezelés és segédfunkciók számára.
-   Használja az oldalsáv tetején található **Gyors munkafolyamatok** területet egyéni, több lépésből álló gombok indításához.
-   Az alapértelmezett **One-Click Extract** munkafolyamat a `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix` lépéseket futtatja.
-   A munkafolyamat állapota, a lépésenkénti naplók és a hibák az oldalsávban jelennek meg, egy rögzített lábléccel, amely megakadályozza, hogy a folyamatjelző sáv és a naplóterület kiszoruljon a kitágított szakaszok miatt.
-   A folyamatkártya jól áttekinthetővé teszi az állapotszöveget, a külön százalékjelzőt és a hátralévő időt, és ugyanazok az egyéni munkafolyamatok a beállításokból is újrakonfigurálhatók.

### Eredeti feldolgozás (wiki-linkek hozzáadása)
Ez az alapfunkció, amely a fogalmak azonosítására és `[[wiki-links]]` hivatkozások hozzáadására összpontosít.

**Fontos:** ez a folyamat csak `.md` vagy `.txt` fájlokon működik. A PDF-fájlokat ingyenesen MD formátumba konvertálhatja a [Mineru](https://github.com/opendatalab/MinerU) segítségével a további feldolgozás előtt.

1.  **Az oldalsáv használata**:
    *   Nyissa meg a Notemd oldalsávot (varázspálca ikon vagy parancspaletta).
    *   Nyissa meg a `.md` vagy `.txt` fájlt.
    *   Kattintson a **"Process File (Add Links)"** gombra.
    *   Mappa feldolgozásához kattintson a **"Process Folder (Add Links)"** gombra, válassza ki a mappát, majd kattintson a "Process" gombra.
    *   Az előrehaladás az oldalsávban látható. A feladat megszakítható az oldalsáv "Cancel Processing" gombjával.
    *   *Megjegyzés mappafeldolgozáshoz:* a fájlok a háttérben kerülnek feldolgozásra anélkül, hogy megnyílnának a szerkesztőben.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **A parancspaletta használata** (`Ctrl+P` vagy `Cmd+P`):
    *   **Single File**: nyissa meg a fájlt, és futtassa a `Notemd: Process Current File` parancsot.
    *   **Folder**: futtassa a `Notemd: Process Folder` parancsot, majd válassza ki a mappát. A fájlok a háttérben kerülnek feldolgozásra anélkül, hogy megnyílnának a szerkesztőben.
    *   A parancspalettáról indított műveletekhez megjelenik egy folyamatjelző modális ablak, amely megszakító gombot is tartalmaz.
    *   *Megjegyzés:* a bővítmény mentés előtt automatikusan eltávolítja a végső feldolgozott tartalomból a kezdő `\boxed{` és a záró `}` sorokat, ha ilyeneket talál.

### Új funkciók

1.  **Összefoglalás Mermaid-diagramként**:
    *   Nyissa meg azt a jegyzetet, amelyet össze szeretne foglalni.
    *   Futtassa a `Notemd: Summarise as Mermaid diagram` parancsot (parancspalettából vagy oldalsáv-gombbal).
    *   A bővítmény létrehoz egy új jegyzetet a Mermaid-diagrammal.

2.  **Translate Note/Selection**:
    *   Jelöljön ki szöveget egy jegyzetben, ha csak azt szeretné lefordítani, vagy indítsa el kijelölés nélkül, ha az egész jegyzetet szeretné fordítani.
    *   Futtassa a `Notemd: Translate Note/Selection` parancsot (parancspalettából vagy oldalsáv-gombbal).
    *   Megjelenik egy modális ablak, ahol megerősítheti vagy módosíthatja a **Target Language** beállítást (alapértelmezésben a Konfiguráció részben megadott értéket használja).
    *   A bővítmény a konfigurált **LLM Provider**-t használja (a Multi-Model beállítások alapján) a fordítás végrehajtásához.
    *   A lefordított tartalom a konfigurált **Translation Save Path** helyre kerül a megfelelő utótaggal, és **az eredeti tartalom jobb oldalán egy új panelen** nyílik meg az egyszerű összehasonlítás érdekében.
    *   A feladat megszakítható az oldalsáv gombjával vagy a modális ablak megszakító gombjával.
3.  **Kötegelt fordítás**:
    *   Futtassa a `Notemd: Batch Translate Folder` parancsot a parancspalettáról, és válasszon ki egy mappát, vagy kattintson jobb gombbal egy mappára a fájlkezelőben, majd válassza a "Batch translate this folder" lehetőséget.
    *   A bővítmény a kiválasztott mappában lévő összes Markdown-fájlt lefordítja.
    *   A lefordított fájlok a konfigurált fordítási útvonalra kerülnek, de nem nyílnak meg automatikusan.
    *   Ez a folyamat a folyamatjelző modális ablakból megszakítható.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Research & Summarize Topic**:
    *   Jelöljön ki szöveget egy jegyzetben VAGY győződjön meg róla, hogy a jegyzetnek van címe (ez lesz a keresési téma).
    *   Futtassa a `Notemd: Research and Summarize Topic` parancsot (parancspalettából vagy oldalsáv-gombbal).
    *   A bővítmény a konfigurált **Search Provider**-t (Tavily/DuckDuckGo) és a megfelelő **LLM Provider**-t használja (a Multi-Model beállítások alapján) az információk felkutatásához és összefoglalásához.
    *   Az összefoglaló hozzáfűződik az aktuális jegyzethez.
    *   A feladat megszakítható az oldalsáv gombjával vagy a modális ablak megszakító gombjával.
    *   *Megjegyzés:* a DuckDuckGo keresések botészlelés miatt meghiúsulhatnak. A Tavily használata ajánlott.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Generate Content from Title**:
    *   Nyisson meg egy jegyzetet (üres is lehet).
    *   Futtassa a `Notemd: Generate Content from Title` parancsot (parancspalettából vagy oldalsáv-gombbal).
    *   A bővítmény a megfelelő **LLM Provider**-t használja (a Multi-Model beállítások alapján), hogy a jegyzet címe alapján tartalmat generáljon, lecserélve bármely meglévő tartalmat.
    *   Ha az **"Enable Research in 'Generate from Title'"** beállítás be van kapcsolva, először webes kutatást végez (a konfigurált **Web Research Provider** segítségével), és ezt a kontextust hozzáadja az LLM-nek küldött prompthoz.
    *   A feladat megszakítható az oldalsáv gombjával vagy a modális ablak megszakító gombjával.

5.  **Batch Generate Content from Titles**:
    *   Futtassa a `Notemd: Batch Generate Content from Titles` parancsot (parancspalettából vagy oldalsáv-gombbal).
    *   Válassza ki azt a mappát, amely a feldolgozni kívánt jegyzeteket tartalmazza.
    *   A bővítmény végigiterál a mappa minden `.md` fájlján (kivéve a `_processed.md` fájlokat és a kijelölt "complete" mappában lévőket), a cím alapján tartalmat generál, és lecseréli a meglévő tartalmat. A fájlok a háttérben kerülnek feldolgozásra anélkül, hogy megnyílnának a szerkesztőben.
    *   A sikeresen feldolgozott fájlok a konfigurált "complete" mappába kerülnek.
    *   Ez a parancs minden feldolgozott jegyzetnél tiszteletben tartja az **"Enable Research in 'Generate from Title'"** beállítást.
    *   A feladat megszakítható az oldalsáv gombjával vagy a modális ablak megszakító gombjával.
    *   Az előrehaladás és az eredmények (módosított fájlok száma, hibák) az oldalsáv/modális ablak naplójában láthatók.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Check and Remove Duplicate Concept Notes**:
    *   Győződjön meg róla, hogy a **Concept Note Folder Path** helyesen van beállítva.
    *   Futtassa a `Notemd: Check and Remove Duplicate Concept Notes` parancsot (parancspalettából vagy oldalsáv-gombbal).
    *   A bővítmény átvizsgálja a fogalomjegyzet-mappát, és több szabály (pontos egyezés, többes szám, normalizálás, tartalmazás) alapján összeveti a fájlneveket a mappán kívüli jegyzetekkel.
    *   Ha potenciális duplikátumokat talál, egy modális ablak jelenik meg a fájlok listájával, a megjelölés okával és az ütköző fájlokkal.
    *   Nézze át figyelmesen a listát. Kattintson a **"Delete Files"** gombra a felsorolt fájlok rendszerlomtárba helyezéséhez, vagy a **"Cancel"** gombra, ha nem szeretne módosítást végezni.
    *   Az előrehaladás és az eredmények az oldalsáv/modális naplóban jelennek meg.

7.  **Extract Concepts (Pure Mode)**:
    *   Ez a funkció lehetővé teszi, hogy egy dokumentumból fogalmakat vonjon ki, és létrehozza a hozzájuk tartozó fogalomjegyzeteket az eredeti fájl *módosítása nélkül*. Tökéletes arra, hogy gyorsan feltöltse tudásbázisát egy dokumentumkészletből.
    *   **Single File**: nyisson meg egy fájlt, és futtassa a `Notemd: Extract concepts (create concept notes only)` parancsot a parancspalettáról, vagy kattintson az oldalsáv **"Extract concepts (current file)"** gombjára.
    *   **Folder**: futtassa a `Notemd: Batch extract concepts from folder` parancsot a parancspalettáról, vagy kattintson az oldalsáv **"Extract concepts (folder)"** gombjára, majd válasszon egy mappát annak összes jegyzetének feldolgozásához.
    *   A bővítmény beolvassa a fájlokat, azonosítja a fogalmakat, és új jegyzeteket hoz létre számukra a kijelölt **Concept Note Folder** mappában, az eredeti fájlok érintetlenül hagyásával.

8.  **Create Wiki-Link & Generate Note from Selection**:
    *   Ez a hatékony parancs leegyszerűsíti az új fogalomjegyzetek létrehozásának és feltöltésének folyamatát.
    *   Jelöljön ki egy szót vagy kifejezést a szerkesztőben.
    *   Futtassa a `Notemd: Create Wiki-Link & Generate Note from Selection` parancsot (ajánlott hozzá gyorsbillentyűt rendelni, például `Cmd+Shift+W`).
    *   A bővítmény a következőket teszi:
        1.  Lecseréli a kijelölt szöveget egy `[[wiki-link]]` hivatkozásra.
        2.  Ellenőrzi, hogy létezik-e már ilyen című jegyzet a **Concept Note Folder** mappában.
        3.  Ha létezik, visszahivatkozást ad hozzá az aktuális jegyzetből.
        4.  Ha nem létezik, létrehoz egy új, üres jegyzetet.
        5.  Ezután automatikusan lefuttatja a **"Generate Content from Title"** parancsot az új vagy meglévő jegyzeten, és AI által generált tartalommal tölti fel.

9.  **Extract Concepts and Generate Titles**:
    *   Ez a parancs két erős funkciót fűz össze egy áramvonalas munkafolyamatba.
    *   Futtassa a `Notemd: Extract Concepts and Generate Titles` parancsot a parancspalettáról (ajánlott gyorsbillentyűt rendelni hozzá).
    *   A bővítmény a következőt teszi:
        1.  Először lefuttatja az aktuálisan aktív fájlon az **"Extract concepts (current file)"** feladatot.
        2.  Ezután automatikusan lefuttatja a **"Batch generate from titles"** feladatot azon a mappán, amelyet a beállításokban **Concept note folder path** néven konfigurált.
    *   Ez lehetővé teszi, hogy először új fogalmakkal töltse fel tudásbázisát egy forrásdokumentumból, majd ugyanabban a lépésben azonnal AI által generált tartalommal bővítse ezeket az új fogalomjegyzeteket.

10. **Extract Specific Original Text**:
    *   Állítsa be a kérdéseit a beállításokban az "Extract Specific Original Text" szakasz alatt.
    *   Az aktív fájl feldolgozásához használja az oldalsáv "Extract Specific Original Text" gombját.
    *   **Merged Mode**: gyorsabb feldolgozást tesz lehetővé azáltal, hogy minden kérdést egyetlen promptban küld el.
    *   **Translation**: opcionálisan lefordítja a kivonatolt szöveget a konfigurált nyelvre.
    *   **Custom Output**: beállítható, hogy hová és milyen néven mentse a kivonatolt fájlt.

11. **Batch Mermaid Fix**:
    *   Az oldalsáv "Batch Mermaid Fix" gombjával vizsgáljon át egy mappát, és javítsa ki a gyakori Mermaid-szintaktikai hibákat.
    *   A bővítmény minden olyan fájlról jelentést készít, amely még mindig hibát tartalmaz, egy `mermaid_error_{foldername}.md` fájlban.
    *   Opcionálisan beállítható, hogy a problémás fájlokat a bővítmény külön felülvizsgálati mappába helyezze át.

## Támogatott LLM-szolgáltatók

| Szolgáltató       | Típus      | API-kulcs szükséges    | Megjegyzések                                                         |
|-------------------|------------|------------------------|-----------------------------------------------------------------------|
| DeepSeek          | Felhős     | Igen                   | Natív DeepSeek-végpont reasoning modellek kezelésével                |
| Qwen              | Felhős     | Igen                   | DashScope compatible-mode előbeállítás Qwen / QwQ modellekhez        |
| Qwen Code         | Felhős     | Igen                   | DashScope kódolásközpontú előbeállítás Qwen coder modellekhez        |
| Doubao            | Felhős     | Igen                   | Volcengine Ark előbeállítás; a modellmező általában az Ön endpoint ID-ja |
| Moonshot          | Felhős     | Igen                   | Hivatalos Kimi / Moonshot végpont                                    |
| GLM               | Felhős     | Igen                   | Hivatalos Zhipu BigModel OpenAI-compatible végpont                   |
| Z AI              | Felhős     | Igen                   | Nemzetközi GLM/Zhipu OpenAI-compatible végpont; kiegészíti a `GLM`-et |
| MiniMax           | Felhős     | Igen                   | Hivatalos MiniMax chat-completions végpont                           |
| Huawei Cloud MaaS | Felhős     | Igen                   | Huawei ModelArts MaaS OpenAI-compatible végpont hosztolt modellekhez |
| Baidu Qianfan     | Felhős     | Igen                   | Hivatalos Qianfan OpenAI-compatible végpont ERNIE modellekhez        |
| SiliconFlow       | Felhős     | Igen                   | Hivatalos SiliconFlow OpenAI-compatible végpont hosztolt OSS modellekhez |
| OpenAI            | Felhős     | Igen                   | Támogatja a GPT és o-sorozatú modelleket                             |
| Anthropic         | Felhős     | Igen                   | Támogatja a Claude modelleket                                        |
| Google            | Felhős     | Igen                   | Támogatja a Gemini modelleket                                        |
| Mistral           | Felhős     | Igen                   | Támogatja a Mistral és Codestral családokat                          |
| Azure OpenAI      | Felhős     | Igen                   | Endpointet, API-kulcsot, deployment nevet és API Versiont igényel    |
| OpenRouter        | Átjáró     | Igen                   | Sok szolgáltató elérése OpenRouter modellazonosítókon keresztül      |
| xAI               | Felhős     | Igen                   | Natív Grok-végpont                                                   |
| Groq              | Felhős     | Igen                   | Gyors OpenAI-compatible inferencia hosztolt OSS modellekhez          |
| Together          | Felhős     | Igen                   | OpenAI-compatible végpont hosztolt OSS modellekhez                   |
| Fireworks         | Felhős     | Igen                   | OpenAI-compatible inferencia-végpont                                 |
| Requesty          | Átjáró     | Igen                   | Többszolgáltatós útválasztó egyetlen API-kulcs mögött                |
| OpenAI Compatible | Átjáró     | Opcionális             | Általános előbeállítás LiteLLM-hez, vLLM-hez, Perplexityhez, Vercel AI Gatewayhez stb. |
| LMStudio          | Helyi      | Opcionális (`EMPTY`)   | Modelleket futtat helyben az LM Studio szerveren keresztül           |
| Ollama            | Helyi      | Nem                    | Modelleket futtat helyben az Ollama szerveren keresztül              |

*Megjegyzés: helyi szolgáltatók (LMStudio, Ollama) esetén győződjön meg arról, hogy a megfelelő szerveralkalmazás fut, és elérhető a konfigurált Base URL címen.*
*Megjegyzés: OpenRouter és Requesty esetén használja a gateway által megjelenített teljes/szolgáltató-előtagos modellazonosítót (például `google/gemini-flash-1.5` vagy `anthropic/claude-3-7-sonnet-latest`).*
*Megjegyzés: a `Doubao` modellmezője általában Ark endpoint/deployment ID-t vár, nem puszta modellcsalád-nevet. A beállítási képernyő most figyelmeztet, ha még mindig a helykitöltő érték szerepel, és blokkolja a kapcsolatteszteket, amíg azt valódi endpoint ID-re nem cseréli.*
*Megjegyzés: a `Z AI` a nemzetközi `api.z.ai` vonalat célozza, míg a `GLM` megtartja a szárazföldi kínai BigModel végpontot. Válassza a fiókja régiójának megfelelő előbeállítást.*
*Megjegyzés: a Kínára fókuszáló előbeállítások chat-first kapcsolatteszteket használnak, így a teszt a ténylegesen konfigurált modellt/deploymentet ellenőrzi, nem csak az API-kulcs elérhetőségét.*
*Megjegyzés: az `OpenAI Compatible` egyéni gateway-ekhez és proxykhoz készült. A Base URL-t, az API-kulcs-szabályt és a modellazonosítót a szolgáltató dokumentációja szerint állítsa be.*

## Hálózathasználat és adatkezelés

A Notemd helyben fut az Obsidianon belül, de bizonyos funkciók külső kéréseket küldenek.

### LLM-szolgáltatói hívások (konfigurálható)

- Kiváltó ok: fájlfeldolgozás, generálás, fordítás, kutatási összefoglalás, Mermaid-összefoglalás, valamint kapcsolódási/diagnosztikai műveletek.
- Végpont: a Notemd beállításaiban megadott szolgáltatói Base URL(ek).
- Küldött adatok: a feldolgozáshoz szükséges promptszöveg és feladattartalom.
- Adatkezelési megjegyzés: az API-kulcsok helyben, a bővítmény beállításaiban vannak tárolva, és a készülékéről induló kérések aláírásához használatosak.

### Webes kutatási hívások (opcionális)

- Kiváltó ok: amikor a webes kutatás engedélyezve van, és egy keresőszolgáltató ki van választva.
- Végpont: Tavily API vagy DuckDuckGo-végpontok.
- Küldött adatok: a kutatási lekérdezés és a szükséges kérésmetaadatok.

### Fejlesztői diagnosztika és hibakeresési naplók (opcionális)

- Kiváltó ok: API debug mód és fejlesztői diagnosztikai műveletek.
- Tárolás: a diagnosztikai és hibafájlok a vault gyökerébe íródnak (például `Notemd_Provider_Diagnostic_*.txt` és `Notemd_Error_Log_*.txt`).
- Kockázati megjegyzés: a naplók tartalmazhatnak kérés-/válaszrészleteket. Nyilvános megosztás előtt ellenőrizze őket.

### Helyi tárolás

- A bővítmény konfigurációja a `.obsidian/plugins/notemd/data.json` fájlban tárolódik.
- A generált fájlok, jelentések és opcionális naplók a beállításoknak megfelelően a vaultban tárolódnak.

## Hibaelhárítás

### Gyakori problémák
-   **A bővítmény nem töltődik be**: győződjön meg arról, hogy a `manifest.json`, `main.js`, `styles.css` fájlok a megfelelő mappában (`<Vault>/.obsidian/plugins/notemd/`) vannak, majd indítsa újra az Obsidian alkalmazást. Ellenőrizze a Developer Console-t (`Ctrl+Shift+I` vagy `Cmd+Option+I`) az indításkori hibákért.
-   **Feldolgozási hibák / API-hibák**:
    1.  **Ellenőrizze a fájlformátumot**: győződjön meg arról, hogy a feldolgozni vagy ellenőrizni kívánt fájl `.md` vagy `.txt` kiterjesztésű. A Notemd jelenleg csak ezeket a szövegalapú formátumokat támogatja.
    2.  Használja a "Test LLM Connection" parancsot/gombot az aktív szolgáltató beállításainak ellenőrzésére.
    3.  Ellenőrizze újra az API Key, Base URL, Model Name és (Azure esetén) API Version értékeket. Győződjön meg arról, hogy az API-kulcs helyes, és rendelkezik elegendő kredittel/jogosultsággal.
    4.  Győződjön meg arról, hogy a helyi LLM-szerver (LMStudio, Ollama) fut, és a Base URL helyes (például `http://localhost:1234/v1` LMStudio esetén).
    5.  Ellenőrizze internetkapcsolatát a felhőalapú szolgáltatóknál.
    6.  **Egyfájlos feldolgozási hibáknál:** tekintse meg a Developer Console részletes hibaüzeneteit. Szükség esetén másolja ki őket a hibaablak gombjával.
    7.  **Kötegelt feldolgozási hibáknál:** ellenőrizze a vault gyökerében található `error_processing_filename.log` fájlt az egyes sikertelen fájlok részletes hibaüzeneteiért. A Developer Console vagy a hibaablak csak összefoglalót vagy általános köteghibát jeleníthet meg.
    8.  **Automatikus hibalogok:** ha egy folyamat sikertelen, a bővítmény automatikusan ment egy részletes naplófájlt `Notemd_Error_Log_[Timestamp].txt` néven a vault gyökérkönyvtárába. Ez a fájl tartalmazza a hibaüzenetet, a veremnyomot és a munkamenetnaplókat. Ha tartós problémába ütközik, ellenőrizze ezt a fájlt. Ha engedélyezi az "API Error Debugging Mode" módot a beállításokban, ez a napló még részletesebb API-válaszadatokkal telik meg.
    9.  **Valós végpontú hosszú kérésdiagnosztika (fejlesztőknek)**:
        - Bővítményen belüli útvonal (elsőként ajánlott): használja a **Settings -> Notemd -> Developer provider diagnostic (long request)** beállítást, hogy futásidejű próbát végezzen az aktív szolgáltatón, és `Notemd_Provider_Diagnostic_*.txt` fájlt generáljon a vault gyökerében.
        - CLI útvonal (az Obsidian futtatási környezetén kívül): a pufferelt és streamelt viselkedés reprodukálható, végpontszintű összehasonlításához használja a következőt:
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
        A generált jelentés próbálkozásonkénti időzítéseket (`First Byte`, `Duration`), megtisztított kérésmetaadatokat, válaszfejléceket, nyers/részleges törzsfragmenseket, elemzett stream-fragmenseket és a szállítási réteg hibapontjait tartalmazza.
-   **LM Studio/Ollama kapcsolati problémák**:
    *   **A kapcsolat tesztelése sikertelen**: győződjön meg róla, hogy a helyi szerver (LM Studio vagy Ollama) fut, és a megfelelő modell be van töltve / elérhető.
    *   **CORS Errors (Ollama Windows alatt)**: ha Ollama használata közben CORS (Cross-Origin Resource Sharing) hibákba ütközik Windows alatt, szükség lehet az `OLLAMA_ORIGINS` környezeti változó beállítására. Ezt úgy teheti meg, hogy az Ollama indítása előtt lefuttatja a `set OLLAMA_ORIGINS=*` parancsot a parancssorban. Ez engedélyezi a kéréseket bármely forrásból.
    *   **Enable CORS in LM Studio**: LM Studio esetén a CORS közvetlenül a szerverbeállításokban engedélyezhető, ami szükséges lehet, ha az Obsidian böngészőben fut, vagy szigorú origin-szabályok érvényesek.
-   **Mappalétrehozási hibák ("File name cannot contain...")**:
    *   Ez általában azt jelenti, hogy a beállításokban megadott útvonal (**Processed File Folder Path** vagy **Concept Note Folder Path**) az Obsidian számára érvénytelen.
    *   **Győződjön meg arról, hogy relatív útvonalakat használ** (például `Processed`, `Notes/Concepts`), és **nem abszolút útvonalakat** (például `C:\Users\...`, `/Users/...`).
    *   Ellenőrizze az érvénytelen karaktereket: `* " \ / < > : | ? # ^ [ ]`. Vegye figyelembe, hogy a `\` az Obsidian útvonalaihoz Windows alatt is érvénytelen. Elválasztóként `/` karaktert használjon.
-   **Teljesítményproblémák**: nagy fájlok vagy sok fájl feldolgozása időbe telhet. Csökkentse a "Chunk Word Count" beállítást, ha potenciálisan gyorsabb (de több) API-hívást szeretne. Próbáljon ki másik LLM-szolgáltatót vagy modellt.
-   **Váratlan hivatkozás-hozzáadás**: a hivatkozás-hozzáadás minősége erősen függ az LLM-től és a prompttól. Kísérletezzen különböző modellekkel vagy hőmérsékleti beállításokkal.

## Közreműködés

A közreműködéseket szívesen fogadjuk. Irányelvekért lásd a GitHub-tárházat: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Karbantartói dokumentáció

- [Kiadási munkafolyamat (angol)](./docs/maintainer/release-workflow.md)
- [Kiadási munkafolyamat (egyszerűsített kínai)](./docs/maintainer/release-workflow.zh-CN.md)

## Licenc

MIT licenc - a részletekért lásd a [LICENSE](LICENSE) fájlt.

---

*Notemd v1.8.3 - Fejlessze az Obsidian tudásgráfját mesterséges intelligenciával.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
