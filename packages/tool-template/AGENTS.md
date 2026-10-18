Complementa o AGENTS.md da raiz.

# Escopo local
- Esta ferramenta deve compilar com `AppShell`, `ToolPage` e `defineTool()`.
- Não duplique shell, URL nem configuração de locale.
- Marcadores de tradução devem fazer o check falhar até serem preenchidos.
- Uma ferramenta gerada entra automaticamente em dev, build, e2e e paridade.
- Compare mudanças de contrato com o merge-pdf de referência.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `packages/tool-template/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `packages/tool-template/`.
- Atualize documentação e testes quando o comportamento mudar.
