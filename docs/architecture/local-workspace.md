# Arquitetura do Local Workspace (IndexedDB)

Este documento descreve o modelo arquitetural de persistência no cliente implementado pelo pacote `@noduct/workspace-core`.

---

## 1. Princípios e Requisitos

- **Zero Tráfego de Saída:** O processamento e o armazenamento de documentos ocorrem exclusivamente no navegador do usuário.
- **Isolamento de Origem:** Como todas as ferramentas compartilham a mesma origem web (`https://noduct.github.io`), o armazenamento de dados binários em `IndexedDB` viabiliza a persistência e a navegação fluida entre utilitários (ex: organizar páginas no Split PDF e prosseguir no Merge PDF).
- **Proibição de `localStorage` para Binários:** O `localStorage` possui teto síncrono reduzido (~5 MB) e bloqueia a thread de renderização da UI. Todos os documentos e buffers são persistidos nativamente como `Blob` no IndexedDB.
- **Coordenação Multi-Aba:** Sincronização em tempo real de mutações através de `BroadcastChannel('noduct-workspace')`.

---

## 2. Esquema de Armazenamento

- **Nome do Banco:** `noduct_workspace_db`
- **Versão Atual do Esquema:** `1`

### 2.1 Store `documents` (KeyPath: `id`)
Armazena os documentos PDF manipulados localmente:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` (UUIDv4) | Identificador único do documento |
| `name` | `string` | Nome original do arquivo informado pelo usuário |
| `size` | `number` | Tamanho em bytes do payload |
| `mimeType` | `string` | Tipo MIME (`application/pdf`) |
| `pageCount` | `number` (opcional) | Contagem de páginas computada |
| `createdAt` | `number` (timestamp) | Data/hora de gravação no banco |
| `updatedAt` | `number` (timestamp) | Data/hora da última alteração |
| `blob` | `Blob` | Payload binário real do arquivo |
| `metadata` | `object` (opcional) | Metadados arbitrários locais (ex: ferramenta geradora) |

**Índices:**
- `createdAt`: ordenação cronológica
- `updatedAt`: identificação de arquivos recentes
- `name`: busca e listagem alfabética

### 2.2 Store `workspace_state` (KeyPath: `key`)
Armazena preferências e estados transitórios da sessão local:

| Campo | Tipo | Descrição |
|---|---|---|
| `key` | `string` | Identificador da preferência ou estado |
| `value` | `unknown` | Valor serializável da preferência |
| `updatedAt` | `number` (timestamp) | Timestamp de atualização |

---

## 3. Coordenação Multi-Aba via `BroadcastChannel`

O canal `noduct-workspace` notifica mutações entre abas abertas simultaneamente:

- `document_added`: emitido ao salvar um novo documento.
- `document_updated`: emitido ao atualizar um documento existente.
- `document_deleted`: emitido ao remover um arquivo específico.
- `workspace_cleared`: emitido ao limpar todos os arquivos locais.

---

## 4. Resiliência e Fallback Seguro

Quando o IndexedDB estiver indisponível (como em janelas anônimas com bloqueio total de armazenamento ou restrições severas de cookies):
- A classe de erro `WorkspaceUnavailableError` é disparada.
- A aplicação informa ao usuário de maneira amigável que a persistência entre ferramentas está temporariamente desativada, mantendo o funcionamento em memória isolada da sessão atual.

