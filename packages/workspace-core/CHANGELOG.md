# Changelog

## 0.2.0 — 2026-10-19

- Schema v3: retenção efêmera de 24 horas, migração não destrutiva do v2 e erros por código.
- `acquireDocument()` segura um Web Lock compartilhado até `release()`; a limpeza exige lock exclusivo.
- Erros distintos para schema mais novo e upgrade bloqueado por outra aba.
- O contrato de erros e os campos de retenção substituem a API anterior; consumidores devem traduzir os códigos.
