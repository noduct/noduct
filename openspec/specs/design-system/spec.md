# design-system Specification

## Purpose
Define os requisitos comportamentais e visuais dos componentes compartilhados do `@noduct/design-system` (`Button`, `Switch`, `Select`, popovers *Inset Grouped* e filtro de categorias da biblioteca), garantindo ergonomia tátil, acessibilidade WCAG 2.1 AA e consistência nos temas claro e escuro.

## Requirements

### Requirement: Botão unificado com suporte a proporção 1x1
Toda ação interativa com texto, link apresentado como botão ou controle de ícone isolado SHALL usar o componente `Button` nas variantes `primary`, `secondary`, `quiet`, `danger` ou `danger-quiet` e tamanhos `sm`, `md` ou `lg`. Quando `iconOnly` estiver ativo, o botão SHALL ter proporção quadrada 1x1 (`aspect-ratio: 1 / 1`), alvo mínimo de 44x44 px em toque e nome acessível explícito.

#### Scenario: Botão de ícone 1x1 em listas de arquivos
- **WHEN** um controle de ação rápida (visualizar, baixar, retenção ou excluir) é renderizado em `WorkspaceManager`, `WorkspaceRecents` ou `ReorderableList`
- **THEN** o elemento renderiza como `Button` com `iconOnly`, proporção 1x1, `aria-label` localizado e indicador único de foco visível

#### Scenario: Botão elevado com borda especular
- **WHEN** um `Button` das variantes `primary`, `secondary` ou `danger` é renderizado nos temas claro ou escuro
- **THEN** ele apresenta sombra em camadas combinada com `--rim-light-strong` e contraste AA garantido

### Requirement: Controle de alternância Switch com estado bloqueado
Escolhas binárias imediatas SHALL usar o componente `Switch` (`role="switch"`), com alvo de toque mínimo de 44 px, indicador de foco único e suporte aos estados `disabled` e `blocked` (`data-blocked="true"`). Quando bloqueado ou desabilitado, o `Switch` MUST NOT responder a cliques nem exibir estilo interativo de hover ou foco ativo.

#### Scenario: Bloqueio lógico de animação sem arte de fundo
- **WHEN** o usuário desativa "Arte de fundo" (`data-art="off"`) no menu de configurações
- **THEN** o `Switch` "Reduzir animações" recebe `disabled` e `data-blocked="true"`, ficando visualmente atenuado e inerte ao clique

### Requirement: Listas e seletores no padrão Inset Grouped
Menus de seleção (`Select`, lista de idiomas do `SettingsMenu`, dropdown de `Categories` e menu mobile) e o painel de sugestões do `ToolSearch` SHALL agrupar suas opções em superfícies rebaixadas ou flutuantes com divisórias internas sutis (`--color-border-subtle`), mantendo cantos arredondados nos itens das extremidades mesmo sob foco de teclado (`:focus-visible`).

#### Scenario: Autocomplete de busca em páginas de diretório
- **WHEN** o usuário digita no campo `ToolSearch` na página inicial ou em `/tools/`
- **THEN** o popover de resultados abre imediatamente abaixo do campo com `z-index` de busca, sem ser cortado pelo cabeçalho `.page-head` nem deslocado para o final da página

### Requirement: Filtro de categorias responsivo na biblioteca da Home
A barra de categorias da biblioteca na página inicial SHALL exibir uma opção inicial para todas as ferramentas (`All` / `Todas`) seguida de todas as categorias com ícone, nome completo e contagem, quebrando linha fluidamente (`flex-wrap: wrap`) sem cortar rótulos e filtrando as seções visíveis instantaneamente sem exigir scripts adicionais.

#### Scenario: Seleção de categoria na Home
- **WHEN** o usuário seleciona uma categoria específica na barra de filtro da biblioteca na página inicial
- **THEN** apenas a seção da categoria correspondente permanece visível e a pílula ativa recebe destaque semântico nos dois temas
