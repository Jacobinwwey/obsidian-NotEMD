
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Obsidian용 Notemd 플러그인

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברי트](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

다른 언어 문서: [Language Hub](./docs/i18n/README.md)를 참조하세요.

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
      AI 기반 다국어 지식 강화 도구
==================================================
```

나만의 지식 베이스를 만드는 가장 쉬운 방법!

Notemd는 다양한 거대 언어 모델(LLM)과 통합되어 Obsidian 워크플로우를 강화합니다. 다국어 노트 처리를 지원하며, 핵심 개념에 대한 위키 링크 자동 생성, 대응하는 개념 노트 생성, 웹 검색 및 요약, 번역, Mermaid 마인드맵 요약 등을 통해 강력한 지식 그래프 구축을 돕습니다.

**버전:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## 목차
- [빠른 시작](#빠른-시작)
- [언어 지원](#언어-지원)
- [주요 기능](#주요-기능)
- [설치](#설치)
- [설정](#설정)
- [사용 가이드](#사용-가이드)
- [지원되는 LLM 제공업체](#지원되는-llm-제공업체)
- [네트워크 사용 및 데이터 처리](#네트워크-사용-및-데이터-처리)
- [문제 해결](#문제-해결)
- [기여하기](#기여하기)
- [유지 관리자 문서](#유지-관리자-문서)
- [라이선스](#라이선스)

## 빠른 시작

1.  **설치 및 활성화**: Obsidian 커뮤니티 플러그인 마켓에서 설치합니다.
2.  **LLM 설정**: `설정 -> Notemd`에서 LLM 제공업체(예: OpenAI 또는 로컬 Ollama)를 선택하고 API 키/URL을 입력합니다.
3.  **사이드바 열기**: 왼쪽 툴바에서 Notemd 마법 지팡이 아이콘을 클릭하여 사이드바를 엽니다.
4.  **노트 처리**: 노트를 열고 사이드바에서 **"파일 처리 (링크 추가)"**를 클릭하면 핵심 개념에 `[[wiki-links]]`가 자동으로 추가됩니다.
5.  **빠른 워크플로우 실행**: 기본 제공되는 **"One-Click Extract"** 버튼을 사용하면 처리, 일괄 생성, Mermaid 복구를 한 번에 실행할 수 있습니다.

완료되었습니다! 웹 검색, 번역, 콘텐츠 생성 등 더 많은 기능을 활용하려면 설정을 살펴보세요.

## 언어 지원

### 언어 동작 규약

| 항목 | 제어 범위 | 기본값 | 설명 |
|---|---|---|---|
| `UI Locale` | 플러그인 인터페이스 텍스트만 해당 | `auto` | Obsidian 언어 설정을 따릅니다. 현재 `en`, `zh-CN`, `zh-TW`를 지원합니다. |
| `작업 출력 언어` | LLM 출력 결과물(링크, 요약 등) | `en` | 전체 또는 작업별로 언어를 설정할 수 있습니다. |
| `자동 번역 비활성화` | 번역 외 작업에서 원문 문맥 유지 | `false` | 명시적인 '번역' 작업은 지정된 언어로 수행됩니다. |

- 공식 문서는 영어와 简体中文으로 관리되며, 30개 이상의 언어를 지원합니다.
- 지원되는 모든 언어는 상단 헤더에 링크되어 있습니다.

## 주요 기능

### AI 기반 문서 처리
- **멀티 LLM 지원**: 다양한 클라우드 및 로컬 LLM 제공업체 연결.
- **스마트 청킹**: 대용량 문서를 자동으로 적절한 크기로 나누어 처리.
- **콘텐츠 보존**: 구조와 링크를 추가하면서 원본 서식 유지.
- **재시도 로직**: API 호출 실패 시 자동 재시도 옵션 제공.
- **중국 지역 프리셋**: `Qwen`, `Doubao`, `Moonshot` 등 제공업체 내장.

### 지식 그래프 강화
- **자동 위키 링크**: LLM 분석을 통해 노트 내 주요 개념을 식별하고 `[[링크]]` 추가.
- **개념 노트 생성**: 발견된 개념에 대해 지정된 폴더에 새 노트를 자동 생성.

### 번역
- **AI 번역**: 설정된 LLM을 사용하여 노트 내용을 번역.
- **일괄 번역**: 선택한 폴더 내의 모든 파일을 한 번에 번역.

### 웹 리서치 및 콘텐츠 생성
- **웹 검색 및 요약**: Tavily 또는 DuckDuckGo를 통한 검색 및 요약.
- **제목 기반 생성**: 노트 제목을 기반으로 AI가 내용을 생성하고 기존 텍스트 대체.
- **Mermaid 자동 복구**: 생성된 Mermaid 다이어그램의 문법 오류 자동 수정.

## 설치
1. Obsidian **설정** → **커뮤니티 플러그인**을 엽니다.
2. "제한 모드"가 꺼져 있는지 확인합니다.
3. **탐색**을 클릭하고 "Notemd"를 검색합니다.
4. **설치**를 클릭한 후 **활성화**합니다.

## 라이선스
MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---
*Notemd v1.8.0 - AI로 Obsidian 지식 그래프를 강화하세요.*
