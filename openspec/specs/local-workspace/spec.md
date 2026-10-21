# local-workspace Specification

## Purpose
Define a Área Local: um repositório de documentos em IndexedDB, compartilhado pelas ferramentas da mesma origem, que nunca envia arquivos a um servidor. A especificação de interface completa está em `docs/architecture/local-workspace-ux.md`.

## Requirements

### Requirement: Superfícies da Área Local
A Área Local SHALL ser acessível pela seção da home (`WorkspaceRecents`, com opção de minimizar/expandir persistida em `localStorage` sob `noduct-workspace-recents` e aplicada sem FOUC antes da pintura), pela página `/workspace/` do hub, pela origem `Da Área Local` da `DropZone` e pela ação de salvar do `DownloadCard`. Nenhuma ferramenta MAY montar controle de workspace no header nem seletor ou lista própria.

#### Scenario: Ferramenta que recebe arquivos
- **WHEN** uma ferramenta declara `workspace` na `DropZone` e chama `connectLocalWorkspace()`
- **THEN** o botão `Da Área Local` abre o seletor e os documentos escolhidos chegam pelo mesmo evento `noduct:files` dos arquivos do dispositivo

#### Scenario: Minimizar acesso rápido da Área Local na Home
- **WHEN** o usuário aciona o botão de minimizar (`[data-recents-toggle]`) na seção `WorkspaceRecents` da Home e recarrega a página
- **THEN** a lista de arquivos recentes e o subtítulo introdutório ficam recolhidos, mantendo visíveis o título, o contador e o botão `"Ver todos"`, com o estado preservado em `localStorage` (`noduct-workspace-recents = 'collapsed'`) sem salto de layout (FOUC)

### Requirement: Salvamento por ação explícita
Uma ferramenta MUST NOT gravar resultados automaticamente; o resultado só é salvo quando o usuário aciona "Salvar na Área Local", e só é anunciado como salvo depois da confirmação da escrita.

#### Scenario: Resultado não salvo
- **WHEN** o usuário conclui uma operação e só baixa o resultado
- **THEN** nenhum documento novo aparece na Área Local

### Requirement: Retenção por origem da escrita
Documentos salvos pelo usuário SHALL ser `persistent`; cópias implícitas, como tickets de transferência, SHALL ser `ephemeral`. Um documento `ephemeral` sem acesso há mais de 24 horas SHALL ser removido no próximo gatilho de limpeza (abertura da Área Local ou retorno da aba ao primeiro plano), sem timer em segundo plano.

#### Scenario: Expiração
- **WHEN** um documento `ephemeral` está sem acesso há 24 horas e 1 milissegundo e a Área Local é aberta
- **THEN** ele é removido e a remoção é anunciada por `aria-live`

#### Scenario: Documento persistente
- **WHEN** um documento `persistent` está sem acesso há mais de 24 horas
- **THEN** ele permanece

### Requirement: Documento em uso não é removido
A limpeza MUST NOT remover um documento adquirido por outra aba com `acquireDocument()`; sem Web Locks disponíveis, a limpeza automática SHALL conservar os documentos.

#### Scenario: Duas abas
- **WHEN** a aba A segura um documento e a aba B dispara a limpeza após o prazo
- **THEN** o documento permanece até a aba A liberá-lo

### Requirement: Erros por código
`workspace-core` SHALL devolver `code` e `params` estruturados; a interface SHALL traduzir cada código em en, pt-BR e es.

#### Scenario: Arquivo acima do limite
- **WHEN** um arquivo excede o orçamento do perfil
- **THEN** o pacote devolve `FILE_TOO_LARGE` com nome, tamanho, limite e perfil, e a ferramenta exibe a mensagem traduzida

### Requirement: Formatos livres na Área Local e restrição declarativa por ferramenta
A página `/workspace/` (`WorkspaceManager`) SHALL aceitar qualquer formato de arquivo no seletor padrão (`DEFAULT_WORKSPACE_ACCEPT = ''`) e inferir o MIME type real pela extensão quando o navegador não informar `file.type`. Cada ferramenta SHALL declarar seus formatos aceitos em `defineTool({ accept })` e aplicá-los na `DropZone` e no `WorkspacePicker`.

#### Scenario: Arquivo não-PDF salvo na Área Local e aberto em ferramenta de PDF
- **WHEN** o usuário adiciona um arquivo `.txt` ou `.png` em `/workspace/` e depois abre o `WorkspacePicker` dentro do Merge PDF (`accept="application/pdf,.pdf"`)
- **THEN** o arquivo é salvo na Área Local com seu MIME real (`text/plain` ou `image/png`) e fica oculto no seletor do Merge PDF com o aviso de incompatibilidade traduzido
