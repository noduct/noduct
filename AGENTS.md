# Diretrizes de engenharia — Noduct

Estas regras valem para pessoas e agentes em todo o repositório. `AGENTS.md` aninhados só acrescentam restrições. O motivo e a verificação de cada regra estão em [guardrails](docs/guardrails.md).

## Comandos essenciais

| Comando | Quando usar |
| --- | --- |
| `npm install` | Preparar o workspace; em CI, usar `npm ci`. |
| `npm run dev -- <slug>` | Desenvolver hub e ferramenta na mesma origem, com HMR; omita o slug para o hub. |
| `npm run check` | Rodar lint, tipos, contratos e unitários durante a implementação. |
| `npm run verify` | Validar build, SEO, e2e e auditoria antes de declarar pronto. |
| `npm run new:tool -- <slug> --category <category>` | Gerar uma ferramenta; completar o i18n gerado. |

## Identidade e fontes de verdade

Noduct oferece ferramentas de PDF, imagem e tarefas rotineiras que processam arquivos localmente no navegador. “No duct” significa que arquivos não são enviados a um backend. O nome anterior é depreciado. O ícone oficial é o monograma geométrico `N` com cadeado em escudo. Interface, metadados, URLs, código e identificadores usam inglês; decisões e documentação técnica usam português brasileiro.

Em conflito, prevalecem [ADRs](docs/adr/), este `AGENTS.md`, [guardrails](docs/guardrails.md), [padrões de interface](docs/padroes-interface.md) e, por último, o texto da issue. Registre divergências na issue ou PR antes de alterar um contrato.

Antes de codar, leia a issue, os [ADRs 0001](docs/adr/0001-static-independent-tools.md), [0003](docs/adr/0003-package-and-repository-strategy.md), [0004](docs/adr/0004-cross-tool-transfer-protocol.md) e [0005](docs/adr/0005-unified-shell-topology-guardrails.md), além de `docs/guardrails.md`. Rode `npm run verify` na base e registre falhas pré-existentes. Escreva um plano curto com os arquivos previstos, implemente em passos pequenos e rode `npm run check` entre eles.

## Fronteiras

- **Sempre:** siga o Contrato abaixo, mantenha TypeScript strict e conteúdo essencial estático em Astro, rode `npm run check` durante o trabalho e `npm run verify` antes de concluir.
- **Pergunte antes:** mudar dependências, topologia, tokens globais ou guardrails; remover ou afrouxar testes; tocar em mais de um pacote fora do escopo da issue. Uma issue que autorize expressamente a mudança já atende essa condição.
- **Nunca:** criar header, footer, Settings ou breadcrumb próprios; usar emoji ou glifos como ícones; usar `alert`, `confirm` ou `prompt` nativos (use `confirmAction()` do shell); escrever URL do produto à mão; adicionar supressão ou `.skip` sem a label e justificativa exigidas; fazer push ou merge em `main`; criar repositório ou expor tokens.

## Contrato de conformidade — issue #39, seção 4

Toda issue de aplicação, componente ou documentação, a partir desta, deve cumprir:

1. **Shell:**
   - a página usa `AppShell` (`page` no hub e nas ferramentas, `app` no PDF Studio);
   - a ferramenta usa `ToolPage`;
   - é proibido criar header, footer, Settings, breadcrumb ou estrutura de página próprios;
   - a referência visual é o hub.
2. **Workspace ([ADR 0006](docs/adr/0006-hybrid-local-workspace.md)):** a Área Local entra pela `DropZone` e pelo `DownloadCard` com `workspace`, ligados por `connectLocalWorkspace()`; nada de workspace no header nem seletor próprio.
3. **URLs:** só via `@noduct/tool-runtime` (`defineTool()`, `topology`). Nenhum literal `noduct.github.io` ou `/noduct` fora de `topology.ts`.
4. **Ícones:** só via `Icon` / `IconSprite`, a partir da allowlist `icons/registry.ts`. Emoji e glifos de texto usados como ícone são proibidos.
5. **Tokens:** cores, raios, sombras, z-index, durações e espaçamentos globais só via tokens. Um token novo entra primeiro em `tokens.css`, com contraste AA nos dois temas.
6. **i18n:** en, pt-BR e es completos, inclusive no script cliente, nos anúncios `aria-live`, nos erros e nos nomes de arquivo gerados. Pacotes de domínio devolvem códigos.
7. **CSS Modules:** classes importadas do módulo ou estado via `data-*`; nunca hashes escritos à mão.
8. **SEO:** title, description, canonical autorreferente, hreflang recíproco e um único H1. Um único bloco JSON-LD com `@graph`.
9. **Acessibilidade:** WCAG 2.1 AA, axe sem violações nos dois temas, teclado completo, alvos de 44 px em toque, foco visível único e `prefers-reduced-motion` respeitado.
10. **Testes:**
    - nenhuma asserção existente é afrouxada, pulada (`.skip`) ou removida sem justificativa registrada no PR e aprovação explícita do dono;
    - toda ferramenta nova entra em `shell-parity.spec.ts` e no `assemble-pages`.
