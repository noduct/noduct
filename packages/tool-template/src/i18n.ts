import type { Locale } from '@noduct/tool-runtime';

export const toolMessages = {
  en: {
    name: 'Text Cleanup Demo',
    description: 'Clean repeated spaces and blank lines in text.',
    privacy: 'Your text is processed in this browser and is not uploaded.',
    toolTitle: 'Clean up text',
    dropLabel: 'Choose a text file',
    dropDescription: 'Drop a .txt file here, or paste the text below',
    useFile: 'Use this file',
    label: 'Text to clean',
    placeholder: 'Paste text with extra spaces or blank lines',
    process: 'Clean text',
    clear: 'Clear',
    empty: 'Enter some text first.',
    downloadTitle: 'Your cleaned text is ready',
    resultFileName: 'cleaned-text.txt',
    howTitle: 'How it works',
    how: [
      'Paste text, choose a .txt file, or pick one from your Local Workspace.',
      'Select Clean text.',
      'Download the result, or save it to your Local Workspace.'
    ],
    limitsTitle: 'Limitations',
    limits:
      'This example removes repeated spaces and reduces three or more line breaks to two. It does not review meaning or grammar.',
    relatedTitle: 'Related tools',
    related: 'Related links appear only after those apps are published.'
  },
  'pt-BR': {
    name: 'Demonstração de limpeza de texto',
    description: 'Limpe espaços repetidos e linhas em branco de um texto.',
    privacy: 'Seu texto é processado neste navegador e não é enviado para nenhum servidor.',
    toolTitle: 'Limpar texto',
    dropLabel: 'Escolher arquivo de texto',
    dropDescription: 'Solte um arquivo .txt aqui ou cole o texto abaixo',
    useFile: 'Usar este arquivo',
    label: 'Texto para limpar',
    placeholder: 'Cole um texto com espaços extras ou linhas em branco',
    process: 'Limpar texto',
    clear: 'Limpar campo',
    empty: 'Digite ou cole algum texto primeiro.',
    downloadTitle: 'Seu texto limpo está pronto',
    resultFileName: 'texto-limpo.txt',
    howTitle: 'Como funciona',
    how: [
      'Cole o texto, escolha um arquivo .txt ou selecione um da sua Área Local.',
      'Selecione Limpar texto.',
      'Baixe o resultado ou salve-o na Área Local.'
    ],
    limitsTitle: 'Limitações',
    limits:
      'Este exemplo remove espaços repetidos e reduz três ou mais quebras de linha para duas. Ele não revisa o sentido nem a gramática.',
    relatedTitle: 'Ferramentas relacionadas',
    related: 'Os links relacionados aparecem somente depois que esses aplicativos são publicados.'
  },
  es: {
    name: 'Demostración de limpieza de texto',
    description: 'Limpia espacios repetidos y líneas en blanco de un texto.',
    privacy: 'Tu texto se procesa en este navegador y no se envía a ningún servidor.',
    toolTitle: 'Limpiar texto',
    dropLabel: 'Elegir un archivo de texto',
    dropDescription: 'Arrastra un archivo .txt aquí o pega el texto abajo',
    useFile: 'Usar este archivo',
    label: 'Texto para limpiar',
    placeholder: 'Pega un texto con espacios adicionales o líneas en blanco',
    process: 'Limpiar texto',
    clear: 'Borrar campo',
    empty: 'Escribe o pega algún texto primero.',
    downloadTitle: 'Tu texto limpio está listo',
    resultFileName: 'texto-limpio.txt',
    howTitle: 'Cómo funciona',
    how: [
      'Pega el texto, elige un archivo .txt o selecciona uno de tu área local.',
      'Selecciona Limpiar texto.',
      'Descarga el resultado o guárdalo en el área local.'
    ],
    limitsTitle: 'Limitaciones',
    limits:
      'Este ejemplo elimina espacios repetidos y reduce tres o más saltos de línea a dos. No revisa el sentido ni la gramática.',
    relatedTitle: 'Herramientas relacionadas',
    related: 'Los enlaces relacionados aparecen solo después de que esas aplicaciones se publiquen.'
  }
} satisfies Record<Locale, Record<string, string | string[]>>;
