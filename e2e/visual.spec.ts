import { App } from './support/app';
import { authSettings, OMBI_HOST, OMBI_ORIGIN } from './support/data';
import { expect, networkLog, test } from './support/fixtures';

/**
 * Screenshot baselines of every screen at a mobile viewport (per project: Android/Chromium
 * in md mode, iPhone/WebKit in ios mode). Baselines were recorded on the Angular 15 app and
 * are the reference for the migration.
 */
const settle = async (app: App) => {
  await app.waitForToastsGone();
  await app.waitForImages();
  await app.page.evaluate(() => document.fonts.ready);
  // Let Ionic finish page transitions / ripple effects.
  await app.page.waitForTimeout(400);
  await app.waitForImages();
};

const snap = async (app: App, name: string) => {
  await settle(app);
  await expect(app.page).toHaveScreenshot(`${name}.png`);
};

test.describe('visual baselines', () => {
  test('config: signed out, empty', async ({ page }) => {
    const app = new App(page);
    await page.goto('/config');
    await app.expectHeader('Config');
    await snap(app, 'config-signed-out');
  });

  test('config: unreachable URL', async ({ page, allowConsole }) => {
    // Refused connections of the https/http probes.
    allowConsole(/Failed to load resource: net::ERR_CONNECTION_REFUSED|Failed to load resource: Could not connect/);
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill('down.test');
    await expect(app.unreachableHint).toBeVisible();
    await app.input('Ombi Server URL').blur();
    await snap(app, 'config-unreachable');
  });

  test('config: credentials form', async ({ page }) => {
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);
    await expect(app.credentials).toBeVisible();
    await app.input('Username').fill('admin');
    await app.input('Password').fill('correct-horse');
    await app.input('Password').blur();
    await snap(app, 'config-credentials');
  });

  test('config: credentials form with Plex', async ({ page, ombi }) => {
    ombi.enableOAuth = true;
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);
    await expect(app.button('Sign in with Plex')).toBeVisible();
    await app.input('Ombi Server URL').blur();
    await snap(app, 'config-plex');
  });

  test('config: predefined host', async ({ page, context, ombi }) => {
    // See auth.spec.ts: delay the real probe so the start-up `null` probe can't win the race.
    ombi.on('GET', /\/api\/v1\/Settings\/Authentication/, async () => {
      await new Promise(r => setTimeout(r, 750));
      return { json: authSettings(false) };
    });
    await context.route(/\/assets\/settings\/predefined-host\.txt$/, route =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: OMBI_ORIGIN }));
    const app = new App(page);
    await page.goto('/config');
    await expect(app.credentials).toBeVisible();
    await snap(app, 'config-predefined');
  });

  test('config: signed in admin', async ({ page, seed }) => {
    await seed({ user: 'admin' });
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    await app.tab('Config').click();
    await app.expectHeader('Config');
    await expect(app.input('Password')).toHaveValue('correct-horse');
    await snap(app, 'config-signed-in');
  });

  test('search: popular (admin)', async ({ page, seed }) => {
    await seed({ user: 'admin' });
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    await expect(app.rows).toHaveCount(5);
    await snap(app, 'search-popular-admin');
  });

  test('search: popular (user)', async ({ page, seed }) => {
    await seed({ user: 'user' });
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    await expect(app.rows).toHaveCount(5);
    await snap(app, 'search-popular-user');
  });

  test('search: movies segment', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.segment('Movies').click();
    await expect(app.rows).toHaveCount(3);
    await snap(app, 'search-movies');
  });

  test('search: results', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.search('matrix');
    await expect(app.rows).toHaveCount(3);
    await app.searchInput.blur();
    await snap(app, 'search-results');
  });

  test('search: no results', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.search('zzzz');
    await expect(app.remark).toBeVisible();
    await app.searchInput.blur();
    await snap(app, 'search-empty');
  });

  test('search: scrolled to the long description', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.row('Interstellar').scrollIntoViewIfNeeded();
    await snap(app, 'search-long-description');
  });

  for (const [name, path, title] of [
    ['content-movie', '/movie/603', 'The Matrix'],
    ['content-movie-available', '/movie/27205', 'Inception'],
    ['content-movie-requested', '/movie/157336', 'Interstellar'],
    ['content-movie-denied', '/movie/550', 'Fight Club'],
    ['content-tv', '/tv/1396', 'Breaking Bad'],
    ['content-tv-approved', '/tv/1399', 'Game of Thrones'],
    ['content-from-requests', '/request/movie/603', 'The Matrix'],
  ] as const) {
    test(`content: ${name}`, async ({ page, seed }) => {
      await seed({ user: 'admin', usePlexOauth: true });
      const app = new App(page);
      await page.goto(path);
      await expect(app.contentTitle).toHaveText(title);
      await snap(app, name);
    });
  }

  test('requests: list', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/requests');
    await app.expectHeader('Requests');
    await expect(app.rows).toHaveCount(5);
    await snap(app, 'requests-list');
  });

  test('requests: TV segment', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/requests');
    await expect(app.rows).toHaveCount(5);
    await app.segment('TV-Shows').click();
    await expect(app.rows).toHaveCount(2);
    await snap(app, 'requests-tv');
  });

  test('requests: empty', async ({ page, seed, ombi }) => {
    ombi.movieRequests = [];
    ombi.tvRequests = [];
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/requests');
    await expect(app.remark).toBeVisible();
    await snap(app, 'requests-empty');
  });

  test('toast: error toast over the search page', async ({ page, seed, ombi, allowConsole }) => {
    // Mocked 500 (handled by RequestsPage approve → no unhandled rejection).
    allowConsole(networkLog(500));
    ombi.on('POST', /\/Request\/movie\/approve$/, { status: 500, json: {} });
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/requests');
    await expect(app.rows).toHaveCount(5);
    await app.waitForImages();
    await app.rowButton('The Matrix', 'Approve').click();
    await expect(app.toast('500 - Internal Server Error')).toBeVisible();
    // Snapshot only the toast itself; it disappears after 1.5s.
    await expect(page.locator('ion-toast')).toHaveScreenshot('toast-error.png', { timeout: 1000 });
  });
});
