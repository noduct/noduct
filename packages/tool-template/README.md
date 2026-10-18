# Template de ferramenta Noduct

Esta aplicação Astro demonstra a composição com `AppShell`, `ToolPage` e `defineTool()`. O exemplo limpa texto localmente e não é indexável.

Na raiz do workspace, execute `npm run new:tool -- <slug> --category <id>`. O gerador copia este template, configura `src/config.ts`, `package.json`, catálogo e traduções. Depois, substitua os marcadores `TODO(i18n)`, implemente a funcionalidade real e execute `npm run verify`.

Para uso em um repositório próprio após a extração, siga `docs/criar-nova-ferramenta.md` e a topologia de `@noduct/tool-runtime`.
