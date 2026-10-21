Complementa [AGENTS.md](../../AGENTS.md).

# Escopo local
- Domínio puro: sem DOM, Astro, armazenamento nem `workspace-core`.
- Operações em `src/core.ts` e erros em `src/errors.ts`, expostos só por `src/index.ts`.
- PDF.js só em `src/render/`, carregado por `import()` dinâmico.
- Erros por código e parâmetros; a ferramenta traduz.
- Testes ao lado do código (`src/**/*.test.ts`), com PDF inválido, limite de recurso e cancelamento.
- Consulte [contratos](../../docs/architecture/pdf-core-contracts.md) e [modelo de ameaças](../../docs/security/pdf-threat-model.md).
