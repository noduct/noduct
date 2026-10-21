## Issue

Closes #<!-- número -->. Etapa entregue: <!-- objetivo desta entrega -->.

Mudança OpenSpec: <!-- openspec/changes/<nome>, ou "não se aplica" com motivo -->.

## Contrato de conformidade ([AGENTS.md](../AGENTS.md#contrato-de-conformidade))

- [ ] Shell compartilhado `AppShell` e `ToolPage`; nenhum header, footer, Settings ou breadcrumb próprio.
- [ ] Área Local só por `DropZone` e `DownloadCard` com `workspace` (ADR 0006); nada no header.
- [ ] URLs e locale via `@noduct/tool-runtime`.
- [ ] Ícones via `Icon`; tokens nos dois temas; ações com texto usam `Button`.
- [ ] i18n en, pt-BR e es, inclusive scripts, erros, anúncios e nomes de arquivo.
- [ ] CSS Modules sem hashes escritos à mão.
- [ ] SEO, H1, hreflang e JSON-LD revisados.
- [ ] WCAG AA, teclado, foco, toque e movimento reduzido revisados.
- [ ] Testes existentes preservados; ferramenta nova coberta por paridade e montagem.
- [ ] Guardrails preservados; exceções justificadas abaixo.
- [ ] Specs vivas e documentação atualizadas quando o comportamento mudou.
- [ ] `npm run verify` verde localmente e no CI.

Marque “não se aplica” com motivo quando um item não for afetado.

## Verificação

Cole a saída final, commit e ambiente de `npm run verify`. Registre falhas pré-existentes separadamente.

## Mudança de guardrail ou teste

Descreva regra, arquivo, motivo, alternativa considerada, impacto, testes e aprovação explícita do dono. Qualquer supressão, aumento de allowlist ou mudança de configuração exige label `guardrail-change`. Não afrouxe asserções sem aprovação.

## Dúvidas e riscos

Registre divergências entre issue, ADR, spec e instruções antes de alterar contrato.
