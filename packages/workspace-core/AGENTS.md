Complementa [AGENTS.md](../../AGENTS.md).

# Escopo local
- Persistência e transferência sem UI; a interface vive em `design-system/src/workspace-ui/`.
- Schema e migrações em `src/db.ts`; API pública em `src/index.ts`; limites em `src/resource-budget.ts`.
- Devolva códigos e parâmetros traduzíveis, nunca frases de interface.
- Toda migração de schema tem teste com fixture da versão anterior.
- Limpeza nunca remove documento `persistent` nem adquirido por `acquireDocument()`.
- Teste locks, expiração e migração com relógio controlado, ao lado do código.
- Consulte [armazenamento](../../docs/architecture/local-workspace.md) e [orçamento](../../docs/architecture/resource-budget.md).
