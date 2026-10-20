# Agentes de código

Pessoas e agentes (Claude Code, Codex, Copilot, Cursor, Gemini e outros) seguem as mesmas regras. Este documento explica onde cada peça mora e como ela é mantida. A garantia real é o CI: `npm run check` e `npm run verify` valem para qualquer agente.

## Camadas de contexto

| Camada | Onde | Carregamento |
| --- | --- | --- |
| Regras | `AGENTS.md` da raiz e da pasta editada | Sempre; a raiz traz comandos, fronteiras, invariantes e o Contrato. |
| Mapa | [docs/README.md](../README.md), [arquitetura](../architecture/README.md), [glossário](../glossario.md) | Sob demanda, por link a partir do `AGENTS.md`. |
| Procedimentos | Skills `noduct-*` em `.agents/skills/` | Sob demanda; o `AGENTS.md` lista quando usar cada uma. |
| Requisitos | `openspec/specs/` e mudanças em `openspec/changes/` | Ao planejar ou implementar uma mudança ([fluxo](openspec.md)). |
| Decisões | [ADRs](../adr/README.md) | Ao mudar algo que um ADR decide. |
| Verificação | Guardrails com diagnóstico acionável ([matriz](../guardrails.md)) | No `check`, no hook do Claude Code e no CI. |

## Arquivos por ferramenta

- **Fonte única:** `AGENTS.md`. Nenhum arquivo de ferramenta contém regras próprias.
- **Claude Code:** cada pasta com `AGENTS.md` tem um `CLAUDE.md` com só `@AGENTS.md`. `.claude/settings.json` define permissões compartilhadas e um hook pós-edição que roda o check da área editada; preferências pessoais ficam em `.claude/settings.local.json`, fora do Git.
- **Copilot:** lê `AGENTS.md`; `.github/copilot-instructions.md` é só ponteiro; `copilot-setup-steps.yml` prepara Node, dependências e Playwright.
- **Gemini CLI:** `.gemini/settings.json` aponta `context.fileName` para `AGENTS.md`. O Gemini CLI foi substituído pelo Antigravity CLI para contas gratuitas e AI Pro; quem usar o Antigravity deve conferir o contexto carregado ([procedimento](../guardrails.md#confirmar-o-contexto-carregado)).
- **Cursor e outros:** leem `AGENTS.md` diretamente; não crie `.cursor/rules/` com regras.

## Skills

A fonte de cada skill do projeto é `.agents/skills/noduct-*/SKILL.md` (padrão aberto Agent Skills, lido pelo Codex e por agentes genéricos). `.claude/skills/`, `.github/skills/` e `.gemini/skills/` recebem cópias idênticas geradas por `npx tsx scripts/check-agents.ts --write`; `npm run check -- agents` falha se uma cópia divergir. Edite só a fonte.

As skills `openspec-*` e os comandos `opsx` são gerados pelo OpenSpec (`npx openspec update`); não os edite à mão.

Para criar uma skill: pasta `.agents/skills/noduct-<tarefa>/` com `SKILL.md` (frontmatter `name` igual à pasta e `description` dizendo quando usar), passos concretos, exemplo, comandos de validação e ids de guardrail comuns. Depois liste-a no `AGENTS.md`, porque agentes nem sempre decidem invocar uma skill sozinhos.

## Manutenção das instruções

- Escreva instruções à mão, curtas e verificáveis; texto gerado por modelo sem revisão aumenta custo sem melhorar resultado.
- Não descreva o que o agente descobre lendo o código (árvore de pastas, visão geral); registre o que não é óbvio.
- Uma regra que pode ser verificada vira guardrail com fixture; texto é para o que exige julgamento.
- Ao mudar `AGENTS.md` ou uma skill, rode a [avaliação](avaliacao.md).
