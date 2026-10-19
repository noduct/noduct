import type { Locale } from '@noduct/tool-runtime';
import type { WorkspaceErrorCode } from '@noduct/workspace-core';

const messages: Record<WorkspaceErrorCode, Record<Locale, string>> = {
  WORKSPACE_UNAVAILABLE: {
    en: 'Local browser storage is unavailable. Check browser storage settings and try again.',
    'pt-BR':
      'O armazenamento local do navegador está indisponível. Verifique as configurações de armazenamento e tente novamente.',
    es: 'El almacenamiento local del navegador no está disponible. Revisa la configuración de almacenamiento e inténtalo de nuevo.'
  },
  DOCUMENT_NOT_FOUND: {
    en: 'This document is no longer in your local workspace.',
    'pt-BR': 'Este documento não está mais na área de trabalho local.',
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
    en: 'This workspace was opened by a newer version of Noduct. Close other Noduct tabs and try again.',
    'pt-BR': 'Esta área de trabalho foi aberta por uma versão mais nova do Noduct. Feche as outras abas do Noduct e tente novamente.',
    es: 'Esta área de trabajo se abrió con una versión más reciente de Noduct. Cierra las otras pestañas de Noduct e inténtalo de nuevo.'
  },
  DB_UPGRADE_BLOCKED: {
    en: 'Close the other Noduct tabs and try opening the workspace again.',
    'pt-BR': 'Feche as outras abas do Noduct e tente abrir a área de trabalho novamente.',
    es: 'Cierra las otras pestañas de Noduct e intenta abrir el área de trabajo de nuevo.'
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
  if (typeof code === 'string' && Object.hasOwn(messages, code)) {
    return messages[code as WorkspaceErrorCode][locale];
  }
  return messages.REQUEST_ERROR[locale];
}
