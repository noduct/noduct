Complementa o AGENTS.md da raiz.

# Escopo local
- Páginas só definem rotas e compõem componentes.
- Mantenha lógica de domínio em `features/` ou pacotes próprios.
- O shell vem de `@noduct/design-system`, inclusive Settings.
- HTML essencial, links e metadados existem sem JavaScript.
- Não importe `pdf-core` nem `workspace-core` no hub.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `src/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `src/`.
- Atualize documentação e testes quando o comportamento mudar.
