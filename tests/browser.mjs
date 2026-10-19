import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require = createRequire(import.meta.url);
const modulePath = process.env.PLAYWRIGHT_MODULE;
const {chromium} = modulePath ? await import(pathToFileURL(modulePath).href) : require('playwright');
const browser = await chromium.launch({headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome'});
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const target = 'https://www.hkust-gz.edu.cn/';
const results = [];
const errors = [];
const metrics = {};
const shots = new URL('../screenshots/', import.meta.url);
await mkdir(shots, {recursive:true});

async function check(name, run) {
  await run(); results.push(name); console.log(`PASS ${name}`);
}
async function pageFor(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  return page;
}
async function interceptExit(page) {
  const exits = [];
  let ready = null;
  await page.exposeBinding('__captureReady', (_, value) => { ready = value; });
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const bar = document.querySelector('#progress');
      if (!bar) return;
      new MutationObserver(() => {
        if (bar.getAttribute('aria-valuenow') === '100') window.__captureReady({time:performance.now(), timeOrigin:performance.timeOrigin, progress:'100', finalFrame:document.querySelector('#stage').dataset.frame, loaded:document.querySelector('#stage').dataset.ready});
      }).observe(bar, {attributes:true, attributeFilter:['aria-valuenow']});
    });
  });
  await page.route(`${target}**`, async route => {
    exits.push({...ready, requestElapsed:Date.now() - ready.timeOrigin});
    await route.fulfill({status:200, contentType:'text/html', body:'<!doctype html><title>Navigation target intercepted by local test</title>'});
  });
  return exits;
}

