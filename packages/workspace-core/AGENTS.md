Complementa o AGENTS.md da raiz.

# Escopo local
- Mantenha persistência e transferência sem componentes de UI.
- Devolva códigos e parâmetros traduzíveis, nunca frases de interface.
- Toda migração de schema precisa de fixture da versão anterior.
- Preserve documentos persistentes e em uso na limpeza de 24 horas.
- Teste locks, expiração e migração com relógio controlado.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `packages/workspace-core/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `packages/workspace-core/`.
- Atualize documentação e testes quando o comportamento mudar.
