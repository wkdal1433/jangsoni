import companionSource from '../../assets/mascot/runtime/companion.webp';
import { mountAtlas } from './sprite.js';

const poses = ['idle', 'notice', 'balance', 'dizzy'];
const farDistance = 180;
const dockEase = 'cubic-bezier(.2,.75,.3,1)';

export function setupCompanion(root, tour, reduce) {
  const button = document.getElementById('case-companion');
  const example = root.querySelector('.demo-section');
  const workbench = document.getElementById('analysis-workbench');
  const image = new Image();
  let sprite, tileWidth, tileHeight;
  let drag = null;
  let returnAnimation = null;
  let restTimer = 0;
  let flight = null;
  let updateFrame = 0;

  function setPose(pose) {
    const index = poses.indexOf(pose);
    const crop = [(index % 2) * tileWidth, Math.floor(index / 2) * tileHeight, tileWidth, tileHeight];
    sprite.setAttribute('viewBox', crop.join(' '));
    button.dataset.pose = pose;
  }

  function resetInteraction() {
    const pointer = drag?.pointer;
    drag = null;
    if (pointer !== undefined && button.hasPointerCapture(pointer)) button.releasePointerCapture(pointer);
    returnAnimation?.cancel();
    returnAnimation = null;
    clearTimeout(restTimer);
    restTimer = 0;
    button.style.transform = '';
    delete button.dataset.dragging;
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
    const visible = root.hidden || workbench.getBoundingClientRect().top < innerHeight * .7
      || (!tour.hidden && example.getBoundingClientRect().top < innerHeight * .6);
    if (!visible && !flight && !button.hidden) resetInteraction();
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

  function returnToDock(x, y) {
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
        setPose(button.matches(':hover') ? 'notice' : 'idle');
      }, far ? 420 : 100);
    }, () => {});
  }

  function endDrag(event) {
    if (drag?.pointer !== event.pointerId) return;
    const { x, y } = drag;
    drag = null;
    delete button.dataset.dragging;
    returnToDock(x, y);
  }

  button.addEventListener('pointerenter', () => {
    if (!drag && !returnAnimation && !restTimer) setPose('notice');
  });
  button.addEventListener('pointerleave', () => {
    if (!drag && !returnAnimation && !restTimer) setPose('idle');
  });
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag || returnAnimation) return;
    clearTimeout(restTimer);
    restTimer = 0;
    drag = { pointer: event.pointerId, originX: event.clientX, originY: event.clientY, x: 0, y: 0 };
    button.setPointerCapture(event.pointerId);
    button.dataset.dragging = '';
    setPose('notice');
    event.preventDefault();
  });
  button.addEventListener('pointermove', event => {
    if (drag?.pointer !== event.pointerId) return;
    drag.x = event.clientX - drag.originX;
    drag.y = event.clientY - drag.originY;
    button.style.transform = `translate(${drag.x}px,${drag.y}px)`;
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, endDrag));
  button.addEventListener('click', event => {
    if (event.detail === 0 && !drag && !returnAnimation && !restTimer) returnToDock(0, 0);
  });

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
  image.onload = () => {
    tileWidth = image.naturalWidth / 2;
    tileHeight = image.naturalHeight / 2;
    sprite = mountAtlas(button, image, [0, 0, tileWidth, tileHeight], 'companion-sprite');
    setPose('idle');
    update();
  };
  image.src = companionSource;

  return { update, handoff };
}
