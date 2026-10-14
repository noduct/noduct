# Padrões de Interface e Guardrails — Tolvira

## 1. Filosofia e Direção Visual

A interface do ecossistema Tolvira segue a filosofia **Quiet Productivity**, inspirada nos princípios de precisão, ergonomia e sofisticação tátil dos produtos Apple (macOS / iOS Human Interface Guidelines), Raycast e Linear:

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
* **H1 (Título da Página / Hero):** `font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.15;`
* **H2 (Títulos de Seção / App library):** `font-size: clamp(1.2rem, 2.5vw, 1.45rem); font-weight: 650; letter-spacing: -0.02em;`
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
* **Hover de Superfície (`--color-surface-hover`):** `#edf1f7`
* **Bordas (`--color-border`):** `#e2e8f0` (1px) | Forte: `#cbd5e1` | Sutil: `#edf2f7`
* **Texto Principal (`--color-text`):** `#0f172a` (Contraste ~15:1)
* **Texto Secundário (`--color-text-secondary`):** `#475569` (Contraste ~7.5:1)
* **Texto Atenuado (`--color-text-muted`):** `#596780` (Contraste ~5.1:1)
* **Primária / Ação (`--color-primary`):** `#2563eb` | Hover: `#1d4ed8`

### 3.2 Modo Escuro (Dark Theme)
* **Canvas de Fundo (`--color-background`):** `#0b0f17`
* **Superfície Base (`--color-surface`):** `#111827`
* **Cartões e Ilhas (`--color-surface-card`):** `#161f30`
* **Superfície Rebaixada (`--color-surface-sunken`):** `#0f172a`
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
* `--radius-xl: 14px;` — Modais e cartões de destaque amplo.

### 4.2 Iluminação Especular (*Rim Light*)
Todos os cartões e superfícies elevadas combinam sombra difusa com linha interna especular superior de 1px:
```css
box-shadow: var(--shadow-sm), var(--rim-light);
```
* **Light:** `inset 0 1px 0 0 rgba(255, 255, 255, 0.7)` (realce de borda limpa).
* **Dark:** `inset 0 1px 0 0 rgba(255, 255, 255, 0.08)` (bisel sutil de volume tridimensional).

---

## 5. Botões e Ações Interativas

### 5.1 Anatomia e Estilos
* **Botão Primário (`.button`):** Fundo `--color-primary`, texto branco, borda sólida ou transparente, sombra suave e rim light.
* **Botão Secundário (`.button.secondary`):** Fundo `--color-surface-card`, borda `--color-border`, texto `--color-text`.
* **Botão Ghost (`.btn-ghost` / `.navLink`):** Fundo transparente, ganhando `--color-surface-hover` no hover.
* **Botão de Ícone (`.themeToggle`, `.menuButton`):** Proporções quadradas (38x38px ou 40x40px), cantos `--radius-sm`, centralização `display: grid; place-items: center;`.

### 5.2 Feedback Físico
* **Hover (Pointer fino):**
  ```css
  @media (hover: hover) and (pointer: fine) {
    .button:hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
    }
  }
  ```
* **Active (Pressionamento mecânico instantâneo):**
  ```css
  .button:active {
    transform: scale(var(--scale-active-button)); /* 0.98 */
    transition-duration: var(--duration-instant);  /* 100ms */
  }
  ```

---

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
Disponível em `@tolvira/design-system` e `src/components/ui/ScrollArea.astro`:
```astro
---
import { ScrollArea } from '@tolvira/design-system';
---
<ScrollArea maxHeight="320px" orientation="vertical" mask={true}>
  <!-- Conteúdo longo, tabela ou lista rolável -->
</ScrollArea>
```
* Propriedade `mask={true}` adiciona máscara de gradiente CSS nas bordas superior e inferior, promovendo um desvanecimento suave do conteúdo que entra e sai da área visível.

---

## 9. Guardrails Contratuais para Novos Apps (`tool-template`)

Qualquer micro-aplicativo ou extensão do Tolvira **deve obedecer impreterivelmente** aos seguintes 7 guardrails:

1. **Guardrail 1: Consumo Universal de Tokens**
   Proibido declarar transições manuais como `transition: all .2s ease` ou escalas arbitrárias. Use sempre as variáveis semânticas de `--ease-apple` e `--duration-*`.
2. **Guardrail 2: GPU-Only Transitions (Anti-Jank)**
   Nunca anime `width`, `height`, `top`, `left`, `margin` ou `padding` em interações de hover/clique. Use exclusivamente `transform` e `opacity`.
3. **Guardrail 3: Contraste WCAG AA Inegociável**
   Tanto em tema claro quanto escuro, todo texto legível deve atender ou exceder a razão de contraste de 4.5:1. Textos secundários usam `--color-text-secondary` e terciários `--color-text-muted`.
4. **Guardrail 4: Herança do `ToolFrame`**
   Toda ferramenta independente deve ser envolvida pelo componente `<ToolFrame>` do `@tolvira/design-system`, que já injeta o reset global de tipografia, foco e suporte a movimento reduzido.
5. **Guardrail 5: Conformidade com `prefers-reduced-motion`**
   Quando o usuário solicitar movimento reduzido, todas as durações devem ser zeradas (`0.001ms`) e escalas anuladas (`transform: none !important`).
6. **Guardrail 6: Scrollbar Limpa e Transparente**
   Áreas roláveis internas de micro-apps (tabelas de dados, editores de texto, visualizadores JSON) devem usar o componente `<ScrollArea>` ou herdar o estilo de scrollbar customizada do sistema.
7. **Guardrail 7: Foco Ótico Sem Anel Duplo**
   Campos de formulário (`input`, `textarea`, `select`) integrados a contêineres estilizados nunca devem exibir contorno ou sombra nativa direta no elemento interno, delegando o anel de foco ótico para a cápsula externa via `:focus-within`.

---

## 10. Checklist de Validação de Qualidade

Antes de publicar qualquer alteração no Hub ou em um novo micro-app:
- [ ] `npm run typecheck` (zero erros TypeScript).
- [ ] `npm test` (testes unitários de catálogo, busca e patrocínios válidos).
- [ ] `npm run validate:seo` (todas as páginas HTML possuem exatamente 1 H1, canonical e meta description).
- [ ] Navegação 100% por teclado com foco visível e halo ótico duplo.
- [ ] Scrollbar flutuante limpa sem faixas cinzas nativas do browser.
- [ ] Teste em janela anônima no Chrome DevTools com emulação Mobile e Dark Theme.
