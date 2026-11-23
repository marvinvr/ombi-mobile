import { App } from './support/app';
import { expect, KNOWN_BUG_REQUEST_REFRESH, networkLog, test, UNHANDLED_API_REJECTION } from './support/fixtures';

/**
 * Content detail pages. Users are seeded as Plex-OAuth sessions so the app does not
 * re-authenticate on start-up (which would navigate to /search) and deep links stay put.
 */
test.describe('content detail page', () => {
  test('movie details: title, year, genres, description, poster, breadcrumbs', async ({ page, seed, ombi }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/movie/603');
    await expect(app.contentTitle).toHaveText('The Matrix');
    await expect(app.contentYear).toHaveText('(1999)');
    await expect(app.contentGenres).toHaveText(['Action', 'Science Fiction']);
    await expect(app.contentDescription).toHaveText(/^Set in the 22nd century/);
    await expect(app.contentBadge).toHaveCount(0);
    await expect(app.poster).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w300//f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg');
    await expect(app.poster).toHaveAttribute('alt', 'The Matrix');
    await expect(app.contentPage.locator('.poster-backdrop ion-icon')).toHaveAttribute('name', 'film');
    await expect(app.breadcrumbs).toContainText(['Search', 'Movie']);
    await expect(app.fab).not.toHaveClass(/fab-button-disabled/);
    await expect(app.fab).toHaveClass(/ion-color-success/);
    await expect(app.fabIcon).toHaveAttribute('name', 'download-outline');
    expect(ombi.callsTo('GET', /^\/api\/v2\/search\/Movie\/603\?$/)).toHaveLength(1);
  });

  test('requesting a movie as admin (auto-approve) marks it approved', async ({ page, seed, ombi , allowConsole }) => {
    allowConsole(KNOWN_BUG_REQUEST_REFRESH);
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/movie/603');
    await expect(app.contentTitle).toHaveText('The Matrix');
    await app.fab.click();

    await app.expectToast('Successfully requested Movie');
    await expect(app.contentBadge).toHaveText('Approved');
    await expect(app.contentBadge).toHaveClass(/ion-color-secondary/);
    await expect(app.fab).toHaveClass(/fab-button-disabled/);
    await expect(app.fabIcon).toHaveAttribute('name', 'cloud-download-outline');

    const [req] = ombi.callsTo('POST', /^\/api\/v1\/Request\/Movie$/);
    expect(req.body).toEqual({ theMovieDbId: 603, languageCode: 'en' });
    // After a successful request the details are force-reloaded.
    await expect.poll(() => ombi.callsTo('GET', /\/search\/Movie\/603\?$/).length).toBe(2);
  });

  test('requesting a movie as a regular user marks it requested', async ({ page, seed, ombi , allowConsole }) => {
    allowConsole(KNOWN_BUG_REQUEST_REFRESH);
    await seed({ user: 'user', usePlexOauth: true });
    ombi.on('POST', /\/api\/v1\/Request\/Movie$/, () => {
      Object.assign(ombi.movies[603], { requested: true, approved: false });
      return { json: { result: true, isError: false } };
    });
    const app = new App(page);
    await page.goto('/search');
    await app.row('The Matrix').click();
    await expect(app.contentTitle).toHaveText('The Matrix');
    await app.fab.click();
    await app.expectToast('Successfully requested Movie');
    await expect(app.contentBadge).toHaveText('Requested');
    await expect(app.contentBadge).toHaveClass(/ion-color-warning/);
    await expect(app.fabIcon).toHaveAttribute('name', 'person-outline');
    await expect(app.fab).toHaveClass(/fab-button-disabled/);
  });

  test('Ombi rejecting a request (isError) shows its message', async ({ page, seed, ombi , allowConsole }) => {
    allowConsole(KNOWN_BUG_REQUEST_REFRESH);
    await seed({ user: 'admin', usePlexOauth: true });
    ombi.on('POST', /\/api\/v1\/Request\/Movie$/, { json: { result: false, isError: true, errorMessage: 'You have exceeded your Movie request quota!' } });
    const app = new App(page);
    await page.goto('/movie/603');
    await app.fab.click();
    await app.expectToast('You have exceeded your Movie request quota!');
    // Details are reloaded from the server, which still reports "not requested".
    await expect.poll(() => ombi.callsTo('GET', /\/search\/Movie\/603\?$/).length).toBe(2);
    await expect(app.contentBadge).toHaveCount(0);
    await expect(app.fab).not.toHaveClass(/fab-button-disabled/);
  });

  test('HTTP error on request rolls the optimistic state back', async ({ page, seed, ombi, allowConsole }) => {
    // Browser network log for the mocked 500.
    allowConsole(networkLog(500));
    await seed({ user: 'admin', usePlexOauth: true });
    ombi.on('POST', /\/api\/v1\/Request\/Movie$/, { status: 500, json: {} });
    const app = new App(page);
    await page.goto('/movie/603');
    await app.fab.click();
    await app.expectToast('500 - Internal Server Error');
    await expect(app.fab).not.toHaveClass(/fab-button-disabled/);
    await expect(app.fabIcon).toHaveAttribute('name', 'download-outline');
    await expect(app.contentBadge).toHaveCount(0);
  });

  test('available movie', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/movie/27205');
    await expect(app.contentTitle).toHaveText('Inception');
    await expect(app.contentBadge).toHaveText('Available');
    await expect(app.contentBadge).toHaveClass(/ion-color-success/);
    await expect(app.fabIcon).toHaveAttribute('name', 'checkmark');
    await expect(app.fab).toHaveClass(/fab-button-disabled/);
  });

  test('pending (requested, not approved) movie', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/movie/157336');
    await expect(app.contentTitle).toHaveText('Interstellar');
    await expect(app.contentBadge).toHaveText('Requested');
    await expect(app.contentBadge).toHaveClass(/ion-color-warning/);
    await expect(app.fabIcon).toHaveAttribute('name', 'person-outline');
    await expect(app.fab).toHaveClass(/fab-button-disabled/);
  });

  test('denied movie', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/movie/550');
    await expect(app.contentTitle).toHaveText('Fight Club');
    await expect(app.contentBadge).toHaveText('Denied');
    await expect(app.contentBadge).toHaveClass(/ion-color-danger/);
    await expect(app.fabIcon).toHaveAttribute('name', 'close-outline');
  });

  test('TV show details and request', async ({ page, seed, ombi , allowConsole }) => {
    allowConsole(KNOWN_BUG_REQUEST_REFRESH);
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/tv/1396');
    await expect(app.contentTitle).toHaveText('Breaking Bad');
    await expect(app.contentYear).toHaveText('(2008)');
    await expect(app.contentGenres).toHaveText(['Drama', 'Crime']);
    await expect(app.breadcrumbs).toContainText(['Search', 'TV-Show']);
    await expect(app.contentPage.locator('.poster-backdrop ion-icon')).toHaveAttribute('name', 'tv-outline');
    await expect(app.poster).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w300/ggFHVNu6YYI5L9pCfOacjizRGt.jpg');
    await expect(app.fabIcon).toHaveAttribute('name', 'download-outline');

    await app.fab.click();
    await app.expectToast('Successfully requested TV Show');
    await expect(app.contentBadge).toHaveText('Approved');
    const [req] = ombi.callsTo('POST', /^\/api\/v2\/Requests\/TV$/);
    expect(req.body).toEqual({ firstSeason: false, latestSeason: false, requestAll: true, theMovieDbId: 1396 });
    expect(ombi.callsTo('GET', /^\/api\/v2\/search\/Tv\/1396\?$/).length).toBeGreaterThanOrEqual(1);
  });

  test('approved TV show', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/tv/1399');
    await expect(app.contentTitle).toHaveText('Game of Thrones');
    await expect(app.contentBadge).toHaveText('Approved');
    await expect(app.fabIcon).toHaveAttribute('name', 'cloud-download-outline');
    await expect(app.poster).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w300//1XS1oqL89opfnbLl8WnZY1O1uJx.jpg');
  });

  test('pull-to-refresh reloads the details', async ({ page, seed, ombi }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/movie/603');
    await expect(app.contentBadge).toHaveCount(0);
    Object.assign(ombi.movies[603], { available: true });
    await app.pullToRefresh();
    await expect(app.contentBadge).toHaveText('Available');
    expect(ombi.callsTo('GET', /\/search\/Movie\/603\?$/)).toHaveLength(2);
  });

  test('API error on details shows a toast', async ({ page, seed, ombi, allowConsole }) => {
    // Mocked 500 + ContentPage not catching the failed request (pre-existing).
    allowConsole(networkLog(500), UNHANDLED_API_REJECTION);
    await seed({ user: 'admin', usePlexOauth: true });
    ombi.on('GET', /\/search\/Movie\/603/, { status: 500, json: {} });
    const app = new App(page);
    await page.goto('/movie/603');
    await app.expectToast('500 - Internal Server Error');
    await expect(app.contentTitle).toHaveCount(0);
  });
});
