# Qualidade e testes

## Camadas

Vitest cobre busca, catálogo e patrocínios. Playwright cobre conteúdo inicial, busca, teclado, tema, mobile via projeto separado, categoria, sponsor, 404 e axe. Scripts de build validam SEO e expiração de anúncios.

## Comandos

```bash
npm run check
npm run check -- types
npm test
npm run check -- catalog
npm run check -- sponsors
npm run build
npm run test:e2e
```

Instale Chromium com `npx playwright install chromium`. CI usa instalação com dependências do sistema. Lighthouse deve ser medido contra preview ou URL publicada sob condições documentadas; metas não são declaradas como resultado sem medição.

Os componentes de patrocínio são verificados em uma aplicação Astro isolada em `tests/fixtures/sponsorship-app`, com dados sintéticos e os componentes reais do Design System. `npm run build` prepara essa fixture uma vez. `npm run test:e2e` usa um preview separado na porta 4323, além do artefato Pages na porta 4321, sem recompilar. A saída `.sponsorship-fixture` é ignorada pelo Git e não integra `dist-pages/` nem o deploy. Para uma rodada direcionada depois do build, use `npx playwright test tests/e2e/sponsorship-components.spec.ts tests/e2e/hub.spec.ts --workers=2`.

Concentre a validação ao final da implementação e repita somente os checks afetados por uma correção. As capturas de tema claro e escuro ficam nos artefatos do Playwright para revisão visual.

## Critério

Falhas de lint, tipo, unidade, build, SEO, acessibilidade séria ou E2E bloqueiam deploy. Testes automatizados não garantem WCAG completa, ausência de vulnerabilidades ou indexação.
