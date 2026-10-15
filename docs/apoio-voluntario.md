# Apoio voluntário — Buy Me a Coffee

## Estado e objetivo

Implementação do convite discreto e opcional para contribuição voluntária com o desenvolvimento da Tolvira, via Buy Me a Coffee. A contribuição é voluntária e não concede publicidade, recursos pagos, tratamento prioritário nem remoção de anúncios.

## Configuração

A configuração fica isolada em `src/config/site.ts`:

```ts
support: {
  enabled: true,
  provider: 'buy-me-a-coffee',
  url: 'https://buymeacoffee.com/plajiw'
}
```

A ativação é independente do modo comercial de patrocínios (`sponsor.commercialMode`). O link só é gerado no build caso `enabled` seja `true` e a URL pública passe pela validação rigorosa (`src/lib/support.ts`).

### Requisitos de validação da URL
- Protocolo HTTPS obrigatório.
- Host oficial exato `buymeacoffee.com`.
- Presença de caminho de conta pública (ex.: `/usuario`).
- Ausência de credenciais, parâmetros de busca/checkout (`?query=`) ou âncoras (`#hash`).

## Exibição no Hub

O convite é apresentado no rodapé (`src/components/layout/Footer.astro`), na coluna da marca (`brandCol`), logo após a descrição institucional do projeto (`tagline`):

- **Formato:** Uma frase e um link HTML direto, sem JavaScript obrigatório e sem carregamento de widgets, iframes, fontes ou scripts de terceiros durante a navegação.
- **Atributos:** Abre em nova aba com `target="_blank"`, `rel="noopener noreferrer"` e rótulo acessível explícito informando a abertura externa.
- **Estilo:** Usa tipografia secundária e tokens existentes do Design System, mantendo discrição, foco acessível e contraste WCAG AA.
- **Separação de patrocínios:** Não ocupa espaço do `SponsorRail` ou de placements patrocinados pagos.
