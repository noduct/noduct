# Fluxo OpenSpec

O [OpenSpec](https://github.com/Fission-AI/OpenSpec) mantém os requisitos observáveis do produto em `openspec/specs/` e cada mudança em andamento em `openspec/changes/<nome>/`. A versão é fixada como devDependency; use `npx openspec`.

## Quando usar

| Tamanho da tarefa | Fluxo |
| --- | --- |
| Correção pontual, texto, ajuste visual sem mudar comportamento | Plano curto no PR; sem OpenSpec. |
| Ferramenta nova, componente compartilhado, mudança de comportamento ou de contrato | Mudança OpenSpec antes de codar. |
| Decisão de arquitetura (dependência, topologia, fronteira) | ADR primeiro; depois a mudança OpenSpec que a implementa. |

## Ciclo

1. **Propor:** `/opsx:propose` (Claude Code, Gemini), `/opsx-propose` (Copilot) ou `$openspec-propose` (Codex). Gera `proposal.md`, `design.md`, `tasks.md` e deltas de spec (`ADDED`, `MODIFIED`, `REMOVED`) com cenários `WHEN`/`THEN`. Cite a issue na proposta.
2. **Revisar:** `npx openspec validate <nome> --strict`. A proposta é revisada como código, antes da implementação.
3. **Aplicar:** `/opsx:apply` executa `tasks.md` em ordem, rodando `npm run check` entre as tarefas.
4. **Arquivar:** depois de `npm run verify` verde e do merge, `/opsx:archive` mescla os deltas em `openspec/specs/` e move a mudança para `openspec/changes/archive/`.

As regras do projeto para cada artefato estão em [openspec/config.yaml](../../openspec/config.yaml) e são injetadas pelo próprio OpenSpec.

## Specs vivas

| Capacidade | Conteúdo |
| --- | --- |
| [url-topology](../../openspec/specs/url-topology/spec.md) | Origem única, hub na raiz, ferramentas em `/<slug>/`, slugs reservados e metadados. |
| [tool-shell](../../openspec/specs/tool-shell/spec.md) | `AppShell`, `ToolPage`, paridade com o hub e preferências. |
| [local-workspace](../../openspec/specs/local-workspace/spec.md) | Superfícies, salvamento explícito, retenção e locks da Área Local. |
| [localization](../../openspec/specs/localization/spec.md) | Três idiomas, códigos de domínio e prefixos de locale. |

Uma spec descreve comportamento, não implementação, e não contradiz ADR. Ao criar uma capacidade nova, acrescente uma linha a esta tabela.

## Manutenção

- `npx openspec list --specs` e `npx openspec show <capacidade>` mostram o estado atual.
- Depois de atualizar a versão do pacote, rode `npx openspec update` e revise o diff das skills e comandos gerados.
