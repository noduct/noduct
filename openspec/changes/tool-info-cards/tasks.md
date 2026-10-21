## 1. Design system

- [x] 1.1 Criar `ToolInfoCard`, `RichText`, `ToolSharedInfo` e mensagens compartilhadas. Validar com `npx vitest run packages/design-system/src/content/rich-text.test.ts packages/design-system/src/shell/tool-info-messages.test.ts`.

## 2. Adoção

- [x] 2.1 Adotar no Merge PDF e no tool-template; atualizar `new:tool`. Validar com `npm run check -- i18n` e `npm run check -- css`.

## 3. Documentação

- [x] 3.1 Atualizar padrões, design system, criar ferramenta e skill. Validar com `npx openspec validate tool-info-cards --strict` e `npm run check -- agents`.
