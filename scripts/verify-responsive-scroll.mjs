import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright-core';
import { serveTestPreview } from './test-preview.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const preview = await serveTestPreview();
const top = (page, selector) => page.locator(selector).evaluate(el => scrollY + el.getBoundingClientRect().top);
async function arrive(page, expected, label) {
  await page.waitForFunction(y => Math.abs(scrollY - y) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), expected, { timeout: 3500 }).catch(async error => {
    throw new Error(label + ': ' + JSON.stringify({ expected, actual: await page.evaluate(() => ({ y: scrollY, width: innerWidth, height: innerHeight })) }), { cause: error });
  });
}
async function open(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, serviceWorkers: 'block' });
  page.setDefaultTimeout(6000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:/, route => preview.matches(route.request().url()) ? route.continue() : route.abort());
  await page.goto(preview.url);
  await page.locator('.mascot-atlas').waitFor({ state: 'attached' });
  await page.locator('#show-tour').tap();
  await arrive(page, await top(page, '#landing-about'), 'Open tour');
  return { page, errors };
}
async function input(page, name) {
  const client = name === 'Chrome' ? await page.context().newCDPSession(page) : null;
  return async direction => {
    const { width, height } = page.viewportSize(), x = width / 2, y = Math.min(height * .6, 430);
    if (client) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (const delta of [3, 12, 24, 48, 80]) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - direction * delta }] });
        await page.waitForTimeout(16);
      }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(x, y - direction * 80, { steps: 20 }); await page.mouse.up();
    }
  };
}
try {
  for (const [name, type] of [['Chrome', chromium], ['WebKit', webkit]]) {
    const browser = await type.launch(name === 'Chrome' ? { channel: 'chrome' } : {});
    try {
      for (const width of [280, 320, 360, 375, 390, 412, 430, 480, 600, 720]) {
        const { page, errors } = await open(browser, width, 760);
        const swipe = await input(page, name);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + ' ' + width + ': horizontal overflow');
        for (const button of await page.locator('.hero-actions button').all()) {
          assert.ok(await button.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; }), name + ' ' + width + ': primary entry buttons must fit');
        }
        for (const [selector, next] of [['#landing-about', '#landing-guide'], ['#landing-guide', '#landing-journey']]) {
          const contentHeight = await page.locator(selector).evaluate(el => el.offsetHeight);
          const small = Math.max(360, contentHeight - 100), large = contentHeight + 80;
          await page.setViewportSize({ width, height: small });
          await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await top(page, selector));
          await page.waitForTimeout(200);
          const offset = await page.locator(selector).evaluate(el => Math.max(0, el.offsetHeight - innerHeight));
          assert.ok(offset > 2, selector + ' must initially overflow');
          await swipe(1); await page.waitForTimeout(70);
          await page.setViewportSize({ width, height: large });
          assert.ok(await page.locator(selector).evaluate(el => el.offsetHeight < innerHeight), selector + ' must now fit');
          await arrive(page, await top(page, selector) + offset, name + ' ' + width + ' grow through ' + selector + ' height');
          await swipe(1); await arrive(page, await top(page, next), name + ' ' + width + ' leave ' + selector);
          await swipe(-1); await page.waitForTimeout(70);
          await page.setViewportSize({ width, height: small });
          await arrive(page, await top(page, selector), name + ' ' + width + ' reverse while height shrinks');
          assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType), 'none');
        }
        assert.deepEqual(errors, []);
        console.log(name, width + 'px:', 'both reading sections cross their own content-height boundary, forward/next/reverse, no root snap or clipped entry buttons');
        await page.close();
      }
    } finally { await browser.close(); }
  }

  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const [width, height] of [[640, 360], [720, 360], [721, 360], [844, 390], [932, 430]]) {
      const { page, errors } = await open(browser, width, height);
      const swipe = await input(page, 'Chrome');
      for (const selector of ['#landing-about', '#landing-guide', '#landing-journey']) {
        await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), await top(page, selector));
        await page.waitForTimeout(250);
        const before = await page.evaluate(() => scrollY);
        await swipe(1); await page.waitForTimeout(1100);
        assert.ok(await page.evaluate(() => scrollY) > before + 10, width + 'x' + height + ' must not snap back at ' + selector);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      console.log(width + 'x' + height + ': landscape and 720/721px breakpoint, native touch advances in all three sections');
      await page.close();
    }
  } finally { await browser.close(); }
} finally { await preview.close(); }
