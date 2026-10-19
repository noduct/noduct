import type { Locale } from '@noduct/tool-runtime';

export const workspaceUiMessages = {
  en: {
    drawerTitle: 'Local Workspace',
    triggerLabel: 'Local Workspace',
    closeLabel: 'Close workspace panel',
    privacyNotice:
      'Files stay in your browser storage (IndexedDB) and never leave your device. Temporary files expire after 24 hours without use. Choose Keep on this device to retain a file until you delete it. Clearing browser data also removes these files.',
    storageUsage: (usedMb: string, limitMb: string) => `${usedMb} MB used of ~${limitMb} MB limit`,
    storageLoading: 'Storage usage is shown when the workspace opens.',
    emptyMessage: 'No documents stored in your local workspace.',
    download: 'Download',
    downloadFile: (name: string) => `Download: ${name}`,
    delete: 'Delete',
    deleteFile: (name: string) => `Delete: ${name}`,
    byteUnits: { bytes: 'B', kilobytes: 'kB', megabytes: 'MB' },
    keep: 'Keep on this device',
    allowExpiry: 'Allow expiration',
    keepFile: (name: string) => `Keep on this device: ${name}`,
    allowExpiryFile: (name: string) => `Allow expiration: ${name}`,
    persistent: 'Kept on this device',
    expiresInHours: (hours: number) =>
      `Expires in ${hours} ${hours === 1 ? 'hour' : 'hours'} without use`,
    expiresSoon: 'Expires in less than 1 hour without use',
    expiryPending: 'Expiration pending while this file is in use',
    expiryUnavailable: 'Automatic expiration is unavailable in this browser',
    expiredRemoved: (count: number) =>
      `${count} ${count === 1 ? 'temporary document was' : 'temporary documents were'} removed after 24 hours without use.`,
    clearAll: 'Clear all local files',
    confirmClear: 'Are you sure you want to delete all local documents? This cannot be undone.'
  },
  'pt-BR': {
    drawerTitle: 'Área de Trabalho Local',
    triggerLabel: 'Área de Trabalho Local',
    closeLabel: 'Fechar painel da área de trabalho',
    privacyNotice:
      'Os arquivos ficam no armazenamento local do navegador (IndexedDB) e nunca saem do seu dispositivo. Arquivos temporários expiram após 24 horas sem uso. Escolha Manter neste dispositivo para guardá-los até que você os exclua. Limpar os dados do navegador também os remove.',
    storageUsage: (usedMb: string, limitMb: string) =>
      `${usedMb} MB utilizados de ~${limitMb} MB disponíveis`,
    storageLoading: 'O uso do armazenamento aparece ao abrir a área de trabalho.',
    emptyMessage: 'Nenhum documento armazenado na área de trabalho local.',
    download: 'Baixar',
    downloadFile: (name: string) => `Baixar: ${name}`,
    delete: 'Excluir',
    deleteFile: (name: string) => `Excluir: ${name}`,
    byteUnits: { bytes: 'B', kilobytes: 'kB', megabytes: 'MB' },
    keep: 'Manter neste dispositivo',
    allowExpiry: 'Permitir expiração',
    keepFile: (name: string) => `Manter neste dispositivo: ${name}`,
    allowExpiryFile: (name: string) => `Permitir expiração: ${name}`,
    persistent: 'Mantido neste dispositivo',
    expiresInHours: (hours: number) =>
      `Expira em ${hours} ${hours === 1 ? 'hora' : 'horas'} sem uso`,
    expiresSoon: 'Expira em menos de 1 hora sem uso',
    expiryPending: 'Expiração pendente enquanto este arquivo estiver em uso',
    expiryUnavailable: 'A expiração automática está indisponível neste navegador',
    expiredRemoved: (count: number) =>
      `${count} ${count === 1 ? 'documento temporário foi removido' : 'documentos temporários foram removidos'} após 24 horas sem uso.`,
    clearAll: 'Limpar todos os arquivos locais',
    confirmClear:
      'Tem certeza de que deseja excluir todos os documentos locais? Esta ação não pode ser desfeita.'
  },
  es: {
    drawerTitle: 'Área de Trabajo Local',
    triggerLabel: 'Área de Trabajo Local',
    closeLabel: 'Cerrar panel del área de trabajo',
    privacyNotice:
      'Los archivos permanecen en el almacenamiento local del navegador (IndexedDB) y nunca salen de tu dispositivo. Los archivos temporales caducan tras 24 horas sin uso. Elige Conservar en este dispositivo para mantenerlos hasta que los elimines. Borrar los datos del navegador también los elimina.',
    storageUsage: (usedMb: string, limitMb: string) =>
      `${usedMb} MB utilizados de ~${limitMb} MB disponibles`,
    storageLoading: 'El uso del almacenamiento aparece al abrir el área de trabajo.',
    emptyMessage: 'No hay documentos almacenados en su área de trabajo local.',
    download: 'Descargar',
    downloadFile: (name: string) => `Descargar: ${name}`,
    delete: 'Eliminar',
    deleteFile: (name: string) => `Eliminar: ${name}`,
    byteUnits: { bytes: 'B', kilobytes: 'kB', megabytes: 'MB' },
    keep: 'Conservar en este dispositivo',
    allowExpiry: 'Permitir caducidad',
    keepFile: (name: string) => `Conservar en este dispositivo: ${name}`,
    allowExpiryFile: (name: string) => `Permitir caducidad: ${name}`,
    persistent: 'Conservado en este dispositivo',
    expiresInHours: (hours: number) =>
      `Caduca en ${hours} ${hours === 1 ? 'hora' : 'horas'} sin uso`,
    expiresSoon: 'Caduca en menos de 1 hora sin uso',
    expiryPending: 'Caducidad pendiente mientras se usa este archivo',
    expiryUnavailable: 'La caducidad automática no está disponible en este navegador',
    expiredRemoved: (count: number) =>
      `${count} ${count === 1 ? 'documento temporal se eliminó' : 'documentos temporales se eliminaron'} tras 24 horas sin uso.`,
    clearAll: 'Limpiar todos los archivos locales',
    confirmClear:
      '¿Está seguro de que desea eliminar todos los documentos locales? Esta acción no se puede deshacer.'
  }
} as const;

export function resolveWorkspaceUiLocale(locale?: string): Locale {
  if (locale === 'pt-BR' || locale === 'pt-br') return 'pt-BR';
  if (locale === 'es') return 'es';
  return 'en';
}
