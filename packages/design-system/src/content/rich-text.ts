export type RichTextPart =
  | { readonly type: 'text'; readonly value: string }
  | { readonly type: 'strong'; readonly value: string }
  | { readonly type: 'code'; readonly value: string };

const MARKUP = /\*\*([^*]+)\*\*|`([^`]+)`/g;

export function fillPlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/\{([A-Za-z]+)\}/g, (_, key: string) => values[key] ?? '');
}

/** Interpreta **destaque** e `rótulo de ação` em mensagens i18n confiáveis. */
export function parseRichText(text: string): readonly RichTextPart[] {
  const parts: RichTextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MARKUP)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: 'text', value: text.slice(cursor, index) });
    if (match[1] !== undefined) parts.push({ type: 'strong', value: match[1] });
    else if (match[2] !== undefined) parts.push({ type: 'code', value: match[2] });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push({ type: 'text', value: text.slice(cursor) });
  if (parts.length === 0) parts.push({ type: 'text', value: text });
  return parts;
}
