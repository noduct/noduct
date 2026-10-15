# Proposta de apoio voluntário — Buy Me a Coffee

## Estado e objetivo

Proposta de produto e implementação, registrada em 15/10/2026. Nenhuma interface, conta externa, cobrança ou configuração de produção foi alterada. O responsável informou que já possui uma conta no Buy Me a Coffee; a URL pública e a identificação do beneficiário ainda precisam ser fornecidas para uma futura implementação.

Oferecer uma forma discreta de contribuir com o desenvolvimento da Tolvira, mantendo o acesso gratuito às ferramentas e preservando a visibilidade dos patrocínios. A contribuição é opcional e não compra publicidade, recursos, prioridade de processamento ou retirada de anúncios.

## Recomendação inicial

Adicionar uma frase curta com um link de apoio no rodapé do Hub, na coluna da marca, imediatamente depois da descrição existente. Esse ponto já pertence à identidade do projeto, fica após o conteúdo principal e mantém o convite afastado do `SponsorRail`.

O convite usa a superfície existente, tipografia secundária e link reconhecível. Não recebe cartão próprio, fundo amarelo da plataforma, destaque equivalente ao botão principal, animação ou posição fixa. Discrição significa baixa ênfase visual, com contraste AA e foco visível preservados.

| Decisão                   | Proposta para a primeira versão                       | Motivo                                                                                                      |
| ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Local                     | Coluna da marca no rodapé do Hub                      | Contexto institucional, após o conteúdo principal.                                                          |
| Formato                   | Uma frase e um link HTML                              | Funciona sem JavaScript e exige pouca atenção.                                                              |
| QR code                   | Ausente na primeira versão                            | Ocupa espaço e exige outra forma de interação; o link atende diretamente quem já está no site.              |
| Widget da plataforma      | Não incorporar                                        | O link externo atende ao objetivo sem carregamento de código ou interface de pagamento de terceiros no Hub. |
| Ferramentas independentes | Avaliar em uma segunda etapa, no rodapé compartilhado | Permite validar primeiro a hierarquia do Hub e depois versionar a integração no Design System.              |
| Frequência                | Um convite por página                                 | Evita repetição entre rodapé, resultado e anúncio.                                                          |

O convite pode aparecer nas páginas normais do Hub que já usam o rodapé. Não criar uma faixa no hero, no catálogo ou na barra de navegação. A primeira versão não precisa de uma página `/support/`; o link pode levar diretamente à página pública aprovada da conta.

O rodapé tem menor exposição, especialmente na página inicial longa. Essa é a troca aceita para manter o convite sutil. Se a descoberta for insuficiente, avaliar uma explicação curta na página About; nela, o rodapé deve omitir o convite repetido. Um pedido junto ao resultado de uma ferramenta teria mais contexto de gratidão, mas também concorreria com download e publicidade, por isso fica fora da proposta inicial.

## Mensagem sugerida

Interface pública em inglês, conforme as diretrizes do repositório:

> Finding Tolvira useful? Support its development.

Texto do link:

> Buy a coffee

Nome acessível do link: `Support Tolvira on Buy Me a Coffee (opens in a new tab)`.

A redação deve ser cordial, factual e sem cobrança emocional. Evitar urgência, metas financeiras, valores sugeridos no Hub e promessas de benefícios. A identificação pública no destino deve deixar claro quem recebe o apoio e sua relação com a Tolvira. Se a conta for pessoal, não apresentá-la como uma entidade ou equipe que não existe.

## Convivência com patrocinadores

O patrocínio continua sendo uma contratação manual de exposição em placement determinado. O apoio voluntário pertence à identidade do projeto e não integra `SponsorCampaign`, `Placement` ou `SponsorshipRegistry`.

- O convite permanece no rodapé, mesmo quando não houver campanha válida; não ocupa nem substitui um placement vazio.
- Não incluir o Buy Me a Coffee em `SponsorRail`, `SponsorCard` ou no espaço contratado de uma ferramenta.
- Manter nome, descrição, identificação e CTA do patrocinador com a apresentação definida pelo M3. A contribuição voluntária não altera seu tamanho, posição ou vigência.
- Nas ferramentas, preservar a sequência prevista: workspace e ações, placement patrocinado, conteúdo complementar e rodapé. Não inserir apoio entre o resultado e o download ou ao lado do CTA pago.
- Não vender exclusividade da página inteira quando o contrato oferecer apenas exclusividade do placement. A operação comercial deve informar que existe um convite institucional discreto no rodapé.
- Contribuições não publicam campanhas, não geram comprovantes de publicidade e não habilitam vantagens. Uma solicitação de anúncio continua no fluxo de `/sponsor/`.

Essa separação reduz a competição visual; sua eficácia deverá ser conferida no layout real. Não há evidência de conversão ou impacto comercial medido neste planejamento.

## Link e QR code

O link abre a página pública do Buy Me a Coffee em nova aba para preservar a navegação e, futuramente, o estado das ferramentas. Usar `target="_blank"`, `rel="noopener noreferrer"` e indicação acessível da abertura externa. A classificação `sponsored` permanece nos links de anúncios pagos; o convite de apoio não é uma publicidade contratada pelo provedor.

Não carregar imagens, fontes, scripts, iframe, preconnect ou widget do Buy Me a Coffee durante a visita. Com HTML e recursos locais, a integração não inicia uma conexão com o provedor antes de o usuário escolher o link. O processamento e as condições de pagamento pertencem à plataforma externa. Não enviar arquivos, resultados ou parâmetros com informações do usuário ao destino.

