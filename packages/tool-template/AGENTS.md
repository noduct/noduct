Complementa [AGENTS.md](../../AGENTS.md).

# Escopo local
- Semente de `npm run new:tool`: tudo aqui é copiado para cada ferramenta nova.
- Mantenha a mesma estrutura do merge-pdf: `config.ts`, `i18n.ts`, `pages/`, `components/` e `lib/` com testes ao lado.
- Marcadores `TODO(i18n)` devem fazer o check falhar até serem preenchidos.
- Não acrescente lógica de uma ferramenta específica; mudanças aqui valem para todas as futuras.
- Mudança de contrato no template exige a mesma mudança no merge-pdf.
