# Componente de patrocínio — Design System 0.3.0

## API compartilhada

O Design System oferece `SponsorCard` e `SponsorshipSlot` para consumidores Astro. A versão do pacote é `0.3.0`; o manifesto mantém `schemaVersion: 1`. Os contratos de campanha e elegibilidade continuam em [Contratos de patrocínio](contratos-patrocinio.md), e a distribuição estática em [Registry de patrocínios](registry-patrocinio.md).

`SponsorCard({ campaign, locale })` recebe uma campanha pública e renderiza o cartão em HTML. `locale` aceita `en`, `pt-BR` ou `es`, com padrão `en`. O consumidor deve fornecer uma campanha já validada e elegível; a seleção de campanha pertence ao slot e aos auxiliares compartilhados.

O cartão também verifica schema, status e intervalo UTC antes da renderização. Sem JavaScript, uma campanha válida existe no HTML inicial; com JavaScript, o bootstrap oculta logos indisponíveis e remove o cartão ao vencer. Sem execução de JavaScript, a expiração após o carregamento requer uma nova navegação; para consultas remotas e controle de placement, usar o slot.

`SponsorshipSlot({ placementId, registry, registryUrl, enabled, locale })` integra seleção e ciclo de vida. `placementId` identifica o posicionamento; `registry` aceita um manifesto desconhecido a ser validado; `registryUrl` permite consultar o manifesto remoto. `enabled` começa como `false`, de modo que importar o componente não ativa publicidade. `locale` tem o mesmo contrato do cartão.

Sem campanha válida e elegível, não há anúncio nem espaço permanente reservado para um cartão. O slot pode manter um template inerte para montagem posterior; seu conteúdo não constitui um anúncio renderizado. As campanhas reais permanecem vazias e os posicionamentos de ferramentas planejadas desabilitados. A implementação do componente não libera a operação comercial.

`CardMarkup.astro` é um detalhe privado, compartilhado pela renderização inicial e pelo template usado no navegador. Seu markup não contém scripts. A integração utiliza o cliente nativo do M2 e um bootstrap central, sem framework de interface ou hidratação de uma árvore de componentes.

Cada placement é composto uma única vez por página. O slot registra essa associação no contexto de renderização Astro para impedir duplicação inclusive no HTML sem JavaScript; o bootstrap também protege contra montagem duplicada no navegador. O primeiro slot daquele placement é preservado.

## Conteúdo, acessibilidade e falhas

O cartão usa um `aside` com nome acessível de conteúdo patrocinado, identificação visível de patrocínio, nome, descrição e uma única chamada para visitar o patrocinador. O link abre em outra aba, informa esse comportamento a leitores de tela e inclui `rel="sponsored noopener noreferrer"`.

O logo é opcional e decorativo: tem texto alternativo vazio, dimensões explícitas e carregamento preguiçoso. Uma falha da imagem oculta somente o logo, preservando nome, descrição e link. O cartão não aceita HTML, CSS ou JavaScript fornecido pelo anunciante. Textos usam nós de texto e os links dependem da validação HTTPS do contrato.

A chamada para ação tem área mínima de 44 pixels e foco visível com contorno sólido. O cartão usa os tokens de superfície, borda, texto e foco do tema; não depende de transparência para indicar foco. Sua apresentação não adiciona animações e atende à preferência de redução de movimento sem transições adicionais.

Status, posicionamento habilitado e período UTC controlam a elegibilidade. Ao atingir `expiresAt`, a campanha é removida; não há substituição por criativo vencido. Falhas de requisição ou validação também deixam o slot vazio, conforme o contrato do cliente.

## Posição e estabilidade de layout

O posicionamento fica abaixo da área principal de trabalho da ferramenta e antes do conteúdo complementar. Ele não cobre controles nem acompanha a rolagem. A altura do cartão é de 96 pixels no desktop e 120 pixels abaixo de 600 pixels, definida por tokens compartilhados. Nome e descrição longos, inclusive palavras sem espaços, quebram dentro da largura disponível; a descrição fica limitada a duas linhas.

Trocas de campanha dentro de um cartão existente preservam sua altura e a posição das ações principais da ferramenta. A ausência de campanha não mantém um bloco vazio. Por isso, inserir ou remover o cartão pode deslocar conteúdo complementar; não há promessa de CLS zero em todas as transições.

A primeira campanha válida recebida remotamente é exibida automaticamente, sem depender de rolagem ou redimensionamento. Sua inserção ocorre em fluxo normal após as ações principais; essas ações mantêm posição e foco. Conteúdo complementar pode mudar de posição quando o cartão surge ou desaparece, como consequência desse estado dinâmico, sem sobreposição ou animação. Atualizações de um cartão existente preservam sua altura e não introduzem esse reposicionamento.

## Integração e verificação

Consumidores devem importar os componentes do pacote compartilhado e carregar seus tokens globais. Personalizações globais de tamanho, espaçamento e cor partem dos tokens, incluindo `--sponsor-height-desktop`, `--sponsor-height-mobile`, `--sponsor-logo-size` e a escala `--space-*`. Os estilos internos permanecem em CSS Modules.

```astro
---
import SponsorshipSlot from '@noduct/design-system/components/SponsorshipSlot.astro';
import { topology } from '@noduct/tool-runtime';
---

<section><!-- Workspace and primary actions --></section>
<SponsorshipSlot
  placementId="merge-pdf.primary"
  registryUrl={topology.registryUrl}
  enabled={false}
/>
<section><!-- Complementary information --></section>
```

Esse exemplo mantém a exibição desabilitada. O template de ferramenta já compõe o slot nessa posição, com `sponsorshipEnabled: false`. A ativação depende de posicionamento conhecido e habilitado, campanha aprovada e decisão comercial separada. A integração real publicada continua no M6.

O adaptador antigo `SponsoredPlacement.astro` foi removido na versão 0.5.0. Use `SponsorCard` ou `SponsorshipSlot` com contratos v1 completos. O criativo antigo sem datas (`name`, `description`, `url`) não é aceito.

A verificação do marco cobre estados válidos e vazios, atualização remota, expiração, falhas de rede e logo, teclado, temas, telas estreitas e deslocamento das ações principais. Fixtures sintéticas não representam ativação de uma campanha ou integração comercial com uma ferramenta publicada.
