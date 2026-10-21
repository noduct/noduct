## Why

A auditoria do Merge PDF em `1280×800` (Chrome DevTools) mostrou que a montagem da sequência é a parte mais fraca da ferramenta:

1. A `DropZone` mantém o tamanho do estado vazio (`219px`) depois que os arquivos entram. Com o cabeçalho, ela consome 78% da altura da janela antes do primeiro arquivo.
2. Com quatro arquivos, a barra com contagem, “Limpar” e “Mesclar arquivos PDF” fica `136px` abaixo da dobra.
3. A lista vertical estica cada linha por `1198px`, com cerca de 61% de espaço vazio, miniatura de `38×50px` e nenhuma posição numérica visível. A alça e os botões de mover ficam a mais de `1000px` de distância.

O seletor lateral da Área Local (`WorkspacePicker`) funciona bem e continua igual.

A revisão em mobile encontrou cartões altos com posição esticada e botões de origem com comportamento visual desigual nos estados vazio e compacto. A distância entre header e breadcrumb também reduz a área útil da ferramenta.

## What Changes

- **`DropZone`:** novo modo compacto, ligado em runtime por `setCompact(true)`. O ícone e a descrição saem, as duas origens (dispositivo e Área Local) ficam numa faixa horizontal e o status vira texto só para leitores de tela. O arrastar e soltar, o `input` e o `WorkspacePicker` não mudam.
- **`ReorderableList`:** nova prop `variant` (`list`, padrão, ou `grid`). Todo item exibe a posição (`1`, `2`, `3`…) atualizada a cada mudança. Em `grid`, a partir de `600px`, os itens viram cartões com prévia grande da primeira página, setas horizontais (`←`/`→` no teclado, além de `↑`/`↓`) e arrasto em duas dimensões. Abaixo de `600px`, cada cartão usa cabeçalho compacto e prévia em linha.
- **Merge PDF:** com arquivos na bancada, a `DropZone` compacta e as ações (contagem, “Limpar”, “Mesclar arquivos PDF”) formam uma única barra no topo da bancada, fixa durante a rolagem. A bancada inteira aceita arquivos soltos. A lista usa `variant="grid"`.
- **Acesso e layout responsivo:** as duas origens de arquivo têm tamanho e rim light equivalentes nos estados vazio e compacto, sem contorno da zona ao passar o ponteiro sobre os botões. No mobile, os cartões mantêm posição, alça e ações legíveis sem esticar a posição. O espaço entre header, breadcrumb e bancada é reduzido para dar prioridade à ferramenta.
- **Reordenação acessível:** o cartão acompanha o ponteiro e a ordem muda durante o gesto, com áreas de destino fixadas no início para evitar oscilação; cancelar restaura a ordem inicial e o foco do controle permanece após mover pelo teclado.
- **Itens do Contrato de conformidade atendidos:** 2 (Workspace: `DropZone` com `workspace` e `connectLocalWorkspace()` intactos), 4 (ícones da allowlist), 5 (somente tokens existentes e `Button`), 6 (rótulos de mover nos três idiomas), 9 (teclado, alvos de 44 px, movimento reduzido) e 10 (nenhuma asserção afrouxada).

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `design-system`: modo compacto da `DropZone`, variante em grade da `ReorderableList` e espaçamento do shell.

## Impact

- **`packages/design-system`:** `DropZone`, `drop-zone-runtime.ts`, `ReorderableList`, `ReorderableItemMarkup`, `reorderable-list-runtime.ts`, `messages.ts`, estilos do shell e `CHANGELOG.md`.
- **`packages/merge-pdf`:** `MergePdfApp.astro` e `MergePdfApp.module.css`.
- **Sem mudança:** `packages/tool-template` e a fixture de testes usam o comportamento padrão, que continua igual.
