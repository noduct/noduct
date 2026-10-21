# ADR 0006: Área de Trabalho Local híbrida

- **Status:** Aceito
- **Data:** 2026-10-19
- **Contexto:** Issue #39 (M2.5), após a resolução das pendências da #41
- **Altera:** item 2 do Contrato de conformidade do `AGENTS.md` (o `WorkspaceDrawer` no header)
- **Estende:** ADR 0002 (PDF.js como renderer sob demanda), ADR 0004 (transferências) e ADR 0005 (shell e topologia)

---

## 1. Resumo da decisão

A Área de Trabalho Local (*Local Workspace*) deixa de ser um botão no header e passa a ser um recurso **híbrido**, com três superfícies de responsabilidades distintas:

| Superfície                      | Pergunta que responde                    | Onde vive                                                 |
| ------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| **Seção da home**               | *Isto existe? Por que me ajuda?*         | Hub, logo abaixo do hero, nos três idiomas                |
| **Seletor contextual**          | *Quero usar um arquivo que já guardei.*  | Dentro da `DropZone` de cada ferramenta (`Da Área Local`) |
| **Página dedicada**             | *Quero ver, buscar e administrar tudo.*  | Hub, em `/workspace/` (reservado na topologia)            |
| **Salvar resultado** (opt-in)   | *Quero reutilizar este resultado depois.* | `DownloadCard` de cada ferramenta                         |

Princípio central: **o usuário não precisa navegar até os arquivos para trabalhar com eles.** Os documentos aparecem no contexto da operação, e a gestão completa tem uma superfície própria.

Também ficam decididos:

- o **fim do botão de workspace no header** e da ideia de uma sidebar global permanente;
- o **salvamento só por ação explícita**, sem cópia automática dos resultados;
- **miniaturas da primeira página** como recurso compartilhado: pilha de ordenação, cartão de resultado, seletor, página e home.

---

## 2. Contexto e diagnóstico

### 2.1 Como era

Até a #41, o Local Workspace aparecia só como `WorkspaceDrawer`: um botão “Workspace” no slot `actions` do header, ao lado de Settings, que abria um diálogo pequeno com lista textual (nome, tamanho, prazo). O Merge PDF **salvava automaticamente** cada resultado como documento temporário (24 h sem uso) e não oferecia nenhum caminho para usar esses documentos numa nova operação.

### 2.2 Problemas

| Problema                                                              | Consequência                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Entrada periférica no header, com a mesma aparência de Settings       | Recurso pouco percebido; visitante vindo do buscador nunca o descobre |
| Upload só a partir do dispositivo                                     | Não havia como **reutilizar** o que estava guardado: o valor central  |
| Diálogo pequeno para gerir documentos                                 | Sem espaço para busca, ordenação, metadados e ações em lote           |
| Salvamento automático de todo resultado                               | Cópias silenciosas no navegador; expectativa de persistência confusa  |
| Lista só textual                                                      | `scan_001.pdf` e `documento(1).pdf` são indistinguíveis               |
| Cada ferramenta teria de reinventar a integração                      | Risco de experiências divergentes nas próximas ferramentas            |

### 2.3 O que a Área Local é

Não é uma lista de uploads recentes: é um **repositório local compartilhado** entre todas as ferramentas da mesma origem (`https://noduct.github.io`, ADR 0005), em IndexedDB, que viabiliza o ciclo:

```text
Adicionar PDFs ──► usar numa ferramenta ──► resultado ──► baixar
                                              │
                                              └──► salvar na Área Local ──► usar em outra ferramenta
```

O fluxo rápido (selecionar, processar, baixar) **não depende** do repositório e continua sem atrito.

---

## 3. Decisões

### D1. Três superfícies, sem entrada no header

- **Header:** nenhuma ferramenta monta controle de workspace no slot `actions`. O slot continua existindo para ações futuras, mas a descoberta da Área Local **não pode depender** de topbar nem de Settings.
- **Sem sidebar global:** o Noduct é uma coleção de ferramentas rápidas, não um explorador de arquivos. Ferramentas futuras (edição visual, comparação, imagens) precisam de toda a largura.
- **Home:** seção “Sua Área de Trabalho” logo abaixo do hero. Sem documentos, só explica o valor e leva à gestão; com documentos, mostra até seis recentes reais com miniatura e ações rápidas (baixar e excluir) e “Ver todos”. O runtime só carrega se o banco já existir (`indexedDB.databases()`), então quem nunca salvou nada não baixa nem cria armazenamento. O orçamento da home passou de 3 para 6 scripts, mantido o teto de 50 KB (`tests/e2e/audit.spec.ts`), com aprovação do dono em 2026-10-19.
- **Ferramenta:** a `DropZone` oferece duas origens, `Do dispositivo` (seletor do sistema e arrastar e soltar, como antes) e `Da Área Local`.
- **Página dedicada:** `/workspace/`, `/pt-br/workspace/`, `/es/workspace/`, indexável, com H1, canonical, hreflang e um único JSON-LD.

