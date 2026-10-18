# Criar uma nova ferramenta

## 1. Gerar

```bash
npm run new:tool -- <slug> --category <id>
```

Use um slug inglês em kebab-case e um ID de categoria de `CATEGORY_IDS`. O comando recusa slugs reservados, já usados no catálogo ou existentes em `packages/`, sem alterar arquivos. Ele copia `packages/tool-template`, declara `noduct.slug` no pacote, configura `defineTool()`, cria a entrada `planned` no catálogo e adiciona traduções iniciais.

O gerador executa `npm install` e `npm run check`. A checagem acusa `TODO(i18n)` até que textos de en, pt-BR e es sejam traduzidos e revisados. Substitua também a lógica demonstrativa do template pela funcionalidade real.

## 2. Implementar

Mantenha o slug em `src/config.ts` e no manifesto do pacote. Origem, base, canonical, hreflang, links do hub e registry vêm de `topology`. Use `AppShell` e `ToolPage` do design system, processamento local e mensagens honestas sobre privacidade. O catálogo tipado decide o status público: enquanto `planned`, o hub não publica link operacional.

Forneça title, description, um H1, canonical autorreferente, hreflang recíproco e JSON-LD verdadeiro. Traduza interface, erros e anúncios para os três idiomas. Componentes visuais reutilizáveis pertencem ao design system; páginas Astro apenas compõem a ferramenta.

## 3. Validar

```bash
npm run verify
```

O `build` descobre o pacote automaticamente pelo campo `noduct.slug`, monta `/<slug>/` em `dist-pages/` e o teste de paridade o inclui automaticamente quando o slug também consta no catálogo. `verify` valida contratos, páginas, SEO e Playwright sem recompilar ferramentas no E2E.
