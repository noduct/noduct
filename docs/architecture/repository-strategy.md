# Estratégia de pacotes e repositórios PDF

## Grafo de dependências

```text
merge/split/organize tools ─┬─> pdf-core
pdf-studio                 ├─> workspace-core
                            └─> design-system

pdf-core ──> adaptadores de motor (lazy)
workspace-core ──> IndexedDB, BroadcastChannel
design-system ──> tokens e primitivas visuais
```

Setas só seguem para baixo. O hub pode listar ferramentas, mas não importa seus
motores. O design system não conhece operações PDF e nenhum pacote de domínio
importa Astro, `window` ou `document`.

## Responsabilidades

| Pacote           | Pode conter                                                  | Não pode conter                           |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------- |
| `pdf-core`       | contratos, validação, orçamento, adaptadores e erros tipados | UI, DOM, IndexedDB, rota Astro            |
| `workspace-core` | armazenamento local, quota, locks e tickets opacos           | parse/render de PDF, UI                   |
| `design-system`  | tokens e componentes acessíveis                              | regras de domínio e persistência          |
| ferramenta       | composição Astro e fluxo de usuário                          | cópia de contratos/engines compartilhados |

## Regras de importação

- Use somente exports públicos de outro pacote; caminhos internos são proibidos.
- Um pacote não importa uma ferramenta nem o hub.
- O pipeline deve validar ausência de importações circulares antes de publicar.
- Valores de configuração não devem atravessar a fronteira como `any`; contratos
  públicos precisam de tipos serializáveis e erros discriminados.

## Protocolo de extração

1. Confirmar dois consumidores e uma API estável documentada.
2. Fixar versão, changelog e testes de contrato.
3. Extrair sem mudar a API e publicar/referenciar versão imutável.
4. Migrar consumidores um por vez e testar build, typecheck e E2E.
5. Remover o pacote local apenas depois de não haver consumidores workspace.

Não criar repositório remoto nem publicar pacote como parte desta decisão.

## Estado atual e extração do monorepo

Este repositório é um workspace transitório com hub, pacotes compartilhados, template e ferramentas, para evoluir contratos em conjunto antes da separação ([ADR 0003](../adr/0003-package-and-repository-strategy.md)). Cada área tem `AGENTS.md` local; `npm run check -- agents` verifica a hierarquia e `npm run check -- architecture` verifica a direção dos imports descrita no [mapa de pacotes](README.md).

Para extrair um pacote:

1. Crie o repositório e copie o pacote, preservando o histórico com `git subtree split` se desejado.
2. Publique o pacote ou referencie uma versão Git fixa.
3. Troque as dependências de workspace por versões publicadas.
4. Rode `npm run verify` nos repositórios envolvidos.

Cada ferramenta extraída publica em `/<slug>/` da mesma origem; o hub nunca gera uma página substituta para ela. Workflows e configurações remotas são ativados só no repositório correto e após revisão. Criar repositórios é ação do dono.
