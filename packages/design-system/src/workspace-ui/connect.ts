import {
  DOWNLOAD_READY_EVENT,
  getDownloadCard,
  type DownloadResult
} from '../file-workflow/download-card-runtime';
import type { WorkspaceServices } from './contracts';
import { armWorkspaceManager } from './manager-runtime';
import { formatWorkspaceError, resolveWorkspaceUiLocale } from './messages';
import { armWorkspacePicker } from './picker-runtime';
import { armWorkspaceRecents } from './recents-runtime';

/**
 * Liga todas as superfícies da Área de Trabalho Local presentes em `root` (ADR 0006):
 * origem `Da Área Local` das DropZones, salvar e prévia dos DownloadCards, página de gestão
 * e seção da home. É o único passo que uma ferramenta nova precisa dar.
 */
export function connectLocalWorkspace(root: ParentNode, services: WorkspaceServices): () => void {
  const disposers: Array<() => void> = [];
  const each = (selector: string, arm: (element: HTMLElement) => (() => void) | undefined) =>
    root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      const dispose = arm(element);
      if (dispose) disposers.push(dispose);
    });

  each('[data-drop-zone][data-workspace-picker-id]', (zone) => armWorkspacePicker(zone, services));
  each('[data-workspace-manager]', (manager) => armWorkspaceManager(manager, services));
  each('[data-workspace-recents]', (recents) => armWorkspaceRecents(recents, services));
  each('[data-download-card]', (card) => armResultCard(card, services));

  return () => {
    for (const dispose of disposers.splice(0)) dispose();
  };
}

function armResultCard(card: HTMLElement, services: WorkspaceServices): (() => void) | undefined {
  const controller = getDownloadCard(card);
  if (!controller) return undefined;
  const locale = resolveWorkspaceUiLocale(card.dataset.locale);
  const sourceTool = card.dataset.workspaceSourceTool;
  if (sourceTool) {
    controller.enableSave(
      async ({ file, fileName }) => {
        const { client } = await services.environment();
        const saved = await client.saveDocument({
          name: fileName,
          blob: file,
          size: file.size,
          mimeType: file.type || 'application/pdf',
          // Salvar é uma escolha explícita: o documento fica até o usuário excluí-lo (ADR 0006 D4).
          retention: 'persistent',
          sourceTool
        });
        const preview = await services.thumbnails.forFile(file);
        if (preview) await services.thumbnails.remember(saved.id, preview);
      },
      (error) => formatWorkspaceError(error, locale)
    );
  }

  const onReady = (event: Event) => {
    const result = (event as CustomEvent<DownloadResult>).detail;
    void services.thumbnails.forFile(result.file).then((preview) => {
      if (preview && !card.hidden) controller.setPreview(preview.blob);
    });
  };
  card.addEventListener(DOWNLOAD_READY_EVENT, onReady);
  return () => card.removeEventListener(DOWNLOAD_READY_EVENT, onReady);
}
