# Avaliação periódica de agentes

Execute as mesmas cinco tarefas isoladas em uma branch temporária para cada agente usado no projeto após mudanças em AGENTS.md. Não aceite uma tarefa concluída apenas por declaração: confira diff, check e verify. Recomece da mesma base para cada agente.

| Tarefa | Critério observável |
| --- | --- |
| Adicionar texto i18n | en, pt-BR e es completos, inclusive cliente e aria-live. |
| Adicionar ícone | Usa Icon e registry, sem SVG solto. |
| Criar ferramenta de exemplo | Template, shell, topologia, catálogo, build e paridade. |
| Corrigir violação de token | Usa token real e mantém contraste nos dois temas. |
| Adicionar teste e2e | Asserções web-first, axe e paridade, sem espera artificial. |

Registre em cada execução: data, agente e versão, tarefa, branch/base, AGENTS carregados (raiz e pasta), comandos executados, saída de `npm run verify`, intervenção humana, regras violadas e correção proposta para instruções ou guardrails. Rode o mesmo protocolo em Claude Code, Codex, Gemini CLI, Copilot, Cursor e outros que estiverem realmente em uso. Sem acesso a um agente, registre “não executado” e não declare paridade empírica.
