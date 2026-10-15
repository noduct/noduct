# Operação de patrocinadores

## Estado e finalidade

O modo `prelaunch` impede apresentar cobrança como ativa antes da revisão de hospedagem e jurídica. O formato planejado custa US$ 10/mês por posicionamento, sem garantia de impressões, cliques ou conversões.

## Fluxo manual

1. Confirme disponibilidade e adequação do anunciante.
2. Receba somente nome público, texto curto e URL HTTPS.
3. Aprove criativo e envie o link oficial de assinatura configurado fora do código.
4. Confirme pagamento no PayPal; parâmetros de retorno não bastam.
5. Após a liberação comercial, adicione registro em `sponsorship/campaigns.ts` como `active`, com datas corretas e referência a um posicionamento habilitado de `sponsorship/placements.ts`.
6. Rode `npm run check:sponsors` e revise o build.

Para pausar, use `paused`; para encerramento, `expired` ou remova o registro. Atualizações de URL passam pela mesma revisão. A elegibilidade termina automaticamente em `expiresAt`, mesmo que o status ainda seja `active`. A validação estrutural não verifica pagamento. Nunca versionar contatos privados, transações ou comprovantes.

Os campos, as regras de datas, a exclusividade por posicionamento e os limites de validação estão em [Contratos de patrocínio — v1](contratos-patrocinio.md). `src/data/sponsorships.ts` é somente um adaptador para consumidores existentes. As campanhas começam vazias e posicionamentos de ferramentas `planned` permanecem desabilitados.

## Apoio voluntário ao projeto

O [apoio via Buy Me a Coffee](apoio-voluntario.md), incorporado pelo PR #8, apresenta um convite discreto no rodapé, separado dos placements contratados. Uma contribuição não compra publicidade nem ativa campanhas. Sua ativação é independente e não libera o modo comercial de patrocínios.
