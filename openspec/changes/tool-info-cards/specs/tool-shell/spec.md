## ADDED Requirements

### Requirement: Três cards informativos abaixo da área funcional
O slot `content` de `ToolPage` SHALL renderizar três cards. O primeiro SHALL ser o guia da ferramenta, em linguagem simples, com passos em lista e destaque visual para recursos do sistema (Área Local) e para o rótulo da ação principal. O segundo e o terceiro SHALL ser os mesmos em todas as ferramentas: limites do orçamento de recursos (computador e celular) e a garantia de privacidade (arquivos neste dispositivo, processamento neste navegador, Área Local só nesta origem).

#### Scenario: Merge PDF em pt-BR
- **WHEN** a página Mesclar PDF é gerada em pt-BR
- **THEN** o primeiro card explica como juntar arquivos com a **Área Local** em destaque e o rótulo `Mesclar arquivos PDF` em código, e os outros dois cards usam os títulos Limites e Privacidade

#### Scenario: Ferramenta gerada pelo template
- **WHEN** uma ferramenta nova é criada a partir do template
- **THEN** o slot `content` reutiliza os cards compartilhados de limites e privacidade, sem um card de ferramentas relacionadas
