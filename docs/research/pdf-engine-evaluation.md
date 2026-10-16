# Avaliação de motores PDF no navegador

**Status:** concluída em 2026-10-16.
**Issue:** #9. **Escopo:** experimento isolado; nenhuma dependência PDF entra no hub.

## Decisão resumida

Adotar a alternativa **A — JavaScript predominante**: `pdf-lib` (MIT) para
mutação estrutural local e `PDF.js` (Apache-2.0) sob importação dinâmica para
inspeção, texto e renderização. A fronteira pública do futuro `pdf-core` será
independente dessas bibliotecas. Uma alternativa WASM só poderá ser incorporada
como adaptador opcional depois de um benchmark específico provar ganho material.

Esta composição atende merge, split, extração, rotação, reordenação, exclusão e
criação de PDF sem servidor. `PDF.js` fornece o preview/rasterização que
`pdf-lib` deliberadamente não oferece. O [manual do pdf-lib](https://github.com/Hopding/pdf-lib)
documenta criação e modificação no browser; a [documentação do PDF.js](https://mozilla.github.io/pdf.js/getting_started/)
separa a camada de display do worker de parsing.

## Candidatos e licenças

| Candidato                | Licença                                    | Papel avaliado                          | Decisão                               |
| ------------------------ | ------------------------------------------ | --------------------------------------- | ------------------------------------- |
| pdf-lib                  | MIT                                        | mutação e criação                       | adotar para M1                        |
| PDF.js                   | Apache-2.0                                 | parser, texto, preview e rasterização   | adotar sob demanda                    |
| qpdf compilado para WASM | Apache-2.0                                 | transformação estrutural de baixo nível | reavaliar se a compatibilidade exigir |
| PDFium/WASM              | upstream permissivo, wrappers heterogêneos | renderização nativa                     | não adotar no M0                      |
| lopdf/WASM               | MIT (exceto fonte Montserrat)              | manipulação Rust de baixo nível         | não adotar no M0                      |
| MuPDF.js                 | AGPL ou licença comercial                  | motor completo                          | excluir do runtime                    |

Distribuir JavaScript ou WASM permissivo exige preservar os avisos/licenças das
dependências e, para Apache-2.0, o `NOTICE` quando aplicável. Não obriga abrir o
código proprietário derivado. AGPL impõe obrigações de disponibilização de fonte
ao oferecer o software por rede; por isso MuPDF não é uma dependência padrão, a
menos que exista licença comercial. Confirmações dos titulares: [PDF.js Apache-2.0](https://mozilla.github.io/pdf.js/),
[qpdf Apache-2.0](https://qpdf.readthedocs.io/en/12.0/license.html),
[lopdf MIT](https://docs.rs/lopdf/latest/lopdf/#license) e [MuPDF AGPL/comercial](https://mupdf.com/releases).
Isto é uma avaliação técnica, não parecer jurídico.

## Matriz de capacidades

Legenda: **S** suportada, **P** parcial, **N** não suportada como API pública,
**V** não verificada em um build WASM mantido.

| Capacidade                                             | pdf-lib | PDF.js             | qpdf/PDFium/lopdf WASM | MuPDF.js |
| ------------------------------------------------------ | ------- | ------------------ | ---------------------- | -------- |
| Metadados e estrutura                                  | S       | S                  | P/V                    | S        |
| Merge, split, extrair, reordenar, rotacionar e excluir | S       | N                  | P/V                    | S        |
| Renderizar/rasterizar e texto                          | N       | S                  | P/V                    | S        |
| Imagem para PDF                                        | S       | N                  | P/V                    | S        |
| Compressão/otimização real                             | P       | N                  | P/V                    | S        |
| Senhas e AES                                           | P       | P                  | P/V                    | S        |
| AcroForms                                              | S       | P (leitura/render) | P/V                    | S        |
| XFA, assinaturas e preservação de assinatura           | N       | P                  | P/V                    | P        |
| Fontes incorporadas/subsets                            | S       | S (render)         | P/V                    | S        |

`qpdf` é estrutural: seu próprio projeto informa que não renderiza nem extrai
texto. PDFium e Rust/WASM têm viabilidade teórica, porém nenhum wrapper foi
selecionado como contrato estável e universal de navegador nesta fase. PDFs
assinados devem exibir aviso: qualquer reescrita invalida a assinatura existente.

## PoC e resultados medidos

O experimento reproduzível está em `experiments/pdf-engines-benchmark/`. Ele
gera PDFs sintéticos sem dados pessoais e roda merge, extração, reordenação e
rotação. Em Windows, Node 22.20.0 e `pdf-lib@1.17.1`, o fixture de 100 páginas
teve 24.447 bytes: merge de duas cópias levou **269,61 ms**, extração alternada
**86,42 ms** e reordenação/rotação **117,19 ms**. São números de processo Node;
RSS adicional observado foi respectivamente 6,29 MB, 0,72 MB e 3,01 MB.

No contexto de browser, um documento sintético de 100 páginas confirmou as
operações em Chromium, Firefox e WebKit: merge/extrair em ms foram
**54/30,8**, **83/48** e **122/59**, respectivamente. O bundle minificado do
`pdf-lib` mediu **525.099 B** sem compressão e **206.639 B gzip**. Esses dados
não representam PDFs fotográficos de 1/10/50 MB, nem são promessa de SLA: antes
de lançar uma ferramenta deve-se repetir a PoC com corpus público representativo,
medir heap no navegador e validar o arquivo produzido em leitores independentes.

## WASM, workers e plataforma

Workers dedicados são o mecanismo padrão: transferir `ArrayBuffer` em vez de
copiar, limitar concorrência pelo Resource Budget e descartar workers após a
operação. Cancelamento deve ser cooperativo por mensagem/`AbortSignal`; não há
interrupção segura genérica de uma chamada WASM síncrona.

`SharedArrayBuffer` não é requisito. Ele só está disponível sob isolamento
cross-origin, que requer `Cross-Origin-Opener-Policy: same-origin` e
`Cross-Origin-Embedder-Policy: require-corp` ou `credentialless`, como documenta
a [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated).
GitHub Pages não permite configurar esses cabeçalhos arbitrários por rota; logo,
WASM com threads/SAB não é pressuposto da arquitetura. SIMD deve passar por
feature detection e ter fallback. PDF.js já oferece worker e fallback quando ele
não puder iniciar.

## Contrato de adaptador proposto

```ts
export interface PdfEngine {
  inspect(input: ArrayBuffer, signal?: AbortSignal): Promise<PdfInspection>;
  merge(inputs: readonly ArrayBuffer[], signal?: AbortSignal): Promise<Uint8Array>;
  extract(input: ArrayBuffer, pages: readonly number[], signal?: AbortSignal): Promise<Uint8Array>;
  reorder(input: ArrayBuffer, pages: readonly number[], signal?: AbortSignal): Promise<Uint8Array>;
}

export interface PdfRenderer {
  renderPage(input: ArrayBuffer, page: number, options: RenderOptions): Promise<ImageBitmap>;
}
```

O adaptador `pdf-lib` implementa operações estruturais; o renderer PDF.js é
carregado somente quando a ferramenta precisa de miniaturas/preview. APIs de UI
não podem importar bibliotecas de motor diretamente.

## Riscos e gatilhos de reavaliação

- Avaliar qpdf/PDFium WASM se PDFs válidos falharem, se a compressão requerida não
  for atingível ou se o p95 de uma operação exceder o orçamento definido.
- Avaliar licença comercial MuPDF somente mediante aprovação jurídica e orçamento.
- Bloquear arquivos acima dos limites do épico antes de alocar memória; validar
  entradas corrompidas e protegidas antes da mutação.
- Não carregar PDF.js, worker, CMaps ou WASM de CDN; empacotar e servir tudo da
  própria origem para preservar operação offline após o primeiro carregamento.
