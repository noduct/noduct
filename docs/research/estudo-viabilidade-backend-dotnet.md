# Estudo Exploratório: Viabilidade Técnica e FinOps de C# (.NET) para o Backend Futuro

> **Aviso:** Este documento registra um estudo exploratório e não-vinculante avaliando a viabilidade técnica, operacional e financeira do uso de **C# (.NET 8 / .NET 9)** em um eventual backend e pool de processamento para o Noduct. O produto atual permanece estático, descentralizado e executado 100% client-side no navegador do usuário.

---

## 1. Contexto e Motivação

O projeto Noduct foi concebido com uma arquitetura estática no frontend (Astro + TypeScript). Para funcionalidades futuras exclusivas dos planos Pro e Teams (sincronização criptografada, histórico de versões, cofre de recuperação e OCR pesado em nuvem), faz-se necessária uma API de controle e um sistema de orquestração de tarefas assíncronas.

Este estudo reúne as análises conjuntas de especialistas em **Performance de Runtime**, **FinOps e Infraestrutura Linux** e **Arquitetura de Software e DX** para responder objetivamente:
1. *.NET no Linux mantém os custos enxutos calculados no modelo de sustentabilidade?*
2. *Qual é a pegada real de memória (RAM) e como o Garbage Collector se comporta em micro-containers?*
3. *Como fica a ergonomia entre um frontend em TypeScript e um backend em C#?*
4. *O ecossistema atende às integrações mandatórias (PostgreSQL, Redis, Cloudflare R2 e sanitizador Rust)?*

---

## 2. Parecer de Performance & Runtime (.NET 8 / .NET 9)

### 2.1. A Armadilha do Server GC em Containers Linux
O runtime do .NET tradicionalmente prioriza vazão (*throughput*) corporativa máxima em servidores dedicados com centenas de gigabytes de RAM. Por padrão, o *Server GC* aloca um heap independente por vCPU detectada no host.
* Em uma VPS compartilhada ou pod de 128MB–256MB, se o .NET detectar 4 ou 8 vCPUs no host, ele alocará 4 ou 8 heaps de GC, consumindo de 80 MB a 120 MB apenas para a infraestrutura do coletor, correndo o risco de ser finalizado pelo `OOM Killer` do Linux antes de executar uma coleta completa.

### 2.2. A Solução: Workstation GC e DATAS (.NET 9)
Configurando o runtime explicitamente para micro-containers, o comportamento de memória torna-se equivalente ao de stacks como Node.js (Fastify) e muito próximo ao de Go:

```dockerfile
# Configurações essenciais para containers Linux enxutos:
ENV DOTNET_gcServer=0                 # Ativa Workstation GC (1 heap único compartilhado)
ENV DOTNET_GCDynamicAdaptationMode=1  # Ativa DATAS (.NET 9: adaptação dinâmica de heap)
ENV DOTNET_GCHeapHardLimitPercent=75  # Força coleta do GC ao atingir 75% da RAM do container
```

* **Footprint Real em Execução (Minimal APIs / ASP.NET Kestrel):**
  * **Em repouso (Idle):** 40 MB a 65 MB de RAM (RSS).
  * **Sob carga de metadados (I/O intensivo):** 75 MB a 120 MB de RAM.
  * **Operação segura:** Roda com extrema estabilidade em pods de **256 MB**, com latência P99 sub-milissegundo para queries de metadados e assinaturas de URLs.

### 2.3. Native AOT (`PublishAot=true`) como Otimização Futura
* O .NET 8 e 9 oferecem compilação direta para binário nativo ELF (sem runtime JIT):
  * **Cold Start:** 15 ms a 25 ms.
  * **Consumo Base:** 15 MB a 30 MB de RAM.
  * **Tamanho de Imagem Docker:** 30 MB a 50 MB (usando base Chiseled/Distroless da Microsoft).
* **Diretriz de Adoção:** O Native AOT impõe restrições a código que usa reflexão dinâmica e exige *Source Generators* de JSON. Portanto, o projeto deve iniciar no modo **JIT convencional com Workstation GC** (zero atrito de bibliotecas) e tratar o Native AOT como uma otimização de segundo passo, caso se queira reduzir ainda mais a memória.

---

## 3. Parecer de FinOps e Infraestrutura Linux

### 3.1. Custo Real de VPS e Sizing Mínimo
Diferente da antiga era do Windows Server com licenças pagas, o .NET moderno é código aberto (MIT/Apache 2.0) e roda sobre Linux sem custos de licenciamento.

