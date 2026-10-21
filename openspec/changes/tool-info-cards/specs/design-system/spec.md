## ADDED Requirements

### Requirement: Cards informativos com texto estruturado
`ToolInfoCard` SHALL apresentar título e corpo com listas, ênfase, rótulos de ação em `code` e separadores tracejados, nos dois temas, usando apenas tokens. Mensagens MAY marcar termos com `**destaque**` e ações com `` `rótulo` ``; o HTML SHALL ser montado a partir dessas marcas, nunca com HTML cru nas strings i18n.

#### Scenario: Destaque de recurso do sistema
- **WHEN** uma mensagem contém `**Local Workspace**` ou `**Área Local**`
- **THEN** o termo é renderizado em negrito com a cor de texto principal
