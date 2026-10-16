# Automação de Gestão de Issues no GitHub para Agentes de IA

Este documento registra o aprendizado operacional, os problemas técnicos enfrentados e as soluções padronizadas para publicação, atualização e encerramento automatizado de issues e épicos no ecossistema Noduct por agentes autônomos.

---

## 1. Dificuldades Encontradas no Ambiente e Diagnóstico

### 1.1 Localização e Resolução do Token de Autenticação (`.env`)
- **Problema:** O workspace inicial do agente (`orca/workspaces/noduct/sablefish` ou `kelpfish`) não continha o arquivo `.env`. O token de acesso estava presente no diretório global do usuário (`~/Documents/labs/noduct/.env`).
- **Risco:** Falha de autenticação imediata ou risco de vazamento se o token fosse exibido em stdout/logs.
- **Solução:** Implementação de busca hierárquica e silenciosa em `scripts/github/client.mjs`:
  1. `process.env.GITHUB_ACCESS_TOKEN`
  2. `./.env` (raiz do workspace)
  3. `../.env` e `../../.env`
  4. `~/Documents/labs/noduct/.env`
  5. `~/.env`
  O token é lido apenas na memória do processo Node.js e nunca impresso ou exposto em arquivos de versionamento (o `.env` permanece estritamente listado no `.gitignore`).

### 1.2 Ausência da CLI Oficial (`gh`) no Ambiente Windows
- **Problema:** O comando `gh` não estava instalado ou não constava no `PATH` do terminal.
- **Solução:** Não depender de binários instalados no sistema operacional. Utilizar Node.js nativo (v20+) com a API global `fetch()` diretamente contra `https://api.github.com`, usando a especificação REST oficial (`X-GitHub-Api-Version: 2022-11-28`).

### 1.3 Quoting e Expansão de Variáveis no PowerShell
- **Problema:** Ao invocar `powershell -Command "..."` com variáveis como `$p` ou `$env:VAR`, o PowerShell hospedeiro expandia os identificadores como strings vazias antes de repassar ao sub-processo, corrompendo scripts inline.
- **Solução:** Proibir o uso de `powershell -Command "..."` aninhado. Executar comandos diretamente no PowerShell ou utilizar scripts Node.js isolados (`.mjs`) que lidam com arquivos locais.

### 1.4 Limites Secundários de Taxa (Secondary Rate Limits) da API do GitHub
- **Problema:** Criar dezenas de issues em milissegundos dispara a proteção anti-abuso do GitHub (HTTP 403/429 com `retry-after`).
- **Solução:** Inserir throttle determinístico (espera de 1200ms a 1500ms entre criações de issues) e implementar tratamento de repetição com backoff exponencial respeitando o cabeçalho `retry-after`.

### 1.5 Concorrência de Ganchos de Ferramenta (`jsonhook`)
- **Problema:** Ganchos de pré e pós-execução do ambiente orca (`jsonhook__orca-status`) podem falhar intermitentemente se comandos pesados ou blocos de texto gigantescos forem enviados de uma única vez no canal de terminal.
- **Solução:** Salvar o conteúdo das issues em arquivos JSON/MD intermediários e processá-los via CLI em vez de concatenar payloads de dezenas de kilobytes em uma única linha de comando.

---

## 2. Ferramenta CLI Padronizada: `scripts/github/manage.mjs`

Para economizar contexto de tokens de IA e garantir idempotência, foi criado o utilitário `scripts/github/manage.mjs` suportado por `scripts/github/client.mjs`.

### Comandos Disponíveis

#### Publicar lote de issues a partir de um JSON:
\`\`\`bash
node scripts/github/manage.mjs publish caminho/para/issues.json [numeroDaMilestone]
\`\`\`
*Gera automaticamente um arquivo de log estruturado em `.agents/logs/published-<timestamp>.json` com os números e URLs de todas as issues criadas.*

#### Atualizar uma issue existente (título, corpo, labels):
\`\`\`bash
# Atualizar o corpo a partir de um arquivo Markdown:
node scripts/github/manage.mjs update 9 caminho/para/conteudo.md

# Ou atualizar via JSON com título e corpo:
node scripts/github/manage.mjs update 9 '{"title": "Novo Título", "body": "Novo conteúdo"}'
\`\`\`

#### Consultar uma issue (retorno em JSON):
\`\`\`bash
node scripts/github/manage.mjs get 9
\`\`\`

#### Fechar uma issue com motivo e comentário de encerramento:
\`\`\`bash
node scripts/github/manage.mjs close 9 "Concluído via PR #15 com todos os critérios de aceite validados."
\`\`\`

#### Listar issues abertas por marco:
\`\`\`bash
node scripts/github/manage.mjs list 2
\`\`\`

---

## 3. Diretrizes para Futuras Sessões de IA

1. **Nunca tente adivinhar ou expor o token:** Importe sempre `ghApi` de `scripts/github/client.mjs`, que resolve a credencial de forma segura e transparente.
2. **Separe dados de lógica:** Crie um arquivo temporário `.json` com as issues planejadas e use `manage.mjs publish` para criar o lote. Isso economiza milhares de tokens de contexto na conversa.
3. **Mantenha a rastreabilidade:** Após criar issues filhas, vincule-as imediatamente à Master Epic Issue (atualmente [#36](https://github.com/noduct/noduct/issues/36)) incluindo a linha final `**Épico:** #36`.
