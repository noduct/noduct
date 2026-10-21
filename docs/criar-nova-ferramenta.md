# Criar uma nova ferramenta

## 1. Gerar

```bash
npm run new:tool -- <slug> --category <id>
```

Use um slug inglês em kebab-case e um ID de categoria de `CATEGORY_IDS`. O comando recusa slugs reservados, já usados no catálogo ou existentes em `packages/`, sem alterar arquivos. Ele copia `packages/tool-template`, declara `noduct.slug` no pacote, configura `defineTool()`, cria a entrada `planned` no catálogo e adiciona traduções iniciais.

O gerador executa `npm install` e `npm run check`. A checagem acusa `TODO(i18n)` até que textos de en, pt-BR e es sejam traduzidos e revisados. Substitua também a lógica demonstrativa do template pela funcionalidade real.

## 2. Implementar

Mantenha o slug em `src/config.ts` e no manifesto do pacote. Origem, base, canonical, hreflang, links do hub e registry vêm de `topology`. Use `AppShell` e `ToolPage` do design system, processamento local e mensagens honestas sobre privacidade. No slot `content`, o primeiro card é o guia da ferramenta (`ToolInfoCard` + i18n próprio); os outros dois são sempre `ToolSharedInfo` (limites do orçamento e privacidade compartilhados). O catálogo tipado decide o status público: enquanto `planned`, o hub não publica link operacional.

Ferramentas que recebem ou produzem arquivos seguem a [Área de Trabalho Local híbrida](adr/0006-hybrid-local-workspace.md): declare os formatos aceitos pela ferramenta de maneira limpa em `src/config.ts` via `defineTool({ slug, category, accept, ... })` (ou use o default automático da categoria em `CATEGORY_DEFAULT_ACCEPT`), passe `accept={tool.accept}` para a `DropZone` com `workspace={{ confirmLabel }}`, configure o `DownloadCard` com `workspace={{ sourceTool: tool.slug }}` e ligue tudo no script com `connectLocalWorkspace(document, createWorkspaceServices({ loadWorkspace, loadRenderer }))`. Enquanto a página `/workspace/` aceita formatos livres, a `DropZone` e o `WorkspacePicker` dentro da ferramenta restringem a seleção apenas aos arquivos compatíveis com `tool.accept`. Arquivos das duas origens chegam pelo mesmo evento `noduct:files`. O template já demonstra o fluxo.

Forneça title, description, um H1, canonical autorreferente, hreflang recíproco e JSON-LD verdadeiro. Traduza interface, erros e anúncios para os três idiomas. Componentes visuais reutilizáveis pertencem ao design system; páginas Astro apenas compõem a ferramenta.

## 3. Validar

```bash
npm run verify
```

O `build` descobre o pacote automaticamente pelo campo `noduct.slug`, monta `/<slug>/` em `dist-pages/` e o teste de paridade o inclui automaticamente quando o slug também consta no catálogo. `verify` valida contratos, páginas, SEO e Playwright sem recompilar ferramentas no E2E.

Antes de declarar pronto, confira o [Contrato de conformidade](../AGENTS.md#contrato-de-conformidade) e a skill [noduct-new-tool](../.agents/skills/noduct-new-tool/SKILL.md). A nova ferramenta recebe um `AGENTS.md` local gerado e `CLAUDE.md` somente como ponteiro, além de entrar na paridade por descoberta. Não acrescente scripts ou slugs ao manifesto raiz.
