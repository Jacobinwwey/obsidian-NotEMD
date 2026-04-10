
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd-liitännäinen Obsidianille

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Lue dokumentaatio muilla kielillä: [Language Hub](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      Tekoälypohjainen monikielinen tiedon
               rikastustyökalu
==================================================
```

Helppo tapa luoda oma tietokantasi!

Notemd parantaa Obsidian-työnkulkuasi integroimalla erilaisia suuria kielimalleja (LLM) monikielisten muistiinpanojesi käsittelyyn. Se luo automaattisesti wiki-linkkejä avainkäsitteille, luo vastaavia käsite-muistiinpanoja, tekee verkkohakuja ja auttaa rakentamaan voimakkaita tietograafeja.

**Versio:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Sisällysluettelo
- [Pika-aloitus](#pika-aloitus)
- [Kielituki](#kielituki)
- [Ominaisuudet](#ominaisuudet)
- [Asennus](#asennus)
- [Asetukset](#asetukset)
- [Käyttöopas](#käyttöopas)
- [Tuetut LLM-tarjoajat](#tuetut-llm-tarjoajat)
- [Verkon käyttö ja tietojen käsittely](#verkon-käyttö-ja-tietojen-käsittely)
- [Vianetsintä](#vianetsintä)
- [Osallistuminen](#osallistuminen)
- [Ylläpitäjän dokumentaatio](#ylläpitäjän-dokumentaatio)
- [Lisenssi](#lisenssi)

## Pika-aloitus

1.  **Asenna ja ota käyttöön**: Hae liitännäinen Obsidianin yhteisöliitännäisten kaupasta.
2.  **Määritä LLM**: Mene kohtaan `Asetukset -> Notemd`, valitse LLM-tarjoajasi (kuten OpenAI tai paikallinen Ollama) ja syötä API-avain/URL.
3.  **Avaa sivupalkki**: Napsauta Notemd-taikasauvakuvaketta vasemmassa palkissa avataksesi sivupalkin.
4.  **Käsittele muistiinpano**: Avaa mikä tahansa muistiinpano ja napsauta sivupalkista **"Käsittele tiedosto (Lisää linkkejä)"** lisätäksesi automaattisesti `[[wiki-links]]` avainkäsitteisiin.
5.  **Suorita pikatyönkulku**: Käytä oletuspainiketta **"One-Click Extract"** ketjuttaaksesi käsittelyn, eräajon ja Mermaid-korjauksen yhdestä paikasta.

Siinä kaikki! Tutustu asetuksiin avataksesi lisää ominaisuuksia, kuten verkkohaku, kääntäminen ja sisällön luominen.

## Kielituki

### Kielikäyttäytymissopimus

| Asia | Laajuus | Oletus | Huomautukset |
|---|---|---|---|
| `UI Locale` | Vain liitännäisen käyttöliittymän teksti | `auto` | Seuraa Obsidianin kieltä; nykyiset luettelot: `en`, `zh-CN`, `zh-TW`. |
| `Tehtävän tulostuskieli` | LLM:n luoma tuotos (linkit, tiivistelmät) | `en` | Voi olla globaali tai tehtäväkohtainen. |
| `Poista automaattinen käännös` | Muut kuin käännöstehtävät säilyttävät alkuperäisen kontekstin | `false` | Erilliset `Käännä`-tehtävät käyttävät silti kohdekieltä. |

- Virallinen dokumentaatio ylläpidetään englanniksi ja yksinkertaistetuksi kiinaksi, täysi tuki yli 30 kielelle.
- Kaikki tuetut kielet on linkitetty yllä olevassa otsikossa.

## Tärkeimmät ominaisuudet

### Tekoälypohjainen dokumenttien käsittely
- **Monen LLM:n tuki**: Yhdistä useisiin pilvi- ja paikallisiin LLM-tarjoajiin.
- **Älykäs paloittelu**: Jakaa suuret dokumentit automaattisesti hallittaviin osiin.
- **Sisällön säilyttäminen**: Pyrkii säilyttämään alkuperäisen muotoilun samalla kun lisää rakennetta ja linkkejä.
- **Uudelleenyrityslogiikka**: Valinnainen automaattinen uudelleenyritys epäonnistuneille API-puheluille.
- **Kiina-valmiit esiasetukset**: Sisältää tarjoajia kuten `Qwen`, `Doubao`, `Moonshot` jne.

### Tietograafin parantaminen
- **Automaattinen Wiki-linkitys**: Tunnistaa ja lisää wiki-linkkejä ydinkäsitteisiin.
- **Käsite-muistiinpanojen luominen**: Luo automaattisesti uusia muistiinpanoja löydetyille käsitteille.

### Kääntäminen
- **Tekoälypohjainen kääntäminen**: Käännä muistiinpanojen sisältö määritetyllä LLM:llä.
- **Eräkääntäminen**: Käännä kaikki tiedostot valitussa kansiossa.

### Verkkotutkimus ja sisällön luominen
- **Verkkotutkimus**: Tee hakuja Tavilyn tai DuckDuckGon kautta ja tiivistä tulokset.
- **Luominen otsikosta**: Käytä muistiinpanon otsikkoa alkusisällön luomiseen.
- **Mermaid-automaattikorjaus**: Korjaa automaattisesti luotujen Mermaid-kaavioiden syntaksin.

## Asennus
1. Mene kohtaan **Asetukset** → **Yhteisön liitännäiset**.
2. Varmista, että "Rajoitettu tila" on **pois päältä**.
3. Napsauta **Selaa** ja etsi "Notemd".
4. Napsauta **Asenna** ja sitten **Ota käyttöön**.

## Lisenssi
MIT-lisenssi - Katso [LICENSE](LICENSE)-tiedosto lisätietoja varten.

---
*Notemd v1.8.0 - Paranna Obsidian-tietograafiasi tekoälyllä.*
