import { deployedTools } from './pages-manifest.ts';
console.log(
  JSON.stringify([
    '/',
    '/tools/',
    '/pdf-tools/',
    '/sponsor/',
    ...deployedTools().map((tool) => `/${tool.slug}/`)
  ])
);
