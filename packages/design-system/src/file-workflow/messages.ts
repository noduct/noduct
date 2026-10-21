import type { Locale } from '@noduct/tool-runtime';

const count = (value: number, one: string, other: string) => (value === 1 ? one : other);

export const fileWorkflowMessages = {
  en: {
    filesAdded: (total: number) => count(total, '1 file added.', `${total} files added.`),
    filesRejected: (names: string) => `Not accepted: ${names}.`,
    pages: (total: number) => count(total, '1 page', `${total} pages`),
    reorderInstructions:
      'Use the arrow keys on a reorder handle, or Alt plus the arrow keys on any file action, to change the order.',
    reorder: (name: string) => `Reorder ${name}`,
    moveUp: (name: string) => `Move ${name} up`,
    moveDown: (name: string) => `Move ${name} down`,
    moveBefore: (name: string) => `Move ${name} earlier`,
    moveAfter: (name: string) => `Move ${name} later`,
    remove: (name: string) => `Remove ${name}`,
    moved: (name: string, position: number, total: number) =>
      `${name} moved to position ${position} of ${total}.`,
    removed: (name: string, total: number) =>
      `${name} removed. ${count(total, '1 file remaining.', `${total} files remaining.`)}`,
    cancel: 'Cancel',
    cancelled: 'Processing cancelled.',
    downloadTitle: 'Your file is ready',
    download: 'Download',
    startOver: 'Start over'
  },
  'pt-BR': {
    filesAdded: (total: number) =>
      count(total, '1 arquivo adicionado.', `${total} arquivos adicionados.`),
    filesRejected: (names: string) => `Não aceito: ${names}.`,
    pages: (total: number) => count(total, '1 página', `${total} páginas`),
    reorderInstructions:
      'Use as setas em uma alça de reordenação, ou Alt com as setas em qualquer ação do arquivo, para mudar a ordem.',
    reorder: (name: string) => `Reordenar ${name}`,
    moveUp: (name: string) => `Mover ${name} para cima`,
    moveDown: (name: string) => `Mover ${name} para baixo`,
    moveBefore: (name: string) => `Mover ${name} para antes`,
    moveAfter: (name: string) => `Mover ${name} para depois`,
    remove: (name: string) => `Remover ${name}`,
    moved: (name: string, position: number, total: number) =>
      `${name} movido para a posição ${position} de ${total}.`,
    removed: (name: string, total: number) =>
      `${name} removido. ${count(total, 'Resta 1 arquivo.', `Restam ${total} arquivos.`)}`,
    cancel: 'Cancelar',
    cancelled: 'Processamento cancelado.',
    downloadTitle: 'Seu arquivo está pronto',
    download: 'Baixar',
    startOver: 'Recomeçar'
  },
  es: {
    filesAdded: (total: number) =>
      count(total, '1 archivo añadido.', `${total} archivos añadidos.`),
    filesRejected: (names: string) => `No aceptado: ${names}.`,
    pages: (total: number) => count(total, '1 página', `${total} páginas`),
    reorderInstructions:
      'Usa las flechas en un control de reordenación, o Alt con las flechas en cualquier acción del archivo, para cambiar el orden.',
    reorder: (name: string) => `Reordenar ${name}`,
    moveUp: (name: string) => `Mover ${name} hacia arriba`,
    moveDown: (name: string) => `Mover ${name} hacia abajo`,
    moveBefore: (name: string) => `Mover ${name} antes`,
    moveAfter: (name: string) => `Mover ${name} después`,
    remove: (name: string) => `Quitar ${name}`,
    moved: (name: string, position: number, total: number) =>
      `${name} movido a la posición ${position} de ${total}.`,
    removed: (name: string, total: number) =>
      `${name} quitado. ${count(total, 'Queda 1 archivo.', `Quedan ${total} archivos.`)}`,
    cancel: 'Cancelar',
    cancelled: 'Procesamiento cancelado.',
    downloadTitle: 'Tu archivo está listo',
    download: 'Descargar',
    startOver: 'Empezar de nuevo'
  }
} as const;

export function resolveFileWorkflowLocale(value: string | undefined): Locale {
  return value === 'pt-BR' || value === 'es' ? value : 'en';
}
