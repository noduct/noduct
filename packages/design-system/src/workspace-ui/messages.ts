import type { Locale } from '@noduct/tool-runtime';

const plural = (count: number, one: string, other: string) => (count === 1 ? one : other);

/** Textos das superfícies da Área de Trabalho Local (ADR 0006), nos três idiomas. */
export const workspaceUiMessages = {
  en: {
    name: 'Local Workspace',
    view: 'View',
    viewList: 'List',
    viewGrid: 'Grid',
    storageTitle: 'Storage',
    keptBadge: 'Kept',
    deleteTitle: (name: string) => `Delete ${name}?`,
    deleteMessage: 'The file will be removed from this browser. This cannot be undone.',
    deleteConfirm: 'Delete',
    clearTitle: 'Delete all files?',
    clearConfirm: 'Delete all',
    fromWorkspace: 'From Local Workspace',
    pickerTitle: 'Choose from Local Workspace',
    pickerIntro:
      'Files saved in this browser. Selected files join this tool only after you confirm.',
    close: 'Close',
    searchLabel: 'Search saved files',
    searchPlaceholder: 'Search by name',
    listLabel: 'Saved files',
    loading: 'Loading saved files…',
    pickerEmpty:
      'No compatible files saved in this browser yet. Save a result or add files on the Local Workspace page.',
    noResults: 'No saved files match your search.',
    incompatible: (count: number) =>
      plural(
        count,
        '1 saved file cannot be used by this tool and is hidden.',
        `${count} saved files cannot be used by this tool and are hidden.`
      ),
    selected: (count: number) => plural(count, '1 selected', `${count} selected`),
    adding: 'Adding…',
    manageFiles: 'Manage files',
    savedOn: (date: string) => `Saved ${date}`,
    saveToWorkspace: 'Save to Local Workspace',
    saving: 'Saving…',
    saved: 'Saved to Local Workspace',
    savedAnnouncement: (name: string) =>
      `${name} was saved in this browser. You can use it in other Noduct tools.`,
    viewInWorkspace: 'View in Local Workspace',
    addFiles: 'Add files',
    sortLabel: 'Sort by',
    sortRecent: 'Most recent',
    sortName: 'Name',
    sortSize: 'Size',
    fileCount: (count: number) =>
      plural(count, '1 file in this browser', `${count} files in this browser`),
    usageLabel: 'Storage used by Noduct files',
    documentsUsage: (used: string, limit: string) => `Noduct files: ${used} of ${limit}`,
    storageEstimate: (usage: string) => `Estimated site storage in this browser: ${usage}`,
    download: 'Download',
    downloadFile: (name: string) => `Download ${name}`,
    preview: 'Preview PDF',
    previewFile: (name: string) => `Preview ${name}`,
    previewUnavailable: 'Allow pop-ups to preview this PDF.',
    delete: 'Delete',
    deleteFile: (name: string) => `Delete ${name}`,
    deleted: (name: string) => `${name} was deleted.`,
    added: (count: number) =>
      plural(
        count,
        '1 file was added to your Local Workspace.',
        `${count} files were added to your Local Workspace.`
      ),
    keep: 'Keep on this device',
    allowExpiry: 'Allow expiration',
    keepFile: (name: string) => `Keep ${name} on this device`,
    allowExpiryFile: (name: string) => `Allow ${name} to expire`,
    persistent: 'Kept on this device',
    expiresInHours: (hours: number) =>
      `Expires in ${hours} ${plural(hours, 'hour', 'hours')} without use`,
    expiresSoon: 'Expires in less than 1 hour without use',
    expiryPending: 'Expiration pending while this file is in use',
    expiryUnavailable: 'Automatic expiration is unavailable in this browser',
    expiredRemoved: (count: number) =>
      `${count} ${plural(count, 'temporary document was', 'temporary documents were')} removed after 24 hours without use.`,
    clearAll: 'Delete all files',
    confirmClear: 'Delete all files saved in this browser? This cannot be undone.',
    cleared: 'All files were deleted.',
    emptyTitle: 'Your Local Workspace is empty',
    emptyText:
      'Save a result from any tool, or add PDF files here, to reuse them later without selecting them again.',
    privacyTitle: 'How your files are kept',
    privacyPoints: [
      'Files stay in this browser on this device. Nothing is uploaded.',
      'They are not synced to other browsers or devices.',
      'Clearing site data in the browser removes them. Keep copies of important documents.',
      'Files you save stay until you delete them. Choose Allow expiration to remove a file after 24 hours without use.'
    ],
    recentsTitle: 'Your Local Workspace',
    recentsIntro:
      'Reuse files across Noduct tools without selecting them again. They stay in this browser.',
    recentsLabel: 'Recently saved files',
    openWorkspace: 'Open Local Workspace',
    viewAll: 'View all files',
    moreFiles: (count: number) =>
      plural(count, 'View 1 more file', `View ${count} more files`),
    selectFile: (name: string) => `Select ${name}`,
    deselectFile: (name: string) => `Deselect ${name}`,
    selectVisible: 'Select visible',
    clearSelection: 'Clear selection',
    downloadSelected: 'Download selection',
    deleteSelected: 'Delete selection',
    rename: 'Rename',
    renameLabel: 'File name',
    renameSave: 'Save name',
    renamed: (name: string) => `Renamed to ${name}.`,
    renameEmpty: 'Enter a file name.',
    deleteSelectedTitle: (count: number) =>
      plural(count, 'Delete 1 selected file?', `Delete ${count} selected files?`),
    deleteSelectedMessage: 'The selected files will be removed from this browser. This cannot be undone.',
    deletedSelected: (count: number) =>
      plural(count, '1 selected file was deleted.', `${count} selected files were deleted.`),
    zipTooLarge: 'This selection is too large for a ZIP file. Select fewer files.',
    archiveName: 'local-workspace-files.zip',
    byteUnits: { bytes: 'B', kilobytes: 'KB', megabytes: 'MB', gigabytes: 'GB' }
  },
  'pt-BR': {
    name: 'Área de Trabalho Local',
    view: 'Visualização',
    viewList: 'Lista',
    viewGrid: 'Grade',
    storageTitle: 'Armazenamento',
    keptBadge: 'Mantido',
    deleteTitle: (name: string) => `Excluir ${name}?`,
    deleteMessage: 'O arquivo será removido deste navegador. Esta ação não pode ser desfeita.',
    deleteConfirm: 'Excluir',
    clearTitle: 'Excluir todos os arquivos?',
    clearConfirm: 'Excluir todos',
    fromWorkspace: 'Da Área Local',
    pickerTitle: 'Escolher da Área Local',
    pickerIntro:
      'Arquivos salvos neste navegador. Os selecionados só entram nesta ferramenta quando você confirma.',
    close: 'Fechar',
    searchLabel: 'Buscar arquivos salvos',
    searchPlaceholder: 'Buscar por nome',
    listLabel: 'Arquivos salvos',
    loading: 'Carregando arquivos salvos…',
    pickerEmpty:
      'Ainda não há arquivos compatíveis salvos neste navegador. Salve um resultado ou adicione arquivos na página da Área de Trabalho Local.',
    noResults: 'Nenhum arquivo salvo corresponde à busca.',
    incompatible: (count: number) =>
      plural(
        count,
        '1 arquivo salvo não pode ser usado nesta ferramenta e está oculto.',
        `${count} arquivos salvos não podem ser usados nesta ferramenta e estão ocultos.`
      ),
    selected: (count: number) =>
      plural(count, '1 selecionado', `${count} selecionados`),
    adding: 'Adicionando…',
    manageFiles: 'Gerenciar arquivos',
    savedOn: (date: string) => `Salvo em ${date}`,
    saveToWorkspace: 'Salvar na Área Local',
    saving: 'Salvando…',
    saved: 'Salvo na Área Local',
    savedAnnouncement: (name: string) =>
      `${name} foi salvo neste navegador. Você pode usá-lo em outras ferramentas do Noduct.`,
    viewInWorkspace: 'Ver na Área Local',
    addFiles: 'Adicionar arquivos',
    sortLabel: 'Ordenar por',
    sortRecent: 'Mais recentes',
    sortName: 'Nome',
    sortSize: 'Tamanho',
    fileCount: (count: number) =>
      plural(count, '1 arquivo neste navegador', `${count} arquivos neste navegador`),
    usageLabel: 'Armazenamento usado pelos arquivos do Noduct',
    documentsUsage: (used: string, limit: string) => `Arquivos do Noduct: ${used} de ${limit}`,
    storageEstimate: (usage: string) =>
      `Uso estimado do site neste navegador: ${usage}`,
    download: 'Baixar',
    downloadFile: (name: string) => `Baixar ${name}`,
    preview: 'Prévia do PDF',
    previewFile: (name: string) => `Visualizar ${name}`,
    previewUnavailable: 'Permita pop-ups para visualizar este PDF.',
    delete: 'Excluir',
    deleteFile: (name: string) => `Excluir ${name}`,
    deleted: (name: string) => `${name} foi excluído.`,
    added: (count: number) =>
      plural(
        count,
        '1 arquivo foi adicionado à Área de Trabalho Local.',
        `${count} arquivos foram adicionados à Área de Trabalho Local.`
      ),
    keep: 'Manter neste dispositivo',
    allowExpiry: 'Permitir expiração',
    keepFile: (name: string) => `Manter ${name} neste dispositivo`,
    allowExpiryFile: (name: string) => `Permitir que ${name} expire`,
    persistent: 'Mantido neste dispositivo',
    expiresInHours: (hours: number) =>
      `Expira em ${hours} ${plural(hours, 'hora', 'horas')} sem uso`,
    expiresSoon: 'Expira em menos de 1 hora sem uso',
    expiryPending: 'Expiração pendente enquanto este arquivo estiver em uso',
    expiryUnavailable: 'A expiração automática está indisponível neste navegador',
    expiredRemoved: (count: number) =>
      `${count} ${plural(count, 'documento temporário foi removido', 'documentos temporários foram removidos')} após 24 horas sem uso.`,
    clearAll: 'Excluir todos os arquivos',
    confirmClear:
      'Excluir todos os arquivos salvos neste navegador? Esta ação não pode ser desfeita.',
    cleared: 'Todos os arquivos foram excluídos.',
    emptyTitle: 'Sua Área de Trabalho Local está vazia',
    emptyText:
      'Salve um resultado em qualquer ferramenta, ou adicione arquivos PDF aqui, para reutilizá-los depois sem selecioná-los de novo.',
    privacyTitle: 'Como seus arquivos são guardados',
    privacyPoints: [
      'Os arquivos ficam neste navegador, neste dispositivo. Nada é enviado.',
      'Eles não são sincronizados com outros navegadores ou dispositivos.',
      'Limpar os dados do site no navegador os remove. Mantenha cópias dos documentos importantes.',
      'O que você salva fica até você excluir. Escolha Permitir expiração para remover um arquivo após 24 horas sem uso.'
    ],
    recentsTitle: 'Sua Área de Trabalho',
    recentsIntro:
      'Reutilize arquivos entre as ferramentas do Noduct sem selecioná-los de novo. Eles ficam neste navegador.',
    recentsLabel: 'Arquivos salvos recentemente',
    openWorkspace: 'Abrir a Área de Trabalho',
    viewAll: 'Ver todos os arquivos',
    moreFiles: (count: number) =>
      plural(count, 'Ver mais 1 arquivo', `Ver mais ${count} arquivos`),
    selectFile: (name: string) => `Selecionar ${name}`,
    deselectFile: (name: string) => `Desmarcar ${name}`,
    selectVisible: 'Selecionar visíveis',
    clearSelection: 'Limpar seleção',
    downloadSelected: 'Baixar seleção',
    deleteSelected: 'Excluir seleção',
    rename: 'Renomear',
    renameLabel: 'Nome do arquivo',
    renameSave: 'Salvar nome',
    renamed: (name: string) => `Arquivo renomeado para ${name}.`,
    renameEmpty: 'Digite um nome para o arquivo.',
    deleteSelectedTitle: (count: number) =>
      plural(count, 'Excluir 1 arquivo selecionado?', `Excluir ${count} arquivos selecionados?`),
    deleteSelectedMessage: 'Os arquivos selecionados serão removidos deste navegador. Esta ação não pode ser desfeita.',
    deletedSelected: (count: number) =>
      plural(count, '1 arquivo selecionado foi excluído.', `${count} arquivos selecionados foram excluídos.`),
    zipTooLarge: 'Esta seleção é grande demais para um arquivo ZIP. Selecione menos arquivos.',
    archiveName: 'arquivos-area-local.zip',
    byteUnits: { bytes: 'B', kilobytes: 'KB', megabytes: 'MB', gigabytes: 'GB' }
  },
  es: {
    name: 'Área de trabajo local',
    view: 'Vista',
    viewList: 'Lista',
    viewGrid: 'Cuadrícula',
    storageTitle: 'Almacenamiento',
    keptBadge: 'Conservado',
    deleteTitle: (name: string) => `¿Eliminar ${name}?`,
    deleteMessage: 'El archivo se eliminará de este navegador. Esta acción no se puede deshacer.',
    deleteConfirm: 'Eliminar',
    clearTitle: '¿Eliminar todos los archivos?',
    clearConfirm: 'Eliminar todos',
    fromWorkspace: 'Del área local',
    pickerTitle: 'Elegir del área local',
    pickerIntro:
      'Archivos guardados en este navegador. Los seleccionados solo se añaden a esta herramienta cuando confirmas.',
    close: 'Cerrar',
    searchLabel: 'Buscar archivos guardados',
    searchPlaceholder: 'Buscar por nombre',
    listLabel: 'Archivos guardados',
    loading: 'Cargando archivos guardados…',
    pickerEmpty:
      'Aún no hay archivos compatibles guardados en este navegador. Guarda un resultado o añade archivos en la página del área de trabajo local.',
    noResults: 'Ningún archivo guardado coincide con la búsqueda.',
    incompatible: (count: number) =>
      plural(
        count,
        '1 archivo guardado no se puede usar en esta herramienta y está oculto.',
        `${count} archivos guardados no se pueden usar en esta herramienta y están ocultos.`
      ),
    selected: (count: number) =>
      plural(count, '1 seleccionado', `${count} seleccionados`),
    adding: 'Añadiendo…',
    manageFiles: 'Gestionar archivos',
    savedOn: (date: string) => `Guardado el ${date}`,
    saveToWorkspace: 'Guardar en el área local',
    saving: 'Guardando…',
    saved: 'Guardado en el área local',
    savedAnnouncement: (name: string) =>
      `${name} se guardó en este navegador. Puedes usarlo en otras herramientas de Noduct.`,
    viewInWorkspace: 'Ver en el área local',
    addFiles: 'Añadir archivos',
    sortLabel: 'Ordenar por',
    sortRecent: 'Más recientes',
    sortName: 'Nombre',
    sortSize: 'Tamaño',
    fileCount: (count: number) =>
      plural(count, '1 archivo en este navegador', `${count} archivos en este navegador`),
    usageLabel: 'Almacenamiento usado por los archivos de Noduct',
    documentsUsage: (used: string, limit: string) => `Archivos de Noduct: ${used} de ${limit}`,
    storageEstimate: (usage: string) =>
      `Uso estimado del sitio en este navegador: ${usage}`,
    download: 'Descargar',
    downloadFile: (name: string) => `Descargar ${name}`,
    preview: 'Vista previa del PDF',
    previewFile: (name: string) => `Vista previa de ${name}`,
    previewUnavailable: 'Permite las ventanas emergentes para ver este PDF.',
    delete: 'Eliminar',
    deleteFile: (name: string) => `Eliminar ${name}`,
    deleted: (name: string) => `${name} se eliminó.`,
    added: (count: number) =>
      plural(
        count,
        'Se añadió 1 archivo a tu área de trabajo local.',
        `Se añadieron ${count} archivos a tu área de trabajo local.`
      ),
    keep: 'Conservar en este dispositivo',
    allowExpiry: 'Permitir caducidad',
    keepFile: (name: string) => `Conservar ${name} en este dispositivo`,
    allowExpiryFile: (name: string) => `Permitir que ${name} caduque`,
    persistent: 'Conservado en este dispositivo',
    expiresInHours: (hours: number) =>
      `Caduca en ${hours} ${plural(hours, 'hora', 'horas')} sin uso`,
    expiresSoon: 'Caduca en menos de 1 hora sin uso',
    expiryPending: 'Caducidad pendiente mientras se usa este archivo',
    expiryUnavailable: 'La caducidad automática no está disponible en este navegador',
    expiredRemoved: (count: number) =>
      `${count} ${plural(count, 'documento temporal se eliminó', 'documentos temporales se eliminaron')} tras 24 horas sin uso.`,
    clearAll: 'Eliminar todos los archivos',
    confirmClear:
      '¿Eliminar todos los archivos guardados en este navegador? Esta acción no se puede deshacer.',
    cleared: 'Se eliminaron todos los archivos.',
    emptyTitle: 'Tu área de trabajo local está vacía',
    emptyText:
      'Guarda un resultado en cualquier herramienta, o añade archivos PDF aquí, para reutilizarlos después sin volver a seleccionarlos.',
    privacyTitle: 'Cómo se guardan tus archivos',
    privacyPoints: [
      'Los archivos permanecen en este navegador, en este dispositivo. No se sube nada.',
      'No se sincronizan con otros navegadores ni dispositivos.',
      'Borrar los datos del sitio en el navegador los elimina. Conserva copias de los documentos importantes.',
      'Lo que guardas permanece hasta que lo eliminas. Elige Permitir caducidad para eliminar un archivo tras 24 horas sin uso.'
    ],
    recentsTitle: 'Tu área de trabajo',
    recentsIntro:
      'Reutiliza archivos entre las herramientas de Noduct sin volver a seleccionarlos. Permanecen en este navegador.',
    recentsLabel: 'Archivos guardados recientemente',
    openWorkspace: 'Abrir el área de trabajo',
    viewAll: 'Ver todos los archivos',
    moreFiles: (count: number) =>
      plural(count, 'Ver 1 archivo más', `Ver ${count} archivos más`),
    selectFile: (name: string) => `Seleccionar ${name}`,
    deselectFile: (name: string) => `Deseleccionar ${name}`,
    selectVisible: 'Seleccionar visibles',
    clearSelection: 'Borrar selección',
    downloadSelected: 'Descargar selección',
    deleteSelected: 'Eliminar selección',
    rename: 'Renombrar',
    renameLabel: 'Nombre del archivo',
    renameSave: 'Guardar nombre',
    renamed: (name: string) => `Archivo renombrado a ${name}.`,
    renameEmpty: 'Escribe un nombre para el archivo.',
    deleteSelectedTitle: (count: number) =>
      plural(count, '¿Eliminar 1 archivo seleccionado?', `¿Eliminar ${count} archivos seleccionados?`),
    deleteSelectedMessage: 'Los archivos seleccionados se eliminarán de este navegador. Esta acción no se puede deshacer.',
    deletedSelected: (count: number) =>
      plural(count, 'Se eliminó 1 archivo seleccionado.', `Se eliminaron ${count} archivos seleccionados.`),
    zipTooLarge: 'Esta selección es demasiado grande para un archivo ZIP. Selecciona menos archivos.',
    archiveName: 'archivos-area-local.zip',
    byteUnits: { bytes: 'B', kilobytes: 'KB', megabytes: 'MB', gigabytes: 'GB' }
  }
} as const;

