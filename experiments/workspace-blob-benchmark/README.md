# Benchmark do toque de metadados no Local Workspace

Esta PoC não é código de produção. Ela mede quanto custa renovar `lastAccessedAt`, que é o que fazem `touchDocument` e `setRetention`, em dois layouts do IndexedDB:

- **v3:** o registro de `documents` contém o `Blob`, então cada toque regrava o registro com o payload;
- **v4:** o `Blob` fica na store `document_blobs` e o toque regrava só os metadados.

```sh
node experiments/workspace-blob-benchmark/scripts/browser-benchmark.mjs
SIZES_MB=10,100 ROUNDS=11 BROWSERS=chromium node experiments/workspace-blob-benchmark/scripts/browser-benchmark.mjs
```

O script usa o `@playwright/test` da raiz e um servidor HTTP local, porque o IndexedDB exige uma origem real. Os dados são sintéticos. Um navegador sem pré-requisito aparece como `not-measured`.

## Resultado de 2026-10-19 (Windows 11, 7 rodadas, mediana)

| Payload | Chromium 156: v3 | Chromium 156: v4 | Firefox 157: v3 | Firefox 157: v4 |
| ------- | ---------------- | ---------------- | --------------- | --------------- |
| 1 MB    | 4,3 ms           | 1,2 ms           | 2 ms            | 2 ms            |
| 10 MB   | 18,1 ms          | 1,0 ms           | 3 ms            | 3 ms            |
| 50 MB   | 14,4 ms          | 0,9 ms           | 3 ms            | 2 ms            |
| 100 MB  | 16,3 ms          | 1,0 ms           | 3 ms            | 2 ms            |

- **Chromium:** cada toque v3 custa de 15 a 18 vezes mais a partir de 10 MB, com picos de até 33 ms. Essa espera recai sobre toda leitura, abertura, transferência e mudança de retenção.
- **Firefox:** reaproveita a referência do Blob; os layouts empatam.
- **Uso de disco:** `navigator.storage.estimate()` não cresceu em nenhum dos dois navegadores, então o custo do v3 é de tempo e I/O transitório, sem duplicação persistente.
- **WebKit:** no Windows, o WebKit do Playwright falhou em `page.evaluate` ao gravar o Blob e ficou `not-measured`. É preciso medir em Safari/macOS antes de um lançamento.

Esses números motivaram o schema v4 (ver `docs/architecture/local-workspace.md`).
