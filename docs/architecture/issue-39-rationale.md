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
- **Configuração em desenvolvimento:** o `astro.config.mjs` importa `@noduct/tool-runtime` pelo ESM nativo do Node. Imports internos TypeScript sem extensão quebravam `npm run dev:merge-pdf` embora o build estático passasse. Os imports explícitos `.ts` e um teste que executa o Node diretamente protegem esse caminho.

## Critério operacional para fechar uma fase

Leia o corpo da issue, o comentário de orientação e o ADR; transforme cada item em evidência observável; implemente sem afrouxar asserções; rode lint, typecheck, testes, build/SEO e Playwright proporcionais; confira o artefato montado e o diff; só então faça commit, push e atualize o checklist e o comentário da issue. Registre limites de validação de forma explícita.