### D2. Seletor contextual integrado à `DropZone`

- Quando a ferramenta declara a origem local (`workspace` na `DropZone`), o design system renderiza o botão `Da Área Local` e o diálogo `WorkspacePicker`.
- **Mesma entrada para as duas origens:** ao confirmar, o seletor converte os documentos escolhidos em `File` e emite o mesmo `noduct:files` que a `DropZone` emite para arquivos do dispositivo. O `detail` ganha `source: 'workspace'` e `documentIds`. Validação, ordenação e limites continuam na ferramenta, sem um segundo pipeline.
- **Compatibilidade:** o seletor filtra pelo mesmo `accept` da `DropZone`. Arquivos incompatíveis não aparecem como selecionáveis, e o painel informa quantos ficaram de fora.
- **Seleção separada da operação:** marcar um item não altera a lista da ferramenta; só o botão de confirmação (rótulo dado pela ferramenta, por exemplo “Adicionar à mesclagem”) adiciona. Em `multiple={false}`, a seleção é única. O seletor não bloqueia escolher o mesmo documento duas vezes em confirmações distintas, porque mesclar o mesmo arquivo duas vezes é um uso legítimo; o clique duplo é evitado desabilitando a confirmação durante a leitura.
- **Forma:** diálogo modal (`<dialog>` com `showModal`) que, a partir de 721 px, se apresenta como painel lateral à direita (`min(420px, 100vw)`), com a operação visível ao fundo; abaixo disso, ocupa a tela inteira, com cabeçalho e rodapé fixos. Foco inicial na busca, `Escape` fecha, o foco volta ao gatilho, e o rodapé tem o botão de confirmação e o contador de selecionados.
- **Estados:** carregando, vazio (com explicação e link para a gestão), com documentos, sem resultados para a busca, armazenamento indisponível e erro traduzido.

**Por que modal:** um painel não modal ao lado da ferramenta exigiria gerenciar dois contextos de foco e de rolagem, inclusive em telas médias onde ele cobriria a operação. O padrão de diálogo da WAI-ARIA dá foco, leitura e fechamento previsíveis em todas as larguras. Manter a operação visível ao fundo preserva o contexto que motivou o painel.

### D3. Salvar resultado é opt-in

- O `DownloadCard` ganha a ação secundária **“Salvar na Área Local”** quando a ferramenta declara `workspace`. Baixar continua sendo a ação primária.
- Estados: `idle` → `saving` → `saved` (botão desabilitado, texto “Salvo na Área Local” e link “Ver na Área Local”) ou `failed` (mensagem traduzida e nova tentativa). O documento só é anunciado como salvo depois da confirmação da escrita no IndexedDB.
- **Nenhuma ferramenta grava resultados automaticamente.** O salvamento automático do Merge PDF foi removido.

### D4. Política de retenção por origem da escrita

| Como o documento entrou                                       | Retenção inicial  |
| ------------------------------------------------------------- | ----------------- |
| “Salvar na Área Local” no resultado                           | `persistent`      |
| “Adicionar arquivos” na página dedicada                       | `persistent`      |
| Cópia implícita do sistema (ticket de transferência, ADR 0004) | `ephemeral` (24 h) |

Com o salvamento opt-in, o que o usuário salvou de propósito **não pode sumir sozinho**: isso violaria o princípio de controle e previsibilidade. O mecanismo de expiração da #39 permanece para as cópias implícitas e para quem escolher “Permitir expiração” na página. O padrão da API `saveDocument()` continua `ephemeral`; quem chama declara a escolha do usuário.

### D5. Miniaturas da primeira página

