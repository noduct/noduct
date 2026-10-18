# Memória arquitetural da issue #39

Esta nota acompanha a [issue #39](https://github.com/noduct/noduct/issues/39) e o [ADR 0005](../adr/0005-unified-shell-topology-guardrails.md). Deve ser atualizada ao concluir cada fase. Ela registra **por que** cada contrato existe, para que uma entrega não seja considerada pronta apenas porque compila ou porque seus checkboxes foram marcados.

## Por que a issue existe

O Merge PDF foi criado como referência para ferramentas futuras, mas montou header, footer, marca, tema e página próprios. Ele divergiu do hub em identidade, acessibilidade, i18n e comportamento. A topologia também era contraditória: a ferramenta era compilada para `/<slug>/` e montada sob `/noduct/<slug>/`, situação capaz de publicar HTML com CSS e JavaScript quebrados. Havia lógica duplicada de URL/locale, armazenamento local sem a retenção prometida e ausência de verificações automáticas que detectassem novas divergências.

A causa recorrente foi a falta de um contrato concreto e verificável, não a dificuldade de copiar estilos. A correção precisa existir na estrutura compartilhada, nos testes e nos guardrails, para valer igualmente para pessoas e agentes diferentes.

## Invariantes que não podem regredir

1. O hub, as ferramentas e o PDF Studio consomem o mesmo shell do design system; ferramentas usam `AppShell` e `ToolPage`, sem shell paralelo.
2. `@noduct/tool-runtime` é a fonte única de URLs, locales, taxonomia e metadados. O HTML estático essencial e o SEO continuam corretos sem JavaScript.
3. Arquivos e documentos permanecem no dispositivo. O workspace compartilha a origem das ferramentas, por isso deve coordenar abas, preservar documentos em uso e explicitar a retenção ao usuário.
4. Pacotes de domínio devolvem códigos e parâmetros; texto visível, inclusive erros e anúncios, é traduzido na UI em en, pt-BR e es.
5. Testes existentes não são enfraquecidos para declarar uma fase verde. Cada fase exige evidência proporcional ao risco, revisão do artefato composto e conferência do comentário de orientação da issue além do corpo.
6. Mudanças de contrato exigem documentação, testes e atualização explícita dos consumidores. As fases 5–7 transformarão estas regras em verificações de CI e instruções comuns a agentes.

## Fase 4: motivo das decisões

- **Schema v3 e migração:** documentos v2 já existem em navegadores reais. A migração preserva os blobs e define um início de prazo determinístico (`lastAccessedAt = updatedAt`), sem depender de campos ausentes.
- **Retenção por inatividade:** 24 horas contam desde o último acesso, não apenas desde a criação. `persistent` representa escolha explícita do usuário e não expira.
- **Locks e BroadcastChannel:** abas da mesma origem podem usar o mesmo documento. A limpeza não pode apagar um arquivo enquanto outra aba o processa; notificações mantêm as listas sincronizadas.
- **Gatilhos sem timer:** abertura do workspace/drawer e retorno da aba ao primeiro plano oferecem limpeza previsível sem trabalho contínuo em segundo plano.
- **Códigos de erro:** frases montadas no `workspace-core` não podem ser traduzidas com segurança. `code` e `params` estruturados separam decisão de domínio de apresentação.
- **Testes de limite temporal:** relógio falso, fixture de migração e Playwright devem provar o comportamento no instante de expiração, a proteção de `persistent`/locks e o anúncio acessível de remoção.
- **Configuração em desenvolvimento:** o `astro.config.mjs` importa `@noduct/tool-runtime` pelo ESM nativo do Node. Imports internos TypeScript sem extensão quebravam `npm run dev -- merge-pdf` embora o build estático passasse. Os imports explícitos `.ts` e um teste que executa o Node diretamente protegem esse caminho.

## Feedback do dono e evolução visual

Em 2026-10-17, o dono confirmou que a correção estrutural e o cuidado com a issue estão no caminho certo. Ele considera possíveis ajustes futuros no layout do Merge PDF. A nova composição com `AppShell`, `ToolPage`, componentes do design system e CSS local deve permitir iterar na área específica da ferramenta sem recriar o shell. Em cada ajuste, conferir os três idiomas, temas, tamanhos de tela, foco, contraste e paridade com o hub; mudanças em componentes compartilhados exigem validação dos demais consumidores.

## Fase 5: motivo dos guardrails

- **Uma configuração para exceções:** `guardrails.config.ts` concentra as permissões deliberadas. Uma exceção dispersa em ESLint, Stylelint ou scripts seria difícil de auditar e poderia crescer sem revisão.
- **Lint próximo do código:** regras locais de ESLint impedem SVG duplicado, imports privados, shell ausente e texto não traduzido antes do build. Stylelint exige tokens para cores e valores visuais compartilhados; isso evita que um ajuste pontual reabra a divergência entre hub e ferramenta.
- **Validadores do repositório:** `validate:ui` inspeciona arquivos versionados ou novos ainda não versionados e detecta regressões que não cabem no AST do ESLint, como nomes antigos, emoji, URLs legadas e hashes de CSS Modules gerados. `validate:architecture` verifica a direção das dependências, ciclos e exports públicos para que consumidores não dependam da estrutura interna de outro pacote.
- **Ratchet no PR:** `check-guardrail-ratchet.ts` compara exceções e supressões com a base do PR. O crescimento exige a label `guardrail-change`; a alteração da própria regra também exige essa revisão. A label é um sinal de revisão consciente, não uma dispensa dos demais testes.
- **Paridade no artefato publicado:** Playwright visita `dist-pages/`, não um servidor de ferramenta isolado. Compara árvore acessível, geometria e estilos no contexto real; depois isola cada região compartilhada na página para que o compositor do Chromium não introduza diferenças de rasterização por causa do conteúdo fora do shell. Os bytes de pixels do header e footer devem ser iguais nos três idiomas, dois temas e três perfis de tela.
- **Preparação para a Fase 7:** os comandos `npm run check`, `npm run check -- css`, `npm run check -- ui`, `npm run check -- architecture`, `npm test` e `npm run test:e2e` formam um contrato executável para pessoas e agentes. Exceções novas precisam ser explicadas e revisadas, não copiadas de uma ferramenta para outra.

## Fase 6: motivo da interface única

- **Descoberta pelo manifesto:** uma ferramenta declara `noduct.slug` no próprio pacote. A CLI, o build, o proxy, o Pages, a paridade e o Lighthouse leem a mesma lista. Isso evita que uma ferramenta funcione isolada, mas desapareça do artefato ou da validação.
- **Uma origem em desenvolvimento:** o hub encaminha `/<slug>/` ao servidor Astro da ferramenta, inclusive módulos de desenvolvimento e WebSocket. A alteração ao vivo de um título da ferramenta foi observada pela porta 4321, não apenas pela porta interna. O encerramento da CLI encerra os processos filhos no Windows.
- **Build único e artefato verificável:** `build` compila hub e ferramentas uma vez, monta `dist-pages/` e grava um hash de fontes e configuração. `test:e2e` e os checks de páginas/SEO rejeitam artefatos ausentes ou antigos; assim, testes não conseguem passar sobre HTML de uma versão anterior nem recompilar ferramentas inadvertidamente.
- **Scripts públicos fechados:** `check-scripts.ts` recusa comandos antigos, scripts por slug e diferenças entre pacote, configuração e manifesto. `new:tool` valida colisões antes de escrever e deixa traduções pendentes explícitas; `validate-ui` encontra esses marcadores mesmo em arquivos ainda não versionados.
- **Artefatos de pacotes novos:** o ESLint ignora `.astro/` e `dist/` por padrão genérico de pacote. A antiga lista de dois nomes fazia o primeiro `check` de uma ferramenta recém-gerada falhar em tipos produzidos pelo Astro, antes de chegar ao guardrail de tradução. A alteração do arquivo de controle exige `guardrail-change` quando houver PR, conforme o ratchet da Fase 5.
- **CI e deploy iguais ao uso local:** CI executa `check`, `build`, páginas, SEO e E2E; deploy usa `verify` e publica o mesmo artefato. O job de template gera uma ferramenta descartável, completa as traduções de exemplo e executa a mesma verificação para provar que a descoberta continua automática.
- **Lighthouse e ferramentas planejadas:** a lista de URLs vem do manifesto e o estado de indexação vem do catálogo. Páginas `planned` têm `noindex` deliberado, portanto a nota SEO de indexabilidade não se aplica a elas; desempenho, acessibilidade, boas práticas e links válidos continuam obrigatórios. Um controle de download ainda sem arquivo usa um botão, evitando um link sem destino no HTML inicial.
- **Ratchet em checkout Windows:** o Git armazena LF, enquanto um checkout pode apresentar CRLF. O comparador normaliza apenas as quebras de linha antes de decidir se um arquivo de controle mudou; alterações efetivas continuam exigindo `guardrail-change`.

## Critério operacional para fechar uma fase

Leia o corpo da issue, o comentário de orientação e o ADR; transforme cada item em evidência observável; implemente sem afrouxar asserções; rode lint, typecheck, testes, build/SEO e Playwright proporcionais; confira o artefato montado e o diff; só então faça commit, push e atualize o checklist e o comentário da issue. Registre limites de validação de forma explícita.
