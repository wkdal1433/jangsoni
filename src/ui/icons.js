import {
  createElement, ArrowDown, ArrowLeft, ArrowUpRight, Check, CircleHelp, Clock,
  Ellipsis, FileText, Info, Landmark, LayoutGrid, Link, Minus, Plus, Scale,
  Search, Stethoscope, X,
} from 'lucide';

// All interface icons are selected here from Lucide; do not add emoji or other sets.
const icons = {
  'arrow-down': ArrowDown, 'arrow-left': ArrowLeft, 'arrow-up-right': ArrowUpRight,
  check: Check, 'circle-help': CircleHelp, clock: Clock, ellipsis: Ellipsis,
  'file-text': FileText, info: Info, landmark: Landmark, 'layout-grid': LayoutGrid,
  link: Link, minus: Minus, plus: Plus, scale: Scale, search: Search,
  stethoscope: Stethoscope, x: X,
};

export function renderIcon(element, name = element.dataset.icon) {
  if (!Object.hasOwn(icons, name)) throw new Error('Unsupported Lucide icon: ' + name);
  element.dataset.icon = name;
  element.replaceChildren(createElement(icons[name], { class: 'app-icon', 'aria-hidden': 'true', focusable: 'false' }));
}

export function setupIcons() {
  document.querySelectorAll('[data-icon]').forEach(element => renderIcon(element));
  // The original business script creates these controls dynamically.
  const controls = '.cn-link a,.cn-check,.tl-del,#intro-yak .ok';
  function decorate(element) {
    const first = element.firstChild;
    if (first?.nodeType !== Node.TEXT_NODE) return;
    const match = first.textContent.match(/^(🔗 |✓|✕)/u);
    if (!match) return;
    const name = match[1] === '🔗 ' ? 'link' : match[1] === '✓' ? 'check' : 'x';
    first.textContent = first.textContent.slice(match[0].length);
    const icon = document.createElement('span');
    renderIcon(icon, name);
    element.prepend(icon);
    if (element.classList.contains('tl-del')) element.setAttribute('aria-label', element.title);
  }
  const decorateTree = element => {
    if (!(element instanceof Element)) return;
    if (element.matches(controls)) decorate(element);
    element.querySelectorAll(controls).forEach(decorate);
  };
  decorateTree(document.body);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(decorateTree)))
    .observe(document.body, { childList: true, subtree: true });
}
