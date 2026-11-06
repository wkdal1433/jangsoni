import { companion as companionSource, companionFlipX, companionGrab } from 'mascot-assets';
import { mountAtlas } from './sprite.js';
import { blink, scheduleIdleEffect } from './idle-motion.js';
import { setupCompanionChat } from './companion-chat.js';

const poses = ['idle', 'notice', 'balance', 'dizzy'];
const farDistance = 180;
const dragThreshold = 7;
const dockEase = 'cubic-bezier(.2,.75,.3,1)';

export function setupCompanion(root, tour, reduce) {
  const button = document.getElementById('case-companion');
  const chat = setupCompanionChat(button, reduce);
  const art = button.querySelector('.companion-art');
  const closedFrame = button.querySelector('.companion-closed-frame');
  const welcome = root.querySelector('#landing-welcome');
  const journey = root.querySelector('#landing-journey');
  const image = new Image();
  const grabImage = new Image();
  let sprite, tileWidth, tileHeight;
  let grabSprite, grabFrame = 0, holdTimer = 0;
  let drag = null;
  let returnAnimation = null;
  let restTimer = 0;
  let flight = null;
  let updateFrame = 0;
  let idleGesture = 0;

  function editing() {
    return document.activeElement.matches('input, select, textarea, [contenteditable]');
  }

  function canIdle() {
    return !!sprite && !button.hidden && !flight && !editing() && button.dataset.pose === 'idle';
  }

  function stopIdleMotion() {
    art.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  }

  function fidget() {
    const middle = [
      'translateY(-2px) scale(1.01,1.02)',
      'translateX(-2px) rotate(-3deg)',
      'translateY(-1px) rotate(2deg)',
    ];
    art.animate([
      { transform: 'none' },
      { transform: middle[idleGesture++ % middle.length] },
      { transform: 'none' },
    ], { duration: 730, easing: 'ease-in-out' });
  }

  function setPose(pose) {
    const index = poses.indexOf(pose);
    const crop = [(index % 2) * tileWidth, Math.floor(index / 2) * tileHeight, tileWidth, tileHeight];
    sprite.setAttribute('viewBox', crop.join(' '));
    button.dataset.pose = pose;
    if (pose !== 'idle') stopIdleMotion();
  }

  function stopGrab() {
    clearTimeout(holdTimer);
    holdTimer = 0;
    cancelAnimationFrame(grabFrame);
    grabFrame = 0;
    delete button.dataset.grabbing;
    stopIdleMotion();
  }

  function positionGrab() {
    const home = drag.home;
    const touch = drag.type === 'touch';
    const anchorX = touch ? drag.originX - home.x - home.width / 2 : 0;
    const anchorY = touch ? drag.originY - home.y - home.height * .14 : 0;
    drag.x = Math.max(-home.x, Math.min(innerWidth - home.x - home.width, drag.rawX + anchorX));
    drag.y = Math.max(-home.y, Math.min(innerHeight - home.y - home.height, drag.rawY + anchorY));
    button.style.transform = `translate(${drag.x}px,${drag.y}px)`;
  }

  function beginGrab() {
    if (!drag || drag.cancelled || drag.grabbed) return;
    clearTimeout(holdTimer);
    holdTimer = 0;
    drag.grabbed = true;
    button.dataset.dragging = '';
    chat.close();
    stopIdleMotion();
    button.dataset.pose = 'grabbed';
    if (grabSprite) button.dataset.grabbing = '';
    positionGrab();
    if (reduce.matches) return;
    art.animate([
      { transform: 'rotate(-5deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-5deg)' },
    ], { duration: 640, iterations: Infinity, easing: 'ease-in-out' });
    const start = performance.now();
    const tick = now => {
      if (!drag?.grabbed) return;
      if (grabSprite) grabSprite.setAttribute('viewBox', companionGrab.frames[Math.floor(Math.max(0, now - start) / 140) % companionGrab.frames.length].join(' '));
      grabFrame = requestAnimationFrame(tick);
    };
    grabFrame = requestAnimationFrame(tick);
  }

  function resetInteraction() {
    const pointer = drag?.pointer;
    drag = null;
    stopGrab();
    if (pointer !== undefined && button.hasPointerCapture(pointer)) button.releasePointerCapture(pointer);
    returnAnimation?.cancel();
    returnAnimation = null;
    clearTimeout(restTimer);
    restTimer = 0;
    button.style.transform = '';
    delete button.dataset.dragging;
    stopIdleMotion();
    setPose('idle');
  }

  function endFlight() {
    if (!flight) return;
    const { animation, mover, avatar } = flight;
    flight = null;
    animation.cancel();
    mover.remove();
    avatar.classList.remove('companion-source-in-flight');
    delete button.dataset.arriving;
  }

  function update() {
    if (!sprite) return;
    if (flight && (root.hidden || reduce.matches)) endFlight();
    const welcomePassed = welcome.getBoundingClientRect().bottom <= 1;
    const journeyPassed = tour.hidden || journey.getBoundingClientRect().bottom <= 1;
    const visible = root.hidden || (welcomePassed && journeyPassed);
    if (!visible && !flight && !button.hidden) {
      chat.close();
      resetInteraction();
    }
    button.hidden = !visible && !flight;
  }

  function requestUpdate() {
    if (updateFrame) return;
    updateFrame = requestAnimationFrame(() => {
      updateFrame = 0;
      update();
    });
  }

  function handoff(avatar, duration) {
    if (!sprite || reduce.matches || flight) return;
    const from = avatar.getBoundingClientRect();
    if (!from.width || !from.height) return;
    button.hidden = false;
    button.dataset.arriving = '';
    const to = button.getBoundingClientRect();

    const mover = avatar.cloneNode(true);
    mover.className = 'companion-flight';
    mover.setAttribute('aria-hidden', 'true');
    mover.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    Object.assign(mover.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
    document.body.append(mover);
    avatar.classList.add('companion-source-in-flight');
    const scale = Math.min(to.width / from.width, to.height / from.height);
    const x = to.left + (to.width - from.width * scale) / 2 - from.left;
    const y = to.top + (to.height - from.height * scale) / 2 - from.top;
    const animation = mover.animate([
      { transform: 'none' },
      { transform: `translate(${x}px,${y}px) scale(${scale})` },
    ], { duration, easing: dockEase, fill: 'forwards' });
    flight = { animation, mover, avatar };
    animation.finished.then(() => {
      endFlight();
      update();
    }, () => {});
  }

  function returnToDock(x, y, pointerType) {
    button.style.transform = '';
    if (reduce.matches) {
      setPose('idle');
      return;
    }

    const far = Math.hypot(x, y) >= farDistance;
    setPose(far ? 'dizzy' : 'balance');
    const animation = button.animate([
      { transform: `translate(${x}px,${y}px)` },
      { transform: 'none' },
    ], { duration: far ? 300 : 380, easing: dockEase });
    returnAnimation = animation;
    animation.finished.then(() => {
      returnAnimation = null;
      restTimer = setTimeout(() => {
        restTimer = 0;
        setPose(pointerType !== 'touch' && button.matches(':hover') ? 'notice' : 'idle');
      }, far ? 420 : 100);
    }, () => {});
  }

  function endDrag(event) {
    if (drag?.pointer !== event.pointerId) return;
    const { x, y, grabbed, cancelled } = drag;
    drag = null;
    stopGrab();
    delete button.dataset.dragging;
    if (grabbed && event.type === 'pointerup') {
      returnToDock(x, y, event.pointerType);
    } else {
      button.style.transform = '';
      setPose(event.pointerType !== 'touch' && button.matches(':hover') ? 'notice' : 'idle');
      if (event.type === 'pointerup' && !cancelled) chat.toggle();
    }
  }

  button.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch' && !drag && !returnAnimation && !restTimer) setPose('notice');
  });
  button.addEventListener('pointerleave', () => {
    if (!drag && !returnAnimation && !restTimer) setPose('idle');
  });
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag || returnAnimation) return;
    window.getSelection()?.removeAllRanges();
    clearTimeout(restTimer);
    restTimer = 0;
    drag = { pointer: event.pointerId, type: event.pointerType, originX: event.clientX, originY: event.clientY, rawX: 0, rawY: 0, x: 0, y: 0, grabbed: false, cancelled: false, home: button.getBoundingClientRect() };
    button.setPointerCapture(event.pointerId);
    setPose('notice');
    holdTimer = setTimeout(beginGrab, event.pointerType === 'touch' ? 420 : 160);
    event.preventDefault();
  });
  button.addEventListener('pointermove', event => {
    if (drag?.pointer !== event.pointerId) return;
    drag.rawX = event.clientX - drag.originX;
    drag.rawY = event.clientY - drag.originY;
    if (drag.cancelled) return;
    if (!drag.grabbed) {
      if (Math.hypot(drag.rawX, drag.rawY) < dragThreshold) return;
      if (drag.type === 'touch') {
        clearTimeout(holdTimer);
        drag.cancelled = true;
        return;
      }
      beginGrab();
    }
    positionGrab();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, endDrag));
  button.addEventListener('click', event => {
    if (event.detail === 0 && !drag && !returnAnimation) chat.toggle();
  });
  button.addEventListener('contextmenu', event => event.preventDefault());
  button.addEventListener('touchstart', event => {
    if (event.cancelable) event.preventDefault();
  }, { passive: false });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => {
    endFlight();
    if (sprite && (drag || returnAnimation)) resetInteraction();
    requestUpdate();
  });
  reduce.addEventListener('change', () => {
    if (sprite && reduce.matches) resetInteraction();
    update();
  });
  document.addEventListener('focusin', () => {
    if (editing()) stopIdleMotion();
  });
  image.onload = () => {
    tileWidth = image.naturalWidth / 2;
    tileHeight = image.naturalHeight / 2;
    sprite = mountAtlas(art, image, [0, 0, tileWidth, tileHeight], 'companion-sprite', companionFlipX);
    setPose('idle');
    update();
  };
  image.src = companionSource;
  grabImage.onload = () => {
    grabSprite = mountAtlas(art, grabImage, companionGrab.frames[0], 'companion-grab-sprite', companionFlipX);
  };
  grabImage.src = companionGrab.src;
  scheduleIdleEffect(button, reduce, [2500, 4800], canIdle, () => blink(closedFrame));
  scheduleIdleEffect(button, reduce, [2300, 4300], canIdle, fidget);

  return { update, handoff, visit: chat.visit };
}
