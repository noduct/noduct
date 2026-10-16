# Diretrizes de engenharia — Tolvira

Estas regras se aplicam a todo o repositório.

## Idiomas

- Interface, conteúdo público, metadados, URLs, código e identificadores: inglês.
- Documentação técnica e decisões arquiteturais: português brasileiro.

## Arquitetura

- Use Astro com geração estática como padrão. O HTML essencial, headings, conteúdo, links e metadados devem existir sem JavaScript.
- `pages/` contém rotas e composição; evite lógica de domínio ou grandes blocos de CSS nas páginas.
- `layouts/` contém estrutura compartilhada, landmarks, SEO e slots.
- `components/ui/` contém primitivas visuais; `components/layout/` contém navegação e estrutura; componentes específicos ficam no domínio correspondente.
- `features/` agrupa lógica de funcionalidades, como busca e catálogo.
- `lib/` contém utilitários puros e compartilhados.
- `styles/` contém apenas reset/global, tokens e temas.
- O catálogo tipado continua sendo a fonte de verdade. Não crie páginas falsas para ferramentas independentes.

## CSS e design system

- Use CSS Modules como convenção principal para estilos de componentes (`Component.module.css`).
- Tokens, reset e temas permanecem globais.
- Estilos locais pequenos em `.astro` são aceitáveis quando não houver benefício real em criar módulo; páginas não devem acumular grandes blocos reutilizáveis.
- Alterações globais de cores, espaçamento, largura ou raios devem partir de tokens.
- Componentes compartilhados entre hub e ferramentas pertencem a `packages/design-system` e precisam de uma API pequena e versionável.

## Interatividade, SEO e acessibilidade

- Prefira JavaScript nativo e hidratação seletiva. Não adicione framework de UI sem necessidade comprovada.
- Processamento de arquivos deve ocorrer localmente quando viável e o aviso de privacidade deve refletir o comportamento real.
- Toda página indexável deve ter title, description, canonical e um H1.
- Preserve landmarks, foco visível, navegação por teclado, contraste AA e `prefers-reduced-motion`.
- Ferramentas `planned` não recebem links operacionais nem páginas indexáveis.

## Qualidade

- TypeScript strict é obrigatório.
- Execute lint, typecheck, testes unitários, build/SEO e Playwright proporcionalmente à mudança.
- Atualize a documentação quando contratos, estrutura ou operação mudarem.
- Não versionar secrets, dados financeiros, contatos privados ou conteúdo de arquivos de usuários.
- Não criar repositórios remotos ou publicar sem autorização explícita.

## Automação do GitHub

- Para consultar ou alterar GitHub, use `node scripts/github/manage.mjs` em vez de montar chamadas HTTP, comandos `gh` ou scripts pontuais.
- Para enviar commits ao GitHub, use `npm run github -- push <branch>` e repita com `--execute` somente depois de revisar o plano; não monte cabeçalhos de autenticação do Git manualmente.
- Informe `--repo OWNER/REPOSITORY` sempre que o repositório não estiver inequivocamente definido pelo remoto `origin`.
- Antes de qualquer mutação, consulte o recurso (`get` ou `list`) e execute o comando sem `--execute` para revisar o plano. Use `--execute` apenas quando o alvo e o payload estiverem confirmados.
- Trate epics como issues do GitHub, organizadas por labels, milestone e referências; não crie automações acopladas a números de issues ou epics.
- Nunca exponha, registre ou versione tokens. Use `GITHUB_TOKEN` (preferido), `GH_TOKEN` ou `GITHUB_ACCESS_TOKEN` no ambiente de execução ou no `.env` local e ignorado pelo Git.
- Leia `scripts/github/README.md` para a referência de recursos, payloads e protocolo para agentes.
