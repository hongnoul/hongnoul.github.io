// Run with a served portfolio and an installed Playwright module:
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/skymesh.browser.mjs
// BASE_URL defaults to http://localhost:8765. Set it to the public origin for release checks.
import assert from 'node:assert/strict';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:8765';
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/?mode=hackathons`);
      assert.equal(await page.locator('.card:visible').count(), 4);
      const card = page.locator('.card[data-href="/work/skymesh.html"]');
      assert.equal(await card.isVisible(), true);
      assert.equal(await card.locator('img').getAttribute('src'), '/work/skymesh-fly-phone.jpg');
      await card.focus();
      await page.keyboard.press('Enter');
      await page.waitForURL('**/work/skymesh.html');
      assert.equal(await page.locator('.hero').getAttribute('src'), '/work/skymesh-fly-phone.jpg');
      assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), 'https://hongnoul.github.io/work/skymesh-fly-phone.jpg');
      assert.equal(await page.getByRole('link', { name: 'Open SkyMesh' }).getAttribute('href'), 'https://skymesh-hongnoul.fly.dev/');
      await page.locator('footer').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.equal(await page.locator('video').getAttribute('autoplay'), null);
      await page.locator('video').evaluate(async v => { await v.play(); });
      await page.waitForFunction(() => document.querySelector('video').currentTime > 0);
      await page.locator('footer a').click();
      await page.waitForURL('**/?mode=hackathons');
      assert.equal(await page.locator('.card:visible').count(), 4);
      assert.deepEqual(errors, []);
      console.log(`PASS ${engine.name()} ${width}px: category, keyboard entry, images, layout, video, return, no script errors`);
      await page.close();
    }
  } finally { await browser.close(); }
}