export type WorkspaceUiMessages = (typeof workspaceUiMessages)[Locale];

export type WorkspaceErrorCodeLike =
  | 'WORKSPACE_UNAVAILABLE'
  | 'DOCUMENT_NOT_FOUND'
  | 'TRANSFER_NOT_FOUND'
  | 'TRANSFER_EXPIRED'
  | 'TRANSFER_ALREADY_CONSUMED'
  | 'INVALID_TOOL_TARGET'
  | 'DB_OPEN_ERROR'
  | 'SCHEMA_VERSION_UNSUPPORTED'
  | 'DB_UPGRADE_BLOCKED'
  | 'REQUEST_ERROR'
  | 'TRANSACTION_ABORTED'
  | 'TRANSACTION_ERROR';

/** Tradução dos códigos de `WorkspaceError`; o design system não importa o workspace-core. */
export const workspaceErrorMessages: Record<WorkspaceErrorCodeLike, Record<Locale, string>> = {
  WORKSPACE_UNAVAILABLE: {
    en: 'Local browser storage is unavailable. Check browser storage settings and try again.',
    'pt-BR':
      'O armazenamento local do navegador está indisponível. Verifique as configurações de armazenamento e tente novamente.',
    es: 'El almacenamiento local del navegador no está disponible. Revisa la configuración de almacenamiento e inténtalo de nuevo.'
  },
  DOCUMENT_NOT_FOUND: {
    en: 'This document is no longer in your Local Workspace.',
    'pt-BR': 'Este documento não está mais na Área de Trabalho Local.',
    es: 'Este documento ya no está en el área de trabajo local.'
  },
  TRANSFER_NOT_FOUND: {
    en: 'This transfer link is no longer available.',
    'pt-BR': 'Este link de transferência não está mais disponível.',
    es: 'Este enlace de transferencia ya no está disponible.'
  },
  TRANSFER_EXPIRED: {
    en: 'This transfer link has expired. Create a new transfer.',
    'pt-BR': 'Este link de transferência expirou. Crie uma nova transferência.',
    es: 'Este enlace de transferencia ha caducado. Crea una nueva transferencia.'
  },
  TRANSFER_ALREADY_CONSUMED: {
    en: 'This transfer link has already been used. Create a new transfer.',
    'pt-BR': 'Este link de transferência já foi usado. Crie uma nova transferência.',
    es: 'Este enlace de transferencia ya se utilizó. Crea una nueva transferencia.'
  },
  INVALID_TOOL_TARGET: {
    en: 'This transfer cannot be opened by this tool.',
    'pt-BR': 'Esta transferência não pode ser aberta por esta ferramenta.',
    es: 'Esta transferencia no se puede abrir con esta herramienta.'
  },
  DB_OPEN_ERROR: {
    en: 'Could not open local browser storage. Try reloading this tab.',
    'pt-BR': 'Não foi possível abrir o armazenamento local. Tente recarregar esta aba.',
    es: 'No se pudo abrir el almacenamiento local. Intenta recargar esta pestaña.'
  },
  SCHEMA_VERSION_UNSUPPORTED: {
    en: 'Your Local Workspace was opened by a newer version of Noduct. Close other Noduct tabs and try again.',
    'pt-BR':
      'A Área de Trabalho Local foi aberta por uma versão mais nova do Noduct. Feche as outras abas do Noduct e tente novamente.',
    es: 'Tu área de trabajo local se abrió con una versión más reciente de Noduct. Cierra las otras pestañas de Noduct e inténtalo de nuevo.'
  },
  DB_UPGRADE_BLOCKED: {
    en: 'Close the other Noduct tabs and try opening your Local Workspace again.',
    'pt-BR': 'Feche as outras abas do Noduct e tente abrir a Área de Trabalho Local novamente.',
    es: 'Cierra las otras pestañas de Noduct e intenta abrir el área de trabajo local de nuevo.'
  },
  REQUEST_ERROR: {
    en: 'Local storage could not complete this action. Try again.',
    'pt-BR': 'O armazenamento local não conseguiu concluir esta ação. Tente novamente.',
    es: 'El almacenamiento local no pudo completar esta acción. Inténtalo de nuevo.'
  },
  TRANSACTION_ABORTED: {
    en: 'The local storage operation was interrupted. Try again.',
    'pt-BR': 'A operação no armazenamento local foi interrompida. Tente novamente.',
    es: 'La operación de almacenamiento local se interrumpió. Inténtalo de nuevo.'
  },
  TRANSACTION_ERROR: {
    en: 'The local storage operation failed. Try again.',
    'pt-BR': 'A operação no armazenamento local falhou. Tente novamente.',
    es: 'La operación de almacenamiento local falló. Inténtalo de nuevo.'
  }
};

export function formatWorkspaceError(error: unknown, locale: Locale): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  if (typeof code === 'string' && Object.hasOwn(workspaceErrorMessages, code)) {
    return workspaceErrorMessages[code as WorkspaceErrorCodeLike][locale];
  }
  return workspaceErrorMessages.REQUEST_ERROR[locale];
}

export function resolveWorkspaceUiLocale(locale?: string): Locale {
  if (locale === 'pt-BR' || locale === 'pt-br') return 'pt-BR';
  if (locale === 'es') return 'es';
  return 'en';
}

/** Bytes com a unidade do idioma; usado em listas, medidor e prévias. */
export function formatWorkspaceBytes(bytes: number, locale: Locale): string {
  const units = workspaceUiMessages[locale].byteUnits;
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (bytes < 1024) return `${format.format(bytes)} ${units.bytes}`;
  if (bytes < 1024 ** 2) return `${format.format(bytes / 1024)} ${units.kilobytes}`;
  if (bytes < 1024 ** 3) return `${format.format(bytes / 1024 ** 2)} ${units.megabytes}`;
  return `${format.format(bytes / 1024 ** 3)} ${units.gigabytes}`;
}
