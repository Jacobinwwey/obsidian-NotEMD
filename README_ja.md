
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Obsidian用 Notemd プラグイン

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

多言語ドキュメント：[Language Hub](./docs/i18n/README.md) を参照してください

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      AI駆動の多言語ナレッジ強化ツール
==================================================
```

あなただけの知識ベースを簡単に作成する方法！

Notemd は、さまざまな大規模言語モデル (LLM) と統合することで Obsidian のワークフローを強化します。多言語のノート処理をサポートし、主要な概念に対する Wiki リンクの自動生成、対応する概念ノートの作成、Web 検索と要約、翻訳、Mermaid マインドマップへの要約などを実行し、強力なナレッジグラフの構築を支援します。

**バージョン:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## 目次
- [クイックスタート](#クイックスタート)
- [言語サポート](#言語サポート)
- [主な機能](#主な機能)
- [インストール](#インストール)
- [設定](#設定)
- [使用ガイド](#使用ガイド)
- [サポートされているLLMプロバイダー](#サポートされているllmプロバイダー)
- [ネットワークの使用とデータ処理](#ネットワークの使用とデータ処理)
- [トラブルシューティング](#トラブルシューティング)
- [貢献](#貢献)
- [メンテナンス用ドキュメント](#メンテナンス用ドキュメント)
- [ライセンス](#ライセンス)

## クイックスタート

1.  **インストールと有効化**: Obsidian コミュニティプラグインから入手します。
2.  **LLM の設定**: `設定 -> Notemd` で LLM プロバイダー (OpenAI や Ollama など) を選択し、API キー/URL を入力します。
3.  **サイドバーを開く**: 左側のツールバーにある Notemd 魔法の杖アイコンをクリックしてサイドバーを開きます。
4.  **ノートを処理**: ノートを開き、サイドバーの **「ファイルを処理 (リンク追加)」** をクリックすると、主要概念に `[[wiki-links]]` が自動追加されます。
5.  **クイックワークフローを実行**: デフォルトの **「One-Click Extract」** ボタンを使用すると、処理、一括生成、Mermaid 修復をワンストップで実行できます。

完了です！Web 検索、翻訳、コンテンツ生成などの機能をアンロックするために設定を探索してください。

## 言語サポート

### 言語動作契約

| 項目 | 制御範囲 | デフォルト | 説明 |
|---|---|---|---|
| `UI Locale` | プラグインのインターフェース文言のみ | `auto` | Obsidian の言語に従います。現在の UI パックは `en`, `zh-CN`, `zh-TW` です。 |
| `タスク出力言語` | LLM の出力（リンク、要約、翻訳先など） | `en` | 全局設定またはタスクごとに設定可能です。 |
| `自動翻訳を無効化` | 翻訳以外のタスクで原文の文脈を保持 | `false` | 明示的な「翻訳」タスクは指定言語で実行されます。 |

- 公式ドキュメントは英語と簡体字中国語で維持されており、30以上の言語をフルサポートしています。
- すべてのサポート言語は上部のヘッダーにリンクされています。

## 主な機能

### AI駆動のドキュメント処理
- **マルチLLMサポート**: クラウドおよびローカルの各種LLMプロバイダーに接続。
- **スマートチャンキング**: 長い文書を自動的に適切なサイズに分割して処理。
- **コンテンツの保持**: 構造やリンクを追加しつつ、元の書式を維持。
- **リトライロジック**: 失敗したAPI呼び出しの自動再試行（オプション）。
- **中国向けプリセット**: `Qwen`, `Doubao`, `Moonshot` などのプロバイダーを内蔵。

### ナレッジグラフの強化
- **自動Wikiリンク**: LLMの出力に基づき、ノート内の重要概念を識別し `[[リンク]]` を追加。
- **概念ノートの作成**: 見つかった概念に対して、指定フォルダに新しいノートを自動作成。

### 翻訳
- **AI翻訳**: 設定されたLLMを使用してノートの内容を翻訳。
- **一括翻訳**: 選択したフォルダ内の全ファイルをワンクリックで翻訳。

### Webリサーチとコンテンツ生成
- **Web検索と要約**: Tavily または DuckDuckGo を使用した検索とLLMによる要約。
- **タイトルから生成**: ノートのタイトルからAIがコンテンツを生成し、既存のテキストを置換。
- **Mermaid 自動修復**: 生成された Mermaid 図の構文を自動的に修正。

## インストール
1. Obsidian **設定** → **コミュニティプラグイン** を開きます。
2. 「制限モード」がオフであることを確認します。
3. **閲覧** をクリックし、「Notemd」を検索します。
4. **インストール** をクリックし、その後 **有効化** します。

## ライセンス
MIT ライセンス - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

---
*Notemd v1.8.0 - AIであなたのObsidianナレッジグラフを強化しましょう。*
