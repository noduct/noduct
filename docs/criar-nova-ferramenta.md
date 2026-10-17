# Criar uma nova ferramenta

## 1. Iniciar

Copie `packages/tool-template` para um novo workspace e escolha um slug inglês em kebab-case. O slug não pode pertencer a `RESERVED_HUB_SEGMENTS`.

## 2. Declarar

Declare a ferramenta uma única vez com `defineTool()` em `src/config.ts`. Origem, base, canonical, hreflang, links do hub e registry devem vir de `topology`; nunca monte URLs do produto manualmente.

Enquanto a ferramenta não estiver lançada, mantenha `published: false`. Para incluí-la no artefato monorepo, adicione ao `package.json`:

```json
{
  "noduct": { "slug": "word-counter" }
}
```

O slug precisa ser idêntico ao de `defineTool()`. O template não contém esse campo porque não é implantado.

## 3. Implementar

Use `AppShell` como documento externo e `ToolPage` de `@noduct/design-system/shell/ToolPage.astro` dentro dele. Passe `scope` de `defineTool()` ao shell, o manifesto `tool` ao template, e `locale`, título e descrição a ambos. O `WorkspaceDrawer` entra no slot `actions` do shell; a área funcional entra no slot padrão do template, e seções informativas em `content`. O breadcrumb e o patrocínio ficam com o template. Gere o JSON-LD com `jsonLdGraph([softwareApplication(...), breadcrumbList(toolBreadcrumbItems(tool, locale, heading))])`, usando a mesma lista do breadcrumb visual. Traduza interface, erros e anúncios para en, pt-BR e es, e mantenha processamento de arquivos no cliente. Componentes visuais reutilizáveis pertencem ao design system; lógica de domínio não pertence às páginas Astro.

## 4. SEO e catálogo

Forneça title, description, um H1, canonical autorreferente, hreflang recíproco e JSON-LD verdadeiro. O catálogo tipado decide o status público; ferramentas `planned` não recebem URL operacional.

## 5. Validar

Execute `npm run verify` na raiz. Antes da extração para repositório próprio, `npm run build:pages` precisa montar a ferramenta em `/<slug>/` e `validate:pages` precisa confirmar assets, links, canonical e sitemap.
