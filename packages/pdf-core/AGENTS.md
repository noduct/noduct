Complementa o AGENTS.md da raiz.

# Escopo local
- Mantenha domínio PDF puro: sem DOM, Astro ou `workspace-core`.
- Devolva erros por código e parâmetros, nunca frases de interface.
- Importe motores pesados por `import()` dinâmico em adaptadores.
- Exponha contratos públicos pelo entrypoint do pacote.
- Cubra caso inválido e limite de recurso em testes unitários.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `packages/pdf-core/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `packages/pdf-core/`.
- Atualize documentação e testes quando o comportamento mudar.
