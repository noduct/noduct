## Context

O estudo de UI/UX aprovado define a “mesa de montagem” do Merge PDF: estado vazio com a `DropZone` em destaque e, com arquivos, uma barra de comando compacta mais uma grade de cartões numerados. Medidas e capturas estão na auditoria da issue.

## Goals / Non-Goals

**Goals:**
- Manter contagem e “Mesclar arquivos PDF” acima da dobra com quatro arquivos em `1280×800`.
- Deixar a ordem explícita (posição numérica) e a prévia legível.
- Não alterar o comportamento padrão de `DropZone` e `ReorderableList` para outros consumidores.

**Non-Goals:**
- Mudar o `WorkspacePicker`, o `pdf-core` ou o fluxo de mesclagem.
- Cartão “adicionar mais” dentro da grade e conectores entre cartões: a barra de comando já oferece as duas origens.

## Decisions

1. **Modo compacto por controlador, não por prop.** O estado depende dos arquivos em runtime, então `DropZoneController.setCompact()` grava `data-compact`. O CSS do módulo reage ao atributo, sem classe gerada escrita à mão.
2. **Status acessível no modo compacto.** O `[data-drop-status]` continua no DOM com `role="status"`, apenas recortado visualmente, para manter os anúncios.
3. **`grid` só a partir de `600px`.** O cabeçalho do cartão precisa de cerca de `220px` (posição, alça e três botões de 44 px). Em telas estreitas, a linha numerada aproveita melhor a largura.
4. **Setas horizontais por rotação.** Em `grid`, os ícones `arrow-up`/`arrow-down` giram `-90°` e os rótulos passam a “antes/depois”. Nenhum ícone novo entra na allowlist.
5. **Arrasto 2D apenas em `grid`.** Em `list`, o cálculo vertical original fica intacto. Em `grid`, um item conta como anterior ao ponteiro quando o ponteiro está abaixo dele ou na mesma faixa e à direita do seu centro.
6. **Soltar na bancada inteira.** O Merge PDF encaminha o `drop` da seção para `DropZoneController.select()`, ignorando eventos que já ocorreram dentro da `DropZone`.

## Risks / Trade-offs

- Barra fixa (`position: sticky`) pode cobrir o topo dos cartões durante a rolagem; ela usa fundo opaco e `--z-header` abaixo dos popovers.

