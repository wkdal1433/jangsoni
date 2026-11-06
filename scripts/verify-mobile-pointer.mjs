import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [width, height] of [[390, 844], [293, 664]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: false, isMobile: false, reducedMotion: 'no-preference', serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https?:/, route => route.abort());
    await page.goto(pathToFileURL(join(root, 'index.html')).href);
    await page.locator('.mascot-atlas').waitFor({ state: 'attached' });
    await page.locator('#show-tour').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('#landing-about').getBoundingClientRect().top) < 2);
    await page.evaluate(() => {
      window.pointerInputs = []; window.touchInputs = 0;
      window.addEventListener('pointerdown', event => window.pointerInputs.push(event.pointerType));
      window.addEventListener('touchstart', () => window.touchInputs++);
    });
    const point = index => page.locator('.journey-snap-point').nth(index).evaluate(el => scrollY + el.getBoundingClientRect().top);
    const align = async index => { await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await point(index)); await page.waitForTimeout(1100); };
    const drag = async (selector, direction, distance = 84) => {
      const r = await page.locator('.journey-step.is-active ' + selector).boundingBox();
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(x, y - direction * distance, { steps: 20 });
      await page.mouse.up();
    };
    const arrived = async (index, label) => {
      await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), await point(index), { timeout: 2500 }).catch(async error => {
        throw new Error(label + ': ' + JSON.stringify(await page.evaluate(() => ({ y: scrollY, active: document.querySelector('.journey-step.is-active').dataset.step, selection: getSelection().toString(), pointers: window.pointerInputs, touches: window.touchInputs }))), { cause: error });
      });
      assert.equal(await page.locator('.journey-step').nth(index).getAttribute('aria-current'), 'step');
      assert.equal(await page.locator('#intro').isVisible(), true);
    };
    for (const selector of ['p', '.step-toggle', '.step-features', '.step-open']) {
      await align(2);
      await drag(selector, 1); await arrived(3, selector + ' mouse drag forward');
      await drag(selector, -1); await arrived(2, selector + ' mouse drag reverse');
    }
    await align(2);
    await page.locator('.journey-steps').evaluate(el => { el.style.maxHeight = (el.clientHeight - 30) + 'px'; });
    await drag('.step-open', 1); await arrived(3, 'Overflowing list mouse drag');
    await page.locator('.journey-steps').evaluate(el => { el.style.removeProperty('max-height'); el.scrollTop = 0; });
    await align(0);
    await drag('.step-toggle', 1, 120); await arrived(1, 'Release outside the original card');
    await align(2);
    const r = await page.locator('.journey-step.is-active p').boundingBox();
    await page.mouse.move(r.x + 40, r.y + 10); await page.mouse.down(); await page.mouse.move(r.x + 40, r.y - 60, { steps: 10 });
    await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await page.mouse.up(); await page.waitForTimeout(1000);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - await point(2)) < 2, 'Blur must cancel an unfinished drag');
    await drag('p', 1); await arrived(3, 'Drag must recover after cancellation');
    await align(2);
    await drag('p', 1);
    await drag('p', -1);
    await arrived(3, 'A second drag during travel must not reverse the first destination');
    await page.locator('.step-toggle').nth(2).click(); await arrived(2, 'Short heading click');
    await page.locator('[data-preview-go=koicd]').click(); await page.locator('#koicd').waitFor();
    if (await page.locator('#companion-chat').isVisible()) await page.locator('[data-guide-confirm]').click();
    await page.goBack(); await page.locator('#intro').waitFor();
    assert.equal(await page.evaluate(() => window.touchInputs), 0, 'These checks must use a real mouse path, not emulated touch');
    assert.ok((await page.evaluate(() => window.pointerInputs)).every(type => type === 'mouse'));
    assert.deepEqual(errors, []);
    console.log(width + '×' + height, 'mouse-only mobile preview: card text/title/tags/button drag both ways, overflow, release outside card, cancel/recover, normal clicks and feature navigation');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await align(2);
    const standing = await page.locator('.mascot-atlas').getAttribute('viewBox');
    await drag('p', 1); await arrived(3, 'Reduced-motion mouse drag');
    assert.equal(await page.locator('.mascot-atlas').getAttribute('viewBox'), standing, 'Reduced-motion drag must not play a walking pose');
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-journey-transition')), false);
    await page.close();
  }
} finally { await browser.close(); }
