# Avaliação periódica de agentes

Instruções para agentes só valem o que melhoram na prática: pesquisas recentes mostram efeito pequeno no acerto, custo maior com texto desnecessário e resultados diferentes por agente. Por isso, meça neste repositório sempre que `AGENTS.md`, uma skill ou um guardrail mudar.

## Protocolo

Execute as mesmas cinco tarefas isoladas, a partir da mesma base, numa branch temporária por agente. Não aceite uma tarefa concluída por declaração: confira diff, `npm run check` e `npm run verify`.

| Tarefa | Critério observável |
| --- | --- |
| Adicionar texto i18n | en, pt-BR e es completos, inclusive cliente e `aria-live`. |
| Adicionar ícone | Usa `Icon` e o registry, sem SVG solto. |
| Criar ferramenta de exemplo | Template, shell, topologia, catálogo, build e paridade. |
| Corrigir violação de token | Usa token real e mantém contraste nos dois temas. |
| Adicionar teste e2e | Asserções web-first, axe e paridade, sem espera artificial. |

Para cada execução registre: data, agente e versão, modelo, tarefa, base, instruções carregadas (raiz, pasta e skill usada), passos ou turnos, custo ou tokens se disponível, resultado de `npm run verify`, intervenção humana e regras violadas. Sem acesso a um agente, registre “não executado” e não declare paridade.

## Registro

| Data | Agente / versão | Base | Tarefas aprovadas sem intervenção | Regras violadas | Ação tomada |
| --- | --- | --- | --- | --- | --- |
| — | Nenhuma rodada executada ainda | — | — | — | Primeira rodada pendente após a introdução de skills, OpenSpec e hook. |

## Como usar o resultado

- Regra violada por mais de um agente vira guardrail com fixture, ou diagnóstico mais claro.
- Skill que nenhum agente usou sozinho ganha menção mais direta no `AGENTS.md`.
- Instrução que nenhuma rodada precisou é candidata a remoção: menos contexto custa menos.
