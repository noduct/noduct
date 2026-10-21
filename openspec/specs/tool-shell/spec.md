# tool-shell Specification

## Purpose
Garante que hub, ferramentas e PDF Studio usem o mesmo shell do design system, de modo que header, footer, Settings, preferências e estrutura de página sejam idênticos.

## Requirements

### Requirement: Página composta pelo shell compartilhado
Toda página SHALL renderizar `AppShell` de `@noduct/design-system` como raiz; ferramentas SHALL compor `ToolPage` dentro dele. Nenhuma página MAY declarar header, footer, Settings ou breadcrumb próprios.

#### Scenario: Página sem shell
- **WHEN** uma página em `src/pages/` ou `packages/*/src/pages/` não tem `AppShell` como raiz do template
- **THEN** `npm run check` falha com `require-app-shell`

### Requirement: Paridade visual com o hub
O header e o footer de cada ferramenta SHALL ser idênticos aos do hub em árvore acessível, geometria, estilos computados e pixels, nos três idiomas, nos dois temas e nos perfis desktop, tablet e mobile, inclusive com Settings, menu mobile e categorias abertos.

#### Scenario: Ferramenta nova
- **WHEN** uma ferramenta é gerada por `npm run new:tool`
- **THEN** ela entra automaticamente em `tests/e2e/shell-parity.spec.ts` sem editar a lista de ferramentas

### Requirement: Preferências aplicadas antes da pintura
O tema, a arte ambiente e o movimento reduzido escolhidos em qualquer página SHALL valer em todas as páginas da origem, aplicados antes da primeira pintura.

#### Scenario: Tema escolhido no hub
- **WHEN** o usuário escolhe o tema escuro no Settings do hub e abre uma ferramenta
- **THEN** a ferramenta abre com `html[data-theme="dark"]` sem piscar o tema claro

### Requirement: Estrutura da página de ferramenta
`ToolPage` SHALL renderizar breadcrumb Home › Categoria › Ferramenta com URLs da topologia, eyebrow da categoria, um único H1, lede, área funcional, patrocínio após a área funcional e o conteúdo informativo; o breadcrumb visível e o `BreadcrumbList` do JSON-LD SHALL vir da mesma lista.

#### Scenario: Breadcrumb e JSON-LD
- **WHEN** a página do Merge PDF é gerada em es
- **THEN** o breadcrumb visível e o `BreadcrumbList` têm os mesmos três nomes localizados e as mesmas URLs

### Requirement: Menu de configurações adaptativo à largura de tela
O `SettingsMenu` do shell SHALL exibir os controles de "Arte de fundo" e "Reduzir animações" somente em viewports com largura mínima de `1400px` (onde a arte ambiente lateral é renderizada). Em telas menores que `1400px`, o menu SHALL exibir apenas as seções de Tema e Idioma.

#### Scenario: Abertura de configurações em notebook ou mobile
- **WHEN** o usuário abre o `SettingsMenu` em uma tela com largura inferior a `1400px`
- **THEN** apenas os grupos de Tema e Idioma ficam visíveis, sem controles ociosos de arte de fundo

### Requirement: Dropdown de categorias contido na viewport e com foco íntegro
O menu dropdown de `Categories` no `SiteHeader` SHALL abrir ancorado à direita do gatilho (`right: 0`) com largura limitada à viewport, sem gerar rolagem horizontal em telas intermediárias, e o gatilho `<summary>` SHALL manter seu raio de borda (`--radius-sm`) quando focado via teclado (`Shift+Tab` ou `Tab`) mesmo com o menu aberto.

#### Scenario: Foco por teclado com menu de categorias aberto
- **WHEN** o menu `Categories` está aberto e o usuário pressiona `Shift` ou navega com `Tab` sobre o gatilho
- **THEN** o anel de foco acompanha os cantos arredondados do botão sem ficar quadrado e sem causar overflow horizontal na página

### Requirement: Ilha de apoio voluntário no rodapé compartilhado
Quando `supportUrl` estiver habilitado, o `SiteFooter` SHALL renderizar uma ilha de apoio (*Buy Me a Coffee*) com selo âmbar (`coffee`), texto convidativo e botão externo (`target="_blank"`, `rel="noopener noreferrer"`) traduzidos em `en` (*Buy me a coffee*), `pt-BR` (*Me pague um café*) e `es` (*Invítame a un café*), mantendo indicador de foco único e paridade entre Hub e ferramentas.

#### Scenario: Exibição do card de apoio em pt-BR
- **WHEN** o usuário visualiza o rodapé de qualquer página em `pt-BR`
- **THEN** a ilha de apoio exibe o selo de café e o botão "Me pague um café" com abertura segura em nova aba
