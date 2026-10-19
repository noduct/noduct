/** Emitido no `[data-select]` quando o usuário escolhe outra opção; `detail.value` traz o valor. */
export const SELECT_CHANGE_EVENT = 'noduct:select-change';

export interface SelectController {
  readonly value: string;
  setValue(value: string): void;
}

const controllers = new WeakMap<HTMLElement, SelectController>();

export function getSelect(root: HTMLElement): SelectController | undefined {
  return controllers.get(root) ?? armSelect(root);
}

/** Combobox “select-only” do WAI-ARIA APG: o foco fica no gatilho e a opção ativa é anunciada. */
export function armSelect(root: HTMLElement): SelectController | undefined {
  const trigger = root.querySelector<HTMLButtonElement>('[data-select-trigger]');
  const listbox = root.querySelector<HTMLElement>('[data-select-listbox]');
  const valueLabel = root.querySelector<HTMLElement>('[data-select-value]');
  if (!trigger || !listbox || !valueLabel) return undefined;
  const options = () => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')];
  let active = -1;
  let typed = '';
  let typedAt = 0;

  const selectedIndex = () =>
    Math.max(
      0,
      options().findIndex((option) => option.dataset.value === root.dataset.value)
    );

  const setActive = (index: number) => {
    const list = options();
    active = Math.min(Math.max(index, 0), list.length - 1);
    list.forEach((option, position) => (option.dataset.active = String(position === active)));
    const current = list[active];
    if (current) {
      trigger.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
    }
  };

  const open = () => {
    if (!listbox.hidden) return;
    listbox.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    setActive(selectedIndex());
    document.addEventListener('pointerdown', onOutside, true);
  };

  const close = () => {
    if (listbox.hidden) return;
    listbox.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    document.removeEventListener('pointerdown', onOutside, true);
  };

  const apply = (value: string, emit: boolean) => {
    const option = options().find((item) => item.dataset.value === value);
    if (!option) return;
    const changed = root.dataset.value !== value;
    root.dataset.value = value;
    options().forEach((item) =>
      item.setAttribute('aria-selected', String(item.dataset.value === value))
    );
    valueLabel.textContent = option.querySelector('span')?.textContent ?? option.textContent;
    if (emit && changed)
      root.dispatchEvent(new CustomEvent(SELECT_CHANGE_EVENT, { bubbles: true, detail: { value } }));
  };

  const choose = (index: number) => {
    const value = options()[index]?.dataset.value;
    if (value !== undefined) apply(value, true);
    close();
    trigger.focus();
  };

  function onOutside(event: Event) {
    if (!root.contains(event.target as Node)) close();
  }

  const typeahead = (key: string) => {
    const now = Date.now();
    typed = now - typedAt > 600 ? key : typed + key;
    typedAt = now;
    const list = options();
    const start = listbox.hidden ? selectedIndex() : active;
    for (let step = 1; step <= list.length; step += 1) {
      const index = (start + step) % list.length;
      const text = list[index]?.textContent?.trim().toLocaleLowerCase() ?? '';
      if (text.startsWith(typed.toLocaleLowerCase())) {
        open();
        setActive(index);
        return;
      }
    }
  };

  trigger.addEventListener('click', () => (listbox.hidden ? open() : close()));
  trigger.addEventListener('keydown', (event) => {
    const isOpen = !listbox.hidden;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) open();
        else setActive(active + 1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) open();
        else setActive(active - 1);
        return;
      case 'Home':
      case 'End':
        if (!isOpen) return;
        event.preventDefault();
        setActive(event.key === 'Home' ? 0 : options().length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen) choose(active);
        else open();
        return;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        return;
      case 'Tab':
        close();
        return;
      default:
        if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey)
          typeahead(event.key);
    }
  });
  listbox.addEventListener('click', (event) => {
    const option = (event.target as Element).closest<HTMLElement>('[role="option"]');
    if (option) choose(options().indexOf(option));
  });
  listbox.addEventListener('pointermove', (event) => {
    const option = (event.target as Element).closest<HTMLElement>('[role="option"]');
    if (option) setActive(options().indexOf(option));
  });

  const controller: SelectController = {
    get value() {
      return root.dataset.value ?? '';
    },
    setValue(value) {
      apply(value, false);
    }
  };
  controllers.set(root, controller);
  return controller;
}

export function initializeSelects(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-select]').forEach((select) => {
    if (!controllers.has(select)) armSelect(select);
  });
}
