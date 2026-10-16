# Estrutura de repositórios

## Estado atual

Este repositório é um workspace transitório com hub, design system e template. Isso permite evoluir contratos em conjunto antes da separação.

## Extração

1. Crie `noduct-design-system` e copie `packages/design-system`, preservando histórico com `git subtree split` se desejado.
2. Publique o pacote ou referencie uma versão Git fixada.
3. Crie `noduct-tool-template` a partir de `packages/tool-template`.
4. Troque dependências locais por versões publicadas.
5. Execute typecheck e build nos três repositórios.

Cada ferramenta usa um slug único e project site `https://noduct.github.io/<slug>/`. O hub nunca gera uma página substituta para ela. Workflows e configurações remotas devem ser ativados apenas no repositório correto e após revisão.

A consolidação do template de categoria é conduzida na issue #35 (M7.3), enquanto o versionamento e a extração operacional pacote por pacote são executados na issue complementar #38 (M7.4), conforme o [ADR 0003](file:///docs/adr/0003-package-and-repository-strategy.md).

