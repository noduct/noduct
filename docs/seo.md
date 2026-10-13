# SEO técnico

## Implementação

`BaseLayout.astro` gera title, description, canonical absoluto, Open Graph, Twitter Card, favicon e Organization JSON-LD. `@astrojs/sitemap` gera somente rotas mantidas pelo hub; `robots.txt` aponta ao índice. Páginas de ferramentas independentes pertencem aos sitemaps de seus repositórios.

## Convenções

URLs inglesas, minúsculas e estáveis. Uma página tem um H1 e descrição específica. Não há `hreflang` até existir tradução completa. Planned tools não ganham páginas públicas. SoftwareApplication só deve ser adicionado na ferramenta real e com dados verificáveis.

## Validação e Search Console

`npm run build` verifica títulos, descriptions, canonicals, H1, robots e sitemap. Depois de publicar, cadastre o domínio/propriedade no Search Console e envie o sitemap do hub e o de cada project site. Isso auxilia descoberta, não garante indexação ou posição.
