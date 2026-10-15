# Contratos de patrocínio — v1

## Escopo e fontes de verdade

O marco M1 do épico de patrocínios estabelece contratos, configuração administrativa pública e regras de elegibilidade. No M2, os contratos passaram a residir em `packages/design-system/src/sponsorship/contracts.ts`, reexportados por `src/features/sponsorship/index.ts`; os tipos `SponsorCampaign`, `Placement` e `SponsorshipRegistry` são inferidos dos schemas Zod, evitando definições divergentes entre validação e TypeScript.

`sponsorship/campaigns.ts` é a fonte administrativa de campanhas e começa com uma lista vazia. `sponsorship/placements.ts` deriva os posicionamentos do catálogo tipado de ferramentas: cada ferramenta recebe o identificador `${tool.id}.primary`. Ferramentas `planned` têm posicionamento desabilitado. Como todas as ferramentas atuais estão planejadas, nenhum posicionamento começa habilitado.

`src/data/sponsorships.ts` permanece como adaptador para os consumidores existentes; não é uma segunda fonte administrativa. Os arquivos administrativos contêm somente dados públicos de criativos. Segredos, contatos privados, comprovantes, identificadores de transações e informações financeiras não pertencem ao registro.

## Estrutura do registro

`SponsorshipRegistry` contém exatamente `schemaVersion`, `placements` e `campaigns`. A versão aceita é o literal numérico `1`. Todos os objetos são estritos: propriedades desconhecidas são rejeitadas, inclusive em campanhas e posicionamentos.

Cada `Placement` contém:

| Campo     | Contrato                                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`      | Identificador no formato `slug.slot`, com até 80 caracteres.                                                                                             |
| `toolId`  | Identificador em kebab-case, com até 80 caracteres, correspondente à ferramenta no catálogo. O prefixo de `id` antes do ponto deve ser igual a `toolId`. |
| `enabled` | Booleano que habilita ou desabilita o posicionamento.                                                                                                    |

Cada `SponsorCampaign` contém:

| Campo            | Contrato                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | Identificador em kebab-case, com até 80 caracteres.                                                                                       |
| `placementId`    | Referência a um posicionamento, no formato `slug.slot`, com até 80 caracteres.                                                            |
| `sponsorName`    | Texto simples de 2 a 50 caracteres, sem espaços nas extremidades ou caracteres de controle.                                               |
| `description`    | Texto simples de 10 a 120 caracteres, sem espaços nas extremidades ou caracteres de controle.                                             |
| `destinationUrl` | URL HTTPS com até 2.048 caracteres, sem credenciais, caracteres de controle, espaços ou barras invertidas.                                |
| `logoUrl`        | Opcional. URL HTTPS cujo pathname é `/sponsorship/logos/[kebab].png` ou `/sponsorship/logos/[kebab].webp`, sem query string ou fragmento. |
| `status`         | Um de `pending`, `active`, `paused` ou `expired`.                                                                                         |
| `startsAt`       | Data ISO em UTC, terminada em `Z`, representando um instante válido e finito.                                                             |
| `expiresAt`      | Data ISO em UTC, terminada em `Z`, válida e estritamente posterior a `startsAt`.                                                          |

Nomes e descrições não aceitam marcação HTML. O contrato não oferece campos para HTML, CSS ou JavaScript personalizados, SVG ou inclusão de scripts externos. Um endereço de destino continua sujeito à revisão editorial: validação estrutural não comprova a legitimidade do anunciante.

## Integridade e elegibilidade

Os identificadores de campanhas são únicos, assim como os de posicionamentos. Cada ferramenta tem somente um posicionamento no registro v1. Toda campanha referencia um posicionamento conhecido.

Uma campanha só é elegível quando seu status é `active`, o posicionamento está habilitado e o instante de consulta satisfaz `startsAt <= now < expiresAt`. Portanto, o início é inclusivo e o término é exclusivo. Campanhas futuras, pausadas, pendentes ou encerradas não são exibidas. Uma campanha com status ainda `active` perde a elegibilidade ao atingir `expiresAt`, independentemente de uma edição administrativa posterior.

O registro rejeita períodos sobrepostos entre campanhas com status `active` no mesmo posicionamento. Períodos adjacentes são permitidos: uma campanha pode começar exatamente quando outra termina. A ausência de campanha elegível deve resultar em ausência de anúncio.

O estado `active` é uma decisão administrativa; os schemas não consultam PayPal nem validam pagamento. Essa confirmação pertence à operação manual descrita em [Operação de patrocinadores](patrocinadores.md).

## Evolução e limites do marco

A migração da base anterior torna `startsAt` e `expiresAt` obrigatórios e substitui identificadores informais por `tool-id.primary`. Não há campanhas existentes a migrar. Os imports legados continuam disponíveis como adaptadores, mas entradas antigas que não cumpram o contrato v1 são rejeitadas. A validação administrativa também sinaliza campanhas marcadas como `active` já vencidas; a elegibilidade em tempo de consulta sempre usa o intervalo UTC.

Mudanças incompatíveis no contrato exigem incremento de `schemaVersion` e uma estratégia explícita de migração. Consumidores devem rejeitar versões não suportadas; não devem reinterpretar silenciosamente um registro de outra versão.

O M1 valida a estrutura e as URLs de logos. Inspeção dos bytes, MIME real, tamanho de arquivo e dimensões de imagem pertence ao M5; uma extensão permitida não comprova esses atributos. A geração e distribuição do JSON estático, o carregamento remoto e a resolução no cliente são descritos no [M2](registry-patrocinio.md). O componente compartilhado pertence ao M3, e a página comercial e sua operação ao M4.

Os recursos comerciais continuam desativados enquanto a política de hospedagem não estiver confirmada. Este contrato não ativa cobrança, não publica campanhas reais e não cria páginas operacionais para ferramentas planejadas.
