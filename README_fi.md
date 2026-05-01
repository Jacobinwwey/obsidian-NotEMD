![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Notemd-liitännäinen Obsidianille

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Lue dokumentaatio muilla kielillä: [Kielikeskus](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Tekoälypohjainen monikielinen tiedon rikastaminen
==================================================
```

Helppo tapa rakentaa oma tietopohjasi.

Notemd parantaa Obsidian-työnkulkuasi integroimalla erilaisia suuria kielimalleja (LLM) monikielisten muistiinpanojesi käsittelyyn, luomalla automaattisesti wiki-linkkejä keskeisille käsitteille, luomalla niitä vastaavia käsite-muistiinpanoja, tekemällä verkkotutkimusta ja auttamalla sinua rakentamaan tehokkaita tietograafeja ja paljon muuta.

**Versio:** 1.8.1

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

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
- [Ylläpitäjien dokumentaatio](#ylläpitäjien-dokumentaatio)
- [Lisenssi](#lisenssi)

## Pika-aloitus

1. **Asenna ja ota käyttöön**: Hae liitännäinen Obsidian Marketplacesta.
2. **Määritä LLM**: Siirry kohtaan `Settings -> Notemd`, valitse haluamasi LLM-tarjoaja, esimerkiksi OpenAI tai paikallinen tarjoaja kuten Ollama, ja syötä API-avain/URL.
3. **Avaa sivupalkki**: Avaa sivupalkki napsauttamalla Notemdin taikasauvakuvaketta vasemmassa reunapalkissa.
4. **Käsittele muistiinpano**: Avaa mikä tahansa muistiinpano ja napsauta sivupalkissa **"Process File (Add Links)"**, niin liitännäinen lisää automaattisesti `[[wiki-links]]`-linkit keskeisiin käsitteisiin.
5. **Suorita nopea työnkulku**: Käytä oletuspainiketta **"One-Click Extract"** ketjuttamaan käsittely, erägenerointi ja Mermaid-siistiminen yhdestä sisäänkäynnistä.

Siinä kaikki. Tutki asetuksia avataksesi lisää ominaisuuksia, kuten verkkotutkimuksen, kääntämisen ja sisällön luonnin.

## Kielituki

### Kielikäyttäytymisen sopimus

| Asia | Laajuus | Oletus | Huomautukset |
|---|---|---|---|
| `Käyttöliittymän kieli` | Vain liitännäisen käyttöliittymätekstit (asetukset, sivupalkki, ilmoitukset, dialogit) | `auto` | Seuraa Obsidianin kieliasetusta; tämänhetkiset UI-käännöskatalogit ovat `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN` ja `zh-TW`. |
| `Tehtävien tulostuskieli` | LLM:n generoima tehtäväulostulo (linkit, yhteenvedot, generointi, poiminta, käännöskohde) | `en` | Voi olla globaali tai tehtäväkohtainen, kun `Käytä eri kieliä tehtäville` on käytössä. |
| `Poista automaattinen käännös käytöstä` | Muut kuin `Translate`-tehtävät säilyttävät lähdekielen kontekstin | `false` | Erilliset `Translate`-tehtävät pakottavat edelleen määritetyn kohdekielen. |
| Varakieli | Puuttuvien UI-avainten ratkaisu | locale -> `en` | Pitää käyttöliittymän vakaana, vaikka osa avaimista olisi vielä kääntämättä. |

- Ylläpidetyt lähdedokumentit ovat englanti ja yksinkertaistettu kiina, ja julkaistut README-käännökset on linkitetty yllä olevaan otsakkeeseen.
- Sovelluksen UI-locale-kattavuus vastaa tällä hetkellä täsmälleen koodin eksplisiittistä katalogia: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- Englannin fallback säilyy toteutuksen turvaverkkona, mutta tuetut näkyvät käyttöliittymäpinnat on katettu regressiotesteillä eikä niiden pitäisi normaalissa käytössä hiljaisesti pudota englantiin.
- Lisätiedot ja osallistumisohjeet löytyvät [Language Hubista](./docs/i18n/README.md).

## Ominaisuudet

### Tekoälypohjainen dokumenttien käsittely
- **Usean LLM:n tuki**: Yhdistä erilaisiin pilvi- ja paikallisiin LLM-tarjoajiin. Katso [Tuetut LLM-tarjoajat](#tuetut-llm-tarjoajat).
- **Älykäs paloittelu**: Jakaa suuret dokumentit automaattisesti hallittaviin osiin sanamäärän perusteella.
- **Sisällön säilyttäminen**: Pyrkii säilyttämään alkuperäisen muotoilun samalla kun rakennetta ja linkkejä lisätään.
- **Edistymisen seuranta**: Reaaliaikaiset päivitykset Notemd Sidebarin tai edistymismodaalin kautta.
- **Peruttavat toiminnot**: Minkä tahansa sivupalkista käynnistetyn käsittelytehtävän, yksittäisen tai eräajon, voi perua omalla peruutuspainikkeellaan. Komentopaletista käynnistetyt toiminnot käyttävät modalia, joka on myös peruttavissa.
- **Monimallimääritys**: Käytä eri LLM-tarjoajia ja tiettyjä malleja eri tehtäville, kuten Add Links, Research, Generate Title ja Translate, tai käytä yhtä tarjoajaa kaikkiin tehtäviin.
- **Vakaat API-kutsut (uudelleenyrityslogiikka)**: Voit valinnaisesti ottaa käyttöön automaattiset uudelleenyritykset epäonnistuneille LLM API -kutsuille sekä määritettävän aikavälin ja yritysrajan.
- **Sietokykyisemmät tarjoajayhteystestit**: Jos ensimmäinen tarjoajatesti osuu tilapäiseen verkkokatkokseen, Notemd siirtyy nyt vakaaseen uudelleenyrityssekvenssiin ennen kuin testi merkitään epäonnistuneeksi. Tämä kattaa OpenAI-compatible-, Anthropic-, Google-, Azure OpenAI- ja Ollama-yhteydet.
- **Ajonaikaisen ympäristön siirtotavan fallback**: Kun pitkäkestoinen tarjoajapyyntö katkeaa `requestUrl`-kutsussa tilapäiseen verkkovirheeseen, kuten `ERR_CONNECTION_CLOSED`, Notemd yrittää nyt saman yrityksen uudelleen ympäristökohtaisen fallback-siirtotavan kautta ennen määritettyä uudelleenyrityssilmukkaa. Työpöytäversiot käyttävät Node `http/https` -pinoa, kun taas ei-työpöytäympäristöt käyttävät selaimen `fetch`-kutsua. Tämä vähentää vääriä epäonnistumisia hitaiden gateway-palveluiden ja reverse proxyjen kanssa.
- **OpenAI-compatible-pitkien pyyntöjen vakausketjun kovennus**: Vakaassa tilassa OpenAI-compatible-kutsut käyttävät nyt eksplisiittistä kolmivaiheista järjestystä jokaisessa yrityksessä: suora streaming-siirtotapa, sitten suora non-stream-siirtotapa, ja lopuksi `requestUrl`-fallback, joka voi silti tarvittaessa päivittää jäsennyksen streamaavaksi. Tämä vähentää vääriä negatiivisia tuloksia tilanteissa, joissa tarjoaja palauttaa puskuroidun vastauksen oikein mutta streaming-putki on epävakaa.
- **Protokollatietoinen streaming-fallback eri LLM-API-polkujen välillä**: Pitkäkestoisten fallback-yritysten parsing päivittyy nyt protokollatietoisesti streamaavaksi kaikissa sisäänrakennetuissa LLM-poluissa, ei vain OpenAI-compatible-päätepisteissä. Notemd käsittelee nyt OpenAI/Azure-tyylisen SSE:n, Anthropic Messages -streamauksen, Google Gemini SSE -vastaukset ja Ollama NDJSON -streamit sekä työpöydän `http/https`- että ei-työpöytäympäristön `fetch`-poluissa, ja jäljellä olevat suorat OpenAI-tyyliset tarjoajapolut käyttävät samaa yhteistä fallback-polkua.
- **Kiina-valmiit tarjoajaesiasetukset**: Sisäänrakennetut esiasetukset kattavat nyt `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` ja `SiliconFlow` nykyisten globaalien ja paikallisten tarjoajien lisäksi.
- **Luotettava eräkäsittely**: Samanaikaisen käsittelyn logiikkaa on parannettu **staggered API calls** -mallilla, jotta rate limiting -virheitä vältetään ja suurten eräajojen suorituskyky pysyy vakaana. Tehtävät käynnistyvät nyt eri aikavälein eivätkä kaikki kerralla.
- **Tarkka edistymisraportointi**: Virhe, joka saattoi jättää edistymispalkin jumiin, on korjattu, joten käyttöliittymä vastaa aina toiminnon todellista tilaa.
- **Vankka rinnakkainen eräkäsittely**: Ongelma, jossa rinnakkaiset erätoiminnot pysähtyivät ennenaikaisesti, on ratkaistu, jotta kaikki tiedostot käsitellään luotettavasti ja tehokkaasti.
- **Edistymispalkin tarkkuus**: Virhe, jossa "Create Wiki-Link & Generate Note" -komennon edistymispalkki jäi 95 prosenttiin, on korjattu, joten se näyttää nyt oikein 100 % valmistuessa.
- **Parannettu API-vianmääritys**: "API Error Debugging Mode" tallentaa nyt täydet vastausrungot LLM-tarjoajilta ja hakupalveluilta, kuten Tavilyltä ja DuckDuckGolta, sekä lokittaa yrityskohtaisen siirtotapa-aikajanan, jossa näkyvät anonymisoidut pyyntö-URL:t, kesto, vastausotsikot, osittaiset vastausrungot, jäsennetyt osittaiset stream-sisällöt ja stack tracit. Tämä helpottaa vianetsintää OpenAI-compatible-, Anthropic-, Google-, Azure OpenAI- ja Ollama-fallbackeissa.
- **Kehittäjätilan paneeli**: Asetuksiin kuuluu nyt oma diagnostiikkapaneeli kehittäjille. Paneeli on piilotettu, ellei "Developer mode" ole käytössä. Se tukee diagnostiikkakutsupolkujen valintaa ja toistuvia vakaustestejä valitulle tilalle.
- **Uudistettu sivupalkki**: Sisäänrakennetut toiminnot on ryhmitelty selkeämmiksi osioiksi, joissa on ymmärrettävämmät otsikot, live-tila, peruttava edistyminen ja kopioitavat lokit sivupalkin sotkun vähentämiseksi. Edistymis- ja lokialatunniste pysyy nyt näkyvissä, vaikka kaikki osiot olisi avattu, ja valmis-tila käyttää selkeämpää valmiusraitaa.
- **Sivupalkin vuorovaikutuksen ja luettavuuden viimeistely**: Sivupalkin painikkeet tarjoavat nyt selkeämmän hover-, painallus- ja fokuspalautteen, ja värikkäissä CTA-painikkeissa, mukaan lukien `One-Click Extract` ja `Batch generate from titles`, käytetään vahvempaa tekstikontrastia paremman luettavuuden takaamiseksi eri teemoissa.
- **CTA-tyylitys vain yksittäisille tiedostoille**: Värikäs CTA-tyylitys on nyt varattu yksittäisiä tiedostoja koskeville toiminnoille. Erä- tai kansiotason toiminnot ja yhdistetyt työnkulut käyttävät ei-CTA-tyylitystä, jotta toimintojen laajuuteen liittyvät virhenapsautukset vähenevät.
- **Mukautetut yhden napsautuksen työnkulut**: Muuta sivupalkin sisäänrakennetut työkalut uudelleenkäytettäviksi mukautetuiksi painikkeiksi, joilla on käyttäjän määrittämät nimet ja toimintaketjut. Oletustyönkulku `One-Click Extract` sisältyy valmiiksi.

### Tietograafin parantaminen
- **Automaattinen wiki-linkitys**: Tunnistaa ydinkäsitteet ja lisää `[[wiki-links]]`-linkit käsiteltyihin muistiinpanoihin LLM:n ulostulon perusteella.
- **Käsite-muistiinpanojen luonti (valinnainen ja muokattava)**: Luo automaattisesti uusia muistiinpanoja löydetyille käsitteille vaultissasi määritettyyn kansioon.
- **Muokattavat tulostepolut**: Määritä vaultiin erilliset suhteelliset polut käsitellyille tiedostoille ja uusille käsite-muistiinpanoille.
- **Muokattavat tulostetiedoston nimet (Add Links)**: Voit halutessasi **ylikirjoittaa alkuperäisen tiedoston** tai käyttää mukautettua pääte- tai korvausmerkkijonoa oletuksen `_processed.md` sijaan, kun tiedostoihin lisätään linkkejä.
- **Linkkien eheyden ylläpito**: Perustason käsittely linkkien päivittämiselle, kun muistiinpanoja nimetään uudelleen tai poistetaan vaultista.
- **Puhdas käsitepoiminta**: Poimi käsitteitä ja luo niitä vastaavat käsite-muistiinpanot muuttamatta alkuperäistä dokumenttia. Tämä sopii hyvin tietopohjan rakentamiseen olemassa olevista dokumenteista ilman, että niitä muokataan. Ominaisuudessa on määritettävät vaihtoehdot minimaalisille käsite-muistiinpanoille ja takaisinviittauksille.

### Kääntäminen

- **Tekoälypohjainen kääntäminen**:
  - Käännä muistiinpanojen sisältö määritetyllä LLM:llä.
  - **Tuki suurille tiedostoille**: Suuret tiedostot jaetaan automaattisesti pienempiin osiin `Chunk word count` -asetuksen perusteella ennen kuin ne lähetetään LLM:lle. Käännetyt osat yhdistetään tämän jälkeen saumattomasti takaisin yhdeksi dokumentiksi.
  - Tukee kääntämistä useiden kielten välillä.
  - Kohdekieli on mukautettavissa asetuksissa tai käyttöliittymässä.
  - Avaa käännetyn tekstin automaattisesti alkuperäisen tekstin oikealle puolelle helppoa vertailua varten.
- **Eräkäännös**:
  - Käännä kaikki valitun kansion tiedostot.
  - Tukee rinnakkaista käsittelyä, kun "Enable Batch Parallelism" on käytössä.
  - Käyttää kääntämiseen mukautettuja promptteja, jos ne on määritetty.
  - Lisää tiedostoselaimen kontekstivalikkoon vaihtoehdon "Batch translate this folder".
- **Poista automaattinen käännös käytöstä**: Kun tämä vaihtoehto on käytössä, muut kuin Translate-tehtävät eivät enää pakota ulostuloa tietylle kielelle, vaan säilyttävät lähdekielen kontekstin. Nimenomainen "Translate"-tehtävä suorittaa silti käännöksen määritetyllä tavalla.

### Verkkotutkimus ja sisällön luonti
- **Verkkotutkimus ja yhteenveto**:
  - Suorita verkkohakuja Tavilyllä, joka vaatii API-avaimen, tai DuckDuckGolla, joka on kokeellinen.
  - **Parannettu hakujen robustius**: DuckDuckGo-haku käyttää nyt parannettua jäsennyslogiikkaa, `DOMParser` plus regex-fallback, jotta layout-muutokset voidaan kestää ja tulokset pysyvät luotettavina.
  - Tee hakutuloksista yhteenveto määritetyllä LLM:llä.
  - Yhteenvedon tulostuskieli on mukautettavissa asetuksissa.
  - Lisää yhteenvedot nykyiseen muistiinpanoon.
  - Tutkimussisällölle, joka lähetetään LLM:lle, on määritettävä token-raja.
- **Sisällön luonti otsikosta**:
  - Käytä muistiinpanon otsikkoa lähtötietona alkuperäisen sisällön generoimiseen LLM:llä, jolloin mahdollinen olemassa oleva sisältö korvataan.
  - **Valinnainen tutkimus**: Määritä, tehdäänkö verkkotutkimus, käyttäen valittua palveluntarjoajaa, jotta generoinnille saadaan taustakontekstia.
- **Eräluonti otsikoista**: Luo sisältö kaikille valitun kansion muistiinpanoille niiden otsikoiden perusteella. Toiminto noudattaa valinnaista tutkimusasetusta. Onnistuneesti käsitellyt tiedostot siirretään **määritettävään "complete"-alikansioon**, kuten `[foldername]_complete` tai muuhun nimeen, jotta niitä ei käsitellä uudelleen.
- **Mermaid auto-fix -kytkentä**: Kun Mermaid auto-fix on käytössä, Mermaidiin liittyvät työnkulut korjaavat nyt automaattisesti generoidut tiedostot tai tulostekansiot käsittelyn jälkeen. Tämä kattaa Process-, Generate from Title-, Batch Generate from Titles-, Research & Summarize-, Summarise as Mermaid- ja Translate-virrat.

### Apuominaisuudet
- **Yhteenveto Mermaid-kaavioksi**:
  - Tämä ominaisuus mahdollistaa muistiinpanon sisällön tiivistämisen Mermaid-kaavioksi.
  - Mermaid-kaavion tulostuskieli voidaan määrittää asetuksissa.
  - **Mermaid Output Folder**: Määritä kansio, johon luodut Mermaid-kaaviotiedostot tallennetaan.
  - **Translate Summarize to Mermaid Output**: Käännä halutessasi generoitu Mermaid-kaavion sisältö määritettyyn kohdekieleen.

<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Yksinkertainen kaavaformaatin korjaus**:
  - Korjaa nopeasti yhden rivin matemaattiset kaavat, jotka on rajattu yksittäisillä `$`-merkeillä, tavallisiksi `$$`-lohkoiksi.
  - **Yksittäinen tiedosto**: Käsittele nykyinen tiedosto sivupalkin painikkeella tai komentopaletista.
  - **Eräkorjaus**: Käsittele kaikki valitun kansion tiedostot sivupalkin painikkeella tai komentopaletista.

- **Tarkista duplikaatit nykyisestä tiedostosta**: Tämä komento auttaa havaitsemaan aktiivisen tiedoston mahdolliset duplikaattitermit.
- **Duplikaattien tunnistus**: Perustason tarkistus käsitellyn tiedoston sisällön duplikaattisanoille; tulokset kirjataan konsoliin.
- **Tarkista ja poista duplikaattikäsite-muistiinpanot**: Tunnistaa mahdolliset duplikaattimuistiinpanot määritetystä **Concept Note Folder** -kansiosta täsmällisten nimiosumien, monikkomuotojen, normalisoinnin ja yksittäisen sanan sisältämisen perusteella verrattuna kansion ulkopuolisiin muistiinpanoihin. Vertailun laajuus voidaan määrittää koskemaan **koko vaultia**, **vain tiettyjä sisällytettäviä kansioita** tai **kaikkia kansioita tiettyjä poikkeuksia lukuun ottamatta**. Näyttää yksityiskohtaisen listan syistä ja ristiriitaisista tiedostoista, ja pyytää vahvistuksen ennen kuin löydetyt duplikaatit siirretään järjestelmän roskakoriin. Näyttää etenemisen poistamisen aikana.
- **Erä Mermaid -korjaus**: Soveltaa Mermaid- ja LaTeX-syntaksikorjauksia kaikkiin käyttäjän valitseman kansion Markdown-tiedostoihin.
  - **Työnkulkuvalmis**: Voidaan käyttää joko erillisenä työkaluna tai osana mukautettua yhden napsautuksen työnkulkupainiketta.
  - **Virheraportointi**: Luo `mermaid_error_{foldername}.md`-raportin, jossa luetellaan tiedostot, jotka sisältävät edelleen mahdollisia Mermaid-virheitä käsittelyn jälkeen.
  - **Siirrä virhetiedostot**: Siirtää haluttaessa havaitut virheelliset tiedostot määritettyyn kansioon manuaalista tarkastelua varten.
  - **Älykäs tunnistus**: Tarkistaa nyt tiedostot älykkäästi syntaksivirheiden varalta `mermaid.parse`-kutsulla ennen korjausyritystä, mikä säästää käsittelyaikaa ja välttää turhat muokkaukset.
  - **Turvallinen käsittely**: Varmistaa, että syntaksikorjaukset kohdistuvat vain Mermaid-koodilohkoihin, jotta Markdown-taulukot tai muu sisältö eivät muutu vahingossa. Mukana on vahvat suojaukset taulukkosyntaksille, kuten `| :--- |`, aggressiivisia debug-korjauksia vastaan.
  - **Deep Debug Mode**: Jos virheitä jää ensimmäisen korjauksen jälkeen, käynnistyy edistynyt deep debug -tila. Tämä tila käsittelee monimutkaisia edge caseja, mukaan lukien:
    - **Comment Integration**: Yhdistää automaattisesti perässä tulevat kommentit, jotka alkavat merkillä `%`, reunalabeliin, esimerkiksi `A -- Label --> B; % Comment` muuttuu muotoon `A -- "Label(Comment)" --> B;`.
    - **Malformed Arrows**: Korjaa nuolet, jotka ovat joutuneet lainausmerkkien sisään, esimerkiksi `A -- "Label -->" B` muuttuu muotoon `A -- "Label" --> B`.
    - **Inline Subgraphs**: Muuntaa inline-subgraph-labelit edge label -merkinnöiksi.
    - **Reverse Arrow Fix**: Korjaa epästandardit `X <-- Y` -nuolet muotoon `Y --> X`.
    - **Direction Keyword Fix**: Varmistaa, että avainsana `direction` kirjoitetaan pienaakkosin subgraphien sisällä, esimerkiksi `Direction TB` -> `direction TB`.
    - **Comment Conversion**: Muuntaa `//`-kommentit edge label -merkinnöiksi, esimerkiksi `A --> B; // Comment` -> `A -- "Comment" --> B;`.
    - **Duplicate Label Fix**: Yksinkertaistaa toistetut hakasulkuetiketit, esimerkiksi `Node["Label"]["Label"]` -> `Node["Label"]`.
    - **Invalid Arrow Fix**: Muuntaa virheellisen nuolisyntaksin `--|>` tavalliseksi `-->`.
    - **Robust Label & Note Handling**: Parantaa erikoismerkkejä, kuten `/`, sisältävien etikettien käsittelyä sekä tukee paremmin mukautettua note-syntaksia, kuten `note for ...`, samalla kun artefaktit, kuten loppuun jäävät `]`, poistetaan siististi.
    - **Advanced Fix Mode**: Sisältää vankkoja korjauksia lainaamattomille node-etiketeille, joissa on välilyöntejä, erikoismerkkejä tai sisäkkäisiä hakasulkeita, esimerkiksi `Node[Label [Text]]` -> `Node["Label [Text]"]`, jotta monimutkaiset kaaviot, kuten Stellar Evolution -polut, toimivat oikein. Se korjaa myös virheelliset edge labelit, esimerkiksi `--["Label["-->` muotoon `-- "Label" -->`. Lisäksi inline-kommentit, kuten `Consensus --> Adaptive; # Some advanced consensus`, muunnetaan muotoon `Consensus -- "Some advanced consensus" --> Adaptive`, ja rivin loppuun jääneet keskeneräiset lainausmerkit korjataan vaihtamalla `;"` lopussa muotoon `"]`.
    - **Note Conversion**: Muuntaa automaattisesti `note right/left of`- ja irralliset `note :`-kommentit tavallisiksi Mermaid-solmumäärittelyiksi ja yhteyksiksi, esimerkiksi `note right of A: text` muuttuu muotoon `NoteA["Note: text"]`, joka linkitetään solmuun `A`. Tämä estää syntaksivirheitä ja parantaa asettelua. Tukee nyt sekä nuolilinkkejä (`-->`) että kiinteitä linkkejä (`---`).
    - **Extended Note Support**: Muuntaa automaattisesti `note for Node "Content"`- ja `note of Node "Content"` -syntaksit tavallisiksi linkitetyiksi note-solmuiksi, esimerkiksi `NoteNode[" Content"]` yhdistettynä solmuun `Node`, jotta käyttäjän laajentama syntaksi toimii.
    - **Enhanced Note Correction**: Nimeää automaattisesti note-solmut juoksevalla numeroinnilla, kuten `Note1`, `Note2`, alias-ongelmien välttämiseksi, kun note-merkintöjä on useita.
    - **Parallelogram/Shape Fix**: Korjaa virheelliset solmumuodot, kuten `[/["Label["/]`, tavalliseen muotoon `["Label"]`, jotta generoitu sisältö pysyy yhteensopivana.
    - **Standardize Pipe Labels**: Korjaa ja standardoi automaattisesti pipe-merkkejä sisältävät edge labelit, jotta ne lainausmerkitään oikein, esimerkiksi `-->|Text|` muuttuu muotoon `-->|"Text"|` ja `-->|Math|^2|` muotoon `-->|"Math|^2"|`.
    - **Misplaced Pipe Fix**: Korjaa väärin sijoitetut edge labelit, jotka esiintyvät ennen nuolta, esimerkiksi `>|"Label"| A --> B` muuttuu muotoon `A -->|"Label"| B`.
    - **Merge Double Labels**: Tunnistaa ja yhdistää monimutkaiset kaksinkertaiset labelit yhdellä reunalla, esimerkiksi `A -- Label1 -- Label2 --> B` tai `A -- Label1 -- Label2 --- B`, yhdeksi selkeäksi labeliksi rivinvaihdoilla: `A -- "Label1<br>Label2" --> B`.
    - **Unquoted Label Fix**: Lisää automaattisesti lainausmerkit node-etiketteihin, jotka sisältävät mahdollisesti ongelmallisia merkkejä, kuten lainausmerkkejä, yhtäsuuruusmerkkejä tai matemaattisia operaattoreita, mutta joilta puuttuvat ulommat lainausmerkit, esimerkiksi `Plot[Plot "A"]` muuttuu muotoon `Plot["Plot "A""]`, jotta renderöintivirheitä vältetään.
    - **Intermediate Node Fix**: Jakaa reunat, jotka sisältävät väliin määritellyn solmun, kahdeksi erilliseksi reunaksi, esimerkiksi `A -- B[...] --> C` muuttuu muotoihin `A --> B[...]` ja `B[...] --> C`, mikä tuottaa kelvollisen Mermaid-syntaksin.
    - **Concatenated Label Fix**: Korjaa vankasti solmumäärittelyt, joissa ID on yhdistynyt etikettiin, esimerkiksi `SubdivideSubdivide...` muuttuu muotoon `Subdivide["Subdivide..."]`, vaikka sitä edeltäisi pipe-labeleita tai duplikaatio ei olisi täsmälleen sama, validoimalla tunnettuja node-ID:tä vasten.
- **Poimi tarkka alkuperäinen teksti**:
  - Määritä kysymyslista asetuksissa.
  - Poimii aktiivisesta muistiinpanosta sanantarkat tekstiosat, jotka vastaavat näihin kysymyksiin.
  - **Merged Query Mode**: Valinnainen tila, jossa kaikki kysymykset käsitellään yhdellä API-kutsulla tehokkuuden parantamiseksi.
  - **Translation**: Mahdollisuus sisällyttää poimitun tekstin käännökset ulostuloon.
  - **Custom Output**: Määritettävä tallennuspolku ja tiedostonimen pääte poimitulle tekstitiedostolle.
- **LLM-yhteystesti**: Vahvista aktiivisen tarjoajan API-asetukset.

## Asennus

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Obsidian Marketplacesta (suositeltu)
1. Avaa Obsidianin **Settings** -> **Community plugins**.
2. Varmista, että "Restricted mode" on **pois päältä**.
3. Napsauta **Browse** community plugins ja etsi "Notemd".
4. Napsauta **Install**.
5. Kun asennus on valmis, napsauta **Enable**.

### Manuaalinen asennus
1. Lataa uusimman julkaisun tiedostot [GitHub Releases -sivulta](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Jokainen julkaisu sisältää myös pakatun `README.md`-tiedoston viitteeksi, mutta manuaaliseen asennukseen tarvitaan vain `main.js`, `styles.css` ja `manifest.json`.
2. Siirry Obsidian-vaultisi määrityskansioon: `<YourVault>/.obsidian/plugins/`.
3. Luo uusi kansio nimeltä `notemd`.
4. Kopioi `main.js`, `styles.css` ja `manifest.json` kansioon `notemd`.
5. Käynnistä Obsidian uudelleen.
6. Siirry kohtaan **Settings** -> **Community plugins** ja ota "Notemd" käyttöön.

## Asetukset

Pääset liitännäisen asetuksiin näin:
**Settings** -> **Community Plugins** -> **Notemd** (napsauta rataskuvaketta).

### LLM-tarjoajan määritykset
1. **Aktiivinen tarjoaja**: Valitse pudotusvalikosta LLM-tarjoaja, jota haluat käyttää.
2. **Tarjoajan asetukset**: Määritä valitun tarjoajan asetukset:
   - **API Key**: Vaaditaan useimmille pilvipalveluntarjoajille, kuten OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks ja Requesty. Ei tarvita Ollamalle. Valinnainen LM Studiolle ja yleiselle `OpenAI Compatible` -esiasetukselle, kun päätepiste hyväksyy anonyymin tai placeholder-pohjaisen pääsyn.
   - **Base URL / Endpoint**: Palvelun API-päätepiste. Oletusarvot sisältyvät, mutta saatat joutua vaihtamaan tämän paikallisille malleille, kuten LMStudio ja Ollama, gateway-palveluille, kuten OpenRouter, Requesty ja OpenAI Compatible, tai tietyille Azure-julkaisuille. **Pakollinen Azure OpenAI:lle.**
   - **Model**: Käytettävän mallin nimi tai ID, esimerkiksi `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5` tai `anthropic/claude-3-7-sonnet-latest`. Varmista, että malli on saatavilla tarjoajallasi tai päätepisteessäsi.
   - **Temperature**: Säätelee LLM:n ulostulon satunnaisuutta, 0 = deterministinen, 1 = maksimaalinen luovuus. Alemmat arvot, kuten 0.2-0.5, ovat yleensä parempia rakenteisiin tehtäviin.
   - **API Version (vain Azure)**: Vaaditaan Azure OpenAI -julkaisuille, esimerkiksi `2024-02-15-preview`.
3. **Testaa yhteys**: Käytä aktiivisen tarjoajan "Testaa yhteys" -painiketta asetusten tarkistamiseen. OpenAI-compatible-tarjoajat käyttävät nyt tarjoajatietoisia tarkistuksia: päätepisteet kuten `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` ja `OpenAI Compatible` testaavat `chat/completions`-polun suoraan, kun taas tarjoajat, joilla on luotettava `/models`-päätepiste, voivat edelleen aloittaa mallilistauksella. Jos ensimmäinen testi epäonnistuu tilapäisen verkkokatkoksen, kuten `ERR_CONNECTION_CLOSED`, vuoksi, Notemd siirtyy automaattisesti vakaaseen uudelleenyrityssekvenssiin välittömän epäonnistumisen sijaan.
4. **Hallitse tarjoajamäärityksiä**: Käytä "Export Providers" ja "Import Providers" -painikkeita tallentaaksesi tai ladataksesi LLM-tarjoajien asetukset `notemd-providers.json`-tiedostoon liitännäisen määrityskansiossa. Tämä helpottaa varmuuskopiointia ja jakamista.
5. **Esiasetusten kattavuus**: Alkuperäisten tarjoajien lisäksi Notemd sisältää nyt esiasetetut merkinnät kohteille `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` ja yleisen `OpenAI Compatible` -kohteen LiteLLM:lle, vLLM:lle, Perplexitylle, Vercel AI Gatewaylle tai mukautetuille välityspalvelimille.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Monimallimääritys
- **Käytä eri palveluntarjoajia eri tehtäville**:
  - **Pois käytöstä (oletus)**: Käyttää yhtä "aktiivinen tarjoaja" -asetusta kaikkiin tehtäviin.
  - **Käytössä**: Mahdollistaa tietyn tarjoajan valinnan ja mallinimen valinnaisen yliajon jokaiselle tehtävälle, kuten "Add Links", "Research & Summarize", "Generate from Title", "Translate" ja "Extract Concepts". Jos tehtävän model override -kenttä jätetään tyhjäksi, käytetään kyseiselle tehtävälle valitun tarjoajan oletusmallia.
- **Valitse eri kieliä eri tehtäville**:
  - **Pois käytöstä (oletus)**: Käyttää samaa tulostuskieltä kaikille tehtäville.
  - **Käytössä**: Mahdollistaa tietyn kielen valinnan jokaiselle tehtävälle, kuten "Add Links", "Research & Summarize", "Generate from Title", "Summarise as Mermaid diagram" ja "Extract Concepts".

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Kieliarkkitehtuuri (käyttöliittymän kieli ja tehtävien tulostuskieli)

- **Käyttöliittymän kieli** ohjaa vain liitännäisen käyttöliittymätekstejä, kuten asetusten nimikkeitä, sivupalkin painikkeita, ilmoituksia ja dialogeja. Oletusarvoinen `auto`-tila seuraa Obsidianin nykyistä käyttöliittymäkieltä.
- Alueelliset ja kirjoitusjärjestelmään liittyvät variantit ratkaistaan nyt lähimpään julkaistuun kielikatalogiin sen sijaan, että ne putoaisivat suoraan englantiin. Esimerkiksi `fr-CA` käyttää ranskaa, `es-419` espanjaa, `pt-PT` portugalia, `zh-Hans` yksinkertaistettua kiinaa ja `zh-Hant-HK` perinteistä kiinaa.
- **Tehtävien tulostuskieli** ohjaa mallin tuottamaa tehtäväulostuloa, kuten linkkejä, yhteenvetoja, otsikointia, Mermaid-yhteenvetoa, käsitepoimintaa ja käännöksen kohdekieltä.
- **Per-task language mode** antaa kunkin tehtävän ratkaista oman ulostulokielensä yhtenäisen policy-kerroksen kautta hajautettujen moduulikohtaisten yliajojen sijaan.
- **Poista automaattinen käännös käytöstä** pitää muut kuin Translate-tehtävät lähdekielen kontekstissa, kun taas eksplisiittiset Translate-tehtävät pakottavat edelleen määritetyn kohdekielen.
- Mermaidiin liittyvät generointipolut noudattavat samaa kielipolitiikkaa ja voivat edelleen käynnistää Mermaid auto-fixin, kun ominaisuus on käytössä.

### Vakaiden API-kutsujen asetukset
- **Ota vakaat API-kutsut käyttöön (uudelleenyrityslogiikka)**:
  - **Pois käytöstä (oletus)**: Yksi epäonnistunut API-kutsu pysäyttää nykyisen tehtävän.
  - **Käytössä**: Yrittää epäonnistuneet LLM API -kutsut automaattisesti uudelleen. Hyödyllinen katkonaisissa verkkoyhteyksissä tai rate limit -tilanteissa.
  - **Connection Test Fallback**: Vaikka tavalliset kutsut eivät muuten käyttäisi stable modea, tarjoajan yhteystestit vaihtavat nyt samaan uudelleenyrityssekvenssiin ensimmäisen tilapäisen verkkovirheen jälkeen.
  - **Runtime Transport Fallback (ympäristötietoinen)**: Pitkäkestoiset tehtäväpyynnöt, jotka `requestUrl` pudottaa tilapäisesti, yrittävät nyt ensin saman yrityksen uudelleen ympäristötietoisen fallback-polun kautta. Työpöytärakennukset käyttävät Node `http/https` -pinoa; muut ympäristöt käyttävät selaimen `fetch`-kutsua. Nämä fallback-yritykset hyödyntävät nyt protokollatietoista stream-jäsentämistä kaikissa sisäänrakennetuissa LLM-polussa, kattaen OpenAI-compatible SSE:n, Azure OpenAI SSE:n, Anthropic Messages SSE:n, Google Gemini SSE:n ja Ollama NDJSON:n, joten hitaat gatewayt voivat palauttaa body-chunkeja aikaisemmin. Muut suorat OpenAI-tyyliset tarjoajapolut käyttävät samaa jaettua fallback-reittiä.
  - **OpenAI-Compatible Stable Order**: Stable modessa jokainen OpenAI-compatible-yritys noudattaa nyt järjestystä `direct streaming -> direct non-stream -> requestUrl (with streamed fallback when needed)` ennen kuin yritys merkitään epäonnistuneeksi. Tämä estää liian aggressiiviset virheet tilanteissa, joissa vain yksi siirtotapa on epävakaa.
- **Retry Interval (seconds)**: Näkyy vain, kun toiminto on käytössä. Uudelleenyritysten välinen aika, 1-300 sekuntia. Oletus: 5.
- **Maximum Retries**: Näkyy vain, kun toiminto on käytössä. Uudelleenyritysten enimmäismäärä, 0-10. Oletus: 3.
- **API-virheiden virheenkorjaustila**:
  - **Pois käytöstä (oletus)**: Käyttää vakiomuotoista, tiivistä virheraportointia.
  - **Käytössä**: Ottaa käyttöön yksityiskohtaisen virhelokituksen, joka muistuttaa DeepSeekin laajaa tulostusta, kaikille tarjoajille ja tehtäville, mukaan lukien Translate, Search ja Connection Tests. Mukana ovat HTTP-tilakoodit, raaka vastausteksti, pyyntöjen siirtotapaaikajanat, anonymisoidut pyyntö-URL:t ja headerit, yrityskohtainen kesto, vastausotsikot, osittaiset vastausrungot, jäsennetty osittainen stream-ulostulo ja stack tracit, mikä on ratkaisevaa API-yhteysongelmien ja upstream gateway -resetointien vianetsinnässä.
- **Developer Mode**:
  - **Pois käytöstä (oletus)**: Piilottaa kaikki vain kehittäjille tarkoitetut diagnostiikkatoiminnot tavallisilta käyttäjiltä.
  - **Käytössä**: Näyttää Asetuksissa oman kehittäjädiagnostiikkapaneelin.
- **Developer Provider Diagnostic (Long Request)**:
  - **Diagnostic Call Mode**: Valitse ajopolku probea kohden. OpenAI-compatible-tarjoajat tukevat runtime-tilojen lisäksi myös pakotettuja tiloja kuten `direct streaming`, `direct buffered` ja `requestUrl-only`.
  - **Run Diagnostic**: Suorittaa yhden pitkän pyynnön probauksen valitulla call modella ja kirjoittaa `Notemd_Provider_Diagnostic_*.txt` -tiedoston vaultin juureen.
  - **Run Stability Test**: Toistaa probauksen määritetyn määrän, 1-10 kertaa, valitulla call modella ja tallentaa yhdistetyn vakausraportin.
  - **Diagnostic Timeout**: Määritettävä aikakatkaisu per ajo, 15-3600 sekuntia.
  - **Why Use It**: Nopeampi kuin manuaalinen toistaminen tilanteessa, jossa tarjoaja läpäisee "Test connection" -testin mutta epäonnistuu oikeissa pitkäkestoisissa tehtävissä, kuten hitaiden gateway-palveluiden kautta tehtävässä käännöksessä.
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Yleiset asetukset

#### Käsitellyn tiedoston tuloste
- **Customize Processed File Save Path**:
  - **Pois käytöstä (oletus)**: Käsitellyt tiedostot, kuten `Muistiinpano_processed.md`, tallennetaan *samaan kansioon* kuin alkuperäinen muistiinpano.
  - **Käytössä**: Mahdollistaa mukautetun tallennussijainnin määrittämisen.
- **Processed File Folder Path**: Näkyy vain, kun yllä oleva asetus on käytössä. Anna *suhteellinen polku* vaultissasi, esimerkiksi `Processed Notes` tai `Output/LLM`, johon käsitellyt tiedostot tallennetaan. Kansio luodaan tarvittaessa. **Älä käytä absoluuttisia polkuja, kuten `C:\...`, äläkä virheellisiä merkkejä.**
- **Use Custom Output Filename for 'Add Links'**:
  - **Pois käytöstä (oletus)**: "Add Links" -komennon luomat käsitellyt tiedostot käyttävät oletuspäätettä `_processed.md`, esimerkiksi `Muistiinpano_processed.md`.
  - **Käytössä**: Mahdollistaa tulostetiedoston nimen mukauttamisen alla olevalla asetuksella.
- **Custom Suffix/Replacement String**: Näkyy vain, kun yllä oleva asetus on käytössä. Syötä merkkijono, jota käytetään tulostetiedoston nimessä.
  - Jos kenttä jätetään **tyhjäksi**, alkuperäinen tiedosto **ylikirjoitetaan** käsitellyllä sisällöllä.
  - Jos syötät merkkijonon, esimerkiksi `_linked`, se lisätään alkuperäiseen perusnimeen, esimerkiksi `Muistiinpano_linked.md`. Varmista, ettei pääte sisällä virheellisiä tiedostonimimerkkejä.

- **Remove Code Fences on Add Links**:
  - **Pois käytöstä (oletus)**: Koodiaidat **(\`\\\`\`)** säilytetään sisällössä linkkejä lisättäessä, ja **(\`\\\`markdown)** poistetaan automaattisesti.
  - **Käytössä**: Poistaa code fencet sisällöstä ennen linkkien lisäämistä.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Käsite-muistiinpanojen tuloste
- **Customize Concept Note Path**:
  - **Pois käytöstä (oletus)**: `[[linked concepts]]`-linkeille ei luoda automaattisesti uusia muistiinpanoja.
  - **Käytössä**: Mahdollistaa kansion määrittämisen uusille käsite-muistiinpanoille.
- **Concept Note Folder Path**: Näkyy vain, kun yllä oleva asetus on käytössä. Anna *suhteellinen polku* vaultissasi, esimerkiksi `Concepts` tai `Generated/Topics`, johon uudet käsite-muistiinpanot tallennetaan. Kansio luodaan tarvittaessa. **Kenttä on pakollinen, jos mukautus on käytössä.** **Älä käytä absoluuttisia polkuja tai virheellisiä merkkejä.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Käsite-lokitiedoston tuloste
- **Generate Concept Log File**:
  - **Pois käytöstä (oletus)**: Lokitiedostoa ei luoda.
  - **Käytössä**: Luo lokitiedoston, jossa luetellaan käsittelyn aikana luodut uudet käsite-muistiinpanot. Muoto on:
    ```
    luo xx käsite-md-tiedostoa
    1. concepts1
    2. concepts2
    ...
    n. conceptsn
    ```
- **Customize Log File Save Path**: Näkyy vain, kun "Generate Concept Log File" on käytössä.
  - **Pois käytöstä (oletus)**: Lokitiedosto tallennetaan **Concept Note Folder Path** -kansioon, jos se on määritetty, muuten vaultin juureen.
  - **Käytössä**: Mahdollistaa mukautetun kansion määrittämisen lokitiedostolle.
- **Concept Log Folder Path**: Näkyy vain, kun "Customize Log File Save Path" on käytössä. Anna *suhteellinen polku* vaultissasi, esimerkiksi `Logs/Notemd`, johon lokitiedosto tallennetaan. **Kenttä on pakollinen, jos mukautus on käytössä.**
- **Customize Log File Name**: Näkyy vain, kun "Generate Concept Log File" on käytössä.
  - **Pois käytöstä (oletus)**: Lokitiedoston nimi on `Generate.log`.
  - **Käytössä**: Mahdollistaa lokitiedoston nimen mukauttamisen.
- **Concept Log File Name**: Näkyy vain, kun "Customize Log File Name" on käytössä. Anna haluttu tiedostonimi, esimerkiksi `ConceptCreation.log`. **Kenttä on pakollinen, jos mukautus on käytössä.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Käsitteiden poimintatehtävä
- **Luo minimaaliset käsite-muistiinpanot**:
  - **Päällä (oletus)**: Uudet käsite-muistiinpanot sisältävät vain otsikon, esimerkiksi `# Käsite`.
  - **Pois päältä**: Käsite-muistiinpanot voivat sisältää lisäsisältöä, kuten "Linked From" -takaisinviittauksen, jos sitä ei ole poistettu käytöstä alla olevalla asetuksella.
- **Add "Linked From" backlink**:
  - **Pois päältä (oletus)**: Ei lisää takaisinviittausta lähdedokumenttiin käsite-muistiinpanoon poiminnan yhteydessä.
  - **Päällä**: Lisää "Linked From" -osion, jossa on takaisinviittaus lähdetiedostoon.

#### Poimi tarkka alkuperäinen teksti
- **Questions for extraction**: Anna luettelo kysymyksistä, yksi riviä kohden, joihin haluat AI:n poimivan muistiinpanoistasi sanatarkat vastaukset.
- **Translate output to corresponding language**:
  - **Pois päältä (oletus)**: Tulostaa vain poimitun tekstin alkuperäisellä kielellä.
  - **Päällä**: Lisää poimitusta tekstistä käännöksen tälle tehtävälle valittuun kieleen.
- **Merged query mode**:
  - **Pois päältä**: Käsittelee jokaisen kysymyksen erikseen, mikä parantaa tarkkuutta mutta lisää API-kutsujen määrää.
  - **Päällä**: Lähettää kaikki kysymykset yhdessä promptissa, mikä nopeuttaa käsittelyä ja vähentää API-kutsuja.
- **Customise extracted text save path & filename**:
  - **Pois päältä**: Tallentaa alkuperäisen tiedoston kanssa samaan kansioon käyttäen `_Extracted`-päätettä.
  - **Päällä**: Mahdollistaa mukautetun tulostekansion ja tiedostonimen päätteen määrittämisen.

#### Erä Mermaid -korjaus
- **Enable Mermaid Error Detection**:
  - **Pois päältä (oletus)**: Virheiden tunnistusta ei suoriteta käsittelyn jälkeen.
  - **Päällä**: Skannaa käsitellyt tiedostot jäljellä olevien Mermaid-syntaksivirheiden varalta ja generoi `mermaid_error_{foldername}.md`-raportin.
- **Move files with Mermaid errors to specified folder**:
  - **Pois päältä**: Virheelliset tiedostot jäävät paikoilleen.
  - **Päällä**: Siirtää kaikki tiedostot, joissa on korjausyrityksen jälkeen edelleen Mermaid-syntaksivirheitä, erilliseen kansioon manuaalista tarkastelua varten.
- **Mermaid error folder path**: Näkyy, jos yllä oleva asetus on käytössä. Kansio, johon virhetiedostot siirretään.

#### Käsittelyparametrit
- **Enable Batch Parallelism**:
  - **Pois käytöstä (oletus)**: Erätehtävät, kuten "Process Folder" tai "Batch Generate from Titles", käsittelevät tiedostot yksi kerrallaan sarjassa.
  - **Käytössä**: Mahdollistaa useiden tiedostojen samanaikaisen käsittelyn, mikä voi nopeuttaa suuria eräajoja merkittävästi.
- **Batch Concurrency**: Näkyy vain, kun rinnakkaisuus on käytössä. Määrittää rinnakkain käsiteltävien tiedostojen enimmäismäärän. Suurempi arvo voi olla nopeampi, mutta käyttää enemmän resursseja ja voi osua API rate limit -rajoihin. Oletus: 1, alue: 1-20.
- **Batch Size**: Näkyy vain, kun rinnakkaisuus on käytössä. Yhteen erään ryhmiteltävien tiedostojen määrä. Oletus: 50, alue: 10-200.
- **Delay Between Batches (ms)**: Näkyy vain, kun rinnakkaisuus on käytössä. Valinnainen viive millisekunteina erien välillä, mikä voi auttaa hallitsemaan API rate limit -rajoja. Oletus: 1000 ms.
- **API Call Interval (ms)**: Pienin viive millisekunteina *ennen jokaista yksittäistä LLM API -kutsua ja sen jälkeen*. Tärkeä hitaasti rajoitetuille API:ille tai 429-virheiden välttämiseksi. Aseta arvoon 0, jos et halua keinotekoista viivettä. Oletus: 500 ms.
- **Chunk Word Count**: LLM:lle lähetettävän chunkin enimmäissanamäärä. Vaikuttaa suurten tiedostojen API-kutsujen määrään. Oletus: 3000.
- **Enable Duplicate Detection**: Kytkee päälle tai pois käsitellyn sisällön duplikaattisanojen perustarkistuksen. Tulokset näkyvät konsolissa. Oletus: päällä.
- **Max Tokens**: Enimmäismäärä tokeneita, jotka LLM saa tuottaa per vastauschunk. Vaikuttaa kustannukseen ja yksityiskohtaisuuteen. Oletus: 4096.
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets/74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Kääntäminen
- **Default Target Language**: Valitse oletuskieli, johon haluat muistiinpanosi käännettävän. Tämä voidaan ohittaa käyttöliittymässä, kun suoritat käännöskomennon. Oletus: English.
- **Customise Translation File Save Path**:
  - **Pois käytöstä (oletus)**: Käännetyt tiedostot tallennetaan *samaan kansioon* kuin alkuperäinen muistiinpano.
  - **Käytössä**: Mahdollistaa *suhteellisen polun* määrittämisen vaultissa, esimerkiksi `Translations`, johon käännetyt tiedostot tallennetaan. Kansio luodaan tarvittaessa.
- **Use custom suffix for translated files**:
  - **Pois käytöstä (oletus)**: Käännetyt tiedostot käyttävät oletuspäätettä `_translated.md`, esimerkiksi `Muistiinpano_translated.md`.
  - **Käytössä**: Mahdollistaa mukautetun päätteen määrittämisen.
- **Custom Suffix**: Näkyy vain, kun yllä oleva asetus on käytössä. Anna mukautettu pääte, joka lisätään käännettyjen tiedostojen nimiin, esimerkiksi `_es` tai `_fr`.
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Sisällön luonti
- **Enable Research in "Generate from Title"**:
  - **Pois käytöstä (oletus)**: "Generate from Title" käyttää vain otsikkoa syötteenä.
  - **Käytössä**: Suorittaa verkkotutkimuksen määritetyllä **Web Research Provider** -palvelulla ja sisällyttää löydökset LLM:lle annettavaan kontekstiin otsikkopohjaisessa generoinnissa.
- **Auto-run Mermaid Syntax Fix after Generation**:
  - **Käytössä (oletus)**: Suorittaa automaattisesti Mermaid-syntaksikorjauksen Mermaidiin liittyvien työnkulkujen jälkeen, kuten Process, Generate from Title, Batch Generate from Titles, Research & Summarize, Summarise as Mermaid ja Translate.
  - **Pois käytöstä**: Jättää generoidun Mermaid-ulostulon koskemattomaksi, ellei `Batch Mermaid Fix` -toimintoa ajeta manuaalisesti tai lisätä mukautettuun työnkulkuun.
- **Output Language**: Valitse haluttu ulostulokieli "Generate from Title" ja "Batch Generate from Title" -tehtäville.
  - **English (oletus)**: Promptit käsitellään ja ulostulo tuotetaan englanniksi.
  - **Muut kielet**: LLM:lle annetaan ohje tehdä päättely englanniksi, mutta tuottaa lopullinen dokumentaatio valitsemallasi kielellä, esimerkiksi Español, Français, 简体中文, 繁體中文, العربية tai हिन्दी.
- **Change Prompt Word**:
  - **Change Prompt Word**: Mahdollistaa prompt-sanan muuttamisen tietylle tehtävälle.
  - **Custom Prompt Word**: Syötä tehtävälle oma prompt-sanasi.
- **Use Custom Output Folder for 'Generate from Title'**:
  - **Pois käytöstä (oletus)**: Onnistuneesti generoitu sisältö siirretään alikansioon nimeltä `[OriginalFolderName]_complete`, joka sijaitsee alkuperäisen kansion ylätason kansiossa, tai `Vault_complete`, jos alkuperäinen kansio oli juuri.
  - **Käytössä**: Mahdollistaa alikansion nimen mukauttamisen, johon valmiit tiedostot siirretään.
- **Custom Output Folder Name**: Näkyy vain, kun yllä oleva asetus on käytössä. Anna haluamasi alikansion nimi, esimerkiksi `Generated Content` tai `_complete`. Virheelliset merkit eivät ole sallittuja. Jos kenttä jätetään tyhjäksi, käytetään nimeä `_complete`. Kansio luodaan alkuperäisen kansion ylätason kansioon.

#### Yhden napsautuksen työnkulkupainikkeet
- **Visual Workflow Builder**: Luo mukautettuja työnkulkupainikkeita sisäänrakennetuista toiminnoista ilman käsin kirjoitettua DSL:ää.
- **Custom Workflow Buttons DSL**: Edistyneet käyttäjät voivat silti muokata työnkulun määritystekstiä suoraan. Virheellinen DSL palautuu turvallisesti oletustyönkulkuun ja näyttää varoituksen sivupalkin tai asetusten käyttöliittymässä.
- **Workflow Error Strategy**:
  - **Stop on Error (oletus)**: Pysäyttää työnkulun heti, kun jokin askel epäonnistuu.
  - **Continue on Error**: Jatkaa myöhempiä askeleita ja raportoi lopuksi epäonnistuneiden toimintojen lukumäärän.
- **Default Workflow Included**: `One-Click Extract` ketjuttaa `Process File (Add Links)`, `Batch Generate from Titles` ja `Batch Mermaid Fix`.

#### Mukautettujen kehotteiden asetukset
Tämän ominaisuuden avulla voit ohittaa oletusohjeet, eli tietyille tehtäville LLM:lle lähetettävät promptit, ja hallita ulostuloa tarkasti.

- **Enable Custom Prompts for Specific Tasks**:
  - **Pois käytöstä (oletus)**: Liitännäinen käyttää sisäänrakennettuja oletusprompttejaan kaikissa toiminnoissa.
  - **Käytössä**: Aktivoi mahdollisuuden määrittää mukautetut promptit alla luetelluille tehtäville. Tämä on ominaisuuden pääkytkin.

- **Use Custom Prompt for [Task Name]**: Näkyy vain, kun yllä oleva asetus on käytössä.
  - Jokaiselle tuetulle tehtävälle, kuten "Add Links", "Generate from Title", "Research & Summarize" ja "Extract Concepts", voit ottaa oman mukautetun promptin käyttöön tai pois käytöstä erikseen.
  - **Pois käytöstä**: Kyseinen tehtävä käyttää oletuspromptia.
  - **Käytössä**: Kyseinen tehtävä käyttää tekstiä, jonka kirjoitat vastaavaan "Custom Prompt" -tekstialueeseen.

- **Custom Prompt Text Area**: Näkyy vain, kun tehtävän mukautettu prompt on käytössä.
  - **Default Prompt Display**: Liitännäinen näyttää viitteeksi oletuspromptin, jota se tavallisesti käyttäisi. Voit käyttää **"Copy Default Prompt"** -painiketta kopioidaksesi tekstin omasi lähtökohdaksi.
  - **Custom Prompt Input**: Tässä kirjoitat omat ohjeesi LLM:lle.
  - **Placeholders**: Voit ja sinun kannattaa käyttää promptissa erityisiä placeholder-merkintöjä, jotka liitännäinen korvaa oikealla sisällöllä ennen pyynnön lähettämistä LLM:lle. Katso oletuspromptista, mitä placeholder-merkintöjä kullakin tehtävällä on käytettävissä. Tavallisia merkintöjä ovat:
    - `{TITLE}`: Nykyisen muistiinpanon otsikko.
    - `{RESEARCH_CONTEXT_SECTION}`: Verkkotutkimuksesta kerätty sisältö.
    - `{USER_PROMPT}`: Käsiteltävän muistiinpanon sisältö.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Duplikaattitarkistuksen laajuus
- **Duplicate Check Scope Mode**: Ohjaa, mitä tiedostoja verrataan **Concept Note Folder** -kansion muistiinpanoihin mahdollisten duplikaattien löytämiseksi.
  - **Entire Vault (oletus)**: Vertaa käsite-muistiinpanoja kaikkiin muihin vaultin muistiinpanoihin, pois lukien itse Concept Note Folder.
  - **Include Specific Folders Only**: Vertaa käsite-muistiinpanoja vain alla luetelluissa kansioissa oleviin muistiinpanoihin.
  - **Exclude Specific Folders**: Vertaa käsite-muistiinpanoja kaikkiin muistiinpanoihin *paitsi* alla luetelluissa kansioissa oleviin, ja sulkee pois myös Concept Note Folderin.
  - **Concept Folder Only**: Vertaa käsite-muistiinpanoja vain *muihin saman Concept Note Folder -kansion muistiinpanoihin*. Tämä auttaa löytämään duplikaatit puhtaasti generoituja käsitteitäsi sisältä.
- **Include/Exclude Folders**: Näkyy vain, jos tila on 'Include' tai 'Exclude'. Anna niiden kansioiden *suhteelliset polut*, jotka haluat sisällyttää tai sulkea pois, **yksi polku per rivi**. Polut ovat kirjainkoon suhteen tarkkoja ja käyttävät erottimena `/`, esimerkiksi `Reference Material/Papers` tai `Daily Notes`. Nämä kansiot eivät voi olla samoja kuin Concept Note Folder tai sen sisällä.

#### Verkkotutkimuksen palveluntarjoaja
- **Search Provider**: Valitse `Tavily`, joka vaatii API-avaimen ja on suositeltu, tai `DuckDuckGo`, joka on kokeellinen ja jää usein hakukoneen automaattisia pyyntöjä estävän suojauksen taakse. Käytetään "Research & Summarize Topic" -toiminnossa ja valinnaisesti "Generate from Title" -toiminnossa.
- **Tavily API Key**: Näkyy vain, jos Tavily on valittu. Anna API-avaimesi sivustolta [tavily.com](https://tavily.com/).
- **Tavily Max Results**: Näkyy vain, jos Tavily on valittu. Enimmäismäärä hakutuloksia, jotka Tavily palauttaa, 1-20. Oletus: 5.
- **Tavily Search Depth**: Näkyy vain, jos Tavily on valittu. Valitse `basic` (oletus) tai `advanced`. Huomaa, että `advanced` tuottaa parempia tuloksia, mutta maksaa 2 API-krediittiä hakua kohden yhden sijasta.
- **DuckDuckGo Max Results**: Näkyy vain, jos DuckDuckGo on valittu. Jäsennettävien hakutulosten enimmäismäärä, 1-10. Oletus: 5.
- **DuckDuckGo Content Fetch Timeout**: Näkyy vain, jos DuckDuckGo on valittu. Enimmäisaika sekunteina, jonka sisältöä yritetään hakea jokaisen DuckDuckGo-tulos-URL:n kautta. Oletus: 15.
- **Max Research Content Tokens**: Yhdistetyistä verkkotutkimustuloksista, katkelmista ja haetusta sisällöstä yhteenvedon promptiin sisällytettävien tokenien likimääräinen enimmäismäärä. Auttaa hallitsemaan konteksti-ikkunan kokoa ja kustannusta. Oletus: 3000.
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Kohdennettu oppimisalue
- **Enable Focused Learning Domain**:
  - **Pois käytöstä (oletus)**: LLM:lle lähetettävät promptit käyttävät tavallisia yleiskäyttöisiä ohjeita.
  - **Käytössä**: Mahdollistaa yhden tai useamman opintoalan määrittämisen LLM:n kontekstuaalisen ymmärryksen parantamiseksi.
- **Learning Domain**: Näkyy vain, kun yllä oleva asetus on käytössä. Anna omat tarkat alasi, esimerkiksi `Materials Science`, `Polymer Physics` tai `Machine Learning`. Tämä lisää promptien alkuun rivin "Relevant Fields: [...]", mikä auttaa LLM:ää tuottamaan tarkempia ja oleellisempia linkkejä ja sisältöä omaan opiskelualaasi varten.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />

## Käyttöopas

### Pikatyönkulut ja sivupalkki

- Avaa Notemd-sivupalkki päästäksesi käsiksi ryhmiteltyihin toimintoihin, jotka kattavat ydinkäsittelyn, generoinnin, kääntämisen, tiedonhallinnan ja apuominaisuudet.
- Käytä sivupalkin yläosan **Pikatyönkulut** -aluetta käynnistääksesi mukautettuja monivaihepainikkeita.
- Oletustyönkulku **One-Click Extract** suorittaa `Process File (Add Links)` -> `Batch Generate from Titles` -> `Batch Mermaid Fix`.
- Työnkulun eteneminen, vaihekohtaiset lokit ja epäonnistumiset näkyvät sivupalkissa, jonka kiinnitetty alatunniste estää edistymispalkin ja lokialueen puristumisen näkymättömiin laajennettujen osioiden vuoksi.
- Edistymiskortti näyttää tilatekstin, erillisen prosentti-indikaattorin ja jäljellä olevan ajan yhdellä silmäyksellä, ja samat mukautetut työnkulut voidaan määrittää uudelleen asetuksista.

### Alkuperäinen käsittely (wiki-linkkien lisääminen)
Tämä on ydinominaisuus, joka keskittyy käsitteiden tunnistamiseen ja `[[wiki-links]]`-linkkien lisäämiseen.

**Tärkeää:** Tämä prosessi toimii vain `.md`- tai `.txt`-tiedostoille. Voit muuntaa PDF-tiedostot MD-tiedostoiksi ilmaiseksi [Minerulla](https://github.com/opendatalab/MinerU) ennen jatkokäsittelyä.

1. **Sivupalkin käyttö**:
   - Avaa Notemd Sidebar taikasauvakuvakkeesta tai komentopaletista.
   - Avaa `.md`- tai `.txt`-tiedosto.
   - Napsauta **"Process File (Add Links)"**.
   - Kansion käsittely: napsauta **"Process Folder (Add Links)"**, valitse kansio ja napsauta "Process".
   - Edistyminen näkyy sivupalkissa. Voit perua tehtävän sivupalkin "Cancel Processing" -painikkeella.
   - *Huomio kansiokäsittelystä:* Tiedostot käsitellään taustalla ilman, että niitä avataan editoriin.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2. **Komentopaletin käyttö** (`Ctrl+P` tai `Cmd+P`):
   - **Yksittäinen tiedosto**: Avaa tiedosto ja suorita `Notemd: Process Current File`.
   - **Kansio**: Suorita `Notemd: Process Folder` ja valitse sitten kansio. Tiedostot käsitellään taustalla ilman, että niitä avataan editoriin.
   - Komentopaletista käynnistettäville toiminnoille näytetään edistymismodaali, jossa on myös peruutuspainike.
   - *Huom:* liitännäinen poistaa automaattisesti alussa olevat `\boxed{`-rivit ja lopussa olevat `}`-rivit lopullisesta käsitellystä sisällöstä ennen tallennusta, jos niitä löytyy.

### Uudet ominaisuudet

1. **Tiivistä Mermaid-kaavioksi**:
   - Avaa muistiinpano, jonka haluat tiivistää.
   - Suorita komento `Notemd: Summarise as Mermaid diagram` komentopaletista tai sivupalkin painikkeesta.
   - Liitännäinen luo uuden muistiinpanon Mermaid-kaaviolla.

2. **Translate Note/Selection**:
   - Valitse muistiinpanosta teksti, jos haluat kääntää vain valinnan, tai suorita komento ilman valintaa kääntääksesi koko muistiinpanon.
   - Suorita komento `Notemd: Translate Note/Selection` komentopaletista tai sivupalkin painikkeesta.
   - Näkyviin tulee modaali, jossa voit vahvistaa tai muuttaa **Target Language** -asetusta; oletusarvo tulee määrityksissä määritetystä asetuksesta.
   - Liitännäinen käyttää määritettyä **LLM Provider** -asetusta Multi-Model-asetusten mukaisesti käännöksen suorittamiseen.
   - Käännetty sisältö tallennetaan määritettyyn **Translation Save Path** -polkuun oikealla päätteellä ja avataan **uuteen paneeliin alkuperäisen sisällön oikealle puolelle** helppoa vertailua varten.
   - Voit perua tämän tehtävän sivupalkin painikkeesta tai modaalin peruutuspainikkeesta.
3. **Eräkäännös**:
   - Suorita komentopaletista `Notemd: Batch Translate Folder` ja valitse kansio, tai napsauta kansiota oikealla tiedostoselaimessa ja valitse "Batch translate this folder".
   - Liitännäinen kääntää kaikki valitun kansion Markdown-tiedostot.
   - Käännetyt tiedostot tallennetaan määritettyyn käännöspolkuun, mutta niitä ei avata automaattisesti.
   - Prosessi voidaan perua edistymismodaalista.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3. **Research & Summarize Topic**:
   - Valitse muistiinpanosta tekstiä tai varmista, että muistiinpanolla on otsikko, jota käytetään hakuteemana.
   - Suorita komento `Notemd: Research and Summarize Topic` komentopaletista tai sivupalkin painikkeesta.
   - Liitännäinen käyttää määritettyä **Search Provider** -palvelua, Tavilya tai DuckDuckGoa, sekä oikeaa **LLM Provider** -asetusta Multi-Model-määritysten mukaisesti tiedon hakemiseen ja yhteenvedon tekemiseen.
   - Yhteenveto lisätään nykyiseen muistiinpanoon.
   - Voit perua tämän tehtävän sivupalkin painikkeesta tai modaalin peruutuspainikkeesta.
   - *Huom:* DuckDuckGo-haut voivat epäonnistua bottisuojauksen vuoksi. Tavily on suositeltu vaihtoehto.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4. **Generate Content from Title**:
   - Avaa muistiinpano; se voi olla tyhjä.
   - Suorita komento `Notemd: Generate Content from Title` komentopaletista tai sivupalkin painikkeesta.
   - Liitännäinen käyttää sopivaa **LLM Provider** -asetusta Multi-Model-määritysten mukaisesti luodakseen sisältöä muistiinpanon otsikon perusteella ja korvaa mahdollisen olemassa olevan sisällön.
   - Jos asetus **"Enable Research in 'Generate from Title'"** on käytössä, liitännäinen suorittaa ensin verkkotutkimuksen määritetyn **Web Research Provider** -palvelun avulla ja sisällyttää tulokset LLM:lle annettavaan kontekstiin.
   - Voit perua tämän tehtävän sivupalkin painikkeesta tai modaalin peruutuspainikkeesta.

5. **Batch Generate Content from Titles**:
   - Suorita komento `Notemd: Batch Generate Content from Titles` komentopaletista tai sivupalkin painikkeesta.
   - Valitse kansio, joka sisältää käsiteltävät muistiinpanot.
   - Liitännäinen käy läpi jokaisen kansion `.md`-tiedoston, pois lukien `_processed.md`-tiedostot ja tiedostot määritetystä "complete"-kansiosta, generoi sisältöä otsikon perusteella ja korvaa mahdollisen olemassa olevan sisällön. Tiedostot käsitellään taustalla ilman, että niitä avataan editoriin.
   - Onnistuneesti käsitellyt tiedostot siirretään määritettyyn "complete"-kansioon.
   - Komento noudattaa kunkin käsitellyn muistiinpanon kohdalla asetusta **"Enable Research in 'Generate from Title'"**.
   - Voit perua tämän tehtävän sivupalkin painikkeesta tai modaalin peruutuspainikkeesta.
   - Edistyminen ja tulokset, kuten muokattujen tiedostojen määrä ja virheet, näkyvät sivupalkin tai modaalin lokissa.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6. **Check and Remove Duplicate Concept Notes**:
   - Varmista, että **Concept Note Folder Path** on määritetty oikein asetuksissa.
   - Suorita `Notemd: Check and Remove Duplicate Concept Notes` komentopaletista tai sivupalkin painikkeesta.
   - Liitännäinen skannaa concept note -kansion ja vertaa tiedostonimiä kansion ulkopuolisiin muistiinpanoihin useiden sääntöjen avulla, kuten täsmäosumat, monikkomuodot, normalisointi ja sisältävyys.
   - Jos mahdollisia duplikaatteja löytyy, näkyviin tulee modaali, jossa luetellaan tiedostot, merkinnän syy ja ristiriitaiset tiedostot.
   - Tarkista lista huolellisesti. Napsauta **"Delete Files"** siirtääksesi luetellut tiedostot järjestelmän roskakoriin tai **"Cancel"** jättääksesi kaiken ennalleen.
   - Edistyminen ja tulokset näkyvät sivupalkin tai modaalin lokissa.

7. **Extract Concepts (Pure Mode)**:
   - Tämän ominaisuuden avulla voit poimia käsitteitä dokumentista ja luoda niitä vastaavat käsite-muistiinpanot *muuttamatta* alkuperäistä tiedostoa. Se sopii täydellisesti tietopohjan nopeaan kasvattamiseen dokumenttijoukosta.
   - **Yksittäinen tiedosto**: Avaa tiedosto ja suorita komentopaletista `Notemd: Extract concepts (create concept notes only)` tai napsauta sivupalkin **"Extract concepts (current file)"** -painiketta.
   - **Kansio**: Suorita komentopaletista `Notemd: Batch extract concepts from folder` tai napsauta sivupalkin **"Extract concepts (folder)"** -painiketta ja valitse käsiteltävä kansio.
   - Liitännäinen lukee tiedostot, tunnistaa käsitteet ja luo niille uudet muistiinpanot määritettyyn **Concept Note Folder** -kansioon, jättäen alkuperäiset tiedostot koskemattomiksi.

8. **Create Wiki-Link & Generate Note from Selection**:
   - Tämä tehokas komento suoraviivaistaa uusien käsite-muistiinpanojen luontia ja täyttämistä.
   - Valitse editorissa sana tai ilmaus.
   - Suorita komento `Notemd: Create Wiki-Link & Generate Note from Selection`; tälle kannattaa määrittää pikanäppäin, esimerkiksi `Cmd+Shift+W`.
   - Liitännäinen tekee seuraavaa:
     1. Korvaa valitun tekstin `[[wiki-link]]`-merkinnällä.
     2. Tarkistaa, löytyykö kyseisellä otsikolla jo muistiinpano **Concept Note Folder** -kansiosta.
     3. Jos löytyy, se lisää takaisinviittauksen nykyiseen muistiinpanoon.
     4. Jos ei löydy, se luo uuden tyhjän muistiinpanon.
     5. Tämän jälkeen se suorittaa automaattisesti **"Generate Content from Title"** -komennon uudelle tai olemassa olevalle muistiinpanolle ja täyttää sen tekoälyn tuottamalla sisällöllä.

9. **Extract Concepts and Generate Titles**:
   - Tämä komento ketjuttaa kaksi tehokasta ominaisuutta yhdeksi virtaviivaiseksi työnkuluksi.
   - Suorita komentopaletista `Notemd: Extract Concepts and Generate Titles`; tälle kannattaa määrittää pikanäppäin.
   - Liitännäinen tekee seuraavaa:
     1. Suorittaa ensin nykyiselle aktiiviselle tiedostolle tehtävän **"Extract concepts (current file)"**.
     2. Sen jälkeen se suorittaa automaattisesti tehtävän **"Batch generate from titles"** kansiolle, jonka olet määrittänyt asetuksissa **Concept note folder path** -poluksi.
   - Näin voit ensin kasvattaa tietopohjaasi uusilla käsitteillä lähdedokumentista ja täydentää uudet käsite-muistiinpanot välittömästi tekoälyn luomalla sisällöllä yhdessä vaiheessa.

10. **Extract Specific Original Text**:
   - Määritä kysymyksesi asetusten kohdassa "Extract Specific Original Text".
   - Käsittele aktiivinen tiedosto sivupalkin "Extract Specific Original Text" -painikkeella.
   - **Merged Mode**: Nopeuttaa käsittelyä lähettämällä kaikki kysymykset yhdessä promptissa.
   - **Translation**: Kääntää poimitun tekstin valinnaisesti määritettyyn kieleesi.
   - **Custom Output**: Määritä, minne ja millä nimellä poimittu tiedosto tallennetaan.

11. **Batch Mermaid Fix**:
   - Käytä sivupalkin "Batch Mermaid Fix" -painiketta kansion skannaamiseen ja yleisten Mermaid-syntaksivirheiden korjaamiseen.
   - Liitännäinen raportoi tiedostot, joissa virheitä on edelleen, tiedostoon `mermaid_error_{foldername}.md`.
   - Voit halutessasi määrittää liitännäisen siirtämään nämä ongelmalliset tiedostot erilliseen tarkastuskansioon.

## Tuetut LLM-tarjoajat

| Tarjoaja | Tyyppi | API-avain vaaditaan | Huomautukset |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Pilvi   | Kyllä                  | Natiivi DeepSeek-päätepiste reasoning-mallien käsittelyllä            |
| Qwen               | Pilvi   | Kyllä                  | DashScope compatible-mode -esiasetus Qwen / QwQ -malleille            |
| Qwen Code          | Pilvi   | Kyllä                  | DashScopen koodaukseen painottuva esiasetus Qwen coder -malleille     |
| Doubao             | Pilvi   | Kyllä                  | Volcengine Ark -esiasetus; model-kenttään asetetaan yleensä päätepisteesi ID |
| Moonshot           | Pilvi   | Kyllä                  | Virallinen Kimi / Moonshot -päätepiste                                |
| GLM                | Pilvi   | Kyllä                  | Virallinen Zhipu BigModel OpenAI-compatible -päätepiste               |
| Z AI               | Pilvi   | Kyllä                  | Kansainvälinen GLM/Zhipu OpenAI-compatible -päätepiste; täydentää `GLM`:ää |
| MiniMax            | Pilvi   | Kyllä                  | Virallinen MiniMax chat-completions -päätepiste                       |
| Huawei Cloud MaaS  | Pilvi   | Kyllä                  | Huawei ModelArts MaaS OpenAI-compatible -päätepiste hostatuille malleille |
| Baidu Qianfan      | Pilvi   | Kyllä                  | Virallinen Qianfan OpenAI-compatible -päätepiste ERNIE-malleille      |
| SiliconFlow        | Pilvi   | Kyllä                  | Virallinen SiliconFlow OpenAI-compatible -päätepiste hostatuille OSS-malleille |
| OpenAI             | Pilvi   | Kyllä                  | Tukee GPT- ja o-sarjan malleja                                        |
| Anthropic          | Pilvi   | Kyllä                  | Tukee Claude-malleja                                                  |
| Google             | Pilvi   | Kyllä                  | Tukee Gemini-malleja                                                  |
| Mistral            | Pilvi   | Kyllä                  | Tukee Mistral- ja Codestral-tuoteperheitä                             |
| Azure OpenAI       | Pilvi   | Kyllä                  | Vaatii Endpoint-, API Key-, deployment name- ja API Version -asetukset |
| OpenRouter         | Gateway | Kyllä                  | Pääsy moniin tarjoajiin OpenRouter-malli-ID:iden kautta               |
| xAI                | Pilvi   | Kyllä                  | Natiivi Grok-päätepiste                                               |
| Groq               | Pilvi   | Kyllä                  | Nopea OpenAI-compatible-inferenssi hostatuille OSS-malleille          |
| Together           | Pilvi   | Kyllä                  | OpenAI-compatible -päätepiste hostatuille OSS-malleille               |
| Fireworks          | Pilvi   | Kyllä                  | OpenAI-compatible -inferenssipäätepiste                               |
| Requesty           | Gateway | Kyllä                  | Monitarjoajarouteri yhden API-avaimen takana                          |
| OpenAI Compatible  | Gateway | Valinnainen            | Yleinen esiasetus LiteLLM:lle, vLLM:lle, Perplexitylle, Vercel AI Gatewaylle jne. |
| LMStudio           | Paikallinen | Valinnainen (`EMPTY`) | Ajaa malleja paikallisesti LM Studio -palvelimen kautta               |
| Ollama             | Paikallinen | Ei                | Ajaa malleja paikallisesti Ollama-palvelimen kautta                   |

*Huom: Paikallisten tarjoajien, LMStudion ja Ollaman, kohdalla varmista, että vastaava palvelinsovellus on käynnissä ja saavutettavissa määritetystä Base URL -osoitteesta.*
*Huom: OpenRouterin ja Requestyn kanssa käytä gatewayn näyttämää tarjoajaetuliitteellistä tai täydellistä malli-ID:tä, esimerkiksi `google/gemini-flash-1.5` tai `anthropic/claude-3-7-sonnet-latest`.*
*Huom: `Doubao` odottaa yleensä model-kenttään Ark-päätepiste- tai deployment-ID:tä eikä raakaa malliperheen nimeä. Asetusnäkymä varoittaa nyt, jos placeholder-arvo on edelleen paikallaan, ja estää connection testit, kunnes vaihdat sen oikeaan endpoint-ID:hen.*
*Huom: `Z AI` käyttää kansainvälistä `api.z.ai` -linjaa, kun taas `GLM` pitää mantereen Kiinan BigModel-päätepisteen. Valitse esiasetus, joka vastaa tilisi aluetta.*
*Huom: Kiina-keskeiset esiasetukset käyttävät chat-first-yhteystestejä, jotta testi validoi todellisen määritetyn mallin tai deploymentin eikä pelkästään API-avaimen saavutettavuutta.*
*Huom: `OpenAI Compatible` on tarkoitettu mukautetuille gateway- ja proxy-ratkaisuille. Aseta Base URL, API-avainkäytäntö ja malli-ID tarjoajasi dokumentaation mukaisesti.*

## Verkon käyttö ja tietojen käsittely

Notemd toimii paikallisesti Obsidianin sisällä, mutta osa ominaisuuksista lähettää ulospäin suuntautuvia pyyntöjä.

### LLM-tarjoajakutsut (määritettävissä)

- Laukaisin: tiedostojen käsittely, generointi, käännös, tutkimusyhteenvedot, Mermaid-yhteenvedot sekä yhteys- ja diagnostiikkatoiminnot.
- Päätepiste: Notemd-asetuksissa määritetyt tarjoajien Base URL -osoitteet.
- Lähetettävät tiedot: käsittelyn vaatima prompt-teksti ja tehtäväsisältö.
- Tietojen käsittelyhuomio: API-avaimet määritetään paikallisesti liitännäisen asetuksissa, ja niitä käytetään pyyntöjen allekirjoittamiseen omalta laitteeltasi.

### Verkkotutkimuskutsut (valinnainen)

- Laukaisin: kun verkkotutkimus on käytössä ja hakupalvelu on valittu.
- Päätepiste: Tavily API tai DuckDuckGo-päätepisteet.
- Lähetettävät tiedot: tutkimuskyselysi ja vaadittu pyyntömetadata.

### Kehittäjädiagnostiikka ja virheenjäljityslokit (valinnainen)

- Laukaisin: API debug mode ja kehittäjien diagnostiikkatoiminnot.
- Tallennus: diagnostiikka- ja virhelokit kirjoitetaan vaultin juureen, esimerkiksi `Notemd_Provider_Diagnostic_*.txt` ja `Notemd_Error_Log_*.txt`.
- Riskihuomio: lokit voivat sisältää pyyntö- ja vastausotoksia. Tarkista lokit ennen niiden jakamista julkisesti.

### Paikallinen tallennus

- Liitännäisen asetukset tallennetaan tiedostoon `.obsidian/plugins/notemd/data.json`.
- Luodut tiedostot, raportit ja valinnaiset lokit tallennetaan vaultiin asetustesi mukaisesti.

## Vianetsintä

### Yleiset ongelmat
- **Liitännäinen ei lataudu**: Varmista, että `manifest.json`, `main.js` ja `styles.css` ovat oikeassa kansiossa, `<Vault>/.obsidian/plugins/notemd/`, ja käynnistä Obsidian uudelleen. Tarkista Developer Console (`Ctrl+Shift+I` tai `Cmd+Option+I`) mahdollisten käynnistysvirheiden varalta.
- **Käsittelyvirheet / API-virheet**:
  1. **Tarkista tiedostomuoto**: Varmista, että käsiteltävällä tai tarkistettavalla tiedostolla on `.md`- tai `.txt`-pääte. Notemd tukee tällä hetkellä vain näitä tekstipohjaisia formaatteja.
  2. Käytä "Test LLM Connection" -komentoa tai -painiketta aktiivisen tarjoajan asetusten tarkistamiseen.
  3. Tarkista vielä kerran API Key, Base URL, Model Name ja API Version (Azurelle). Varmista, että API-avain on oikea ja että siinä on riittävästi krediittejä tai käyttöoikeuksia.
  4. Varmista, että paikallinen LLM-palvelimesi (LMStudio tai Ollama) on käynnissä ja että Base URL on oikea, esimerkiksi `http://localhost:1234/v1` LM Studiolle.
  5. Tarkista internet-yhteytesi pilvipalveluntarjoajien tapauksessa.
  6. **Yksittäisen tiedoston käsittelyvirheissä:** Tarkista Developer Consolesta tarkemmat virheilmoitukset. Voit kopioida ne tarvittaessa virhedialogin painikkeella.
  7. **Eräkäsittelyvirheissä:** Tarkista vaultin juuressa oleva `error_processing_filename.log`-tiedosto; se sisältää yksityiskohtaiset virheilmoitukset jokaisesta epäonnistuneesta tiedostosta. Developer Console tai virhedialogi voi näyttää yhteenvedon tai yleisen erävirheen.
  8. **Automaattiset virhelokit:** Jos prosessi epäonnistuu, liitännäinen tallentaa automaattisesti yksityiskohtaisen lokitiedoston nimeltä `Notemd_Error_Log_[Timestamp].txt` vaultin juurikansioon. Tiedosto sisältää virheilmoituksen, stack tracen ja istuntolokit. Jos kohtaat jatkuvia ongelmia, tarkista tämä tiedosto. Kun "API Error Debugging Mode" otetaan käyttöön asetuksissa, loki sisältää vielä yksityiskohtaisempaa API-vastausdataa.
  9. **Todellisen päätepisteen pitkien pyyntöjen diagnostiikka (kehittäjille)**:
     - Liitännäisen sisäinen reitti (suositeltu ensin): käytä **Settings -> Notemd -> Developer provider diagnostic (long request)** suorittaaksesi runtime-proben aktiiviselle tarjoajalle ja luodaksesi `Notemd_Provider_Diagnostic_*.txt` -tiedoston vaultin juureen.
     - CLI-reitti (Obsidian runtime -ympäristön ulkopuolella): toistettavaa päätepistetason vertailua puskuroidun ja streamaavan käyttäytymisen välillä varten käytä:
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
       Luotu raportti sisältää yrityskohtaiset ajat (`First Byte`, `Duration`), anonymisoidun pyyntömetadatan, vastausotsikot, raaka- tai osittaiset body-fragmentit, jäsennetyt stream-fragmentit ja siirtokerroksen epäonnistumiskohdat.
- **LM Studio/Ollama -yhteysongelmat**:
  - **Yhteystesti epäonnistuu**: Varmista, että paikallinen palvelin (LM Studio tai Ollama) on käynnissä ja että oikea malli on ladattu tai saatavilla.
  - **CORS-virheet (Ollama Windowsissa)**: Jos kohtaat CORS-virheitä (Cross-Origin Resource Sharing) käyttäessäsi Ollamaa Windowsissa, saatat joutua asettamaan ympäristömuuttujan `OLLAMA_ORIGINS`. Voit tehdä tämän suorittamalla `set OLLAMA_ORIGINS=*` komentokehotteessa ennen Ollaman käynnistämistä. Tämä sallii pyynnöt mistä tahansa alkuperästä.
  - **Ota CORS käyttöön LM Studiossa**: LM Studiossa CORS voidaan ottaa käyttöön suoraan palvelinasetuksista, mikä voi olla tarpeen, jos Obsidian toimii selaimessa tai sillä on tiukat origin-käytännöt.
- **Kansionluontivirheet ("File name cannot contain...")**:
  - Tämä tarkoittaa yleensä, että asetuksissa annettu polku, **Processed File Folder Path** tai **Concept Note Folder Path**, on *Obsidianin näkökulmasta* virheellinen.
  - **Varmista, että käytät suhteellisia polkuja**, esimerkiksi `Processed` tai `Notes/Concepts`, etkä **absoluuttisia polkuja**, kuten `C:\Users\...` tai `/Users/...`.
  - Tarkista virheelliset merkit: `* " \ / < > : | ? # ^ [ ]`. Huomaa, että myös `\` on virheellinen Windowsissa Obsidian-poluille. Käytä polun erottimena `/`.
- **Suorituskykyongelmat**: Suurten tiedostojen tai monien tiedostojen käsittely voi viedä aikaa. Pienennä "Chunk Word Count" -asetusta, jos haluat mahdollisesti nopeampia mutta useampia API-kutsuja. Kokeile toista LLM-tarjoajaa tai mallia.
- **Odottamaton linkitys**: Linkityksen laatu riippuu voimakkaasti LLM:stä ja promptista. Kokeile eri malleja tai temperature-asetuksia.

## Osallistuminen

Osallistuminen on tervetullutta. Katso ohjeet GitHub-repositoriosta: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD)

## Ylläpitäjien dokumentaatio

- [Julkaisutyönkulku (englanti)](./docs/maintainer/release-workflow.md)
- [Julkaisutyönkulku (yksinkertaistettu kiina)](./docs/maintainer/release-workflow.zh-CN.md)

## Lisenssi

MIT License - Katso lisätiedot tiedostosta [LICENSE](LICENSE).

---

If you love using Notemd, please consider [⭐ Give a Star on GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) or [☕️ Buy Me a Coffee](https://ko-fi.com/jacobinwwey).

*Notemd v1.8.3 - Paranna Obsidian-tietograafiasi tekoälyn avulla.*

![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
