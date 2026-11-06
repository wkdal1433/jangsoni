import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright-core';
import { serveTestPreview } from './test-preview.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const preview = await serveTestPreview();
try {
  for (const [name, type] of [['Chrome', chromium], ['WebKit', webkit]]) {
    const browser = await type.launch(name === 'Chrome' ? { channel: 'chrome' } : {});
    try {
      for (const [width, height] of [[1366, 600], [390, 844], [320, 568]]) {
        const mobile = width <= 720;
        const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' });
        page.setDefaultTimeout(7000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.route(/^https?:/, route => preview.matches(route.request().url()) ? route.continue() : route.abort());
        await page.goto(preview.url);
        await page.locator('.mascot-atlas').waitFor({ state: 'attached' });
        assert.equal(await page.locator('#landing-main > section,#landing-tour > section').count(), 6);
        assert.ok(await page.locator('[data-icon]').count() > 40);
        assert.ok(await page.locator('[data-icon]').evaluateAll(elements => elements.every(el => el.querySelector('svg.app-icon[fill="none"][stroke="currentColor"]'))));
        await page.locator('#show-tour').click();
        await page.waitForFunction(() => Math.abs(document.querySelector('#landing-about').getBoundingClientRect().top) < 2);
        const bounds = await page.evaluate(() => {
          const about = document.querySelector('#landing-about'), guide = document.querySelector('#landing-guide');
          const welcome = document.querySelector('#landing-welcome');
          return { welcome: scrollY + welcome.getBoundingClientRect().top + Math.max(0, welcome.offsetHeight - innerHeight), top: scrollY + about.getBoundingClientRect().top, bottom: scrollY + about.getBoundingClientRect().top + Math.max(0, about.offsetHeight - innerHeight), guide: scrollY + guide.getBoundingClientRect().top };
        });
        let client;
        if (mobile && name === 'Chrome') client = await page.context().newCDPSession(page);
        const swipe = async direction => {
          if (client) {
            const touch = (type, y) => client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: 180, y }] });
            await touch('touchStart', 430);
            for (let i = 1; i <= 25; i++) { await touch('touchMove', 430 - direction * i * 3); await page.waitForTimeout(12); }
            await touch('touchEnd');
          } else {
            // WebKit's native mouse drag checks the same mobile snap targets.
            await page.mouse.move(180, 430); await page.mouse.down();
            await page.mouse.move(180, 430 - direction * 75, { steps: 25 }); await page.mouse.up();
          }
        };
        if (mobile) {
          await swipe(1);
          await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), bounds.bottom);
          assert.ok(await page.locator('#landing-about .about-card:last-child').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight + 2), 'First swipe must reveal the last introductory card');
          assert.ok(await page.locator('#landing-guide').evaluate(el => el.getBoundingClientRect().top > innerHeight - 4), 'First swipe must stay in the introductory section');
          await swipe(-1);
          await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), bounds.top);
          await swipe(-1);
          await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), bounds.welcome);
          assert.equal(await page.evaluate(() => getSelection().toString()), '', 'Dragging the mobile introductory cards must not start native text dragging');
          await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), bounds.top);
          await page.waitForTimeout(200);
          const origin = await page.evaluate(() => ({ y: scrollY, about: document.querySelector('#landing-about').getBoundingClientRect().top }));
          await swipe(1);
          await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), bounds.bottom).catch(async error => {
            throw new Error(JSON.stringify({ name, width, height, origin, expected: bounds.bottom, actual: await page.evaluate(() => ({ y: scrollY, moving: document.documentElement.hasAttribute('data-journey-transition'), about: document.querySelector('#landing-about').getBoundingClientRect().top })) }), { cause: error });
          });
          await swipe(1);
        } else {
          await page.mouse.move(10, 10); await page.mouse.wheel(0, 90);
        }
        await page.waitForFunction(top => Math.abs(scrollY - top) < 2 && !document.documentElement.hasAttribute('data-journey-transition'), bounds.guide);
        await page.locator('.hero-actions .landing-primary').click();
        await page.locator('#start').click();
        await page.locator('.companion-sprite').waitFor({ state: 'attached' });
        const dock = page.locator('#case-companion'), caption = page.locator('.companion-dock');
        if (mobile) {
          for (const target of [dock, caption]) {
            assert.equal(await target.evaluate(el => getComputedStyle(el).webkitUserSelect), 'none');
          }
          await caption.locator('span').dblclick();
          assert.equal(await page.evaluate(() => getSelection().toString()), '', 'Native selection must exclude the mobile mascot caption');
          await page.locator('#menu h1').dblclick();
          assert.ok(await page.evaluate(() => getSelection().toString().length > 0), 'Ordinary page text must remain selectable');
          await page.evaluate(() => {
            window.companionTouches = [];
            window.addEventListener('touchstart', event => {
              if (event.target.closest?.('#case-companion')) window.companionTouches.push(event.defaultPrevented);
            }, { passive: true });
          });
          await dock.tap();
          await page.locator('.companion-chat-invitation').waitFor();
          assert.equal(await page.evaluate(() => getSelection().toString()), '', 'Starting mascot interaction must clear the old selection');
          const touches = await page.evaluate(() => window.companionTouches);
          assert.ok(touches.length > 0 && touches.every(Boolean), 'Mascot touches must cancel native touch callouts');
          await page.locator('.companion-chat-invitation [data-chat-close]').tap();
          if (client) {
            const r = await dock.boundingBox(), x = r.x + r.width / 2, y = r.y + r.height / 2;
            await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
            await page.waitForTimeout(500);
            assert.notEqual(await dock.getAttribute('data-grabbing'), null);
            await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 140, y: y - 180 }] });
            assert.equal(await page.evaluate(() => getSelection().toString()), '');
            await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await page.waitForTimeout(850);
            assert.equal(await dock.getAttribute('data-grabbing'), null);
          }
          await page.locator('#menu [data-go=cardnews]').tap();
          await page.locator('[data-guide-confirm]').tap();
          assert.equal(await page.locator('.cn-check').first().locator('svg.app-icon').count(), 1);
          await page.locator('.cn-hook em').first().fill('입력한 문자 🔗 보존');
          assert.equal(await page.locator('.cn-hook em').first().textContent(), '입력한 문자 🔗 보존');
        }
        assert.deepEqual(errors, []);
        console.log(name, width + 'x' + height, mobile ? 'two-step intro snap, readable last card, reverse to intro top, caption selection excluded, ordinary text selectable, native touch tap/callout prevention, Lucide controls and preserved editable text' : 'one wheel moves directly from about to guide, six major sections and Lucide icons');
        await page.close();
      }
    } finally { await browser.close(); }
  }
} finally { await preview.close(); }
