Complementa o AGENTS.md da raiz.

# Escopo local
- Mantenha TypeScript puro, sem DOM, Astro ou dependências de outros pacotes internos.
- `src/topology.ts` é a única fonte para origem e URLs do produto.
- Locale, canonical, hreflang, JSON-LD e slugs devem derivar das funções públicas.
- URLs novas precisam de testes de ida e volta e normalização idempotente.
- Um slug novo não pode colidir com `RESERVED_HUB_SEGMENTS`.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `packages/tool-runtime/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `packages/tool-runtime/`.
- Atualize documentação e testes quando o comportamento mudar.
