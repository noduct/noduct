# Área Local: especificação de interface

Especificação de UX da Área Local decidida no [ADR 0006](../adr/0006-hybrid-local-workspace.md). O ADR registra as decisões; este documento detalha a arquitetura de informação, os fluxos, os estados e os requisitos que cada superfície precisa cumprir. Os requisitos verificáveis estão em [openspec/specs/local-workspace](../../openspec/specs/local-workspace/spec.md).

## 1. Arquitetura de informação

```text
NODUCT
├── Home (/, /pt-br/, /es/)
│   └── Seção «Sua Área de Trabalho»
│       ├── sem documentos: valor do recurso + «Abrir a Área de Trabalho»
│       └── com documentos: até 6 recentes com miniatura, baixar/excluir + total + «Ver todos»
├── Ferramenta (/merge-pdf/…)
│   ├── DropZone: [Do dispositivo] [Da Área Local]
│   │   └── WorkspacePicker: busca · compatíveis · seleção · [Adicionar à operação] · «Gerenciar arquivos»
│   └── Resultado: [Baixar] [Salvar na Área Local] · prévia da primeira página
└── Página /workspace/
    ├── busca, ordenação (recentes, nome, tamanho), adicionar arquivos
    ├── lista com miniatura, tamanho, retenção e ações (baixar, manter/permitir expiração, excluir)
    ├── uso: total dos documentos do Noduct e estimativa do navegador
    └── aviso: local a este navegador, não sincroniza, não é backup
```

---

## 2. Fluxos prioritários

| Fluxo                         | Caminho                                                                                       | Garantia                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A. Visitante pontual          | URL da ferramenta → dispositivo → processar → baixar                                          | Nada é gravado; a Área Local não aparece como obstáculo                |
| B. Reutilização               | Ferramenta → `Da Área Local` → buscar e marcar → confirmar → ajustar ordem → processar        | Selecionado no painel ≠ adicionado à operação                          |
| C. Sequência de operações     | Processar → `Salvar na Área Local` → abrir outra ferramenta → `Da Área Local`                 | Resultado disponível sem baixar e reenviar                             |
| D. Gestão e espaço            | Home → `Ver todos` → buscar → excluir com confirmação → total atualizado                      | Home, seletor e página leem a mesma fonte e se atualizam por evento    |
| E. Entrada direta pelo buscador | Ferramenta → percebe as duas origens sem visitar a home                                     | A descoberta não depende de home nem de topbar                         |

---

## 3. Estados mínimos por superfície

| Superfície | Estados                                                                                 |
| ---------- | --------------------------------------------------------------------------------------- |
| Home       | apresentação (sem banco ou indisponível), recentes com ações, exclusão confirmada        |
| Seletor    | fechado, carregando, vazio, com documentos, busca sem resultado, seleção, adicionando, erro, indisponível |
| Resultado  | baixar; salvar: inativo, salvando, salvo, falha                                         |
| Página     | carregando, vazio, lista, busca sem resultado, operação pendente, erro, indisponível    |

---

## 4. Privacidade e comunicação sobre armazenamento

- Os documentos ficam no IndexedDB **deste navegador, nesta origem**. Não sincronizam entre dispositivos nem navegadores, e não há conta nem nuvem.
- A cópia de interface usa “neste navegador”, nunca “salvo com segurança” nem “backup”. Limpar os dados do site remove tudo, inclusive os documentos mantidos.
- O medidor separa o **total exato** dos documentos do Noduct da **estimativa** de uso do site (`navigator.storage.estimate()`), rotulada como estimativa. Não exibe a cota como capacidade garantida.
- Miniaturas são **conteúdo derivado** do documento: ficam no mesmo IndexedDB e são apagadas com ele.
- `navigator.storage.persist()` não é pedido automaticamente. O Firefox mostra uma permissão para isso, e o pedido só faria sentido após pesquisa com usuários.

---

## 5. Requisitos não funcionais

- **Acessibilidade:** WCAG 2.1 AA e axe sem violações nos dois temas, inclusive com o seletor aberto. Teclado completo, alvos de 44 px, rótulos de checkbox com o nome do arquivo, seleção comunicada sem depender de cor, anúncios em `aria-live` e foco devolvido ao gatilho.
- **Desempenho:** listar não lê payloads (`listDocumentSummaries`, ver #41). A miniatura usa leitura parcial, fila de concorrência 1 e PDF.js sob demanda. Object URLs são revogados ao re-renderizar e ao fechar.
- **Consistência:** uma fonte de verdade (`workspace-core`) e um runtime de UI (`workspace-ui`) para home, seletor, página e resultado. Mudanças em outra aba chegam por `BroadcastChannel`.
- **CSP (#33):** o renderer exige `worker-src 'self'` e `img-src blob:`. Não precisa de `wasm-unsafe-eval`, porque o adaptador usa `useWasm: false` (imagens JPEG 2000 e JBIG2 podem sair em branco na miniatura). A compatibilidade com `script-src` sem `unsafe-eval` deve ser confirmada na #33 com a política real ativa.
- **i18n:** en, pt-BR e es em todas as superfícies, anúncios e erros. Códigos de `WorkspaceError` e do renderer são traduzidos na UI.


## 6. Plano de avaliação

Hipótese: o modelo híbrido melhora a descoberta e a reutilização sem dificultar o uso pontual. Tarefas: (1) mesclar dois PDFs novos sem salvar; (2) mesclar dois PDFs já guardados; (3) salvar um resultado e usá-lo em outra ferramenta; (4) localizar e excluir um documento antigo; (5) explicar onde os arquivos ficam e se aparecem em outro dispositivo; (6) repetir a tarefa 2 entrando direto pela URL da ferramenta. Observar a descoberta espontânea de `Da Área Local`, a conclusão sem ajuda e a confusão entre “selecionado” e “adicionado”.
