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
- **Versão Atual do Esquema:** `3`

### 2.1 Store `documents` (KeyPath: `id`)

Armazena os documentos PDF manipulados localmente:

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
| `blob`           | `Blob`                        | Payload binário real do arquivo                                 |
| `metadata`       | `object` (opcional)           | Metadados arbitrários locais (ex: ferramenta geradora)          |

**Índices:**

- `createdAt`: ordenação cronológica
- `updatedAt`: identificação de arquivos recentes
- `lastAccessedAt`: varredura de documentos com prazo vencido
- `name`: busca e listagem alfabética

### 2.1.1 Migração v2 → v3

O upgrade preserva blobs e demais campos. Cada documento v2 recebe `retention: 'ephemeral'` e `lastAccessedAt = updatedAt`; o índice novo é criado na mesma transação de upgrade. A migração tem fixture v2 e teste de integridade. Documentos novos usam `ephemeral` salvo escolha expressa do usuário.

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

Um documento efêmero expira **depois** de 24 horas sem acesso (`now - lastAccessedAt > 24 h`). Leitura, abertura e transferência renovam `lastAccessedAt`; listagens e varreduras não renovam. `setRetention(id, 'persistent')` impede expiração automática; voltar a `ephemeral` reativa o prazo. A limpeza devolve os IDs removidos, emite `document_deleted` para cada um e limpa também tickets de transferência vencidos.

A limpeza é acionada na abertura do workspace, na abertura do drawer e quando a aba volta a ficar visível. Não há timer de fundo. Antes de excluir, ela tenta obter sem espera o Web Lock `noduct-doc-<id>`; operações longas usam o mesmo lock. Se a API de Web Locks não existir, a limpeza automática não exclui documentos, pois não pode garantir que outra aba não esteja usando o blob. O `BroadcastChannel` distribui as exclusões e mudanças de retenção às outras abas para atualização da interface.

O drawer apresenta o prazo restante calculado no momento da abertura, permite “Manter neste dispositivo” e “Permitir expiração” e anuncia a remoção de temporários via `aria-live`. Limpar dados do navegador remove inclusive os documentos persistentes.

## 5. Erros e orçamento de recursos

`WorkspaceError` e `ResourceBudget` devolvem `code` e `params` estruturados. Bytes, nomes e perfil continuam dados de domínio; o texto visível é produzido pela UI no locale atual. A mensagem inglesa de uma exceção serve somente a diagnóstico e não deve ser mostrada diretamente ao usuário.

---

## 6. Resiliência e Fallback Seguro

Quando o IndexedDB estiver indisponível (como em janelas anônimas com bloqueio total de armazenamento ou restrições severas de cookies):

- A classe de erro `WorkspaceUnavailableError` é disparada.
- A aplicação pode continuar o processamento e oferecer download sem salvar no Local Workspace. A UI deve informar que a persistência local está indisponível; não há fallback de workspace em memória implementado neste pacote.
