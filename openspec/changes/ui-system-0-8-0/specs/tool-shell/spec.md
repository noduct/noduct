# Spec Delta

## ADDED Requirements

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
