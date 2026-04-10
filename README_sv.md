
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd-tillägg för Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Läs dokumentationen på fler språk: [Language Hub](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      AI-driven flerspråkig kunskapsförstärkning
==================================================
```

Ett enkelt sätt att skapa din egen kunskapsbas!

Notemd förbättrar ditt Obsidian-arbetsflöde genom att integrera med olika stora språkmodeller (LLM) för att bearbeta dina flerspråkiga anteckningar, automatiskt generera wiki-länkar för nyckelbegrepp, skapa motsvarande konceptanteckningar, utföra webbforskning och hjälpa dig att bygga kraftfulla kunskapsgrafer.

**Version:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Innehållsförteckning
- [Snabbstart](#snabbstart)
- [Språkstöd](#språkstöd)
- [Funktioner](#funktioner)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Användarguide](#användarguide)
- [LLM-leverantörer som stöds](#llm-leverantörer-som-stöds)
- [Nätverksanvändning & datahantering](#nätverksanvändning--datahantering)
- [Felsökning](#felsökning)
- [Bidra](#bidra)
- [Dokumentation för underhållare](#dokumentation-för-underhållare)
- [Licens](#licens)

## Snabbstart

1.  **Installera & Aktivera**: Hämta tillägget från Obsidians community-butik.
2.  **Konfigurera LLM**: Gå till `Inställningar -> Notemd`, välj din LLM-leverantör (som OpenAI eller en lokal som Ollama) och ange din API-nyckel/URL.
3.  **Öppna sidofältet**: Klicka på Notemd-trollspöikonen i det vänstra fältet för att öppna sidofältet.
4.  **Bearbeta en anteckning**: Öppna valfri anteckning och klicka på **"Bearbeta fil (Lägg till länkar)"** i sidofältet för att automatiskt lägga till `[[wiki-links]]`.
5.  **Kör snabbarbetsflöde**: Använd standardknappen **"One-Click Extract"** för att kedja ihop bearbetning, batch-generering och Mermaid-rensning från en enda punkt.

Det är allt! Utforska inställningarna för att låsa upp fler funktioner som webbforskning, översättning och innehållsgenerering.

## Språkstöd

### Språkbeteendeavtal

| Aspekt | Omfattning | Standard | Noteringar |
|---|---|---|---|
| `UI Locale` | Endast text i tilläggets gränssnitt | `auto` | Följer Obsidians språk; nuvarande kataloger: `en`, `zh-CN`, `zh-TW`. |
| `Task Output Language` | LLM-genererad utdata (länkar, sammanfattningar) | `en` | Kan vara global eller per uppgift. |
| `Inaktivera auto-översättning` | Icke-översättningsuppgifter behåller originalspråk | `false` | Explicit `Översätt`-uppgifter tvingar fortfarande målspråket. |

- Officiell dokumentation underhålls på engelska och förenklad kinesiska, med fullt stöd för över 30 språk.
- Alla språk som stöds är länkade i rubriken ovan.

## Huvudfunktioner

### AI-driven dokumenthantering
- **Multi-LLM stöd**: Anslut till olika molnbaserade och lokala LLM-leverantörer.
- **Smart Chunking**: Delar automatiskt upp stora dokument i hanterbara delar.
- **Bevarande av innehåll**: Bevarar originalformatering samtidigt som struktur och länkar läggs till.
- **Retry-logik**: Valfri automatisk omstart vid misslyckade API-anrop.
- **Förinställningar för Kina**: Inkluderar leverantörer som `Qwen`, `Doubao`, `Moonshot` etc.

### Förbättring av kunskapsgraf
- **Automatisk Wiki-länkning**: Identifierar och lägger till wiki-länkar till kärnbegrepp.
- **Skapande av konceptanteckningar**: Skapar automatiskt nya anteckningar för upptäckta koncept.

### Översättning
- **AI-driven översättning**: Översätt anteckningsinnehåll med konfigurerad LLM.
- **Batch-översättning**: Översätt alla filer i en vald mapp.

### Webbforskning & innehållsgenerering
- **Webbforskning**: Sök via Tavily eller DuckDuckGo och sammanfatta resultat.
- **Generera från titel**: Använd anteckningens titel för att generera initialt innehåll.
- **Mermaid Auto-Fix**: Reparerar automatiskt syntax i genererade Mermaid-diagram.

## Installation
1. Gå till **Inställningar** → **Community-tillägg**.
2. Se till att "Begränsat läge" är **avstängt**.
3. Klicka på **Bläddra** och sök efter "Notemd".
4. Klicka på **Installera** och sedan på **Aktivera**.

## Licens
MIT-licens - Se filen [LICENSE](LICENSE) för detaljer.

---
*Notemd v1.8.0 - Förbättra din Obsidian-kunskapsgraf med AI.*
