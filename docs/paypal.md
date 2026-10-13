# PayPal

## Estratégia

O administrador deve verificar se PayPal Subscriptions está disponível para sua conta e região, criar um plano mensal oficial de US$ 10 e guardar o link gerado em configuração operacional segura. O repositório deixa `paypalSubscriptionUrl` vazio.

## Regras

URL de pagamento único não é assinatura. Não há tokens no frontend, confirmação por query string ou webhook sem backend verificável. O administrador confere início, renovação e cancelamento na conta PayPal antes de alterar o anúncio.

Se subscriptions não estiver disponível, use alternativa recorrente oficial oferecida pelo PayPal ou cobrança manual claramente descrita; nunca simule recorrência. Termos exibidos pelo PayPal prevalecem para cobrança e cancelamento. Revalidar documentação oficial antes da ativação.
