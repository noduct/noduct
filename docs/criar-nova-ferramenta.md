# Criar uma nova ferramenta

## 1. Iniciar

Crie um repositório a partir de `packages/tool-template` e use um slug inglês curto, por exemplo `word-counter`.

```bash
cp -R packages/tool-template ../word-counter
cd ../word-counter
npm install
npm run dev
```

## 2. Configurar

Troque nome do pacote, `site`, `base`, nome, slug, categoria, descrição, canonical e aviso de privacidade. O `base` deve ser `/<slug>`. Preserve `noindex` enquanto for demonstração.

## 3. Implementar

Coloque a função antes de textos longos. Implemente estados idle/loading/success/error, entradas adequadas, preview/download quando necessário e limites explícitos. Se usar arquivos, teste drag and drop, múltiplos arquivos e memória. Reuse tokens do design system.

## 4. Conteúdo e SEO

Escreva title e description próprios, um H1, instruções reais, limitações, privacidade e FAQ somente quando útil. Adicione BreadcrumbList e SoftwareApplication apenas com propriedades verdadeiras. Remova `noindex` no lançamento.

## 5. Patrocínio

Use o placement `<slug>-primary` depois da área funcional. Sem registro ativo, não reserve vazio. Nunca misture dados financeiros à configuração pública.

## 6. Testar e publicar

```bash
npm run typecheck
npm run build
npx playwright test
```

Configure Pages no repositório, valide `https://noduct.github.io/<slug>/`, sitemap e canonical. Então adicione URL e repositoryUrl ao catálogo do hub, mude status para `published`, escolha `featured` manualmente e rode `npm run validate`. Confira links e envie o sitemap próprio ao Search Console.
