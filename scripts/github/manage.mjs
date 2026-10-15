import { ghApi, DEFAULT_REPO } from './client.mjs';
import fs from 'fs';
import path from 'path';

const [,, command, ...args] = process.argv;

function printUsage() {
  console.log(`
Uso do Gerenciador de Issues Tolvira:

  node scripts/github/manage.mjs publish <caminho-issues.json> [milestoneNumber]
    -> Publica uma lista de issues a partir de um JSON e gera registro com IDs criados.

  node scripts/github/manage.mjs update <issueNumber> <patchJsonOuArquivoMd>
    -> Atualiza o título, corpo ou labels de uma issue específica. Se o segundo argumento for um .md, atualiza o body.

  node scripts/github/manage.mjs close <issueNumber> [comentario]
    -> Fecha uma issue com estado 'completed', opcionalmente adicionando um comentário explicativo.

  node scripts/github/manage.mjs get <issueNumber>
    -> Retorna os detalhes em JSON da issue (título, labels, milestone, status, corpo).

  node scripts/github/manage.mjs list [milestoneNumber]
    -> Lista as issues abertas, opcionalmente filtrando por milestone.
`);
}

async function handlePublish(jsonFile, milestoneStr) {
  if (!jsonFile || !fs.existsSync(jsonFile)) {
    console.error(`Erro: Arquivo JSON não encontrado: ${jsonFile}`);
    process.exit(1);
  }

  const milestoneNumber = milestoneStr ? parseInt(milestoneStr, 10) : undefined;
  const issues = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

  console.log(`Iniciando publicação de ${issues.length} issues em ${DEFAULT_REPO}...`);
  const results = [];

  for (let i = 0; i < issues.length; i++) {
    const item = issues[i];
    console.log(`[${i + 1}/${issues.length}] Criando: ${item.title}`);

    const payload = {
      title: item.title,
      body: item.body,
      labels: item.labels || ['task', 'pdf'],
      ...(milestoneNumber ? { milestone: milestoneNumber } : (item.milestone ? { milestone: item.milestone } : {}))
    };

    const res = await ghApi(`/repos/${DEFAULT_REPO}/issues`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log(`   -> Criada com sucesso: #${res.number} (${res.html_url})`);
    results.push({
      key: item.key || `issue-${i + 1}`,
      number: res.number,
      title: item.title,
      url: res.html_url,
      milestone: payload.milestone
    });

    // Pausa preventiva para respeitar limites secundários da API
    await new Promise(r => setTimeout(r, 1200));
  }

  const logDir = path.resolve(process.cwd(), '.agents', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `published-${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log(`\nPublicação concluída! Registro salvo em: ${logFile}`);
}

async function handleUpdate(issueNumberStr, updateInput) {
  if (!issueNumberStr || !updateInput) {
    printUsage();
    process.exit(1);
  }

  const issueNumber = parseInt(issueNumberStr, 10);
  let payload = {};

  if (fs.existsSync(updateInput)) {
    const content = fs.readFileSync(updateInput, 'utf8');
    if (updateInput.endsWith('.json')) {
      payload = JSON.parse(content);
    } else {
      payload = { body: content };
    }
  } else {
    try {
      payload = JSON.parse(updateInput);
    } catch {
      payload = { body: updateInput };
    }
  }

  console.log(`Atualizando issue #${issueNumber} em ${DEFAULT_REPO}...`);
  const res = await ghApi(`/repos/${DEFAULT_REPO}/issues/${issueNumber}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  console.log(`Issue #${issueNumber} atualizada com sucesso! (${res.html_url})`);
}

async function handleClose(issueNumberStr, comment) {
  if (!issueNumberStr) {
    printUsage();
    process.exit(1);
  }

  const issueNumber = parseInt(issueNumberStr, 10);

  if (comment) {
    console.log(`Adicionando comentário de encerramento em #${issueNumber}...`);
    await ghApi(`/repos/${DEFAULT_REPO}/issues/${issueNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: comment })
    });
  }

  console.log(`Fechando issue #${issueNumber}...`);
  const res = await ghApi(`/repos/${DEFAULT_REPO}/issues/${issueNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ state: 'closed', state_reason: 'completed' })
  });

  console.log(`Issue #${issueNumber} fechada com sucesso! (${res.html_url})`);
}

async function handleGet(issueNumberStr) {
  if (!issueNumberStr) {
    printUsage();
    process.exit(1);
  }

  const issueNumber = parseInt(issueNumberStr, 10);
  const issue = await ghApi(`/repos/${DEFAULT_REPO}/issues/${issueNumber}`);

  console.log(JSON.stringify({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    milestone: issue.milestone ? { number: issue.milestone.number, title: issue.milestone.title } : null,
    labels: issue.labels.map(l => l.name),
    url: issue.html_url,
    body: issue.body
  }, null, 2));
}

async function handleList(milestoneStr) {
  const milestoneParam = milestoneStr ? `&milestone=${milestoneStr}` : '';
  const issues = await ghApi(`/repos/${DEFAULT_REPO}/issues?state=open&per_page=100${milestoneParam}`);

  console.log(`Issues encontradas (${issues.length}):`);
  for (const item of issues) {
    const ms = item.milestone ? `[${item.milestone.title}]` : '[Sem marco]';
    console.log(`- #${item.number} ${ms} ${item.title}`);
  }
}

async function main() {
  switch (command) {
    case 'publish':
      await handlePublish(args[0], args[1]);
      break;
    case 'update':
      await handleUpdate(args[0], args[1]);
      break;
    case 'close':
      await handleClose(args[0], args[1]);
      break;
    case 'get':
      await handleGet(args[0]);
      break;
    case 'list':
      await handleList(args[0]);
      break;
    default:
      printUsage();
      break;
  }
}

main().catch(err => {
  console.error('Erro na execução do comando:', err.message);
  process.exit(1);
});
