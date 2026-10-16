# Benchmark isolado de motores PDF

Esta PoC não é código de produção e não é carregada pelo hub. Ela mede operações
estruturais com `pdf-lib`, usando PDFs sintéticos, sem dados de usuários.

```sh
cd experiments/pdf-engines-benchmark
npm install
npm run generate:fixtures
node --expose-gc scripts/benchmark.mjs medium-100-pages.pdf
npm run benchmark:browsers
```

As métricas de RSS e heap são do processo Node e servem apenas para comparar
execuções idênticas. A validação de RAM e responsividade em navegadores deve usar
as ferramentas de memória do navegador em Chromium, Firefox e Safari antes de um
lançamento.

O benchmark de navegadores mede operações no contexto de Chromium, Firefox e
WebKit quando os binários do Playwright estão instalados. Uma ausência de
pré-requisito é registrada como `not-measured`, sem ser mascarada como suporte.
