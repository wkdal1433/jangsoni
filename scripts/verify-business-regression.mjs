import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { transform } from 'esbuild';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root, stdio: 'inherit' });
const baseline = execFileSync('git', ['show', 'main:index.html'], { cwd: root, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
const blocks = [...baseline.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const original = blocks.find(block => block[2].includes('const SCREENS'))[2];
const current = await readFile(join(root, 'src/analysis.js'), 'utf8');
const start = original.slice(original.indexOf('    // 시작하기'), original.indexOf('    // 메뉴 버튼'));
const comparable = current
  .replace(/    let analyzedCaseKey = "";[\s\S]*?(?=    \/\/ 메뉴 버튼)/, () => start)
  .replace('Jangsoni.navigate(btn.dataset.go, btn.dataset.scrollTarget)', 'showScreen(btn.dataset.go)')
  .replace('Jangsoni.navigate("cardnews")', 'showScreen("cardnews")')
  .replace('.contentWindow.location.replace(url + "&_t=" + Date.now());', '.src = url + "&_t=" + Date.now();');
const normalizeCode = async code => (await transform(code, { minifyWhitespace: true, legalComments: 'none' })).code;
assert.equal(await normalizeCode(comparable), await normalizeCode(original), 'Business code differs beyond the reviewed navigation/preview-entry changes');
for (const [index, name] of ['fss', 'koicd'].entries()) {
  assert.equal((await readFile(join(root, 'src/data/' + name + '.js'), 'utf8')).trim().replace(/\r\n/g, '\n'), blocks[index][2].trim().replace(/\r\n/g, '\n'), name + ' packed data');
}
console.log('Source parity:', JSON.stringify({ originalFunctions: [...original.matchAll(/function ([a-zA-Z0-9_]+)\(/g)].length, originalEventConnections: [...original.matchAll(/addEventListener\(/g)].length, bothDataPacksMatch: true, navigationAndPreviewChangesAccountedFor: true }));

const scratch = await mkdtemp(join(tmpdir(), 'jangsoni-regression-'));
const oldFile = join(scratch, 'main.html');
await writeFile(oldFile, baseline);
const renderer = await readFile(require.resolve('html2canvas/dist/html2canvas.min.js'));
const browser = await chromium.launch({ channel: 'chrome' });
const screens = ['timeline', 'yakgwan', 'koicd', 'law', 'pubmed', 'fss', 'cardnews'];
const clean = value => value.replace(/\s+/g, ' ').trim();
const text = async (page, selector) => clean(await page.locator(selector).textContent());
const schema = (page, selector) => page.locator(selector).evaluate(root => [...root.querySelectorAll('input,select,textarea,[contenteditable="true"]')].map(el => ({
  tag: el.tagName, id: el.id, name: el.getAttribute('name'), type: el.getAttribute('type'), value: el.value ?? el.textContent,
  placeholder: el.getAttribute('placeholder'), min: el.getAttribute('min'), max: el.getAttribute('max'), step: el.getAttribute('step'),
  list: el.getAttribute('list'), required: !!el.required, disabled: !!el.disabled, checked: el.type === 'checkbox' ? el.checked : null,
  options: el.options ? [...el.options].map(o => ({ value: o.value, text: o.textContent, selected: o.selected })) : null,
})));

async function acknowledge(page) {
  if (await page.locator('#companion-chat[data-guiding]').isVisible()) await page.locator('[data-guide-confirm]').click();
}

async function inspect(file, modern) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: true });
  page.setDefaultTimeout(8000);
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:/, route => {
    const request = route.request(), url = request.url();
    requests.push({ url, body: request.postData() });
    if (url.includes('/html2canvas/1.4.1/')) return route.fulfill({ body: renderer, contentType: 'application/javascript' });
    if (url.includes('eutils.ncbi.nlm.nih.gov')) return route.fulfill({
      headers: { 'access-control-allow-origin': '*' }, json: url.includes('esearch')
        ? { esearchresult: { count: '1', idlist: ['123'] } }
        : { result: { 123: { title: 'Regression paper', pubdate: '2024 Jan', source: 'Test journal', authors: [{ name: 'Test author' }] } } },
    });
    if (url.includes('hi.co.kr/ajax.xhi')) return route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: { data: { slYProdList: [], slNProdList: [] } } });
    if (request.isNavigationRequest()) return route.fulfill({ body: '<!doctype html><title>External navigation fixture</title>', contentType: 'text/html' });
    return route.abort();
  });
  await page.goto(pathToFileURL(file).href);
  if (modern) await page.locator('.hero-actions .landing-primary').click();
  const result = { fields: { case: await schema(page, '#case-form') }, outputs: {}, timeline: [], law: [], yak: [], kcd: [], fss: [], templates: [] };
  for (const [id, value] of Object.entries({ 'in-date': '2020-01-02', 'in-job': '사무직', 'in-code': 'I21', 'in-cover': '일반상해사망', 'in-issue': '고지의무' })) await page.locator('#' + id).fill(value);
  await page.locator('#start').click();
  await page.locator('#ar-pubmed').getByText('Regression paper', { exact: false }).waitFor();
  result.outputs.summary = await text(page, '#case-summary');
  const enter = async screen => { await page.locator('#menu [data-go=' + screen + ']').click(); await acknowledge(page); };
  const back = async screen => page.locator('#' + screen + ' [data-go=menu]').click();

  for (const screen of screens) {
    await enter(screen);
    if (screen === 'koicd') await page.waitForFunction(() => document.querySelector('#koicd-result').textContent.includes('I21'));
    if (screen === 'fss') await page.locator('#fss-result .fss-overview').waitFor();
    result.fields[screen] = await schema(page, '#' + screen);
    if (screen === 'timeline') {
      for (const scenario of ['empty', 'sample', 'related-job', 'notified-job', 'waiting', 'before-contract']) {
        if (scenario !== 'empty') await page.locator('#tl-sample').click();
        if (scenario === 'related-job') await page.locator('#tl-jobrelated').check();
        if (scenario === 'notified-job') await page.locator('#tl-notified').check();
        if (scenario === 'waiting') { await page.locator('#tl-waitdays').fill('90'); await page.locator('#tl-event').fill('2024-04-01'); }
        if (scenario === 'before-contract') await page.locator('#tl-event').fill('2024-01-01');
        await page.locator('#tl-run').click();
        result.timeline.push({ scenario, output: await text(page, '#tl-result'), enabled: await page.locator('#tl-apply-cn').isEnabled() });
      }
      const before = await page.locator('.tl-row').count();
      await page.locator('#tl-addrow').click();
      await page.locator('.tl-row').last().locator('.tl-r-text').fill('검증용 진료 이력');
      await page.locator('.tl-row').last().locator('.tl-r-told').check();
      assert.equal(await page.locator('.tl-row').count(), before + 1);
      await page.locator('.tl-row').last().locator('.tl-del').click();
      assert.equal(await page.locator('.tl-row').count(), before);
      await page.locator('#tl-apply-cn').click();
      await acknowledge(page);
      result.outputs.timelineCard = await text(page, '#cn-list');
      await back('cardnews');
      console.log(modern ? 'Current' : 'Main', 'timeline: six scenarios, history editing, card-news transfer');
      continue;
    }
    if (screen === 'yakgwan') for (const label of await page.locator('#yak-groups button').allTextContents()) {
      await page.locator('#yak-groups').getByRole('button', { name: label, exact: true }).click();
      result.yak.push({ label, output: await text(page, '#yak-panel') });
    }
    if (screen === 'law') {
      for (const category of await page.locator('.tab[data-category]').evaluateAll(els => els.map(el => el.dataset.category))) {
        await page.locator('.tab[data-category="' + category + '"]').click();
        const types = category === '상해사망' ? await page.locator('#type-filters button').evaluateAll(els => els.map(el => el.dataset.type)) : [''];
        for (const type of types) {
          if (type) await page.locator('#type-filters [data-type="' + type + '"]').click();
          result.law.push({ category, type, output: await text(page, '#cards'), address: await page.locator('#live-law-newtab').getAttribute('href') });
        }
      }
      await page.locator('#search').fill('없는검증문구');
      result.outputs.lawEmpty = await text(page, '#cards');
      await page.locator('#search').fill('');
      await page.locator('#live-law-query').fill('보험금 검증');
      await page.locator('#live-law-form button').click();
      result.outputs.customLawAddress = await page.locator('#live-law-newtab').getAttribute('href');
    }
    if (screen === 'koicd') {
      for (const query of ['I21', 'I63', '뇌경색', '없는검증문구']) {
        await page.locator('#koicd-query').fill(query);
        await page.locator('#koicd-form button').click();
        result.kcd.push({ query, output: await text(page, '#koicd-result') });
      }
      await page.locator('#koicd-query').fill('I21'); await page.locator('#koicd-form button').click();
      for (const tab of ['code', 'guide', 'case']) {
        await page.locator('#koicd-result [data-tab=' + tab + ']').click();
        const panel = page.locator('#koicd-result [data-panel=' + tab + ']');
        assert.equal(await panel.isVisible(), true);
        if (await panel.locator('[data-expand="1"]').count()) {
          await panel.locator('[data-expand="1"]').click();
          assert.equal(await panel.locator('details[open]').count(), await panel.locator('details').count());
          await panel.locator('[data-expand="0"]').click();
          assert.equal(await panel.locator('details[open]').count(), 0);
        }
      }
      await page.locator('#koicd-result [data-tab=code]').click();
      const link = page.locator('#koicd-result [data-panel=code] [data-kcd]').filter({ visible: true }).nth(1);
      const code = await link.getAttribute('data-kcd'); await link.click();
      await page.waitForFunction(code => document.querySelector('#koicd-result .kcd-head').textContent.includes(code), code);
      result.outputs.kcdLinkedCode = await text(page, '#koicd-result .kcd-head');
    }
    if (screen === 'fss') for (const query of ['', '암', '고지의무', '없는검증문구']) {
      await page.locator('#fss-query').fill(query); await page.locator('#fss-form button').click();
      for (const tab of await page.locator('[data-fss-tab]').evaluateAll(els => els.map(el => el.dataset.fssTab))) {
        await page.locator('[data-fss-tab="' + tab + '"]').click();
        result.fss.push({ query, tab, output: await text(page, '#fss-result') });
        if (await page.locator('[data-fss-more]').count()) {
          const count = await page.locator('.fss-item').count(); await page.locator('[data-fss-more]').click();
          assert.ok(await page.locator('.fss-item').count() > count);
        }
      }
    }
    if (screen === 'pubmed') {
      await page.locator('#pubmed-query').fill('stroke prognosis');
      const popup = page.waitForEvent('popup'); await page.locator('#pubmed-form button').click();
      const opened = await popup; await opened.waitForLoadState(); result.outputs.pubmed = opened.url(); await opened.close();
    }
    if (screen === 'cardnews') {
      for (const label of await page.locator('#cn-tabs button').allTextContents()) {
        await page.locator('#cn-tabs').getByRole('button', { name: label, exact: true }).click();
        for (const sub of await page.locator('#cn-subs button').allTextContents()) {
          await page.locator('#cn-subs').getByRole('button', { name: sub, exact: true }).click();
          const cards = await page.locator('.cn-card').count();
          assert.ok(cards > 0);
          result.templates.push({ label, sub, cards, fields: await schema(page, '#cn-list'), output: await text(page, '#cn-list') });
        }
      }
      const exportTemplate = result.templates.find(template => template.cards === 6);
      assert.ok(exportTemplate, 'Original six-card template must remain available');
      await page.locator('#cn-tabs').getByRole('button', { name: exportTemplate.label, exact: true }).click();
      await page.locator('#cn-subs').getByRole('button', { name: exportTemplate.sub, exact: true }).click();
      const field = page.locator('.cn-card [contenteditable=true]').first(); await field.fill('검증용 편집 문구');
      await page.locator('.cn-meta-value[data-meta=product]').first().fill('검증용 상품');
      assert.deepEqual(await page.locator('.cn-meta-value[data-meta=product]').allTextContents(), Array(6).fill('검증용 상품'));
      const downloads = []; page.on('download', file => downloads.push(file));
      await page.locator('#cn-save-all').click();
      await page.waitForFunction(() => document.querySelector('#cn-status').textContent.includes('6장 저장했어요'), {}, { timeout: 45000 });
      assert.equal(downloads.length, 6);
      for (const file of downloads) {
        assert.equal(await file.failure(), null);
        const data = await readFile(await file.path());
        assert.equal(data.readUInt32BE(16), 1080); assert.equal(data.readUInt32BE(20), 1080);
      }
      console.log(modern ? 'Current' : 'Main', 'all card-news templates and six real 1080px PNG downloads');
    }
    await back(screen);
    console.log(modern ? 'Current' : 'Main', screen, 'controls and outputs');
  }
  await page.reload();
  assert.equal(await page.locator('#in-job').inputValue(), '사무직');
  assert.equal(await page.locator('#in-code').inputValue(), 'I21');
  assert.deepEqual(errors, []);
  await page.close();
  return result;
}

