# Documentação do Noduct

Índice de toda a documentação técnica. Comece pelo [AGENTS.md](../AGENTS.md) para regras e comandos; use esta página para achar o detalhe. Todo documento em `docs/` precisa aparecer aqui (`npm run check -- agents`).

## Começar

| Documento | Conteúdo |
| --- | --- |
| [Desenvolvimento](../DEVELOPMENT.md) | Instalação, comandos, mesma origem em dev e fluxo até o PR. |
| [Glossário](glossario.md) | Termos do domínio e seus nomes em código. |
| [Guardrails](guardrails.md) | Cada regra, por que existe, como é verificada e como corrigir. |
| [Agentes de código](agentes/README.md) | Como agentes carregam regras, skills e o fluxo OpenSpec. |
| [Fluxo OpenSpec](agentes/openspec.md) | Propor, aplicar e arquivar mudanças com specs vivas. |
| [Avaliação de agentes](agentes/avaliacao.md) | Tarefas-padrão para medir agentes após mudar instruções. |
| [Criar uma ferramenta](criar-nova-ferramenta.md) | Passo a passo de `npm run new:tool` até o `verify`. |

## Arquitetura e decisões

| Documento | Conteúdo |
| --- | --- |
| [Arquitetura](architecture/README.md) | Mapa de pacotes e fronteiras gerado, topologia e índice da pasta. |
| [ADRs](adr/README.md) | Decisões formais vigentes e decisões menores. |
| [Área Local: armazenamento](architecture/local-workspace.md) | Schema, retenção, locks e migrações. |
| [Área Local: interface](architecture/local-workspace-ux.md) | Superfícies, fluxos, estados e requisitos de UX. |
| [Orçamento de recursos](architecture/resource-budget.md) | Limites por perfil de dispositivo. |
| [Contratos do pdf-core](architecture/pdf-core-contracts.md) | Operações, entradas, saídas e erros PDF. |
| [Pacotes e repositórios](architecture/repository-strategy.md) | Responsabilidades e extração do monorepo. |
| [Histórico do recomeço estrutural](architecture/issue-39-rationale.md) | Causas e motivos do shell único, topologia e guardrails. |
| [Modelo de ameaças PDF](security/pdf-threat-model.md) | Riscos do processamento local de PDFs e mitigações. |
| [Avaliação de motores PDF](research/pdf-engine-evaluation.md) | Pesquisa que fundamenta o ADR 0002. |

## Interface, conteúdo e SEO

| Documento | Conteúdo |
| --- | --- |
| [Design system](design-system.md) | Inventário, tokens, raios e alvos de toque. |
| [Padrões de interface](padroes-interface.md) | Tipografia, movimento, componentes e checklist visual. |
| [Componentes de fluxo de arquivos](componentes-fluxo-arquivos.md) | `DropZone`, listas, progresso e `DownloadCard`. |
| [Internacionalização](internacionalizacao.md) | Locales, mensagens e prefixos de URL. |
| [SEO técnico](seo.md) | Canonical, hreflang, sitemap e JSON-LD. |
| [Privacidade](privacidade.md) | O que fica no dispositivo e como é comunicado. |

## Patrocínio e apoio

| Documento | Conteúdo |
| --- | --- |
| [Contratos de patrocínio](contratos-patrocinio.md) | Regras e modelo de dados dos patrocínios. |
| [Registry de patrocínio](registry-patrocinio.md) | Arquivo estático publicado e seus consumidores. |
| [Componente de patrocínio](componente-patrocinio.md) | `SponsorshipSlot` e estados de exibição. |
| [Operação de patrocinadores](patrocinadores.md) | Processo manual de entrada e saída de patrocinadores. |
| [Apoio voluntário](apoio-voluntario.md) | Buy Me a Coffee e regras do link de apoio. |
| [PayPal](paypal.md) | Situação e restrições do PayPal. |

## Produto, qualidade e operação

| Documento | Conteúdo |
| --- | --- |
| [Visão de produto](visao-produto.md) | Público, proposta e princípios. |
| [Roadmap](roadmap.md) | Próximas ferramentas e marcos. |
| [Qualidade e testes](qualidade-testes.md) | Tipos de teste e onde cada um vive. |
| [Deploy no GitHub Pages](deploy-github-pages.md) | Build composto, verificação e publicação. |
| [Analytics e monitoramento](monitoramento.md) | O que é e o que não é medido. |
| [Automação de issues](operacao/automacao-github-issues.md) | CLI `scripts/github/manage.mjs` para agentes. |
| [Auditoria técnica](auditoria-tecnica.md) | Auditoria histórica de 13/10/2026. |
