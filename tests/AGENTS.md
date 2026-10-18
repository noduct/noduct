Complementa o AGENTS.md da raiz.

# Escopo local
- Prefira asserções web-first e comportamento observável.
- Não use `waitForTimeout` para mascarar sincronização.
- Nunca afrouxe, remova ou pule asserções sem aprovação do dono.
- Cubra ambos os temas e três locales quando o contrato pedir.
- Use axe e paridade em ferramentas novas.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `tests/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `tests/`.
- Atualize documentação e testes quando o comportamento mudar.
