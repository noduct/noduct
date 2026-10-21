Complementa [AGENTS.md](../../AGENTS.md).

# Escopo local
- TypeScript puro, sem DOM, Astro nem pacotes internos; carregável pelo Node em `astro.config.mjs`.
- Imports internos usam extensão `.ts` explícita.
- `src/topology.ts` é a única fonte da origem e das URLs; locale, SEO, taxonomia e `defineTool()` têm arquivo próprio.
- URL nova precisa de teste de ida e volta (`parse`) e normalização idempotente em `src/topology.test.ts`.
- Um slug novo não pode colidir com `RESERVED_HUB_SEGMENTS`.
- Requisitos em [url-topology](../../openspec/specs/url-topology/spec.md).
