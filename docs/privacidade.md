# Privacidade e segurança operacional

## Estado real

O hub não recebe arquivos, não possui contas, formulário backend ou analytics. Preferências de tema, idioma, arte e movimento ficam no navegador. A hospedagem ainda pode produzir logs técnicos conforme suas políticas.

## Ferramentas

Cada ferramenta documenta fluxo de dados, dependências e persistência. “Processado localmente” só pode aparecer quando nenhum conteúdo é enviado. Conteúdo de arquivos jamais deve entrar em analytics ou logs.

O Local Workspace guarda documentos em IndexedDB na origem compartilhada das ferramentas, sem enviá-los ao servidor. Documentos temporários expiram após mais de 24 horas sem uso e são removidos na próxima abertura do workspace/drawer ou quando a aba volta ao primeiro plano. O usuário pode escolher “Manter neste dispositivo” para impedir a expiração automática; esse documento permanece até exclusão manual ou limpeza dos dados do navegador. Documentos em uso por outra aba não são removidos automaticamente.

## Evolução

Antes de analytics, avaliar base legal, consentimento, retenção e transferência internacional; atualizar política e controles. Antes do lançamento internacional, políticas exigem revisão jurídica. CSP deve ser configurada no provedor que ofereça headers; meta CSP é alternativa limitada para hosting puramente estático.
