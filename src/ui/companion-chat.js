const developmentReply = '현재 해당 기능은 개발중입니다!!';

export function setupCompanionChat(trigger) {
  const panel = document.getElementById('companion-chat');
  const invitation = panel.querySelector('.companion-chat-invitation');
  const conversation = panel.querySelector('.companion-chat-conversation');
  const log = panel.querySelector('[role="log"]');
  const form = panel.querySelector('form');
  const message = form.querySelector('textarea');
  const files = form.querySelector('input[type="file"]');
  const attach = form.querySelector('[data-chat-attach]');
  const pending = form.querySelector('.companion-chat-pending');
  const fileNames = pending.querySelector('span');
  const yes = panel.querySelector('[data-chat-yes]');
  const viewport = window.visualViewport;

  function position() {
    if (!viewport || panel.hidden) return;
    const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    panel.style.setProperty('--chat-viewport-height', viewport.height + 'px');
    panel.style.setProperty('--chat-viewport-bottom', bottom + 'px');
  }

  function close(restoreFocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus && !trigger.hidden) trigger.focus({ preventScroll: true });
  }

  function toggle() {
    if (!panel.hidden) {
      close(true);
      return;
    }
    invitation.hidden = false;
    conversation.hidden = true;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    position();
    yes.focus({ preventScroll: true });
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

  yes.addEventListener('click', () => {
    invitation.hidden = true;
    conversation.hidden = false;
    scrollToLatest();
    message.focus({ preventScroll: true });
  });
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
      event.stopPropagation();
      close(true);
    }
  });
  panel.addEventListener('wheel', event => event.stopPropagation(), { passive: true });
  document.addEventListener('pointerdown', event => {
    if (!panel.contains(event.target) && !trigger.contains(event.target)) close();
  });
  viewport?.addEventListener('resize', position);
  viewport?.addEventListener('scroll', position);

  return { close, toggle };
}
