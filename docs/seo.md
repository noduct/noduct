# SEO técnico

## Implementação

`BaseLayout.astro` gera title, description, canonical absoluto, Open Graph, Twitter Card, favicon e Organization JSON-LD. `@astrojs/sitemap` gera somente rotas mantidas pelo hub; `robots.txt` aponta ao índice. Páginas de ferramentas independentes pertencem aos sitemaps de seus repositórios.

## Convenções

URLs inglesas, minúsculas e estáveis, com prefixos de idioma para as traduções existentes. Cada página tem um H1, descrição específica e canonical autorreferente no idioma renderizado; versões PT-BR e ES não devem apontar seu canonical para a versão inglesa. `BaseLayout.astro` informa o locale a `createSeoMetadata` e publica os alternates `en`, `pt-BR`, `es` e `x-default`. Planned tools não ganham páginas públicas. SoftwareApplication só deve ser adicionado na ferramenta real e com dados verificáveis.

O sitemap e sua referência em `public/robots.txt` incluem o base path `/tolvira` do GitHub Pages. Os testes de navegador usam o mesmo prefixo para validar as rotas realmente publicadas.

## Validação e Search Console

`npm run build` verifica títulos, descriptions, canonicals, H1, robots e sitemap. Depois de publicar, cadastre o domínio/propriedade no Search Console e envie o sitemap do hub e o de cada project site. Isso auxilia descoberta, não garante indexação ou posição.
