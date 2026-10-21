## 1. Design system

- [x] 1.1 Adicionar `setCompact()` ao controlador da `DropZone` e os estilos de `data-compact` em `DropZone.module.css`. Validar com `npm run check -- css`.
- [x] 1.2 Adicionar `variant` à `ReorderableList`, a posição numérica em `ReorderableItemMarkup`, setas horizontais, arrasto 2D e rótulos “antes/depois” em `messages.ts` nos três idiomas. Validar com `npx vitest run tests/unit/file-workflow.test.ts`.
- [x] 1.3 Corrigir os dois estados da `DropZone` e os cartões mobile: botões de origem equivalentes, rim light e hover sem contorno extra, cabeçalho compacto e alvos de 44 px. Inspecionar claro e escuro no navegador e validar com `npm run check -- css` e axe.

## 2. Merge PDF

- [ ] 2.1 Reorganizar `MergePdfApp` em barra de comando compacta e grade, com soltar na bancada inteira. Validar com `npm run check` e `npx playwright test tests/e2e/merge-pdf.spec.ts`.
- [x] 2.2 Estabilizar o arrasto livre, preservar o foco na reordenação por teclado e reduzir a distância entre header, breadcrumb e bancada. Testar ponteiro, teclado, mobile e desktop no artefato montado.

## 3. Documentação

- [x] 3.1 Atualizar `CHANGELOG.md` do design system e `docs/componentes-fluxo-arquivos.md`. Validar com `npx openspec validate merge-pdf-workbench --strict` e `npm run check -- agents`.
