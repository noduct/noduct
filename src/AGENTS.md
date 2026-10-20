Complementa [AGENTS.md](../AGENTS.md).

# Escopo local
- `pages/` só declara rotas (`localeStaticPaths()`) e renderiza um componente de `components/pages/`.
- Lógica pura fica em `lib/`; páginas e componentes importam pela fachada `features/<área>/`.
- Catálogo em `data/` e `i18n/catalog/`; mensagens do hub em `i18n/messages.ts`; textos do shell vêm de `@noduct/design-system`.
- O hub não importa `pdf-core` nem `workspace-core`, exceto em `components/workspace/` ([mapa de pacotes](../docs/architecture/README.md)).
- HTML essencial, links e metadados existem sem JavaScript.
- Testes do hub ficam em `tests/unit/` e `tests/e2e/`.
