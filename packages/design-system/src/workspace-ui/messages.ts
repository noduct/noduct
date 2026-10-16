import type { DesignLocale } from '../i18n';

export const workspaceUiMessages = {
  en: {
    drawerTitle: 'Local Workspace',
    triggerLabel: 'Local Workspace',
    closeLabel: 'Close workspace panel',
    privacyNotice:
      'All files are stored solely in your local browser storage (IndexedDB) and never leave your device. Clearing browser data will also remove these files.',
    storageUsage: (usedMb: string, limitMb: string) => `${usedMb} MB used of ~${limitMb} MB limit`,
    emptyMessage: 'No documents stored in your local workspace.',
    download: 'Download',
    delete: 'Delete',
    clearAll: 'Clear all local files',
    confirmClear: 'Are you sure you want to delete all local documents? This cannot be undone.'
  },
  'pt-BR': {
    drawerTitle: 'Área de Trabalho Local',
    triggerLabel: 'Área de Trabalho Local',
    closeLabel: 'Fechar painel da área de trabalho',
    privacyNotice:
      'Todos os arquivos ficam armazenados exclusivamente no armazenamento local do seu navegador (IndexedDB) e jamais saem do seu dispositivo. Limpar os dados do navegador também removerá estes arquivos.',
    storageUsage: (usedMb: string, limitMb: string) => `${usedMb} MB utilizados de ~${limitMb} MB disponíveis`,
    emptyMessage: 'Nenhum documento armazenado na área de trabalho local.',
    download: 'Baixar',
    delete: 'Excluir',
    clearAll: 'Limpar todos os arquivos locais',
    confirmClear: 'Tem certeza de que deseja excluir todos os documentos locais? Esta ação não pode ser desfeita.'
  },
  es: {
    drawerTitle: 'Área de Trabajo Local',
    triggerLabel: 'Área de Trabajo Local',
    closeLabel: 'Cerrar panel del área de trabajo',
    privacyNotice:
      'Todos los archivos se almacenan únicamente en el almacenamiento local de su navegador (IndexedDB) y nunca salen de su dispositivo. Limpiar los datos del navegador también eliminará estos archivos.',
    storageUsage: (usedMb: string, limitMb: string) => `${usedMb} MB utilizados de ~${limitMb} MB disponibles`,
    emptyMessage: 'No hay documentos almacenados en su área de trabajo local.',
    download: 'Descargar',
    delete: 'Eliminar',
    clearAll: 'Limpiar todos los archivos locales',
    confirmClear: '¿Está seguro de que desea eliminar todos los documentos locales? Esta acción no se puede deshacer.'
  }
} as const;

export function resolveWorkspaceUiLocale(locale?: string): DesignLocale {
  if (locale === 'pt-BR' || locale === 'pt-br') return 'pt-BR';
  if (locale === 'es') return 'es';
  return 'en';
}

