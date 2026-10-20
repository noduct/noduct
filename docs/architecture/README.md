# Arquitetura

Noduct é uma suíte estática de ferramentas client-side. O hub cuida de descoberta e catálogo; cada ferramenta processa arquivos localmente. Hub e ferramentas compartilham uma origem para usar a Área Local e os tickets de transferência.

## Pacotes e fronteiras

A tabela abaixo é gerada a partir de `guardrails.config.ts` e verificada por `npm run check -- architecture`. Para mudar uma fronteira, altere a configuração (exige a label `guardrail-change`) e rode `npx tsx scripts/validate-architecture.ts --write`.

<!-- generated:boundaries:start -->
| Pacote | Responsabilidade | Pacotes internos permitidos | Dependências externas |
| --- | --- | --- | --- |
| `tool-runtime` | URLs, locales, SEO, taxonomia e defineTool(); TypeScript puro. | nenhum | nenhuma |
| `design-system` | Shell, tokens, ícones e componentes acessíveis; recebe serviços injetados. | `tool-runtime` | sem restrição |
| `pdf-core` | Domínio PDF puro; erros por código; motores carregados sob demanda. | nenhum | `pdf-lib`, `pdfjs-dist` |
| `workspace-core` | Persistência IndexedDB, locks, retenção e tickets de transferência. | `tool-runtime` | sem restrição |

Ferramentas (`packages/<slug>/`) e o template compõem esses pacotes pelos exports públicos.

- `pdfjs-dist` só em `packages/pdf-core/src/render/`.
- O hub (`src/`) não importa `pdf-core` nem `workspace-core`, exceto:
  - em `src/components/workspace/`: `@noduct/workspace-core`, `@noduct/pdf-core/render`.
- Imports entre pacotes usam somente o campo `exports`; ciclos são proibidos.
<!-- generated:boundaries:end -->

## Topologia e publicação

O hub ocupa `/`, `/pt-br/` e `/es/`; cada ferramenta ocupa `/<slug>/`, `/<slug>/pt-br/` e `/<slug>/es/`. `RESERVED_HUB_SEGMENTS` protege o namespace do hub. `scripts/assemble-pages.ts` descobre as ferramentas por `noduct.slug` no `package.json` de cada uma, monta `dist-pages/` e cria os stubs transitórios do base antigo. Requisitos: [url-topology](../../openspec/specs/url-topology/spec.md).

O catálogo tipado (`src/data/`) é a fonte de verdade da disponibilidade: itens `planned` aparecem como roadmap, sem link. Toda página compõe `AppShell`; ferramentas compõem `ToolPage` ([tool-shell](../../openspec/specs/tool-shell/spec.md)). A Área Local entra pela `DropZone` e pelo `DownloadCard`, nunca pelo header ([ADR 0006](../adr/0006-hybrid-local-workspace.md)).

## Documentos desta pasta

| Documento | Quando consultar |
| --- | --- |
| [Área Local: armazenamento](local-workspace.md) | Schema IndexedDB, retenção, locks e migrações de `workspace-core`. |
| [Área Local: interface](local-workspace-ux.md) | Superfícies, fluxos, estados e requisitos de UX da Área Local. |
| [Orçamento de recursos](resource-budget.md) | Limites de arquivos e memória por perfil (`ResourceBudget`). |
| [Contratos do pdf-core](pdf-core-contracts.md) | Entradas, saídas e erros das operações PDF. |
| [Pacotes e repositórios](repository-strategy.md) | Responsabilidades por pacote e protocolo de extração do monorepo. |
| [Histórico do recomeço estrutural](issue-39-rationale.md) | Por que shell, topologia, guardrails e regras de agentes existem. |

Decisões formais estão no [índice de ADRs](../adr/README.md). Mudanças de comportamento seguem o fluxo do [OpenSpec](../agentes/openspec.md).