* **Máquina Recomendada de Entrada:** Hetzner Cloud **CX22** (2 vCPUs x86_64, 4 GB RAM, 40 GB NVMe, 20 TB de tráfego incluído):
  * Custo: **€ 3,79 a € 4,35 / mês (~R$ 24 a R$ 28 / mês)**.

### 3.2. Dimensionamento da Stack Completa em um Único Nó (4 GB RAM)

| Serviço / Processo | Consumo Médio de RAM | Função no Ecossistema |
| :--- | :---: | :--- |
| **Linux OS (Debian 12 minimal) + Docker** | ~250 MB | Sistema base e orquestração de containers |
| **PostgreSQL 16 (via Npgsql)** | ~400 MB a 500 MB | Dados transacionais de usuários, cotas, equipes e faturamento |
| **Redis 7 / Valkey** | ~50 MB a 80 MB | Rate limiting em Token Bucket, sessões e cache de cotas |
| **API ASP.NET Core (.NET 8/9)** | ~70 MB a 120 MB | Plano de controle, autenticação, pagamentos e Presigned URLs |
| **Reverse Proxy Caddy (SSL automático)** | ~30 MB | Terminação HTTPS e roteamento de tráfego |
| **Total em Operação** | **~900 MB a 1.250 MB** | **Sobram mais de 2,5 GB livres de RAM física** |

A memória excedente (~2,5 GB) é automaticamente aproveitada pelo kernel Linux como *page cache* para o PostgreSQL, garantindo leitura instantânea em disco NVMe com zero contenção de memória.

### 3.3. Balanço Financeiro Mensal Estimado

| Componente | Especificação | Custo Mensal Estimado |
| :--- | :--- | :--- |
| **Borda e CDN** | Cloudflare Pages (Frontend Astro) + WAF/DNS | **R$ 0,00** (Free Tier) |
| **Storage de Objetos** | Cloudflare R2 (100 GB a 500 GB, zero egress) | **~R$ 15,00 a R$ 45,00** |
| **VPS Principal (API + DB + Redis)** | Hetzner CX22 (2 vCPU, 4 GB RAM) | **~R$ 25,00** (€ 3,79) |
| **Backups Automatizados** | Snapshots Hetzner | **~R$ 5,00** |
| **Total Mensal da Infraestrutura** | **Cluster .NET completo em produção** | **R$ 45,00 a R$ 75,00 / mês** |

* **Teto Orçamentário Planejado:** R$ 200,00 a R$ 325,00 / mês.
* **Margem Financeira Restante:** **R$ 155,00 a R$ 250,00 / mês de folga líquida** no orçamento de infraestrutura.

---

## 4. Orquestração de Background Jobs (Hangfire vs. Alternativas)

Para o processamento de tarefas em segundo plano (disparo de OCR em workers isolados, expurgo de arquivos da quarentena após expiração e processamento de webhooks de pagamento):

### 4.1. Hangfire Community (100% Gratuito Comercial)
* O pacote `Hangfire.AspNetCore` com `Hangfire.PostgreSql` é distribuído sob licença LGPLv3 / permissiva, **sendo 100% gratuito para uso comercial em serviços proprietários**.
* Oferece dashboard web administrativo integrado com visão de filas, retentativas automáticas exponenciais (*backoff*) e auditoria de erros.
* O impacto do polling do Hangfire no PostgreSQL, com índices adequados e intervalo de 10 a 15 segundos, consome **menos de 1% da CPU** da máquina.
* **Nota FinOps:** A versão Hangfire Pro (que custa $495/ano) é voltada a batches complexos em grandes corporações e é **totalmente dispensável** para o modelo do Noduct.

### 4.2. Alternativas Ultraleves Nativas
Caso se queira evitar qualquer overhead de polling no banco de dados para tarefas instantâneas de alta frequência:
* **`System.Threading.Channels` (Nativo):** Filas em memória de altíssimo desempenho com controle de saturação (*backpressure*).
* **Coravel (MIT):** Agendador e disparador de filas declarativo e ultraleve para .NET.

---

## 5. Integração Frontend (Astro/TypeScript) e Nuvem (Cloudflare R2)