try {
  await check('automatic exit waits for 4000ms, 100% progress and final image', async () => {
    const page = await pageFor(); const exits = await interceptExit(page);
    await page.goto(base);
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#enter').isDisabled(), true);
    await page.locator('#enter').dispatchEvent('click');
    await page.waitForTimeout(2850);
    assert.equal(exits.length, 0);
    await page.waitForURL(target, {timeout:10000});
    assert.equal(exits.length, 1);
    assert.ok(exits[0].time >= 4000, JSON.stringify(exits[0]));
    assert.equal(exits[0].progress, '100'); assert.equal(exits[0].finalFrame, '4'); assert.equal(exits[0].loaded, 'true');
    metrics.autoRedirectMs = Math.round(exits[0].requestElapsed);
    console.log(`Automatic navigation request observed at ${metrics.autoRedirectMs}ms`);
    await page.context().close();
  });
  await check('pause cancels automatic exit; manual button works only after completion', async () => {
    const page = await pageFor(); const exits = await interceptExit(page);
    await page.goto(base); await page.locator('#pause').click();
    await page.waitForFunction(() => document.querySelector('#progress').getAttribute('aria-valuenow') === '100');
    await page.waitForTimeout(250);
    assert.equal(exits.length, 0);
    await page.locator('#enter').click(); await page.waitForURL(target);
    assert.equal(exits.length, 1); await page.context().close();
  });
  await check('all five original images switch in order and visibly move', async () => {
    const page = await pageFor(); await page.goto(`${base}/?preview=1`);
    await page.waitForFunction(() => document.querySelector('#stage').dataset.ready === 'true');
    const seen = new Set(); const transforms = new Set();
    for (let index = 0; index < 85; index++) {
      const frame = await page.evaluate(() => ({index:document.querySelector('#stage').dataset.frame, transform:getComputedStyle(document.querySelectorAll('.mascot-frame')[Number(document.querySelector('#stage').dataset.frame)]).transform}));
      seen.add(frame.index); transforms.add(frame.transform); await page.waitForTimeout(50);
    }
    assert.deepEqual([...seen], ['0','1','2','3','4']); assert.ok(transforms.size > 10);
    await page.context().close();
  });
  await check('slow final image keeps progress at zero until all images decode', async () => {
    const page = await pageFor(); let release;
    const gate = new Promise(resolve => {release = resolve;});
    await page.route('**/frame-05.png', async route => {await gate; await route.continue();});
    await page.goto(`${base}/?preview=1`, {waitUntil:'domcontentloaded'});
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('#progress').getAttribute('aria-valuenow'), '0');
    assert.equal(await page.locator('#enter').isDisabled(), true);
    release(); await page.waitForFunction(() => document.querySelector('#stage').dataset.ready === 'true');
    await page.waitForFunction(() => Number(document.querySelector('#progress').getAttribute('aria-valuenow')) > 2);
    await page.context().close();
  });
  await check('invalid image stops automatic progress and offers a manual fallback', async () => {
    const page = await pageFor();
    await page.route('**/frame-05.png', route => route.fulfill({status:200,contentType:'image/png',body:'invalid image for error test'}));
    await page.goto(`${base}/?preview=1`);
    await page.waitForFunction(() => !document.querySelector('#error-fallback').hidden);
    assert.equal(await page.locator('#progress').getAttribute('aria-valuenow'), '0');
    assert.match(await page.locator('#connection-status').textContent(), /失败/);
    assert.equal(await page.locator('#error-fallback a').getAttribute('href'), target);
    await page.context().close();
  });
  await check('resume after completed preview triggers a single navigation', async () => {
    const page = await pageFor(); const exits = await interceptExit(page);
    await page.goto(`${base}/?preview=1`);
    await page.waitForFunction(() => !document.querySelector('#enter').disabled);
    assert.equal(exits.length, 0); await page.locator('#pause').click();
    await page.waitForURL(target); assert.equal(exits.length, 1);
    await page.context().close();
  });
  await check('hidden-tab handler excludes hidden duration and resumes safely', async () => {
    const page = await pageFor(); await page.goto(`${base}/?preview=1`);
    await page.waitForTimeout(500);
    const before = Number(await page.locator('#progress').getAttribute('aria-valuenow'));
    await page.evaluate(() => {Object.defineProperty(document, 'hidden', {configurable:true, get:() => true}); document.dispatchEvent(new Event('visibilitychange'));});
    await page.waitForTimeout(1200);
    assert.equal(Number(await page.locator('#progress').getAttribute('aria-valuenow')), before);
    await page.evaluate(() => {delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));});
    await page.waitForFunction(() => Number(document.querySelector('#progress').getAttribute('aria-valuenow')) > 20);
    assert.equal(await page.locator('#enter').isDisabled(), true); await page.context().close();
  });
  await check('responsive layouts at 320, 360, 390, 768, 1024 and 1440px', async () => {
    const page = await pageFor(); await page.goto(`${base}/?preview=1`);
    await page.waitForFunction(() => !document.querySelector('#enter').disabled);
    for (const width of [320,360,390,768,1024,1440]) {
      await page.setViewportSize({width,height:900});
      const geometry = await page.evaluate(() => {
        const button = document.querySelector('#enter').getBoundingClientRect();
        const frog = document.querySelector('#stage').getBoundingClientRect();
        return {scroll:document.documentElement.scrollWidth, width:innerWidth, button:button.toJSON(), frog:frog.toJSON()};
      });
      assert.ok(geometry.scroll <= width, `${width}: horizontal overflow`);
      assert.ok(geometry.button.x >= 0 && geometry.button.right <= width);
      assert.ok(geometry.frog.x >= 0 && geometry.frog.right <= width);
      if ([390,768,1440].includes(width)) await page.screenshot({path:new URL(`light-${width}.png`,shots).pathname,fullPage:true});
    }
    await page.emulateMedia({colorScheme:'dark'});
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(21, 21, 21)');
    await page.screenshot({path:new URL('dark-1440.png',shots).pathname,fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:new URL('dark-390.png',shots).pathname,fullPage:true});
    await page.context().close();
  });
  await check('touch-phone and landscape-tablet keep navigation controls usable', async () => {
    for (const viewport of [{width:390,height:844},{width:1024,height:768}]) {
      const page = await pageFor({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:2});
      await page.goto(`${base}/?preview=1`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('#pause').tap(); await page.locator('#pause').tap();
      assert.match(await page.locator('#departure-note').textContent(), /暂停/);
      await page.context().close();
    }
  });
  await check('reduced-motion preference removes image movement while preserving the time gate', async () => {
    const page = await pageFor({reducedMotion:'reduce'});
    await page.goto(`${base}/?preview=1`); await page.waitForTimeout(1000);
    assert.equal(await page.locator('.mascot-frame').first().evaluate(el => getComputedStyle(el).transform), 'none');
    assert.equal(await page.locator('#enter').isDisabled(), true);
    await page.context().close();
  });
  await check('no-JavaScript fallback provides a usable HTTPS destination link', async () => {
    const page = await pageFor({javaScriptEnabled:false}); await page.goto(base);
    assert.equal(await page.locator('noscript a').getAttribute('href'), target);
    assert.equal(await page.locator('noscript a').isVisible(), true); await page.context().close();
  });
  await check('keyboard can pause before automatic navigation', async () => {
    const page = await pageFor(); await page.goto(base); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'pause');
    await page.keyboard.press('Enter');
    assert.match(await page.locator('#departure-note').textContent(), /暂停/); await page.context().close();
  });
  assert.deepEqual(errors, [], 'JavaScript or CSP errors');
  results.push('No JavaScript or Content Security Policy errors');
  await writeFile(new URL('../test-results.json', import.meta.url), JSON.stringify({browser:await browser.version(),metrics,results,errors},null,2));
  console.log(`PASS ${results.length} browser checks; zero console errors`);
} finally { await browser.close(); }
