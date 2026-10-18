# Auditoria técnica dinâmica

**Data:** 13 de outubro de 2026  
**Escopo:** hub Noduct local, build estático e template de ferramentas.

## Método e limitações

A aplicação foi compilada e servida localmente. A navegação dinâmica foi executada com Playwright e Chromium nas larguras de desktop, tablet (820 × 1180) e mobile. Axe verificou critérios automatizáveis WCAG 2.2 AA. Lighthouse CI utilizou Chrome headless sobre o conteúdo de `dist/`.

Os servidores Playwright MCP e Chrome DevTools MCP solicitados não estavam expostos na sessão. Isso foi verificado na lista de ferramentas antes da auditoria. Como alternativa equivalente e reproduzível, foram usados Playwright Test real e Lighthouse/Chrome CLI. A última execução da suíte agregada de 24 testes foi interrompida a pedido do usuário; antes dela, a suíte aprofundada passou 12/12 e a suíte funcional existente havia passado 8/8.

Resultados de laboratório não representam o percentil 75 de usuários reais. INP de campo exige dados reais. Não há ferramenta independente publicada, portanto links reais entre project sites não puderam ser testados pela rede.

## Problemas confirmados e correções

### Hierarquia de headings

Lighthouse encontrou salto de H1 diretamente para H3 em `/tools/` e nas páginas de categoria. Os H3 pertenciam aos cards e não havia heading para a região de resultados.

**Correção:** inclusão de H2 visualmente oculto em resultados de busca e roadmap de categoria, usando uma utilidade global `sr-only`. Lighthouse passou de 98 para 100 em acessibilidade nessas páginas.

### Cobertura preventiva insuficiente

A suíte anterior cobria desktop e mobile, mas não tablet, todas as rotas, erros de console, overflow, links internos, payload ou estrutura SEO dinâmica.

**Correção:** inclusão de viewport tablet em Chromium e `tests/e2e/audit.spec.ts`, que percorre 14 rotas e valida semântica, metadados, axe, console, layout, links, JSON-LD, robots, sitemap, busca, menus, estados planejados e orçamento de JavaScript.

### Ausência de orçamento Lighthouse no CI

Não havia regressão automatizada para categorias Lighthouse e métricas de laboratório.

**Correção:** adição de `@lhci/cli`, `lighthouserc.cjs`, comando `npx lhci autorun` e etapa no workflow de CI. Metas bloqueantes: Performance ≥ 90, Acessibilidade/Best Practices/SEO ≥ 95, LCP ≤ 2,5 s, CLS ≤ 0,1 e TBT ≤ 200 ms.

## Resultados

| Página | Performance | Acessibilidade | Boas práticas | SEO | FCP | LCP | TBT | CLS | Transferência |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 100 | 100 | 100 | 100 | 368 ms | 413 ms | 43 ms | 0,0022 | 9,5 KB |
| All Tools | 100 | 100 | 100 | 100 | 502 ms | 505 ms | 0 ms | 0 | 8,2 KB |
| PDF Tools | 100 | 100 | 100 | 100 | 255 ms | 348 ms | 42 ms | 0,0022 | 6,0 KB |
| Sponsor | 96 | 100 | 100 | 100 | 546 ms | 564 ms | 154 ms | 0 | 6,0 KB |

Outras verificações concluídas:

- Build: 15 páginas estáticas e sitemap gerados.
- Validação SEO do build: 15/15 páginas aprovadas.
- Auditoria Playwright aprofundada: 12/12 em desktop, tablet e mobile.
- Testes unitários: 7/7.
- Lint e typecheck: aprovados.
- Nenhum erro de console ou overflow horizontal nas 14 rotas auditadas.
- Nenhuma violação axe séria ou crítica nas rotas e viewports auditadas.
- Busca, `Ctrl/Cmd+K`, tema, menu mobile e estados planejados reproduzidos.
- Planned tools permaneceram sem links operacionais.
- JSON-LD parseável, robots e sitemap acessíveis.
- Payload observado abaixo do orçamento de três scripts e 50 KB de JavaScript transferido.

## GitHub Pages

O hub usa caminhos raiz apropriados ao project site `noduct.github.io/noduct`. O template define `base: /example-tool` e canonical no project site; seus links de retorno ao hub são absolutos. O build do template foi validado anteriormente. Cada ferramenta precisa substituir `example-tool`, publicar em repositório próprio e registrar URL real no catálogo antes do status `published`.

Não foi encontrado link quebrado interno no hub. A validação externa de Pages, headers HTTP, domínio e project sites permanece pendente até existir deploy autorizado.

## Comandos de regressão

```bash
npm run check
npm run check -- types
npm test
npm run build
npm run test:e2e
npx lhci autorun
```
