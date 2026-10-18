import { readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { guardrails } from '../guardrails.config.ts';

const root = process.cwd();
const normalized = (path) => path.replaceAll('\\', '/');

function hasAppShell(file, seen = new Set()) {
  if (seen.has(file) || extname(file) !== '.astro') return false;
  seen.add(file);
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    return false;
  }
  if (
    /import\s+AppShell\s+from\s+['"]@noduct\/design-system\/shell\/AppShell\.astro['"]/.test(
      source
    ) &&
    /<AppShell\b/.test(source)
  )
    return true;
  const imports = source.matchAll(/import\s+\w+\s+from\s+['"]([^'"]+\.astro)['"]/g);
  for (const match of imports) {
    const specifier = match[1];
    if (!specifier) continue;
    let target;
    if (specifier.startsWith('@/')) target = resolve(root, 'src', specifier.slice(2));
    else if (specifier.startsWith('.')) target = resolve(dirname(file), specifier);
    else if (specifier.startsWith('@noduct/design-system/'))
      target = resolve(
        root,
        'packages/design-system',
        specifier.slice('@noduct/design-system/'.length)
      );
    if (target && hasAppShell(target, seen)) return true;
  }
  return false;
}

const requireAppShell = {
  meta: {
    type: 'problem',
    docs: { description: 'Require every page to compose AppShell' },
    schema: [],
    messages: {
      missing: 'Page must render AppShell directly or through an imported Astro component.'
    }
  },
  create(context) {
    return {
      Program(node) {
        if (!hasAppShell(context.filename)) context.report({ node, messageId: 'missing' });
      }
    };
  }
};

const visibleAttributes = new Set(['aria-label', 'title', 'alt', 'placeholder']);
const clientTextProperties = new Set([
  'textContent',
  'innerText',
  'ariaLabel',
  'title',
  'alt',
  'placeholder'
]);
const noHardcodedText = {
  meta: {
    type: 'problem',
    docs: { description: 'Keep visible UI text in locale messages' },
    schema: [],
    messages: { text: 'Visible text must come from localized messages, not a literal.' }
  },
  create(context) {
    const file = normalized(context.filename).replace(`${normalized(root)}/`, '');
    if (guardrails.hardcodedTextFiles.includes(file)) return {};
    return {
      Program(node) {
        // Astro exposes client <script> bodies as raw markup, outside the JS AST.
        const source = context.sourceCode.text;
        for (const script of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
          const body = script[1] ?? '';
          const bodyStart = (script.index ?? 0) + script[0].indexOf(body);
          const report = (match) => {
            const location = context.sourceCode.getLocFromIndex(bodyStart + (match.index ?? 0));
            context.report({ node, loc: { start: location, end: location }, messageId: 'text' });
          };
          const assignments =
            /\.(?:textContent|innerText|ariaLabel|title|alt|placeholder)\s*=\s*(['"])([^'"\r\n]+)\1/g;
          for (const match of body.matchAll(assignments)) {
            if (/\p{L}/u.test(match[2]) && !guardrails.brandTexts.includes(match[2])) report(match);
          }
          const attributes =
            /\.setAttribute\(\s*(['"])(aria-label|title|alt|placeholder)\1\s*,\s*(['"])([^'"\r\n]+)\3\s*\)/g;
          for (const match of body.matchAll(attributes)) {
            if (/\p{L}/u.test(match[4]) && !guardrails.brandTexts.includes(match[4])) report(match);
          }
        }
      },
      JSXText(node) {
        const value = node.value?.trim();
        if (!value || !/\p{L}/u.test(value) || guardrails.brandTexts.includes(value)) return;
        const parentName = node.parent?.openingElement?.name?.name;
        if (parentName === 'script' || parentName === 'style') return;
        context.report({ node, messageId: 'text' });
      },
      JSXAttribute(node) {
        const name = node.name?.name;
        if (!visibleAttributes.has(name) || node.value?.type !== 'Literal') return;
        const value = String(node.value.value ?? '').trim();
        if (value && !guardrails.brandTexts.includes(value))
          context.report({ node, messageId: 'text' });
      },
      AssignmentExpression(node) {
        if (
          node.left?.type !== 'MemberExpression' ||
          node.left.computed ||
          node.right?.type !== 'Literal'
        )
          return;
        if (!clientTextProperties.has(node.left.property?.name)) return;
        const value = node.right.value;
        if (
          typeof value === 'string' &&
          /\p{L}/u.test(value) &&
          !guardrails.brandTexts.includes(value)
        )
          context.report({ node, messageId: 'text' });
      },
      CallExpression(node) {
        if (
          node.callee?.type !== 'MemberExpression' ||
          node.callee.property?.name !== 'setAttribute'
        )
          return;
        const [attribute, content] = node.arguments ?? [];
        if (attribute?.type !== 'Literal' || content?.type !== 'Literal') return;
        if (!visibleAttributes.has(attribute.value) || typeof content.value !== 'string') return;
        if (/\p{L}/u.test(content.value) && !guardrails.brandTexts.includes(content.value))
          context.report({ node, messageId: 'text' });
      }
    };
  }
};

export default {
  rules: { 'require-app-shell': requireAppShell, 'no-hardcoded-text': noHardcodedText }
};
