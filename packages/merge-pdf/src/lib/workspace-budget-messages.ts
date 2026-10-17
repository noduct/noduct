import type { Locale } from '@noduct/tool-runtime';
import type { BudgetEvaluationResult } from '@noduct/workspace-core';

type BudgetIssue = Extract<BudgetEvaluationResult, { decision: 'blocked' | 'warning' }>;

function bytes(value: number, locale: Locale): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / (1024 * 1024))} MB`;
}

export function formatBudgetIssue(issue: BudgetIssue, locale: Locale): string {
  const number = new Intl.NumberFormat(locale);
  switch (issue.code) {
    case 'FILE_COUNT_EXCEEDED':
      return {
        en: `You selected ${number.format(issue.params.fileCount)} files. This device supports up to ${number.format(issue.params.limit)} files at once.`,
        'pt-BR': `Você selecionou ${number.format(issue.params.fileCount)} arquivos. Este dispositivo permite até ${number.format(issue.params.limit)} arquivos por vez.`,
        es: `Seleccionaste ${number.format(issue.params.fileCount)} archivos. Este dispositivo admite hasta ${number.format(issue.params.limit)} archivos a la vez.`
      }[locale];
    case 'FILE_TOO_LARGE':
      return {
        en: `“${issue.params.fileName}” is ${bytes(issue.params.sizeBytes, locale)}. The limit per file is ${bytes(issue.params.limitBytes, locale)}.`,
        'pt-BR': `“${issue.params.fileName}” tem ${bytes(issue.params.sizeBytes, locale)}. O limite por arquivo é ${bytes(issue.params.limitBytes, locale)}.`,
        es: `“${issue.params.fileName}” ocupa ${bytes(issue.params.sizeBytes, locale)}. El límite por archivo es ${bytes(issue.params.limitBytes, locale)}.`
      }[locale];
    case 'TOTAL_SIZE_EXCEEDED':
      return {
        en: `The selected files total ${bytes(issue.params.sizeBytes, locale)}. The limit is ${bytes(issue.params.limitBytes, locale)}.`,
        'pt-BR': `Os arquivos selecionados somam ${bytes(issue.params.sizeBytes, locale)}. O limite é ${bytes(issue.params.limitBytes, locale)}.`,
        es: `Los archivos seleccionados suman ${bytes(issue.params.sizeBytes, locale)}. El límite es ${bytes(issue.params.limitBytes, locale)}.`
      }[locale];
    case 'PAGE_COUNT_EXCEEDED':
      return {
        en: `The selected PDFs have ${number.format(issue.params.pageCount)} pages. The limit is ${number.format(issue.params.limit)} pages.`,
        'pt-BR': `Os PDFs selecionados têm ${number.format(issue.params.pageCount)} páginas. O limite é ${number.format(issue.params.limit)} páginas.`,
        es: `Los PDF seleccionados tienen ${number.format(issue.params.pageCount)} páginas. El límite es de ${number.format(issue.params.limit)} páginas.`
      }[locale];
    case 'WORKSPACE_STORAGE_EXCEEDED':
      return {
        en: `Saving this result may exceed local workspace storage (${bytes(issue.params.limitBytes, locale)} limit). Free space in the workspace and try again.`,
        'pt-BR': `Salvar este resultado pode exceder o armazenamento da área de trabalho local (limite de ${bytes(issue.params.limitBytes, locale)}). Libere espaço e tente novamente.`,
        es: `Guardar este resultado puede superar el almacenamiento del área de trabajo local (límite de ${bytes(issue.params.limitBytes, locale)}). Libera espacio e inténtalo de nuevo.`
      }[locale];
    case 'BROWSER_QUOTA_EXCEEDED':
      return {
        en: `Your browser does not have enough local storage for this result. Available quota: ${bytes(issue.params.quotaBytes, locale)}.`,
        'pt-BR': `O navegador não tem armazenamento local suficiente para este resultado. Cota disponível: ${bytes(issue.params.quotaBytes, locale)}.`,
        es: `El navegador no tiene suficiente almacenamiento local para este resultado. Cuota disponible: ${bytes(issue.params.quotaBytes, locale)}.`
      }[locale];
    case 'HIGH_RESOURCE_USAGE':
      return {
        en: 'This merge may use a lot of device memory and take longer. Continue?',
        'pt-BR': 'Esta mesclagem pode usar muita memória do dispositivo e demorar mais. Continuar?',
        es: 'Esta combinación puede usar mucha memoria del dispositivo y tardar más. ¿Continuar?'
      }[locale];
  }
}