- **Geração:** `@noduct/pdf-core/render` (subpath novo) expõe `renderPdfThumbnail(blob, options)`, um adaptador do PDF.js, como previsto no ADR 0002. A UI não conhece o fornecedor.
- **Formato:** primeira página, fundo branco, largura de até 160 px CSS × densidade de pixels (máximo 2), JPEG com qualidade 0,8. Isso dá cerca de 5 a 20 KB por documento.
- **Leitura parcial:** o adaptador alimenta o PDF.js por `PDFDataRangeTransport` com fatias do `Blob`, para não copiar um arquivo de 100 MB inteiro só para desenhar uma página.
- **Persistência:** a store `document_thumbnails` (schema v4, ainda não publicado) guarda `{ id, blob, width, height }`. A miniatura é apagada junto com o documento, regenerada quando o conteúdo muda e notificada pelo evento `thumbnail_updated`.
- **Sob demanda:** cada superfície gera as miniaturas que faltam, uma por vez, só para itens visíveis, e grava o resultado. Arquivos criptografados, corrompidos ou navegadores sem `OffscreenCanvas` caem no ícone `file-text`, sem erro visível.
- **Acessibilidade:** a imagem é decorativa (`alt=""`), porque o nome do arquivo ao lado já identifica o item.
- **Onde aparece:** pilha de ordenação do Merge (`ReorderableList`), prévia do resultado (`DownloadCard`), seletor, página dedicada e seção da home.

### D6. Composição sem violar as fronteiras de pacote

- O design system continua sem depender de `workspace-core` nem de `pdf-core`: componentes recebem `WorkspaceServices` (cliente e renderer) **injetados** pela página, como já fazia `connectWorkspaceDrawer`.
- O hub passa a poder importar `@noduct/workspace-core` e `@noduct/pdf-core/render` **somente** em `src/components/workspace/`, por `import()` dinâmico no script cliente, para a home e a página dedicada. O núcleo `@noduct/pdf-core` continua proibido no hub.
- `pdf-core` passa a poder depender de `pdfjs-dist`, **somente** em `src/render/`. O restante do pacote continua só com `pdf-lib`.
- Essas três exceções são mudanças de guardrail (`scripts/validate-architecture.ts`) e exigem a label `guardrail-change` no PR.

### D7. Padrões de interação da Área Local

- **Ações por ícone:** baixar (`download`), reter (`hourglass` = temporário, `timer-off` = mantido) e excluir (`trash-2`), em botões de 44 px com `aria-label` com o nome do arquivo e dica (`title`). A retenção é um botão alternável (`aria-pressed`), e um selo repete o estado em texto.
- **Confirmação:** ações destrutivas usam `confirmAction()`, o diálogo do sistema montado pelo `AppShell`, com foco inicial em Cancelar. `alert`, `confirm` e `prompt` nativos são proibidos em todo o repositório (guardrail `native browser dialog`).
- **Volume:** a página oferece lista (compacta, para varrer) e grade (prévia grande, para reconhecer), lembradas por navegador; as miniaturas só são pedidas quando o item entra na tela, e a lista reaproveita os nós entre sincronizações, sem piscar.
- **Controles:** ordenação pelo `Select` do design system (combobox “select-only” do WAI-ARIA), reutilizável em outras telas.

### D8. Novo item 2 do Contrato de conformidade

> **Workspace (ADR 0006):** a origem `Da Área Local` vem da `DropZone` com `workspace`; salvar resultado vem do `DownloadCard` com `workspace`; ambos são ligados por `connectLocalWorkspace()`. É proibido montar controle de workspace no header ou criar seletor, lista ou gestão de documentos próprios na ferramenta.

---

## 4. Alternativas consideradas

| Alternativa                                   | A favor                                    | Contra                                                                         | Decisão                         |
| --------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------- |
| Botão no header abrindo diálogo (estado anterior) | Simples                                    | Baixa descoberta, pouco espaço, desconectado da tarefa                         | Rejeitada                       |
| Mover o botão para outro lugar do header      | Mudança pequena                            | Mantém arquivos e tarefa desconectados; é a mesma arquitetura                  | Rejeitada                       |
| Sidebar global permanente                     | Documentos sempre visíveis                 | Rouba largura de toda ferramenta; parece um gerenciador de arquivos; ruim no mobile | Rejeitada                       |
| Aba flutuante lateral                         | Acesso rápido                              | Parece widget de suporte; disputa espaço em telas pequenas                     | Não priorizada                  |
| Só página dedicada                            | Boa para gestão                            | Obriga a sair da tarefa; não ajuda quem entra pela URL da ferramenta           | Insuficiente sozinha            |
| Só painel na ferramenta                       | No momento da necessidade                  | Sem descoberta na home e sem espaço de gestão                                  | Insuficiente sozinha            |
| **Home + seletor contextual + página dedicada** | Descoberta, agilidade e gestão separadas | Exige consistência entre superfícies (resolvida por um runtime único)          | **Escolhida**                   |

