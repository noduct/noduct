## Context

O estudo de UI/UX aprovado define a “mesa de montagem” do Merge PDF: estado vazio com a `DropZone` em destaque e, com arquivos, uma barra de comando compacta mais uma grade de cartões numerados. Medidas e capturas estão na auditoria da issue.

## Goals / Non-Goals

**Goals:**

- Manter contagem e “Mesclar arquivos PDF” acima da dobra com quatro arquivos em `1280×800`.
- Deixar a ordem explícita (posição numérica) e a prévia legível em desktop e mobile.
- Preservar o foco do controle após mover um arquivo pelo teclado.
- Não alterar o comportamento padrão de `DropZone` e `ReorderableList` para outros consumidores.

**Non-Goals:**

- Mudar o `WorkspacePicker`, o `pdf-core` ou o fluxo de mesclagem.
- Cartão “adicionar mais” dentro da grade e conectores entre cartões: a barra de comando já oferece as duas origens.

## Decisions

### Estados e critérios de layout

| Estado            | Desktop (a partir de 600 px)                                                                                                             | Mobile (até 599 px)                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Sem arquivos      | `DropZone` ampla, com duas origens de largura equivalente e hover restrito a cada botão.                                                 | Ações com alvo mínimo de 44 px, quebra de linha quando necessário e sem rolagem horizontal.                              |
| Com arquivos      | `DropZone` compacta na barra de comando; cartões em grade com coluna mínima de 248 px, posição numérica, prévia A4 e ações no cabeçalho. | `DropZone` em faixa compacta; cartões de uma coluna com cabeçalho curto, posição sem esticar e prévia ao lado dos dados. |
| Durante o arrasto | Cartão acompanha o ponteiro; os vizinhos ocupam seus novos lugares assim que o destino muda.                                             | Mesmo comportamento, com gesto iniciado pela alça, miniatura ou cabeçalho para preservar a rolagem da página.            |

O shell aproxima header e breadcrumb da área de trabalho. A barra de comando fica fixa durante a rolagem quando há arquivos, abaixo dos popovers do shell. A contagem e a ação de mesclagem devem caber acima da dobra em 1280 × 800 com quatro PDFs; o layout de 320 px deve manter ações de 44 px, foco visível e nenhuma rolagem horizontal. Os dois temas passam por inspeção visual e axe.

1. **Modo compacto por controlador, não por prop.** O estado depende dos arquivos em runtime, então `DropZoneController.setCompact()` grava `data-compact`. O CSS do módulo reage ao atributo, sem classe gerada escrita à mão.
2. **Status acessível no modo compacto.** O `[data-drop-status]` continua no DOM com `role="status"`, apenas recortado visualmente, para manter os anúncios.
3. **`grid` só a partir de `600px`.** O cabeçalho do cartão precisa de pelo menos `248px` de largura externa para posição, alça e três botões de 44 px. Em telas estreitas, o cartão usa uma linha de cabeçalho compacta e uma linha de prévia, sem esticar o número da posição.
4. **Setas horizontais por rotação.** Em `grid`, os ícones `arrow-up`/`arrow-down` giram `-90°` e os rótulos passam a “antes/depois”. Nenhum ícone novo entra na allowlist.
5. **Arrasto 2D em `grid`.** Em `list`, o cálculo vertical permanece. Em `grid`, um item conta como anterior ao ponteiro quando o ponteiro está abaixo dele ou na mesma faixa e à direita do seu centro. As áreas de destino são capturadas antes de mover qualquer nó; a cada mudança de destino, os vizinhos trocam de posição imediatamente e a posição numérica é atualizada. O cartão capturado acompanha o ponteiro mesmo quando sua célula muda. Ao cancelar, volta à ordem inicial; ao soltar, emite uma mudança final. Isso impede a oscilação causada pela leitura das posições dos cartões já deslocados.
6. **Soltar na bancada inteira.** O Merge PDF encaminha o `drop` da seção para `DropZoneController.select()`, ignorando eventos que já ocorreram dentro da `DropZone`.
7. **Foco estável.** A ferramenta não substitui os nós da lista quando os identificadores exibidos já correspondem ao estado do fluxo, preservando o foco da alça e a miniatura após reordenação.
8. **Duas origens equivalentes.** Os botões de dispositivo e Área Local compartilham altura, largura mínima e rim light nos estados vazio e compacto. O hover da zona não desenha contorno em torno deles.
9. **Mais área útil.** O shell reduz o espaço entre header, breadcrumb e bancada, mantendo foco visível e os alvos de toque.

## Risks / Trade-offs

- Barra fixa (`position: sticky`) pode cobrir o topo dos cartões durante a rolagem; ela usa fundo opaco e `--z-sticky` abaixo dos popovers.
