# localization Specification

## Purpose
Garante que todo texto visível exista em en, pt-BR e es, e que pacotes de domínio nunca produzam texto de interface.

## Requirements

### Requirement: Três idiomas completos
Todo texto visível SHALL existir em en, pt-BR e es, inclusive em scripts cliente, anúncios `aria-live`, mensagens de erro, rótulos acessíveis e nomes de arquivos gerados.

#### Scenario: Texto literal em componente
- **WHEN** um componente ou script cliente atribui texto visível literal, inclusive `textContent` ou `aria-label`
- **THEN** `npm run check` falha com `no-hardcoded-text`

#### Scenario: Nome do arquivo gerado
- **WHEN** o usuário de pt-BR baixa o resultado de uma ferramenta
- **THEN** o nome sugerido vem das mensagens de pt-BR

### Requirement: Domínio devolve códigos
`pdf-core` e `workspace-core` SHALL devolver códigos e parâmetros; a tradução SHALL acontecer na interface.

#### Scenario: PDF criptografado
- **WHEN** `pdf-core` rejeita um PDF criptografado
- **THEN** o erro tem um código estável e a ferramenta mostra a mensagem do idioma da página

### Requirement: Prefixo de idioma único
O inglês SHALL usar o caminho sem prefixo; pt-BR e es SHALL usar `/pt-br/` e `/es/` depois do base da página, uma única vez, e os nomes de idioma SHALL aparecer no próprio idioma.

#### Scenario: Troca de idioma em ferramenta
- **WHEN** o usuário troca para es no Settings de `/merge-pdf/pt-br/`
- **THEN** a navegação vai para `/merge-pdf/es/`