O Buy Me a Coffee documenta links públicos, botões, widgets e QR codes como formas de acesso à página do criador. O uso de link HTML próprio é uma escolha de design da Tolvira. [Formas de apoiar criadores](https://help.buymeacoffee.com/en/articles/7983531-ways-to-support-creators) e [guia de divulgação](https://help.buymeacoffee.com/en/articles/10206530-creative-ways-to-share-your-buy-me-a-coffee-page).

Se surgir necessidade concreta de passar do computador para o celular, uma segunda versão pode oferecer `Show QR code` em um elemento `details`, inicialmente fechado, com imagem estática local. O QR deve codificar a mesma URL pública do link, permitir acesso pelo link textual e preservar o contexto acessível. Em telas pequenas, o link continua sendo a ação principal. A dimensão de exibição deve ser definida após verificar a leitura real em dispositivos; não reduzir ou decorar o código a ponto de comprometer a leitura.

Nesse cenário, baixar o QR pelo painel oficial ou gerá-lo localmente a partir da URL revisada, conferir o destino decodificado e testar a leitura antes de publicar. Uma mudança de URL exige conferir novamente imagem e link. Não usar serviço remoto de geração no navegador, QR dinâmico com redirecionador ou payload de pagamento direto.

## Implementação futura

O primeiro incremento pode usar o rodapé existente em `src/components/layout/Footer.astro` e seu CSS Module. Manter a composição pequena, com tokens atuais; não há necessidade de criar um componente compartilhado antes de existir um segundo consumidor.

Proposta de configuração separada em `src/config/site.ts`:

```ts
support: {
  enabled: false,
  provider: 'buy-me-a-coffee',
  url: ''
}
```

Esse trecho é somente um contrato proposto, ainda não implementado. A configuração contém apenas informação pública. `enabled` deve ser independente de `sponsor.commercialMode`: ativar o apoio não ativa anúncios ou contratação, e uma campanha não ativa o apoio. A URL aprovada deve usar HTTPS, o host oficial exato `buymeacoffee.com` e o caminho público da conta, sem credenciais ou parâmetros de checkout. Validar com o parser de URL, sem aceitar domínios por correspondência parcial.

Renderizar somente quando a configuração estiver habilitada e a URL validada. Ausência ou erro de configuração resulta em ausência do convite, sem link vazio ou espaço reservado. O link é gerado no build; sua atualização exige novo deploy do consumidor. Ele não herda a atualização remota de campanhas prevista no M2.

Em uma segunda etapa, se aprovado para ferramentas independentes, extrair uma API pequena para `packages/design-system`, integrar ao `BrandFooter.astro` e lançar uma nova versão do pacote. Não alterar os contratos de campanhas nem criar um placement de apoio.

## Hospedagem e operação

A documentação atual do GitHub Pages restringe sites cuja finalidade principal seja facilitar transações comerciais e o uso para transações sensíveis. Ela não oferece, na página consultada, uma aprovação específica para esta integração. O apoio externo opcional deve ser avaliado no contexto de um projeto de ferramentas gratuitas, mantendo o checkout fora do Pages. Essa é uma consideração de implantação, não uma conclusão de que todo link de apoio seja proibido. [Limites do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

O gate de patrocínio comercial registrado no épico continua em vigor. A decisão sobre apoio voluntário deve ser registrada separadamente e não resolve a pendência sobre venda de publicidade. Este planejamento não ativa qualquer um dos fluxos.

A operação futura consiste em conferir a conta e seu perfil público, publicar apenas a URL aprovada e revisar periodicamente se o destino continua correto. Dados de pagamento, mensagens privadas, extratos e identidade de apoiadores permanecem fora do repositório e da aplicação. Não adicionar ranking de apoiadores, metas, telemetria ou confirmação automática de pagamento neste incremento.

Para retirar o convite, desabilitar a configuração e republicar os consumidores habilitados. A remoção não depende da disponibilidade do Buy Me a Coffee e não interfere no registry de campanhas.

## Plano de execução e aceite futuro

1. Receber a URL pública e conferir identificação do beneficiário e contexto da conta. Registrar a decisão de ativação para a hospedagem utilizada.
2. Implementar configuração e convite no rodapé do Hub, com estilo secundário e mensagem em inglês.
3. Verificar configuração ausente ou inválida, HTML sem JavaScript, teclado, foco, contraste, desktop e mobile. Conferir na rede que o provedor só é acessado por escolha do usuário.
4. Comparar as situações com e sem patrocinador usando fixtures de teste, preservando a hierarquia e as ações principais. Não publicar campanha real para essa verificação.
5. Se houver interesse em ferramentas independentes, definir a API do rodapé compartilhado e realizar uma atualização versionada. Avaliar QR code somente depois de identificar a necessidade.

O aceite exige convite único e discreto, patrocínio preservado, ferramentas plenamente funcionais, destino externo correto e ausência de coleta de dados pela integração da Tolvira. Métricas de conversão não são requisito; o critério inicial é clareza, acessibilidade e baixa interferência.

## Pendências

- URL pública da conta e identificação correta de quem recebe o apoio.
- Decisão futura de ativação na hospedagem utilizada.
- Avaliação visual da proposta quando houver implementação.

Não é necessário obter credenciais, acessar o painel da conta ou realizar um pagamento para preparar essa implementação.
