import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const selection = JSON.parse(readFileSync(join(root, 'src/mascot-assets.json'), 'utf8'));
const profile = JSON.parse(readFileSync(join(root, selection.pack), 'utf8'));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const browser = await chromium.launch({ channel: 'chrome' });

try {
  for (const [width, height] of [[390, 844], [360, 640], [320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference', serviceWorkers: 'block' });
    page.setDefaultTimeout(7000);
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
    await page.route(/^https?:/, route => route.abort());
    await page.goto(pathToFileURL(join(root, 'index.html')).href);
    await page.locator('.companion-grab-sprite').waitFor({ state: 'attached' });
    await page.locator('#show-tour').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('#landing-about').getBoundingClientRect().top) < 2);
    if (selection.pack.includes('/guide/')) {
      const landmarks = await page.evaluate(async crops => {
        const source = new Image(); source.src = document.querySelector('.mascot-atlas image').getAttribute('href'); await source.decode();
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        return crops.map(([x0, y0]) => {
          ctx.clearRect(0, 0, 512, 512); ctx.drawImage(source, -x0, -y0);
          const pixels = ctx.getImageData(0, 0, 512, 512).data;
          const mask = new Set();
          for (let y = 145; y < 200; y++) for (let x = 290; x < 365; x++) {
            const i = (y * 512 + x) * 4, [r, g, b, a] = pixels.slice(i, i + 4);
            if (a > 180 && r < 110 && g < 92 && b < 85 && r - g >= 5 && g - b >= 3) mask.add(y * 512 + x);
          }
          const components = [];
          while (mask.size) {
            const first = mask.values().next().value, queue = [first]; mask.delete(first);
            let sx = 0, sy = 0;
            for (let k = 0; k < queue.length; k++) {
              const i = queue[k]; sx += i % 512; sy += Math.floor(i / 512);
              for (const next of [i - 1, i + 1, i - 512, i + 512]) if (mask.delete(next)) queue.push(next);
            }
            components.push({ x: sx / queue.length, y: sy / queue.length, count: queue.length });
          }
          return components.sort((a, b) => b.count - a.count)[0];
        });
      }, [profile.journey.stand, ...profile.journey.walk]);
      assert.ok(landmarks.every(point => point.count > 100), 'Guide nose landmark must be measurable in every frame');
      for (const axis of ['x', 'y']) assert.ok(Math.max(...landmarks.map(point => point[axis])) - Math.min(...landmarks.map(point => point[axis])) < 1, 'Guide walking frame ' + axis + ' registration: ' + JSON.stringify(landmarks));
    }
    const client = await page.context().newCDPSession(page);
    const touch = (type, x, y) => client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y }] });
    const swipe = async direction => {
      const y = direction > 0 ? height * .75 : height * .3;
      await touch('touchStart', width / 2, y);
      for (let i = 1; i <= 6; i++) {
        await touch('touchMove', width / 2, y - direction * 30 * i);
        await page.waitForTimeout(25);
      }
      await touch('touchEnd');
    };
    const point = index => page.locator('.journey-snap-point').nth(index).evaluate(el => scrollY + el.getBoundingClientRect().top);
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await point(1));
    await page.waitForTimeout(180);
    const geometry = () => page.evaluate(() => {
      const header = document.querySelector('.journey-sticky').getBoundingClientRect();
      const speech = document.querySelector('#journey-speech').getBoundingClientRect();
      const actor = document.querySelector('.journey-mascot-wrap').getBoundingClientRect();
      const board = document.querySelector('.journey-board').getBoundingClientRect();
      return { headerTop: header.top, headerBottom: header.bottom, headerWidth: header.width, speechLeft: speech.left, speechRight: speech.right, actorLeft: actor.left, actorRight: actor.right, boardTop: board.top, boardBottom: board.bottom, text: document.querySelector('#journey-speech').textContent };
    });
    const first = await geometry();
    assert.ok(Math.abs(first.headerTop) < 2, 'Mobile mascot area must stick to viewport top');
    assert.ok(first.speechRight < first.actorLeft, 'Speech must be left of the left-facing mascot');
    assert.ok(first.speechLeft >= 0 && first.actorRight <= width && first.headerWidth > width - 45);
    assert.ok(first.boardBottom <= height, 'The accordion board must fit in the viewport');
    const frames = new Set();
    for (let i = 0; i < 5; i++) { frames.add(await page.locator('.mascot-atlas').getAttribute('viewBox')); await page.waitForTimeout(100); }
    assert.ok(frames.size >= 3, 'Mobile scrolling must play real walking frames');
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await point(3));
    await page.waitForTimeout(160);
    const next = await geometry();
    assert.ok(Math.abs(next.headerTop - first.headerTop) < 2);
    assert.notEqual(next.text, first.text, 'Speech must follow the active card');
    const card = await page.locator('.journey-step').nth(3).locator('.journey-card').boundingBox();
    assert.ok(card.y >= next.headerBottom - 2, 'The selected card must be readable below the fixed mascot');
    assert.ok(card.width > width - 45, 'Mobile cards must use the full available column');
    const speeches = new Set();
    for (let index = 0; index < 7; index++) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await point(index));
      await page.waitForTimeout(100);
      const state = await geometry();
      assert.ok(Math.abs(state.headerTop) < 2);
      assert.ok(Math.abs(state.actorLeft - first.actorLeft) < .5, 'Speech length must not move the mascot horizontally');
      assert.equal(await page.locator('.journey-step').nth(index).getAttribute('aria-current'), 'step');
      assert.equal(await page.locator('.step-toggle[aria-expanded="true"]').count(), 1, 'Only the current mobile card may be expanded');
      assert.equal(await page.locator('.step-toggle').nth(index).getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('.journey-step').nth(index).locator('.step-detail').evaluate(el => el.inert), false);
      speeches.add(state.text);
    }
    assert.equal(speeches.size, 7, 'Every card must have its own spoken line');
    await page.waitForTimeout(1100);
    const stand = await page.locator('.mascot-atlas').getAttribute('viewBox');
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.mascot-atlas').getAttribute('viewBox'), stand, 'Walking must stop at a fixed cadence');
    const swipeOnCard = async (selector, direction) => {
      const r = await page.locator('.journey-step.is-active ' + selector).boundingBox();
      const x = r.x + r.width * .55, y = r.y + r.height * .5;
      await touch('touchStart', x, y);
      for (let i = 1; i <= 30; i++) { await touch('touchMove', x, y - direction * 3 * i); await page.waitForTimeout(8); }
      await touch('touchEnd');
    };
    for (const selector of (width === 390 ? ['.step-toggle', 'p', '.step-features', '.step-open'] : ['p', '.step-open'])) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await point(2));
      await page.waitForTimeout(1100);
      if (selector === '.step-open') {
        await page.locator('.journey-steps').evaluate(el => { el.style.maxHeight = (el.clientHeight - 24) + 'px'; });
        assert.ok(await page.locator('.journey-steps').evaluate(el => el.scrollHeight > el.clientHeight + 2), 'Reproduce a slightly overflowing card list');
      }
      for (const [direction, index] of [[1, 3], [-1, 2]]) {
        await swipeOnCard(selector, direction);
        await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !('journeyTransition' in document.documentElement.dataset), await point(index));
        assert.equal(await page.locator('.journey-step').nth(index).getAttribute('aria-current'), 'step', selector + ' swipe must select the adjacent card');
        assert.equal(await page.locator('#intro').isVisible(), true, 'Swiping over a feature button must not open a work screen');
        assert.equal(await page.locator('.journey-step.is-active .journey-card').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)', 'The expanded card must have a white background');
      }
      await page.locator('.journey-steps').evaluate(el => { el.style.removeProperty('max-height'); el.scrollTop = 0; });
    }
    const entry = await page.evaluate(() => {
      const el = document.querySelector('#landing-guide').getBoundingClientRect();
      return { guideEnd: scrollY + el.bottom - innerHeight, title: scrollY + document.querySelector('#landing-journey').getBoundingClientRect().top };
    });
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), entry.guideEnd);
    await page.waitForTimeout(300);
    await swipe(1);
    for (let i = 0; i < 12; i++) {
      assert.equal(await page.locator('.companion-flight').count(), 0, 'Title entry must not hand the mascot to the corner');
      assert.equal(await page.locator('.mascot-atlas').getAttribute('viewBox'), stand, 'Entering the tour must not start walking');
      await page.waitForTimeout(80);
    }
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - entry.title) < 2, 'The first swipe into the tour must align its title to viewport top');
    const cardSnap = async (index, direction, hammer = false) => {
      const destination = await point(index), origin = await page.evaluate(() => scrollY);
      await swipe(direction);
      const started = performance.now();
      await page.waitForTimeout(90);
      const moving = await page.evaluate(() => scrollY);
      assert.ok(moving > Math.min(origin, destination) + 1 && moving < Math.max(origin, destination) - 1, 'Card transition must animate');
      const walking = await page.evaluate(() => new Promise(resolve => {
        const actor = document.querySelector('.mascot-atlas');
        const wrap = document.querySelector('.journey-mascot-wrap');
        const frames = new Set([actor.getAttribute('viewBox')]);
        const positions = [];
        const observer = new MutationObserver(() => frames.add(actor.getAttribute('viewBox')));
        observer.observe(actor, { attributes: true, attributeFilter: ['viewBox'] });
        const sample = () => { const r = wrap.getBoundingClientRect(); positions.push({ x: r.x, y: r.y - document.querySelector('.journey-sticky').getBoundingClientRect().y }); };
        sample(); const timer = setInterval(sample, 16);
        setTimeout(() => { observer.disconnect(); clearInterval(timer); resolve({ frames: [...frames], positions }); }, 340);
      }));
      assert.ok(walking.frames.length >= 3, 'Card ' + index + ' must play real walking frames: ' + JSON.stringify(walking.frames));
      assert.ok(Math.max(...walking.positions.map(p => p.x)) - Math.min(...walking.positions.map(p => p.x)) < .5, 'Walking must not sway horizontally');
      assert.ok(Math.max(...walking.positions.map(p => p.y)) - Math.min(...walking.positions.map(p => p.y)) < 1.5, 'Mobile walking must have only a small smooth vertical lift');
      if (hammer) await swipe(-direction);
      await page.waitForFunction(top => Math.abs(scrollY - top) < 2, destination);
      assert.ok(performance.now() - started >= 790, 'Card travel must keep its fixed walking duration');
      await page.waitForTimeout(160);
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - destination) < 2, 'Extra gestures must not skip or reverse the card');
      assert.equal(await page.locator('.journey-step').nth(index).getAttribute('aria-current'), 'step');
      const settled = await geometry();
      assert.ok(Math.abs(settled.headerTop) < 2 && Math.abs(settled.actorLeft - first.actorLeft) < .5);
      assert.equal(await page.locator('.mascot-atlas').getAttribute('viewBox'), stand, 'Arrival must stand still without starting a second walk');
      assert.equal(await page.locator('.step-toggle[aria-expanded="true"]').count(), 1);
      assert.ok(await page.locator('.journey-step').nth(index).locator('.step-detail').evaluate(el => el.getBoundingClientRect().height > 90));
      for (let other = 0; other < 7; other++) if (other !== index) {
        assert.ok(await page.locator('.journey-step').nth(other).locator('.step-detail').evaluate(el => el.inert && el.getBoundingClientRect().height < 1), 'Inactive cards must show their title only');
      }
    };
    for (let index = 0; index < 7; index++) await cardSnap(index, 1, index === 2);
    const demo = await page.locator('.demo-section').evaluate(el => scrollY + el.getBoundingClientRect().top);
    await swipe(1);
    await page.waitForFunction(top => Math.abs(scrollY - top) < 2, demo);
    await page.waitForFunction(() => !('journeyTransition' in document.documentElement.dataset));
    await swipe(-1);
    await page.waitForFunction(top => Math.abs(scrollY - top) < 2, await point(6));
    await page.waitForTimeout(180);
    for (let index = 5; index >= 0; index--) await cardSnap(index, -1);
    await swipe(-1);
    await page.waitForFunction(top => Math.abs(scrollY - top) < 2, entry.title);
    await page.waitForTimeout(180);
    assert.equal(await page.locator('.mascot-atlas').getAttribute('viewBox'), stand);
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await point(0));
    await page.waitForTimeout(1100);
    for (const index of [5, 2, 6, 0]) {
      await page.locator('.step-toggle').nth(index).tap();
      await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !('journeyTransition' in document.documentElement.dataset), await point(index));
      assert.equal(await page.locator('.step-toggle').nth(index).getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('.step-toggle[aria-expanded="true"]').count(), 1);
    }
    await page.locator('.demo-section').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.locator('#case-companion').waitFor();
    assert.ok(await page.locator('.journey-mascot-wrap').evaluate(el => el.getBoundingClientRect().bottom <= 0));
    const dock = page.locator('#case-companion'), panel = page.locator('#companion-chat');
    const center = async () => { const r = await dock.boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
    const tap = await center();
    await touch('touchStart', tap.x, tap.y); await page.waitForTimeout(80); await touch('touchEnd');
    await panel.locator('.companion-chat-invitation').waitFor();
    await panel.locator('.companion-chat-invitation [data-chat-close]').click();
    for (const [dx, dy, pose] of [[-80, -100, 'balance'], [-150, -270, 'dizzy']]) {
      const home = await dock.boundingBox(), start = await center();
      await touch('touchStart', start.x, start.y);
      await page.waitForTimeout(180);
      assert.equal(await dock.getAttribute('data-grabbing'), null, 'A short touch must not grab');
      await page.waitForTimeout(350);
      assert.notEqual(await dock.getAttribute('data-grabbing'), null);
      assert.equal(await panel.isVisible(), false);
      assert.equal(await dock.locator('.companion-grab-sprite').isVisible(), true);
      const flailFrames = new Set();
      for (let i = 0; i < 4; i++) { flailFrames.add(await dock.locator('.companion-grab-sprite').getAttribute('viewBox')); await page.waitForTimeout(80); }
      assert.equal(flailFrames.size, 2, 'Held mascot must flail');
      await touch('touchMove', start.x + dx, start.y + dy);
      const held = await dock.boundingBox();
      assert.ok(Math.abs(held.x + held.width / 2 - start.x - dx) < 3);
      assert.ok(Math.abs(held.y + held.height * .14 - start.y - dy) < 3, 'Head anchor must follow the finger');
      await touch('touchEnd');
      assert.equal(await dock.getAttribute('data-pose'), pose);
      await page.waitForFunction(() => document.querySelector('#case-companion').dataset.pose === 'idle');
      const returned = await dock.boundingBox();
      assert.ok(Math.abs(returned.x - home.x) < 1 && Math.abs(returned.y - home.y) < 1);
      assert.equal(await panel.isVisible(), false, 'Long press release must not open chat');
    }
    const cancelled = await center();
    await touch('touchStart', cancelled.x, cancelled.y); await page.waitForTimeout(80);
    await touch('touchMove', cancelled.x - 20, cancelled.y - 30); await page.waitForTimeout(500);
    assert.equal(await dock.getAttribute('data-grabbing'), null, 'Movement before hold must cancel the hold');
    await touch('touchEnd'); assert.equal(await panel.isVisible(), false);
    await touch('touchStart', cancelled.x, cancelled.y); await page.waitForTimeout(500); await touch('touchCancel');
    assert.equal(await dock.getAttribute('data-grabbing'), null);
    assert.equal(await dock.getAttribute('data-dragging'), null);
    if (width === 390) {
      const screens = ['timeline', 'yakgwan', 'koicd', 'law', 'pubmed', 'fss', 'cardnews'];
      await page.locator('.journey-snap-point').first().evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.waitForTimeout(1100);
      for (const [index, screen] of screens.entries()) {
        await page.locator('.step-toggle').nth(index).tap();
        await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !('journeyTransition' in document.documentElement.dataset), await point(index));
        await page.locator('[data-preview-go=' + screen + ']').tap();
        await page.locator('#' + screen).waitFor();
        if (await panel.isVisible()) await panel.locator('[data-guide-confirm]').click();
        await page.goBack();
        await page.locator('#intro').waitFor();
        await page.waitForFunction(top => Math.abs(scrollY - top) < 2, await point(index));
      }
    }
    assert.deepEqual(errors, []);
    console.log(width + '×' + height, 'title entry, seven-card accordion swipe/tap, slow swipes on card text/titles/tags/buttons including list overflow, white active card, fixed mascot axis/small lift, standing, inactive focus exclusion, frame registration, tap/hold/flail and seven feature links at 390px');
    await page.close();
  }
} finally { await browser.close(); }
