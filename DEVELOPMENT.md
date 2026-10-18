# Noduct — desenvolvimento local

## Pré-requisitos

Node.js 22.18+ e npm 10+. No PowerShell, use `npm.cmd` caso a política de execução bloqueie `npm.ps1`.

```bash
npm install
npm run dev
```

`dev` inicia o hub e todas as ferramentas declaradas por `noduct.slug` em `packages/*/package.json`. Acesse `http://localhost:4321/`; cada ferramenta também está disponível na mesma origem em `/<slug>/`, com HMR. As portas internas começam em 4331 e são atribuídas pela ordem do manifesto. `npm run dev -- merge-pdf` limita as ferramentas iniciadas. `npm run dev -- --only merge-pdf` inicia somente a ferramenta na porta 4321; links do hub podem retornar 404.

## Comandos públicos

| Comando                                      | Função                                                       |
| -------------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                                | Hub e ferramentas em desenvolvimento                         |
| `npm run build`                              | Compila o hub e cada ferramenta uma vez; monta `dist-pages/` |
| `npm run preview`                            | Serve exatamente `dist-pages/` em 4321                       |
| `npm run check`                              | Lint, CSS, tipos, contratos, testes e guardrails             |
| `npm run test` / `npm run test:watch`        | Vitest                                                       |
| `npm run test:e2e`                           | Playwright com artefato já compilado                         |
| `npm run verify`                             | `check`, `build`, páginas, SEO e E2E nessa ordem             |
| `npm run new:tool -- <slug> --category <id>` | Cria uma ferramenta a partir do template                     |
| `npm run format`                             | Formata o repositório                                        |
| `npm run github -- ...`                      | Automação GitHub aprovada                                    |

`check` aceita um verificador isolado: `ui`, `architecture`, `catalog`, `i18n`, `sponsors`, `ratchet`, `css`, `types`, `scripts`, `pages` ou `seo`. Os dois últimos exigem `dist-pages/` atualizado. `build` aceita slugs opcionais para um build parcial, mas apenas o build completo gera um artefato Pages utilizável por `preview` e E2E.

`test:e2e` rejeita artefatos ausentes ou antigos com base no hash de código e configuração em `dist-pages/.build-info.json`. O `build` também prepara a fixture de testes; o E2E não recompila nada. Na primeira execução, instale Chromium com `npx playwright install chromium`.
O teste dedicado da mesma origem em desenvolvimento pode ser executado com `npx playwright test --config playwright.dev.config.ts`.

## Nova ferramenta

Execute `npm run new:tool -- <slug> --category <id>`. O gerador valida slug e categoria antes de copiar o template, atualiza catálogo e traduções, instala o workspace e executa `check`. Os campos `TODO(i18n)` devem ser traduzidos e revisados antes de o guardrail de UI permitir a publicação. Veja [docs/criar-nova-ferramenta.md](docs/criar-nova-ferramenta.md).

## Publicação

O workflow de Pages valida a URL configurada, executa `npm run verify` e publica somente `dist-pages/`. O fluxo de branch por épico e as regras de engenharia estão em [AGENTS.md](AGENTS.md).
