import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serveTestPreview } from './test-preview.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const baseline = execFileSync('git', ['show', '9fad8a0:index.html'], { cwd: root, maxBuffer: 40 * 1024 * 1024 });
const preview = await serveTestPreview({ '/hyundai-baseline.html': baseline });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [width, height] of [[1440, 900], [1366, 744], [1024, 768]]) {
    for (const expanded of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height }, serviceWorkers: 'block' });
      await page.route(/^https?:/, route => preview.matches(route.request().url()) ? route.continue() : route.abort());
      await page.goto(preview.url);
      await page.locator('.mascot-atlas').waitFor({ state: 'attached' });
      await page.evaluate(expanded => { document.querySelector('#landing-tour').hidden = !expanded; scrollTo({ top: 0, behavior: 'instant' }); }, expanded);
      const destination = await page.locator(expanded ? '#landing-about' : '#analysis-workbench').evaluate(el => scrollY + el.getBoundingClientRect().top);
      assert.ok(Math.abs(await page.locator('#landing-welcome').evaluate(el => el.getBoundingClientRect().height) - height) < 2, 'The first section must fit the tested viewport before one-step navigation');
      const geometry = await page.locator('.mascot-stage').evaluate(el => {
        const r = el.getBoundingClientRect(), image = el.querySelector('img');
        return { width: r.width, height: r.height, objectFit: getComputedStyle(image).objectFit, frame: el.querySelector('.mascot-closed-frame').getAttribute('preserveAspectRatio') };
      });
      assert.ok(Math.abs(geometry.width - geometry.height) < .1, 'Both mascot packs must use the same square display area');
      assert.equal(geometry.objectFit, 'contain');
      assert.equal(geometry.frame, 'xMidYMid meet');
      await page.mouse.move(10, 10); await page.mouse.wheel(0, 90);
      await page.waitForFunction(top => Math.abs(scrollY - top) < 2, destination, { timeout: 2000 });
      await page.mouse.wheel(0, -90);
      await page.waitForFunction(() => Math.abs(scrollY) < 2, null, { timeout: 2000 });
      await page.close();
    }
    console.log(width + 'x' + height + ': first-screen single-wheel snap both directions with tour open/closed; image and eyelid aspect alignment');
  }
  const isHyundai = await (async () => {
    const page = await browser.newPage(); await page.goto(preview.url);
    const value = await page.locator('#hyundai-styles').count(); await page.close(); return value > 0;
  })();
  if (isHyundai) {
    for (const [width, height] of [[1440, 900], [1366, 744], [1024, 768], [390, 844], [320, 568]]) {
      const geometry = async url => {
        const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce', serviceWorkers: 'block' });
        await page.route(/^https?:/, route => preview.matches(route.request().url()) ? route.continue() : route.abort());
        await page.goto(url);
        await page.locator('.mascot-atlas').waitFor({ state: 'attached' });
        await page.waitForFunction(() => document.querySelector('.mascots-img').complete && document.querySelector('.mascots-img').naturalWidth > 0);
        await page.evaluate(() => { document.querySelector('#landing-tour').hidden = false; });
        const result = await page.evaluate(() => ['#landing-welcome', '.hero-copy', '.hero-art', '.mascot-stage', '#landing-about', '#landing-guide', '#landing-journey', '.demo-section', '#analysis-workbench'].map(selector => {
          const r = document.querySelector(selector).getBoundingClientRect(); return { selector, x: r.x, y: r.y, width: r.width, height: r.height };
        }));
        await page.close(); return result;
      };
      const before = await geometry(preview.origin + '/hyundai-baseline.html'), after = await geometry(preview.url);
      for (let i = 0; i < before.length; i++) for (const property of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(before[i][property] - after[i][property]) < .1, before[i].selector + ' Hyundai ' + property + ' must remain unchanged at ' + width + 'x' + height);
    }
    console.log('Hyundai geometry matches the approved 9fad8a0 screen in all five sizes');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    await page.route(/^https?:/, route => preview.matches(route.request().url()) ? route.continue() : route.abort());
    await page.addInitScript(() => {
      Math.random = () => .999;
      window.heroBlinks = [];
      document.addEventListener('DOMContentLoaded', () => { window.heroReady = performance.now(); });
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const animation = animate.apply(this, args);
        if (this.classList.contains('mascot-closed-frame')) {
          const event = { at: performance.now(), duration: animation.effect.getTiming().duration };
          window.heroBlinks.push(event);
          setTimeout(() => { event.opacity = getComputedStyle(this).opacity; }, 50);
        }
        return animation;
      };
    });
    await page.goto(preview.url);
    await page.waitForFunction(() => window.heroBlinks[0]?.opacity !== undefined, null, { timeout: 2200 });
    const first = await page.evaluate(() => ({ ...heroBlinks[0], ready: heroReady }));
    assert.ok(first.at - first.ready >= 950 && first.at - first.ready <= 1600, 'The first visible hero blink must arrive around 1.1 seconds');
    assert.equal(first.opacity, '1', 'The generated closed-eye frame must actually become visible');
    assert.equal(first.duration, 145, 'Keep the existing gentle blink duration');
    await page.waitForTimeout(2300);
    assert.equal(await page.evaluate(() => heroBlinks.length), 1, 'Do not blink again too soon');
    await page.waitForFunction(() => heroBlinks.length >= 2, null, { timeout: 2600 });
    const interval = await page.evaluate(() => heroBlinks[1].at - heroBlinks[0].at);
    assert.ok(interval >= 2600 && interval <= 4400, 'Subsequent hero blinks must keep the configured natural interval');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const count = await page.evaluate(() => heroBlinks.length);
    await page.waitForTimeout(4400);
    assert.equal(await page.evaluate(() => heroBlinks.length), count, 'Reduced-motion preference must stop blink timers');
    await page.close();
    console.log('Hero blink: visible first blink around 1.1s, no early repeat, 2.6–4.2s repeat range and reduced-motion pause');
  }
} finally { await browser.close(); await preview.close(); }
