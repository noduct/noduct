# Diretrizes de engenharia — Noduct

Estas regras valem para pessoas e agentes em todo o repositório. O `AGENTS.md` da pasta editada só acrescenta restrições locais. O motivo e a verificação de cada regra estão em [guardrails](docs/guardrails.md); o índice de toda a documentação está em [docs/README.md](docs/README.md).

## Comandos essenciais

| Comando | Quando usar |
| --- | --- |
| `npm install` | Preparar o workspace; em CI, usar `npm ci`. |
| `npm run dev -- <slug>` | Desenvolver hub e ferramenta na mesma origem; omita o slug para o hub. |
| `npm run check` | Rodar lint, tipos, contratos e unitários durante a implementação; `npm run check -- <nome>` roda um só verificador. |
| `npm run verify` | Validar build, páginas, SEO e e2e antes de declarar pronto. |
| `npm run new:tool -- <slug> --category <category>` | Gerar uma ferramenta; completar o i18n gerado. |
| `npx openspec list` | Ver mudanças em andamento e specs vivas ([fluxo](docs/agentes/openspec.md)). |

## Identidade e fontes de verdade

Noduct oferece ferramentas de PDF, imagem e tarefas rotineiras que processam arquivos localmente no navegador. “No duct” significa que arquivos não são enviados a um backend. O nome anterior é depreciado. O ícone oficial é o monograma geométrico `N` com cadeado em escudo. Interface, metadados, URLs, código e identificadores usam inglês; decisões, specs e documentação técnica usam português brasileiro. Termos do domínio estão no [glossário](docs/glossario.md).

Em conflito, prevalecem [ADRs](docs/adr/README.md), este `AGENTS.md`, as [specs vivas](openspec/specs/), [guardrails](docs/guardrails.md), [padrões de interface](docs/padroes-interface.md) e, por último, o texto da issue. Registre divergências na issue ou PR antes de alterar um contrato.

## Invariantes da arquitetura

- Hub e ferramentas são sites Astro estáticos na mesma origem: hub em `/`, cada ferramenta em `/<slug>/`, idiomas em `/pt-br/` e `/es/`.
- Arquivos do usuário nunca saem do navegador; a Área Local é IndexedDB nesta origem.
- Pacotes só dependem na direção do [mapa de pacotes](docs/architecture/README.md) e só por `exports` públicos.
- `@noduct/tool-runtime` é a única fonte de URL, locale, SEO e catálogo; `@noduct/design-system` é a única fonte de shell, tokens e ícones.
- Pacotes de domínio (`pdf-core`, `workspace-core`) não têm DOM nem texto de interface: devolvem códigos.
- Ferramentas são descobertas pelo campo `noduct.slug` do `package.json`; nenhuma lista de slugs é escrita à mão.

## Como trabalhar

1. Leia a issue, o `AGENTS.md` da pasta e, se a tarefa tocar uma decisão, o ADR citado no [índice](docs/adr/README.md).
2. Rode `npm run verify` na base e registre falhas pré-existentes.
3. Tarefa pequena: plano curto no PR com os arquivos previstos. Ferramenta nova, componente compartilhado ou mudança de comportamento: abra uma mudança [OpenSpec](docs/agentes/openspec.md) antes de codar.
4. Quando o pedido for um padrão (“em todo o app”, “nas ferramentas”), o plano lista todos os pontos de uso — hub, ferramentas e template — e a entrega aplica o padrão em todos e remove o código antigo.
5. Implemente em passos pequenos e rode `npm run check` entre eles. Corrija a causa de cada falha seguindo a âncora do diagnóstico.

## Skills de tarefas recorrentes

Antes de uma destas tarefas, leia a skill correspondente em `.agents/skills/` (cópias em `.claude/skills/` e `.github/skills/`):

| Tarefa | Skill |
| --- | --- |
| Criar ferramenta | [noduct-new-tool](.agents/skills/noduct-new-tool/SKILL.md) |
| Componente compartilhado | [noduct-component](.agents/skills/noduct-component/SKILL.md) |
| Ícone | [noduct-icon](.agents/skills/noduct-icon/SKILL.md) |
| Token visual | [noduct-token](.agents/skills/noduct-token/SKILL.md) |
| Texto visível em qualquer idioma | [noduct-i18n](.agents/skills/noduct-i18n/SKILL.md) |
| Página ou rota do hub | [noduct-hub-route](.agents/skills/noduct-hub-route/SKILL.md) |
| Operação PDF | [noduct-pdf-operation](.agents/skills/noduct-pdf-operation/SKILL.md) |
| Teste e2e | [noduct-e2e-test](.agents/skills/noduct-e2e-test/SKILL.md) |

## Fronteiras

- **Sempre:** siga o Contrato abaixo, reutilize os componentes do design system antes de escrever estilo próprio, mantenha TypeScript strict e conteúdo essencial estático em Astro, rode `npm run check` durante o trabalho e `npm run verify` antes de concluir.
- **Pergunte antes:** mudar dependências, topologia, tokens globais ou guardrails; remover ou afrouxar testes; tocar em mais de um pacote fora do escopo da issue. Uma issue que autorize expressamente a mudança já atende essa condição.
- **Nunca:** criar header, footer, Settings ou breadcrumb próprios; usar emoji ou glifos como ícones; usar `alert`, `confirm` ou `prompt` nativos (use `confirmAction()` do shell); escrever URL do produto à mão; adicionar supressão ou `.skip` sem a label e justificativa exigidas; editar arquivos gerados (cópias de skills, skills `openspec-*`, seção gerada do mapa de pacotes); fazer push ou merge em `main`; criar repositório ou expor tokens.

