Complementa [AGENTS.md](../../AGENTS.md).

# Escopo local
- `shell/` é o shell comum (`AppShell`, `ToolPage`, Settings); `components/` e `controls/` são reutilizáveis; `*-ui/` e `file-workflow/` são runtimes cliente.
- Tokens em `src/tokens.css` antes de qualquer valor global novo, nos dois temas.
- Ícones vêm de `Icon` e da allowlist `src/icons/registry.ts`.
- Componentes usam CSS Modules e estados `data-*`; preserve 44 px no toque, foco visível e movimento reduzido.
- Serviços de domínio chegam injetados; não importe `pdf-core` nem `workspace-core`.
- Export novo entra em `package.json` `exports`; mudança de API pública exige versão e `CHANGELOG.md`.
- Mudança de componente alcança todos os pontos de uso, sem estilos duplicados.
