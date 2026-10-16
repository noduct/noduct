import type { APIRoute } from 'astro';
import { topology } from '@noduct/tool-runtime';
import { publishedTools } from '@/data/tools';

export const prerender = true;

/*
 * robots.txt só vale na raiz do host. Com o hub na raiz (ADR 0005), ele declara o sitemap do hub
 * e o sitemap próprio de cada ferramenta publicada — cada sitemap só lista URLs do seu diretório.
 */
export const GET: APIRoute = () => {
  const sitemaps = [
    topology.hubAssetUrl('sitemap-index.xml'),
    ...publishedTools.map((tool) => `${topology.toolUrl(tool.slug)}sitemap-index.xml`)
  ];
  const body = ['User-agent: *', 'Allow: /', '', ...sitemaps.map((url) => `Sitemap: ${url}`), ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