### 4.1 A miniatura exige mesmo uma dependência nova?

Sim. Opções avaliadas para prévia **sem** dependência nova:

| Opção                                                     | Resultado                                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pdf-lib` (já instalado)                                  | Só estrutura: lê e grava objetos, **não rasteriza** páginas.                                    |
| Visualizador nativo do navegador (`<embed>`/`<iframe>`)   | Não pode ser desenhado em `canvas`; não existe no Chrome Android; um visualizador por item é pesado. |
| Miniatura embutida no PDF (`/Thumb`)                      | Raramente presente em PDFs modernos; não serve como regra.                                      |
| Primeira imagem da página 1 via `pdf-lib`                 | Funciona para digitalizações JPEG, falha para texto e vetores, que são a maioria.               |
| Placeholder com número de páginas e proporção             | Não ajuda a identificar o conteúdo, que é o objetivo.                                           |
| **PDF.js** (`pdfjs-dist`, Apache-2.0)                     | Rasteriza qualquer página; **já escolhido no ADR 0002** como renderer sob demanda.              |

Dependência: `pdfjs-dist@6.3.289`, versão exata, só em `@noduct/pdf-core`. Usa-se o build `legacy`, porque o build moderno da v6 depende de APIs recentes (`Uint8Array.prototype.toHex`, `Map.prototype.getOrInsert`) que quebrariam a prévia em Safari e Chrome mais antigos. O custo é de cerca de 151 KB gzip do módulo principal e 392 KB gzip do worker, **carregados só quando a primeira miniatura é pedida**, nunca na carga inicial da página. O `@napi-rs/canvas`, dependência opcional do pacote, só é usado em Node e não entra no bundle do navegador.

---

## 5. Especificação de interface

A arquitetura de informação, os fluxos prioritários, os estados por superfície, a comunicação sobre armazenamento, os requisitos não funcionais e o plano de avaliação estão em [Área Local: especificação de interface](../architecture/local-workspace-ux.md).

---

## 6. Consequências

- Toda ferramenta nova recebe o padrão híbrido pelo `tool-template`: `DropZone` e `DownloadCard` com `workspace`, mais `connectLocalWorkspace()`. A skill [noduct-new-tool](../../.agents/skills/noduct-new-tool/SKILL.md) descreve o passo.
- `WorkspaceDrawer` e `connectWorkspaceDrawer` são removidos do design system (versão 0.7.0).
- O teste de paridade fica mais forte: o header da ferramenta é comparado com o do hub **sem esconder nada** do slot `actions`.
- Os testes de expiração passam a partir de um documento que o usuário marcou como “Permitir expiração”, e não de um resultado salvo automaticamente. As asserções sobre prazo, contagem e anúncio são mantidas.
- **Continuidade entre ferramentas** (“Comprimir”, “Dividir” a partir do resultado) fica documentada, mas não implementada: ainda não existem ferramentas de destino publicadas. Quando existirem, usarão o ticket do ADR 0004 com documento `ephemeral`.

## 7. Decisões em aberto

| Tema                                                       | Como decidir                                                    |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Posição da seção na home                                   | Pesquisa qualitativa (5–8 pessoas) com o [plano de avaliação](../architecture/local-workspace-ux.md#6-plano-de-avaliação)   |
| Nome curto (“Área Local” × “Meus arquivos”)                | Mesma pesquisa                                                  |
| Deduplicação por conteúdo ao salvar                        | Dados de uso: hoje cada salvamento cria um documento novo       |
| Paginação e virtualização da lista                         | Só quando o volume médio justificar                             |
| `navigator.storage.persist()`                              | Após pesquisa e com cópia explicativa                           |

## Referências

- Documento de UX de origem: “Noduct — Proposta de UX para a Área de Trabalho Local” (2026-10-19).
- [ADR 0002](0002-pdf-engine-strategy.md), [ADR 0004](0004-cross-tool-transfer-protocol.md), [ADR 0005](0005-unified-shell-topology-guardrails.md), [Local Workspace](../architecture/local-workspace.md).
- Nielsen Norman Group: *Progressive Disclosure*; *Recognition Rather Than Recall*. WAI-ARIA APG: *Dialog (Modal) Pattern*. MDN: *Storage quotas and eviction criteria*; `StorageManager.estimate()`.
