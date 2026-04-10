
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd Plugin voor Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Lees de documentatie in andere talen: [Language Hub](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
  AI-gestuurde meertalige kennisverbetering
==================================================
```

Een eenvoudige manier om je eigen kennisbank op te bouwen!

Notemd verbetert je Obsidian-workflow door te integreren met verschillende Large Language Models (LLM's) om je meertalige aantekeningen te verwerken, automatisch wiki-links te genereren voor kernconcepten, bijbehorende concept-notities te maken, webonderzoek uit te voeren en je te helpen bij het bouwen van krachtige kennisgrafieken.

**Versie:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Inhoudsopgave
- [Snelstart](#snelstart)
- [Taalondersteuning](#taalondersteuning)
- [Kenmerken](#kenmerken)
- [Installatie](#installatie)
- [Configuratie](#configuratie)
- [Gebruikershandleiding](#gebruikershandleiding)
- [Ondersteunde LLM-providers](#ondersteunde-llm-providers)
- [Netwerkgebruik & Gegevensverwerking](#netwerkgebruik--gegevensverwerking)
- [Probleemoplossing](#probleemoplossing)
- [Bijdragen](#bijdragen)
- [Documentatie voor onderhouders](#documentatie-voor-onderhouders)
- [Licentie](#licentie)

## Snelstart

1.  **Installeren & Inschakelen**: Download de plugin via de Obsidian Community Store.
2.  **LLM configureren**: Ga naar `Instellingen -> Notemd`, selecteer je LLM-provider (zoals OpenAI of een lokale provider zoals Ollama) en voer je API-sleutel/URL in.
3.  **Zijbalk openen**: Klik op het Notemd-toverstafpictogram in de linkerribbon om de zijbalk te openen.
4.  **Notitie verwerken**: Open een aantekening en klik op **"Bestand verwerken (Links toevoegen)"** in de zijbalk om automatisch `[[wiki-links]]` toe te voegen aan kernconcepten.
5.  **Snel workflow uitvoeren**: Gebruik de standaardknop **"One-Click Extract"** om verwerking, batch-generatie en Mermaid-opschoning vanaf één punt te koppelen.

Dat is alles! Verken de instellingen om meer functies zoals webonderzoek, vertaling en contentgeneratie te ontgrendelen.

## Taalondersteuning

### Taalgedragscontract

| Aspect | Reikwijdte | Standaard | Opmerkingen |
|---|---|---|---|
| `UI Locale` | Alleen tekst van de plugin-interface | `auto` | Volgt de Obsidian-taal; huidige catalogi zijn `en`, `zh-CN`, `zh-TW`. |
| `Taakuitvoertaal` | Door LLM gegenereerde uitvoer (links, samenvattingen) | `en` | Kan globaal of per taak worden ingesteld. |
| `Automatische vertaling uitschakelen` | Niet-vertaaltaken behouden originele context | `false` | Expliciete `Vertaal`-taken dwingen nog steeds de doeltaal af. |

- Officiële documentatie wordt bijgehouden in het Engels en Vereenvoudigd Chinees, met volledige ondersteuning voor meer dan 30 talen.
- Alle ondersteunde talen zijn gekoppeld in de header hierboven.

## Belangrijkste Kenmerken

### AI-gestuurde documentverwerking
- **Multi-LLM ondersteuning**: Maak verbinding met verschillende cloud- en lokale LLM-providers.
- **Smart Chunking**: Verdeelt grote documenten automatisch in beheersbare stukken.
- **Inhoudsbehoud**: Behoudt de originele opmaak terwijl structuur en links worden toegevoegd.
- **Retry-logica**: Optionele automatische herhaling bij mislukte API-oproepen.
- **Presets voor China**: Bevat providers zoals `Qwen`, `Doubao`, `Moonshot` etc.

### Kennisgrafiek Verbetering
- **Automatische Wiki-Linking**: Identificeert en voegt wiki-links toe aan kernconcepten.
- **Aanmaak van concept-notities**: Maakt automatisch nieuwe aantekeningen voor ontdekte concepten.

### Vertaling
- **AI-gestuurde vertaling**: Vertaal de inhoud van aantekeningen met het geconfigureerde LLM.
- **Batchvertaling**: Vertaal alle bestanden in een geselecteerde map.

### Webonderzoek & Contentgeneratie
- **Webonderzoek**: Voer zoekopdrachten uit via Tavily of DuckDuckGo en vat resultaten samen.
- **Genereren vanuit titel**: Gebruik de titel van de aantekening om initiële inhoud te genereren.
- **Mermaid Auto-Fix**: Herstelt automatisch de syntaxis van gegenereerde Mermaid-diagrammen.

## Installatie
1. Ga naar **Instellingen** → **Community-plugins**.
2. Zorg dat de "Beperkte modus" is **uitgeschakeld**.
3. Klik op **Bladeren** en zoek naar "Notemd".
4. Klik op **Installeren** en daarna op **Inschakelen**.

## Licentie
MIT-licentie - Zie het bestand [LICENSE](LICENSE) voor details.

---
*Notemd v1.8.0 - Verbeter je Obsidian-kennisgrafiek met AI.*