async function navigation() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:/, route => route.request().isNavigationRequest()
    ? route.fulfill({ body: '<!doctype html><title>Navigation fixture</title>', contentType: 'text/html' }) : route.abort());
  await page.goto(pathToFileURL(join(root, 'index.html')).href);
  await page.locator('.hero-actions .landing-primary').click();
  await page.locator('#in-job').fill('검증 직업'); await page.locator('#in-code').fill('I21');
  await page.locator('#start').click();
  await page.locator('#menu [data-go=law]').click(); await acknowledge(page);
  for (const category of ['장해', '암', '상해사망']) await page.locator('.tab[data-category="' + category + '"]').click();
  await page.goBack(); await page.locator('#menu').waitFor();
  await page.goForward(); await page.locator('#law').waitFor();
  await page.goBack(); await page.locator('#menu').waitFor();
  await page.locator('#menu [data-scroll-target=analysis-workbench]').click();
  assert.equal(await page.locator('#in-job').inputValue(), '검증 직업');
  assert.ok(Math.abs(await page.locator('#analysis-workbench').evaluate(el => el.getBoundingClientRect().top)) < 2);
  await page.goBack(); await page.locator('#menu').waitFor();
  for (const screen of screens) {
    await page.locator('#menu [data-go=intro]:not([data-scroll-target])').click();
    await page.locator('#show-tour').click();
    await page.locator('[data-preview-go=' + screen + ']').click(); await acknowledge(page);
    await page.locator('#' + screen).waitFor();
    assert.ok((await text(page, '#case-summary')).includes('검증 직업'));
    if (screen === 'timeline') assert.equal(await page.locator('#tl-job0').inputValue(), '검증 직업');
    if (screen === 'pubmed') for (const value of await page.locator('#' + screen + ' [data-example-value]').evaluateAll(els => els.map(el => el.dataset.exampleValue))) {
      const button = page.locator('#' + screen + ' [data-example-value="' + value + '"]');
      const id = await button.getAttribute('data-example-input'); await button.click();
      assert.equal(await page.locator('#' + id).inputValue(), value);
      assert.equal(await page.evaluate(() => document.activeElement.id), id);
    }
    await page.locator('#' + screen + ' [data-go=menu]').click();
  }
  assert.deepEqual(errors, []);
  await page.close();
  const empty = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: true });
  empty.setDefaultTimeout(8000);
  empty.on('pageerror', error => errors.push(error.message));
  await empty.route(/^https?:/, route => route.request().url().includes('/html2canvas/1.4.1/')
    ? route.fulfill({ body: renderer, contentType: 'application/javascript' }) : route.abort());
  const openEmpty = async screen => {
    await empty.locator('.hero-actions .landing-primary').click(); await empty.locator('#start').click();
    await empty.locator('#menu [data-go=' + screen + ']').click(); await acknowledge(empty);
  };
  await empty.goto(pathToFileURL(join(root, 'index.html')).href); await openEmpty('koicd');
  for (const value of await empty.locator('#koicd [data-example-value]').evaluateAll(els => els.map(el => el.dataset.exampleValue))) {
    await empty.locator('#koicd [data-example-value="' + value + '"]').click();
    assert.equal(await empty.locator('#koicd-query').inputValue(), value);
  }
  await empty.locator('#koicd-query').press('Enter');
  await empty.waitForFunction(() => document.querySelector('#koicd-result').textContent.length > 0);
  await empty.locator('#koicd [data-go=menu]').click();
  await empty.locator('#menu [data-go=cardnews]').click(); await acknowledge(empty);
  const edit = empty.locator('.cn-card .cn-hook em').first();
  const originalText = await edit.textContent();
  await edit.fill('검증용 저장 문구');
  await empty.locator('.cn-meta-value[data-meta=product]').first().fill('저장 검증 상품');
  await empty.waitForTimeout(550); await empty.reload(); await openEmpty('cardnews');
  assert.equal(await edit.textContent(), '검증용 저장 문구');
  assert.deepEqual(await empty.locator('.cn-meta-value[data-meta=product]').allTextContents(), Array(6).fill('저장 검증 상품'));
  const [download] = await Promise.all([
    empty.waitForEvent('download', { timeout: 45000 }),
    empty.locator('.cn-wrap').first().getByRole('button').click(),
  ]).catch(async error => { throw new Error('Single-card export: ' + await text(empty, '#cn-status'), { cause: error }); });
  const png = await readFile(await download.path());
  assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1080);
  await empty.waitForFunction(() => !document.querySelector('#cn-save-all').disabled);
  await empty.locator('#cn-reset').click(); assert.equal(await edit.textContent(), '검증용 저장 문구');
  await empty.locator('#cn-reset').click(); assert.equal(await edit.textContent(), originalText);
  assert.deepEqual(errors, []); await empty.close();
  console.log('Navigation: back/forward through live-law updates, edit-input target, all seven direct tour entries, preserved case context and search examples');
  console.log('Editor: saved text and metadata survive reload; single-card PNG and confirmed reset');
}

try {
  const before = await inspect(oldFile, false);
  const after = await inspect(join(root, 'index.html'), true);
  assert.deepEqual(after, before, 'An input, template, navigation address or business result differs from main');
  console.log('MATCH:', JSON.stringify({ fields: Object.fromEntries(Object.entries(after.fields).map(([name, fields]) => [name, fields.length])), timelineScenarios: after.timeline.length, lawStates: after.law.length, yakGroups: after.yak.length, kcdQueries: after.kcd.length, fssStates: after.fss.length, cardTemplates: after.templates.length }));
  await navigation();
} finally {
  await browser.close();
  await unlink(oldFile);
  await rmdir(scratch);
}
