# Glossário

Termos usados em código, issues, specs e documentação. Na interface e no código use o termo em inglês; na documentação, o termo em português.

| Termo (pt-BR) | Código / UI (en) | Significado |
| --- | --- | --- |
| Hub | hub | Site de descoberta e catálogo em `src/`, publicado na raiz da origem. |
| Ferramenta | tool | Pacote Astro em `packages/<slug>/` que processa arquivos localmente e é publicado em `/<slug>/`. |
| Slug | slug | Identificador kebab-case da ferramenta, declarado em `defineTool()` e em `noduct.slug`. |
| Segmento reservado | `RESERVED_HUB_SEGMENTS` | Primeiro segmento de URL usado pelo hub; nenhuma ferramenta pode usá-lo como slug. |
| Escopo | `Scope` | `{ kind: 'hub' }` ou `{ kind: 'tool', slug }`; define base, canonical e links de uma página. |
| Topologia | `topology` | Funções de `@noduct/tool-runtime` que geram toda URL, canonical, hreflang e asset. |
| Shell | `AppShell` | Head, preferências, header, footer e Settings comuns a todas as páginas. |
| Página de ferramenta | `ToolPage` | Breadcrumb, H1, lede, área funcional, patrocínio e conteúdo de uma ferramenta. |
| Área Local | Local Workspace | Documentos guardados em IndexedDB nesta origem; nunca saem do navegador. |
| Documento temporário / mantido | `ephemeral` / `persistent` | Retenção de um documento da Área Local; temporários expiram após 24 h sem acesso. |
| Ticket de transferência | transfer ticket | Referência local e opaca que leva um documento de uma ferramenta para outra (ADR 0004). |
| Orçamento de recursos | `ResourceBudget` | Limites de quantidade, tamanho e memória por perfil de dispositivo. |
| Contrato de conformidade | — | Regras do `AGENTS.md` que toda mudança de aplicação, componente ou documentação cumpre. |
| Guardrail | guardrail | Verificação automatizada de uma regra, com id, diagnóstico e âncora em `docs/guardrails.md`. |
| Ratchet | ratchet | Check que impede supressões, allowlists e configurações de guardrail de mudarem sem a label `guardrail-change`. |
| Artefato montado | `dist-pages/` | Saída de `npm run build` com hub e ferramentas na topologia de produção. |
| Spec viva | OpenSpec spec | Requisitos observáveis em `openspec/specs/`, atualizados ao arquivar uma mudança. |
| Mudança | OpenSpec change | Proposta, design, deltas de spec e tarefas em `openspec/changes/<nome>/`. |
