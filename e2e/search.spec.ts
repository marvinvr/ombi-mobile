import { App } from './support/app';
import { expect, networkLog, test, UNHANDLED_API_REJECTION } from './support/fixtures';

const POPULAR_TITLES = ['Breaking Bad', 'Game of Thrones', 'Inception', 'Interstellar', 'The Matrix'];

test.describe('search page', () => {
  test.beforeEach(async ({ seed }) => {
    await seed({ user: 'admin' });
  });

  test('shows popular movies and trending TV with posters, types and descriptions', async ({ page, ombi }) => {
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    await app.expectHeader('Discover');
    await expect(app.rows).toHaveCount(5);
    expect((await app.rowTitles()).sort()).toEqual(POPULAR_TITLES);

    await expect(app.rowSubtitle('The Matrix')).toHaveText('MOVIE');
    await expect(app.rowSubtitle('Breaking Bad')).toHaveText('TV');
    await expect(app.rowDescription('The Matrix')).toHaveText(/^Set in the 22nd century, The Matrix tells the story/);
    // Descriptions longer than 70 words are cut and get a bold ellipsis.
    await expect(app.rowDescription('Interstellar')).toHaveText(/^word1 word2 .* word70\.\.\.$/);
    await expect(app.rowDescription('Interstellar').locator('b')).toHaveText('...');
    // Empty descriptions get a placeholder (typo is the app's).
    await expect(app.rowDescription('Game of Thrones')).toHaveText('No description avaliable');
    await expect(app.rowDescription('Game of Thrones').locator('i')).toHaveCount(1);
    // Media type icon on the poster backdrop.
    await expect(app.row('The Matrix').locator('.poster-backdrop ion-icon')).toHaveAttribute('name', 'film');
    await expect(app.row('Breaking Bad').locator('.poster-backdrop ion-icon')).toHaveAttribute('name', 'tv-outline');
    // Poster URLs: tmdb w300 for relative paths, absolute URLs untouched, fallback asset when missing.
    await expect(app.rowPoster('The Matrix')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w300//f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg');
    await expect(app.rowPoster('Breaking Bad')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w300/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg');
    await expect(app.rowPoster('Interstellar')).toHaveAttribute('src', '/assets/backdrop.png');
    await expect(app.remark).toHaveCount(0);

    expect(ombi.callsTo('GET', /^\/api\/v2\/search\/Movie\/popular\/0\/20\?$/)).toHaveLength(1);
    expect(ombi.callsTo('GET', /^\/api\/v2\/search\/Tv\/trending\/0\/15\?$/)).toHaveLength(1);
  });

  test('segment filters popular content by movies and TV shows', async ({ page, ombi }) => {
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);

    await app.segment('Movies').click();
    await expect(app.rows).toHaveCount(3);
    expect((await app.rowTitles()).sort()).toEqual(['Inception', 'Interstellar', 'The Matrix']);
    await expect(app.segment('Movies')).toHaveClass(/segment-button-checked/);

    await app.segment('TV-Shows').click();
    await expect(app.rows).toHaveCount(2);
    expect((await app.rowTitles()).sort()).toEqual(['Breaking Bad', 'Game of Thrones']);

    await app.segment('All').click();
    await expect(app.rows).toHaveCount(5);
    // Segment changes force a refetch of the respective list(s).
    expect(ombi.callsTo('GET', /popular\/0\/20/).length).toBe(3);
  });

  test('searching posts the multi search and lists the hits', async ({ page, ombi }) => {
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.search('matrix');

    await expect(app.rows).toHaveCount(3);
    expect(await app.rowTitles()).toEqual(['The Matrix', 'The Matrix Reloaded', 'The Matrix: Animated']);
    await expect(app.rowSubtitle('The Matrix: Animated')).toHaveText('TV');
    await expect(app.rowPoster('The Matrix')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w300/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg');
    await expect(app.rowPoster('The Matrix Reloaded')).toHaveAttribute('src', '/assets/backdrop.png');

    const [call] = ombi.callsTo('POST', /^\/api\/v2\/search\/multi\/matrix$/);
    expect(call.body).toEqual({ music: false, people: false, movies: true, tvShows: true });

    // Changing the segment re-runs the search restricted to that type.
    await app.segment('Movies').click();
    await expect(app.rows).toHaveCount(2);
    expect(ombi.callsTo('POST', /multi\/matrix$/).at(-1)!.body).toEqual({ music: false, people: false, movies: true, tvShows: false });

    // Clearing the term goes back to the popular list.
    await app.search('');
    await expect(app.rows).toHaveCount(3);
    expect((await app.rowTitles()).sort()).toEqual(['Inception', 'Interstellar', 'The Matrix']);
  });

  test('search terms with spaces are sent in the path', async ({ page, ombi }) => {
    ombi.multi['the matrix'] = ombi.multi.matrix;
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.search('the matrix');
    await expect(app.rows).toHaveCount(3);
    expect(ombi.callsTo('POST', /^\/api\/v2\/search\/multi\/the matrix$/)).toHaveLength(1);
  });

  test('no hits shows the empty state', async ({ page }) => {
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.search('zzzz');
    await expect(app.remark).toHaveText('No Content Found');
    await expect(app.rows).toHaveCount(0);
  });

  test('empty popular lists show the empty state', async ({ page, ombi }) => {
    ombi.popular = [];
    ombi.trending = [];
    const app = new App(page);
    await page.goto('/search');
    await expect(app.remark).toHaveText('No Content Found');
  });

  test('popular lists are cached between visits and refreshed by pull-to-refresh', async ({ page, ombi }) => {
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.tab('Config').click();
    await app.expectHeader('Config');
    await app.tab('Search').click();
    await app.expectHeader('Discover');
    await expect(app.rows).toHaveCount(5);
    expect(ombi.callsTo('GET', /popular\/0\/20/)).toHaveLength(1);

    ombi.popular = ombi.popular.slice(0, 1);
    await app.pullToRefresh();
    await expect(app.rows).toHaveCount(3);
    expect(ombi.callsTo('GET', /popular\/0\/20/)).toHaveLength(2);
  });

  test('tapping a result opens its detail page', async ({ page }) => {
    const app = new App(page);
    await page.goto('/search');
    await app.row('The Matrix').click();
    await expect(page).toHaveURL(/\/movie\/603$/);
    await expect(app.contentTitle).toHaveText('The Matrix');
    await app.breadcrumbs.filter({ hasText: 'Search' }).click();
    await expect(page).toHaveURL(/\/search$/);
    await app.row('Breaking Bad').click();
    await expect(page).toHaveURL(/\/tv\/1396$/);
    await expect(app.contentTitle).toHaveText('Breaking Bad');
  });

  test('API error on popular lists shows a toast', async ({ page, ombi, allowConsole }) => {
    // Mocked 500 + SearchPage not catching the failed request (pre-existing).
    allowConsole(networkLog(500), UNHANDLED_API_REJECTION);
    ombi.on('GET', /popular\/0\/20/, { status: 500, json: {} });
    const app = new App(page);
    await page.goto('/search');
    await app.expectToast('500 - Internal Server Error');
    await expect(app.rows).toHaveCount(0);
    // The page stays in its loading state, so no empty-state remark either.
    await expect(app.remark).toHaveCount(0);
  });

  test('API error on search shows a toast', async ({ page, ombi, allowConsole }) => {
    // Mocked 503 + SearchPage not catching the failed request (pre-existing).
    allowConsole(networkLog(503), UNHANDLED_API_REJECTION);
    ombi.on('POST', /multi\//, { status: 503, json: {} });
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows).toHaveCount(5);
    await app.search('matrix');
    await app.expectToast('503 - Service Unavailable');
  });
});
