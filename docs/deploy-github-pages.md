# Deploy no GitHub Pages

## Preparação

Confirme que o repositório é o user site `tolvira.github.io`, configure Pages para GitHub Actions e execute `npm run validate`. O workflow `deploy-pages.yml` empacota `dist/`; nenhum segredo de aplicação é necessário.

## Conformidade

Pages suporta o build estático, mas suas condições restringem certos usos comerciais e sites focados em transações. Antes de ativar solicitação ou pagamento de patrocínio, obtenha avaliação aplicável ao caso. O código mantém `commercialMode: prelaunch` e nenhum link PayPal.

## Alternativa portátil

O artefato `dist/` pode ser servido por qualquer host estático com HTTPS, redirects/404 e headers configuráveis. Cloudflare Pages, Netlify ou outro serviço comercial podem ser avaliados sem reescrever a aplicação. Não migre sem revisar domínio, canonical e política.

## Verificação

Após deploy, teste rotas, 404, sitemap, robots, canonical, assets e project-site links. Cadastre Search Console separadamente conforme `seo.md`.
