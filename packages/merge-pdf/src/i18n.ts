import type { Locale } from '@noduct/tool-runtime';

export interface MergeMessages {
  name: string;
  description: string;
  privacyNotice: string;
  dropLabel: string;
  dropDescription: string;
  listLabel: string;
  actionMerge: string;
  minFilesRequired: string;
  clear: string;
  remove: string;
  removeFile: string;
  oneFileReady: string;
  filesReady: string;
  processingLabel: string;
  statusValidating: string;
  statusMerging: string;
  statusSaving: string;
  downloadTitle: string;
  downloadFileName: string;
  errorEncrypted: string;
  errorCorrupted: string;
  howTitle: string;
  how: string[];
  limitsTitle: string;
  limits: string;
  securityTitle: string;
  security: string;
}

export type MergeClientMessages = Pick<MergeMessages,
  | 'minFilesRequired'
  | 'oneFileReady'
  | 'filesReady'
  | 'remove'
  | 'removeFile'
  | 'errorEncrypted'
  | 'errorCorrupted'
  | 'statusValidating'
  | 'statusMerging'
  | 'statusSaving'
>;

export const mergeMessages: Record<Locale, MergeMessages> = {
  en: {
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document directly in your browser.',
    privacyNotice: 'Your PDF files are processed locally in your browser and never leave your device.',
    dropLabel: 'Choose PDF files',
    dropDescription: 'Drop PDF files here or select them from your computer',
    listLabel: 'Files to merge in specified order',
    actionMerge: 'Merge PDF files',
    minFilesRequired: 'Select at least 2 PDF files to merge.',
    clear: 'Clear',
    remove: 'Remove',
    removeFile: 'Remove {name}',
    oneFileReady: '1 valid PDF selected (select at least 1 more to merge).',
    filesReady: '{files} PDFs ready to merge ({pages} total pages).',
    processingLabel: 'Merging PDF documents',
    statusValidating: 'Inspecting PDF files...',
    statusMerging: 'Combining pages into a unified document...',
    statusSaving: 'Finalizing PDF output...',
    downloadTitle: 'Your merged PDF is ready',
    downloadFileName: 'merged.pdf',
    errorEncrypted: '"{name}" is password-protected. Please remove it or provide an unencrypted version.',
    errorCorrupted: '"{name}" is corrupted or could not be parsed as a valid PDF.',
    howTitle: 'How to merge PDF files',
    how: [
      'Select or drag and drop 2 or more PDF documents into the file area.',
      'Reorder the files using the drag handle, arrow buttons, or keyboard shortcuts to set your desired page sequence.',
      'Click "Merge PDF files" to initiate client-side merging.',
      'Download the merged PDF file immediately to your computer.'
    ],
    limitsTitle: 'Limitations & file capacity',
    limits:
      'Processing occurs entirely in your browser. The limit is 20 files or 200 MB on desktop, and 8 files or 50 MB on mobile. Password-protected files must be unlocked before merging.',
    securityTitle: 'Privacy & Security Guarantee',
    security:
      'Noduct tools operate with 0% server uploads. Data never leaves your machine: your documents remain completely private.'
  },
  'pt-BR': {
    name: 'Mesclar PDF',
    description: 'Junte vários arquivos PDF em um único documento diretamente no seu navegador.',
    privacyNotice: 'Seus arquivos PDF são processados localmente no navegador e nunca saem do seu dispositivo.',
    dropLabel: 'Escolher arquivos PDF',
    dropDescription: 'Solte arquivos PDF aqui ou selecione no seu computador',
    listLabel: 'Arquivos a mesclar na ordem especificada',
    actionMerge: 'Mesclar arquivos PDF',
    minFilesRequired: 'Selecione pelo menos 2 arquivos PDF para mesclar.',
    clear: 'Limpar',
    remove: 'Remover',
    removeFile: 'Remover {name}',
    oneFileReady: '1 PDF válido selecionado (selecione mais 1 para mesclar).',
    filesReady: '{files} PDFs prontos para mesclar ({pages} páginas no total).',
    processingLabel: 'Mesclando documentos PDF',
    statusValidating: 'Inspecionando arquivos PDF...',
    statusMerging: 'Unindo páginas em um documento consolidado...',
    statusSaving: 'Finalizando arquivo PDF...',
    downloadTitle: 'Seu PDF mesclado está pronto',
    downloadFileName: 'documento-mesclado.pdf',
    errorEncrypted: '"{name}" está protegido por senha. Remova-o ou utilize uma versão sem senha.',
    errorCorrupted: '"{name}" está corrompido ou não é um documento PDF válido.',
    howTitle: 'Como mesclar arquivos PDF',
    how: [
      'Selecione ou arraste 2 ou mais documentos PDF para a área de arquivos.',
      'Reordene os arquivos utilizando a alça de arrasto, os botões ou o teclado para definir a sequência desejada.',
      'Clique em "Mesclar arquivos PDF" para executar a junção no seu navegador.',
      'Baixe o arquivo PDF unificado imediatamente para o seu dispositivo.'
    ],
    limitsTitle: 'Limitações e capacidade',
    limits:
      'O processamento ocorre integralmente no navegador. O limite é de 20 arquivos ou 200 MB no desktop e 8 arquivos ou 50 MB no celular. Arquivos protegidos por senha precisam ser desbloqueados antes da mesclagem.',
    securityTitle: 'Garantia de Privacidade e Segurança',
    security:
      'As ferramentas Noduct operam sem envio de dados para servidores. Nenhum dado sai do seu dispositivo: seus documentos permanecem 100% seguros.'
  },
  es: {
    name: 'Combinar PDF',
    description: 'Une varios archivos PDF en un solo documento directamente en tu navegador.',
    privacyNotice: 'Tus archivos PDF se procesan localmente en el navegador y nunca salen de tu dispositivo.',
    dropLabel: 'Elegir archivos PDF',
    dropDescription: 'Arrastra archivos PDF aquí o selecciónalos de tu equipo',
    listLabel: 'Archivos a combinar en el orden especificado',
    actionMerge: 'Combinar archivos PDF',
    minFilesRequired: 'Selecciona al menos 2 archivos PDF para combinar.',
    clear: 'Limpiar',
    remove: 'Quitar',
    removeFile: 'Quitar {name}',
    oneFileReady: '1 PDF válido seleccionado (selecciona 1 más para combinar).',
    filesReady: '{files} PDF listos para combinar ({pages} páginas en total).',
    processingLabel: 'Combinando documentos PDF',
    statusValidating: 'Inspeccionando archivos PDF...',
    statusMerging: 'Uniendo páginas en un documento consolidado...',
    statusSaving: 'Finalizando archivo PDF...',
    downloadTitle: 'Tu PDF combinado está listo',
    downloadFileName: 'documento-combinado.pdf',
    errorEncrypted: '"{name}" está protegido por contraseña. Quítalo o usa una versión sin contraseña.',
    errorCorrupted: '"{name}" está dañado o no es un documento PDF válido.',
    howTitle: 'Cómo combinar archivos PDF',
    how: [
      'Selecciona o arrastra 2 o más documentos PDF al área de archivos.',
      'Reordena los archivos usando el control de arrastre, los botones o el teclado para fijar el orden deseado.',
      'Haz clic en "Combinar archivos PDF" para ejecutar la unión en tu navegador.',
      'Descarga el archivo PDF unificado de inmediato a tu equipo.'
    ],
    limitsTitle: 'Limitaciones y capacidad',
    limits:
      'El procesamiento se realiza por completo en el navegador. El límite es de 20 archivos o 200 MB en escritorio y 8 archivos o 50 MB en móvil. Los archivos con contraseña deben desbloquearse antes de combinarlos.',
    securityTitle: 'Garantía de Privacidad y Seguridad',
    security:
      'Las herramientas de Noduct funcionan sin subir datos a servidores. Ningún archivo sale de tu equipo: tus documentos permanecen privados.'
  }
};
