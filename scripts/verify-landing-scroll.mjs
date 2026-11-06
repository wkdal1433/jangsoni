import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const browser = await chromium.launch({ channel: 'chrome' });

async function open(options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', ...options });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:/, route => route.abort());
  await page.goto(pathToFileURL(join(root, 'index.html')).href);
  await page.locator('.mascot-atlas').waitFor({ state: 'attached' });
  await page.locator('.companion-sprite').waitFor({ state: 'attached' });
  await page.evaluate(() => {
    window.scrollAudit = [];
    window.addEventListener('wheel', event => window.scrollAudit.push({ event: 'wheel', time: performance.now(), y: scrollY, delta: event.deltaY, cancelable: event.cancelable, prevented: event.defaultPrevented }), { passive: true });
    window.addEventListener('resize', () => window.scrollAudit.push({ event: 'resize', time: performance.now(), y: scrollY, height: innerHeight }));
  });
  await page.mouse.move(10, 10);
  return { page, errors };
}

async function tour(page) {
  await page.locator('#show-tour').click();
  await page.waitForFunction(() => Math.abs(document.querySelector('#landing-about').getBoundingClientRect().top) < 2);
}

async function targets(page, cards = true) {
  return page.evaluate(cards => {
    const point = (selector, name) => ({ name, top: scrollY + document.querySelector(selector).getBoundingClientRect().top });
    const list = [point('#landing-welcome', 'welcome')];
    if (!document.querySelector('#landing-tour').hidden) {
      list.push(point('#landing-about', 'about'), point('#landing-guide', 'guide'), point('#landing-journey', 'journey'));
      if (cards) document.querySelectorAll('.journey-step').forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        list.push({ name: 'card-' + i, top: scrollY + (rect.top + rect.bottom) / 2 - innerHeight / 2 });
      });
      list.push(point('.demo-section', 'demo'));
    }
    list.push(point('#analysis-workbench', 'input'));
    return list;
  }, cards);
}

async function jump(page, top) {
  await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), top);
  await page.waitForTimeout(160);
}

async function snap(page, from, to, hammer = false) {
  await page.evaluate(() => { window.scrollAudit = []; });
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - from.top) < 2, from.name + ' origin');
  await page.mouse.move(10, 10);
  const direction = Math.sign(to.top - from.top);
  const walking = from.name.startsWith('card-') && to.name.startsWith('card-');
  const wheelClient = hammer ? await page.context().newCDPSession(page) : null;
  const started = performance.now();
  await page.mouse.wheel(0, direction * 90);
  await page.waitForTimeout(90);
  const middle = await page.evaluate(() => scrollY);
  assert.ok(middle > Math.min(from.top, to.top) + 1 && middle < Math.max(from.top, to.top) - 1, from.name + ' → ' + to.name + ' must animate');
  if (hammer) {
    await Promise.all([0, 20, 40, 60].map((delay, i) => new Promise(resolve => setTimeout(resolve, delay)).then(() =>
      wheelClient.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 10, y: 10, deltaX: 0, deltaY: (i % 2 ? -1 : 1) * 2400 })
    )));
    await wheelClient.detach();
  }
  await page.waitForFunction(top => Math.abs(scrollY - top) < 2, to.top, { timeout: 2500 }).catch(async error => {
    throw new Error(JSON.stringify({ from, to, state: await page.evaluate(() => ({ y: scrollY, focus: document.activeElement.outerHTML.slice(0, 160), audit: window.scrollAudit })) }), { cause: error });
  });
  assert.ok(performance.now() - started >= (walking ? 820 : 360), from.name + ' → ' + to.name + ' duration');
  await page.waitForTimeout(160);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - to.top) < 2, 'Fast input must not skip the destination: ' + JSON.stringify({ from, to, state: await page.evaluate(() => ({ y: scrollY, audit: window.scrollAudit })) }));
  const actors = await page.evaluate(() => {
    const visible = selector => {
      const el = document.querySelector(selector), r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && getComputedStyle(el).visibility !== 'hidden';
    };
    return { inline: visible('.mascot-stage') || visible('.journey-mascot-wrap'), mini: visible('#case-companion') };
  });
  assert.ok(!(actors.inline && actors.mini), 'Only one mascot instance may be visible');
}

