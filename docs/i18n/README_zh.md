# Notemd 语言中心

此页面统一说明当前文档语言与应用内 UI 语言支持的真实状态。

## 维护源文档

- English: [README.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README.md)
- 简体中文: [README_zh.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_zh.md)

## 已发布 README 译文

- 繁體中文: [README_zh_Hant.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_zh_Hant.md)
- Español: [README_es.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_es.md)
- Français: [README_fr.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_fr.md)
- Deutsch: [README_de.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_de.md)
- Italiano: [README_it.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_it.md)
- Português: [README_pt.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_pt.md)
- 日本語: [README_ja.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_ja.md)
- 한국어: [README_ko.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_ko.md)
- Русский: [README_ru.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_ru.md)
- العربية: [README_ar.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_ar.md)
- हिन्दी: [README_hi.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_hi.md)
- বাংলা: [README_bn.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_bn.md)
- Nederlands: [README_nl.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_nl.md)
- Svenska: [README_sv.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_sv.md)
- Suomi: [README_fi.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_fi.md)
- Dansk: [README_da.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_da.md)
- Norsk: [README_no.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_no.md)
- Polski: [README_pl.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_pl.md)
- Türkçe: [README_tr.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_tr.md)
- עברית: [README_he.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_he.md)
- ไทย: [README_th.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_th.md)
- Ελληνικά: [README_el.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_el.md)
- Čeština: [README_cs.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_cs.md)
- Magyar: [README_hu.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_hu.md)
- Română: [README_ro.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_ro.md)
- Українська: [README_uk.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_uk.md)
- Tiếng Việt: [README_vi.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_vi.md)
- Bahasa Indonesia: [README_id.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_id.md)
- Bahasa Melayu: [README_ms.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README_ms.md)

## 应用内 UI Locale 覆盖范围

- `auto` 模式会跟随 Obsidian 当前界面语言。
- 应用内支持的 UI locale 由 [src/i18n/uiLocales.ts](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/src/i18n/uiLocales.ts) 显式定义：`en`、`ar`、`de`、`es`、`fa`、`fr`、`id`、`it`、`ja`、`ko`、`nl`、`pl`、`pt`、`pt-BR`、`ru`、`th`、`tr`、`uk`、`vi`、`zh-CN`、`zh-TW`。
- English fallback 仍保留为实现层安全网，但已支持 locale 的可见界面已由回归测试覆盖，正常使用中不应再静默回落到英文。
- 当前实现已对齐 Notebook Navigator 的核心 i18n 设计原则：显式 supported-language map、`auto` 模式对齐 Obsidian locale，以及以 English 作为最终 fallback merge 目标。

| 代码 | 显示名称 |
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

## 翻译状态策略

- 权威源文档：仓库中的 English + 简体中文维护文档。
- 已发布 README 译文应尽量完整覆盖源文档，但如出现短暂漂移，仍以维护源文档为准。
- 只有当某个 UI locale 已存在于代码中，且可见界面覆盖测试通过时，文档才应宣称其“已支持”。
- fallback 机制用于韧性兜底，不应用来替代缺失的可见翻译。

## 贡献人工翻译

1. 在仓库根目录新增或更新语言文件，例如：`README_es.md`。
2. 章节顺序尽量与 [README.md](https://github.com/Jacobinwwey/obsidian-NotEMD/blob/main/README.md) 保持一致。
3. 新增 README 译文或 UI locale 时，请同步更新本语言中心。
4. 提交 PR，条件允许时至少邀请一位母语贡献者复核。
