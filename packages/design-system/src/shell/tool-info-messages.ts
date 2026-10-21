import type { Locale } from '@noduct/tool-runtime';
import { fillPlaceholders } from '../content/rich-text';

export interface ToolLimitValues {
  desktopFiles: number;
  desktopSizeMb: number;
  mobileFiles: number;
  mobileSizeMb: number;
}

export interface ToolInfoMessages {
  limitsTitle: string;
  limitsIntro: string;
  limitsDesktop: string;
  limitsMobile: string;
  limitsNote: string;
  privacyTitle: string;
  privacyIntro: string;
  privacyPoints: readonly string[];
}

export function formatToolLimitLabels(
  locale: Locale,
  limits: ToolLimitValues
): { desktopFiles: string; desktopSize: string; mobileFiles: string; mobileSize: string } {
  const format = new Intl.NumberFormat(locale);
  return {
    desktopFiles: format.format(limits.desktopFiles),
    desktopSize: format.format(limits.desktopSizeMb),
    mobileFiles: format.format(limits.mobileFiles),
    mobileSize: format.format(limits.mobileSizeMb)
  };
}

export function formatToolInfoLine(template: string, values: Record<string, string>): string {
  return fillPlaceholders(template, values);
}

export const toolInfoMessages: Record<Locale, ToolInfoMessages> = {
  en: {
    limitsTitle: 'Limits',
    limitsIntro: 'Everything runs in **this browser**. Larger files may take longer on slower computers.',
    limitsDesktop: '**Computer:** up to {desktopFiles} files or {desktopSize} MB at a time',
    limitsMobile: '**Phone:** up to {mobileFiles} files or {mobileSize} MB at a time',
    limitsNote: 'These limits are the same in every Noduct tool. They protect the memory of **this device**.',
    privacyTitle: 'Privacy',
    privacyIntro: 'Noduct does not upload your files. Work stays on the computer you are using.',
    privacyPoints: [
      'Files never leave **this device**.',
      'Processing happens in **this browser**, not on a server.',
      '**Local Workspace** is saved only on this site, on this computer.'
    ]
  },
  'pt-BR': {
    limitsTitle: 'Limites',
    limitsIntro: 'Tudo acontece **neste navegador**. Arquivos maiores podem demorar mais em computadores mais lentos.',
    limitsDesktop: '**Computador:** até {desktopFiles} arquivos ou {desktopSize} MB por vez',
    limitsMobile: '**Celular:** até {mobileFiles} arquivos ou {mobileSize} MB por vez',
    limitsNote: 'Esses limites são os mesmos em toda ferramenta da Noduct. Eles protegem a memória **deste dispositivo**.',
    privacyTitle: 'Privacidade',
    privacyIntro: 'A Noduct não envia seus arquivos. O trabalho fica no computador que você está usando.',
    privacyPoints: [
      'Os arquivos não saem **deste dispositivo**.',
      'O processamento acontece **neste navegador**, não em um servidor.',
      'A **Área Local** fica só neste site, neste computador.'
    ]
  },
  es: {
    limitsTitle: 'Límites',
    limitsIntro: 'Todo ocurre en **este navegador**. Los archivos más grandes pueden tardar más en equipos más lentos.',
    limitsDesktop: '**Ordenador:** hasta {desktopFiles} archivos o {desktopSize} MB cada vez',
    limitsMobile: '**Móvil:** hasta {mobileFiles} archivos o {mobileSize} MB cada vez',
    limitsNote: 'Estos límites son los mismos en todas las herramientas de Noduct. Protegen la memoria de **este dispositivo**.',
    privacyTitle: 'Privacidad',
    privacyIntro: 'Noduct no sube tus archivos. El trabajo se queda en el equipo que estás usando.',
    privacyPoints: [
      'Los archivos no salen de **este dispositivo**.',
      'El procesamiento ocurre en **este navegador**, no en un servidor.',
      'El **área local** se guarda solo en este sitio, en este equipo.'
    ]
  }
};

export const getToolInfoMessages = (locale: Locale): ToolInfoMessages => toolInfoMessages[locale];
