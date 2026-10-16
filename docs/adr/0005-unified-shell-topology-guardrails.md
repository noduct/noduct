# ADR 0005: Shell unificado, topologia de URLs e guardrails

- **Status:** Aceito
- **Data:** 2026-10-16
- **Contexto:** Issue #39 (M2.5 — Correção estrutural e recomeço do épico #36)
- **Estende:** ADR 0001, ADR 0003 e ADR 0004

---

## 1. Contexto e problema

A primeira ferramenta (Merge PDF) foi construída com um shell paralelo (`BrandHeader`, `BrandFooter`, `ToolFrame`). Esse shell divergia do hub em marca, header, footer, Settings, preferências de tema, tipografia, ícones e base CSS. Também havia três problemas estruturais:

- A topologia de URLs era contraditória. O hub ficava em `/noduct/`, enquanto a ferramenta era compilada para `/merge-pdf/` e montada em `/noduct/merge-pdf/`.
- A lógica de locale e de URL estava duplicada em vários pacotes.
- Nenhum guardrail automatizado impedia a divergência. As regras escritas não cobriam o shell e as issues ainda usavam o nome depreciado.

O ecossistema é mantido por várias pessoas e por vários agentes de IA. Regras que dependem só de leitura não bastam.

---

## 2. Decisões

### D1. Topologia: hub na raiz da origem e ferramentas em `/<slug>/`

| Escopo       | Caminhos                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Origem única | `https://noduct.github.io` (exigida pelo IndexedDB, pelo BroadcastChannel e pelos tickets do ADR 0004) |
| Hub          | `/`, `/pt-br/`, `/es/`                                                                                 |
| Ferramenta   | `/<slug>/`, `/<slug>/pt-br/`, `/<slug>/es/`                                                            |
| PDF Studio   | `/pdf-studio/`                                                                                         |

O caminho `/<slug>/` é o mesmo que um project site `noduct/<slug>` publica. Por isso a URL canônica de uma ferramenta não muda quando ela é extraída para um repositório próprio (#38). Com o hub na raiz, o `robots.txt` também passa a ser efetivo, e um futuro domínio customizado se propaga para todas as ferramentas.

A transição exige renomear o repositório `noduct/noduct` para `noduct/noduct.github.io`, com autorização explícita do dono. O GitHub não redireciona Pages de project site após o rename, então o build publica stubs de redirecionamento em `/noduct/…` por pelo menos 12 meses. O segmento `noduct` fica reservado para sempre.

Slugs de ferramenta não podem colidir com rotas do hub (`RESERVED_HUB_SEGMENTS`).

### D2. Pacote `@noduct/tool-runtime`

Pacote TypeScript puro, sem DOM e sem Astro, e **fonte única** de:

- origem e bases (`topology`);
- locales e prefixos (`''`, `pt-br`, `es`);
- canonical, hreflang (`en`, `pt-BR`, `es`, `x-default`) e JSON-LD;
- taxonomia de categorias;
- declaração tipada de ferramentas (`defineTool`).

Nenhuma URL do produto é escrita fora de `topology.ts`.

### D3. Shell único no design system

`@noduct/design-system` passa a conter:

- o shell: `AppShell` nas variantes `page` (hub e ferramentas) e `app` (PDF Studio), `SiteHeader`, `SiteFooter`, `SettingsMenu`, `BrandMark` e as preferências;
- o template `ToolPage`;
- `base.css`.

O hub consome o mesmo shell e não mantém header, footer nem Settings próprios. O `WorkspaceDrawer` é montado no slot `actions` do header.

### D4. Ícones

Ícones vêm do pacote `lucide` (vanilla, `IconNode`), com versão exata. Uma allowlist tipada (`icons/registry.ts`) alimenta `Icon` (inline) e `IconSprite` (`<symbol>`/`<use>`).

- `@lucide/astro` foi rejeitado porque importa APIs internas do Astro.
- Emoji e glifos de texto usados como ícone são proibidos.

### D5. Direção das dependências

```text
hub (src/) ──────────────┐
ferramentas e PDF Studio ┼──► @noduct/design-system ──► @noduct/tool-runtime
                         └──► @noduct/pdf-core, @noduct/workspace-core
```

- `tool-runtime` não depende de nenhum pacote interno.
- `design-system` não importa o hub, `pdf-core` nem `workspace-core`.
- O hub não importa `pdf-core` nem `workspace-core`.
- Pacotes de domínio devolvem códigos e parâmetros, nunca texto de interface.

### D6. Retenção do Local Workspace

Cada documento é `ephemeral` (padrão) ou `persistent`. Um documento efêmero sem acesso há mais de 24 horas é removido no próximo gatilho: abertura do workspace, abertura do drawer ou retorno da aba ao primeiro plano.

Nunca são removidos:

- documentos `persistent`;
- documentos com lock ativo (Web Locks API), ou seja, em uso em outra aba.

### D7. Guardrails em camadas

1. **Verificações determinísticas no CI:** ESLint, Stylelint, `validate:ui`, `validate:architecture`, `validate:pages`, testes de contrato e paridade visual hub × ferramenta.
2. **Ratchet:** a quantidade de supressões (`eslint-disable`, `@ts-expect-error`, `.skip` etc.) e de entradas nas allowlists não pode crescer sem a label `guardrail-change`.
3. **Regras escritas, agnósticas de agente:**
   - `AGENTS.md` é a única fonte de regras;
   - arquivos de ferramentas específicas (`CLAUDE.md`, `.github/copilot-instructions.md`, `GEMINI.md`) apenas apontam para ele;
   - `docs/guardrails.md` liga cada regra à verificação que a garante.
4. **Proteção de branch:** checks obrigatórios em `main` e `epic/*`, configurados pelo dono.

`npm run verify` é a definição única de pronto, para pessoas e para qualquer agente.

---

## 3. Consequências

### Positivas

- Hub, ferramentas e PDF Studio têm a mesma identidade, por construção e com verificação no CI.
- URLs canônicas estáveis durante e após a extração das ferramentas.
- Ferramentas novas nascem corretas a partir do `tool-template`.
- Regressões visuais, de topologia ou de i18n falham no CI em vez de chegar à produção.

### Custos e riscos

- **Pacote extra.** Há um pacote a mais (`tool-runtime`) e o design system fica maior. É aceitável porque ambos já têm três consumidores.
- **Comportamento do GitHub Pages não documentado oficialmente.** Duas premissas vêm apenas da comunidade: a conversão do repositório em user site pelo rename e a precedência de um project site sobre uma pasta do user site. Mitigação: verificação ativa após o rename e na primeira extração.
- **Mudança visual dos ícones.** O redesenho do Lucide altera alguns ícones (`settings`, `file-text`, `image`, `type`, `wrench`). A diferença foi aceita uma única vez.
- **Atrito ao mudar guardrails.** Regras novas exigem a label `guardrail-change`. Isso é intencional.
