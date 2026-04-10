
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Plugin Notemd para Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Leia a documentação em mais idiomas: [Centro de Idiomas](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Melhoria do Conhecimento Multilíngue com IA
==================================================
```

Uma maneira fácil de criar sua própria base de conhecimento!

O Notemd aprimora seu fluxo de trabalho no Obsidian integrando-se a vários Modelos de Linguagem de Grande Porte (LLMs) para processar suas notas multilíngues, gerar automaticamente links wiki para conceitos-chave, criar notas de conceitos correspondentes, realizar pesquisas na web, ajudando você a construir grafos de conhecimento poderosos e muito mais.

**Versão:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

## Índice
- [Início Rápido](#início-rápido)
- [Suporte a Idiomas](#suporte-a-idiomas)
- [Recursos](#recursos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Guia de Uso](#guia-de-uso)
- [Provedores de LLM Suportados](#provedores-de-llm-suportados)
- [Uso de Rede e Tratamento de Dados](#uso-de-rede-e-tratamento-de-dados)
- [Solução de Problemas](#solução-de-problemas)
- [Como Contribuir](#como-contribuir)
- [Documentação para Mantenedores](#documentação-para-mantenedores)
- [Licença](#licença)

## Início Rápido

1.  **Instalar e Ativar**: Obtenha o plugin na loja da comunidade do Obsidian.
2.  **Configurar LLM**: Vá em `Configurações -> Notemd`, selecione seu provedor de LLM (como OpenAI ou um local como Ollama) e insira sua chave API/URL.
3.  **Abrir Barra Lateral**: Clique no ícone da varinha mágica do Notemd na barra lateral esquerda para abrir a visualização.
4.  **Processar uma Nota**: Abra qualquer nota e clique em **"Processar arquivo (Adicionar links)"** na barra lateral para adicionar automaticamente `[[wiki-links]]`.
5.  **Executar Fluxo de Trabalho Rápido**: Use o botão padrão **"One-Click Extract"** para encadear processamento, geração em lote e limpeza Mermaid em um único ponto.

Isso é tudo! Explore as configurações para desbloquear mais recursos como pesquisa na web, tradução e geração de conteúdo.

## Suporte a Idiomas

### Contrato de Comportamento de Idioma

| Aspecto | Escopo | Padrão | Notas |
|---|---|---|---|
| `UI Locale` | Apenas texto da interface (configurações, barra lateral) | `auto` | Segue o idioma do Obsidian; catálogos atuais: `en`, `zh-CN`, `zh-TW`. |
| `Task Output Language` | Saída de tarefas gerada por LLM (links, resumos) | `en` | Pode ser global ou por tarefa. |
| `Disable auto translation` | Tarefas que não são de tradução mantêm o contexto original | `false` | Tarefas explícitas de `Traduzir` ainda aplicam o idioma de destino. |

- A documentação oficial é mantida em inglês e chinês simplificado, com suporte completo para mais de 30 idiomas.
- Todos os idiomas suportados estão vinculados no cabeçalho acima.

## Principais Recursos

### Processamento de Documentos com IA
- **Suporte Multi-LLM**: Conecte-se a vários provedores de LLM na nuvem e locais.
- **Divisão Inteligente**: Divide automaticamente documentos grandes em partes gerenciáveis.
- **Preservação de Conteúdo**: Mantém a formatação original enquanto adiciona estrutura e links.
- **Lógica de Repetição**: Reentrada automática opcional para chamadas de API com falha.
- **Predefinições para China**: Inclui provedores como `Qwen`, `Doubao`, `Moonshot`, etc.

### Aprimoramento do Grafo de Conhecimento
- **Wiki-Linking Automático**: Identifica e adiciona links wiki aos conceitos principais.
- **Criação de Notas de Conceito**: Cria automaticamente novas notas para conceitos descobertos.

### Tradução
- **Tradução com IA**: Traduz o conteúdo das notas usando o LLM configurado.
- **Tradução em Lote**: Traduz todos os arquivos dentro de uma pasta selecionada.

### Pesquisa na Web e Geração de Conteúdo
- **Pesquisa na Web**: Realiza buscas via Tavily ou DuckDuckGo e resume os resultados.
- **Geração a partir do Título**: Usa o título da nota para gerar conteúdo inicial.
- **Auto-Correção Mermaid**: Repara automaticamente a sintaxe de diagramas Mermaid gerados.

## Instalação
1. Vá em **Configurações** → **Plugins da comunidade**.
2. Desative o "Modo restrito".
3. Clique em **Procurar** e pesquise por "Notemd".
4. Clique em **Instalar** e depois em **Ativar**.

## Licença
Licença MIT - Consulte o arquivo [LICENSE](LICENSE) para detalhes.

---
*Notemd v1.8.0 - Melhore seu grafo de conhecimento no Obsidian com IA.*
