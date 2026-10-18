import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertToolSlug, isCategoryId } from '@noduct/tool-runtime';
import { rootDir } from '../pages-manifest.ts';
import { run } from './shared.ts';

type CatalogTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  status: string;
  keywords: string[];
  featured: boolean;
  visible: boolean;
};
const humanize = (slug: string): string =>
  slug
    .split('-')
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');

export function generateTool(slug: string, category: string, root = rootDir): string {
  assertToolSlug(slug);
  if (!isCategoryId(category)) throw new Error(`Unknown category: ${category}`);
  const target = join(root, 'packages', slug);
  const catalogPath = join(root, 'src/data/tools.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogTool[];
  if (existsSync(target) || catalog.some((item) => item.id === slug || item.slug === slug)) {
    throw new Error(`Tool ${slug} already exists in packages or catalog.`);
  }
  const translations = ['pt-BR', 'es'].map((locale) => {
    const path = join(root, 'src/i18n/catalog', `${locale}.json`);
    return { path, entries: JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown> };
  });
  for (const translation of translations) {
    if (slug in translation.entries)
      throw new Error(`Tool ${slug} already exists in ${translation.path}.`);
  }
  cpSync(join(root, 'packages/tool-template'), target, {
    recursive: true,
    filter: (path) =>
      !['node_modules', 'dist', '.astro'].some((segment) => path.split(/[\\/]/).includes(segment))
  });
  const manifestPath = join(target, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  manifest.name = `@noduct/${slug}`;
  manifest.noduct = { slug };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const configPath = join(target, 'src/config.ts');
  const config = readFileSync(configPath, 'utf8')
    .replace("slug: 'example-tool'", `slug: '${slug}'`)
    .replace("category: 'text-tools'", `category: '${category}'`);
  writeFileSync(configPath, config);
  const i18nPath = join(target, 'src/i18n.ts');
  writeFileSync(
    i18nPath,
    `import type { Locale } from '@noduct/tool-runtime';\n\n// TODO(i18n): Replace all placeholders with reviewed translations before publishing.\nexport const toolMessages = {\n  en: { name: '${humanize(slug)}', description: 'TODO(i18n): Describe the tool.', privacy: 'Processing happens in your browser.', toolTitle: '${humanize(slug)}', label: 'Input', placeholder: 'Enter input', process: 'Process', clear: 'Clear', empty: 'Enter input first.', howTitle: 'How it works', how: ['Enter input.', 'Process it.', 'Review the result.'], limitsTitle: 'Limitations', limits: 'TODO(i18n): Explain limitations.', relatedTitle: 'Related tools', related: 'Related links appear after publication.' },\n  'pt-BR': { name: 'TODO(i18n): ${humanize(slug)}', description: 'TODO(i18n): Descrição.', privacy: 'O processamento ocorre no navegador.', toolTitle: '${humanize(slug)}', label: 'Entrada', placeholder: 'Informe os dados', process: 'Processar', clear: 'Limpar', empty: 'Informe os dados.', howTitle: 'Como funciona', how: ['Informe os dados.', 'Processe.', 'Revise o resultado.'], limitsTitle: 'Limitações', limits: 'TODO(i18n): Explique os limites.', relatedTitle: 'Ferramentas relacionadas', related: 'Links aparecem após a publicação.' },\n  es: { name: 'TODO(i18n): ${humanize(slug)}', description: 'TODO(i18n): Descripción.', privacy: 'El procesamiento ocurre en el navegador.', toolTitle: '${humanize(slug)}', label: 'Entrada', placeholder: 'Introduce datos', process: 'Procesar', clear: 'Borrar', empty: 'Introduce datos.', howTitle: 'Cómo funciona', how: ['Introduce datos.', 'Procesa.', 'Revisa el resultado.'], limitsTitle: 'Limitaciones', limits: 'TODO(i18n): Explica los límites.', relatedTitle: 'Herramientas relacionadas', related: 'Los enlaces aparecen tras la publicación.' }\n} satisfies Record<Locale, Record<string, string | string[]>>;\n`
  );
  catalog.push({
    id: slug,
    slug,
    name: humanize(slug),
    description: 'TODO(i18n): Describe the tool.',
    categoryId: category,
    status: 'planned',
    keywords: [slug],
    featured: false,
    visible: true
  });
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  for (const translation of translations) {
    translation.entries[slug] = {
      name: `TODO(i18n): ${humanize(slug)}`,
      description: 'TODO(i18n): Translate description.',
      keywords: [slug]
    };
    writeFileSync(translation.path, JSON.stringify(translation.entries, null, 2) + '\n');
  }
  return target;
}

export function newTool(args: string[]): void {
  const [slug, flag, category] = args;
  if (!slug || flag !== '--category' || !category || args.length !== 3)
    throw new Error('Usage: npm run new:tool -- <slug> --category <id>');
  const target = generateTool(slug, category);
  console.log(
    `Created ${target}. Next: complete TODO(i18n), then npm run dev -- ${slug} and npm run verify. See docs/criar-nova-ferramenta.md.`
  );
  run('npm', ['install']);
  run('npm', ['run', 'check']);
}
