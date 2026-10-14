import rawCatalog from '../src/data/tools.json' with { type: 'json' };
import ptBR from '../src/i18n/catalog/pt-BR.json' with { type: 'json' };
import es from '../src/i18n/catalog/es.json' with { type: 'json' };
import { messages } from '../src/i18n/messages.ts';
import { getLocalizedCategories } from '../src/data/categories.ts';

type Translation = { name: string; description: string; keywords: string[] };
const errors: string[] = [];
const ids = rawCatalog.map((tool) => tool.id).sort();

for (const [locale, catalog] of Object.entries({ 'pt-BR': ptBR, es }) as Array<[string, Record<string, Translation>]>) {
  const translatedIds = Object.keys(catalog).sort();
  for (const id of ids) {
    const item = catalog[id];
    if (!item) { errors.push(`${locale}: tradução ausente para ${id}`); continue; }
    if (!item.name.trim()) errors.push(`${locale}: nome vazio em ${id}`);
    if (!item.description.trim()) errors.push(`${locale}: descrição vazia em ${id}`);
    if (!item.keywords.length || item.keywords.some((keyword) => !keyword.trim())) errors.push(`${locale}: palavras-chave ausentes ou vazias em ${id}`);
  }
  for (const id of translatedIds) if (!ids.includes(id)) errors.push(`${locale}: tradução sem ferramenta correspondente: ${id}`);
}

const inspect = (value: unknown, path: string): void => {
  if (typeof value === 'string' && !value.trim()) errors.push(`mensagem vazia: ${path}`);
  else if (Array.isArray(value)) { if (!value.length) errors.push(`lista vazia: ${path}`); value.forEach((item, index) => inspect(item, `${path}.${index}`)); }
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) inspect(item, `${path}.${key}`);
};
for (const [locale, content] of Object.entries(messages)) inspect(content, locale);
for (const locale of ['en', 'pt-BR', 'es'] as const) {
  for (const category of getLocalizedCategories(locale)) {
    if (!category.name.trim() || !category.shortName.trim() || !category.description.trim()) errors.push(`${locale}: categoria incompleta: ${category.id}`);
  }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`i18n validation passed: ${ids.length} tools and all interface message contracts are complete in en, pt-BR and es.`);
