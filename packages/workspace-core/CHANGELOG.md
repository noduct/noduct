# Changelog

## 0.3.0 — 2026-10-19

- `renameDocument()` altera somente o nome nos metadados. O payload, a miniatura, a retenção e a data de salvamento permanecem intactos.

## 0.2.0 — 2026-10-19

- Schema v3: retenção efêmera de 24 horas, migração não destrutiva do v2 e erros por código.
- `acquireDocument()` segura um Web Lock compartilhado até `release()`; a limpeza exige lock exclusivo.
- Erros distintos para schema mais novo e upgrade bloqueado por outra aba.
- O contrato de erros e os campos de retenção substituem a API anterior; consumidores devem traduzir os códigos.
- Schema v4: payloads na store `document_blobs`. `touchDocument` e `setRetention` regravam só metadados; a migração de v1–v3 move os blobs numa passada única.
- `listDocumentSummaries()` e o tipo `WorkspaceDocumentSummary` listam sem ler payloads; `getWorkspaceSize()` passa a usá-los.
- Store `document_thumbnails` no schema v4: `saveThumbnail()`, `listThumbnails()`, evento `thumbnail_updated` e remoção junto com o documento (ADR 0006).
- `setRetention` mantém `updatedAt` e renova `lastAccessedAt`, porque a escolha do usuário conta como acesso.
