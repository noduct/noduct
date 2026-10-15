import type { APIRoute } from 'astro';
import { sponsorshipRegistry } from '../../../sponsorship';
import { projectPublicRegistry } from '../../features/sponsorship/registry';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(projectPublicRegistry(sponsorshipRegistry)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
