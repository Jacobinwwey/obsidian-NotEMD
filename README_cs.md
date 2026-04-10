
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd doplněk pro Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Přečtěte si dokumentaci v jiných jazycích: [Jazykové centrum](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      AI-poháněné vícejazyčné vylepšení znalostí
==================================================
```

Snadný způsob, jak si vytvořit vlastní znalostní bázi!

Notemd vylepšuje váš pracovní postup v Obsidianu integrací s různými velkými jazykovými modely (LLM) pro zpracování vašich vícejazyčných poznámek, automatické generování wiki-odkazů pro klíčové koncepty, vytváření odpovídajících poznámek ke konceptům, provádění webového průzkumu a pomoc při budování výkonných znalostních grafů.

**Verze:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

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
- [Příspěvky](#příspěvky)
- [Dokumentace pro údržbáře](#dokumentace-pro-údržbáře)
- [Licence](#licence)

## Rychlý start

1.  **Instalace a aktivace**: Získejte doplněk z obchodu komunitních doplňků Obsidian.
2.  **Konfigurace LLM**: Přejděte do `Nastavení -> Notemd`, vyberte poskytovatele LLM (např. OpenAI nebo místní Ollama) a zadejte svůj API klíč/URL.
3.  **Otevření postranního panelu**: Kliknutím na ikonu kouzelné hůlky Notemd v levém panelu otevřete postranní panel.
4.  **Zpracování poznámky**: Otevřete libovolnou poznámku a v postranním panelu klikněte na **"Zpracovat soubor (přidat odkazy)"** pro automatické přidání `[[wiki-links]]` ke klíčovým konceptům.
5.  **Spuštění rychlého workflow**: Použijte výchozí tlačítko **"One-Click Extract"** pro řetězení zpracování, dávkového generování a opravy Mermaid z jednoho místa.

To je vše! Prozkoumejte nastavení a odemkněte další funkce, jako je webový průzkum, překlad a generování obsahu.

## Jazyková podpora

### Smlouva o jazykovém chování

| Aspekt | Rozsah | Výchozí | Poznámky |
|---|---|---|---|
| `UI Locale` | Pouze text rozhraní doplňku | `auto` | Řídí se jazykem Obsidianu; aktuální katalogy jsou `en`, `zh-CN`, `zh-TW`. |
| `Výstupní jazyk úkolů` | Výstupy generované LLM (odkazy, shrnutí) | `en` | Může být globální nebo pro jednotlivé úkoly. |
| `Zakázat automatický překlad` | Nepřekladové úkoly zachovávají původní kontext | `false` | Explicitní úkoly `Přeložit` stále vynucují cílový jazyk. |

- Oficiální dokumentace je udržována v angličtině a zjednodušené čínštině s plnou podporou pro více než 30 jazyků.
- Všechny podporované jazyky jsou propojeny v záhlaví výše.

## Hlavní funkce

### AI-poháněné zpracování dokumentů
- **Podpora Multi-LLM**: Připojení k různým cloudovým i lokálním poskytovatelům LLM.
- **Chytré dělení**: Automaticky rozděluje velké dokumenty na zvládnutelné části.
- **Zachování obsahu**: Cílem je zachovat původní formátování při přidávání struktury a odkazů.
- **Logika opakování**: Volitelný automatický restart při selhání volání API.
- **Předvolby pro Čínu**: Zahrnuje poskytovatele jako `Qwen`, `Doubao`, `Moonshot` atd.

### Vylepšení znalostního grafu
- **Automatické Wiki-propojování**: Identifikuje a přidává wiki-odkazy k hlavním konceptům.
- **Vytváření poznámek ke konceptům**: Automaticky vytváří nové poznámky pro objevené koncepty.

### Překlad
- **AI překlad**: Překládejte obsah poznámek pomocí nakonfigurovaného LLM.
- **Dávkový překlad**: Přeložte všechny soubory ve vybrané složce.

### Webový průzkum a generování obsahu
- **Webový průzkum**: Vyhledávejte přes Tavily nebo DuckDuckGo a shrnujte výsledky.
- **Generování z názvu**: Použijte název poznámky k vygenerování počátečního obsahu.
- **Mermaid Auto-Fix**: Automaticky opravuje syntaxi generovaných diagramů Mermaid.

## Instalace
1. Přejděte do **Nastavení** → **Komunitní doplňky**.
2. Ujistěte se, že je vypnutý "Omezený režim".
3. Klikněte na **Procházet** a vyhledejte "Notemd".
4. Klikněte na **Instalovat** a poté na **Aktivovat**.

## Licence
Licence MIT - podrobnosti naleznete v souboru [LICENSE](LICENSE).

---
*Notemd v1.8.0 - Vylepšete svůj znalostní graf v Obsidianu pomocí AI.*
