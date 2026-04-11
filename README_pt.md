![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Plugin Notemd para Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Leia a documentação em outros idiomas: [Centro de Idiomas](./docs/i18n/README.md)

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

O Notemd aprimora seu fluxo de trabalho no Obsidian integrando-se a vários Modelos de Linguagem de Grande Porte (LLM) para processar suas notas multilíngues, gerar automaticamente links wiki para conceitos-chave, criar notas de conceitos correspondentes, realizar pesquisas na web e ajudá-lo a construir grafos de conhecimento poderosos.

**Versão:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

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
4.  **Processar uma Nota**: Abra qualquer nota e clique em **"Processar arquivo (Adicionar links)"** na barra lateral para adicionar automaticamente `[[wiki-links]]` aos conceitos-chave.
5.  **Executar Fluxo de Trabalho Rápido**: Use o botão padrão **"One-Click Extract"** para encadear processamento, geração em lote e limpeza Mermaid a partir de um único ponto de entrada.

Isso é tudo! Explore as configurações para desbloquear mais recursos como pesquisa na web, tradução e geração de conteúdo.

## Suporte a Idiomas

### Contrato de Comportamento de Idioma

| Aspecto | Escopo | Padrão | Notas |
|---|---|---|---|
| `UI Locale` | Apenas texto da interface (configurações, barra lateral, avisos, diálogos) | `auto` | Segue o idioma do Obsidian; catálogos atuais: `en`, `zh-CN`, `zh-TW`. |
| `Task Output Language` | Saída de tarefas gerada por LLM (links, resumos, geração, extração, destino da tradução) | `en` | Pode ser global ou por tarefa quando `Usar idiomas diferentes para tarefas` estiver ativado. |
| `Disable auto translation` | Tarefas que não são de tradução mantêm o contexto original | `false` | Tarefas explícitas de `Traduzir` ainda aplicam o idioma de destino configurado. |
| Locale fallback | Resolução de chaves de UI ausentes | locale -> `en` | Mantém a UI estável quando algumas chaves não estão traduzidas. |

- A documentação oficial é mantida em inglês e chinês simplificado, com suporte completo para mais de 30 idiomas.
- Todos os idiomas suportados estão vinculados no cabeçalho acima.
- Mais detalhes e diretrizes de contribuição são rastreados no [Centro de Idiomas](./docs/i18n/README.md).

## Recursos

### Processamento de Documentos com IA
- **Suporte Multi-LLM**: Conecte-se a vários provedores de LLM na nuvem e locais (veja [Provedores de LLM Suportados](#provedores-de-llm-suportados)).
- **Divisão Inteligente (Smart Chunking)**: Divide automaticamente documentos grandes em partes gerenciáveis baseadas na contagem de palavras para processamento.
- **Preservação de Conteúdo**: Mantém a formatação original enquanto adiciona estrutura e links.
- **Acompanhamento de Progresso**: Atualizações em tempo real através da barra lateral do Notemd ou de um modal de progresso.
- **Operações Canceláveis**: Cancele qualquer tarefa de processamento (individual ou em lote) iniciada na barra lateral através de seu botão de cancelamento dedicado. Operações da paleta de comandos usam um modal que também pode ser cancelado.
- **Configuração Multi-Modelo**: Use diferentes provedores de LLM *e* modelos específicos para diferentes tarefas (Adicionar links, Pesquisa, Gerar título, Traduzir) ou use um único provedor para tudo.
- **Chamadas de API Estáveis (Logica de Repetição)**: Ative opcionalmente repetições automáticas para chamadas de API de LLM com falha, com intervalos e limites de tentativas configuráveis.
- **Testes de Conexão de Provedor Resilientes**: Se o primeiro teste falhar devido a uma desconexão temporária, o Notemd agora recorre à sequência de repetição estável antes de falhar, cobrindo transportes compatíveis com OpenAI, Anthropic, Google, Azure OpenAI e Ollama.
- **Recurso de Transporte de Ambiente de Execução**: Quando uma solicitação de longa duração cai por `requestUrl` com erros de rede transitórios como `ERR_CONNECTION_CLOSED`, o Notemd agora tenta novamente a mesma tentativa via um transporte de reserva específico do ambiente antes de entrar no loop de repetição configurado: as versões de desktop usam Node `http/https`, enquanto os ambientes não-desktop usam `fetch` do navegador. Isso reduz falhas falsas em gateways lentos e proxies reversos.
- **Reforço da Cadeia de Solicitação Longa Estável compatível com OpenAI**: No modo estável, chamadas compatíveis com OpenAI agora usam uma ordem explícita de 3 estágios para cada tentativa: transporte de streaming direto primário, depois transporte direto não-streaming, seguido por reserva `requestUrl` (que ainda pode ser atualizada para parsing em streaming quando necessário). Isso reduz falsos negativos onde provedores completam respostas em buffer mas os canais de streaming são instáveis.
- **Reserva de Streaming Sensível ao Protocolo em todas as APIs de LLM**: Tentativas de reserva de longa duração agora são atualizadas para um parsing em streaming sensível ao protocolo em cada caminho de LLM integrado, não apenas nos endpoints compatíveis com OpenAI. O Notemd agora lida com SSE estilo OpenAI/Azure, streaming de mensagens Anthropic, respostas SSE Google Gemini e streams NDJSON Ollama tanto em desktop `http/https` quanto em `fetch` não-desktop, e os pontos de entrada diretos restantes estilo OpenAI reutilizam o mesmo caminho de reserva compartilhado.
- **Presets Prontos para a China**: Os presets integrados agora cobrem `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` e `SiliconFlow`, além dos provedores globais e locais existentes.
- **Processamento em Lote Confiável**: Lógica de processamento simultâneo aprimorada com **chamadas de API escalonadas** para evitar erros de limite de taxa e garantir desempenho estável durante grandes trabalhos em lote. A nova implementação garante que as tarefas sejam iniciadas em intervalos diferentes em vez de todas ao mesmo tempo.
- **Relatórios de Progresso Precisos**: Corrigido um erro onde a barra de progresso podia travar, garantindo que a interface do usuário sempre reflita o status real da operação.
- **Processamento em Lote Paralelo Robusto**: Resolvido um problema onde as operações em lote paralelas paravam prematuramente, garantindo que todos os arquivos sejam processados de forma confiável e eficiente.
- **Precisão da Barra de Progresso**: Corrigido um erro onde a barra de progresso para o comando "Criar link Wiki e Gerar nota" ficava travada em 95%, garantindo que agora mostre 100% corretamente na conclusão.
- **Depuração de API Aprimorada**: O "Modo de Depuração de Erros de API" agora captura corpos de resposta completos de provedores de LLM e serviços de pesquisa (Tavily/DuckDuckGo) e também registra uma linha do tempo de transporte por tentativa com URLs de solicitação saneadas, duração decorrida, cabeçalhos de resposta, corpos de resposta parciais, conteúdo de stream parcial analisado e rastreamentos de pilha para melhor solução de problemas em reservas OpenAI, Anthropic, Google, Azure OpenAI e Ollama.
- **Painel do Modo Desenvolvedor**: As configurações agora incluem um painel de diagnóstico dedicado apenas para desenvolvedores que permanece oculto, a menos que o "Modo desenvolvedor" seja ativado. Suporta a seleção de caminhos de chamada de diagnóstico e a execução de sondas de estabilidade repetidas para o modo selecionado.
- **Barra Lateral Redesenhada**: As ações integradas são agrupadas em seções focadas com rótulos mais claros, status em tempo real, progresso cancelável e logs copiáveis para reduzir a desordem. O rodapé de progresso/log agora permanece visível mesmo quando cada seção está expandida, e o estado pronto usa uma trilha de progresso de espera mais clara.
- **Aprimoramento da Interação e Legibilidade da Barra Lateral**: Os botões da barra lateral agora oferecem um feedback mais claro ao passar o mouse/pressionar/focar, e os botões coloridos de Chamada para Ação (CTA) (incluindo `One-Click Extract` e `Batch generate from titles`) usam um contraste de texto mais forte para melhor legibilidade em diferentes temas.
- **Mapeamento de CTA para Arquivo Único**: O estilo CTA colorido agora é reservado apenas para ações de arquivo único. Ações de nível de lote/pasta e fluxos de trabalho mistos usam um estilo não-CTA para reduzir cliques errados no escopo da ação.
- **Fluxos de Trabalho Personalizados com Um Clique**: Transforme utilitários integrados da barra lateral em botões personalizados reutilizáveis com nomes definidos pelo usuário e cadeias de ações montadas. Um fluxo de trabalho padrão `One-Click Extract` está incluído por padrão.


### Aprimoramento do Grafo de Conhecimento
- **Wiki-Linking Automático**: Identifica e adiciona `[[wiki-links]]` aos conceitos principais dentro de suas notas processadas baseando-se na saída do LLM.
- **Criação de Notas de Conceito (Opcional e Personalizável)**: Cria automaticamente novas notas para os conceitos descobertos em uma pasta específica do vault.
- **Percursos de Saída Personalizáveis**: Configure percursos relativos separados dentro do seu vault para salvar arquivos processados e notas de conceito recém-criadas.
- **Nomes de Arquivos de Saída Personalizáveis (Adicionar Links)**: Sobrescreva opcionalmente o **arquivo original** ou use um sufixo/string de substituição personalizado em vez do padrão `_processed.md` ao processar arquivos para links.
- **Manutenção da Integridade dos Links**: Manuseio básico para atualizar links quando notas são renomeadas ou excluídas dentro do vault.
- **Extração de Conceito Pura**: Extrai conceitos e cria as notas de conceito correspondentes sem modificar o documento original. Ideal para popular uma base de conhecimento a partir de documentos existentes sem alterá-los. Este recurso possui opções configuráveis para criar notas de conceito mínimas e adicionar backlinks.


### Tradução

- **Tradução Impulsionada por IA**:
    - Traduz o conteúdo das notas usando o LLM configurado.
    - **Suporte a Arquivos Grandes**: Divide automaticamente arquivos grandes em pedaços menores baseando-se na configuração de `Contagem de palavras por pedaço` antes de enviá-los ao LLM. Os pedaços traduzidos são então combinados perfeitamente em um único documento.
    - Suporta tradução entre vários idiomas.
    - Idioma de destino personalizável nas configurações ou na interface do usuário.
    - Abre automaticamente o texto traduzido à direita do texto original para facilitar a leitura.
- **Tradução em Lote**:
    - Traduz todos os arquivos dentro de uma pasta selecionada.
    - Suporta processamento paralelo quando o "Parallelismo em Lote" está ativado.
    - Usa prompts personalizados para tradução, se configurado.
	- Adiciona uma opção "Traduzir esta pasta em lote" ao menu de contexto do explorador de arquivos.
- **Desativar tradução automática**: Quando ativado, tarefas que não são de tradução não forçarão mais as saídas para um idioma específico, preservando o contexto do idioma original. A tarefa explícita "Traduzir" ainda executará a tradução conforme configurado.


### Pesquisa na Web e Geração de Conteúdo
- **Pesquisa na Web e Resumo**:
    - Realiza pesquisas na web usando Tavily (requer chave API) ou DuckDuckGo (experimental).
    - **Robustez de Pesquisa Aprimorada**: A pesquisa DuckDuckGo agora possui uma lógica de parsing aprimorada (DOMParser com reserva Regex) para lidar com mudanças de layout e garantir resultados confiáveis.
    - Resume os resultados da pesquisa usando o LLM configurado.
    - O idioma de saída do resumo pode ser personalizado nas configurações.
    - Adiciona os resumos à nota atual.
    - Limite de tokens configurável para o conteúdo de pesquisa enviado ao LLM.
- **Geração de Conteúdo a partir do Título**:
    - Use o título da nota para gerar conteúdo inicial via LLM, substituindo o conteúdo existente.
    - **Pesquisa Opcional**: Configure se deseja realizar uma pesquisa na web (usando o provedor selecionado) para fornecer contexto para a geração.
- **Geração de Conteúdo em Lote a partir de Títulos**: Gera conteúdo para todas as notas dentro de uma pasta selecionada baseando-se em seus títulos (respeita a configuração de pesquisa opcional). Arquivos processados com sucesso são movidos para uma **subpasta "concluída" configurável** (ex: `[nome_da_pasta]_complete` ou um nome personalizado) para evitar o reprocessamento.
- **Acoplamento de Correção Automática Mermaid**: Quando o Mermaid Auto-Fix está ativado, fluxos de trabalho relacionados ao Mermaid agora reparam automaticamente arquivos gerados ou pastas de saída após o processamento. Isso cobre os fluxos de Processar, Gerar a partir do título, Geração em lote a partir de títulos, Pesquisa e Resumo, Resumir como Mermaid e Traduzir.


### Recursos Utilitários
- **Resumir como diagrama Mermaid**:
    - Este recurso permite resumir o conteúdo de uma nota em um diagrama Mermaid.
    - O idioma de saída do diagrama Mermaid pode ser personalizado nas configurações.
    - **Pasta de Saída Mermaid**: Configure a pasta onde os arquivos de diagrama Mermaid gerados serão salvos.
    - **Traduzir Resumo para Saída Mermaid**: Traduz opcionalmente o conteúdo do diagrama Mermaid gerado para o idioma de destino configurado.
    
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Correção Simples de Formatação de Fórmulas**:
    - Corrige rapidamente fórmulas matemáticas de linha única delimitadas por um único `$` para blocos padrão de duplo `$$`.
    - **Arquivo Único**: Processa o arquivo atual através do botão da barra lateral ou da paleta de comandos.
    - **Correção em Lote**: Processa todos os arquivos em uma pasta selecionada através do botão da barra lateral ou da paleta de comandos.

- **Verificar Duplicatas no Arquivo Atual**: Este comando ajuda a identificar possíveis termos duplicados dentro do arquivo ativo.
- **Detecção de Duplicatas**: Verificação básica de palavras duplicadas dentro do conteúdo do arquivo processado no momento (resultados registrados no console).
- **Verificar e Remover Notas de Conceito Duplicadas**: Identifica possíveis notas duplicadas dentro da **Pasta de Notas de Conceito** configurada baseando-se em correspondências exatas de nomes, plurais, normalização e contenção de palavras únicas em comparação com notas fora da pasta. O escopo da comparação (quais notas fora da pasta de conceito são verificadas) pode ser configurado para **todo o vault**, **pastas incluídas específicas** ou **todas as pastas exceto as especificamente excluídas**. Apresenta uma lista detalhada com motivos e arquivos em conflito, solicitando confirmação antes de mover as duplicatas identificadas para a lixeira do sistema. Mostra o progresso durante a remoção.
- **Correção Mermaid em Lote**: Aplica correções de sintaxe Mermaid e LaTeX a todos os arquivos Markdown dentro de uma pasta selecionada pelo usuário.
    - **Pronto para Fluxo de Trabalho**: Pode ser usado como um utilitário independente ou como um passo dentro de um botão de fluxo de trabalho personalizado com um clique.
    - **Relatório de Erros**: Gera um relatório `mermaid_error_{nome_da_pasta}.md` listando arquivos que ainda contêm possíveis erros Mermaid após o processamento.
    - **Mover Arquivos com Erros**: Move opcionalmente arquivos com erros detectados para uma pasta especificada para revisão manual.
    - **Detecção Inteligente**: Agora verifica inteligentemente arquivos em busca de erros de sintaxe usando `mermaid.parse` antes de tentar correções, economizando tempo de processamento e evitando edições desnecessárias.
    - **Processamento Seguro**: Garante que correções de sintaxe sejam aplicadas exclusivamente a blocos de código Mermaid, evitando modificações acidentais em tabelas Markdown ou outros conteúdos. Inclui proteções robustas para proteger a sintaxe da tabela (ex: `| :--- |`) de correções de depuração agressivas.
    - **Modo de Depuração Profunda (Deep-Debug)**: Se os erros persistirem após a correção inicial, um modo avançado de depuração profunda é acionado. Este modo lida com casos limítrofes complexos, incluindo:
        - **Integração de Comentários**: Mescla automaticamente comentários finais (começando com `%`) no rótulo da aresta (ex: `A -- Label --> B; % Comentário` torna-se `A -- "Label(Comentário)" --> B;`).
        - **Setas Malformadas**: Corrige setas absorvidas por aspas (ex: `A -- "Label -->" B` torna-se `A -- "Label" --> B`).
        - **Subgrafos em Linha**: Converte rótulos de subgrafos em linha para rótulos de arestas.
        - **Correção de Seta Inversa**: Corrige setas `X <-- Y` não padrão para `Y --> X`.
        - **Correção de Palavra-chave de Direção**: Garante que a palavra-chave `direction` esteja em minúsculas dentro dos subgrafos (ex: `Direction TB` -> `direction TB`).
        - **Conversão de Comentários**: Converte comentários `//` em rótulos de arestas (ex: `A --> B; // Comentário` -> `A -- "Comentário" --> B;`).
        - **Correção de Rótulos Duplicados**: Simplifica rótulos entre colchetes repetidos (ex: `Node["Label"]["Label"]` -> `Node["Label"]`).
        - **Correção de Seta Inválida**: Converte sintaxe de seta inválida `--|>` para a padrão `-->`.
        - **Manuseio Robusto de Rótulos e Notas**: Melhor manuseio para rótulos contendo caracteres especiais (como `/`) e melhor suporte para sintaxe de notas personalizadas (`note for ...`), garantindo que artefatos como colchetes finais sejam removidos de forma limpa.
        - **Modo de Correção Avançado**: Inclui correções robustas para rótulos de nós sem aspas contendo espaços, caracteres especiais ou colchetes aninhados (ex: `Node[Label [Texto]]` -> `Node["Label [Texto]"]`), garantindo compatibilidade com diagramas complexos como caminhos de Evolução Estelar. Também corrige rótulos de arestas malformados (ex: `--["Label["-->` para `-- "Label" -->`). Converte adicionalmente comentários em linha (`Consensus --> Adaptive; # Algum consenso avançado` para `Consensus -- "Algum consenso avançado" --> Adaptive`) e corrige aspas incompletas em finais de linha (`;"` no final substituído por `"]`).
                        - **Conversão de Notas**: Converte automaticamente comentários `note right/left of` e comentários `note :` independentes em definições e conexões de nós Mermaid padrão (ex: `note right of A: texto` torna-se `NoteA["Note: texto"]` vinculado a `A`), prevenindo erros de sintaxe e melhorando o layout. Agora suporta tanto links de seta (`-->`) quanto links sólidos (`---`).
                        - **Suporte Estendido a Notas**: Converte automaticamente `note for Node "Conteúdo"` e `note of Node "Conteúdo"` em nós de notas vinculados padrão (ex: `NoteNode[" Conteúdo"]` vinculado a `Node`), garantindo compatibilidade com sintaxe estendida pelo usuário.
                        - **Correção de Notas Aprimorada**: Renomeia automaticamente notas com numeração sequencial (ex: `Note1`, `Note2`) para evitar problemas de alias quando múltiplas notas estão presentes.
                        - **Correção de Paralelogramo/Forma**: Corrige formas de nós malformadas como `[/["Label["/]` para a padrão `["Label"]`, garantindo compatibilidade com o conteúdo gerado.
                        - **Padronizar Rótulos com Pipe**: Corrige e padroniza automaticamente rótulos de arestas contendo pipes, garantindo que estejam devidamente entre aspas (ex: `-->|Texto|` torna-se `-->|"Texto"|` e `-->|Math|^2|` torna-se `-->|"Math|^2"|`).
        - **Correção de Pipe Mal Posicionado**: Corrige rótulos de aresta mal posicionados que aparecem antes da seta (ex: `>|"Label"| A --> B` torna-se `A -->|"Label"| B`).
                - **Mesclar Rótulos Duplos**: Detecta e mescla rótulos duplos complexos em uma única aresta (ex: `A -- Label1 -- Label2 --> B` ou `A -- Label1 -- Label2 --- B`) em um único rótulo limpo com quebras de linha (`A -- "Label1<br>Label2" --> B`).
                        - **Correção de Rótulo sem Aspas**: Coloca aspas automaticamente em rótulos de nós que contêm caracteres potencialmente problemáticos (ex: aspas, sinais de igual, operadores matemáticos), mas que carecem de aspas externas (ex: `Plot[Plot "A"]` torna-se `Plot["Plot "A""]`), prevenendo erros de renderização.
                        - **Correção de Nó Intermediário**: Divide arestas que contêm uma definição de nó intermediário em duas arestas separadas (ex: `A -- B[...] --> C` torna-se `A --> B[...]` e `B[...] --> C`), garantindo sintaxe Mermaid válida.
                        - **Correção de Rótulo Concatenado**: Corrige robustamente definições de nós onde o ID é concatenado com o rótulo (ex: `SubdivideSubdivide...` torna-se `Subdivide["Subdivide..."]`), mesmo quando precedido por rótulos com pipe ou quando a duplicação não é exata, validando contra os IDs de nós conhecidos.
                        - **Extrair Texto Original Específico**:
                            - Defina uma lista de perguntas nas configurações.
                            - Extrai segmentos de texto literais da nota ativa que respondem a essas perguntas.
                            - **Modo de Consulta Mesclada**: Opção para processar todas as perguntas em uma única chamada de API para maior eficiência.
                            - **Tradução**: Opção para incluir traduções do texto extraído na saída.
                            - **Saída Personalizada**: Caminho de salvamento e sufixo de nome de arquivo configuráveis para o arquivo de texto extraído.
- **Teste de Conexão de LLM**: Verifica as configurações de API para o provedor ativo.


## Instalação

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Via Loja da Comunidade (Marketplace) do Obsidian (Recomendado)
1. Abra as **Configurações** do Obsidian → **Plugins da comunidade**.
2. Certifique-se de que o "Modo restrito" esteja **desativado**.
3. Clique em **Procurar** plugins da comunidade e pesquise por "Notemd".
4. Clique em **Instalar**.
5. Uma vez instalado, clique em **Ativar**.

### Instalação Manual
1. Baixe os últimos recursos de lançamento na [página de lançamentos do GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Cada lançamento também inclui um `README.md` para referência, mas a instalação manual requer apenas `main.js`, `styles.css` e `manifest.json`.
2. Navegue até a pasta de configuração do seu vault do Obsidian: `<SeuVault>/.obsidian/plugins/`.
3. Crie uma nova pasta chamada `notemd`.
4. Copie `main.js`, `styles.css` e `manifest.json` para a pasta `notemd`.
5. Reinicie o Obsidian.
6. Vá em **Configurações** → **Plugins da comunidade** e ative o "Notemd".

## Configuração

Acesse as configurações do plugin através de:
**Configurações** → **Plugins da comunidade** → **Notemd** (Clique no ícone de engrenagem).

### Configuração do Provedor de LLM
1.  **Provedor Ativo**: Selecione o provedor de LLM que deseja usar no menu suspenso.
2.  **Configurações do Provedor**: Defina as configurações específicas para o provedor selecionado:
    *   **Chave API**: Necessária para a maioria dos provedores em nuvem (ex: OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). Não é necessária para o Ollama. Opcional para o LM Studio e o preset genérico `OpenAI Compatible` quando o seu endpoint aceita acesso anônimo ou chaves fictícias.
    *   **URL Base / Endpoint**: O endpoint da API para o serviço. Valores padrão são fornecidos, mas você pode precisar alterá-los para modelos locais (LMStudio, Ollama), gateways (OpenRouter, Requesty, OpenAI Compatible) ou implantações específicas do Azure. **Obrigatório para Azure OpenAI.**
    *   **Modelo**: O nome/ID do modelo específico a ser usado (ex: `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Certifique-se de que o modelo esteja disponível em seu endpoint/provedor.
    *   **Temperatura**: Controla a aleatoriedade da saída do LLM (0=determinístico, 1=criatividade máxima). Valores baixos (ex: 0.2-0.5) geralmente são melhores para tarefas estruturadas.
    *   **Versão da API (Apenas Azure)**: Necessária para implantações do Azure OpenAI (ex: `2024-02-15-preview`).
3.  **Testar Conexão**: Use o botão "Testar conexão" para o provedor ativo para verificar suas configurações. Provedores compatíveis com OpenAI agora usam verificações sensíveis ao provedor: endpoints como `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` e `OpenAI Compatible` sondam `chat/completions` diretamente, enquanto provedores com um endpoint `/models` confiável ainda podem usar a listagem de modelos primeiro. Se a primeira sonda falhar com uma desconexão de rede transitória como `ERR_CONNECTION_CLOSED`, o Notemd recorre automaticamente à sequência de repetição estável em vez de falhar imediatamente.
4.  **Gerenciar Configurações de Provedor**: Use os botões "Exportar provedores" e "Importar provedores" para salvar/carregar suas configurações de provedor de LLM em/de um arquivo `notemd-providers.json` dentro do diretório de configuração do plugin. Isso permite backup e compartilhamento fáceis.
5.  **Cobertura de Presets**: Além dos provedores originais, o Notemd agora inclui entradas de preset para `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` e um alvo genérico `OpenAI Compatible` para LiteLLM, vLLM, Perplexity, Vercel AI Gateway ou proxies personalizados.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Configuração Multi-Modelo
-   **Usar Provedores Diferentes para Tarefas**:
    *   **Desativado (Padrão)**: Usa o único "Provedor Ativo" (selecionado acima) para todas as tarefas.
    *   **Ativado**: Permite selecionar um provedor específico *e* opcionalmente sobrescrever o nome do modelo para cada tarefa ("Adicionar links", "Pesquisa e resumo", "Gerar a partir do título", "Traduzir", "Extrair conceitos"). Se o campo de sobrescrita de modelo para uma tarefa for deixado em branco, ele usará o modelo padrão configurado para o provedor selecionado dessa tarefa.
-   **Selecionar idiomas diferentes para tarefas diferentes**:
    *   **Desativado (Padrão)**: Usa o único "Idioma de saída" para todas as tarefas.
    *   **Ativado**: Permite selecionar um idioma específico para cada tarefa ("Adicionar links", "Pesquisa e resumo", "Gerar a partir do título", "Resumir como diagrama Mermaid", "Extrair conceitos").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Arquitetura de Idioma (UI Locale vs Task Output Language)

-   **UI Locale** controla apenas o texto da interface do plugin (rótulos de configurações, botões da barra lateral, avisos e diálogos). O modo `auto` padrão segue o idioma atual da interface do Obsidian.
-   **Task Output Language** controla a saída de tarefas gerada pelo modelo (links, resumos, geração de títulos, resumo Mermaid, extração de conceitos, destino da tradução).
-   **O modo de idioma por tarefa** permite que cada tarefa resolva seu próprio idioma de saída a partir de uma camada de política unificada, em vez de sobrescritas dispersas por módulo.
-   **Desativar tradução automática** mantém as tarefas que não são de tradução no contexto do idioma original, enquanto tarefas explícitas de tradução ainda aplicam o idioma de destino configurado.
-   Caminhos de geração relacionados ao Mermaid seguem a mesma política de idioma e ainda podem acionar o Mermaid Auto-Fix quando ativado.

### Configurações de Chamadas de API Estáveis
-   **Ativar Chamadas de API Estáveis (Lógica de Repetição)**:
    *   **Desativado (Padrão)**: A falha de uma única chamada de API interromperá a tarefa atual.
    *   **Ativado**: Repete automaticamente chamadas de API de LLM com falha (útil para problemas intermitentes de rede ou limites de taxa).
    *   **Reserva de Teste de Conexão**: Mesmo quando chamadas normais não estão sendo executadas em modo estável, os testes de conexão do provedor agora mudam para a mesma sequência de repetição após a primeira falha de rede transitória.
    *   **Reserva de Transporte em Tempo de Execução (Sensível ao Ambiente)**: Solicitações de tarefas de longa duração que caem transitoriamente por `requestUrl` agora tentam novamente a mesma tentativa através de uma reserva sensível ao ambiente primeiro. As versões de desktop usam Node `http/https`; os ambientes não-desktop usam `fetch` do navegador. Essas tentativas de reserva agora usam um parsing em streaming sensível ao protocolo através dos caminhos de LLM integrados, cobrindo SSE compatível com OpenAI, SSE Azure OpenAI, SSE Anthropic Messages, SSE Google Gemini e saída NDJSON Ollama, para que gateways lentos possam retornar pedaços do corpo mais cedo. Os pontos de entrada diretos restantes estilo OpenAI reutilizam o mesmo caminho de reserva compartilhado.
    *   **Ordem Estável compatível com OpenAI**: No modo estável, cada tentativa compatível com OpenAI agora segue `streaming direto -> direto sem stream -> requestUrl (com reserva de streaming quando necessário)` antes de ser contada como uma tentativa falha. Isso evita falhas excessivamente agressivas quando apenas um modo de transporte está instável.
-   **Intervalo de Repetição (segundos)**: (Visível apenas se ativado) Tempo de espera entre as tentativas de repetição (1-300 segundos). Padrão: 5.
-   **Máximo de Repetições**: (Visível apenas se ativado) Número máximo de tentativas de repetição (0-10). Padrão: 3.
-   **Modo de Depuração de Erros de API**:
    *   **Desativado (Padrão)**: Usa relatórios de erro padrão e concisos.
    *   **Ativado**: Ativa o registro detalhado de erros (semelhante à saída detalhada do DeepSeek) para todos os provedores e tarefas (incluindo Tradução, Pesquisa e Testes de Conexão). Isso inclui códigos de status HTTP, texto de resposta bruto, linhas do tempo de transporte de solicitação, URLs e cabeçalhos de solicitação saneados, durações de tentativas decorridas, cabeçalhos de resposta, corpos de resposta parciais, saída de stream parcial analisada e rastreamentos de pilha, o que é crucial para resolver problemas de conexão de API e resets de gateways a montante.
-   **Modo Desenvolvedor**:
    *   **Desativado (Padrão)**: Oculta todos os controles de diagnóstico apenas para desenvolvedores de usuários normais.
    *   **Ativado**: Mostra um painel de diagnóstico dedicado para desenvolvedores em Configurações.
-   **Diagnóstico de Provedor para Desenvolvedores (Solicitação Longa)**:
    *   **Modo de Chamada de Diagnóstico**: Escolha o caminho de tempo de execução por sonda. Provedores compatíveis com OpenAI suportam modos forçados adicionais (`streaming direto`, `bufferizado direto`, `apenas-requestUrl`), além dos modos de tempo de execução.
    *   **Executar Diagnóstico**: Executa uma sonda de solicitação longa com o modo de chamada selecionado e grava `Notemd_Provider_Diagnostic_*.txt` na raiz do vault.
    *   **Executar Teste de Estabilidade**: Repete a sonda para execuções configuráveis (1-10) usando o modo de chamada selecionado e salva um relatório de estabilidade agregado.
    *   **Tempo Limite de Diagnóstico**: Tempo limite configurável por execução (15-3600 segundos).
    *   **Por Que Usar**: Mais rápido que a reprodução manual quando um provedor passa no "Testar conexão", mas falha em tarefas reais de longa duração (ex: tradução em gateways lentos).
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Configurações Gerais

#### Saída de Arquivos Processados
-   **Personalizar Caminho de Salvamento de Arquivos Processados**:
    *   **Desactivado (Padrão)**: Arquivos processados (ex: `SuaNota_processed.md`) são salvos na *mesma pasta* da nota original.
    *   **Ativado**: Permite especificar um local de salvamento personalizado.
-   **Caminho da Pasta de Arquivos Processados**: (Visível apenas se ativado acima) Insira um *caminho relativo* dentro do seu vault (ex: `Notas Processadas` ou `Saida/LLM`) onde os arquivos processados devem ser salvos. As pastas serão criadas se não existirem. **Não use caminhos absolutos (como C:\...) ou caracteres inválidos.**
-   **Usar Nome de Arquivo de Saída Personalizado para 'Adicionar Links'**:
    *   **Desactivado (Padrão)**: Arquivos processados criados pelo comando 'Adicionar links' usam o sufixo padrão `_processed.md` (ex: `SuaNota_processed.md`).
    *   **Ativado**: Permite personalizar o nome do arquivo de saída usando a configuração abaixo.
-   **Sufixo / String de Substituição Personalizado**: (Visível apenas se ativado acima) Insira a string a ser usada para o nome do arquivo de saída.
    *   Se deixado em **branco**, o arquivo original será **sobrescrito** com o conteúdo processado.
    *   Se você inserir uma string (ex: `_linked`), ela será anexada ao nome base original (ex: `SuaNota_linked.md`). Certifique-se de que o sufixo não contenha caracteres de nome de arquivo inválidos.

-   **Remover Cercas de Código ao Adicionar Links**:
    *   **Desativado (Padrão)**: Cercas de código **(\`\\\`\`)** são mantidas no conteúdo ao adicionar links, e **(\`\\\`markdown)** será excluído automaticamente.
    *   **Ativado**: Remove cercas de código do conteúdo antes de adicionar links.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Saída de Notas de Conceito
-   **Personalizar Caminho de Notas de Conceito**:
    *   **Desactivado (Padrão)**: A criação automática de notas para `[[conceitos vinculados]]` está desativada.
    *   **Ativado**: Permite especificar uma pasta onde as novas notas de conceito serão criadas.
-   **Caminho da Pasta de Notas de Conceito**: (Visível apenas se ativado acima) Insira um *caminho relativo* dentro do seu vault (ex: `Conceitos` ou `Gerado/Topicos`) onde as novas notas de conceito devem ser salvas. As pastas serão criadas se não existirem. **Deve ser preenchido se a personalização estiver ativada.** **Não use caminhos absolutos ou caracteres inválidos.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Saída do Arquivo de Log de Conceitos
-   **Gerar Arquivo de Log de Conceitos**:
    *   **Desativado (Padrão)**: Nenhum arquivo de log é gerado.
    *   **Ativado**: Cria um arquivo de log listando as notas de conceito recém-criadas após o processamento. O formato é:
        ```
        gerar xx arquivos md de conceitos
        1. conceito1
        2. conceito2
        ...
        n. conceiton
        ```
-   **Personalizar Caminho de Salvamento do Arquivo de Log**: (Visível apenas quando "Gerar Arquivo de Log de Conceitos" estiver ativado)
    *   **Desactivado (Padrão)**: O arquivo de log é salvo no **Caminho da pasta de notas de conceito** (se especificado) ou na raiz do vault caso contrário.
    *   **Ativado**: Permite especificar uma pasta personalizada para o arquivo de log.
-   **Caminho da Pasta de Log de Conceitos**: (Visível apenas se ativado acima) Insira um *caminho relativo* dentro do seu vault (ex: `Logs/Notemd`) onde o arquivo de log deve ser salvo. **Deve ser preenchido se a personalização estiver ativada.**
-   **Personalizar Nome do Arquivo de Log**: (Visível apenas quando "Gerar Arquivo de Log de Conceitos" estiver ativado)
    *   **Desactivado (Padrão)**: O arquivo de log chama-se `Generate.log`.
    *   **Ativado**: Permite especificar um nome personalizado para o arquivo de log.
-   **Nome do Arquivo de Log de Conceitos**: (Visível apenas se ativado acima) Insira o nome do arquivo desejado (ex: `CriacaoDeConceitos.log`). **Deve ser preenchido se a personalização estiver ativada.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Tarefa de Extração de Conceitos
-   **Criar notas de conceito mínimas**:
    *   **Ativado (Padrão)**: Notas de conceito recém-criadas conterão apenas o título (ex: `# Conceito`).
    *   **Desactivado**: Notas de conceito podem incluir conteúdo adicional, como um backlink "Vinculado de", se não for desativado pela configuração abaixo.
-   **Adicionar backlink "Vinculado de"**:
    *   **Desativado (Padrão)**: Não adiciona um backlink ao documento de origem na nota de conceito durante a extração.
    *   **Ativado**: Adiciona uma seção "Vinculado de" com um backlink para o arquivo de origem.

#### Extrair Texto Original Específico
-   **Perguntas para extração**: Insira uma lista de perguntas (uma por linha) para as quais você deseja que a IA extraia respostas literais das suas notas.
-   **Traduzir saída para o idioma correspondente**:
    *   **Desativado (Padrão)**: Produz apenas o texto extraído em seu idioma original.
    *   **Ativado**: Adiciona uma tradução do texto extraído no idioma selecionado para esta tarefa.
-   **Modo de consulta mesclada**:
    *   **Desactivado**: Processa cada pergunta individualmente (maior precisão, mas mais chamadas de API).
    *   **Ativado**: Envia todas as perguntas em um único prompt (mais rápido e menos chamadas de API).
-   **Personalizar caminho de salvamento e nome de arquivo do texto extraído**:
    *   **Desactivado**: Salva na mesma pasta do arquivo original com o sufixo `_Extracted`.
    *   **Ativado**: Permite especificar uma pasta de saída e um sufixo de nome de arquivo personalizados.

#### Correção Mermaid em Lote
-   **Ativar Detecção de Erros Mermaid**:
    *   **Desativado (Padrão)**: A detecção de erros é ignorada após o processamento.
    *   **Ativado**: Verifica arquivos processados em busca de erros de sintaxe Mermaid remanescentes e gera um relatório `mermaid_error_{nome_da_pasta}.md`.
-   **Mover arquivos com erros Mermaid para a pasta especificada**:
    *   **Desativado**: Arquivos com erros permanecem no lugar.
    *   **Ativado**: Move qualquer arquivo que ainda contenha erros de sintaxe Mermaid após a tentativa de correção para uma pasta dedicada para revisão manual.
-   **Caminho da pasta de erros Mermaid**: (Visível se ativado acima) A pasta para onde os arquivos com erro serão movidos.

#### Parâmetros de Processamento
-   **Ativar Paralelismo em Lote**:
    *   **Desactivado (Padrão)**: Tarefas de processamento em lote (como "Processar pasta" ou "Geração em lote a partir de títulos") processam arquivos um por um (em série).
    *   **Ativado**: Permite que o plugin processe múltiplos arquivos simultaneamente, o que pode acelerar significativamente grandes trabalhos em lote.
-   **Concorrência em Lote**: (Visível apenas quando o paralelismo está ativado) Define o número máximo de arquivos a serem processados em paralelo. Números maiores podem ser mais rápidos, mas consomem mais recursos e podem atingir limites de taxa de API. (Padrão: 1, Faixa: 1-20)
-   **Tamanho do Lote**: (Visível apenas quando o paralelismo está ativado) O número de arquivos a serem agrupados em um único lote. (Padrão: 50, Faixa: 10-200)
-   **Atraso entre Lotes (ms)**: (Visível apenas quando o paralelismo está ativado) Um atraso opcional em milissegundos entre o processamento de cada lote, o que pode ajudar a gerenciar limites de taxa de API. (Padrão: 1000ms)
-   **Intervalo de Chamada de API (ms)**: Atraso mínimo em milissegundos *antes e depois* de cada chamada de API de LLM individual. Crucial para APIs de baixa taxa ou para evitar erros 429. Defina como 0 para nenhum atraso artificial. (Padrão: 500ms)
-   **Contagem de Palavras por Pedaço**: Máximo de palavras por pedaço enviado ao LLM. Afeta o número de chamadas de API para arquivos grandes. (Padrão: 3000)
-   **Ativar Detecção de Duplicatas**: Alterna a verificação básica de palavras duplicadas dentro do conteúdo processado (resultados no console). (Padrão: Ativado)
-   **Máximo de Tokens**: Máximo de tokens que o LLM deve gerar por pedaço de resposta. Afeta o custo e o detalhamento. (Padrão: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets%2F74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Tradução
-   **Idioma de Destino Padrão**: Selecione o idioma padrão para o qual deseja traduzir suas notas. Isso pode ser sobrescrito na interface ao executar o comando de tradução. (Padrão: Inglês)
-   **Personalizar Caminho de Salvamento de Arquivos Traduzidos**:
    *   **Desactivado (Padrão)**: Arquivos traduzidos são salvos na *mesma pasta* da nota original.
    *   **Ativado**: Permite especificar um *caminho relativo* dentro do seu vault (ex: `Traducoes`) onde os arquivos tradutores devem ser salvos. As pastas serão criadas se não existirem.
-   **Usar sufixo personalizado para arquivos traduzidos**:
    *   **Desactivado (Padrão)**: Arquivos traduzidos usam o sufixo padrão `_translated.md` (ex: `SuaNota_translated.md`).
    *   **Ativado**: Permite especificar um sufixo personalizado.
-   **Sufixo Personalizado**: (Visível apenas se ativado acima) Insira o sufixo personalizado para adicionar aos nomes de arquivos traduzidos (ex: `_pt` ou `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Geração de Conteúdo
-   **Ativar Pesquisa em "Gerar a partir do Título"**:
    *   **Desactivado (Padrão)**: "Gerar a partir do Título" usa apenas o título como entrada.
    *   **Ativado**: Realiza uma pesquisa na web usando o **Provedor de Pesquisa na Web** configurado e inclui as descobertas como contexto para o LLM durante a geração baseada no título.
-   **Executar automaticamente a correção de sintaxe Mermaid após a geração**:
    *   **Ativado (Padrão)**: Executa automaticamente um passe de correção de sintaxe Mermaid após fluxos de trabalho relacionados ao Mermaid como Processar, Gerar a partir do título, Geração em lote a partir de títulos, Pesquisa e Resumo, Resumir como Mermaid e Traduzir.
    *   **Desactivado**: Deixa a saída Mermaid gerada intocada, a menos que você execute a `Correção Mermaid em Lote` manualmente ou a adicione a um fluxo de trabalho personalizado.
-   **Idioma de Saída**: (Novo) Selecione o idioma de saída desejado para as tarefas "Gerar a partir do título" e "Geração em lote a partir de títulos".
    *   **Inglês (Padrão)**: Os prompts são processados e produzidos em inglês.
    *   **Outros Idiomas**: Instrui o LLM a realizar seu raciocínio em inglês, mas fornecer a documentação final no idioma de sua escolha (ex: Português, Espanhol, Francês, Chinês Simplificado, Chinês Tradicional, Árabe, Hindi, etc.).
-   **Alterar Palavra do Prompt**: (Novo)
    *   **Alterar Palavra do Prompt**: Permite alterar a palavra do prompt para uma tarefa específica.
    *   **Palavra do Prompt Personalizada**: Insira sua palavra de prompt personalizada para a tarefa.
-   **Usar Pasta de Saída Personalizada para 'Gerar a partir do Título'**:
    *   **Desactivado (Padrão)**: Arquivos gerados com sucesso são movidos para uma subpasta chamada `[NomeDaPastaOriginal]_complete` relativa ao pai da pasta original (ou `Vault_complete` se a pasta original for a raiz).
    *   **Ativado**: Permite especificar um nome personalizado para a subpasta onde os arquivos concluídos são movidos.
-   **Nome da Pasta de Saída Personalizada**: (Visível apenas se ativado acima) Insira o nome desejado para a subpasta (ex: `Conteudo Gerado`, `_complete`). Caracteres inválidos não são permitidos. O padrão é `_complete` se deixado vazio. Esta pasta é criada em relação ao diretório pai da pasta original.

#### Botões de Fluxo de Trabalho com Um Clique
-   **Construtor de Fluxo de Trabalho Visual**: Crie botões de fluxo de trabalho personalizados a partir de ações integradas sem escrever o DSL manualmente.
-   **DSL de Botão de Fluxo de Trabalho Personalizado**: Usuários avançados ainda podem editar o texto de definição do fluxo de trabalho diretamente. Um DSL inválido recorre ao fluxo de trabalho padrão com segurança e mostra um aviso na barra lateral/interface de configurações.
-   **Estratégia de Erro de Fluxo de Trabalho**:
    *   **Parar no Erro (Padrão)**: Interrompe o fluxo de trabalho imediatamente assim que um passo falha.
    *   **Continuar no Erro**: Continua executando os passos subsequentes e relata o número de ações com falha ao final.
-   **Fluxo de Trabalho Padrão Incluído**: `One-Click Extract` encadeia `Processar arquivo (Adicionar links)`, `Geração em lote a partir de títulos` e `Correção Mermaid em Lote`.

#### Configurações de Prompts Personalizados
Este recurso permite sobrescrever as instruções padrão (prompts) enviadas ao LLM para tarefas específicas, dando a você controle preciso sobre a saída.

-   **Ativar Prompts Personalizados para Tarefas Específicas**:
    *   **Desactivado (Padrão)**: O plugin usa seus prompts padrão integrados para todas as operações.
    *   **Ativado**: Ativa a capacidade de definir prompts personalizados para as tarefas listadas abaixo. Esta é a chave mestra para este recurso.

-   **Usar Prompt Personalizado para [Nome da Tarefa]**: (Visível apenas se ativado acima)
    *   Para cada tarefa suportada ("Adicionar links", "Gerar a partir do título", "Pesquisa e resumo", "Extrair conceitos"), você pode ativar ou desativar individualmente o seu prompt personalizado.
    *   **Desactivado**: Esta tarefa específica usará o prompt padrão.
    *   **Ativado**: Esta tarefa usará o texto que você fornecer na área de texto "Prompt Personalizado" correspondente abaixo.

-   **Área de Texto do Prompt Personalizado**: (Visível apenas quando o prompt personalizado de uma tarefa estiver ativado)
    *   **Exibição do Prompt Padrão**: Para sua referência, o plugin exibe o prompt padrão que ele usaria normalmente para a tarefa. Você pode usar o botão **"Copiar Prompt Padrão"** para copiar este texto como ponto de partida para o seu próprio prompt personalizado.
    *   **Entrada de Prompt Personalizado**: Aqui é onde você escreve suas próprias instruções para o LLM.
    *   **Marcadores (Placeholders)**: Você pode (e deve) usar marcadores especiais em seu prompt, que o plugin substituirá pelo conteúdo real antes de enviar a solicitação ao LLM. Consulte o prompt padrão para ver quais marcadores estão disponíveis para cada tarefa. Marcadores comuns incluem:
        *   `{TITLE}`: O título da nota atual.
        *   `{RESEARCH_CONTEXT_SECTION}`: O conteúdo reunido da pesquisa na web.
        *   `{USER_PROMPT}`: O conteúdo da nota sendo processada.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Escopo de Verificação de Duplicatas
-   **Modo de Escopo de Verificação de Duplicatas**: Controla quais arquivos são verificados contra as notas em sua Pasta de Notas de Conceito para encontrar possíveis duplicatas.
    *   **Todo o Vault (Padrão)**: Compara notas de conceito contra todas as outras notas no vault (excluindo a própria Pasta de Notas de Conceito).
    *   **Incluir Apenas Pastas Específicas**: Compara notas de conceito apenas contra notas dentro das pastas listadas abaixo.
    *   **Excluir Pastas Específicas**: Compara notas de conceito contra todas as notas *exceto* aquelas dentro das pastas listadas abaixo (e também excluindo a Pasta de Notas de Conceito).
    *   **Apenas Pasta de Conceitos**: Compara notas de conceito apenas contra *outras notas dentro da Pasta de Notas de Conceito*. Ajuda a encontrar duplicatas puramente dentro dos seus conceitos gerados.
-   **Incluir/Excluir Pastas**: (Visível apenas se o Modo for 'Incluir' ou 'Excluir') Insira os *caminhos relativos* das pastas que deseja incluir ou excluir, **um caminho por linha**. Os caminhos são sensíveis a maiúsculas e minúsculas e usam `/` como separador (ex: `Material de Referencia/Artigos` ou `Notas Diarias`). Estas pastas não podem ser as mesmas ou estar dentro da Pasta de Notas de Conceito.

#### Provedor de Pesquisa na Web
-   **Provedor de Pesquisa**: Escolha entre `Tavily` (requer chave API, recomendado) e `DuckDuckGo` (experimental, frequentemente bloqueado pelo mecanismo de pesquisa para solicitações automatizadas). Usado para "Pesquisa e resumo de tópico" e opcionalmente para "Gerar a partir do título".
-   **Chave API Tavily**: (Visível apenas se Tavily for selecionado) Insira sua chave API de [tavily.com](https://tavily.com/).
-   **Resultados Máximos do Tavily**: (Visível apenas se Tavily for selecionado) Número máximo de resultados de pesquisa que o Tavily deve retornar (1-20). Padrão: 5.
-   **Profundidade de Pesquisa do Tavily**: (Visível apenas se Tavily for selecionado) Escolha entre `basic` (padrão) ou `advanced`. Nota: `advanced` fornece melhores resultados, mas custa 2 créditos de API por pesquisa em vez de 1.
-   **Resultados Máximos do DuckDuckGo**: (Visível apenas se DuckDuckGo for selecionado) Número máximo de resultados de pesquisa a serem analisados (1-10). Padrão: 5.
-   **Tempo Limite de Busca de Conteúdo do DuckDuckGo**: (Visível apenas se DuckDuckGo for selecionado) Segundos máximos a esperar ao tentar buscar conteúdo de cada URL de resultado do DuckDuckGo. Padrão: 15.
-   **Máximo de Tokens de Conteúdo de Pesquisa**: Número aproximado máximo de tokens dos resultados combinados da pesquisa na web (trechos/conteúdo buscado) a serem incluídos no prompt de resumo. Ajuda a gerenciar o tamanho da janela de contexto e o custo. (Padrão: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Domínio de Aprendizado Focado
-   **Ativar Domínio de Aprendizado Focado**:
    *   **Desactivado (Padrão)**: Prompts enviados ao LLM usam as instruções padrão de propósito geral.
    *   **Ativado**: Permite especificar um ou mais campos de estudo para melhorar a compreensão contextual do LLM.
-   **Domínio de Aprendizado**: (Visível apenas quando o anterior estiver ativado) Insira seu(s) campo(s) específico(s), ex: 'Ciência dos Materiais', 'Física de Polímeros', 'Aprendizado de Máquina'. Isso adicionará uma linha "Campos Relevantes: [...]" ao início dos prompts, ajudando o LLM a gerar links e conteúdos mais precisos e relevantes para a sua área de estudo específica.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />


## Guia de Uso

### Fluxos de Trabalho Rápidos e Barra Lateral

-   Abra a barra lateral do Notemd para acessar seções de ações agrupadas para processamento principal, geração, tradução, conhecimento e utilitários.
-   Use a área **Quick Workflows** no topo da barra lateral para lançar botões de vários passos personalizados.
-   O fluxo de trabalho padrão **One-Click Extract** executa `Processar arquivo (Adicionar links)` -> `Geração em lote a partir de títulos` -> `Correção Mermaid em Lote`.
-   O progresso do fluxo de trabalho, os logs por passo e as falhas são exibidos na barra lateral, com um rodapé fixo que protege a barra de progresso e a área de log de serem deslocadas por seções expandidas.
-   O cartão de progresso mantém legíveis de relance o texto de status, um indicador de porcentagem dedicado e o tempo restante, e os mesmos fluxos de trabalho personalizados podem ser reconfigurados nas configurações.

### Processamento Original (Adicionar Links Wiki)
Esta é a funcionalidade principal focada em identificar conceitos e adicionar `[[wiki-links]]`.

**Importante:** Este processo funciona apenas em arquivos `.md` ou `.txt`. Você pode converter arquivos PDF para arquivos MD gratuitamente usando o [Mineru](https://github.com/opendatalab/MinerU) antes de processá-los mais.

1.  **Usando a Barra Lateral**:
    *   Abra a barra lateral do Notemd (ícone da varinha ou paleta de comandos).
    *   Abra o arquivo `.md` ou `.txt`.
    *   Clique em **"Process File (Add Links)"**.
    *   Para processar uma pasta: Clique em **"Process Folder (Add Links)"**, selecione a pasta e clique em "Process".
    *   O progresso é mostrado na barra lateral. Você pode cancelar a tarefa usando o botão "Cancelar Processamento" na barra lateral.
    *   *Nota para o processamento de pastas:* Os arquivos são processados em segundo plano sem serem abertos no editor.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Usando a Paleta de Comandos** (`Ctrl+P` ou `Cmd+P`):
    *   **Arquivo Único**: Abra o arquivo e execute `Notemd: Process Current File`.
    *   **Pasta**: Execute `Notemd: Process Folder`, então selecione a pasta. Os arquivos são processados em segundo plano sem serem abertos no editor.
    *   Um modal de progresso aparece para as ações da paleta de comandos, incluindo um botão de cancelamento.
    *   *Nota:* o plugin remove automaticamente as linhas iniciais `\boxed{` e finais `}` se encontradas no conteúdo processado final antes de salvar.

### Novos Recursos

1.  **Resumir como diagrama Mermaid**:
    *   Abra a nota que deseja resumir.
    *   Execute o comando `Notemd: Summarise as Mermaid diagram` (via paleta de comandos ou botão da barra lateral).
    *   O plugin gerará uma nova nota com o diagrama Mermaid.

2.  **Traduzir Nota/Seleção**:
    *   Selecione o texto em uma nota para traduzir apenas essa seleção, ou invoque o comando sem seleção para traduzir a nota inteira.
    *   Execute o comando `Notemd: Translate Note/Selection` (via paleta de comandos ou botão da barra lateral).
    *   Um modal aparecerá permitindo que você confirme ou altere o **Idioma de Destino** (padrão conforme a configuração especificada).
    *   O plugin usa o **Provedor de LLM** configurado (baseado nas configurações Multi-Modelo) para realizar a tradução.
    *   O conteúdo traduzido é salvo no **Caminho de Salvamento de Traduções** configurado com o sufixo apropriado e aberto em um **novo painel à direita** do conteúdo original para facilitar a comparação.
    *   Você pode cancelar esta tarefa através do botão da barra lateral ou do botão de cancelamento do modal.
3.  **Tradução em Lote**:
    *   Execute o comando `Notemd: Batch Translate Folder` na paleta de comandos e selecione uma pasta, ou clique com o botão direito em uma pasta no explorador de arquivos e escolha "Traduzir esta pasta em lote".
    *   O plugin traduzirá todos os arquivos Markdown na pasta selecionada.
    *   Os arquivos traduzidos são salvos no caminho de tradução configurado, mas não são abertos automaticamente.
    *   Este processo pode ser cancelado através do modal de progresso.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Pesquisar e Resumir Tópico**:
    *   Selecione o texto em uma nota OU certifique-se de que a nota tenha um título (este será o tópico da pesquisa).
    *   Execute o comando `Notemd: Research and Summarize Topic` (via paleta de comandos ou botão da barra lateral).
    *   O plugin usa o **Provedor de Pesquisa** configurado (Tavily/DuckDuckGo) e o **Provedor de LLM** apropriado (baseado nas configurações Multi-Modelo) para encontrar e resumir informações.
    *   O resumo é anexado à nota atual.
    *   Você pode cancelar esta tarefa através do botão da barra lateral ou do botão de cancelamento do modal.
    *   *Nota:* As pesquisas no DuckDuckGo podem falhar devido à detecção de bots. Tavily é recomendado.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Gerar Conteúdo a partir do Título**:
    *   Abra uma nota (pode estar vazia).
    *   Execute o comando `Notemd: Generate Content from Title` (via paleta de comandos ou botão da barra lateral).
    *   O plugin usa o **Provedor de LLM** apropriado (baseado nas configurações Multi-Modelo) para gerar conteúdo baseado no título da nota, substituindo qualquer conteúdo existente.
    *   Se a configuração **"Ativar Pesquisa em 'Gerar a partir do Título'"** estiver ativada, ele primeiro realizará uma pesquisa na web (usando o **Provedor de Pesquisa na Web** configurado) e incluirá esse contexto no prompt enviado ao LLM.
    *   Você pode cancelar esta tarefa através do botão da barra lateral ou do botão de cancelamento do modal.

5.  **Geração de Conteúdo em Lote a partir de Títulos**:
    *   Execute o comando `Notemd: Batch Generate Content from Titles` (via paleta de comandos ou botão da barra lateral).
    *   Selecione a pasta que contém as notas que deseja processar.
    *   O plugin iterará por cada arquivo `.md` na pasta (excluindo os arquivos `_processed.md` e arquivos na pasta "complete" designada), gerando conteúdo baseado no título da nota e substituindo o conteúdo existente. Os arquivos são processados em segundo plano sem serem abertos no editor.
    *   Arquivos processados com sucesso são movidos para a pasta "complete" configurada.
    *   Este comando respeita a configuração **"Ativar Pesquisa em 'Gerar a partir do Título'"** para cada nota processada.
    *   Você pode cancelar esta tarefa através do botão da barra lateral ou do botão de cancelamento do modal.
    *   O progresso e os resultados (número de arquivos modificados, erros) são mostrados na barra lateral/log do modal.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Verificar e Remover Notas de Conceito Duplicadas**:
    *   Certifique-se de que o **Caminho da Pasta de Notas de Conceito** esteja configurado corretamente nas configurações.
    *   Execute `Notemd: Check and Remove Duplicate Concept Notes` (via paleta de comandos ou botão da barra lateral).
    *   O plugin verifica a pasta de notas de conceito e compara os nomes dos arquivos com notas fora da pasta usando várias regras (correspondência exata, plurais, normalização, contenção).
    *   Se possíveis duplicatas forem encontradas, uma janela modal aparecerá listando os arquivos, o motivo pelo qual foram sinalizados e os arquivos em conflito.
    *   Examine a lista cuidadosamente. Clique em **"Delete Files"** para mover os arquivos listados para a lixeira do sistema, ou em **"Cancel"** para não realizar nenhuma ação.
    *   O progresso e os resultados são mostrados na barra lateral/log do modal.

7.  **Extrair Conceitos (Modo Puro)**:
    *   Este recurso permite extrair conceitos de um documento e criar as notas de conceito correspondentes *sem* alterar o arquivo original. É perfeito para popular rapidamente sua base de conhecimento a partir de um conjunto de documentos.
    *   **Arquivo Único**: Abra um arquivo e execute o comando `Notemd: Extract concepts (create concept notes only)` na paleta de comandos ou clique no botão **"Extract concepts (current file)"** na barra lateral.
    *   **Pasta**: Execute o comando `Notemd: Batch extract concepts from folder` na paleta de comandos ou clique no botão **"Extract concepts (folder)"** na barra lateral, então selecione uma pasta para processar todas as suas notas.
    *   O plugin lerá os arquivos, identificará os conceitos e criará novas notas para eles em sua **Pasta de Notas de Conceito** designada, deixando seus arquivos originais intactos.

8.  **Criar Link Wiki e Gerar Nota a partir da Seleção**:
    *   Este comando poderoso simplifica o processo de criação e preenchimento de novas notas de conceito.
    *   Selecione uma palavra ou frase em seu editor.
    *   Execute o comando `Notemd: Create Wiki-Link & Generate Note from Selection` (recomenda-se atribuir uma tecla de atalho para isso, como `Cmd+Shift+W`).
    *   O plugin irá:
        1.  Substituir o texto selecionado por um `[[wiki-link]]`.
        2.  Verificar se uma nota com esse título já existe em sua **Pasta de Notas de Conceito**.
        3.  Se existir, adiciona um backlink para a nota atual.
        4.  Se não existir, cria uma nova nota vazia.
        5.  Em seguida, executa automaticamente o comando **"Generate Content from Title"** na nota nova ou existente, preenchendo-a com conteúdo gerado por IA.

9.  **Extrair Conceitos e Gerar Títulos**:
    *   Este comando encadeia duas funções poderosas para um fluxo de trabalho simplificado.
    *   Execute o comando `Notemd: Extract Concepts and Generate Titles` na paleta de comandos (recomenda-se atribuir uma tecla de atalho).
    *   O plugin irá:
        1.  Primeiro, executar a tarefa **"Extract concepts (current file)"** no arquivo ativo no momento.
        2.  Em seguida, executará automaticamente a tarefa **"Batch generate from titles"** na pasta que você configurou como seu **Caminho da pasta de notas de conceito** nas configurações.
    *   Isso permite que você primeiro popule sua base de conhecimento com novos conceitos de um documento de origem e, em seguida, desenvolva imediatamente essas novas notas de conceito com conteúdo gerado por IA em uma única etapa.

10. **Extrair Texto Original Específico**:
    *   Configure suas perguntas nas configurações em "Extrair Texto Original Específico".
    *   Use o botão "Extrair Texto Original Específico" na barra lateral para processar o arquivo ativo.
    *   **Modo Mesclado**: Permite um processamento mais rápido enviando todas as perguntas em um único prompt.
    *   **Tradução**: Traduz opcionalmente o texto extraído para o seu idioma configurado.
    *   **Saída Personalizada**: Configure onde e como o arquivo extraído é salvo.

11. **Correção Mermaid em Lote**:
    *   Use o botão "Correção Mermaid em Lote" na barra lateral para escanear uma pasta e corrigir erros comuns de sintaxe Mermaid.
    *   O plugin relatará quaisquer arquivos que ainda contenham erros em um arquivo `mermaid_error_{nome_da_pasta}.md`.
    *   Opcionalmente, configure o plugin para mover esses arquivos problemáticos para uma pasta separada para revisão.

## Provedores de LLM Suportados

| Provedor           | Tipo    | Chave API Necessária   | Notas                                                                 |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Nuvem   | Sim                    | Endpoint nativo DeepSeek com tratamento de modelos de raciocínio      |
| Qwen               | Nuvem   | Sim                    | Preset de modo compatível DashScope para modelos Qwen / QwQ           |
| Qwen Code          | Nuvem   | Sim                    | Preset focado em código DashScope para modelos Qwen coder             |
| Doubao             | Nuvem   | Sim                    | Preset Volcengine Ark; geralmente define o campo do modelo para o seu ID de endpoint |
| Moonshot           | Nuvem   | Sim                    | Endpoint oficial Kimi / Moonshot                                      |
| GLM                | Nuvem   | Sim                    | Endpoint oficial Zhipu BigModel compatível com OpenAI                 |
| Z AI               | Nuvem   | Sim                    | Endpoint oficial GLM/Zhipu internacional; complementa o `GLM`         |
| MiniMax            | Nuvem   | Sim                    | Endpoint oficial de chat-completions MiniMax                          |
| Huawei Cloud MaaS  | Nuvem   | Sim                    | Endpoint Huawei ModelArts MaaS compatível com OpenAI para modelos hospedados |
| Baidu Qianfan      | Nuvem   | Sim                    | Endpoint oficial Baidu Qianfan compatível com OpenAI para modelos ERNIE |
| SiliconFlow        | Nuvem   | Sim                    | Endpoint oficial SiliconFlow compatível com OpenAI para modelos OSS hospedados |
| OpenAI             | Nuvem   | Sim                    | Suporta modelos GPT e séries o                                        |
| Anthropic          | Nuvem   | Sim                    | Suporta modelos Claude                                                |
| Google             | Nuvem   | Sim                    | Suporta modelos Gemini                                                |
| Mistral            | Nuvem   | Sim                    | Suporta famílias Mistral e Codestral                                  |
| Azure OpenAI       | Nuvem   | Sim                    | Requer Endpoint, Chave API, nome da implantação e Versão da API       |
| OpenRouter         | Gateway | Sim                    | Acesse muitos provedores através de IDs de modelo do OpenRouter       |
| xAI                | Nuvem   | Sim                    | Endpoint nativo Grok                                                  |
| Groq               | Nuvem   | Sim                    | Inferência rápida compatível com OpenAI para modelos OSS hospedados   |
| Together           | Nuvem   | Sim                    | Endpoint compatível com OpenAI para modelos OSS hospedados            |
| Fireworks          | Nuvem   | Sim                    | Endpoint de inferência compatível com OpenAI                          |
| Requesty           | Gateway | Sim                    | Roteador multi-provedor sob uma única chave API                       |
| OpenAI Compatible  | Gateway | Opcional               | Preset genérico para LiteLLM, vLLM, Perplexity, Vercel AI Gateway, etc.|
| LMStudio           | Local   | Opcional (`EMPTY`)     | Executa modelos localmente via servidor LM Studio                     |
| Ollama             | Local   | Não                    | Executa modelos localmente via servidor Ollama                        |

*Nota: Para provedores locais (LMStudio, Ollama), certifique-se de que o respectivo aplicativo servidor esteja em execução e acessível na URL Base configurada.*
*Nota: Para OpenRouter e Requesty, use o identificador de modelo completo/com prefixo de provedor mostrado pelo gateway (ex: `google/gemini-flash-1.5` ou `anthropic/claude-3-7-sonnet-latest`).*
*Nota: `Doubao` normalmente espera um ID de endpoint/implantação Ark no campo do modelo em vez de um nome de família de modelo bruto. A tela de configurações agora avisa quando o valor do marcador ainda está presente e bloqueia os testes de conexão até que você o substitua por um ID de endpoint real.*
*Nota: `Z AI` visa a linha internacional `api.z.ai`, enquanto o `GLM` mantém o endpoint BigModel na China continental. Escolha o preset que corresponde à região da sua conta.*
*Nota: Presets focados na China usam verificações de conexão chat-first para que o teste valide o modelo/implantação realmente configurado, não apenas a acessibilidade da chave API.*
*Nota: `OpenAI Compatible` destina-se a gateways e proxies personalizados. Defina a URL Base, a política de chave API e o ID do modelo de acordo com a documentação do seu provedor.*

## Uso de Rede e Tratamento de Dados

O Notemd é executado localmente dentro do Obsidian, mas alguns recursos enviam solicitações de saída.

### Chamadas ao Provedor de LLM (Configurável)

- Gatilho: processamento de arquivo, geração, tradução, resumo de pesquisa, resumo Mermaid e ações de conexão/diagnóstico.
- Endpoint: sua(s) URL(s) base de provedor configurada(s) nas configurações do Notemd.
- Dados enviados: texto do prompt e conteúdo da tarefa necessários para o processamento.
- Nota de tratamento de dados: as chaves de API são configuradas localmente nas configurações do plugin e usadas para assinar solicitações do seu dispositivo.

### Chamadas de Pesquisa na Web (Opcional)

- Gatilho: quando a pesquisa na web está ativada e um provedor de pesquisa é selecionado.
- Endpoint: API do Tavily ou endpoints do DuckDuckGo.
- Dados enviados: sua consulta de pesquisa e os metadados de solicitação necessários.

### Diagnósticos de Desenvolvedor e Logs de Depuração (Opcional)

- Gatilho: modo de depuração de API e ações de diagnóstico de desenvolvedor.
- Armazenamento: logs de diagnóstico e erros são gravados na raiz do seu vault (ex: `Notemd_Provider_Diagnostic_*.txt` e `Notemd_Error_Log_*.txt`).
- Nota de risco: os logs podem conter trechos de solicitação/resposta. Revise os logs antes de compartilhá-los publicamente.

### Armazenamento Local

- A configuração do plugin é armazenada em `.obsidian/plugins/notemd/data.json`.
- Arquivos gerados, relatórios e logs opcionais são armazenados em seu vault de acordo com suas configurações.

## Solução de Problemas

### Problemas Comuns
-   **O plugin não carrega**: Certifique-se de que `manifest.json`, `main.js`, `styles.css` estejam na pasta correta (`<Vault>/.obsidian/plugins/notemd/`) e reinicie o Obsidian. Verifique o Console do Desenvolvedor (`Ctrl+Shift+I` ou `Cmd+Option+I`) para erros na inicialização.
-   **Falhas de Processamento / Erros de API**:
    1.  **Verifique o Formato do Arquivo**: Certifique-se de que o arquivo que você está tentando processar ou verificar tenha uma extensão `.md` ou `.txt`. O Notemd atualmente suporta apenas esses formatos baseados em texto.
    2.  Use o comando/botão "Testar conexão de LLM" para verificar as configurações do provedor ativo.
    3.  Verifique duas vezes a Chave API, a URL Base, o Nome do Modelo e a Versão da API (para Azure). Certifique-se de que a chave API esteja correta e tenha créditos/permissões suficientes.
    4.  Certifique-se de que seu servidor de LLM local (LMStudio, Ollama) esteja em execução e a URL Base esteja correta (ex: `http://localhost:1234/v1` para o LMStudio).
    5.  Verifique sua conexão com a internet para provedores em nuvem.
    6.  **Para erros de processamento de arquivo único:** Verifique o Console do Desenvolvedor para mensagens de erro detalhadas. Copie-as através do botão no modal de erro, se necessário.
    7.  **Para erros de processamento em lote:** Verifique o arquivo `error_processing_filename.log` na raiz do seu vault para mensagens de erro detalhadas para cada arquivo que falhou. O Console do Desenvolvedor ou o modal de erro podem mostrar um resumo ou um erro de lote geral.
    8.  **Logs de Erro Automáticos:** Se um processo falhar, o plugin salva automaticamente um arquivo de log detalhado chamado `Notemd_Error_Log_[Timestamp].txt` no diretório raiz do seu vault. Este arquivo contém a mensagem de erro, o rastreamento de pilha e os logs da sessão. Se você encontrar problemas persistentes, verifique este arquivo. Ativar o "Modo de Depuração de Erros de API" nas configurações preencherá este log com dados de resposta de API ainda mais detalhados.
    9.  **Diagnósticos de Solicitação Longa em Endpoint Real (Desenvolvedor)**:
        - Caminho interno do plugin (recomendado primeiro): use **Configurações -> Notemd -> Diagnóstico de provedor para desenvolvedores (solicitação longa)** para executar uma sonda de tempo de execução sobre o provedor ativo e gerar `Notemd_Provider_Diagnostic_*.txt` na raiz do vault.
        - Caminho CLI (fora do tempo de execução do Obsidian): para uma comparação reproduzível em nível de endpoint entre comportamento bufferizado e em streaming, use:
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
        O relatório gerado contém tempos por tentativa (`First Byte`, `Duration`), metadados de solicitação saneados, cabeçalhos de resposta, fragmentos de corpo brutos/parciais, pedaços de stream analisados e pontos de falha da camada de transporte.
-   **Problemas de Conexão do LM Studio/Ollama**:
    *   **Falha no Teste de Conexão**: Certifique-se de que o servidor local (LM Studio ou Ollama) esteja em execução e que o modelo correto esteja carregado/disponível.
    *   **Erros de CORS (Ollama no Windows)**: Se você encontrar erros de CORS (Cross-Origin Resource Sharing) ao usar o Ollama no Windows, pode ser necessário definir a variável de ambiente `OLLAMA_ORIGINS`. Você pode fazer isso executando `set OLLAMA_ORIGINS=*` no prompt de comando antes de iniciar o Ollama. Isso permite solicitações de qualquer origem.
    *   **Ativar CORS no LM Studio**: Para o LM Studio, você pode ativar o CORS diretamente nas configurações do servidor, o que pode ser necessário se o Obsidian for executado em um navegador ou tiver políticas de origem rígidas.
-   **Erros de Criação de Pasta ("O nome do arquivo não pode conter...")**:
    *   Isso normalmente significa que o caminho fornecido nas configurações (**Caminho da Pasta de Arquivos Processados** ou **Caminho da Pasta de Notas de Conceito**) é inválido *para o Obsidian*.
    *   **Certifique-se de usar caminhos relativos** (ex: `Processados`, `Notas/Conceitos`) e **não caminhos absolutos** (ex: `C:\Usuarios\...`, `/Users/...`).
    *   Verifique se há caracteres inválidos: `* " \ / < > : | ? # ^ [ ]`. Observe que `\` é inválido mesmo no Windows para caminhos do Obsidian. Use `/` como separador de caminho.
-   **Problemas de Desempenho**: Processar arquivos grandes ou muitos arquivos pode levar tempo. Reduza a configuração "Contagem de Palavras por Pedaço" para chamadas de API potencialmente mais rápidas (mas em maior número). Tente um provedor ou modelo de LLM diferente.
-   **Links Inesperados**: A qualidade dos links depende muito do LLM e do prompt. Experimente diferentes modelos ou configurações de temperatura.

## Como Contribuir

Contribuições são bem-vindas! Consulte o repositório no GitHub para obter diretrizes: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## Documentação para Mantenedores

- [Fluxo de Trabalho de Lançamento (Inglês)](./docs/maintainer/release-workflow.md)
- [Fluxo de Trabalho de Lançamento (简体中文)](./docs/maintainer/release-workflow.zh-CN.md)

## Licença

Licença MIT - Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

*Notemd v1.8.0 - Melhore seu grafo de conhecimento no Obsidian com IA.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
