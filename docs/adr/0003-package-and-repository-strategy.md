# ADR 0003 — Estratégia de pacotes e repositórios PDF

**Status:** aceito em 2026-10-16.

## Contexto

As ferramentas PDF devem compartilhar contratos e componentes sem transformar o
hub estático em uma aplicação de processamento de arquivos. O projeto começa em
um workspace único para que alterações de contrato sejam atômicas e auditáveis,
mas cada ferramenta deverá poder ter ciclo de entrega independente.

## Decisão

Manter, inicialmente, um monorepo npm workspace com pacotes privados:

```text
packages/
  pdf-core/        domínio PDF puro
  workspace-core/  persistência local e transferências entre ferramentas
  design-system/   shell, componentes, tokens e acessibilidade
  tool-runtime/    topologia de URLs, locales, SEO e taxonomia (TS puro)
  tool-template/   esqueleto de ferramenta Astro
```

Uma ferramenta standalone ou o PDF Studio pode depender de `pdf-core`,
`workspace-core`, `design-system` e `tool-runtime`. `pdf-core` não pode depender de Astro, DOM,
`workspace-core` ou `design-system`; `workspace-core` não pode depender de UI.
`tool-runtime` não depende de nenhum pacote interno, de DOM ou de Astro;
`design-system` pode depender de `tool-runtime`, nunca o inverso. O hub não
importa `pdf-core` nem `workspace-core`. Não são permitidos ciclos entre pacotes.
Detalhes do shell e da topologia: [ADR 0005](0005-unified-shell-topology-guardrails.md).

Todos os pacotes compilam para ESM moderno e usam TypeScript strict. Dependências
externas compartilhadas ficam pinadas no manifesto central. Engines pesados são
importados dinamicamente pelos adaptadores, nunca pelo entrypoint do hub.

## Evolução e versionamento

- Contratos públicos seguem SemVer: patch corrige, minor acrescenta API
  compatível e major remove/altera contrato.
- Tipos discriminados e schemas persistidos possuem `schemaVersion`; leitores
  devem aceitar versões suportadas e falhar de modo explícito nas demais.
- Mudanças incompatíveis exigem plano de migração, fixture de compatibilidade e
  nota de release.
- Durante o monorepo, versões são alinhadas em PR atômica. Na extração, cada
  pacote recebe versionamento e changelog independentes.

## Extração futura

Extrair somente após os contratos M1/M2 estabilizarem e existirem consumidores
reais. Criar repositório, preservar histórico com `git subtree split` quando útil,
publicar uma versão imutável e substituir a dependência workspace por versão
pinada. O pacote extraído não pode importar caminhos internos do monorepo.

## Consequências

Há disciplina adicional de fronteiras agora, mas o custo de extração posterior é
baixo. Ferramentas futuras podem evoluir e ser implantadas de forma independente,
sem tornar o hub dependente de seus motores.