11. **Guardrails:** é proibido adicionar `eslint-disable`, `stylelint-disable`, `@ts-ignore`, `@ts-expect-error` ou entradas em allowlists sem a label `guardrail-change` e justificativa no PR.
12. **Pronto:** `npm run verify` verde localmente e no CI (seção 6, Fase 6).

## Mapa e referências canônicas

| Área | Responsabilidade e referência |
| --- | --- |
| `src/` | Hub estático e rotas; [página do hub](src/pages/index.astro). |
| `packages/tool-runtime/` | URLs, locale, SEO e catálogo; [topology](packages/tool-runtime/src/topology.ts). |
| `packages/design-system/` | Shell, tokens e componentes; [componente com CSS Module](packages/design-system/src/components/DropZone.astro) e [Icon](packages/design-system/src/icons/Icon.astro). |
| `packages/pdf-core/` | Domínio PDF puro; [contratos](docs/architecture/pdf-core-contracts.md). |
| `packages/workspace-core/` | Persistência local e transferências; [arquitetura](docs/architecture/local-workspace.md). |
| `packages/merge-pdf/` | Ferramenta completa de referência; [página](packages/merge-pdf/src/pages/index.astro). |
| `packages/tool-template/` | Esqueleto de ferramenta; [guia](docs/criar-nova-ferramenta.md). |
| `scripts/` | CLI e validadores; [CLI](scripts/noduct.ts). |
| `tests/` | Unitários e e2e; [unitário](tests/unit/seo.test.ts), [paridade](tests/e2e/shell-parity.spec.ts) e [axe](tests/e2e/audit.spec.ts). |
| `docs/` | ADRs, contratos e [receitas](docs/agentes/receitas/). |

Mensagens i18n de referência: [hub](src/i18n/messages.ts) e [shell](packages/design-system/src/shell/messages.ts).

## Receitas de trabalho

[Nova ferramenta](docs/agentes/receitas/nova-ferramenta.md) · [Componente](docs/agentes/receitas/componente-design-system.md) · [Ícone](docs/agentes/receitas/icone.md) · [Token](docs/agentes/receitas/token.md) · [i18n](docs/agentes/receitas/i18n.md) · [Rota do hub](docs/agentes/receitas/rota-hub.md) · [Operação PDF](docs/agentes/receitas/operacao-pdf.md) · [E2E e axe](docs/agentes/receitas/e2e-axe-paridade.md).

## Dúvidas, pronto e GitHub

Commits: `tipo(escopo): descrição em português (#<issue>)` — tipos `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`.

Se houver dúvida sobre contrato ou uma falha de guardrail, pare a mudança dependente, registre a dúvida no PR e pergunte. Nunca contorne o guardrail para “fazer passar”. Declare pronto somente com a saída de `npm run verify` e o checklist da issue; execute uma fase por vez, com commit e comentário na issue ao final.

Cada épico usa `epic/<slug>` a partir de `main`; cada issue usa branch própria a partir do épico e volta para ele após validação. Não integre issues diretamente em `main`. Use `node scripts/github/manage.mjs` para operações GitHub, seguindo [o protocolo](scripts/github/README.md): consulte, revise o plano sem `--execute`, depois execute. Para push, use `npm run github -- push <branch>` antes de repetir com `--execute`. Nunca registre credenciais.

Renomear ou criar repositórios, publicar, criar a label `guardrail-change` e proteger branches são ações do dono. Prepare a mudança e peça autorização explícita para essas ações.
