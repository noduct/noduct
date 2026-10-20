# url-topology Specification

## Purpose
Define como hub e ferramentas compartilham uma única origem e como todas as URLs públicas, prefixos de idioma e metadados derivam de `@noduct/tool-runtime`.

## Requirements

### Requirement: Fonte única de URLs
Toda URL do produto SHALL ser gerada pelas funções públicas de `@noduct/tool-runtime` (`topology`, `defineTool()`); a origem literal só pode aparecer em `packages/tool-runtime/src/topology.ts`.

#### Scenario: Link do header de uma ferramenta
- **WHEN** uma ferramenta renderiza o link para a home do hub em pt-BR
- **THEN** o `href` é o valor de `topology.hubUrl('', 'pt-BR')`, sem prefixo de idioma duplicado

#### Scenario: Literal de origem fora da topologia
- **WHEN** um arquivo fora de `topology.ts` contém a origem do produto ou o base legado
- **THEN** `npm run check -- ui` falha com `ui-contract`

### Requirement: Hub na raiz e ferramentas em `/<slug>/`
O hub SHALL ocupar `/`, `/pt-br/` e `/es/`, e cada ferramenta SHALL ocupar `/<slug>/`, `/<slug>/pt-br/` e `/<slug>/es/`, na mesma origem.

#### Scenario: Artefato montado
- **WHEN** `npm run build` monta `dist-pages/`
- **THEN** cada ferramenta do manifesto existe em `dist-pages/<slug>/` com CSS e JS resolvidos, e `npm run check -- pages` passa

### Requirement: Slugs reservados
Um slug de ferramenta MUST ser kebab-case e MUST NOT colidir com `RESERVED_HUB_SEGMENTS`.

#### Scenario: Slug reservado
- **WHEN** `npm run new:tool` recebe um slug presente em `RESERVED_HUB_SEGMENTS`
- **THEN** o comando falha sem criar arquivos

### Requirement: Metadados recíprocos
Cada página SHALL emitir canonical autorreferente, hreflang para en, pt-BR, es e `x-default`, e um único bloco JSON-LD com `@graph`, todos derivados da topologia.

#### Scenario: Página localizada
- **WHEN** a página `/es/` do hub é gerada
- **THEN** o canonical aponta para ela mesma e os quatro `hreflang` apontam para as variantes existentes
