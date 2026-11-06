import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright-core';
import { serveTestPreview } from './test-preview.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const ref = process.env.JANGSONI_FLOW_REF;
const smallHeight = Number(process.env.JANGSONI_FLOW_SMALL_HEIGHT || 0);
const tall = process.argv.includes('--tall');
const initialSize = tall ? { width: 430, height: 739 } : { width: 390, height: 844 };
const changedSize = tall ? { width: 430, height: 932 } : { width: 390, height: 780 };
let modelHtml = ref ? execFileSync('git', ['show', ref + ':index.html'], { cwd: root, maxBuffer: 40e6 }) : null;
if (smallHeight) {
  assert.ok(Number.isFinite(smallHeight) && smallHeight > 0);
  modelHtml = (modelHtml || readFileSync(new URL('../index.html', import.meta.url))).toString().replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, start, css, end) => start + css.replace(/\b(\d+(?:\.\d+)?)svh\b/g, (_, value) => String(Number(value) * smallHeight / 100) + 'px') + end);
}
const preview = await serveTestPreview(modelHtml ? { '/profile': modelHtml } : {});
const publicUrl = process.env.JANGSONI_FLOW_URL;
assert.ok(!(publicUrl && smallHeight), 'The fixed-small-viewport model is a local test, not a change to the public page');
const url = publicUrl || (modelHtml ? preview.origin + '/profile' : preview.url);

async function open(browser, width = 390, height = 844) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: tall ? 3 : 1, isMobile: true, hasTouch: true, reducedMotion: 'no-preference', serviceWorkers: 'block' });
  page.setDefaultTimeout(5000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:/, route => new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort());
  await page.goto(url);
  await page.locator('.mascot-atlas').waitFor({ state: 'attached' });
  await page.locator('#show-tour').tap();
  await page.waitForFunction(() => Math.abs(document.querySelector('#landing-about').getBoundingClientRect().top) < 2);
  await page.evaluate(() => {
    window.flowHandoffs = 0;
    window.flowTouches = [];
    let start;
    addEventListener('touchstart', event => { const touch = event.touches[0]; start = touch && { clientX: touch.clientX, clientY: touch.clientY }; }, { passive: true });
    addEventListener('touchmove', event => {
      const touch = event.touches[0];
      if (!start || !touch || !event.target.closest?.('#landing-welcome,#landing-about,#landing-guide,#landing-journey,.demo-section')) return;
      window.flowTouches.push({ delta: Math.abs(touch.clientY - start.clientY), vertical: Math.abs(touch.clientY - start.clientY) > Math.abs(touch.clientX - start.clientX), cancelable: event.cancelable, prevented: event.defaultPrevented, snap: getComputedStyle(document.documentElement).scrollSnapType });
    }, { passive: true });
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1 && node.classList.contains('companion-flight')) window.flowHandoffs++;
    }))).observe(document.body, { childList: true });
  });
  return { page, errors };
}

const top = (page, selector, end = false) => page.locator(selector).evaluate((el, end) => scrollY + el.getBoundingClientRect().top + (end ? Math.max(0, el.offsetHeight - innerHeight) : 0), end);
const cardTop = (page, index) => top(page, '.journey-snap-point:nth-child(' + (index + 1) + ')');
async function arrived(page, expected, label) {
  await page.waitForFunction(y => Math.abs(scrollY - y) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), expected, { timeout: 3500 }).catch(async error => {
    throw new Error(label + ': ' + JSON.stringify({ expected, actual: await page.evaluate(() => ({ y: scrollY, height: innerHeight, moving: document.documentElement.hasAttribute('data-journey-transition') })) }), { cause: error });
  });
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType), 'none', label + ': native root snapping must stay off after controller motion');
}

