import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const browser = await chromium.launch({ channel: 'chrome' });
const key = 'jangsoni:companion-guides:v1';
const screens = ['timeline', 'yakgwan', 'koicd', 'law', 'pubmed', 'fss', 'cardnews'];
const reply = '현재 해당 기능은 개발중입니다!!';
const file = name => ({ name, mimeType: 'text/plain', buffer: Buffer.from('test attachment') });

try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 750 } : { width: 1440, height: 900 }, hasTouch: mobile, isMobile: mobile, serviceWorkers: 'block' });
    const errors = [], requests = [];
    context.on('page', page => { page.setDefaultTimeout(7000); page.on('pageerror', error => errors.push(error.message)); });
    await context.route(/^https?:/, route => {
      requests.push(route.request().url());
      return route.request().isNavigationRequest()
        ? route.fulfill({ body: '<!doctype html><title>External navigation fixture</title>', contentType: 'text/html' }) : route.abort();
    });
    const page = await context.newPage();
    const url = pathToFileURL(join(root, 'index.html')).href;
    await page.goto(url);
    const dock = page.locator('#case-companion'), panel = page.locator('#companion-chat');
    const enter = async () => { await page.locator('.hero-actions .landing-primary').click(); await page.locator('#start').click(); };
    await enter();
    for (const [index, screen] of screens.entries()) {
      await page.locator('#menu [data-go=' + screen + ']').click();
      assert.equal(await panel.evaluate(el => el.matches(':modal')), true, screen + ' first guide');
      assert.equal(await panel.locator('.companion-chat-invitation').isVisible(), false);
      assert.equal(await panel.locator('[data-chat-guide]').isVisible(), false);
      if (index % 2) await page.mouse.click(5, 5);
      else await panel.locator('[data-guide-confirm]').click();
      assert.equal(await panel.isVisible(), false, 'Acknowledgement must close the whole bubble');
      assert.equal(await dock.getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('companion-guiding')), false);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), screen + ' horizontal overflow');
      if (mobile) {
        await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        const clearance = await page.locator('#' + screen + ' > .wrap').evaluate(el => {
          const padding = parseFloat(getComputedStyle(el).paddingBottom);
          return { padding, contentBottom: el.getBoundingClientRect().bottom - padding, dockTop: document.querySelector('.companion-dock').getBoundingClientRect().top };
        });
        assert.ok(clearance.padding >= 124 && clearance.contentBottom <= clearance.dockTop, screen + ' content must clear the mascot dock');
      }
      await page.locator('#' + screen + ' [data-go=menu]').click();
      await page.locator('#menu [data-go=' + screen + ']').click();
      assert.equal(await panel.isVisible(), false, 'Acknowledged guide must not repeat');
      await page.locator('#' + screen + ' [data-go=menu]').click();
    }
    assert.deepEqual(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key), screens);
    await page.reload(); await enter();
    await page.locator('#menu [data-go=timeline]').click();
    assert.equal(await panel.isVisible(), false, 'Reload must retain this tab acknowledgement');
    const client = await context.newCDPSession(page);
    await Promise.all([page.waitForEvent('load'), client.send('Page.reload', { ignoreCache: true })]);
    await enter(); await page.locator('#menu [data-go=timeline]').click();
    assert.equal(await panel.isVisible(), false, 'Hard reload must retain acknowledgement');

    const independent = await context.newPage(); await independent.goto(url);
    await independent.locator('.hero-actions .landing-primary').click(); await independent.locator('#start').click();
    await independent.locator('#menu [data-go=timeline]').click();
    assert.equal(await independent.locator('#companion-chat').evaluate(el => el.matches(':modal')), true, 'Independent tab must show its first guide');
    await independent.close();

    if (!mobile) {
      await dock.hover(); await page.waitForTimeout(400);
      assert.equal(await dock.locator('.companion-hints').evaluate(el => getComputedStyle(el).opacity), '1');
      assert.equal(await dock.locator('.companion-hints svg').count(), 2);
      await page.mouse.move(10, 10); await page.waitForTimeout(250);
      assert.equal(await dock.locator('.companion-hints').evaluate(el => getComputedStyle(el).opacity), '0');
    }
    await dock.click();
    assert.equal(await panel.locator('.companion-chat-invitation').isVisible(), true);
    assert.ok(await panel.evaluate(el => el.getAnimations().some(a => a.effect.getTiming().duration === 260)), 'Bubble opening must animate');
    await panel.locator('.companion-chat-invitation [data-chat-close]').click();
    assert.equal(await panel.isVisible(), false);
    await dock.click(); await panel.locator('[data-chat-guide]').click();
    assert.equal(await panel.evaluate(el => el.matches(':modal')), true);
    await panel.locator('[data-guide-confirm]').click();
    assert.equal(await panel.isVisible(), false);
    await dock.click(); await panel.locator('[data-chat-yes]').click();
    const input = panel.locator('textarea'), log = panel.locator('[role=log]');
    const initial = await log.locator('[data-sender=user]').count();
    await panel.locator('button[type=submit]').click();
    assert.equal(await log.locator('[data-sender=user]').count(), initial);
    await input.fill('보험금\n<em>문의</em>');
    await input.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })));
    assert.equal(await log.locator('[data-sender=user]').count(), initial, 'IME composition must not submit');
    const chooser = page.waitForEvent('filechooser'); await panel.locator('[data-chat-attach]').click();
    const picker = await chooser; assert.equal(picker.isMultiple(), true);
    await picker.setFiles([file('안내.txt'), file('notes.txt')]);
    assert.equal(await panel.locator('.companion-chat-pending span').textContent(), '안내.txt, notes.txt');
    const outbound = requests.length;
    await input.press('Enter');
    const sent = log.locator('[data-sender=user]').last();
    assert.equal(await sent.locator('p').textContent(), '보험금\n<em>문의</em>');
    assert.equal(await sent.locator('em').count(), 0);
    assert.deepEqual(await sent.locator('li').allTextContents(), ['첨부 · 안내.txt', '첨부 · notes.txt']);
    assert.equal(await log.locator('[data-sender=assistant]').last().locator('p').textContent(), reply);
    assert.equal(await input.inputValue(), '');
    assert.equal(await panel.locator('input[type=file]').inputValue(), '');
    assert.equal(requests.length, outbound, 'Chat preview must not upload messages or files');
    await input.fill('입력 중인 초안');
    await panel.locator('.companion-chat-close').click();
    await dock.click(); await panel.locator('[data-chat-yes]').click();
    assert.equal(await input.inputValue(), '입력 중인 초안');
    await panel.locator('input[type=file]').setInputFiles([file('remove.txt')]);
    await panel.locator('[data-chat-remove]').click();
    assert.equal(await panel.locator('.companion-chat-pending').isVisible(), false);
    const bounds = await panel.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= (mobile ? 390 : 1440));
    await panel.locator('.companion-chat-close').click();
    await page.mouse.move(10, 10);
    await page.waitForFunction(() => document.querySelector('.companion-closed-frame').getAnimations().length > 0, {}, { timeout: 7000 });
    assert.deepEqual(errors, []);
    console.log(mobile ? 'Mobile' : 'Desktop', 'seven first guides, full dismissal, tab/reload scope, hover hints, soft chat, IME, attachments, draft, local reply and natural blink');
    await context.close();
  }
} finally { await browser.close(); }
