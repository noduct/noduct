# Changelog

## 0.2.0 — 2026-10-19

- Subpath `@noduct/pdf-core/render` com `renderPdfThumbnail(blob, options)`: primeira página em JPEG via PDF.js (`pdfjs-dist@6.3.289`, build legacy), carregado sob demanda, com leitura por faixas para arquivos grandes ([ADR 0006](../../docs/adr/0006-hybrid-local-workspace.md)).
- Erros movidos para `src/errors.ts`, reexportados pelo entrypoint, para o renderer não carregar o `pdf-lib`.

## 0.1.0

- Contratos, inspeção e mesclagem com `pdf-lib`.