async function inputFor(page, mode) {
  if (mode === 'webkit-mouse') return async (direction, selector) => {
    const r = await page.locator(selector || '#landing-about').boundingBox();
    const x = r.x + r.width / 2, y = selector ? Math.min(r.y + r.height / 2, 500) : 430;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x, y - direction * 90, { steps: 20 }); await page.mouse.up();
  };
  if (mode === 'wheel') return async direction => { await page.mouse.move(180, 430); await page.mouse.wheel(0, direction * 140); };
  const client = await page.context().newCDPSession(page);
  if (mode === 'devtools') await client.send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
  return async (direction, selector) => {
    const size = page.viewportSize();
    const r = selector ? await page.locator(selector).boundingBox() : null;
    const x = Math.round(r ? r.x + r.width / 2 : size.width / 2);
    const y = Math.round(r ? r.y + r.height / 2 : size.height * .65);
    const send = async (type, nextY) => mode === 'devtools'
      ? client.send('Input.emulateTouchFromMouseEvent', { type: ({ start: 'mousePressed', move: 'mouseMoved', end: 'mouseReleased' })[type], x, y: nextY ?? y, button: 'left' })
      : client.send('Input.dispatchTouchEvent', { type: ({ start: 'touchStart', move: 'touchMove', end: 'touchEnd' })[type], touchPoints: type === 'end' ? [] : [{ x, y: nextY ?? y }] });
    await send('start');
    for (let i = 1; i <= 25; i++) { await send('move', y - direction * i * 3); await page.waitForTimeout(12); }
    await send('end', y - direction * 75);
  };
}

