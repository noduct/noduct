# Tolvira Hub

Hub estático e workspace compartilhado do ecossistema **Tolvira — Free Online Tools**. O projeto entrega descoberta de ferramentas, páginas institucionais, infraestrutura de SEO, design system e um template extraível para aplicações independentes.

## Requisitos

- Node.js 20.19 ou superior
- npm 10 ou superior

## Desenvolvimento

```bash
npm install
npm run dev
```

O servidor local informa a URL no terminal. O produto público é escrito em inglês; código e identificadores também. A documentação técnica está em português brasileiro.

## Qualidade e produção

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

O build estático é criado em `dist/`. A validação de SEO roda após o build. Os testes E2E exigem `npx playwright install chromium` uma vez no ambiente.

## Workspace

- `src/`: hub Astro.
- `packages/design-system/`: tokens e contratos compartilhados, preparado para extração.
- `packages/tool-template/`: aplicação demonstrativa e template de ferramenta independente.
- `docs/`: arquitetura, operação, SEO, patrocínios, deploy e decisões.
- `scripts/`: validações do catálogo, SEO e patrocínios.
- `tests/`: testes unitários e E2E.

## Publicação

O workflow de Pages gera e publica o artefato estático. A ativação comercial de patrocínios fica desabilitada até uma revisão das condições do provedor de hospedagem. Consulte `docs/deploy-github-pages.md` e `docs/patrocinadores.md`.

## Licença

MIT. Consulte `LICENSE`.
