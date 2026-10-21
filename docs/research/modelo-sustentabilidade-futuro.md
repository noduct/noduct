# Estudo Exploratório: Modelo de Sustentabilidade e Precificação Futura

> **Aviso:** Este documento registra um estudo exploratório e não-vinculante sobre a viabilidade econômica de um eventual backend para o Noduct. Não representa decisões fechadas de roadmap nem altera o contrato atual de execução 100% estática e client-side no navegador.

---

## 1. Princípios e Pilares Culturais Inegociáveis

1. **O plano Free não onera a infraestrutura:**  
   Como o plano gratuito roda 100% no hardware do usuário via WebAssembly e JavaScript no navegador, o projeto pode atender centenas de milhares de pessoas sem custos crescentes de servidores. Os usuários gratuitos funcionam como o principal motor orgânico de divulgação e recomendação da plataforma.
2. **Estudantes e Professores como defensores da marca:**  
   Oferecer um valor extremamente acessível (preço simbólico) estimula a adoção massiva em universidades e escolas técnicas. Esses usuários se tornam evangelizadores naturais que, ao ingressarem no mercado corporativo, demandam o Noduct em seus locais de trabalho.
3. **Preço que não machuca ninguém:**  
   Eliminar a sensação predatória de exploração típica de SaaS concorrentes. O usuário paga um valor justo, previsível e leve no bolso por capacidades reais de sincronização, conveniência multiplataforma e segurança.

---

## 2. Estrutura de Planos e Recursos Sugerida (Chancelada pelo Congresso Estratégico)

| Plano | Brasil (BRL) | EUA (USD) | Europa (EUR) | Escopo de Recursos e Posicionamento |
| :--- | :---: | :---: | :---: | :--- |
| **Noduct Free** | **R$ 0** | **$0** | **€0** | Processamento 100% local no navegador (`pdf-lib`/WASM). Ilimitado, sem marcas d'água, sem anúncios intrusivos e sem login obrigatório. Área de Trabalho Local (`IndexedDB`). |
| **Estudante & Professor** | **R$ 59,00 /ano**<br>*(ou R$ 8,90/mês)* | **$29.00 /ano**<br>*(ou $2.99/mês)* | **€25,00 /ano**<br>*(ou €2,70/mês)* | 15 GB de nuvem criptografada (E2EE), sincronização multiplataforma e cota mensal de até 100 páginas de OCR em nuvem (excedente roda localmente via browser). Validação por e-mail `.edu`. |
| **Noduct Pro** | **R$ 14,90 /mês**<br>*(ou R$ 119,00 /ano)* | **$4.99 /mês**<br>*(ou $45.00 /ano)* | **€4,50 /mês**<br>*(ou €42,00 /ano)* | 50 GB de nuvem Zero-Knowledge, cofre anti-perda da Área Local, processamento em lote rápido, links temporários com senha e cota mensal de 400 páginas de OCR em nuvem. |
| **Noduct Teams** | **R$ 24,90 /membro/mês**<br>*(ou R$ 229,00 /membro/ano)*| **$7.99 /membro/mês**<br>*(ou $75.00 /membro/ano)*| **€7,00 /membro/mês**<br>*(ou €68,00 /membro/ano)*| 100 GB por membro em pool coletivo da equipe, pastas criptografadas compartilhadas (*Shared Vaults*), histórico de versões de 90 dias, painel de administração e faturamento unificado. |

---

## 3. Deliberações do Congresso Estratégico (FinOps, CFO e Growth)

1. **Ajuste de Preço Internacional ($4.99 / €4,50 no Pro):**  
   Preços como $1.99 geram desconfiança de segurança ("Too cheap to be true") nos EUA e Europa, além de serem canibalizados pela taxa fixa do Stripe ($0.30 por transação). A faixa de $4.99 confere credibilidade de segurança e eleva a receita bruta em moeda forte para mais de R$ 25 por cliente estrangeiro.
2. **Priorização Absoluta do Plano Anual e PIX:**  
   Em planos de micro-tickets (R$ 6,90 a R$ 8,90), as taxas fixas e o risco de chargeback no cartão corroem a margem. Focar no plano anual (R$ 59 à vista) garante fluxo de caixa antecipado sem dívidas, reduz custos de emissão fiscal (1 nota por ano em vez de 12) e anula o churn involuntário. No Brasil, o PIX elimina chargebacks com taxa de centavos.
3. **Cotas Rígidas de OCR em Nuvem (Anti-Abuso de CPU):**  
   OCR não pode ser ilimitado nos servidores. Cada página de PDF escaneado consome de 2 a 4 segundos de CPU. O sistema estabelece cotas mensais de páginas nos servidores (100 págs para estudantes, 400 págs no Pro); acima da cota, o processamento reverte automaticamente para o browser do usuário (WASM, custo zero de nuvem) ou venda de pacotes adicionais.
4. **Cofre Blindado e Loops Virais:**  
   O valor central do Pro não é a "venda de gigabytes" (pois o usuário já tem Google Drive), mas a garantia anti-desastre (*"Nunca perca sua Área de Trabalho se o navegador limpar o cache"*) e a automação em lote. Links temporários carregam assinatura viral discreta do Noduct, alimentando a aquisição orgânica de novos usuários gratuitos.

---

## 3. Arquitetura de Custos de Infraestrutura (Estimativas 2026+)

A viabilidade de manter preços baixos com margens saudáveis decorre da arquitetura descentralizada (*client-first*):

* **Armazenamento de Objetos (Cloudflare R2 / Backblaze B2):**  
  $\approx$ R$ 0,08 por GB/mês, com taxa de saída de dados (*egress*) zerada. Um usuário médio Pro consome ~18 GB reais ($\approx$ R$ 1,44/mês em storage).
* **Servidores de API e Sincronização (VPS Hetzner / Fly.io):**  
  Como os arquivos pesados são transferidos diretamente do navegador para o storage de objetos via URLs assinadas (*Presigned URLs*), o servidor de aplicação atua apenas como despachante leve de metadados criptografados. Uma máquina de €15/mês atende milhares de usuários simultâneos.
* **Workers de Processamento Pesado (Compute Pool):**  
  Instâncias sob demanda para processar OCR de documentos extensos e conversões de formatos complexos em background. O custo computacional diluído varia entre R$ 0,60 e R$ 0,90 por usuário ativo/mês.
* **Intermediadores de Pagamento (Stripe / Lemon Squeezy / Asaas):**  
  Taxas de 3,99% a 5% + taxa fixa por transação. O incentivo ao plano anual reduz significativamente a incidência da taxa fixa sobre o faturamento.

---

## 4. Margens e Sustentabilidade Financeira

Mesmo no plano individual mais barato (Estudante a R$ 6,90/mês), a estrutura de custos unitária totaliza aproximadamente R$ 1,86/mês (taxa de gateway + storage + fração de servidor), assegurando **margem bruta superior a 70%**.

Nos planos anuais (R$ 59/ano para estudantes e R$ 99/ano para o Pro), a margem líquida se aproxima de **80%**, proporcionando fluxo de caixa antecipado para garantir a hospedagem e a sustentabilidade a longo prazo com baixo risco operacional.

