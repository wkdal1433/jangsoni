import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serveTestPreview } from './test-preview.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const preview = await serveTestPreview();
const browser = await chromium.launch({ channel: 'chrome' });
const deadline = setTimeout(() => browser.close(), 180000);
try {
  for (const [width, height] of [[390, 844], [320, 568], [293, 664]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference', serviceWorkers: 'block' });
    page.setDefaultTimeout(5000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https?:/, route => preview.matches(route.request().url()) ? route.continue() : route.abort());
    await page.goto(preview.url);
    await page.locator('.mascot-atlas').waitFor({ state: 'attached' });
    await page.locator('#show-tour').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('#landing-about').getBoundingClientRect().top) < 2);
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
    // Use Chrome's mouse-to-touch emulator, not dispatchTouchEvent or DOM-created events.
    const mouseTouch = (type, x, y) => client.send('Input.emulateTouchFromMouseEvent', { type, x: Math.round(x), y: Math.round(y), button: 'left' });
    await page.evaluate(() => {
      window.inputAudit = []; window.journeyDurations = [];
      let initialY, started;
      for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'gotpointercapture', 'touchstart', 'touchmove', 'touchend', 'click']) {
        window.addEventListener(type, event => {
          if (type === 'touchstart') initialY = event.touches[0]?.clientY;
          window.inputAudit.push({ type, pointer: event.pointerType, cancelable: event.cancelable, prevented: event.defaultPrevented, delta: type === 'touchmove' ? initialY - event.touches[0].clientY : undefined });
        });
      }
      new MutationObserver(() => {
        if (document.documentElement.hasAttribute('data-journey-transition')) started ??= performance.now();
        else if (started !== undefined) { window.journeyDurations.push(performance.now() - started); started = undefined; }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-journey-transition'] });
    });
    const point = index => page.locator('.journey-snap-point').nth(index).evaluate(el => scrollY + el.getBoundingClientRect().top);
    const align = async index => {
      await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), await point(index));
      await page.waitForTimeout(1100);
    };
    const arrived = async index => {
      await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), await point(index));
      assert.equal(await page.locator('.journey-step').nth(index).getAttribute('aria-current'), 'step');
      assert.equal(await page.locator('#intro').isVisible(), true, 'A drag over a feature button must not activate it');
      assert.equal(await page.locator('.journey-step.is-active .journey-card').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    };
    const drag = async (selector, direction, { horizontal = false, distance = 90, cancel = false } = {}) => {
      const target = page.locator('.journey-step.is-active ' + selector);
      const r = await target.boundingBox();
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      assert.equal(await target.evaluate((el, { x, y }) => el.contains(document.elementFromPoint(x, y)), { x, y }), true, selector + ' must actually receive the initial press');
      await page.evaluate(() => { window.inputAudit = []; });
      await mouseTouch('mousePressed', x, y);
      for (let i = 1; i <= distance / 3; i++) {
        await mouseTouch('mouseMoved', x + (horizontal ? i * 3 : 0), y - (horizontal ? 0 : direction * i * 3));
        await page.waitForTimeout(16);
      }
      if (cancel) await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await mouseTouch('mouseReleased', x + (horizontal ? distance : 0), y - (horizontal ? 0 : direction * distance));
    };
    for (const selector of width === 390 ? ['p', '.step-toggle', '.step-features', '.step-open'] : ['p', '.step-open']) {
      await align(2);
      for (const [direction, index] of [[1, 3], [-1, 2]]) {
        await drag(selector, direction);
        const audit = await page.evaluate(() => window.inputAudit);
        assert.ok(audit.some(event => event.type === 'pointerdown' && event.pointer === 'touch'), 'Mouse input must be converted to a touch pointer');
        assert.ok(audit.some(event => event.type === 'gotpointercapture'), 'Board must capture the gesture');
        assert.ok(audit.some(event => event.type === 'pointermove' && event.prevented));
        if (selector === 'p' && direction === 1) {
          assert.ok(audit.some(event => event.type === 'touchmove' && event.cancelable && Math.abs(event.delta) < 18), 'Reproduce initial motion below the gesture threshold');
          assert.ok(audit.some(event => event.type === 'touchmove' && !event.cancelable), 'Reproduce later non-cancelable legacy touch moves');
        }
        await arrived(index);
      }
    }
    if (width === 390) {
      await align(0);
      const actorLeft = await page.locator('.journey-mascot-wrap').evaluate(el => el.getBoundingClientRect().left);
      for (let index = 1; index < 7; index++) { await drag('p', 1); await arrived(index); }
      for (let index = 5; index >= 0; index--) { await drag('p', -1); await arrived(index); }
      assert.ok(Math.abs(await page.locator('.journey-mascot-wrap').evaluate(el => el.getBoundingClientRect().left) - actorLeft) < .5, 'Keep the existing top mascot position');
      await align(2);
      await drag('p', 1, { distance: 9 }); await page.waitForTimeout(1000); await arrived(2);
      await drag('p', 1, { horizontal: true }); await page.waitForTimeout(1000); await arrived(2);
      await drag('p', 1, { cancel: true }); await page.waitForTimeout(1000); await arrived(2);
      await drag('p', 1); await page.waitForTimeout(80); await drag('p', -1); await arrived(3);
      await page.locator('.journey-steps').evaluate(el => { el.style.maxHeight = (el.clientHeight - 30) + 'px'; });
      await drag('.step-open', 1); await arrived(4);
      await page.locator('.journey-steps').evaluate(el => { el.style.removeProperty('max-height'); el.scrollTop = 0; });
      await align(2);
      const r = await page.locator('.step-toggle').nth(3).boundingBox();
      await mouseTouch('mousePressed', r.x + 40, r.y + r.height / 2);
      await mouseTouch('mouseReleased', r.x + 40, r.y + r.height / 2);
      await arrived(3);
      if (process.env.JANGSONI_TEST_SCREENSHOT) await page.screenshot({ path: process.env.JANGSONI_TEST_SCREENSHOT });
      await align(2);
      const link = await page.locator('.journey-step.is-active .step-open').boundingBox();
      await mouseTouch('mousePressed', link.x + link.width / 2, link.y + link.height / 2);
      await mouseTouch('mouseReleased', link.x + link.width / 2, link.y + link.height / 2);
      await page.locator('#koicd').waitFor();
      if (await page.locator('#companion-chat[data-guiding]').isVisible()) await page.locator('[data-guide-confirm]').tap();
      await page.goBack(); await page.locator('#intro').waitFor();
      const walks = (await page.evaluate(() => window.journeyDurations)).filter(duration => duration > 600);
      assert.ok(walks.length >= 14, 'Observe complete walking transitions across the card checks');
      assert.ok(walks.every(duration => duration >= 880), 'Repeated input must retain the fixed walking duration');
    }
    assert.deepEqual(errors, []);
    console.log(width + '×' + height + ': Chrome mouse-to-touch conversion, slow card text/title/tags/link drags both ways, pointer capture and non-cancelable touch fallback' + (width === 390 ? ', all seven cards, jitter/horizontal/cancel, rapid re-drag, overflow, taps and feature navigation' : ''));
    await page.close();
  }
} finally {
  clearTimeout(deadline);
  await browser.close();
  await preview.close();
}
