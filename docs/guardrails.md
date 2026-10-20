# Guardrails do Noduct

Este documento explica como o [Contrato de conformidade](../AGENTS.md#contrato-de-conformidade) é verificado. O CI executa `npm run check` e `npm run verify`; revisão humana complementa verificações que não capturam intenção, linguagem ou equivalência visual. Falhas devem mostrar id, arquivo:linha, motivo, correção e esta âncora. Se um check não mostrar isso, melhore o diagnóstico antes de acrescentar regras.

| Regra | Por quê | Ferramenta | Comando | Configuração | Como corrigir |
| --- | --- | --- | --- | --- | --- |
| 1. Shell e ToolPage | Evitar páginas divergentes | ESLint, UI, paridade | `npm run verify` | [ESLint](../eslint.config.js), [paridade](../tests/e2e/shell-parity.spec.ts) | Componha [AppShell](../packages/design-system/src/shell/AppShell.astro) e [ToolPage](../packages/design-system/src/shell/ToolPage.astro). |
| 2. Área Local (ADR 0006) | Manter entrada e saída locais | UI, e2e | `npm run verify` | [UI](../scripts/validate-ui.ts), [merge](../tests/e2e/merge-pdf.spec.ts) | Use `DropZone` e `DownloadCard` com `workspace` e `connectLocalWorkspace()`; retire controles do header. |
| 3. URLs | Preservar topologia | UI, SEO, unitários | `npm run check` | [topology](../packages/tool-runtime/src/topology.ts) | Derive as URLs de `@noduct/tool-runtime`. |
| 4. Ícones | Preservar allowlist | ESLint, UI | `npm run check -- ui` | [registry](../packages/design-system/src/icons/registry.ts) | Use `Icon` ou `IconSprite`. |
| 5. Tokens | Preservar temas e contraste | Stylelint, contraste | `npm run check -- css` | [Stylelint](../stylelint.config.mjs), [tokens](../packages/design-system/src/tokens.css) | Declare o token nos dois temas e use `var()`. |
| 6. i18n | Evitar texto sem tradução | i18n, UI | `npm run check -- i18n` | [mensagens](../src/i18n/messages.ts), [validador](../scripts/validate-i18n.ts) | Traduza en, pt-BR e es, inclusive cliente e `aria-live`. |
| 7. CSS Modules | Evitar hashes instáveis | UI | `npm run check -- ui` | [validador](../scripts/validate-ui.ts) | Importe classes ou use `data-*`. |
| 8. SEO | Preservar descoberta | SEO do artefato | `npm run verify` | [SEO](../scripts/validate-seo.ts), [Lighthouse](../lighthouserc.cjs) | Corrija title, canonical, hreflang, H1 e JSON-LD. |
| 9. Acessibilidade | Garantir uso por teclado e toque | axe, e2e | `npm run verify` | [audit](../tests/e2e/audit.spec.ts) | Corrija semântica, foco, alvo, contraste e movimento. |
| 10. Testes | Proteger asserções | ratchet, paridade | `npm run verify` | [ratchet](../scripts/check-guardrail-ratchet.ts), [assemble](../scripts/assemble-pages.ts) | Restaure asserções e inclua ferramentas novas na paridade. |
| 11. Guardrails | Impedir contornos ocultos | ratchet, CODEOWNERS | `npm run check -- ratchet` | [config](../guardrails.config.ts), [CODEOWNERS](../.github/CODEOWNERS), [CI](../.github/workflows/ci.yml) | Revise arquivos de controle e obtenha `guardrail-change` para exceções. |
| 12. Pronto | Exigir validação completa | CLI, CI | `npm run verify` | [verify](../scripts/cli/verify.ts) | Registre a saída de cada etapa. |

## Diagnósticos e reparos

<a id="require-app-shell"></a>
### require-app-shell
Página sem shell perde navegação, preferências e SEO compartilhados. Use `AppShell` e, em ferramenta, `ToolPage`; veja [merge-pdf](../packages/merge-pdf/src/pages/index.astro).

<a id="no-raw-svg"></a>
### no-raw-svg
SVG isolado ou glifo diverge do sistema de ícones. Use [Icon](../packages/design-system/src/icons/Icon.astro) e acrescente à allowlist somente com aprovação.

<a id="no-hardcoded-text"></a>
### no-hardcoded-text
Texto visível fixo deixa idiomas incompletos. Use [mensagens do shell](../packages/design-system/src/shell/messages.ts) nos três idiomas, inclusive scripts cliente.

<a id="token-value"></a>
### token-value
Valor visual literal fragmenta os temas. Defina em [tokens.css](../packages/design-system/src/tokens.css) e use `var(--token)`.

<a id="css-rule"></a>
### css-rule

Uma regra geral de CSS encontrou erro. Corrija a declaração na linha indicada conforme [stylelint.config.mjs](../stylelint.config.mjs), sem suprimir a regra.

O Stylelint usa explicitamente `stylelint.config.mjs`; ESLint usa `eslint.config.js`, sem configurações inline e com zero warnings. Configurações alternativas são erro de `check -- ui`. Só os três arquivos canônicos de tokens/temas recebem exceção para declarar valores literais. Durações de transição e animação usam `--duration-*`; `0ms` é aceito para movimento reduzido.

**Decisão de espaçamento em 19/10/2026:** o repositório ainda contém espaçamentos locais em `rem`, `em` e pixels para dimensões de conteúdo, bordas e alvos de toque. Uma regra automática para `padding`, `margin`, `gap` e `inset` sem distinguir esses usos teria falsos positivos. Até 19/11/2026, medir os usos e separar espaçamento global (`--space-*`) das dimensões locais; depois adicionar a regra e fixtures. Valores novos de espaçamento global seguem o Contrato, item 5, desde já.

<a id="lint-rule"></a>
### lint-rule
Uma regra geral de ESLint encontrou erro de código. Corrija a linha indicada sem desativar a regra; consulte [configuração](../eslint.config.js).

<a id="ui-contract"></a>
### ui-contract
Emoji, URL fixa, hash de CSS Module, placeholder i18n ou script inline fora do shell causa divergência. Veja [validate-ui](../scripts/validate-ui.ts) e corrija na fonte.

<a id="architecture-boundary"></a>
### architecture-boundary
Imports internos e dependências invertidas impedem extração dos pacotes. Use exports públicos e a direção do [mapa de pacotes](architecture/README.md). As fronteiras são dados em `guardrails.config.ts` (`architecture`); mudá-las exige `guardrail-change`.

<a id="architecture-doc"></a>
### architecture-doc
A tabela de pacotes de [architecture/README.md](architecture/README.md) é gerada de `guardrails.config.ts` para que documentação e regra não divirjam. Não edite a seção gerada; rode `npx tsx scripts/validate-architecture.ts --write` e revise o diff.

<a id="ratchet"></a>
### ratchet
Supressões e allowlists novas ocultam regressões. Corrija a causa; exceções precisam de `guardrail-change`, justificativa e revisão do dono.

O ratchet compara a branch inteira com o merge-base do épico (`NODUCT_BASE_REF` pode escolher a base), incluindo arquivos novos e trocas um-por-um. Em push, o CI usa `github.event.before`; em PR, usa a base do PR e consulta a label atual pela API. Alterações em `guardrails.config.ts`, regras, validadores, formatadores, configs de lint/teste, CI e paridade exigem a label mesmo sem crescimento de contadores. [CODEOWNERS](../.github/CODEOWNERS) atribui esses controles ao dono. Sem base Git disponível, o check falha com instrução de recuperação.

<a id="script-contract"></a>
### script-contract
Script raiz extra ou slug fixo quebra a descoberta automática. Use subcomandos de [noduct.ts](../scripts/noduct.ts) e manifests.

Em desenvolvimento, o proxy de mesma origem das ferramentas reescreve respostas em streaming. O Astro emite caminhos absolutos no Vite e atualizações de módulo da ferramenta fazem recarga completa; o hub mantém HMR. O teste dedicado é `npx playwright test --config playwright.dev.config.ts`.

<a id="shell-parity"></a>
### shell-parity
Diferença entre hub e ferramenta indica shell ou estilo local indevido. Compare [shell-parity.spec.ts](../tests/e2e/shell-parity.spec.ts) e o hub nos três idiomas, dois temas e perfis exigidos.

A paridade exige header da ferramenta idêntico ao do hub, sem esconder nada e sem controle de workspace (ADR 0006), e compara os estados abertos de Settings, menu mobile e categorias. O listener de `securitypolicyviolation` permanece dormente até a CSP da #33; ele detectará violações quando a política for ativada. Os testes funcionais de Merge PDF rodam nos perfis desktop/tablet/mobile; o projeto Playwright `pages` concentra a paridade do artefato montado.

<a id="agent-scope"></a>
### agent-scope
Área sem regras locais perde restrições de domínio. Crie `AGENTS.md` local com link para a raiz e apenas restrições específicas da área.

<a id="agent-budget"></a>
### agent-budget
Contexto longo pode ser truncado. Raiz: até 200 linhas; local: 5–15; cadeia: até 24 KiB. Mova explicações para docs.

<a id="agent-pointer"></a>
### agent-pointer
Instruções paralelas divergem. Cada `CLAUDE.md` contém só `@AGENTS.md`; Copilot aponta para a raiz; Gemini usa `.gemini/settings.json`.
Depois de criar uma pasta com `AGENTS.md`, gere os ponteiros com `npx tsx scripts/check-agents.ts --write` e confira com `npm run check -- agents`. O gerador escreve `CLAUDE.md`, o ponteiro do Copilot e as cópias das skills; revise o diff antes de comitar.

<a id="agent-link"></a>
### agent-link
Link quebrado impede o agente de encontrar o exemplo. Corrija o destino relativo ao documento; links `file://` são erro. A verificação cobre `AGENTS.md`, `docs/`, `openspec/`, skills do projeto, `.github/`, README, CONTRIBUTING e DEVELOPMENT.

<a id="agent-command"></a>
### agent-command
Comando inexistente gera tentativas falsas. Use apenas scripts do manifesto raiz, subcomandos listados em `scripts/cli/check.ts` e caminhos `npx tsx` existentes. Workflows também são verificados.

<a id="agent-anchor"></a>
### agent-anchor
Um diagnóstico sem âncora não ensina a correção. Adicione id e reparo nesta matriz.

<a id="agent-skill"></a>
### agent-skill
Skills são procedimentos sob demanda lidos por vários agentes. A fonte é `.agents/skills/noduct-*/SKILL.md`, com `name` igual à pasta e `description` dizendo quando usar; `.claude/skills/`, `.github/skills/` e `.gemini/skills/` recebem cópias idênticas por `npx tsx scripts/check-agents.ts --write`. Toda skill aparece na tabela do `AGENTS.md` raiz, porque agentes nem sempre decidem invocá-la sozinhos. Veja [agentes](agentes/README.md#skills).

<a id="agent-doc-index"></a>
### agent-doc-index
Documento sem entrada no índice não é encontrado. Todo arquivo de `docs/` é alcançável a partir de [docs/README.md](README.md), diretamente ou por um `README.md` de pasta. Acrescente a linha ou remova o documento obsoleto.

## Confirmar o contexto carregado

Trabalhe na pasta do pacote e peça ao agente que cite o Contrato, os comandos e as restrições locais antes da primeira edição.

| Ferramenta | Procedimento |
| --- | --- |
| Gemini CLI | Execute `/memory show` e confirme a raiz e o AGENTS local; `context.fileName` está em `.gemini/settings.json`. |
| Antigravity CLI | Sucessor do Gemini CLI para contas gratuitas e AI Pro. Peça o resumo das instruções ativas e confirme que `AGENTS.md` foi carregado; registre o resultado na [avaliação](agentes/avaliacao.md). |
| Claude Code | Execute `/memory` ou `/context` e confira `@AGENTS.md` da raiz e da pasta. O Claude Code só lê `AGENTS.md` nativamente quando não há `CLAUDE.md`; os ponteiros garantem a leitura e não duplicam o contexto. `/hooks` mostra o hook pós-edição de `.claude/settings.json`. |
| Codex | Inicie com `--cd` na pasta do pacote e peça um resumo das instruções ativas; confirme raiz e arquivo local. |
| Copilot | Confira as referências de instrução da sessão; os modos podem variar. Leia também o ponteiro em `.github/copilot-instructions.md`. |
| Cursor e outros | Confira os arquivos de contexto citados pela sessão e peça o mesmo resumo. |

O teste de carregamento é manual e específico da versão do agente. `npm run check -- agents` garante a integridade dos arquivos, não que uma aplicação externa os tenha lido.

## Avaliação e tamanho das tarefas

Entregue em etapas pequenas, com critérios verificáveis, commit e comentário na issue; mudanças de comportamento passam pelo [fluxo OpenSpec](agentes/openspec.md). Execute as [cinco tarefas-padrão](agentes/avaliacao.md) quando o `AGENTS.md`, uma skill ou este contrato mudar, em cada agente usado no projeto. Registre versão, instruções carregadas, resultado de `npm run verify`, intervenção humana e regras violadas. Melhore primeiro os diagnósticos e skills que aparecem repetidamente.
