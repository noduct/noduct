Complementa o AGENTS.md da raiz.

# Escopo local
- Scripts de produto são subcomandos de `scripts/noduct.ts`.
- Não acrescente scripts específicos de ferramenta ao manifesto raiz.
- Descubra ferramentas pelos manifests, sem lista manual de slugs.
- Guardrails devem apontar regra, arquivo:linha, motivo e correção.
- Mantenha checks determinísticos e fixtures violadoras.

# Como trabalhar

1. Leia o contrato raiz e a documentação da área `scripts/`.
2. Consulte os arquivos canônicos citados em `AGENTS.md`.
3. Faça a menor mudança que atenda à issue.
4. Rode `npm run check` após alterar a área.
5. Registre a saída de `npm run verify` antes de concluir.
6. Se uma regra bloquear uma mudança necessária, registre a dúvida no PR e pergunte.
7. Não amplie allowlists nem adicione supressões para ocultar falhas.

# Revisão

- Confira os contratos públicos afetados por `scripts/`.
- Atualize documentação e testes quando o comportamento mudar.
