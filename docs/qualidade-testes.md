# Qualidade e testes

## Camadas

Vitest cobre busca, catálogo e patrocínios. Playwright cobre conteúdo inicial, busca, teclado, tema, mobile via projeto separado, categoria, sponsor, 404 e axe. Scripts de build validam SEO e expiração de anúncios.

## Comandos

```bash
npm run lint
npm run typecheck
npm test
npm run validate:catalog
npm run check:sponsors
npm run build
npm run test:e2e
```

Instale Chromium com `npx playwright install chromium`. CI usa instalação com dependências do sistema. Lighthouse deve ser medido contra preview ou URL publicada sob condições documentadas; metas não são declaradas como resultado sem medição.

## Critério

Falhas de lint, tipo, unidade, build, SEO, acessibilidade séria ou E2E bloqueiam deploy. Testes automatizados não garantem WCAG completa, ausência de vulnerabilidades ou indexação.
