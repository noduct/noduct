# Noduct — Development & Workspace Guide

This guide covers everything you need to run, test, build, and contribute to the **Noduct** workspace.

---

## Prerequisites

- **Node.js:** `22.18` or higher
- **npm:** `10.0` or higher

---

## Getting Started

Install workspace dependencies and launch the local development server:

```bash
# Install dependencies across all packages
npm install

# Start the Astro development server
npm run dev
```

The terminal will output the local URL (defaults to `http://localhost:4321/`).

### Desenvolvimento local nesta etapa do épico

`npm run dev` inicia apenas o hub. Para testar o Merge PDF, execute `npm run dev:merge-pdf` em outro terminal e abra a URL `/merge-pdf/` que o Astro mostrar. Se as portas entrarem em conflito, informe portas distintas com `-- --port 4321` e `-- --port 4322`. No PowerShell que bloqueia `npm.ps1`, use `npm.cmd` no lugar de `npm`.

O servidor único para hub e ferramentas na mesma origem é uma entrega da Fase 6 da issue #39. O build composto atual pode ser verificado com `npm run build:pages`.

Para abrir hub e Merge PDF na mesma origem com o artefato montado, execute `npm run build:pages` e depois `node scripts/serve-pages.mjs`; acesse `/` e `/merge-pdf/` em `http://127.0.0.1:4321`. Esse servidor não oferece HMR.

---

## Quality & Verification

Run the verification pipeline to ensure code quality, type-safety, tests, and SEO compliance:

```bash
# Verificar regras de código, tokens, UI e limites entre pacotes
npm run lint
npm run lint:styles
npm run validate:ui
npm run validate:architecture

# Run TypeScript diagnostics across the workspace
npm run typecheck

# Execute unit and contract tests (Vitest)
npm test

# Montar o hub e as ferramentas; validar páginas e SEO
npm run build:pages

# Compilar fixtures e o artefato composto; executar Playwright
npm run test:e2e
```

> **Note:** First-time E2E runs require installing browser binaries once via `npx playwright install chromium`.

---

## Workspace Structure

The project is structured as a modular monorepo:

- `src/`: The core Astro SSG hub, pages, layouts, and data catalog.
- `packages/design-system/`: tokens, shell compartilhado (`AppShell`, `ToolPage`) e componentes reutilizáveis.
- `packages/tool-template/`: Standalone demonstrator application and starter template for independent micro-apps.
- `docs/`: Technical specifications, architecture decisions (ADRs), SEO strategy, and interface guardrails.
- `scripts/`: Automated validation scripts for catalog schema, SEO integrity, and sponsorships.
- `tests/`: Vitest unit tests and Playwright end-to-end suites.

---

## Building & Publishing

`npm run build:pages` gera o artefato estático composto em `dist-pages/`. O build intermediário apenas do hub fica em `dist/`.

Deployment is handled via GitHub Pages workflow upon push to `main`. For hosting conditions and deployment details, refer to:

- [`docs/deploy-github-pages.md`](docs/deploy-github-pages.md)
- [`docs/padroes-interface.md`](docs/padroes-interface.md)
- [`docs/arquitetura.md`](docs/arquitetura.md)

---

## License

MIT License. See [LICENSE](LICENSE) for details.