### 5.1. Alerta Crítico de Arquitetura: Cloudflare R2 e Presigned PUT
* **Restrição do R2:** O Cloudflare R2 **não suporta S3 POST Policies (HTML multipart form uploads)**.
* **Padrão Obrigatório:** A API C# deve gerar **Presigned `PUT` URLs** usando o `AWSSDK.S3` (ou helper enxuto com `HMACSHA256` nativo):
  ```csharp
  var presignedUrl = s3Client.GetPreSignedURL(new GetPreSignedUrlRequest
  {
      BucketName = "quarentena",
      Key = $"quarantine/{tenantId}/{jobId}.bin",
      Verb = HttpVerb.PUT,
      Expires = DateTime.UtcNow.AddMinutes(5)
  });
  ```
* No frontend Astro/TS, o upload do arquivo é realizado via `fetch(presignedUrl, { method: 'PUT', body: file })` com headers de CORS devidamente configurados no bucket.

### 5.2. Ponte de Tipos entre C# e TypeScript (Sem Duplicação de DTOs)
Para eliminar qualquer necessidade de reescrever interfaces e tipos manualmente no TypeScript:
1. O backend ASP.NET Core expõe a documentação OpenAPI gerada em compilação (`/openapi/v1.json`).
2. O frontend Astro adiciona a ferramenta `openapi-typescript` em seu `package.json`:
   ```bash
   npx openapi-typescript https://api.noduct.internal/openapi/v1.json -o ./src/api/schema.d.ts
   ```
3. Qualquer alteração de contrato ou novo campo no backend C# é refletida de forma imediata e tipada no frontend através do comando de build, quebrando o `npm run check` caso haja divergência de propriedades.

---

## 6. Integração com o Sanitizador de Entrada em Rust (CDR)

A diretriz de defesa em profundidade estabelece que arquivos enviados para tarefas pesadas devem passar por sanitização via **Content Disarm & Reconstruction (CDR)** antes de tocarem motores legados de OCR (Tesseract / Leptonica).
* O sanitizador é compilado como um binário estático ultraleve em **Rust** (`noduct-cdr`).
* A API C# ou o worker Hangfire invoca o binário através de processo isolado ou socket UNIX local:
  ```bash
  noduct-cdr --input /quarentena/job-123.bin --output /safe/job-123-clean.pdf --max-dim 8000
  ```
* Com tempo de execução entre 2 e 5 milissegundos e consumo inferior a 8 MB de RAM, o binário Rust retorna um código de saída 0 (seguro) ou rejeição com código de erro estruturado, garantindo que o C# atue estritamente como orquestrador.

---

## 7. Matriz Comparativa: C# vs. Node.js (Fastify) vs. Go

| Critério de Decisão | C# (.NET 8/9 JIT Tuning) | Node.js (Fastify + TS) | Go (Golang) |
| :--- | :---: | :---: | :---: |
| **Custo de Hospedagem (Hetzner)** | **R$ 25 - R$ 50/mês** | **R$ 25 - R$ 50/mês** | **R$ 25 - R$ 50/mês** |
| **Consumo Médio de RAM** | 70 MB a 120 MB | 65 MB a 130 MB | 20 MB a 40 MB |
| **Tempo de Inicialização (Cold)** | 400 ms a 800 ms *(JIT)*<br>15 ms a 25 ms *(AOT)* | 300 ms a 600 ms | 10 ms a 25 ms |
| **Segurança e Rigor de Tipos** | Alto (Roslyn + Nullable strict) | Médio (Fragilidade em runtime) | Alto (Tipagem estática nativa) |
| **Orquestração Assíncrona** | Alto (Hangfire nativo com UI) | Médio (Dependência de BullMQ/Redis) | Médio (Código boilerplate manual) |
| **Curva / Velocidade com Domínio C#** | **Velocidade máxima (2x a 3x)** | Baixa (JS Fatigue / fragmentação) | Média (Boilerplate repetitivo) |
| **Integração com Postgres / Redis** |  Npgsql + EF Core / StackExchange |  Drizzle + ioredis |  pgx + go-redis |

---

## 8. Conclusão e Diretriz Arquitetural

O estudo comprova que **C# (.NET 8/9) é uma escolha tecnicamente sólida, operacionalmente enxuta e financeiramente vantajosa** para sustentar o futuro backend do Noduct. 

A familiaridade prévia do desenvolvedor com o ecossistema .NET representa a maior vantagem competitiva do projeto, eliminando débito técnico precoce e entregando máxima robustez na orquestração de infraestrutura sem comprometer as margens de lucro estabelecidas no modelo de sustentabilidade.

