export function createNavigation({ showScreen, tour, tourButton, reduce, onViewChange }) {
  let nextVisit = 0;
  const newVisit = () => `${performance.timeOrigin}:${nextVisit++}`;
  let current = { visit: newVisit(), screen: 'intro' };
  const views = new Map();

  history.scrollRestoration = 'manual';
  history.replaceState({ jangsoni: current }, '');

  function rememberView() {
    views.set(current.visit, { scrollY: window.scrollY, tourOpen: !tour.hidden });
  }

  function setTourOpen(open) {
    tour.hidden = !open;
    tourButton.setAttribute('aria-expanded', String(open));
  }

  function goToTarget(target) {
    const destination = document.getElementById(target);
    if (tour.contains(destination)) setTourOpen(true);
    destination.querySelector('[tabindex="-1"]').focus({ preventScroll: true });
    const instant = target === 'analysis-workbench' || reduce.matches;
    destination.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'start' });
  }

  window.addEventListener('popstate', event => {
    const entry = event.state?.jangsoni;
    if (!entry) return;
    rememberView();
    current = entry;
    const view = views.get(entry.visit);
    if (view) setTourOpen(view.tourOpen);
    showScreen(entry.screen);
    if (view) {
      window.scrollTo({ top: view.scrollY, behavior: 'instant' });
    } else if (entry.target) {
      goToTarget(entry.target);
    }
    onViewChange(current.screen);
  });

  return function navigate(screen, target) {
    const previous = current;
    if (screen !== previous.screen || target !== previous.target) {
      rememberView();
      current = { visit: newVisit(), screen, target };
      history.pushState({ jangsoni: current }, '');
    }

    if (!target || screen !== previous.screen) showScreen(screen);
    if (target) goToTarget(target);
    onViewChange(current.screen);
  };
}
