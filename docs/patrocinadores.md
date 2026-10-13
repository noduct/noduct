# Operação de patrocinadores

## Estado e finalidade

O modo `prelaunch` impede apresentar cobrança como ativa antes da revisão de hospedagem e jurídica. O formato planejado custa US$ 10/mês por posicionamento, sem garantia de impressões, cliques ou conversões.

## Fluxo manual

1. Confirme disponibilidade e adequação do anunciante.
2. Receba somente nome público, texto curto e URL HTTPS.
3. Aprove criativo e envie o link oficial de assinatura configurado fora do código.
4. Confirme pagamento no PayPal; parâmetros de retorno não bastam.
5. Adicione registro em `src/data/sponsorships.ts` como `active`, com datas corretas.
6. Rode `npm run check:sponsors` e revise o build.

Para pausar, use `paused`; para encerramento, `expired` ou remova o registro. Atualizações de URL passam pela mesma revisão. A validação bloqueia anúncio ativo vencido, mas não verifica pagamento. Nunca versionar contatos privados, transações ou comprovantes.
