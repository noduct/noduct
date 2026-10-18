Complementa o AGENTS.md da raiz.

# Escopo local
- Páginas compõem `AppShell`, `ToolPage` e `defineTool()`.
- Não crie shell, header, footer ou Settings locais.
- Localize en, pt-BR e es inclusive no script cliente.
- Use serviços de URL do `tool-runtime`, sem prefixos manuais.
- Teste fluxo real, privacidade e paridade com o hub.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `packages/merge-pdf/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `packages/merge-pdf/`.
- Atualize documentação e testes quando o comportamento mudar.
