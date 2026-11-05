import { setupIntro } from './intro.js';
import { setupJourney } from './journey.js';
import { createMascot } from './mascot.js';
import { mascotAtlas } from './mascot-config.js';
import { createNavigation } from './navigation.js';
import { setupCompanion } from './companion.js';

const root = document.getElementById('intro');
const tour = document.getElementById('landing-tour');
const tourButton = document.getElementById('show-tour');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const companion = setupCompanion(root, tour, reduce);

// The bundled entry point connects the new UI modules to the existing business script.
export const navigate = createNavigation({
  showScreen, tour, tourButton, reduce,
  onViewChange(screen) {
    companion.update();
    companion.visit(screen);
  },
});

setupIntro(root, reduce, navigate);
setupJourney(root, tour, reduce, createMascot(root, mascotAtlas), companion.handoff);
