# Notemd Language Hub

This page centralizes the current language-support contract for both documentation and the in-app UI.

## Maintainer Source Docs

- English: [README.md](../../README.md)
- 简体中文 (Simplified Chinese): [README_zh.md](../../README_zh.md)

## Published README Translations

- 繁體中文 (Traditional Chinese): [README_zh_Hant.md](../../README_zh_Hant.md)
- Español (Spanish): [README_es.md](../../README_es.md)
- Français (French): [README_fr.md](../../README_fr.md)
- Deutsch (German): [README_de.md](../../README_de.md)
- Italiano (Italian): [README_it.md](../../README_it.md)
- Português (Portuguese): [README_pt.md](../../README_pt.md)
- 日本語 (Japanese): [README_ja.md](../../README_ja.md)
- 한국어 (Korean): [README_ko.md](../../README_ko.md)
- Русский (Russian): [README_ru.md](../../README_ru.md)
- العربية (Arabic): [README_ar.md](../../README_ar.md)
- हिन्दी (Hindi): [README_hi.md](../../README_hi.md)
- বাংলা (Bengali): [README_bn.md](../../README_bn.md)
- Nederlands (Dutch): [README_nl.md](../../README_nl.md)
- Svenska (Swedish): [README_sv.md](../../README_sv.md)
- Suomi (Finnish): [README_fi.md](../../README_fi.md)
- Dansk (Danish): [README_da.md](../../README_da.md)
- Norsk (Norwegian): [README_no.md](../../README_no.md)
- Polski (Polish): [README_pl.md](../../README_pl.md)
- Türkçe (Turkish): [README_tr.md](../../README_tr.md)
- עברית (Hebrew): [README_he.md](../../README_he.md)
- ไทย (Thai): [README_th.md](../../README_th.md)
- Ελληνικά (Greek): [README_el.md](../../README_el.md)
- Čeština (Czech): [README_cs.md](../../README_cs.md)
- Magyar (Hungarian): [README_hu.md](../../README_hu.md)
- Română (Romanian): [README_ro.md](../../README_ro.md)
- Українська (Ukrainian): [README_uk.md](../../README_uk.md)
- Tiếng Việt (Vietnamese): [README_vi.md](../../README_vi.md)
- Bahasa Indonesia (Indonesian): [README_id.md](../../README_id.md)
- Bahasa Melayu (Malay): [README_ms.md](../../README_ms.md)

## In-App UI Locale Coverage

- `auto` follows Obsidian's current UI language.
- The supported in-app UI locale catalog is defined explicitly in [src/i18n/uiLocales.ts](../../src/i18n/uiLocales.ts): `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- English fallback remains as an implementation safety net, but supported visible surfaces are regression-tested and should not silently fall back during normal use.
- The implementation now follows the same core i18n design principles seen in Notebook Navigator: an explicit supported-language map, Obsidian locale alignment in `auto` mode, and English as the final fallback merge target.

| Code | Display Name |
|---|---|
| `en` | English |
| `ar` | العربية |
| `de` | Deutsch |
| `es` | Español |
| `fa` | فارسی |
| `fr` | Français |
| `id` | Bahasa Indonesia |
| `it` | Italiano |
| `ja` | 日本語 |
| `ko` | 한국어 |
| `nl` | Nederlands |
| `pl` | Polski |
| `pt` | Português |
| `pt-BR` | Português (Brasil) |
| `ru` | Русский |
| `th` | ไทย |
| `tr` | Türkçe |
| `uk` | Українська |
| `vi` | Tiếng Việt |
| `zh-CN` | 简体中文 |
| `zh-TW` | 繁體中文 |

## Translation Status Policy

- Source of truth: the English and Simplified Chinese maintainer docs in this repository.
- Published README translations are expected to cover the full source content, but the maintainer docs win temporarily if translation drift exists.
- Do not document a UI locale as "supported" unless it exists in code and the visible-surface regression coverage passes.
- Fallback behavior is resilience, not a substitute for missing visible translations.

## Contributing Human Translations

1. Add or update a file in the repository root, for example: `README_es.md`.
2. Keep section order aligned with [README.md](../../README.md).
3. Update this Language Hub whenever a new README translation or UI locale is added.
4. Open a PR and include native-speaker review when practical.