try {
  for (const [width, height] of [[1440, 900], [1024, 768], [1366, 600]]) {
    const { page, errors } = await open({ viewport: { width, height } });
    await tour(page);
    const route = await targets(page);
    await jump(page, route.find(target => target.name === 'card-0').top);
    const geometry = await page.evaluate(() => {
      const actor = document.querySelector('.journey-mascot-wrap').getBoundingClientRect();
      const bubble = document.querySelector('#journey-speech').getBoundingClientRect();
      const tail = getComputedStyle(document.querySelector('#journey-speech'), '::after');
      return { actor: { top: actor.top, center: actor.left + actor.width / 2 }, bubble: { top: bubble.top, bottom: bubble.bottom, left: bubble.left, right: bubble.right, center: bubble.left + bubble.width / 2 }, tailBottom: tail.bottom };
    });
    assert.ok(geometry.bubble.top >= 0 && geometry.bubble.left >= 0 && geometry.bubble.right <= width, 'Desktop bubble must stay in viewport');
    assert.ok(geometry.bubble.bottom <= geometry.actor.top - 5 && geometry.actor.top - geometry.bubble.bottom < 18, 'Bubble must sit above the mascot');
    assert.ok(Math.abs(geometry.bubble.center - geometry.actor.center) < 2, 'Tail must point at the actual mascot center');
    assert.equal(geometry.tailBottom, '-7px');
    assert.deepEqual(errors, []);
    console.log('Desktop speech', width + '×' + height, 'above the mascot, centered connected tail and no clipping');
    await page.close();
  }
  for (const height of [600, 900]) for (const expanded of [false, true]) {
    const { page, errors } = await open({ viewport: { width: 1440, height } });
    if (expanded) await tour(page);
    const route = await targets(page);
    await jump(page, 0);
    for (let i = 1; i < route.length; i++) {
      let from = route[i - 1];
      if (['welcome', 'about', 'guide', 'demo'].includes(from.name) && route[i].top - from.top > height + 2) {
        await page.mouse.wheel(0, 90); await page.waitForTimeout(200);
        const reading = await page.evaluate(() => scrollY);
        assert.ok(reading > from.top + 1 && reading < route[i].top - 2, from.name + ' must remain readable before snapping');
        from = { name: from.name + '-bottom', top: route[i].top - height };
        await jump(page, from.top);
      }
      await snap(page, from, route[i], true);
    }
    for (let i = route.length - 2; i >= 0; i--) await snap(page, route[i + 1], route[i], true);
    assert.deepEqual(errors, []);
    console.log('Desktop', height + 'px:', route.map(target => target.name).join(' ↔ '), 'all boundaries, both directions, fast wheel and tall-section reading');
    await page.close();
  }

  {
    const { page, errors } = await open({ viewport: { width: 1366, height: 600 } });
    const route = await targets(page);
    await page.mouse.wheel(0, 90);
    await page.waitForTimeout(250);
    const reading = await page.evaluate(() => scrollY);
    assert.ok(reading > 40 && reading < route[1].top - 100, 'Tall welcome content must remain readable');
    await jump(page, route[1].top - 600);
    await snap(page, { name: 'welcome-bottom', top: route[1].top - 600 }, route[1]);
    await page.locator('#in-code').evaluate(el => el.focus({ preventScroll: true }));
    await page.locator('#in-code').fill('I21');
    await jump(page, route[1].top + 120);
    await page.mouse.move(10, 10);
    await page.mouse.wheel(0, -90);
    await page.waitForTimeout(250);
    const editing = await page.evaluate(() => scrollY);
    assert.ok(editing > route[1].top + 5 && editing < route[1].top + 100, 'Focused fields must not trigger snapping');
    assert.equal(await page.locator('#in-code').inputValue(), 'I21');
    assert.deepEqual(errors, []);
    console.log('Short viewport: tall-section reading and focused-input native scroll');
    await page.close();
  }

  for (const expanded of [false, true]) {
    const { page, errors } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    if (expanded) await tour(page);
    const route = await targets(page, false);
    for (const target of [...route.slice(1), ...route.slice(0, -1).reverse()]) {
      await page.evaluate(top => scrollTo({ top: Math.max(0, top - 18), behavior: 'instant' }), target.top);
      await page.waitForFunction(top => Math.abs(scrollY - top) < 2, target.top);
    }
    await page.locator('#in-code').evaluate(el => el.focus({ preventScroll: true }));
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType), 'none');
    assert.deepEqual(errors, []);
    console.log('Mobile:', route.map(target => target.name).join(' ↔ '), 'native section snapping and input exception');
    await page.close();
  }

  {
    const { page, errors } = await open();
    await page.mouse.wheel(0, 90); await page.waitForTimeout(80);
    await page.locator('#show-tour').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('#landing-about').getBoundingClientRect().top) < 2);
    await page.waitForTimeout(500);
    assert.ok(Math.abs(await page.locator('#landing-about').evaluate(el => el.getBoundingClientRect().top)) < 2, 'Navigation must cancel the previous scroll transition');
    await page.mouse.wheel(0, 90); await page.waitForTimeout(80);
    await page.locator('#in-code').evaluate(el => el.focus({ preventScroll: true }));
    const stopped = await page.evaluate(() => scrollY); await page.waitForTimeout(650);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - stopped) < 2, 'Input focus must cancel an active transition');
    assert.deepEqual(errors, []);
    console.log('Interrupted transitions: navigation and input focus cancel safely');
    await page.close();
  }

  {
    const { page, errors } = await open({ reducedMotion: 'reduce' });
    await page.mouse.wheel(0, 90);
    await page.waitForTimeout(200);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - 90) < 2);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType), 'none');
    assert.deepEqual(errors, []);
    console.log('Reduced motion: native scroll');
    await page.close();
  }
} finally {
  await browser.close();
}
