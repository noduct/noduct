import { expect, test, type Locator } from '@playwright/test';
import { topology, type Locale } from '@noduct/tool-runtime';
import { readFileSync } from 'node:fs';

const locales: readonly Locale[] = ['en', 'pt-BR', 'es'];
const themes = ['light', 'dark'] as const;

async function visualSignature(root: Locator) {
  return root.evaluate((element) => {
    const selectors = ['a', 'button', 'nav', '[role="dialog"]'];
    const nodes = [
      element,
      ...selectors.flatMap((selector) => [...element.querySelectorAll(selector)])
    ];
    return nodes.map((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const box = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };

      // Diferenças aprovadas na Fase 2 (#39): os controles de Settings e Menu cresceram
      // para 44 px. A normalização conserva a baseline original e neutraliza somente o
      // tamanho antigo e os deslocamentos de layout diretamente causados por esse aumento.
      if (element.tagName === 'HEADER') {
        const wideNavigation = window.matchMedia('(min-width: 721px)').matches;
        const settings = element.querySelector<HTMLElement>('[data-settings-trigger]');
        const menuButton = element.querySelector<HTMLElement>('[data-menu-button]');
        const settingsDelta = Math.max(0, (settings?.getBoundingClientRect().width ?? 38) - 38);
        const menuDelta = Math.max(0, (menuButton?.getBoundingClientRect().width ?? 40) - 40);

        const participatesInLayout = box.width > 0 || box.height > 0;
        if (wideNavigation && participatesInLayout && node.matches('nav, nav *'))
          box.x += settingsDelta;
        if (participatesInLayout && node.matches('[data-settings-trigger]')) {
          box.x += settingsDelta + (wideNavigation ? 0 : menuDelta);
          box.y += (box.height - 38) / 2;
          box.width = 38;
          box.height = 38;
        }
        if (participatesInLayout && node.matches('[data-menu-button]')) {
          box.x += menuDelta;
          box.y += (box.height - 40) / 2;
          box.width = 40;
          box.height = 40;
        }
      }

      return {
        tag: node.tagName.toLowerCase(),
        role: node.getAttribute('role'),
        text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        box: {
          x: Math.round(box.x * 100) / 100,
          y: Math.round(box.y * 100) / 100,
          width: Math.round(box.width * 100) / 100,
          height: Math.round(box.height * 100) / 100
        },
        style: {
          display: style.display,
          position: style.position,
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          padding: style.padding,
          gap: style.gap
        }
      };
    });
  });
}

type ShellSnapshot = {
  headerAria: string;
  footerAria: string;
  headerStyles: Awaited<ReturnType<typeof visualSignature>>;
  footerStyles: Awaited<ReturnType<typeof visualSignature>>;
};

function normalizeNonVisualStates(snapshot: ShellSnapshot): ShellSnapshot {
  const normalized = structuredClone(snapshot);
  // O rodapé fica abaixo do conteúdo da home, que cresce com novas seções (ADR 0006). Compará-lo
  // relativo ao próprio topo mantém a verificação do layout do shell sem depender dessa altura.
  const footerTop = normalized.footerStyles[0]?.box.y ?? 0;
  for (const entry of normalized.footerStyles)
    if (entry.box.width > 0 || entry.box.height > 0)
      entry.box.y = Math.round((entry.box.y - footerTop) * 100) / 100;
  for (const entry of normalized.headerStyles) {
    // A baseline v1 registrou frames diferentes da animação do dropdown fechado. O estilo
    // computado continua sendo comparado, e a geometria final aberta é verificada abaixo.
    if (entry.style.display === 'block' && entry.style.padding === '8px 12px') {
      entry.box = { x: 0, y: 0, width: 0, height: 0 };
    }
    // Descendentes do diálogo fechado não participam da pintura. O browser mudou o
    // display computado desses nós após a composição do shell, sem diferença visual.
    if (Object.values(entry.box).every((value) => value === 0)) entry.style.display = 'hidden';
  }
  return normalized;
}

// Instrumento da migração da Fase 2 (#39): a baseline foi gerada localmente (Windows) antes de mover o
// shell. No CI a paridade contínua hub × ferramentas é coberta por shell-parity.spec.ts (Fase 5).
test.skip(Boolean(process.env.CI), 'Baseline local de migração; paridade contínua em shell-parity.spec.ts.');

test('matches the pre-migration hub shell with only the approved differences', async ({
  page
}, testInfo) => {
  for (const locale of locales) {
    for (const theme of themes) {
      await page.goto(topology.hubPath('', locale));
      await page.evaluate((selectedTheme) => {
        localStorage.setItem('noduct-theme', selectedTheme);
        localStorage.removeItem('noduct-locale');
      }, theme);
      await page.reload();
      await page.getByRole('banner').waitFor();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      const header = page.getByRole('banner');
      const footer = page.getByRole('contentinfo');
      const snapshot: ShellSnapshot = {
        headerAria: await header.ariaSnapshot(),
        footerAria: await footer.ariaSnapshot(),
        headerStyles: await visualSignature(header),
        footerStyles: await visualSignature(footer)
      };

      const baseline = JSON.parse(
        readFileSync(testInfo.snapshotPath(`${locale}-${theme}.json`), 'utf8')
      ) as ShellSnapshot;
      expect(normalizeNonVisualStates(snapshot)).toEqual(normalizeNonVisualStates(baseline));

      if (page.viewportSize()?.width && page.viewportSize()!.width > 720) {
        const details = header.locator('[data-categories-menu]');
        await details.evaluate((element) => element.setAttribute('open', ''));
        await details.locator('div').evaluate((element) =>
          element.getAnimations().forEach((animation) => animation.finish())
        );
        const itemBox = await details.locator('a').nth(1).boundingBox();
        expect(itemBox?.width).toBeCloseTo(206.8, 1);
        expect(itemBox?.height).toBeCloseTo(36.15, 1);
        await details.evaluate((element) => element.removeAttribute('open'));
      }
    }
  }
});
