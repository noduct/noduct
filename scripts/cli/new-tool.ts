import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
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

/** AGENTS.md local de uma ferramenta gerada; o do template descreve a semente, não a ferramenta. */
export function toolAgentsMarkdown(slug: string): string {
  return [
    'Complementa [AGENTS.md](../../AGENTS.md).',
    '',
    `# Escopo local de packages/${slug}/`,
    `- Slug público: \`${slug}\`, declarado em \`src/config.ts\` com \`defineTool()\` e em \`noduct.slug\`.`,
    '- `src/pages/` só compõe `AppShell` e `ToolPage`; a interface fica em `src/components/` com CSS Module.',
    '- Regras de fluxo testáveis ficam em `src/lib/*.ts`, com o teste ao lado (`*.test.ts`).',
    '- Mensagens en, pt-BR e es em `src/i18n.ts`, inclusive script cliente, erros e nome do arquivo gerado.',
    '- Área Local só via `DropZone` e `DownloadCard` com `workspace` e `connectLocalWorkspace()`.',
    '- Siga o [guia de ferramenta](../../docs/criar-nova-ferramenta.md) como referência.',
    ''
  ].join('\n');
}

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
  const staging = mkdtempSync(join(root, 'packages', `.${slug}-`));
  const stagedTool = join(staging, 'tool');
  const originals = new Map<string, string>([
    [catalogPath, readFileSync(catalogPath, 'utf8')],
    ...translations.map(({ path }) => [path, readFileSync(path, 'utf8')] as const)
  ]);
  try {
    cpSync(join(root, 'packages/tool-template'), stagedTool, {
      recursive: true,
      filter: (path) =>
        !['node_modules', 'dist', '.astro'].some((segment) => path.split(/[\\/]/).includes(segment))
    });
    writeFileSync(join(stagedTool, 'AGENTS.md'), toolAgentsMarkdown(slug));
    const manifestPath = join(stagedTool, 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
    manifest.name = `@noduct/${slug}`;
    manifest.noduct = { slug };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    const configPath = join(stagedTool, 'src/config.ts');
    const config = readFileSync(configPath, 'utf8')
      .replace("slug: 'example-tool'", `slug: '${slug}'`)
      .replace("category: 'text-tools'", `category: '${category}'`);
    writeFileSync(configPath, config);
    const i18nPath = join(stagedTool, 'src/i18n.ts');
    writeFileSync(
      i18nPath,
      `import type { Locale } from '@noduct/tool-runtime';\n\n// TODO(i18n): Replace all placeholders with reviewed translations before publishing.\nexport const toolMessages = {\n  en: { name: '${humanize(slug)}', description: 'TODO(i18n): Describe the tool.', privacy: 'Processing happens in your browser.', toolTitle: '${humanize(slug)}', dropLabel: 'Choose a file', dropDescription: 'TODO(i18n): Describe accepted files.', useFile: 'Use this file', label: 'Input', placeholder: 'Enter input', process: 'Process', clear: 'Clear', empty: 'Enter input first.', downloadTitle: 'Your result is ready', resultFileName: 'result.txt', howTitle: 'How it works', how: ['Enter input.', 'Press {action}.', 'Review the result.'] },\n  'pt-BR': { name: 'TODO(i18n): ${humanize(slug)}', description: 'TODO(i18n): Descrição.', privacy: 'O processamento ocorre no navegador.', toolTitle: '${humanize(slug)}', dropLabel: 'Escolher arquivo', dropDescription: 'TODO(i18n): Descreva os arquivos aceitos.', useFile: 'Usar este arquivo', label: 'Entrada', placeholder: 'Informe os dados', process: 'Processar', clear: 'Limpar', empty: 'Informe os dados.', downloadTitle: 'Seu resultado está pronto', resultFileName: 'resultado.txt', howTitle: 'Como funciona', how: ['Informe os dados.', 'Toque em {action}.', 'Revise o resultado.'] },\n  es: { name: 'TODO(i18n): ${humanize(slug)}', description: 'TODO(i18n): Descripción.', privacy: 'El procesamiento ocurre en el navegador.', toolTitle: '${humanize(slug)}', dropLabel: 'Elegir archivo', dropDescription: 'TODO(i18n): Describe los archivos aceptados.', useFile: 'Usar este archivo', label: 'Entrada', placeholder: 'Introduce datos', process: 'Procesar', clear: 'Borrar', empty: 'Introduce datos.', downloadTitle: 'Tu resultado está listo', resultFileName: 'resultado.txt', howTitle: 'Cómo funciona', how: ['Introduce datos.', 'Pulsa {action}.', 'Revisa el resultado.'] }\n} satisfies Record<Locale, Record<string, string | string[]>>;\n`
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
    renameSync(stagedTool, target);
    return target;
  } catch (error) {
    for (const [path, content] of originals) writeFileSync(path, content);
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
    throw error;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

export function newTool(args: string[]): void {
  const [slug, flag, category] = args;
  if (!slug || flag !== '--category' || !category || args.length !== 3)
    throw new Error('Usage: npm run new:tool -- <slug> --category <id>');
  const target = generateTool(slug, category);
  run('npm', ['install']);
  console.log(
    `Created ${target}. Complete the i18n fields marked TODO(i18n); npm run check will fail until they are reviewed. Then run npm run dev -- ${slug} and npm run verify. See docs/criar-nova-ferramenta.md.`
  );
}
