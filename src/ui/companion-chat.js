import { companionGuides } from './companion-guides.js';

const developmentReply = '현재 해당 기능은 개발중입니다!!';
const guideStorageKey = 'jangsoni:companion-guides:v1';

export function setupCompanionChat(trigger, reduce) {
  const panel = document.getElementById('companion-chat');
  const invitation = panel.querySelector('.companion-chat-invitation');
  const conversation = panel.querySelector('.companion-chat-conversation');
  const guide = panel.querySelector('.companion-chat-guide');
  const guideTitle = guide.querySelector('h3');
  const guideSteps = guide.querySelector('ol');
  const guideButton = panel.querySelector('[data-chat-guide]');
  const closeButton = panel.querySelector('.companion-chat-close');
  const log = panel.querySelector('[role="log"]');
  const form = panel.querySelector('form');
  const message = form.querySelector('textarea');
  const files = form.querySelector('input[type="file"]');
  const attach = form.querySelector('[data-chat-attach]');
  const pending = form.querySelector('.companion-chat-pending');
  const fileNames = pending.querySelector('span');
  const yes = panel.querySelector('[data-chat-yes]');
  const viewport = window.visualViewport;
  const seenGuides = new Set();
  let currentScreen;
  let motion;
  try {
    const stored = JSON.parse(localStorage.getItem(guideStorageKey) || '[]');
    if (Array.isArray(stored)) stored.forEach(screen => seenGuides.add(screen));
  } catch {}

  function show(view) {
    const wasHidden = panel.hidden;
    const previousHeight = panel.getBoundingClientRect().height;
    const guiding = view === guide;
    if (panel.open && panel.hasAttribute('data-guiding') !== guiding) panel.close();
    motion?.cancel();
    invitation.hidden = view !== invitation;
    conversation.hidden = view !== conversation;
    guide.hidden = view !== guide;
    closeButton.hidden = guiding;
    guideButton.hidden = guiding || !companionGuides[currentScreen];
    panel.toggleAttribute('data-guiding', guiding);
    document.documentElement.classList.toggle('companion-guiding', guiding);
    panel.hidden = false;
    if (!panel.open) {
      if (guiding) panel.showModal();
      else panel.show();
    }
    trigger.setAttribute('aria-expanded', 'true');
    position();
    if (reduce.matches) return;
    const nextHeight = panel.getBoundingClientRect().height;
    motion = panel.animate([
      {
        height: (wasHidden ? nextHeight : previousHeight) + 'px',
        opacity: wasHidden ? 0 : .72,
        transform: wasHidden ? 'translateY(12px) scale(.97)' : 'translateY(3px)',
      },
      { height: nextHeight + 'px', opacity: 1, transform: 'none' },
    ], { duration: 260, easing: 'cubic-bezier(.2,.75,.3,1)' });
  }

  function position() {
    if (!viewport || panel.hidden) return;
    const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    panel.style.setProperty('--chat-viewport-height', viewport.height + 'px');
    panel.style.setProperty('--chat-viewport-bottom', bottom + 'px');
  }

  function close(restoreFocus = false) {
    if (panel.hidden) return;
    motion?.cancel();
    panel.close();
    panel.hidden = true;
    panel.removeAttribute('data-guiding');
    document.documentElement.classList.remove('companion-guiding');
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus && !trigger.hidden) trigger.focus({ preventScroll: true });
  }

  function toggle() {
    if (!panel.hidden) {
      close(true);
      return;
    }
    show(invitation);
    yes.focus({ preventScroll: true });
  }

  function showGuide() {
    const content = companionGuides[currentScreen];
    if (!content) return;
    guideTitle.textContent = content.title;
    guideSteps.replaceChildren(...content.steps.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    show(guide);
    guideTitle.focus({ preventScroll: true });
  }

  function visit(screen) {
    if (screen === currentScreen) return;
    currentScreen = screen;
    guideButton.hidden = !companionGuides[screen];
    if (!panel.hidden && !conversation.hidden) return;
    close();
    if (companionGuides[screen] && !seenGuides.has(screen)) showGuide();
  }

  function openConversation() {
    show(conversation);
    scrollToLatest();
    message.focus({ preventScroll: true });
  }

  function scrollToLatest() {
    log.scrollTop = log.scrollHeight;
  }

  function updateAttachments() {
    pending.hidden = files.files.length === 0;
    fileNames.textContent = Array.from(files.files, file => file.name).join(', ');
  }

  function appendMessage(sender, text, attachments = []) {
    const bubble = document.createElement('div');
    bubble.className = 'companion-chat-bubble';
    bubble.dataset.sender = sender;
    const speaker = document.createElement('span');
    speaker.className = 'companion-chat-speaker';
    speaker.textContent = sender === 'user' ? '나' : '장손이';
    bubble.append(speaker);
    if (text) {
      const content = document.createElement('p');
      content.textContent = text;
      bubble.append(content);
    }
    if (attachments.length) {
      const list = document.createElement('ul');
      attachments.forEach(file => {
        const item = document.createElement('li');
        item.textContent = '첨부 · ' + file.name;
        list.append(item);
      });
      bubble.append(list);
    }
    log.append(bubble);
  }

  yes.addEventListener('click', openConversation);
  panel.querySelector('[data-guide-confirm]').addEventListener('click', () => {
    seenGuides.add(currentScreen);
    try { localStorage.setItem(guideStorageKey, JSON.stringify([...seenGuides])); } catch {}
    show(invitation);
    yes.focus({ preventScroll: true });
  });
  guideButton.addEventListener('click', showGuide);
  panel.querySelectorAll('[data-chat-close]').forEach(button => {
    button.addEventListener('click', () => close(true));
  });
  attach.addEventListener('click', () => files.click());
  form.querySelector('[data-chat-remove]').addEventListener('click', () => {
    files.value = '';
    updateAttachments();
    attach.focus({ preventScroll: true });
  });
  files.addEventListener('change', updateAttachments);
  message.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    form.requestSubmit();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = message.value.trim();
    const attachments = Array.from(files.files);
    if (!text && !attachments.length) return;
    appendMessage('user', text, attachments);
    appendMessage('assistant', developmentReply);
    form.reset();
    updateAttachments();
    message.focus({ preventScroll: true });
    scrollToLatest();
  });

  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing) {
      event.preventDefault();
      event.stopPropagation();
      if (guide.hidden) close(true);
    }
  });
  panel.addEventListener('cancel', event => {
    event.preventDefault();
    if (guide.hidden) close(true);
  });
  panel.addEventListener('wheel', event => event.stopPropagation(), { passive: true });
  document.addEventListener('pointerdown', event => {
    if (!panel.contains(event.target) && !trigger.contains(event.target)) close();
  });
  viewport?.addEventListener('resize', position);
  viewport?.addEventListener('scroll', position);
  reduce.addEventListener('change', () => { if (reduce.matches) motion?.cancel(); });

  return { close, toggle, visit };
}
