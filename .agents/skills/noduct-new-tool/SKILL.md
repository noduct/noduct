---
name: noduct-new-tool
description: Cria uma ferramenta nova do Noduct em packages/<slug>/ com npm run new:tool, AppShell, ToolPage, defineTool, i18n em três idiomas e Área Local. Use quando a tarefa pedir uma ferramenta, app ou utilitário novo no hub.
---

# Criar ferramenta

## Pré-condições

- A issue define slug em inglês kebab-case, categoria (`CATEGORY_IDS`), comportamento e critérios de aceite.
- Mudança média ou grande: abra antes uma mudança OpenSpec (`docs/agentes/openspec.md`).

## Referência canônica

[merge-pdf](../../../packages/merge-pdf/AGENTS.md): `src/config.ts`, `src/i18n.ts`, `src/pages/`, `src/components/MergePdfApp.astro`, `src/lib/*-workflow.ts`.

## Passos

1. `npm run new:tool -- <slug> --category <category>`. O comando recusa slug reservado ou existente sem alterar nada e termina com `check` falhando só em `unresolved i18n placeholder`.
2. Substitua cada `TODO(i18n)` em `packages/<slug>/src/i18n.ts`, `src/data/tools.json` e `src/i18n/catalog/*.json` por textos reais em en, pt-BR e es.
3. Troque a lógica de exemplo de `src/lib/` pela operação real, com teste ao lado (`*.test.ts`). Operação de domínio PDF vai para `pdf-core` (skill `noduct-pdf-operation`).
4. Se a ferramenta recebe ou produz arquivos, declare `accept` em `src/config.ts` (`defineTool({ slug, category, accept, ... })`) e mantenha o padrão do [ADR 0006](../../../docs/adr/0006-hybrid-local-workspace.md):

   ```astro
   <DropZone id="<slug>-drop-zone" label={m.dropLabel} accept={tool.accept} locale={locale} workspace={{ confirmLabel: m.addToOperation }} />
   <DownloadCard id="<slug>-download-card" title={m.downloadTitle} fileName={m.downloadFileName} locale={locale} workspace={{ sourceTool: tool.slug }} />
   ```

   No script cliente:

   ```ts
   connectLocalWorkspace(document, createWorkspaceServices({
     loadWorkspace: () => import('@noduct/workspace-core'),
     loadRenderer: () => import('@noduct/pdf-core/render')
   }));
   ```
5. Acrescente o fluxo real a um spec e2e da ferramenta (skill `noduct-e2e-test`); a paridade do shell entra sozinha.
6. Mantenha o status `planned` no catálogo até o lançamento decidido pelo dono.

## Validação

`npm run check` durante o trabalho; `npm run verify` antes do PR.

## Erros comuns

- `unresolved i18n placeholder` (`ui-contract`): sobrou `TODO(i18n)`.
- `require-app-shell`: página montada sem `AppShell` como raiz.
- `script-contract`: slug ou script adicionado à mão no `package.json` raiz, em workflow ou config.
- Controle de workspace no header ou resultado salvo sem pedido do usuário.
