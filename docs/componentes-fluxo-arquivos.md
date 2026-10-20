# Componentes de fluxo de arquivos — Design System 0.5.0

## Escopo

O Design System oferece quatro primitivas Astro para ferramentas que processam arquivos localmente: `DropZone`, `ReorderableList`, `ProcessingFeedback` e `DownloadCard`. Elas não contêm lógica de mesclagem, divisão ou leitura de PDF; a ferramenta consumidora orquestra o fluxo e o `@noduct/pdf-core` processa os arquivos. Nenhum componente envia arquivos para a rede.

Os componentes renderizam HTML estático e carregam um runtime nativo, sem framework de UI. O subpath `@noduct/design-system/file-workflow` expõe contratos, mensagens e controladores sem importar componentes Astro. Os estilos ficam em CSS Modules e usam apenas tokens de `tokens.css`; transições usam os tokens de duração, que zeram com `prefers-reduced-motion` ou `data-motion="reduce"`.

Todos aceitam `locale` (`en`, `pt-BR` ou `es`, padrão `en`) para textos genéricos e anúncios. Rótulos específicos da ferramenta são props.

A Área de Trabalho Local é híbrida ([ADR 0006](adr/0006-hybrid-local-workspace.md)) e não tem entrada no header. Com `workspace`, a `DropZone` ganha a origem `Da Área Local` (diálogo `WorkspacePicker`) e o `DownloadCard` ganha “Salvar na Área Local”, sempre opt-in. A página `/workspace/` usa `WorkspaceManager`, e a home usa `WorkspaceRecents`. `connectLocalWorkspace(root, services)` liga todas as superfícies; `createWorkspaceServices({ loadWorkspace, loadRenderer })` injeta cliente e renderer por `import()` dinâmico, sem o design system depender de `workspace-core` ou `pdf-core`. Veja [Local Workspace](architecture/local-workspace.md) e [guardrails](guardrails.md).

Enquanto o runtime local carrega, a home e a página do workspace mostram o componente `WorkspaceLoading`, com cartões estáticos no formato da superfície. A página lê a preferência salva de lista ou grade antes de desenhar o skeleton, evitando a troca de layout durante a inicialização. Nas ferramentas, o botão `Da Área Local` da `DropZone` ocupa seu espaço desde o HTML inicial: fica desabilitado, com indicador de espera e nome acessível de carregamento, até `connectLocalWorkspace()` ligar o seletor. O indicador respeita movimento reduzido. Ao concluir ou falhar a leitura, os skeletons saem e a superfície exibe documentos, estado vazio ou erro.

Na página de gestão, a seleção mostra uma ilha fixa no rodapé da janela com contagem, seleção dos itens visíveis, limpeza, download e exclusão. Ela não participa do fluxo da grade. A página reserva espaço de rolagem conforme a altura real da ilha para manter os últimos arquivos acessíveis, inclusive em telas estreitas, e desloca notificações acima dela. Renomear arquivos não é uma ação oferecida nesta interface.

Na home e na página de gestão, um ícone discreto aparece ao lado do nome do arquivo, sem cobrir a miniatura. PDF usa documento em vermelho; imagens usam imagem em azul; planilhas e CSV usam tabela em verde; formatos de código e dados usam código; os demais usam documento neutro. A miniatura mantém apenas seu ícone neutro de fallback até a prévia carregar. A classificação privilegia extensões conhecidas quando o MIME salvo é genérico ou incorreto.

O `WorkspacePicker` das ferramentas reutiliza `WorkspaceFileMeta`: abaixo do nome, a data salva aparece com calendário e o tamanho com o ícone de armazenamento, em linhas separadas como no hub. O seletor do Merge PDF já filtra arquivos compatíveis e não adiciona um indicador de tipo ao item.

## API

| Componente           | Props                                                                                                                         | Controlador (`get*`)                          | Evento                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------- |
| `DropZone`           | `id`, `label`, `description?`, `accept?` (padrão `application/pdf,.pdf`), `multiple?` (padrão `true`), `disabled?`, `locale?`, `workspace?` | `setDisabled(bool)`, `select(files, origin?)` | `noduct:files` → `{ accepted, rejected, source, documentIds? }` |
| `ReorderableList`    | `id`, `label`, `items?`, `locale?`                                                                                            | `setItems(items)`, `getIds()`, `setThumbnail(id, blob)` | `noduct:list-change` → `{ action, id, ids }` |
| `ProcessingFeedback` | `label`, `status`, `value?` (0–100; ausente = indeterminado), `cancellable?`, `hidden?`, `locale?`                            | `update({ status, value? })`, `isCancelled()` | `noduct:cancel`                              |
| `DownloadCard`       | `id`, `title?`, `fileName?`, `fileSize?`, `downloadUrl?`, `hidden?`, `locale?`, `workspace?`                                  | `show({ file, fileName })`, `reset()`, `setPreview(blob)`, `enableSave(save, describeError)` | `noduct:restart`, `noduct:download-ready` |

