# Contratos do `pdf-core`

O contrato público está em `packages/pdf-core/src/index.ts`. Ele é puro TypeScript:
não importa Astro, DOM, IndexedDB ou motores PDF. Entradas aceitam `File` ou
`ArrayBuffer`; implementações nunca podem mutar esses valores.

Todas as operações recebem `OperationContext`, com `AbortSignal` e callback de
progresso. Ao receber abort, uma implementação deve parar no próximo ponto seguro
e rejeitar com `OperationCancelledError`.

Erros são subclasses de `PdfCoreError` e possuem código estável: documento
corrompido, criptografado, recurso incompatível, orçamento excedido ou operação
cancelada. A UI usa o código, não a mensagem, para escolher orientação ao usuário.

`assessResources` é obrigatório antes de parse/processamento e retorna
`allowed`, `warning` ou `blocked`. Os valores concretos de orçamento vêm da
política da ferramenta/dispositivo; o core apenas aplica o contrato. As operações
estruturais retornam bytes novos e nome seguro a ser definido pelo adaptador de
exportação.
