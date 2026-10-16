# SEO técnico

## Fontes e metadados

`@noduct/tool-runtime` é a fonte única de canonical, hreflang, origem, locale e JSON-LD. O hub usa `BaseLayout`; ferramentas usam o head do shell compartilhado. Toda página indexável publica title, description, canonical autorreferente, alternates recíprocos `en`, `pt-BR`, `es` e `x-default`, um único H1 e um único bloco JSON-LD com `@graph` quando houver dados estruturados.

URLs inglesas são minúsculas e estáveis. Inglês não recebe prefixo; traduções usam `/pt-br/` e `/es/`. Ferramentas ocupam `/<slug>/` antes do locale. Itens `planned` não recebem link operacional e builds de demonstração usam `noindex,follow`.

## Sitemap e robots

O sitemap da raiz contém somente páginas do hub. Cada ferramenta gera sitemap próprio dentro de seu diretório. `src/pages/robots.txt.ts` publica uma linha `Sitemap:` para o hub e outra para cada ferramenta publicada. As páginas 404 localizadas não entram em sitemap.

## Validação e Search Console

`npm run build:pages` monta `dist-pages/`, executa `validate:pages` e depois `validate:seo`. O validador de SEO ignora stubs e 404, compara canonical com o caminho real sob `topology.origin` e considera duplicidade de título apenas dentro do mesmo idioma. O Lighthouse usa as rotas finais na raiz.

Depois da publicação autorizada, cadastre `https://noduct.github.io/` no Search Console e envie o sitemap do hub e os sitemaps das ferramentas. Isso auxilia descoberta, mas não garante indexação ou posição.