Os nomes dos eventos estão exportados como `FILES_SELECTED_EVENT`, `LIST_CHANGE_EVENT`, `CANCEL_EVENT` e `RESTART_EVENT`; todos borbulham a partir da raiz do componente. Os getters recebem o elemento raiz (`[data-drop-zone]`, `[data-reorderable-list]`, `[data-processing-feedback]`, `[data-download-card]`) e inicializam o componente sob demanda, independentemente da ordem dos scripts.

`FileListItem` tem `id`, `name`, `size` em bytes e `pageCount` opcional. `setItems` substitui a lista inteira e usa somente nós de texto. Os utilitários `acceptsFile`, `formatFileSize` e `describeFileItem` são puros.

## Comportamento e acessibilidade

**DropZone.** O seletor é um `input type="file"` nativo, visualmente oculto e associado a um `label` estilizado como botão; portanto funciona sem JavaScript, recebe foco por teclado e abre o diálogo com Espaço ou Enter. A descrição e a região `role="status"` integram a descrição acessível. A validação replica o atributo `accept` (MIME, curingas `tipo/*` e extensões) como pré-filtro de interface, sem substituir a validação estrutural do `pdf-core`. Estados expostos em `data-state`: `idle`, `dragover`, `rejected`; `data-disabled` indica desabilitado. Durante o arrasto, a rejeição é sinalizada somente quando todos os MIME são conhecidos; ao soltar, os arquivos recusados são anunciados por nome. Mesmo desabilitada, a zona impede que o navegador abra o arquivo solto na aba.

**ReorderableList.** Cada item mostra nome, tamanho formatado, contagem de páginas e controles de 44 × 44 px com nomes acessíveis que incluem o arquivo. A ordem muda pelos botões Mover para cima/baixo, pelas setas no handle, por Alt + setas em qualquer ação do item ou arrastando o handle com mouse, caneta ou toque (Pointer Events com `touch-action: none` no handle). Movimentos deslocam os vizinhos, não o item, preservando o foco e a captura do ponteiro. Controles sem efeito usam `aria-disabled` em vez de `disabled` para não perder o foco. Movimentos anunciam a nova posição e remoções anunciam o novo total em `aria-live="polite"`. Após remover, o foco vai para o mesmo controle do vizinho seguinte (ou anterior); com a lista vazia, vai para a própria lista. O consumidor pode então movê-lo para o `DropZone`.

**ProcessingFeedback.** Usa `role="progressbar"` com `aria-valuenow` apenas no modo determinado e mostra a porcentagem arredondada. Somente o status textual fica em região viva, evitando anúncios a cada ponto percentual. O cancelamento atualiza estado, texto e botão de forma síncrona antes de emitir `noduct:cancel`; o consumidor deve abortar o trabalho (por exemplo, com `AbortController`) e ignorar atualizações tardias. Com movimento reduzido, a barra indeterminada fica estática.

**DownloadCard.** `show` cria um object URL para o `Blob` local, revoga o anterior, exibe o cartão e move o foco para o título. Reiniciar ou chamar `reset` revoga o URL e oculta o cartão; o evento `noduct:restart` permite que a ferramenta limpe seu estado e devolva o foco ao seletor.

## Verificação

A fixture `tests/fixtures/sponsorship-app/src/pages/file-workflow.astro` integra os quatro componentes reais com dados sintéticos. `tests/e2e/file-workflow-components.spec.ts` cobre seleção nativa, teclado, arrasto de arquivos, rejeição, reordenação por botões, setas e ponteiro, foco após remoção, anúncios, progresso, cancelamento, download, reinício, axe nos dois temas, movimento reduzido e alvos de 44 px em 320 px de largura. `tests/unit/file-workflow.test.ts` cobre os utilitários e a completude das mensagens.
