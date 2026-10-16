# Governança de Recursos e Proteção de Memória (ResourceBudget)

Este documento estabelece o modelo de tetos operacionais preventivos e gestão orçamentária de recursos computacionais executados 100% no cliente pelo ecossistema Noduct.

---

## 1. Motivação e Proteção Anti-Crash

Processamento documental no navegador ocorre na memória RAM do dispositivo do usuário. A manipulação de arquivos PDF de dezenas de megabytes com alta densidade de vetores e imagens pode expandir o consumo de memória em 5 a 10 vezes durante a decodificação da árvore de objetos.

Em navegadores modernos, ultrapassar a cota de memória permitida pelo sistema operacional acarreta no encerramento abrupto da aba (*tab crash / out of memory*), gerando frustração e perda total do trabalho em andamento.

O módulo `ResourceBudget` do `@noduct/workspace-core` atua **antes** de qualquer carregamento pesado, avaliando metadados dos arquivos e decidindo preventivamente se o lote é seguro.

---

## 2. Matriz de Tetos por Plataforma

Os limites operacionais diferenciam dispositivos móveis (com menor memória disponível e maior restrição térmica) de computadores desktop:

| Recurso | Desktop | Mobile / Tablet | Ação em Violação |
|---|---|---|---|
| **Tamanho máx. por arquivo individual** | 100 MB | 25 MB | `blocked` (bloqueio preventivo) |
| **Tamanho máx. do lote total** | 200 MB | 50 MB | `blocked` (bloqueio preventivo) |
| **Limite de páginas por operação** | 500 páginas | 100 páginas | `blocked` (bloqueio preventivo) |
| **Limite de arquivos simultâneos** | 20 arquivos | 8 arquivos | `blocked` (bloqueio preventivo) |
| **Armazenamento máximo no Workspace** | 250 MB | 75 MB | `blocked` (requer limpeza de arquivos) |
| **Zona de Atenção (> 80% do teto)** | > 160 MB | > 40 MB | `warning` (aviso ao usuário, prossegue com confirmação) |

---

## 3. Heurística de Detecção de Dispositivo

A detecção de plataforma utiliza uma combinação determinística e resiliente:
1. `screenWidth`: larguras inferiores a `768px` ativam automaticamente o perfil `mobile`.
2. `navigator.userAgent`: detecção de padrões móveis (`Mobi`, `Android`, `iPhone`, `iPad`).
3. Fallback conservador: caso os dados sejam inconclusivos, prevalece o perfil mais seguro para a operação.

---

## 4. API de Avaliação

A função `evaluateResourceBudget` avalia o conjunto de arquivos propostos contra o perfil ativo:

```ts
import { evaluateResourceBudget } from '@noduct/workspace-core';

const result = await evaluateResourceBudget({
  inputs: [
    { size: file1.size, name: file1.name, pageCount: 12 },
    { size: file2.size, name: file2.name, pageCount: 8 }
  ],
  currentWorkspaceSizeBytes: 15 * 1024 * 1024
});

if (result.decision === 'blocked') {
  showBlockingAlert(result.reason);
} else if (result.decision === 'warning') {
  showWarningConfirmation(result.reason);
} else {
  proceedWithOperation();
}
```

