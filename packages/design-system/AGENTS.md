Complementa o AGENTS.md da raiz.

# Escopo local
- Use tokens em `src/tokens.css` antes de novos valores globais.
- Ícones vêm de `Icon` e da allowlist `src/icons/registry.ts`.
- Componentes usam CSS Modules e estados `data-*`.
- Preserve 44 px no toque, foco visível e movimento reduzido.
- Mudança de API pública exige versão e changelog atualizados.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `packages/design-system/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `packages/design-system/`.
- Atualize documentação e testes quando o comportamento mudar.
