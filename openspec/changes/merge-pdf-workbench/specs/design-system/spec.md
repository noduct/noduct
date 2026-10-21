# Spec Delta

## ADDED Requirements

### Requirement: Modo compacto da DropZone

A `DropZone` SHALL oferecer um modo compacto, ligado por `setCompact(true)` no controlador. No modo compacto, ela MUST manter o seletor nativo, a origem `Da Área Local`, o arrastar e soltar e a região `role="status"`, ocultando apenas o ícone e a descrição visuais.

#### Scenario: Ferramenta com arquivos já selecionados

- **WHEN** a ferramenta chama `setCompact(true)` depois que o primeiro arquivo entra
- **THEN** a `DropZone` passa a ocupar uma faixa horizontal com os botões de origem, e os anúncios de arquivos adicionados continuam disponíveis para leitores de tela

#### Scenario: Origens de arquivo em ambos os estados

- **WHEN** a zona está vazia ou compacta e o ponteiro passa sobre os botões de dispositivo e Área Local
- **THEN** os dois controles mantêm alvos de pelo menos 44 px, largura e tratamento de rim light equivalentes, foco visível e hover sem contorno adicional em torno da zona

### Requirement: Posição visível e variante em grade na ReorderableList

Todo item da `ReorderableList` SHALL exibir sua posição atual (`1`, `2`, `3`…), atualizada a cada movimento, remoção ou substituição. Com `variant="grid"` e largura de pelo menos `600px`, os itens SHALL aparecer como cartões com prévia ampliada da primeira página; as setas do teclado `←`/`→` SHALL mover o item como `↑`/`↓`, e o arrasto por ponteiro SHALL considerar as duas dimensões.

#### Scenario: Reordenação na grade

- **WHEN** o usuário move o segundo cartão para antes do primeiro, por botão, teclado ou arrasto
- **THEN** os cartões exibem as posições `1` e `2` trocadas, a região viva anuncia a nova posição e o controle mantém foco após movimento por teclado

#### Scenario: Arrasto livre com reordenação imediata e sem oscilação

- **WHEN** o usuário arrasta um cartão sobre os demais na grade
- **THEN** o cartão acompanha o ponteiro, os demais mudam de posição durante o gesto sem oscilar, as posições numéricas acompanham a ordem, e o cancelamento restaura a ordem inicial

#### Scenario: Grade em tela estreita

- **WHEN** a lista com `variant="grid"` é exibida abaixo de `600px`
- **THEN** cada cartão usa cabeçalho compacto e linha de prévia, mantendo posição sem esticamento, nome legível, alvos de 44 px e ausência de rolagem horizontal

### Requirement: Espaço vertical da ferramenta

O shell SHALL manter header, breadcrumb e início da bancada próximos o bastante para exibir a contagem e a ação de mesclar acima da dobra em `1280×800` com quatro arquivos.

#### Scenario: Bancada com quatro arquivos

- **WHEN** o Merge PDF é exibido em `1280×800` com quatro PDFs válidos
- **THEN** a contagem e a ação principal ficam visíveis sem rolagem, sem sobreposição do header ou dos cartões
