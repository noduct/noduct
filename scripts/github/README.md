# Automação do GitHub para agentes

`manage.mjs` é a interface única para o GitHub. Ela aceita qualquer repositório acessível pelo token, não contém números de issues, epics ou nomes de branches do Tolvira e responde em JSON no `stdout`. Mensagens de erro vão para o `stderr`.

## Preparação

Exporte um token de acesso de escopo mínimo antes de executar comandos. `GITHUB_TOKEN` é o nome preferido; `GH_TOKEN` e `GITHUB_ACCESS_TOKEN` continuam aceitos por compatibilidade. Como conveniência local, a CLI também lê somente o `.env` da raiz a partir da qual foi executada. Nunca registre o token, nem o grave em arquivos versionados.

O repositório vem de `--repo OWNER/REPOSITORY`, de `GITHUB_REPOSITORY` ou, por último, do remoto `origin` do Git. Para evitar ambiguidade entre projetos, agentes devem preferir `--repo`.

## Protocolo para agentes

1. Consulte primeiro o recurso relevante com `get` ou `list`.
2. Execute mutações sem `--execute` para obter e conferir o plano em JSON.
3. Repita exatamente o comando com `--execute` somente após a confirmação do alvo e do payload.
4. Informe a URL ou o número devolvido pela API. Não mostre nem persista credenciais.

O modo de simulação é o padrão para criar, atualizar, comentar, fechar, mesclar e apagar branches. Operações de leitura são executadas imediatamente.

## Recursos

```text
issue     get | list | create | update | close | comment
milestone get | list | create | update | close
branch    get | list | create | delete
pull      get | list | create | update | merge
push      <branch> [--remote <name>]
```

No GitHub, um epic é normalmente uma issue que recebe labels, milestone e referências às issues relacionadas. Portanto, use `issue get`, `issue create` e `issue update` para epics; não existe um recurso de epic específico nesta CLI.

Payloads de criação e atualização são JSON embutido ou arquivo JSON UTF-8. Exemplos:

```powershell
node scripts/github/manage.mjs issue update 42 '{"title":"Clarify PDF strategy","labels":["type:research"]}' --repo owner/repository
node scripts/github/manage.mjs issue update 42 .\issue-patch.json --repo owner/repository --execute
node scripts/github/manage.mjs branch create fix/pdf-parser --from main --repo owner/repository
node scripts/github/manage.mjs branch create fix/pdf-parser --from main --repo owner/repository --execute
```

Use `node scripts/github/manage.mjs --help` como referência compacta de argumentos e opções.

## Push autenticado

Use a própria CLI também para enviar commits. Ela aplica o token apenas à execução atual do Git e recusa remotos que não sejam HTTPS em `github.com`; nenhuma credencial é salva na configuração do Git ou impressa.

```powershell
npm run github -- push main
npm run github -- push main --execute
```

O primeiro comando apenas mostra o plano. O segundo realiza o push para `origin`; passe `--remote upstream` quando necessário.
