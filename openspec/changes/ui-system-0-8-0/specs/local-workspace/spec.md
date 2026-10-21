# Spec Delta

## MODIFIED Requirements

### Requirement: Superfícies da Área Local
A Área Local SHALL ser acessível pela seção da home (`WorkspaceRecents`, com opção de minimizar/expandir persistida em `localStorage` sob `noduct-workspace-recents` e aplicada sem FOUC antes da pintura), pela página `/workspace/` do hub, pela origem `Da Área Local` da `DropZone` e pela ação de salvar do `DownloadCard`. Nenhuma ferramenta MAY montar controle de workspace no header nem seletor ou lista própria.

#### Scenario: Ferramenta que recebe arquivos
- **WHEN** uma ferramenta declara `workspace` na `DropZone` e chama `connectLocalWorkspace()`
- **THEN** o botão `Da Área Local` abre o seletor e os documentos escolhidos chegam pelo mesmo evento `noduct:files` dos arquivos do dispositivo

#### Scenario: Minimizar acesso rápido da Área Local na Home
- **WHEN** o usuário aciona o botão de minimizar (`[data-recents-toggle]`) na seção `WorkspaceRecents` da Home e recarrega a página
- **THEN** a lista de arquivos recentes e o subtítulo introdutório ficam recolhidos, mantendo visíveis o título, o contador e o botão `"Ver todos"`, com o estado preservado em `localStorage` (`noduct-workspace-recents = 'collapsed'`) sem salto de layout (FOUC)

## ADDED Requirements

### Requirement: Formatos livres na Área Local e restrição declarativa por ferramenta
A página `/workspace/` (`WorkspaceManager`) SHALL aceitar qualquer formato de arquivo no seletor padrão (`DEFAULT_WORKSPACE_ACCEPT = ''`) e inferir o MIME type real pela extensão quando o navegador não informar `file.type`. Cada ferramenta SHALL declarar seus formatos aceitos em `defineTool({ accept })` e aplicá-los na `DropZone` e no `WorkspacePicker`.

#### Scenario: Arquivo não-PDF salvo na Área Local e aberto em ferramenta de PDF
- **WHEN** o usuário adiciona um arquivo `.txt` ou `.png` em `/workspace/` e depois abre o `WorkspacePicker` dentro do Merge PDF (`accept="application/pdf,.pdf"`)
- **THEN** o arquivo é salvo na Área Local com seu MIME real (`text/plain` ou `image/png`) e fica oculto no seletor do Merge PDF com o aviso de incompatibilidade traduzido
