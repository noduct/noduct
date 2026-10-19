# Privacidade e segurança operacional

## Estado real

O hub não recebe arquivos, não possui contas, formulário backend ou analytics. Preferências de tema, idioma, arte e movimento ficam no navegador. A hospedagem ainda pode produzir logs técnicos conforme suas políticas.

## Ferramentas

Cada ferramenta documenta fluxo de dados, dependências e persistência. “Processado localmente” só pode aparecer quando nenhum conteúdo é enviado. Conteúdo de arquivos jamais deve entrar em analytics ou logs.

O Local Workspace guarda documentos em IndexedDB na origem compartilhada das ferramentas, sem enviá-los ao servidor ([ADR 0006](adr/0006-hybrid-local-workspace.md)). Nenhuma ferramenta grava resultados sem pedido: “Salvar na Área Local” e “Adicionar arquivos” criam documentos mantidos até exclusão manual ou limpeza dos dados do navegador. A home só lê o banco se ele já existir, sem criá-lo para quem nunca salvou nada. Miniaturas da primeira página são conteúdo derivado, ficam no mesmo IndexedDB e são apagadas com o documento. Documentos marcados como “Permitir expiração” (e cópias implícitas de transferência) expiram após mais de 24 horas sem uso e são removidos na próxima abertura de uma superfície do workspace ou quando a aba volta ao primeiro plano. Quando uma ferramenta mantém um documento aberto via `acquireDocument()`, o Web Lock compartilhado impede que a limpeza automática de outra aba o remova até `release()`; sem Web Locks, a limpeza automática não exclui documentos.

## Evolução

Antes de analytics, avaliar base legal, consentimento, retenção e transferência internacional; atualizar política e controles. Antes do lançamento internacional, políticas exigem revisão jurídica. CSP deve ser configurada no provedor que ofereça headers; meta CSP é alternativa limitada para hosting puramente estático.
