# Decisões arquiteturais (ADRs)

Um ADR registra uma decisão, o contexto e as alternativas rejeitadas. ADRs prevalecem sobre o `AGENTS.md` e os demais documentos. Um ADR aceito não é apagado: uma decisão nova o substitui ou altera e registra isso no cabeçalho.

| ADR | Decisão | Consulte quando |
| --- | --- | --- |
| [0001](0001-static-independent-tools.md) | Hub estático e ferramentas independentes. | Criar ferramenta ou mudar o modelo de publicação. |
| [0002](0002-pdf-engine-strategy.md) | `pdf-lib` como motor de edição; PDF.js só como renderer sob demanda. | Adicionar operação ou renderização PDF. |
| [0003](0003-package-and-repository-strategy.md) | Monorepo transitório, direção de dependências e protocolo de extração. | Mexer em dependências entre pacotes. |
| [0004](0004-cross-tool-transfer-protocol.md) | Transferência entre ferramentas por ticket local. | Enviar documento de uma ferramenta para outra. |
| [0005](0005-unified-shell-topology-guardrails.md) | Shell único, topologia de URLs, `tool-runtime` e guardrails. | Mexer em páginas, URLs, SEO ou guardrails. |
| [0006](0006-hybrid-local-workspace.md) | Área Local híbrida: home, seletor na `DropZone`, salvar no `DownloadCard` e página dedicada. | Qualquer ferramenta que recebe ou produz arquivos. |

## Decisões menores sem ADR próprio

- **Astro estático, sem React:** HTML útil sem JavaScript; busca e tema não justificam outro runtime.
- **Catálogo tipado com validação no build:** uma fonte de verdade para disponibilidade e metadados das ferramentas.
- **Roadmap visível sem links:** ferramentas `planned` aparecem sem páginas vazias.
- **Patrocínio manual e modo comercial `prelaunch`:** sem backend nem falsa confirmação de pagamento ([registry](../registry-patrocinio.md)).

## Como propor um ADR

Crie `NNNN-titulo-em-ingles.md` com status, data, contexto, decisão, alternativas e consequências, e acrescente uma linha a esta tabela. Se a decisão muda um requisito observável, atualize a spec correspondente em `openspec/specs/` pelo [fluxo OpenSpec](../agentes/openspec.md).
