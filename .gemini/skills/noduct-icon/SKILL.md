---
name: noduct-icon
description: Adiciona um ícone Lucide à allowlist do Noduct (packages/design-system/src/icons/registry.ts) e o usa com Icon ou IconSprite. Use sempre que a interface precisar de um ícone; nunca use emoji, glifo de texto ou SVG solto.
---

# Ícone

## Pré-condições

- Nenhum nome existente em `iconRegistry` serve. A allowlist é controlada: a mudança exige a label `guardrail-change` no PR.

## Referência canônica

[registry](../../../packages/design-system/src/icons/registry.ts) e [Icon](../../../packages/design-system/src/icons/Icon.astro).

## Passos

1. Escolha o ícone no pacote `lucide` (versão fixada no design system).
2. Em `registry.ts`, acrescente o import em ordem alfabética e a entrada com o nome kebab-case do Lucide:

   ```ts
   import { /* ... */ Scissors, /* ... */ } from 'lucide';
   export const iconRegistry = { /* ... */ scissors: Scissors, /* ... */ } as const satisfies Record<string, IconNode>;
   ```

3. Use no componente: `<Icon name="scissors" />`. Em grades repetidas, prefira o sprite (`IconSprite`).
4. Ícone decorativo fica com `aria-hidden`; botão só com ícone precisa de `aria-label` traduzido nos três idiomas.

## Validação

`npm run check -- ui`, depois `npm run verify`.

## Erros comuns

- `no-raw-svg`: `<svg>` escrito no componente ou via `set:html`.
- `ui-contract`: emoji ou glifo (setas, `×`, `✓`) usado como ícone, inclusive em CSS `content:`.
- `ratchet`: allowlist alterada sem a label `guardrail-change`.
