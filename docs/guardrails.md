# Guardrails do Noduct

Este documento explica como o [Contrato da issue #39](../AGENTS.md#contrato-de-conformidade--issue-39-seção-4) é verificado. O CI executa `npm run check` e `npm run verify`; revisão humana complementa verificações que não capturam intenção, linguagem ou equivalência visual. Falhas devem mostrar id, arquivo:linha, motivo, correção e esta âncora. Se um check não mostrar isso, melhore o diagnóstico antes de acrescentar regras.

| Regra do Contrato | Ferramenta e comando | Configuração ou exemplo | Correção |
| --- | --- | --- | --- |
| 1. Shell e ToolPage | ESLint, UI, e2e; `npm run check`, `npm run verify` | [ESLint](../eslint.config.js), [paridade](../tests/e2e/shell-parity.spec.ts) | Componha [AppShell](../packages/design-system/src/shell/AppShell.astro) e [ToolPage](../packages/design-system/src/shell/ToolPage.astro). Revise visualmente com o hub. |
| 2. Workspace no header | E2E e revisão; `npm run verify` | [shell-parity](../tests/e2e/shell-parity.spec.ts) | Monte o drawer no slot `actions`. |
| 3. URLs | UI, unitários de topologia, SEO; `npm run check`, `npm run verify` | [topology](../packages/tool-runtime/src/topology.ts), [SEO](../scripts/validate-seo.ts) | Use `@noduct/tool-runtime`; remova literais de origem e prefixos manuais. |
| 4. Ícones | ESLint, UI; `npm run check` | [registry](../packages/design-system/src/icons/registry.ts), [Icon](../packages/design-system/src/icons/Icon.astro) | Escolha um ícone permitido e renderize por `Icon`/`IconSprite`. |
| 5. Tokens | Stylelint e contraste; `npm run check` | [Stylelint](../stylelint.config.mjs), [tokens](../packages/design-system/src/tokens.css), [contraste](../tests/unit/theme-colors.test.ts) | Defina token antes do uso e confira AA nos dois temas. |
| 6. i18n e erros de domínio | ESLint, i18n, unitários; `npm run check` | [mensagens](../src/i18n/messages.ts), [validador](../scripts/validate-i18n.ts) | Traduza en, pt-BR e es, inclusive cliente e aria-live; domínio retorna código. |
| 7. CSS Modules | UI; `npm run check` | [validador](../scripts/validate-ui.ts), [exemplo](../packages/design-system/src/components/DropZone.astro) | Importe classes do módulo ou use `data-*`; nunca copie hash. |
| 8. SEO | SEO do artefato; `npm run verify` | [validador](../scripts/validate-seo.ts) | Corrija title, description, canonical, hreflang, H1 e JSON-LD por topologia. |
| 9. Acessibilidade | axe, e2e, revisão de teclado/toque; `npm run verify` | [audit](../tests/e2e/audit.spec.ts) | Corrija semântica, foco, alvo, contraste e movimento; teste nos dois temas. |
| 10. Testes e ferramentas novas | ratchet, paridade, montagem; `npm run check`, `npm run verify` | [ratchet](../scripts/check-guardrail-ratchet.ts), [assemble](../scripts/assemble-pages.ts) | Restaure asserções; ferramenta nova deve entrar por descoberta, com cobertura e paridade. Revisão humana aprova mudanças de asserção. |
| 11. Guardrails | ratchet e revisão; `npm run check` | [ratchet](../scripts/check-guardrail-ratchet.ts), [config](../guardrails.config.ts) | Remova supressão/allowlist; exceção precisa de label e justificativa aprovadas. |
| 12. Pronto | CLI e CI; `npm run verify` | [verify](../scripts/cli/verify.ts), [CI](../.github/workflows/ci.yml) | Execute de novo até ficar verde e registre a saída. |

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

<a id="lint-rule"></a>
### lint-rule
Uma regra geral de ESLint encontrou erro de código. Corrija a linha indicada sem desativar a regra; consulte [configuração](../eslint.config.js).

<a id="ui-contract"></a>
### ui-contract
Emoji, URL fixa, hash de CSS Module, placeholder i18n ou script inline fora do shell causa divergência. Veja [validate-ui](../scripts/validate-ui.ts) e corrija na fonte.

<a id="architecture-boundary"></a>
### architecture-boundary
Imports internos e dependências invertidas impedem extração dos pacotes. Use exports públicos e a direção do [ADR 0003](adr/0003-package-and-repository-strategy.md).

<a id="ratchet"></a>
### ratchet
Supressões e allowlists novas ocultam regressões. Corrija a causa; exceções precisam de `guardrail-change`, justificativa e revisão do dono.

<a id="script-contract"></a>
### script-contract
Script raiz extra ou slug fixo quebra a descoberta automática. Use subcomandos de [noduct.ts](../scripts/noduct.ts) e manifests.

<a id="shell-parity"></a>
### shell-parity
Diferença entre hub e ferramenta indica shell ou estilo local indevido. Compare [shell-parity.spec.ts](../tests/e2e/shell-parity.spec.ts) e o hub nos três idiomas, dois temas e perfis exigidos.

<a id="agent-scope"></a>
### agent-scope
Área sem regras locais perde restrições de domínio. Crie `AGENTS.md` local, começando com “Complementa o AGENTS.md da raiz”, sem repetir o contrato.

<a id="agent-budget"></a>
### agent-budget
Contexto longo pode ser truncado. Raiz: até 200 linhas; local: 20–60; cadeia: até 24 KiB. Mova explicações para docs.

<a id="agent-pointer"></a>
### agent-pointer
Instruções paralelas divergem. Cada `CLAUDE.md` contém só `@AGENTS.md`; Copilot aponta para a raiz; Gemini usa `.gemini/settings.json`.
Depois de criar uma pasta com `AGENTS.md`, gere os ponteiros com `npx tsx scripts/check-agents.ts --write` e confira com `npm run check -- agents`. O gerador só escreve `CLAUDE.md` e o ponteiro do Copilot; revise o diff antes de comitar.

<a id="agent-link"></a>
### agent-link
Link quebrado impede o agente de encontrar o exemplo. Corrija o destino relativo ao documento.

<a id="agent-command"></a>
### agent-command
Comando inexistente gera tentativas falsas. Use apenas scripts do manifesto raiz.

<a id="agent-anchor"></a>
### agent-anchor
Um diagnóstico sem âncora não ensina a correção. Adicione id e reparo nesta matriz.

## Confirmar o contexto carregado

Trabalhe na pasta do pacote e peça ao agente que cite o Contrato, os comandos e as restrições locais antes da primeira edição.

| Ferramenta | Procedimento |
| --- | --- |
| Gemini CLI | Execute `/memory show` e confirme a raiz e o AGENTS local; `context.fileName` está em `.gemini/settings.json`. |
| Claude Code | Execute `/memory` ou `/context` e confira `@AGENTS.md` da raiz e da pasta. Versões atuais podem ler AGENTS diretamente; os ponteiros preservam compatibilidade e não duplicam o contexto. |
| Codex | Inicie com `--cd` na pasta do pacote e peça um resumo das instruções ativas; confirme raiz e arquivo local. |
| Copilot | Confira as referências de instrução da sessão; os modos podem variar. Leia também o ponteiro em `.github/copilot-instructions.md`. |
| Cursor e outros | Confira os arquivos de contexto citados pela sessão e peça o mesmo resumo. |

O teste de carregamento é manual e específico da versão do agente. `npm run check -- agents` garante a integridade dos arquivos, não que uma aplicação externa os tenha lido.

## Avaliação e tamanho das tarefas

Use uma fase por vez, com critérios verificáveis, commit e comentário na issue. Execute as [cinco tarefas-padrão](agentes/avaliacao.md) quando este contrato mudar, em cada agente usado no projeto. Registre versão, instruções carregadas, resultado de `npm run verify`, intervenção humana e regras violadas. Melhore primeiro os diagnósticos e receitas que aparecem repetidamente.
