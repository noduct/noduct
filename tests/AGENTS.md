Complementa [AGENTS.md](../AGENTS.md).

# Escopo local
- `unit/` testa hub, scripts e contratos entre pacotes; teste de um pacote fica ao lado do código dele.
- `e2e/` roda sobre `dist-pages/` (`npm run build` antes); `fixtures/guardrails/` guarda casos violadores.
- Prefira asserções web-first e comportamento observável; não use `waitForTimeout`.
- Nunca afrouxe, remova ou pule asserções sem aprovação do dono.
- Cubra os dois temas e os três locales quando o contrato pedir; use axe e paridade em ferramentas novas.