## Contrato de conformidade

Toda mudança de aplicação, componente ou documentação cumpre:

1. **Shell:**
   - a página usa `AppShell` (`page` no hub e nas ferramentas, `app` no PDF Studio);
   - a ferramenta usa `ToolPage`;
   - é proibido criar header, footer, Settings, breadcrumb ou estrutura de página próprios;
   - a referência visual é o hub.
2. **Workspace ([ADR 0006](docs/adr/0006-hybrid-local-workspace.md)):** a Área Local entra pela `DropZone` e pelo `DownloadCard` com `workspace`, ligados por `connectLocalWorkspace()`; nada de workspace no header nem seletor próprio.
3. **URLs:** só via `@noduct/tool-runtime` (`defineTool()`, `topology`). Nenhum literal `noduct.github.io` ou `/noduct` fora de `topology.ts`.
4. **Ícones:** só via `Icon` / `IconSprite`, a partir da allowlist `icons/registry.ts`. Emoji e glifos de texto usados como ícone são proibidos.
5. **Tokens e componentes:** cores, raios, sombras, z-index, durações e espaçamentos globais só via tokens. Um token novo entra primeiro em `tokens.css`, com contraste AA nos dois temas. Ações com texto usam `Button` (variantes em [padrões de interface](docs/padroes-interface.md)); nenhum CSS local recria o visual de botão.
6. **i18n:** en, pt-BR e es completos, inclusive no script cliente, nos anúncios `aria-live`, nos erros e nos nomes de arquivo gerados. Pacotes de domínio devolvem códigos.
7. **CSS Modules:** classes importadas do módulo ou estado via `data-*`; nunca hashes escritos à mão.
8. **SEO:** title, description, canonical autorreferente, hreflang recíproco e um único H1. Um único bloco JSON-LD com `@graph`.
9. **Acessibilidade:** WCAG 2.1 AA, axe sem violações nos dois temas, teclado completo, alvos de 44 px em toque, foco visível único e `prefers-reduced-motion` respeitado.
10. **Testes:**
    - nenhuma asserção existente é afrouxada, pulada (`.skip`) ou removida sem justificativa registrada no PR e aprovação explícita do dono;
    - toda ferramenta nova entra em `shell-parity.spec.ts` e no `assemble-pages`.
11. **Guardrails:** é proibido adicionar `eslint-disable`, `stylelint-disable`, `@ts-ignore`, `@ts-expect-error` ou entradas em allowlists sem a label `guardrail-change` e justificativa no PR.
12. **Pronto:** `npm run verify` verde localmente e no CI. Mudança visual é conferida no navegador, nos dois temas e nos estados que mudam em runtime (habilitado, desabilitado, hover). Teste novo verifica o resultado renderizado, não o texto do código-fonte.

## Referências canônicas

| Tipo de tarefa | Exemplo a seguir |
| --- | --- |
| Ferramenta completa | [merge-pdf](packages/merge-pdf/src/pages/index.astro) |
| Página do hub | [home](src/pages/index.astro) |
| Componente com CSS Module | [DropZone](packages/design-system/src/components/DropZone.astro), [Button](packages/design-system/src/components/Button.astro), [Icon](packages/design-system/src/icons/Icon.astro) |
| URLs e SEO | [topology](packages/tool-runtime/src/topology.ts) |
| Mensagens i18n | [hub](src/i18n/messages.ts), [shell](packages/design-system/src/shell/messages.ts) |
| Testes | [unitário](tests/unit/seo.test.ts), [paridade](tests/e2e/shell-parity.spec.ts), [axe](tests/e2e/audit.spec.ts) |
| CLI e validadores | [noduct.ts](scripts/noduct.ts) |

## Dúvidas, pronto e GitHub

Commits: `tipo(escopo): descrição em português (#<issue>)` — tipos `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`.

Se houver dúvida sobre contrato ou uma falha de guardrail, pare a mudança dependente, registre a dúvida no PR e pergunte. Nunca contorne o guardrail para “fazer passar”. Declare pronto somente com a saída de `npm run verify` e o checklist da issue. Entregue em etapas pequenas e verificáveis, cada uma com commit e comentário na issue.

Cada épico usa `epic/<slug>` a partir de `main`; cada issue usa branch própria a partir do épico e volta para ele após validação. Não integre issues diretamente em `main`. Use `node scripts/github/manage.mjs` para operações GitHub, seguindo [o protocolo](scripts/github/README.md): consulte, revise o plano sem `--execute`, depois execute. Para push, use `npm run github -- push <branch>` antes de repetir com `--execute`. Nunca registre credenciais.

Renomear ou criar repositórios, publicar, criar a label `guardrail-change` e proteger branches são ações do dono. Prepare a mudança e peça autorização explícita para essas ações.
