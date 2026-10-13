# Padrões de interface

## Estrutura

Header compacto, um H1, função principal, ajuda contextual, conteúdo complementar e footer. Cards inteiros usam link apenas quando existe destino real. Estado planejado é artigo sem interação.

Componentes reutilizáveis usam `Component.astro` com `Component.module.css`. Tokens, reset e temas são globais. Mudanças de largura usam `--layout-max-width` e `--layout-padding`; raios de cartões usam `--radius-card` ou os tokens semânticos do design system.

## Estados

Controles devem cobrir idle, loading, sucesso, erro e disabled. Mensagens dinâmicas usam `role=status`; erros acionáveis associam texto ao campo. Nova aba exige indicação textual e `noopener noreferrer`.

## Validação

Teste teclado, zoom de 200%, larguras de 360 px e 1280 px, tema escuro e movimento reduzido. Conteúdo não pode depender exclusivamente de cor ou hover.
