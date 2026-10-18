# Deploy no GitHub Pages

## Topologia e preparação

A topologia final usa uma única origem, `https://noduct.github.io`: o hub ocupa a raiz e cada ferramenta ocupa `/<slug>/`. `@noduct/tool-runtime` é a única fonte para origem, bases, locales, canonical e assets. O repositório do hub precisa ser renomeado pelo dono para `noduct/noduct.github.io` antes da publicação final; até essa autorização, não publique esta branch.

Configure Pages para GitHub Actions. O workflow compara o `base_url` devolvido por `actions/configure-pages` com `topology.hubUrl()` e falha se a origem não estiver pronta. Nenhum segredo da aplicação é necessário.

## Artefato

`npm run build` gera o hub em `dist/`, gera cada ferramenta declarada pelo campo `noduct.slug` de seu `package.json` e monta tudo em `dist-pages/`:

- hub na raiz;
- ferramentas em `/<slug>/`;
- stubs temporários das rotas antigas em `/noduct/<rota>/`;
- cópia transitória do registry em `/noduct/data/sponsorships.json`.

O workflow publica somente `dist-pages/`. `npm run check -- pages` verifica links e assets locais, canonical, limites dos sitemaps, referências do `robots.txt` e ausência do base antigo fora dos stubs. `npm run check -- seo` verifica o artefato composto. `npm run verify` inclui esses contratos antes de qualquer publicação autorizada.

Os stubs devem permanecer por pelo menos 12 meses após o rename. Não há fallback JavaScript no `404.html`: as rotas conhecidas são materializadas como HTML estático, evitando ampliar a política de scripts antes da auditoria de CSP.

## Conformidade

Pages suporta o build estático, mas suas condições restringem certos usos comerciais e sites focados em transações. Antes de ativar solicitação ou pagamento de patrocínio, obtenha avaliação aplicável ao caso. O código mantém `commercialMode: prelaunch` e nenhum link PayPal.

## Verificação

Antes do deploy, execute `npm run build`. Depois do rename e da publicação autorizada, verifique `/`, `/robots.txt`, `/sitemap-index.xml`, `/merge-pdf/`, um CSS real sob `/merge-pdf/_astro/` e os stubs `/noduct/` e `/noduct/pt-br/privacy/`. Cadastre a propriedade da origem no Search Console e envie o sitemap do hub e os sitemaps das ferramentas.
