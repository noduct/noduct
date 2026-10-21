# Spec Delta

## ADDED Requirements

### Requirement: Modo compacto da DropZone
A `DropZone` SHALL oferecer um modo compacto, ligado por `setCompact(true)` no controlador. No modo compacto, ela MUST manter o seletor nativo, a origem `Da Área Local`, o arrastar e soltar e a região `role="status"`, ocultando apenas o ícone e a descrição visuais.

#### Scenario: Ferramenta com arquivos já selecionados
- **WHEN** a ferramenta chama `setCompact(true)` depois que o primeiro arquivo entra
- **THEN** a `DropZone` passa a ocupar uma faixa horizontal com os botões de origem, e os anúncios de arquivos adicionados continuam disponíveis para leitores de tela

### Requirement: Posição visível e variante em grade na ReorderableList
Todo item da `ReorderableList` SHALL exibir sua posição atual (`1`, `2`, `3`…), atualizada a cada movimento, remoção ou substituição. Com `variant="grid"` e largura de pelo menos `600px`, os itens SHALL aparecer como cartões com prévia ampliada da primeira página; as setas do teclado `←`/`→` SHALL mover o item como `↑`/`↓`, e o arrasto por ponteiro SHALL considerar as duas dimensões.

#### Scenario: Reordenação na grade
- **WHEN** o usuário move o segundo cartão para antes do primeiro, por botão, teclado ou arrasto
- **THEN** os cartões exibem as posições `1` e `2` trocadas e a região viva anuncia a nova posição

#### Scenario: Grade em tela estreita
- **WHEN** a lista com `variant="grid"` é exibida abaixo de `600px`
- **THEN** os itens usam o layout de linha, mantendo a posição visível e alvos de 44 px

