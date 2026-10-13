# Estrutura de repositórios

## Estado atual

Este repositório é um workspace transitório com hub, design system e template. Isso permite evoluir contratos em conjunto antes da separação.

## Extração

1. Crie `tolvira-design-system` e copie `packages/design-system`, preservando histórico com `git subtree split` se desejado.
2. Publique o pacote ou referencie uma versão Git fixada.
3. Crie `tolvira-tool-template` a partir de `packages/tool-template`.
4. Troque dependências locais por versões publicadas.
5. Execute typecheck e build nos três repositórios.

Cada ferramenta usa um slug único e project site `https://tolvira.github.io/<slug>/`. O hub nunca gera uma página substituta para ela. Workflows e configurações remotas devem ser ativados apenas no repositório correto e após revisão.
