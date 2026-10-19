# Criar ferramenta

## Pré-condições

A issue define slug, categoria, idiomas e critérios do Contrato #39.

## Arquivos afetados

`packages/<slug>/`, catálogo em `src/data/`, mensagens em `src/i18n/catalog/` e testes.

## Referência canônica

[merge-pdf](../../../packages/merge-pdf/src/pages/index.astro) e [template](../../../packages/tool-template/src/pages/index.astro).

## Passos e validação

1. Leia [AGENTS.md](../../../AGENTS.md) e [guardrails](../../guardrails.md).
2. Faça um plano curto e implemente a menor mudança verificável.
3. Execute `npm run new:tool -- <slug> --category <category>`; complete os TODO(i18n).
4. Se a ferramenta recebe ou produz arquivos, mantenha o padrão híbrido do [ADR 0006](../../adr/0006-hybrid-local-workspace.md): `DropZone` e `DownloadCard` com `workspace` e `connectLocalWorkspace(document, createWorkspaceServices(...))`; ferramentas de PDF passam `loadRenderer` para ter miniaturas.
5. `npm run check`; `npm run verify`.
6. Registre o resultado e a justificativa no PR.

## Erros comuns

Editar a lista de ferramentas à mão no CLI; deixar placeholder; criar shell ou URL próprios; montar workspace no header ou salvar resultado sem pedido do usuário.