try {
  for (const [name, type] of [['Chrome', chromium], ['WebKit', webkit]]) {
    const browser = await type.launch(name === 'Chrome' ? { channel: 'chrome' } : {});
    try {
      // A height change during motion used to cancel the animation at its current position.
      const { page, errors } = await open(browser, initialSize.width, initialSize.height);
      const swipe = await inputFor(page, name === 'Chrome' ? 'touch' : 'webkit-mouse');
      const readingOffset = await top(page, '#landing-about', true) - await top(page, '#landing-about');
      await swipe(1);
      await page.waitForTimeout(90);
      assert.ok(await page.evaluate(() => document.documentElement.hasAttribute('data-journey-transition')));
      await page.setViewportSize(changedSize);
      await arrived(page, await top(page, '#landing-about') + Math.max(readingOffset, await top(page, '#landing-about', true) - await top(page, '#landing-about')), name + ' changing height must not pull the selected reading stop back');
      await swipe(1); await page.waitForTimeout(90);
      await page.setViewportSize(initialSize);
      await arrived(page, await top(page, '#landing-guide'), name + ' changing height must not cancel section exit');
      if (tall) {
        const guideStart = await top(page, '#landing-guide');
        const guideOffset = await top(page, '#landing-guide', true) - guideStart;
        assert.ok(guideOffset > 2);
        await swipe(1); await page.waitForTimeout(90);
        await page.setViewportSize(changedSize);
        assert.ok(await page.locator('#landing-guide').evaluate(el => el.offsetHeight < innerHeight), 'The guide must become shorter than the expanded viewport');
        await arrived(page, await top(page, '#landing-guide') + guideOffset, name + ' a now-fitting section must not send the swipe back to its top');
        await swipe(1); await arrived(page, await top(page, '#landing-journey'), name + ' next swipe after height expansion must leave the guide');
        await swipe(-1); await page.waitForTimeout(90);
        await page.setViewportSize(initialSize);
        await arrived(page, await top(page, '#landing-guide'), name + ' shrinking height must not pull a reverse reading stop forward');
      }
      // Separate card setup: the full forward/reverse walkthrough below never jumps over a section.
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await cardTop(page, 2));
      await page.waitForTimeout(1100);
      await swipe(1, '.journey-step.is-active p'); await page.waitForTimeout(90);
      await page.setViewportSize(changedSize);
      await arrived(page, await cardTop(page, 3), name + ' card target must follow the new height');
      assert.equal(await page.locator('.journey-step.is-active').getAttribute('aria-current'), 'step');
      await swipe(-1, '.journey-step.is-active p'); await page.waitForTimeout(90);
      await page.setViewportSize(initialSize);
      await arrived(page, await cardTop(page, 2), name + ' reverse card transition must survive a height change');
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await top(page, '#landing-about'));
      await page.waitForTimeout(500);
      for (const [direction, selector, end] of [[-1, '#landing-welcome', true], [-1, '#landing-welcome', false], [1, '#landing-welcome', true], [1, '#landing-about', false]]) {
        await swipe(direction);
        await arrived(page, await top(page, selector, end), name + ' welcome readable end and both section boundaries');
      }
      await page.locator('#in-code').evaluate(el => el.focus({ preventScroll: true }));
      assert.equal(await page.locator('#landing-about').evaluate(el => getComputedStyle(el).touchAction), 'auto', 'Focused inputs must release native touch scrolling');
      await page.locator('#in-code').evaluate(el => el.blur());
      assert.match(await page.locator('#landing-about').evaluate(el => getComputedStyle(el).touchAction), /pan-x/);
      await page.evaluate(() => { const dialog = document.createElement('dialog'); dialog.id = 'flow-test-dialog'; document.body.append(dialog); dialog.showModal(); });
      assert.equal(await page.locator('#landing-about').evaluate(el => getComputedStyle(el).touchAction), 'auto', 'Open dialogs must release the landing gesture controller');
      await page.evaluate(() => document.getElementById('flow-test-dialog').remove());
      assert.deepEqual(errors, []);
      console.log(name + ': height changes during intro entry/exit and forward/reverse walking complete at the updated target; welcome both ways; input/dialog native touch release');
      await page.close();
    } finally { await browser.close(); }
  }

  if (!process.argv.includes('--resize-only')) {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const mode of (process.argv.includes('--touch-only') ? ['touch'] : ['touch', 'devtools', 'wheel'])) for (const [width, height] of (tall ? [[430, 739], [430, 932], [440, 956], [430, 1100]] : [[390, 844], [320, 568]])) {
      const { page, errors } = await open(browser, width, height);
      const swipe = await inputFor(page, mode);
      const settle = () => page.waitForTimeout(1100);
      const reach = async (selector, direction, label) => {
        for (let i = 0; i < 20; i++) {
          const target = await top(page, selector), current = await page.evaluate(() => scrollY);
          if (Math.abs(current - target) < 2) return;
          assert.ok(direction * (target - current) > 0, label + ' must not skip its destination: ' + JSON.stringify({ target, current, viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, focus: document.activeElement.id, moving: document.documentElement.hasAttribute('data-journey-transition') })) }));
          await swipe(direction); await settle();
        }
        await arrived(page, await top(page, selector), label);
      };
      if (await top(page, '#landing-about', true) > await top(page, '#landing-about') + 2) {
        await swipe(1); await arrived(page, await top(page, '#landing-about', true), mode + ' intro bottom');
      }
      await swipe(1); await arrived(page, await top(page, '#landing-guide'), mode + ' guide entry');
      await reach('#landing-journey', 1, mode + ' guide to tour title');
      for (let index = 0; index < 7; index++) {
        await swipe(1); await arrived(page, await cardTop(page, index), mode + ' forward card ' + index);
        assert.equal(await page.locator('.journey-step').nth(index).getAttribute('aria-current'), 'step');
      }
      await swipe(1); await arrived(page, await top(page, '.demo-section'), mode + ' tour to result section');
      assert.equal(await page.evaluate(() => window.flowHandoffs), 1, 'Hand the mascot to the corner once when leaving the tour');
      await reach('#analysis-workbench', 1, mode + ' results to input');
      assert.equal(await page.evaluate(() => window.flowHandoffs), 1, 'Reading a tall result section must not repeat the mascot handoff');
      await reach('.demo-section', -1, mode + ' input to results');
      for (let index = 6; index >= 0; index--) {
        await swipe(-1); await arrived(page, await cardTop(page, index), mode + ' reverse card ' + index);
      }
      await swipe(-1); await arrived(page, await top(page, '#landing-journey'), mode + ' reverse to tour title');
      await reach('#landing-guide', -1, mode + ' reverse to guide');
      await reach('#landing-about', -1, mode + ' reverse to introduction');
      if (mode !== 'wheel') {
        const touches = await page.evaluate(() => window.flowTouches);
        const firstCancelable = touches.find(event => event.vertical && event.cancelable);
        assert.ok(firstCancelable?.prevented, 'Cancel the first available native vertical touch move: ' + JSON.stringify(touches.slice(0, 5)));
        assert.ok(touches.filter(event => event.vertical && event.cancelable).every(event => event.prevented), 'Every controlled vertical touch must suppress native pan');
        assert.ok(touches.every(event => event.snap === 'none'), 'Native root snapping must not take over during touch input');
      }
      assert.deepEqual(errors, []);
      console.log(mode + ' ' + width + 'x' + height + ': continuous intro → guide → title → seven cards → results → input and reverse, with no programmatic section jumps');
      await page.close();
    }
  } finally { await browser.close(); }
  }
} finally { await preview.close(); }
