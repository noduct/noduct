import type { Locale } from '@noduct/tool-runtime';

export interface MergeMessages {
  name: string;
  description: string;
  privacyNotice: string;
  dropLabel: string;
  dropDescription: string;
  listLabel: string;
  actionMerge: string;
  addToMerge: string;
  minFilesRequired: string;
  clear: string;
  remove: string;
  removeFile: string;
  oneFileReady: string;
  oneFileAnnounce: string;
  statFilesLabel: string;
  statPagesLabel: string;
  statusReadyAnnounce: string;
  processingLabel: string;
  statusValidating: string;
  statusMerging: string;
  statusSaving: string;
  downloadTitle: string;
  downloadFileName: string;
  errorMergeFailed: string;
  budgetWarningTitle: string;
  budgetWarningConfirm: string;
  errorEncrypted: string;
  errorCorrupted: string;
  howTitle: string;
  how: string[];
  howNote: string;
}

export type MergeClientMessages = Pick<MergeMessages,
  | 'minFilesRequired'
  | 'oneFileReady'
  | 'oneFileAnnounce'
  | 'statusReadyAnnounce'
  | 'remove'
  | 'removeFile'
  | 'errorEncrypted'
  | 'errorCorrupted'
  | 'statusValidating'
  | 'statusMerging'
  | 'statusSaving'
  | 'downloadFileName'
  | 'errorMergeFailed'
  | 'budgetWarningTitle'
  | 'budgetWarningConfirm'
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
    addToMerge: 'Add to merge',
    minFilesRequired: 'Select at least 2 PDF files to merge.',
    clear: 'Clear',
    remove: 'Remove',
    removeFile: 'Remove {name}',
    oneFileReady: 'Add 1 more PDF to merge.',
    oneFileAnnounce: '1 PDF selected, {pages} pages. Add 1 more to merge.',
    statFilesLabel: 'PDFs',
    statPagesLabel: 'pages',
    statusReadyAnnounce: '{files} PDFs, {pages} pages ready to merge',
    processingLabel: 'Merging PDF documents',
    statusValidating: 'Inspecting PDF files...',
    statusMerging: 'Combining pages into a unified document...',
    statusSaving: 'Finalizing PDF output...',
    downloadTitle: 'Your merged PDF is ready',
    downloadFileName: 'merged.pdf',
    errorMergeFailed: 'Could not merge the PDF files. Please try again.',
    budgetWarningTitle: 'This is a large merge',
    budgetWarningConfirm: 'Merge anyway',
    errorEncrypted: '"{name}" is password-protected. Please remove it or provide an unencrypted version.',
    errorCorrupted: '"{name}" is corrupted or could not be parsed as a valid PDF.',
    howTitle: 'How to merge PDFs',
    how: [
      'Add two or more PDFs. Drop them on the **file area**, pick them from this computer, or choose files already in **Local Workspace**.',
      'Put the files in the order you want. Drag a file, use the arrows, or the keyboard.',
      'Press `{action}`. The pages join in **this browser**. Nothing is sent away.',
      'Download the result, or save it to **Local Workspace** to use in another tool.'
    ],
    howNote: 'Unlock a **password-protected** PDF before adding it.'
  },
  'pt-BR': {
    name: 'Mesclar PDF',
    description: 'Junte vários arquivos PDF em um único documento diretamente no seu navegador.',
    privacyNotice: 'Seus arquivos PDF são processados localmente no navegador e nunca saem do seu dispositivo.',
    dropLabel: 'Escolher arquivos PDF',
    dropDescription: 'Solte arquivos PDF aqui ou selecione no seu computador',
    listLabel: 'Arquivos a mesclar na ordem especificada',
    actionMerge: 'Mesclar arquivos PDF',
    addToMerge: 'Adicionar à mesclagem',
    minFilesRequired: 'Selecione pelo menos 2 arquivos PDF para mesclar.',
    clear: 'Limpar',
    remove: 'Remover',
    removeFile: 'Remover {name}',
    oneFileReady: 'Adicione mais 1 PDF para mesclar.',
    oneFileAnnounce: '1 PDF selecionado, {pages} páginas. Adicione mais 1 para mesclar.',
    statFilesLabel: 'PDFs',
    statPagesLabel: 'páginas',
    statusReadyAnnounce: '{files} PDFs, {pages} páginas prontas para mesclar',
    processingLabel: 'Mesclando documentos PDF',
    statusValidating: 'Inspecionando arquivos PDF...',
    statusMerging: 'Unindo páginas em um documento consolidado...',
    statusSaving: 'Finalizando arquivo PDF...',
    downloadTitle: 'Seu PDF mesclado está pronto',
    downloadFileName: 'documento-mesclado.pdf',
    errorMergeFailed: 'Não foi possível mesclar os arquivos PDF. Tente novamente.',
    budgetWarningTitle: 'Esta é uma mesclagem grande',
    budgetWarningConfirm: 'Mesclar mesmo assim',
    errorEncrypted: '"{name}" está protegido por senha. Remova-o ou utilize uma versão sem senha.',
    errorCorrupted: '"{name}" está corrompido ou não é um documento PDF válido.',
    howTitle: 'Como juntar PDFs',
    how: [
      'Inclua dois ou mais PDFs. Solte-os na **área de arquivos**, escolha-os neste computador ou use arquivos já salvos na **Área Local**.',
      'Deixe os arquivos na ordem desejada. Arraste um arquivo, use as setas ou o teclado.',
      'Toque em `{action}`. As páginas se juntam **neste navegador**. Nada é enviado para fora.',
      'Baixe o resultado ou salve-o na **Área Local** para usar em outra ferramenta.'
    ],
    howNote: 'Desbloqueie um PDF **protegido por senha** antes de incluí-lo.'
  },
  es: {
    name: 'Combinar PDF',
    description: 'Une varios archivos PDF en un solo documento directamente en tu navegador.',
    privacyNotice: 'Tus archivos PDF se procesan localmente en el navegador y nunca salen de tu dispositivo.',
    dropLabel: 'Elegir archivos PDF',
    dropDescription: 'Arrastra archivos PDF aquí o selecciónalos de tu equipo',
    listLabel: 'Archivos a combinar en el orden especificado',
    actionMerge: 'Combinar archivos PDF',
    addToMerge: 'Añadir a la combinación',
    minFilesRequired: 'Selecciona al menos 2 archivos PDF para combinar.',
    clear: 'Limpiar',
    remove: 'Quitar',
    removeFile: 'Quitar {name}',
    oneFileReady: 'Añade 1 PDF más para combinar.',
    oneFileAnnounce: '1 PDF seleccionado, {pages} páginas. Añade 1 más para combinar.',
    statFilesLabel: 'PDFs',
    statPagesLabel: 'páginas',
    statusReadyAnnounce: '{files} PDFs, {pages} páginas listas para combinar',
    processingLabel: 'Combinando documentos PDF',
    statusValidating: 'Inspeccionando archivos PDF...',
    statusMerging: 'Uniendo páginas en un documento consolidado...',
    statusSaving: 'Finalizando archivo PDF...',
    downloadTitle: 'Tu PDF combinado está listo',
    downloadFileName: 'documento-combinado.pdf',
    errorMergeFailed: 'No se pudieron combinar los archivos PDF. Inténtalo de nuevo.',
    budgetWarningTitle: 'Esta es una combinación grande',
    budgetWarningConfirm: 'Combinar de todos modos',
    errorEncrypted: '"{name}" está protegido por contraseña. Quítalo o usa una versión sin contraseña.',
    errorCorrupted: '"{name}" está dañado o no es un documento PDF válido.',
    howTitle: 'Cómo juntar PDFs',
    how: [
      'Añade dos o más PDF. Suéltalos en el **área de archivos**, elígelos en este equipo o usa archivos ya guardados en el **área local**.',
      'Deja los archivos en el orden que quieras. Arrastra un archivo, usa las flechas o el teclado.',
      'Pulsa `{action}`. Las páginas se unen en **este navegador**: no se envía nada fuera.',
      'Descarga el resultado o guárdalo en el **área local** para usarlo en otra herramienta.'
    ],
    howNote: 'Desbloquea un PDF **protegido con contraseña** antes de añadirlo.'
  }
};
