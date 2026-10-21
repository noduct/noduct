Complementa [AGENTS.md](../../AGENTS.md).

# Escopo local
- Ferramenta de referência: ao criar outra, siga a mesma estrutura de arquivos.
- `src/config.ts` declara a ferramenta com `defineTool()`; o slug se repete só em `noduct.slug` do `package.json`.
- `src/pages/` só compõe `AppShell` e `ToolPage`; a interface fica em `src/components/MergePdfApp.astro` com CSS Module.
- Regras de fluxo testáveis ficam em `src/lib/*.ts`, com o teste ao lado (`*.test.ts`).
- Mensagens en, pt-BR e es em `src/i18n.ts`, inclusive script cliente, erros e nome do arquivo gerado.
- Área Local só via `DropZone` e `DownloadCard` com `workspace` e `connectLocalWorkspace()`.
- E2E em `tests/e2e/merge-pdf.spec.ts`, sobre o artefato montado.
