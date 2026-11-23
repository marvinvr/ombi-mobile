import { App } from './support/app';
import { expect, networkLog, test } from './support/fixtures';

test.describe('production artifact: SPA fallback, manifest, service worker', () => {
  test('deep links are served the app shell (serve -s SPA fallback)', async ({ request }) => {
    for (const path of ['/', '/config', '/search', '/requests', '/movie/603', '/request/tv/1396']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-type'], path).toContain('text/html');
      const html = await res.text();
      expect(html, path).toContain('<app-root></app-root>');
      expect(html, path).toContain('<title>Ombi-Mobile</title>');
    }
  });

  test('deep link to a detail page boots the app on that page', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/request/movie/603');
    await expect(app.contentTitle).toHaveText('The Matrix');
    await expect(app.breadcrumbs).toContainText(['Requests', 'Movie']);
  });

  test('deep link with password session: start-up re-login navigates to search (existing behaviour)', async ({ page, seed }) => {
    await seed({ user: 'admin' });
    const app = new App(page);
    await page.goto('/movie/603');
    await expect(page).toHaveURL(/\/search$/);
    await app.expectHeader('Discover');
  });

  test('static assets and manifest are served', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.status()).toBe(200);
    const json = JSON.parse(await manifest.text());
    expect(json.name).toBeTruthy();
    expect(json.icons.length).toBeGreaterThan(0);
    for (const icon of json.icons) {
      expect((await request.get('/' + icon.src.replace(/^\//, ''))).status(), icon.src).toBe(200);
    }
    expect((await request.get('/assets/backdrop.png')).headers()['content-type']).toContain('image/png');
    // ionicons SVGs copied by the build (angular.json assets)
    expect((await request.get('/svg/search-outline.svg')).headers()['content-type']).toContain('svg');
    const ngsw = await request.get('/ngsw.json');
    expect(ngsw.status()).toBe(200);
    const ngswJson = JSON.parse(await ngsw.text());
    expect(ngswJson.index).toBe('/index.html');
    expect(ngswJson.assetGroups.map((g: { name: string }) => g.name)).toEqual(['Ombi', 'assets']);
    expect((await request.get('/ngsw-worker.js')).status()).toBe(200);
  });
});

test.describe('service worker', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Service worker interception checks run on Chromium');
  test.use({ serviceWorkers: 'allow' });

  test('registers, controls the page and serves the app offline', async ({ page, context, allowConsole }) => {
    // While offline the service worker answers non-cached (API / probe) requests with 504.
    allowConsole(networkLog(504));
    const app = new App(page);
    await page.goto('/config');
    await app.expectHeader('Config');

    // registerWhenStable:30000 → registered once the app is stable (at the latest after 30s).
    const scope = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return reg.scope;
    });
    expect(scope).toMatch(/\/$/);
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL)).toMatch(/\/ngsw-worker\.js$/);

    const state = await page.evaluate(async () => (await fetch('/ngsw/state')).text());
    expect(state).toContain('Driver state: NORMAL');

    // Wait for the prefetch asset group to be cached, then go offline and reload.
    await expect.poll(async () => page.evaluate(async () => {
      const keys = await caches.keys();
      return keys.some(k => k.includes('ngsw') && k.includes('assets:Ombi:cache'));
    }), { timeout: 30_000 }).toBe(true);
    await page.reload();
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.goto('/search');
    await expect(page).toHaveURL(/\/config$/);
    await app.expectHeader('Config');
    await context.setOffline(false);
  });
});
