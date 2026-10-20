# tool-shell Specification

## Purpose
Garante que hub, ferramentas e PDF Studio usem o mesmo shell do design system, de modo que header, footer, Settings, preferências e estrutura de página sejam idênticos.

## Requirements

### Requirement: Página composta pelo shell compartilhado
Toda página SHALL renderizar `AppShell` de `@noduct/design-system` como raiz; ferramentas SHALL compor `ToolPage` dentro dele. Nenhuma página MAY declarar header, footer, Settings ou breadcrumb próprios.

#### Scenario: Página sem shell
- **WHEN** uma página em `src/pages/` ou `packages/*/src/pages/` não tem `AppShell` como raiz do template
- **THEN** `npm run check` falha com `require-app-shell`

### Requirement: Paridade visual com o hub
O header e o footer de cada ferramenta SHALL ser idênticos aos do hub em árvore acessível, geometria, estilos computados e pixels, nos três idiomas, nos dois temas e nos perfis desktop, tablet e mobile, inclusive com Settings, menu mobile e categorias abertos.

#### Scenario: Ferramenta nova
- **WHEN** uma ferramenta é gerada por `npm run new:tool`
- **THEN** ela entra automaticamente em `tests/e2e/shell-parity.spec.ts` sem editar a lista de ferramentas

### Requirement: Preferências aplicadas antes da pintura
O tema, a arte ambiente e o movimento reduzido escolhidos em qualquer página SHALL valer em todas as páginas da origem, aplicados antes da primeira pintura.

#### Scenario: Tema escolhido no hub
- **WHEN** o usuário escolhe o tema escuro no Settings do hub e abre uma ferramenta
- **THEN** a ferramenta abre com `html[data-theme="dark"]` sem piscar o tema claro

### Requirement: Estrutura da página de ferramenta
`ToolPage` SHALL renderizar breadcrumb Home › Categoria › Ferramenta com URLs da topologia, eyebrow da categoria, um único H1, lede, área funcional, patrocínio após a área funcional e o conteúdo informativo; o breadcrumb visível e o `BreadcrumbList` do JSON-LD SHALL vir da mesma lista.

#### Scenario: Breadcrumb e JSON-LD
- **WHEN** a página do Merge PDF é gerada em es
- **THEN** o breadcrumb visível e o `BreadcrumbList` têm os mesmos três nomes localizados e as mesmas URLs
