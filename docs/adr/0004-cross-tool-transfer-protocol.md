# ADR 0004: Protocolo de Transferência Entre Ferramentas Locais (Cross-Tool Transfer)

- **Status:** Aprovado
- **Data:** 2026-10-16
- **Contexto:** Issue #18 (M2.2)

---

## 1. Contexto e Problema

No ecossistema Noduct, os usuários executam cadeias de operações em arquivos locais (por exemplo, extrair páginas em uma ferramenta e continuar em outra para mesclagem ou conversão).
Exigir que o usuário baixe o documento resultante e faça upload manual na próxima ferramenta gera atrito desnecessário e consome armazenamento duplo.

Contudo, trafegar bytes de arquivos ou dados confidenciais via parâmetros de URL (`GET /target-tool?data=...` ou fragmentos com hash) é uma violação grave de privacidade e segurança, pois:
- Expõe nomes de arquivos e dados confidenciais no histórico do navegador.
- Cria URLs gigantescas propensas a truncamento por limites de tamanho de URL de navegadores e proxies.
- Facilita vazamento acidental caso o usuário copie e compartilhe a URL com terceiros.

---

## 2. Decisão

Adotar um protocolo de transferência baseado em **tickets opacos e efêmeros** no `IndexedDB` de mesma origem:

1. **Ticket Opaco:** O ticket consiste apenas em um UUIDv4 criptograficamente aleatório gerado no cliente.
2. **Armazenamento Seguro:** O ticket é registrado na store `transfers` do `noduct_workspace_db` com:
   - `transferId`: UUIDv4
   - `documentId`: referência ao `Blob` já presente no banco local
   - `sourceTool`: ferramenta de origem
   - `targetTool`: ferramenta autorizada a receber o documento
   - `createdAt` e `expiresAt`: TTL curto (padrão de 15 minutos)
3. **Navegação com URL Higienizada:** A ferramenta de origem gera a navegação para a ferramenta alvo contendo apenas `?transferId=<uuid>`. Nenhum byte de documento, nome ou metadado é embutido na URL.
4. **Resolução de Consumo Único:** Ao carregar, a ferramenta alvo chama `resolveTransfer(transferId, currentTool)`. O ticket é imediatamente marcado como consumido (`consumedAt: Date.now()`), impossibilitando reutilização posterior por recarregamento acidental ou outra sessão.
5. **Limpeza Imediata da Barra de Endereços:** A ferramenta executa `history.replaceState` removendo o parâmetro `transferId` da URL, mantendo a barra de navegação limpa caso o usuário a copie ou favorite a página.
6. **Autolimpeza Periódica:** Tickets expirados ou consumidos são purgados automaticamente pelo método `cleanupExpiredTransfers()`.

---

## 3. Consequências

### Positivas
- Zero vazamento de dados confidenciais em logs de navegação ou histórico.
- Transferência instantânea de arquivos grandes (sem serialização em base64 ou re-download).
- Resiliência contra links reutilizados ou compartilhados acidentalmente.
- Operação 100% no cliente sem backend ou dependência de rede externa.

### Limitações e Mitigações
- O protocolo funciona estritamente entre ferramentas na mesma origem web (`https://noduct.github.io`). Transferências entre origens diferentes ou dispositivos distintos não são suportadas por design.

