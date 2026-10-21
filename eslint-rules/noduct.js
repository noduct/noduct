import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { parseForESLint } from 'astro-eslint-parser';
import tsParser from '@typescript-eslint/parser';
import { guardrails } from '../guardrails.config.ts';

const root = process.cwd();
const normalized = (path) => path.replaceAll('\\', '/');

function hasAppShell(file, sourceOverride, seen = new Set(), isPage = true) {
  if (seen.has(file) || !file.endsWith('.astro')) return false;
  seen.add(file);
  let source;
  try {
    source = sourceOverride ?? readFileSync(file, 'utf8');
  } catch {
    return false;
  }
  let ast;
  try {
    ast = parseForESLint(source, { parser: tsParser }).ast;
  } catch {
    return false;
  }
  const imports = new Map();
  for (const statement of ast.body) {
    if (statement.type !== 'ImportDeclaration' || !statement.source?.value?.endsWith('.astro')) continue;
    for (const binding of statement.specifiers)
      if (binding.type === 'ImportDefaultSpecifier') imports.set(binding.local.name, statement.source.value);
  }
  const fragment = ast.body.find((statement) => statement.type === 'AstroFragment');
  const roots = fragment?.children.filter((child) =>
    child.type !== 'AstroHTMLComment' &&
    !(child.type === 'JSXText' && !child.value.trim()) &&
    !(child.type === 'JSXElement' && ['style', 'script'].includes(child.openingElement?.name?.name))
  ) ?? [];
  const rootElements = roots.map((node) => node.type === 'JSXElement'
    ? node
    : node.type === 'JSXExpressionContainer' && node.expression?.type === 'LogicalExpression' &&
      node.expression.operator === '&&' && node.expression.right?.type === 'JSXElement'
      ? node.expression.right : undefined);
  if (rootElements.length === 0 || rootElements.some((node) => !node)) return false;
  let forbidden = false;
  const visit = (node) => {
    if (node.type !== 'JSXElement') return;
    const name = node.openingElement?.name?.name?.toLowerCase();
    if (name === 'header' || name === 'footer') forbidden = true;
    if (name === 'nav' && node.openingElement.attributes?.some((attribute) =>
      attribute.name?.name === 'aria-label' && /breadcrumb/i.test(String(attribute.value?.value ?? ''))
    )) forbidden = true;
    for (const child of node.children ?? []) visit(child);
  };
  if (isPage) for (const element of rootElements) visit(element);
  if (forbidden) return false;
  const shellPath = createRequire(file).resolve('@noduct/design-system/shell/AppShell.astro');
  return rootElements.every((element) => {
    const specifier = imports.get(element.openingElement.name?.name);
    if (!specifier) return false;
    let target;
    try {
      target = specifier.startsWith('@/')
        ? resolve(root, 'src', specifier.slice(2))
        : createRequire(file).resolve(specifier);
    } catch {
      if (specifier.startsWith('.')) target = resolve(dirname(file), specifier);
    }
    return Boolean(target && (target === shellPath || hasAppShell(target, undefined, new Set(seen), false)));
  });
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
        if (!hasAppShell(context.filename, context.sourceCode.text)) context.report({ node, messageId: 'missing' });
      }
    };
  }
};

const visibleAttributes = new Set(['aria-label', 'aria-description', 'title', 'alt', 'placeholder', 'value']);
const clientTextProperties = new Set([
  'textContent',
  'innerText',
  'innerHTML',
  'ariaLabel',
  'title',
  'alt',
  'placeholder'
]);
function textLiteral(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0)
    return node.quasis.map((part) => part.value.cooked ?? part.value.raw).join('');
  return undefined;
}
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
      JSXText(node) {
        const value = node.value?.trim();
        if (!value || !/\p{L}/u.test(value) || guardrails.brandTexts.includes(value)) return;
        const parentName = node.parent?.openingElement?.name?.name;
        if (parentName === 'script' || parentName === 'style') return;
        context.report({ node, messageId: 'text' });
      },
      JSXExpressionContainer(node) {
        if (node.parent?.type !== 'JSXElement') return;
        const value = textLiteral(node.expression);
        if (value && /\p{L}/u.test(value) && !guardrails.brandTexts.includes(value))
          context.report({ node, messageId: 'text' });
      },
      JSXAttribute(node) {
        const name = node.name?.name;
        if (!visibleAttributes.has(name)) return;
        if (name === 'value' && node.parent?.name?.name !== 'button') return;
        const value = textLiteral(node.value?.type === 'JSXExpressionContainer' ? node.value.expression : node.value)?.trim();
        if (value && !guardrails.brandTexts.includes(value))
          context.report({ node, messageId: 'text' });
      },
      AssignmentExpression(node) {
        if (
          node.left?.type !== 'MemberExpression' ||
          node.left.computed ||
          !textLiteral(node.right)
        )
          return;
        if (!clientTextProperties.has(node.left.property?.name)) return;
        const value = textLiteral(node.right);
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
        const attributeName = textLiteral(attribute);
        const contentValue = textLiteral(content);
        if (!visibleAttributes.has(attributeName) || !contentValue) return;
        if (/\p{L}/u.test(contentValue) && !guardrails.brandTexts.includes(contentValue))
          context.report({ node, messageId: 'text' });
      }
    };
  }
};

export default {
  rules: { 'require-app-shell': requireAppShell, 'no-hardcoded-text': noHardcodedText }
};
