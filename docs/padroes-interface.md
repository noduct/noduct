# Padrões de Interface — Noduct

Este documento descreve a linguagem visual e de interação. As regras obrigatórias e sua verificação automática estão no Contrato do [AGENTS.md](../AGENTS.md#contrato-de-conformidade) e em [guardrails](guardrails.md); em conflito, elas prevalecem.

## 1. Filosofia e Direção Visual

A interface do ecossistema Noduct segue a filosofia **Quiet Productivity**, inspirada nos princípios de precisão, ergonomia e sofisticação tátil dos produtos Apple (macOS / iOS Human Interface Guidelines), Raycast e Linear:

* **Foco e Clareza:** A função utilitária prevalece sobre elementos decorativos vazios ou marketing intrusivo.
* **Superfícies em Ilhas Funcionais:** O conteúdo é organizado em cartões e blocos coesos com bordas precisas de 1px (`--color-border`), sombras em camadas discretas e iluminação de borda especular (*rim light*).
* **Física e Movimento Natural:** Transições mecânicas lineares são proibidas; adota-se a curva de desaceleração fluida Apple (`cubic-bezier(0.16, 1, 0.3, 1)`).
* **Menos é Mais:** Dicas e elementos óbvios não precisam de textos redundantes; a interface deve ser autoexplicativa e ágil.

---

## 2. Tipografia e Hierarquia de Fontes

### 2.1 Pilha de Fontes (Font Stacks)
* **Texto e Interface:**
  `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;`
  Com ativação de recursos OpenType: `font-feature-settings: "cv02", "cv03", "cv04", "cv11";`
* **Código, Badges e Teclas (`code`, `kbd`, `pre`):**
  `ui-monospace, "SF Mono", "Geist Mono", "JetBrains Mono", Menlo, Consolas, monospace;`

### 2.2 Escala Tipográfica e Ritmo
* **H1 (Título da Página / Hero):** `font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 600; letter-spacing: -0.03em; line-height: 1.25;`
* **H2 (Títulos de Seção / App library):** `font-size: clamp(1.15rem, 2.5vw, 1.35rem); font-weight: 600; letter-spacing: -0.02em;`
* **H3 (Títulos de Cards / Itens de Busca):** `font-size: 0.95rem; font-weight: 600; letter-spacing: -0.01em;`
* **Eyebrow (Subtítulo Superior / Categoria):** `font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-primary);`
* **Lede (Parágrafo Introdutório):** `font-size: clamp(1.02rem, 1.5vw, 1.15rem); line-height: 1.6; color: var(--color-text-secondary); max-width: 680px;`
* **Corpo (Body / Descrições):** `font-size: 0.88rem; line-height: 1.5; color: var(--color-text-secondary);`

---

## 3. Cores, Superfícies e Contrastes (WCAG AA)

O sistema possui duas paletas perfeitamente calibradas via variáveis CSS:

### 3.1 Modo Claro (Light Theme - Padrão)
* **Canvas de Fundo (`--color-background`):** `#ffffff`
* **Superfície Base (`--color-surface`):** `#f8f9fb`
* **Cartões e Ilhas (`--color-surface-card`):** `#ffffff`
* **Superfície Rebaixada (`--color-surface-sunken`):** `#f1f3f6`
* **Hover de Superfície (`--color-surface-hover`):** `#f1f3f6`
* **Bordas (`--color-border`):** `#e2e8f0` (1px) | Forte: `#cbd5e1` | Sutil: `#edf2f7`
* **Texto Principal (`--color-text`):** `#0f172a` (Contraste ~15:1)
* **Texto Secundário (`--color-text-secondary`):** `#475569` (Contraste ~7.5:1)
* **Texto Atenuado (`--color-text-muted`):** `#596780` (Contraste ~5.1:1)
* **Primária / Ação (`--color-primary`):** `#2563eb` | Hover: `#1d4ed8`

### 3.2 Modo Escuro (Dark Theme)
* **Canvas de Fundo (`--color-background`):** `#0b0f17`
* **Superfície Base (`--color-surface`):** `#111827`
* **Cartões e Ilhas (`--color-surface-card`):** `#161f30`
* **Superfície Rebaixada (`--color-surface-sunken`):** `#101827`
* **Hover de Superfície (`--color-surface-hover`):** `#1f2c42`
* **Bordas (`--color-border`):** `#28374d` | Forte: `#3b4c66` | Sutil: `#1e293b`
* **Texto Principal (`--color-text`):** `#f8fafc` (Contraste ~16:1)
* **Texto Secundário (`--color-text-secondary`):** `#cbd5e1` (Contraste ~10.9:1)
* **Texto Atenuado (`--color-text-muted`):** `#94a3b8` (Contraste ~6.4:1)
* **Primária / Ação (`--color-primary`):** `#3b82f6` | Hover: `#60a5fa`

---

## 4. Formatos, Raios e Borda Especular (*Rim Light*)

### 4.1 Raios de Curvatura (Border Radii)
* `--radius-xs: 4px;` — Badges, pílulas de atalho `<kbd>`, micro-tags.
* `--radius-sm: 6px;` — Botões compactos, inputs, ícones de categoria, breadcrumbs.
* `--radius-md: 8px;` — Cards utilitários, campos de busca, dropdowns popover.
* `--radius-lg: 10px;` — Ilhas mestras (`.libraryIsland`), gavetas móveis.
* Para pílulas e círculos, use `--radius-pill`, `--radius-switch` ou `--radius-circle`; os raios de superfície vão de 4 a 10 px.

### 4.2 Iluminação Especular (*Rim Light*)
Todos os cartões e superfícies elevadas combinam sombra difusa com linha interna especular superior de 1px:
```css
box-shadow: var(--shadow-sm), var(--rim-light);
```
* **Light:** `inset 0 1px 0 0 rgba(255, 255, 255, 0.7)` (realce de borda limpa).
* **Dark:** `inset 0 1px 0 0 rgba(255, 255, 255, 0.08)` (bisel sutil de volume tridimensional).

---

## 5. Botões e Ações Interativas

### 5.1 Anatomia e hierarquia (`Button`)

Use `Button` de `@noduct/design-system/components/Button.astro` nas ações com texto, links apresentados como botões e controles de ícone em proporção 1×1 (`iconOnly`). O componente aceita `variant`, `size`, `iconOnly`, `href`, `type`, `icon`, `iconTrailing`, `disabled`, `title`, `target`, `rel`, `download`, atributos ARIA (`ariaLabel`, `ariaExpanded`, `ariaControls`, `ariaPressed`, `ariaDescribedby`, `ariaHaspopup`, `ariaCurrent`, `ariaBusy`, `role`) e atributos `data-*`. Componentes com `input[type=file]` (`DropZone`, `WorkspaceManager`) e botões criados dinamicamente no cliente usam as classes exportadas de `@noduct/design-system/components/Button.module.css`, mantendo o mesmo acabamento e foco.

| Variante | Uso | Acabamento |
| --- | --- | --- |
| `primary` | Ação principal do contexto, como mesclar, baixar ou enviar arquivo | `--color-action-primary` com texto branco, sombra e `--rim-light-strong` |
| `secondary` | Alternativa ou ação de apoio, como escolher da Área Local, abrir a Área de Trabalho ou reiniciar | Superfície `--color-surface-card`, borda, sombra e `--rim-light-strong` |
| `quiet` | Ação auxiliar ou botão de ícone em repouso | Transparente, hover em `--color-surface-hover` |
| `danger` | Confirmação destrutiva que precisa de destaque | `--color-action-danger` com texto branco, sombra e `--rim-light-strong` |
| `danger-quiet` | Ação destrutiva disponível sem competir com a principal | Transparente, texto vermelho e hover em `--color-danger-soft` |

`size` pode ser `sm` (`36px`), `md` (`40px`, padrão) ou `lg` (`44px`); todos preservam área mínima de toque de 44×44 px em dispositivos coarse pointer. Quando `iconOnly={true}`, o botão assume proporção quadrada estrita `1 / 1` (`padding: 0`) e compressão ativa `--scale-active-icon` (`0.92`). Estados abertos ou pressionados (`[aria-expanded='true']`, `[aria-pressed='true']`) recebem realce automático em `--color-primary-soft` e `--color-primary-border-soft`.

```astro
<Button variant="primary" data-action="merge">{m.actionMerge}</Button>
<Button variant="secondary" href={toolsHref} iconTrailing="chevron-right">{m.allTools}</Button>
<Button variant="quiet" iconOnly icon="settings" ariaLabel={m.settings.open} data-settings-trigger />
```

### 5.2 Alternâncias (`Switch`) e Configurações Adaptativas

Para preferências binárias de efeito imediato, use `Switch` de `@noduct/design-system/components/Switch.astro`:
* **Semântica e Ergonomia:** `button[role="switch"]` com `aria-checked`, trilho de `40×24 px` dentro de área de toque de `44×44 px`, transição com `--ease-apple-spring` e anel de foco único (`--shadow-focus-ring`).
* **Estado Bloqueado (`blocked` / `disabled`):** Quando uma opção depende logicamente de outra (por exemplo, *Reduzir animações* quando *Arte de fundo* está desativada), o componente recebe `disabled` e `data-blocked="true"` (`cursor: not-allowed`, opacidade reduzida e bloqueio de eventos no cliente).
* **Responsividade do `SettingsMenu`:** Como a arte ambiente lateral (`AmbientArtwork`) só é renderizada em telas largas (`>= 1400px`), a seção de controles de arte e animação do `SettingsMenu` fica oculta em viewports menores que `1400px`, exibindo apenas Tema e Idioma no mobile e em notebooks compactos.

---

## 5.3 Confirmações, Seleções (*Inset Grouped*) e Busca

* **Nunca** use `alert`, `confirm` ou `prompt` nativos: eles ignoram tema, idioma e foco. Use `confirmAction({ title, message, confirmLabel, tone })` de `@noduct/design-system/shell/confirm`; em ações destrutivas (`tone: 'danger'`) o foco começa em Cancelar. O guardrail `native browser dialog` bloqueia o uso nativo.
* **Padrão *Inset Grouped* para Menus e Seletores:** Escolhas entre opções (`Select` do design system, lista de idiomas do `SettingsMenu`, dropdown de `Categories` no `SiteHeader` e menu mobile) agrupam itens dentro de um contêiner rebaixado (`--color-surface-sunken`) ou popover elevado (`--color-surface-card`, `--shadow-popover`, `--rim-light`) com divisórias sutis de `1px solid var(--color-border-subtle)` entre itens adjacentes (`li + li`, `a + a`). O item selecionado recebe fundo `--color-primary-soft`, texto `--color-primary` e ícone `check`.
* **Ancoragem Segura e Foco com Cantos Arredondados:** Dropdowns do cabeçalho (`Categories`) ancoram à direita (`right: 0; width: min(280px, calc(100vw - 1.5rem))`) para nunca causar overflow horizontal em viewports intermediárias. O seletor global `:focus-visible` não sobrescreve `border-radius`, preservando os cantos arredondados de `<summary>` e dos itens nas extremidades das listas agrupadas ao navegar com `Tab` ou `Shift+Tab`.
* **Autocomplete de Busca (`ToolSearch`):** O popover de resultados usa `Popover.module.css` (`.popover`, `.body`, `.card`, `.badge`) com `z-index: var(--z-search)` e `overflow: visible` em `.page-head`, abrindo sempre colado abaixo do campo de busca tanto no Hero da Home quanto em `/tools/`.
* **Filtro de Categorias na Biblioteca da Home (Zero-JS `:has()`):** Na página inicial, o filtro de categorias usa `<fieldset>` com pílulas `<label>` (`flex-wrap: wrap`, altura mínima de `44px`, opção inicial *Todas* / *All* + categorias com `ToolIcon`, nome completo e contador tabular) e inputs de rádio ocultos. As seções `[data-category-section]` são filtradas instantaneamente via CSS `:has()`, sem cortar rótulos em nenhuma largura de tela e sem adicionar scripts ao bundle.
* **Cards, Patrocínio e Rodapé (*Buy Me a Coffee*):**
  - `ToolCard` exibe `ToolIcon` colorido no cabeçalho, elevação suave para ferramentas disponíveis e superfície rebaixada tracejada para ferramentas `planned`.
  - `SponsorRail` alinha seu breakpoint com o layout da Home (`1024px`) e usa `grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr))` com `white-space: nowrap` no selo e na ação para nunca espremer um card único em telas pequenas.
  - `SiteFooter` apresenta o convite de apoio voluntário (*Buy me a coffee* / *Me pague um café* / *Invítame a un café*) como uma ilha elevada (`--color-surface-card`, `--rim-light`) com selo âmbar (`--color-warning-soft`, `--color-brand-support`), ícone `coffee` e seta externa `arrow-up-right`.

## 6. Breadcrumbs (Migalhas de Pão)

Nas páginas de navegação secundária (categorias, ferramentas), o breadcrumb deve seguir o padrão:

* **Estrutura:**
  - Link de retorno ao Início com ícone SVG de casa (`14x14px`).
  - Separador em chevron SVG sutil (`M6 4l4 4-4 4`, `opacity: 0.55`).
  - Item atual como cápsula rebaixada com `aria-current="page"`.
* **Espaçamento:** `margin-bottom: 1.25rem`.
* **Interatividade:** O link possui transição suave de fundo e cor no hover, e escala física `scale(0.97)` ao clique.
* **i18n:** Rótulo da raiz (`m.common.home`) e `aria-label` dinâmicos conforme o idioma ativo.

---

## 7. Espaçamentos, Margens e Cabeçalhos de Página

### 7.1 Cabeçalho Padrão (`.page-head`)
Para evitar que títulos fiquem colados na topbar fixa:
```css
.page-head {
  padding-top: clamp(2.5rem, 5vw, 4.25rem);
  padding-bottom: clamp(1.75rem, 3.5vw, 2.5rem);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}
```

### 7.2 Margens e Larguras de Layout
* **Container Central:** `width: min(calc(100% - 2 * var(--layout-padding)), var(--content-width));` (`1280px`).
* **Container Estreito (Prose/Artigos):** `max-width: 760px;` centralizado.
* **Margens Laterais Seguras:** Flancos externos com reserva de espaço para que artes laterais ou elementos fixos nunca invadam o conteúdo central (`padding-inline: 2.5rem`).

---

## 8. Scrollbar Própria (Apple-Grade Clear & Minimal)

Nenhum app ou página deve exibir a barra de rolagem cinza e rígida padrão do sistema operacional.

### 8.1 Especificação Global (Janela e Contêineres)
* **Largura:** `8px` (`--scrollbar-width`).
* **Trilho (Track):** `background: transparent;` (invisível, integrando-se à superfície).
* **Indicador (Thumb):** Cápsula flutuante arredondada (`border-radius: 9999px`) com respiro ótico (`border: 2px solid transparent; background-clip: padding-box;`).
* **Cores:**
  - *Claro:* `rgba(100, 116, 139, 0.32)` | Hover: `rgba(100, 116, 139, 0.55)`
  - *Escuro:* `rgba(148, 163, 184, 0.3)` | Hover: `rgba(148, 163, 184, 0.58)`
* **Suporte:** WebKit (Chrome/Safari/Edge) e CSS Scrollbars Standard (`scrollbar-width: thin; scrollbar-color: ...`).

### 8.2 Componente Reutilizável (`ScrollArea`)
Disponível em `@noduct/design-system`:
```astro
---
import { ScrollArea } from '@noduct/design-system';
---
<ScrollArea maxHeight="320px" orientation="vertical" mask={true}>
  <!-- Conteúdo longo, tabela ou lista rolável -->
</ScrollArea>
```
* Propriedade `mask={true}` adiciona máscara de gradiente CSS nas bordas superior e inferior, promovendo um desvanecimento suave do conteúdo que entra e sai da área visível.

---

## 9. Padrões de implementação para ferramentas

Além do Contrato, toda ferramenta segue estes padrões de interface. Os itens 1, 3, 4 e 5 também são verificados por guardrails ([matriz](guardrails.md)); os demais são revisados no PR.

1. **Padrão 1: Consumo Universal de Tokens**
   Proibido declarar transições manuais como `transition: all .2s ease` ou escalas arbitrárias. Use sempre as variáveis semânticas de `--ease-apple` e `--duration-*`.
2. **Padrão 2: GPU-Only Transitions (Anti-Jank)**
   Nunca anime `width`, `height`, `top`, `left`, `margin` ou `padding` em interações de hover/clique. Use exclusivamente `transform` e `opacity`.
3. **Padrão 3: Contraste WCAG AA Inegociável**
   Tanto em tema claro quanto escuro, todo texto legível deve atender ou exceder a razão de contraste de 4.5:1. Textos secundários usam `--color-text-secondary` e terciários `--color-text-muted`.
4. **Padrão 4: Shell e template compartilhados**
   Toda ferramenta independente deve usar `<AppShell>` envolvendo `<ToolPage>` do `@noduct/design-system`. O template fornece breadcrumb, título, área funcional e patrocínio com os tokens globais.
5. **Padrão 5: Conformidade com `prefers-reduced-motion`**
   Com `prefers-reduced-motion: reduce` ou a preferência “Reduzir animações” do Settings, os tokens `--duration-*` caem para `0.001ms` e as escalas ativas para `1` (`tokens.css`); a base global força `transition-duration` e `animation-duration` em `0ms` e `transform: none` (`base.css`). Não declare durações fora dos tokens.
6. **Padrão 6: Scrollbar Limpa e Transparente**
   Áreas roláveis internas de micro-apps (tabelas de dados, editores de texto, visualizadores JSON) devem usar o componente `<ScrollArea>` ou herdar o estilo de scrollbar customizada do sistema.
7. **Padrão 7: Foco Ótico Sem Anel Duplo**
   Campos de formulário (`input`, `textarea`, `select`) integrados a contêineres estilizados nunca devem exibir contorno ou sombra nativa direta no elemento interno, delegando o anel de foco ótico para a cápsula externa via `:focus-within`.

---

## 10. Checklist de Validação de Qualidade

Antes de publicar qualquer alteração no Hub ou em um novo micro-app:
- [ ] `npm run check -- types` (zero erros TypeScript).
- [ ] `npm test` (testes unitários de catálogo, busca e patrocínios válidos).
- [ ] `npm run check -- seo` (todas as páginas HTML possuem exatamente 1 H1, canonical e meta description).
- [ ] Navegação 100% por teclado com um único indicador de foco visível, sem contornos sobrepostos.
- [ ] Scrollbar flutuante limpa sem faixas cinzas nativas do browser.
- [ ] Teste em janela anônima no Chrome DevTools com emulação Mobile e Dark Theme.
- [ ] `npm run verify` verde (definição de pronto do [AGENTS.md](../AGENTS.md)).
