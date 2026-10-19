# Arquitetura do Local Workspace (IndexedDB)

Este documento descreve o modelo arquitetural de persistência no cliente implementado pelo pacote `@noduct/workspace-core`.

As regras locais do pacote complementam [AGENTS.md](../../AGENTS.md); o [Contrato #39](../guardrails.md) exige erros por código e parâmetros e UI traduzida; o [ADR 0006](../adr/0006-hybrid-local-workspace.md) define as superfícies híbridas (home, seletor na `DropZone`, salvar no `DownloadCard` e página `/workspace/`), sem entrada no header. Mudanças de retenção exigem fixture de migração e teste com relógio controlado.

---

## 1. Princípios e Requisitos

- **Zero Tráfego de Saída:** O processamento e o armazenamento de documentos ocorrem exclusivamente no navegador do usuário.
- **Isolamento de Origem:** Como todas as ferramentas compartilham a mesma origem web (`https://noduct.github.io`), o armazenamento de dados binários em `IndexedDB` viabiliza a persistência e a navegação fluida entre utilitários (ex: organizar páginas no Split PDF e prosseguir no Merge PDF).
- **Proibição de `localStorage` para Binários:** O `localStorage` possui teto síncrono reduzido (~5 MB) e bloqueia a thread de renderização da UI. Todos os documentos e buffers são persistidos nativamente como `Blob` no IndexedDB.
- **Coordenação Multi-Aba:** Sincronização em tempo real de mutações através de `BroadcastChannel('noduct-workspace')`.

---

## 2. Esquema de Armazenamento

- **Nome do Banco:** `noduct_workspace_db`
- **Versão Atual do Esquema:** `4`

### 2.1 Store `documents` (KeyPath: `id`)

Armazena os metadados dos documentos manipulados localmente. Desde o v4, o payload fica em `document_blobs` (2.1.2), e o tipo público `WorkspaceDocumentSummary` corresponde a este registro. `WorkspaceDocument` é a junção do registro com o `Blob`:

| Campo            | Tipo                          | Descrição                                                       |
| ---------------- | ----------------------------- | --------------------------------------------------------------- |
| `id`             | `string` (UUIDv4)             | Identificador único do documento                                |
| `name`           | `string`                      | Nome original do arquivo informado pelo usuário                 |
| `size`           | `number`                      | Tamanho em bytes do payload                                     |
| `mimeType`       | `string`                      | Tipo MIME (`application/pdf`)                                   |
| `pageCount`      | `number` (opcional)           | Contagem de páginas computada                                   |
| `createdAt`      | `number` (timestamp)          | Data/hora de gravação no banco                                  |
| `updatedAt`      | `number` (timestamp)          | Data/hora da última alteração                                   |
| `lastAccessedAt` | `number` (timestamp)          | Último uso que renova o prazo de retenção                       |
| `retention`      | `'ephemeral' \| 'persistent'` | Temporário por padrão; permanente somente por escolha explícita |
| `sourceTool`     | `string` (opcional)           | Ferramenta que gerou o documento                                |
| `metadata`       | `object` (opcional)           | Metadados arbitrários locais (ex: ferramenta geradora)          |

**Índices:**

- `createdAt`: ordenação cronológica
- `updatedAt`: identificação de arquivos recentes
- `lastAccessedAt`: varredura de documentos com prazo vencido
- `name`: busca e listagem alfabética

### 2.1.1 Migração v2 → v3

O upgrade preserva blobs e demais campos. Cada documento v2 recebe `retention: 'ephemeral'` e `lastAccessedAt = updatedAt`; o índice novo é criado na mesma transação de upgrade. A migração tem fixture v2 e teste de integridade. Documentos novos usam `ephemeral` salvo escolha expressa do usuário.

### 2.1.2 Store `document_blobs` e migração v3 → v4

`document_blobs` (KeyPath: `id`) guarda `{ id, blob }`, com o mesmo `id` do registro em `documents`. Gravar, apagar, expirar e limpar sempre atuam nas duas stores na mesma transação. `touchDocument` e `setRetention` regravam só `documents`. O `Blob` é apenas lido, na mesma transação, para compor o retorno. `listDocumentSummaries()` e `getWorkspaceSize()` não leem payloads. `listDocuments()` continua devolvendo documentos completos.

O upgrade para v4 percorre `documents` uma vez. Cada `blob` embutido vai para `document_blobs`, e o registro é regravado sem ele. Um banco v1 ou v2 recebe, na mesma passada, os campos de retenção do v3. Retenção, `lastAccessedAt` e demais campos de um banco v3 são preservados. Há fixtures v2 e v3 com teste de integridade.

A separação veio de medição (`experiments/workspace-blob-benchmark`). No Chromium, renovar o prazo de um documento de 10 a 100 MB levava cerca de 16 ms com o Blob no registro, contra cerca de 1 ms com a store separada. No Firefox, os layouts empatam.

O histórico é: v1 criou `documents` e `workspace_state`; v2 acrescentou `transfers` para tickets entre ferramentas; v3 acrescentou retenção, último acesso e o índice correspondente; v4 moveu os payloads para `document_blobs`. Uma versão maior que a suportada gera `SCHEMA_VERSION_UNSUPPORTED`; um upgrade impedido por outra aba gera `DB_UPGRADE_BLOCKED`. A UI orienta fechar as outras abas antes de tentar novamente.

### 2.1.3 Store `document_thumbnails` (ADR 0006)

`document_thumbnails` (KeyPath: `id`) guarda `{ id, blob, width, height }`: a primeira página em JPEG, gerada por `@noduct/pdf-core/render`. `saveThumbnail()` só grava se o documento existir e emite `thumbnail_updated`; `listThumbnails()` alimenta as superfícies. Excluir, expirar, limpar ou regravar o conteúdo de um documento apaga a miniatura na mesma transação. A store nasceu no schema v4, que ainda não havia sido publicado, para evitar uma segunda migração.

### 2.2 Store `workspace_state` (KeyPath: `key`)

Armazena preferências e estados transitórios da sessão local:

| Campo       | Tipo                 | Descrição                              |
| ----------- | -------------------- | -------------------------------------- |
| `key`       | `string`             | Identificador da preferência ou estado |
| `value`     | `unknown`            | Valor serializável da preferência      |
| `updatedAt` | `number` (timestamp) | Timestamp de atualização               |

---

## 3. Coordenação Multi-Aba via `BroadcastChannel`

O canal `noduct-workspace` notifica mutações entre abas abertas simultaneamente:

- `document_added`: emitido ao salvar um novo documento.
- `document_updated`: emitido ao atualizar um documento existente.
- `document_deleted`: emitido ao remover um arquivo específico.
- `workspace_cleared`: emitido ao limpar todos os arquivos locais.

## 4. Retenção e proteção de documentos em uso

Salvar é opt-in (ADR 0006 D3/D4): “Salvar na Área Local” e “Adicionar arquivos” gravam `persistent`, porque o usuário escolheu guardar; `ephemeral` fica para cópias implícitas (tickets de transferência) e para quem escolhe “Permitir expiração”. O padrão da API continua `ephemeral`; quem chama declara a escolha.

Um documento efêmero expira **depois** de 24 horas sem acesso (`now - lastAccessedAt > 24 h`). Leitura, abertura e transferência renovam `lastAccessedAt`; listagens e varreduras não renovam. `setRetention(id, 'persistent')` impede expiração automática; voltar a `ephemeral` reativa o prazo. A limpeza devolve os IDs removidos, emite `document_deleted` para cada um e limpa também tickets de transferência vencidos.

A limpeza é acionada na abertura do workspace, na sincronização de uma superfície (seletor, página, home) e quando a aba volta a ficar visível. Não há timer de fundo. Leitores e operações de transferência usam o Web Lock `noduct-doc-<id>` em modo `shared`. Um consumidor que mantém o blob aberto chama `acquireDocument(id)` e segura esse lock até `release()` ou `WorkspaceClient.close()`; o download da página `/workspace/`, o seletor e a geração de miniaturas fazem isso durante a criação do arquivo local e libera em `finally`, e a página fecha o cliente em `pagehide`. A limpeza tenta obter o mesmo lock em modo `exclusive` com `ifAvailable: true`; se estiver ocupado, pula o documento. Se a API de Web Locks não existir, a limpeza automática não exclui documentos, pois não pode garantir que outra aba não esteja usando o blob. O `BroadcastChannel` distribui as exclusões e mudanças de retenção às outras abas para atualização da interface.

`setRetention` preserva `updatedAt`, pois o conteúdo não muda, e renova `lastAccessedAt`. Mudar a retenção é uma ação explícita do usuário sobre o documento. Sem a renovação, voltar para `ephemeral` um documento parado há mais de 24 horas o faria expirar na limpeza seguinte, segundos depois da escolha. Desde o v4, nenhuma das duas operações regrava o Blob.

As superfícies usam `createWorkspaceSync()` do `@noduct/design-system/workspace-ui`, ligado por `connectLocalWorkspace()`. Abrir o seletor, abrir a página ou concluir uma ação sincroniza na hora. Eventos de outras abas reiniciam uma janela de 100 ms (`WORKSPACE_SYNC_DEBOUNCE_MS`). Uma rajada vira uma única sincronização: uma limpeza, uma varredura `listDocumentSummaries()` que também calcula o tamanho total e um anúncio com a contagem acumulada de expirações. Mudanças que chegam durante uma sincronização provocam no máximo uma sincronização seguinte. Expirações acumuladas com a superfície inativa são anunciadas pela página `/workspace/` na próxima sincronização.

A página `/workspace/` apresenta o prazo restante no momento da sincronização, permite “Manter neste dispositivo” e “Permitir expiração” e anuncia a remoção de temporários via `aria-live`. Limpar dados do navegador remove inclusive os documentos persistentes.

## 5. Erros e orçamento de recursos

`WorkspaceError` e `ResourceBudget` devolvem `code` e `params` estruturados. Bytes, nomes e perfil continuam dados de domínio; o texto visível é produzido pela UI no locale atual. A mensagem inglesa de uma exceção serve somente a diagnóstico e não deve ser mostrada diretamente ao usuário.

---

## 6. Resiliência e Fallback Seguro

Quando o IndexedDB estiver indisponível (como em janelas anônimas com bloqueio total de armazenamento ou restrições severas de cookies):

- A classe de erro `WorkspaceUnavailableError` é disparada.
- A aplicação pode continuar o processamento e oferecer download sem salvar no Local Workspace. A UI deve informar que a persistência local está indisponível; não há fallback de workspace em memória implementado neste pacote.
