
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd-plugin til Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Læs dokumentation på flere sprog: [Language Hub](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      AI-drevet flersproget vidensforbedring
==================================================
```

En nem måde at oprette din egen vidensbase på!

Notemd forbedrer dit Obsidian-workflow ved at integrere med forskellige store sprogmodeller (LLM) til at behandle dine flersprogede noter, automatisk generere wiki-links til nøglekoncepter, oprette tilsvarende konceptnoter, udføre webforskning og hjælpe dig med at opbygge kraftfulde vidensgrafer.

**Version:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Indholdsfortegnelse
- [Hurtig start](#hurtig-start)
- [Sprogunderstøttelse](#sprogunderstøttelse)
- [Funktioner](#funktioner)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Brugervejledning](#brugervejledning)
- [Understøttede LLM-udbydere](#understøttede-llm-udbydere)
- [Netværksbrug & datahåndtering](#netværksbrug--datahåndtering)
- [Fejlfinding](#fejlfinding)
- [Bidrag](#bidrag)
- [Dokumentation til vedligeholdere](#dokumentation-til-vedligeholdere)
- [Licens](#licens)

## Hurtig start

1.  **Installer og aktiver**: Hent pluginet fra Obsidians community-butik.
2.  **Konfigurer LLM**: Gå til `Indstillinger -> Notemd`, vælg din LLM-udbyder (som OpenAI eller en lokal som Ollama), og indtast din API-nøgle/URL.
3.  **Åbn sidepanelet**: Klik på Notemd-tryllestavsikonet i venstre side for at åbne sidepanelet.
4.  **Behandl en note**: Åbn en note og klik på **"Behandl fil (Tilføj links)"** i sidepanelet for automatisk at tilføje `[[wiki-links]]`.
5.  **Kør hurtigt workflow**: Brug standardknappen **"One-Click Extract"** til at kæde behandling, batch-generering og Mermaid-oprydning fra ét sted.

Det er det! Udforsk indstillingerne for at låse op for flere funktioner som webforskning, oversættelse og indholdsgenerering.

## Sprogunderstøttelse

### Sprogadfærdsaftale

| Aspekt | Omfang | Standard | Noter |
|---|---|---|---|
| `UI Locale` | Kun tekst i plugin-brugerfladen | `auto` | Følger Obsidians sprog; nuværende kataloger: `en`, `zh-CN`, `zh-TW`. |
| `Opgave-outputsprog` | LLM-genereret output (links, resuméer) | `en` | Kan være globalt eller pr. opgave. |
| `Deaktiver auto-oversættelse` | Ikke-oversættelsesopgaver beholder original kontekst | `false` | Eksplicitte `Oversæt`-opgaver gennemtvinger stadig målsproget. |

- Officiel dokumentation vedligeholdes på engelsk og forenklet kinesisk, med fuld understøttelse af over 30 sprog.
- Alle understøttede sprog er linket i overskriften ovenfor.

## Hovedfunktioner

### AI-drevet dokumentbehandling
- **Multi-LLM understøttelse**: Tilslut til forskellige cloud- og lokale LLM-udbydere.
- **Smart Chunking**: Opdeler automatisk store dokumenter i håndterbare dele.
- **Bevarelse af indhold**: Bevarer original formatering, mens struktur og links tilføjes.
- **Retry-logik**: Valgfri automatisk genforsøg ved mislykkede API-kald.
- **Kina-klare forudindstillinger**: Inkluderer udbydere som `Qwen`, `Doubao`, `Moonshot` osv.

### Forbedring af vidensgraf
- **Automatisk Wiki-linking**: Identificerer og tilføjer wiki-links til kernekoncepter.
- **Oprettelse af konceptnoter**: Opretter automatisk nye noter for opdagede koncepter.

### Oversættelse
- **AI-drevet oversættelse**: Oversæt noteindhold med konfigureret LLM.
- **Batch-oversættelse**: Oversæt alle filer i en valgt mappe.

### Webforskning & indholdsgenerering
- **Webforskning**: Søg via Tavily eller DuckDuckGo og opsummer resultater.
- **Generer fra titel**: Brug notens titel til at generere indledende indhold.
- **Mermaid Auto-Fix**: Reparerer automatisk syntaks i genererede Mermaid-diagrammer.

## Installation
1. Gå til **Indstillinger** → **Community-plugins**.
2. Sørg for, at "Begrænset tilstand" er **slået fra**.
3. Klik på **Gennemse** og søg efter "Notemd".
4. Klik på **Installer** og derefter på **Aktiver**.

## Licens
MIT-licens - Se filen [LICENSE](LICENSE) for detaljer.

---
*Notemd v1.8.0 - Forbedr din Obsidian-vidensgraf med AI.*
