
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd bővítmény Obsidianhoz

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Dokumentáció olvasása más nyelveken: [Nyelvi központ](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      AI-alapú többnyelvű tudásbővítő eszköz
==================================================
```

Egy egyszerű mód saját tudásbázisának létrehozására!

A Notemd fejleszti az Obsidian munkafolyamatát azáltal, hogy különféle nagy nyelvi modellekkel (LLM) integrálódik a többnyelvű jegyzetek feldolgozásához, automatikusan wiki-linkeket generál a kulcsfontosságú fogalmakhoz, létrehozza a megfelelő fogalomjegyzeteket, webes kutatást végez, és segít hatékony tudásgrafikonok építésében.

**Verzió:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Tartalomjegyzék
- [Gyorsindítás](#gyorsindítás)
- [Nyelvi támogatás](#nyelvi-támogatás)
- [Funkciók](#funkciók)
- [Telepítés](#telepítés)
- [Konfiguráció](#konfiguráció)
- [Használati útmutató](#használati-útmutató)
- [Támogatott LLM szolgáltatók](#támogatott-llm-szolgáltatók)
- [Hálózati használat és adatkezelés](#hálózati-használat-és-adatkezelés)
- [Hibaelhárítás](#hibaelhárítás)
- [Közreműködés](#közreműködés)
- [Karbantartói dokumentáció](#karbantartói-dokumentáció)
- [Licenc](#licenc)

## Gyorsindítás

1.  **Telepítés és engedélyezés**: Szerezze be a bővítményt az Obsidian közösségi áruházából.
2.  **LLM konfigurálása**: Lépjen a `Beállítások -> Notemd` menüpontba, válassza ki LLM szolgáltatóját (például OpenAI vagy egy helyi, mint az Ollama), és adja meg API kulcsát/URL-jét.
3.  **Oldalsáv megnyitása**: Kattintson a Notemd varázspálca ikonra a bal oldali sávban az oldalsáv megnyitásához.
4.  **Jegyzet feldolgozása**: Nyisson meg egy jegyzetet, és kattintson a **"Fájl feldolgozása (Linkek hozzáadása)"** gombra az oldalsávon a `[[wiki-linkek]]` automatikus hozzáadásához.
5.  **Gyors munkafolyamat futtatása**: Használja az alapértelmezett **"One-Click Extract"** gombot a feldolgozás, a kötegelt generálás és a Mermaid javítás egyetlen pontból történő összekapcsolásához.

Ennyi! Fedezze fel a beállításokat további funkciók, például webes kutatás, fordítás és tartalomgenerálás feloldásához.

## Nyelvi támogatás

### Nyelvi viselkedési szerződés

| Szempont | Hatókör | Alapértelmezett | Megjegyzések |
|---|---|---|---|
| `UI Locale` | Csak a bővítmény felületének szövege | `auto` | Követi az Obsidian nyelvét; jelenlegi katalógusok: `en`, `zh-CN`, `zh-TW`. |
| `Feladat kimeneti nyelve` | LLM által generált kimenetek (linkek, összefoglalók) | `en` | Lehet globális vagy feladatonkénti. |
| `Automatikus fordítás letiltása` | A nem fordítási feladatok megtartják az eredeti kontextust | `false` | Az explicit `Fordítás` feladatok továbbra is a célnyelvet kényszerítik ki. |

- A hivatalos dokumentáció angol és egyszerűsített kínai nyelven érhető el, teljes támogatással több mint 30 nyelvhez.
- Minden támogatott nyelv linkelve van a fenti fejlécben.

## Főbb funkciók

### AI-alapú dokumentumfeldolgozás
- **Multi-LLM támogatás**: Csatlakozzon különféle felhőalapú és helyi LLM szolgáltatókhoz.
- **Intelligens darabolás**: Automatikusan darabolja a nagy dokumentumokat kezelhető részekre.
- **Tartalommegőrzés**: Célja az eredeti formázás megtartása a struktúra és linkek hozzáadása közben.
- **Újrapróbálkozási logika**: Opcionális automatikus újrapróbálkozás sikertelen API hívások esetén.
- **Kínai készletek**: Tartalmazza az olyan szolgáltatókat, mint a `Qwen`, `Doubao`, `Moonshot` stb.

### Tudásgrafikon javítása
- **Automatikus Wiki-linkelés**: Azonosítja és hozzáadja a wiki-linkeket a fogalmakhoz.
- **Fogalomjegyzet létrehozása**: Automatikusan új jegyzeteket hoz létre a felfedezett fogalmakhoz.

### Fordítás
- **AI fordítás**: Fordítsa le a jegyzetek tartalmát a konfigurált LLM segítségével.
- **Kötegelt fordítás**: Fordítsa le az összes fájlt egy kiválasztott mappában.

### Webes kutatás és tartalomgenerálás
- **Webes kutatás**: Keressen a Tavily vagy a DuckDuckGo segítségével, és összegezze az eredményeket.
- **Generálás címből**: Használja a jegyzet címét a kezdeti tartalom generálásához.
- **Mermaid automatikus javítás**: Automatikusan javítja a generált Mermaid diagramok szintaxisát.

## Telepítés
1. Nyissa meg az Obsidian **Beállítások** → **Közösségi bővítmények** menüpontot.
2. Győződjön meg róla, hogy a "Korlátozott mód" ki van kapcsolva.
3. Kattintson a **Tallózás** gombra, és keressen rá a "Notemd" kifejezésre.
4. Kattintson a **Telepítés**, majd az **Engedélyezés** gombra.

## Licenc
MIT Licenc - Részletekért lásd a [LICENSE](LICENSE) fájlt.

---
*Notemd v1.8.0 - Fejlessze Obsidian tudásgrafikonját AI segítségével.*
