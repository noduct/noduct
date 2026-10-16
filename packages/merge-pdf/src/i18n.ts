import type { DesignLocale } from '@noduct/design-system';

export interface MergeMessages {
  name: string;
  category: string;
  description: string;
  privacyNotice: string;
  breadcrumb: string;
  dropLabel: string;
  dropDescription: string;
  listLabel: string;
  actionMerge: string;
  minFilesRequired: string;
  processingLabel: string;
  statusValidating: string;
  statusMerging: string;
  statusSaving: string;
  downloadTitle: string;
  downloadFileName: string;
  errorEncrypted: (name: string) => string;
  errorCorrupted: (name: string) => string;
  howTitle: string;
  how: string[];
  limitsTitle: string;
  limits: string;
  securityTitle: string;
  security: string;
}

export const mergeMessages: Record<DesignLocale, MergeMessages> = {
  en: {
    name: 'Merge PDF',
    category: 'PDF Tools',
    description: 'Combine multiple PDF files into one document directly in your browser.',
    privacyNotice: 'Your PDF files are processed locally in your browser and never leave your device.',
    breadcrumb: 'Breadcrumb',
    dropLabel: 'Choose PDF files',
    dropDescription: 'Drop PDF files here or select them from your computer',
    listLabel: 'Files to merge in specified order',
    actionMerge: 'Merge PDF files',
    minFilesRequired: 'Select at least 2 PDF files to merge.',
    processingLabel: 'Merging PDF documents',
    statusValidating: 'Inspecting PDF files...',
    statusMerging: 'Combining pages into a unified document...',
    statusSaving: 'Finalizing PDF output...',
    downloadTitle: 'Your merged PDF is ready',
    downloadFileName: 'merged.pdf',
    errorEncrypted: (name: string) =>
      `"${name}" is password-protected. Please remove it or provide an unencrypted version.`,
    errorCorrupted: (name: string) =>
      `"${name}" is corrupted or could not be parsed as a valid PDF.`,
    howTitle: 'How to merge PDF files',
    how: [
      'Select or drag and drop 2 or more PDF documents into the file area.',
      'Reorder the files using the drag handle, arrow buttons, or keyboard shortcuts to set your desired page sequence.',
      'Click "Merge PDF files" to initiate client-side merging.',
      'Download the merged PDF file immediately to your computer.'
    ],
    limitsTitle: 'Limitations & file capacity',
    limits:
      'Processing occurs entirely within your browser memory. For optimal performance, we recommend batches of up to 50 files or 250 MB total. Password-protected files must be unlocked prior to merging.',
    securityTitle: 'Privacy & Security Guarantee',
    security:
      'Noduct tools operate with 0% server uploads. Data never leaves your machine: your documents remain completely private.'
  },
  'pt-BR': {
    name: 'Mesclar PDF',
    category: 'Ferramentas de PDF',
    description: 'Junte vários arquivos PDF em um único documento diretamente no seu navegador.',
    privacyNotice: 'Seus arquivos PDF são processados localmente no navegador e nunca saem do seu dispositivo.',
    breadcrumb: 'Caminho de navegação',
    dropLabel: 'Escolher arquivos PDF',
    dropDescription: 'Solte arquivos PDF aqui ou selecione no seu computador',
    listLabel: 'Arquivos a mesclar na ordem especificada',
    actionMerge: 'Mesclar arquivos PDF',
    minFilesRequired: 'Selecione pelo menos 2 arquivos PDF para mesclar.',
    processingLabel: 'Mesclando documentos PDF',
    statusValidating: 'Inspecionando arquivos PDF...',
    statusMerging: 'Unindo páginas em um documento consolidado...',
    statusSaving: 'Finalizando arquivo PDF...',
    downloadTitle: 'Seu PDF mesclado está pronto',
    downloadFileName: 'documento-mesclado.pdf',
    errorEncrypted: (name: string) =>
      `"${name}" está protegido por senha. Remova-o ou utilize uma versão sem senha.`,
    errorCorrupted: (name: string) =>
      `"${name}" está corrompido ou não é um documento PDF válido.`,
    howTitle: 'Como mesclar arquivos PDF',
    how: [
      'Selecione ou arraste 2 ou mais documentos PDF para a área de arquivos.',
      'Reordene os arquivos utilizando a alça de arrasto, os botões ou o teclado para definir a sequência desejada.',
      'Clique em "Mesclar arquivos PDF" para executar a junção no seu navegador.',
      'Baixe o arquivo PDF unificado imediatamente para o seu dispositivo.'
    ],
    limitsTitle: 'Limitações e capacidade',
    limits:
      'O processamento ocorre integralmente na memória do seu navegador. Para melhor desempenho, recomendamos lotes de até 50 arquivos ou 250 MB no total. Arquivos protegidos por senha precisam ser desbloqueados previamente.',
    securityTitle: 'Garantia de Privacidade e Segurança',
    security:
      'As ferramentas Noduct operam sem envio de dados para servidores. Nenhum dado sai do seu dispositivo: seus documentos permanecem 100% seguros.'
  },
  es: {
    name: 'Combinar PDF',
    category: 'Herramientas de PDF',
    description: 'Une varios archivos PDF en un solo documento directamente en tu navegador.',
    privacyNotice: 'Tus archivos PDF se procesan localmente en el navegador y nunca salen de tu dispositivo.',
    breadcrumb: 'Ruta de navegación',
    dropLabel: 'Elegir archivos PDF',
    dropDescription: 'Arrastra archivos PDF aquí o selecciónalos de tu equipo',
    listLabel: 'Archivos a combinar en el orden especificado',
    actionMerge: 'Combinar archivos PDF',
    minFilesRequired: 'Selecciona al menos 2 archivos PDF para combinar.',
    processingLabel: 'Combinando documentos PDF',
    statusValidating: 'Inspeccionando archivos PDF...',
    statusMerging: 'Uniendo páginas en un documento consolidado...',
    statusSaving: 'Finalizando archivo PDF...',
    downloadTitle: 'Tu PDF combinado está listo',
    downloadFileName: 'documento-combinado.pdf',
    errorEncrypted: (name: string) =>
      `"${name}" está protegido por contraseña. Quítalo o usa una versión sin contraseña.`,
    errorCorrupted: (name: string) =>
      `"${name}" está dañado o no es un documento PDF válido.`,
    howTitle: 'Cómo combinar archivos PDF',
    how: [
      'Selecciona o arrastra 2 o más documentos PDF al área de archivos.',
      'Reordena los archivos usando el control de arrastre, los botones o el teclado para fijar el orden deseado.',
      'Haz clic en "Combinar archivos PDF" para ejecutar la unión en tu navegador.',
      'Descarga el archivo PDF unificado de inmediato a tu equipo.'
    ],
    limitsTitle: 'Limitaciones y capacidad',
    limits:
      'El procesamiento se realiza por completo en la memoria del navegador. Para un rendimiento óptimo, se recomiendan lotes de hasta 50 archivos o 250 MB en total. Los archivos con contraseña deben desbloquearse previamente.',
    securityTitle: 'Garantía de Privacidad y Seguridad',
    security:
      'Las herramientas de Noduct funcionan sin subir datos a servidores. Ningún archivo sale de tu equipo: tus documentos permanecem 100% privados.'
  }
};
