import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Procura e carrega com segurança a chave GITHUB_ACCESS_TOKEN
 * em múltiplas origens sem expor segredos no stdout.
 */
function resolveGitHubToken() {
  if (process.env.GITHUB_ACCESS_TOKEN && process.env.GITHUB_ACCESS_TOKEN.trim().length > 0) {
    return process.env.GITHUB_ACCESS_TOKEN.trim();
  }

  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', '..', '.env'),
    path.join(os.homedir(), 'Documents', 'labs', 'tolvira', '.env'),
    path.join(os.homedir(), '.env')
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed.startsWith('GITHUB_ACCESS_TOKEN=')) {
            let token = trimmed.substring('GITHUB_ACCESS_TOKEN='.length).trim();
            if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
              token = token.slice(1, -1);
            }
            if (token.length > 0) {
              return token;
            }
          }
        }
      } catch (err) {
        // Ignora falhas de leitura silenciosamente
      }
    }
  }

  throw new Error(
    'ERRO CRÍTICO: GITHUB_ACCESS_TOKEN não encontrado nas variáveis de ambiente nem em arquivos .env conhecidos.'
  );
}

const token = resolveGitHubToken();

export const DEFAULT_REPO = 'tolvira/tolvira';

/**
 * Cliente HTTP para a API REST do GitHub v3/v4.
 *
 * @param {string} endpoint - Caminho relativo (ex: '/repos/tolvira/tolvira/issues') ou URL absoluta
 * @param {RequestInit} [options={}] - Opções do fetch
 * @returns {Promise<any>} Dados JSON ou null se 204
 */
export async function ghApi(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Tolvira-AI-Automation-Agent',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const res = await fetch(url, { ...options, headers });

    if (res.status === 429 || (res.status === 403 && res.headers.get('retry-after'))) {
      const waitTime = parseInt(res.headers.get('retry-after') || '2', 10) * 1000;
      console.warn(`[GitHub API] Rate limit atingido. Aguardando ${waitTime}ms para retry (tentativa ${attempt}/${maxRetries})...`);
      await new Promise(r => setTimeout(r, waitTime));
      continue;
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GitHub API error ${res.status} ${res.statusText} em ${endpoint}: ${errorText}`);
    }

    if (res.status === 204) {
      return null;
    }

    return await res.json();
  }

  throw new Error(`Excedido o número de tentativas (${maxRetries}) para o endpoint: ${endpoint}`);
}
