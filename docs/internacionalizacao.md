# Internacionalização

## Idiomas e detecção

O hub publica conteúdo completo em inglês, português brasileiro e espanhol. O inglês usa URLs sem prefixo; português usa `/pt-br/` e espanhol usa `/es/`.

Na entrada por uma URL inglesa, um script curto no `head` consulta somente `navigator.languages` e `navigator.language`. Qualquer variante de português usa PT-BR, qualquer variante de espanhol usa espanhol e qualquer idioma não mapeado permanece em inglês. Ao redirecionar, o script oculta o documento inglês (`display: none`) para que ele não seja estilizado nem pintado enquanto a versão traduzida carrega. O idioma nunca é salvo em `localStorage`: os links do menu permitem visitar diretamente outra tradução, mas uma nova entrada pela raiz volta a seguir exclusivamente o navegador. Não há cookie nem parâmetro de URL.

URLs localizadas acessadas diretamente são respeitadas para permitir compartilhamento, indexação e navegação previsível. Sem JavaScript, a URL sem prefixo entrega o conteúdo inglês como fallback.

## Fontes de verdade

`src/data/tools.json` contém apenas a estrutura técnica do catálogo. Traduções de nomes, descrições e palavras-chave usam o mesmo `id` estável em `src/i18n/catalog/`. Textos da interface e das páginas ficam no contrato tipado `src/i18n/messages.ts`.

Código, IDs, slugs e URLs continuam em inglês. Conteúdo público é escrito de forma direta para pessoas comuns, preservando explicações técnicas quando elas ajudam a tomar uma decisão.

## SEO

Cada página localizada possui `lang`, title, description e canonical próprios. Todas incluem alternates recíprocos para `en`, `pt-BR`, `es` e `x-default`, que aponta para inglês.

## Cobertura e validação

`npm run validate:i18n` compara todos os IDs do catálogo com os catálogos traduzidos e rejeita nomes, descrições, palavras-chave ou mensagens vazias. O contrato TypeScript exige a mesma estrutura de mensagens nos três idiomas. Revisão humana continua obrigatória para clareza, tom e precisão.
