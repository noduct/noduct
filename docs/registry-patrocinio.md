# Registry estático de patrocínios — v1

## Arquitetura e distribuição

O Hub mantém a configuração administrativa pública em `sponsorship/` e publica um manifesto JSON durante sua geração estática. A rota Astro `src/pages/data/sponsorships.json.ts` disponibiliza `/data/sponsorships.json` na origem única. Consumidores recebem o endereço por `topology.registryUrl`; não escrevem origem ou base manualmente. Durante a transição, `assemble-pages.ts` também copia o manifesto para o stub legado. O endpoint é um arquivo estático e não depende de processo de servidor em execução. [Documentação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Os contratos canônicos ficam em `packages/design-system/src/sponsorship/contracts.ts`. O Hub os reexporta em `src/features/sponsorship/index.ts`; consumidores independentes importam o subpath `@noduct/design-system/sponsorship`. Isso mantém a interpretação de `schemaVersion: 1`, campanhas, posicionamentos e intervalos de elegibilidade compartilhada entre produtor e consumidores.

`projectPublicRegistry(input, now)` em `src/features/sponsorship/registry.ts` projeta somente os campos públicos permitidos e valida o resultado contra o contrato estrito. Campos administrativos adicionais não são propagados ao JSON. O manifesto contém exatamente `schemaVersion`, `placements` e `campaigns`; cada item também segue uma lista explícita de campos públicos.

A projeção exclui campanhas cujo status não seja `active` e campanhas que já atingiram `expiresAt`. Campanhas ativas com início futuro permanecem no manifesto para permitir agendamento sem outro deploy. O consumidor ainda precisa verificar `startsAt`, `expiresAt` e `enabled` em tempo de consulta. Publicar uma campanha no manifesto não significa que ela esteja elegível naquele instante.

As campanhas administrativas atuais estão vazias. Todos os posicionamentos atuais permanecem desabilitados porque as ferramentas estão `planned`. O endpoint não ativa recursos comerciais nem cria anúncios de produção.

## Cliente independente

O Design System exporta os schemas, os auxiliares de elegibilidade, `resolveCampaign` e `createSponsorshipClient` pelo subpath de patrocínios. O cliente recebe `registryUrl`, `placementId` e `onChange`, oferece `start()`, `stop()` e `refresh()`, e permite configurar `refreshIntervalMs` e `timeoutMs`. Os padrões são atualização a cada 60 segundos e limite de 3 segundos por requisição. As dependências de fetch e relógio podem ser injetadas para verificação determinística.

`resolveCampaign` valida o manifesto e seleciona somente uma campanha elegível para o posicionamento solicitado. Um posicionamento inexistente ou desabilitado, uma versão não suportada, um manifesto inválido ou a ausência de campanha elegível resulta em ausência de anúncio. As regras completas de dados e datas estão em [Contratos de patrocínio](contratos-patrocinio.md).

O cliente usa fetch nativo com `cache: 'no-cache'`, `mode: 'cors'`, `credentials: 'omit'`, `redirect: 'error'` e `referrerPolicy: 'no-referrer'`. O limite de resposta é 256 KiB. O prazo de requisição cobre o recebimento do corpo inteiro, para que um corpo lento não mantenha um anúncio indefinidamente.

Falhas de rede, timeout, resposta HTTP inadequada, JSON inválido ou contrato rejeitado removem o anúncio. O cliente não persiste o manifesto em armazenamento local. A expiração local da campanha independe do próximo intervalo de atualização: o anúncio deixa de ser elegível exatamente no limite `expiresAt`, sujeito à execução dos timers pelo navegador. A atualização periódica permite acompanhar alterações no Hub e novos períodos programados.

O consumidor deve aplicar o estado informado por `onChange` para exibir ou remover seu anúncio, chamar `start()` ao iniciar e `stop()` ao desmontar a integração. `start()` dispara uma consulta imediata; `refresh()` só consulta enquanto o cliente está iniciado. `stop()` cancela requisições e timers e informa ausência de anúncio. A falha de carregamento do logo deve ocultar somente a imagem, preservando texto e link; `bindSponsorLogoFallback` oferece esse comportamento. Não substitua uma campanha inválida por conteúdo antigo ou por um criativo arbitrário.

O relógio usado é o do navegador. Ele permite avaliar agendamento e expiração para a interface; não oferece prova de pagamento, contabilização comercial ou proteção contra fraude. Timers também podem ser adiados quando uma aba está suspensa.

## Cache, CORS e limites operacionais

`cache: 'no-cache'` solicita revalidação do cache HTTP. Quando há uma entrada, mesmo ainda válida, o navegador envia uma requisição condicional e pode reutilizar o corpo se o servidor confirmar que ele não mudou. [Referência de `Request.cache` da MDN](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache). Isso não garante invalidação instantânea de caches intermediários ou de uma CDN. Cabeçalhos da hospedagem, respostas condicionais e políticas do navegador continuam influenciando a atualização. Não use um arquivo estático `_headers` como se ele configurasse cabeçalhos do GitHub Pages.

Antes de integrar uma ferramenta hospedada em outra origem, verifique os cabeçalhos CORS reais do endpoint publicado e faça uma requisição no navegador a partir da origem consumidora. A presença de `mode: 'cors'` no cliente não concede autorização no servidor. O endpoint deve responder com uma política compatível para que o navegador entregue o JSON; essa compatibilidade não é presumida pela implementação.

Na verificação operacional de 15/10/2026, o project site anterior retornou `Access-Control-Allow-Origin: *`, `Cache-Control: max-age=600`, `ETag` e `Last-Modified`. Essa observação se referia somente à raiz HTML antiga. Os cabeçalhos de `/data/sponsorships.json` precisam ser verificados após o rename e o primeiro deploy; uma resposta histórica não estabelece garantia permanente da hospedagem.

Uma pausa ou revogação administrativa exige publicar o manifesto atualizado no Hub. A remoção nos consumidores depende da próxima atualização e da visibilidade da nova resposta através dos caches. Não há garantia de revogação instantânea. A expiração já recebida no manifesto é aplicada localmente e não depende de uma nova resposta da hospedagem.

## Publicação e verificação

Para atualizar campanhas, revise os dados públicos em `sponsorship/campaigns.ts`, os posicionamentos derivados do catálogo e o resultado de `npm run check -- sponsors`. A pipeline deve validar o manifesto completo antes da publicação. O build gera o endpoint; as verificações de navegador com Playwright confirmam que a rota entrega JSON público válido.

Uma alteração de dados exige novo build e deploy somente do Hub. As ferramentas independentes consultam o endereço configurado e recebem a atualização sem recompilar seu próprio código. Uma mudança no código do cliente ou na versão de sua dependência exige novo build e deploy de cada consumidor afetado. Mudanças incompatíveis no manifesto exigem a evolução explícita de `schemaVersion` e a migração dos consumidores.

Um push para a branch contemplada pelo workflow de publicação pode disparar automaticamente o deploy existente do Hub. Essa publicação central é o mecanismo normal de distribuição das alterações administrativas; não equivale a um deploy das ferramentas consumidoras.

O marco M2 inclui uma fixture de consumidor independente sintético para verificar o protocolo e o comportamento do cliente. A integração com uma ferramenta independente real e publicada pertence ao M6. O componente visual compartilhado pertence ao M3, e a ativação comercial segue condicionada à confirmação da política de hospedagem. Não registre contatos privados, pagamentos, comprovantes ou segredos, mesmo que a projeção os exclua da saída pública.
