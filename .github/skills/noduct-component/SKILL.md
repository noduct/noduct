---
name: noduct-component
description: Adiciona ou altera um componente reutilizável no design system do Noduct (packages/design-system) com CSS Module, tokens, Icon, acessibilidade e adoção em todos os pontos de uso. Use para botões, diálogos, listas, controles ou qualquer UI compartilhada entre hub e ferramentas.
---

# Componente do design system

## Pré-condições

- O componente serve a mais de uma página ou ferramenta; UI de uma única ferramenta fica no pacote dela.
- Confira se já existe algo em `packages/design-system/src/components/` ou `controls/` antes de criar.

## Referência canônica

[Button](../../../packages/design-system/src/components/Button.astro) e [DropZone](../../../packages/design-system/src/components/DropZone.astro), cada um com seu `.module.css`.

## Passos

1. Liste no plano todos os pontos de uso (hub, ferramentas, template) e o CSS antigo que será removido.
2. Crie `src/components/<Nome>.astro` e `<Nome>.module.css`. Estado visual por atributo, nunca por classe gerada:

   ```css
   .root[data-state='selected'] { background: var(--color-surface-hover); }
   ```

3. Textos vêm por props ou das mensagens do shell nos três idiomas; ícones por `<Icon name="..." />`.
4. Alvos de toque de 44 px, foco visível único e `prefers-reduced-motion` respeitado.
5. Exporte em `packages/design-system/package.json` (`exports`) se o componente for público; atualize `CHANGELOG.md` e a versão.
6. Adote o componente em todos os pontos de uso e remova o estilo duplicado.
7. Teste o resultado renderizado (unitário em `tests/unit/` ou e2e), nunca o texto do código-fonte.

## Validação

`npm run check -- css`, `npm run check -- ui`, depois `npm run verify`. Confira no navegador os dois temas e os estados habilitado, desabilitado e hover.

## Erros comuns

- `token-value`: cor, raio, sombra ou duração literal.
- `no-raw-svg`: `<svg>` fora de `Icon`.
- `no-hardcoded-text`: texto fixo no componente ou no runtime cliente.
- Componente criado sem adoção, deixando duas versões do mesmo visual.
