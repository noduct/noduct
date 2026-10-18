## Issue e fase

Closes #<!-- número -->. Fase: <!-- número e objetivo -->.

## Contrato de conformidade (#39 / ADR 0005)

- [ ] Shell compartilhado `AppShell` e `ToolPage`; drawer em `actions`.
- [ ] URLs e locale via `@noduct/tool-runtime`.
- [ ] Ícones via `Icon` e tokens nos dois temas.
- [ ] i18n en, pt-BR e es, inclusive scripts e erros.
- [ ] CSS Modules sem hashes escritos à mão.
- [ ] SEO, H1, hreflang e JSON-LD revisados.
- [ ] WCAG AA, teclado, foco, toque e movimento reduzido revisados.
- [ ] Testes existentes preservados; ferramenta nova coberta por paridade e montagem.
- [ ] Guardrails preservados; exceções justificadas abaixo.
- [ ] `npm run verify` verde localmente e no CI.

Marque “não se aplica” com motivo quando um item não for afetado.

## Verificação

Cole a saída final, commit e ambiente de `npm run verify`. Registre falhas pré-existentes separadamente.

## Mudança de guardrail ou teste

Descreva regra, arquivo, motivo, alternativa considerada, impacto, testes e aprovação explícita do dono. Qualquer supressão, aumento de allowlist ou mudança de configuração exige label `guardrail-change`. Não afrouxe asserções sem aprovação.

## Dúvidas e riscos

Registre divergências entre issue, ADR e instruções antes de alterar contrato.
