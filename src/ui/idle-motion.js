export function scheduleIdleEffect(element, reduce, [minimum, maximum], canPlay, play) {
  let inView = !('IntersectionObserver' in window);
  let timer = 0;

  function schedule() {
    clearTimeout(timer);
    if (!inView || document.hidden || reduce.matches) return;
    timer = setTimeout(() => {
      if (canPlay()) play();
      schedule();
    }, minimum + Math.random() * (maximum - minimum));
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      schedule();
    }).observe(element);
  }
  document.addEventListener('visibilitychange', schedule);
  reduce.addEventListener('change', schedule);
  schedule();
}

export function blink(frame) {
  const doubleBlink = Math.random() < .18;
  const closed = { opacity: 1, easing: 'step-end' };
  const open = { opacity: 0, easing: 'step-end' };
  const frames = doubleBlink
    ? [closed, { ...open, offset: .38 }, { ...closed, offset: .62 }, open]
    : [closed, open];
  frame.animate(frames, { duration: doubleBlink ? 380 : 145 });
}
