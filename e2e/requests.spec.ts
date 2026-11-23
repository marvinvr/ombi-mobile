import { App } from './support/app';
import { expect, networkLog, test, UNHANDLED_API_REJECTION } from './support/fixtures';

// Open requests first (newest first), then closed ones (newest first).
const ORDER = ['Breaking Bad', 'The Matrix', 'Fight Club', 'Game of Thrones', 'Inception'];

test.describe('requests page (admin)', () => {
  test.beforeEach(async ({ seed }) => {
    await seed({ user: 'admin' });
  });

  const open = async (app: App) => {
    await app.page.goto('/');
    await expect(app.page).toHaveURL(/\/search$/);
    await app.tab('Requests').click();
    await expect(app.page).toHaveURL(/\/requests$/);
    await app.expectHeader('Requests');
  };

  test('lists movie and TV requests sorted open-first with status, requester and actions', async ({ page, ombi }) => {
    const app = new App(page);
    await open(app);
    await expect(app.rows).toHaveCount(5);
    expect(await app.rowTitles()).toEqual(ORDER);

    await expect(app.rowBadge('Breaking Bad')).toHaveText('Open');
    await expect(app.rowBadge('Breaking Bad')).toHaveClass(/ion-color-primary/);
    await expect(app.rowBadge('The Matrix')).toHaveText('Open');
    await expect(app.rowBadge('Fight Club')).toHaveText('Denied');
    await expect(app.rowBadge('Fight Club')).toHaveClass(/ion-color-danger/);
    await expect(app.rowBadge('Game of Thrones')).toHaveText('Approved');
    await expect(app.rowBadge('Game of Thrones')).toHaveClass(/ion-color-secondary/);
    await expect(app.rowBadge('Inception')).toHaveText('Available');
    await expect(app.rowBadge('Inception')).toHaveClass(/ion-color-success/);

    await expect(app.rowSubtitle('The Matrix')).toHaveText('MOVIE requested by alice');
    await expect(app.rowSubtitle('Breaking Bad')).toHaveText('TV requested by dave');
    // Falls back to the e-mail when the user name is empty.
    await expect(app.rowSubtitle('Fight Club')).toHaveText('MOVIE requested by carol@example.com');
    await expect(app.rowDescription('Breaking Bad')).toHaveText('A chemistry teacher turns to crime.');
    await expect(app.rowPoster('Breaking Bad')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w300//ggFHVNu6YYI5L9pCfOacjizRGt.jpg');
    await expect(app.rowPoster('Fight Club')).toHaveAttribute('src', '/assets/backdrop.png');

    for (const title of ['Breaking Bad', 'The Matrix']) {
      await expect(app.rowButton(title, 'Approve')).not.toHaveClass(/button-disabled/);
      await expect(app.rowButton(title, 'Deny')).not.toHaveClass(/button-disabled/);
    }
    for (const title of ['Fight Club', 'Game of Thrones', 'Inception']) {
      await expect(app.rowButton(title, 'Approve')).toHaveClass(/button-disabled/);
      await expect(app.rowButton(title, 'Deny')).toHaveClass(/button-disabled/);
    }
    expect(ombi.callsTo('GET', /^\/api\/v2\/Requests\/movie\/20\/0\/requestedDate\/desc\?$/)).toHaveLength(1);
    expect(ombi.callsTo('GET', /^\/api\/v2\/Requests\/tv\/20\/0\/requestedDate\/desc\?$/)).toHaveLength(1);
  });

  test('approving a movie request', async ({ page, ombi }) => {
    const app = new App(page);
    await open(app);
    await app.rowButton('The Matrix', 'Approve').click();
    await expect(app.rowBadge('The Matrix')).toHaveText('Approved');
    await app.expectToast('Successfully approved request');
    await expect(app.rowButton('The Matrix', 'Approve')).toHaveClass(/button-disabled/);
    const [call] = ombi.callsTo('POST', /^\/api\/v1\/Request\/movie\/approve$/);
    expect(call.body).toEqual({ id: 101 });
    // The click on the button must not open the detail page.
    await expect(page).toHaveURL(/\/requests$/);
  });

  test('denying a TV request', async ({ page, ombi }) => {
    const app = new App(page);
    await open(app);
    await app.rowButton('Breaking Bad', 'Deny').click();
    await expect(app.rowBadge('Breaking Bad')).toHaveText('Denied');
    await app.expectToast('Successfully denied request');
    const [call] = ombi.callsTo('PUT', /^\/api\/v1\/Request\/tv\/deny$/);
    expect(call.body).toEqual({ id: 201 });
    await expect(page).toHaveURL(/\/requests$/);
  });

  test('failed approval rolls the status back', async ({ page, ombi, allowConsole }) => {
    // Browser network log for the mocked 500.
    allowConsole(networkLog(500));
    ombi.on('POST', /\/Request\/movie\/approve$/, { status: 500, json: {} });
    const app = new App(page);
    await open(app);
    await app.rowButton('The Matrix', 'Approve').click();
    await app.expectToast('500 - Internal Server Error');
    await expect(app.rowBadge('The Matrix')).toHaveText('Open');
    await expect(app.rowButton('The Matrix', 'Approve')).not.toHaveClass(/button-disabled/);
  });

  test('segment filters requests', async ({ page, ombi }) => {
    const app = new App(page);
    await open(app);
    await expect(app.rows).toHaveCount(5);
    await app.segment('Movies').click();
    await expect(app.rows).toHaveCount(3);
    expect(await app.rowTitles()).toEqual(['The Matrix', 'Fight Club', 'Inception']);
    await app.segment('TV-Shows').click();
    await expect(app.rows).toHaveCount(2);
    expect(await app.rowTitles()).toEqual(['Breaking Bad', 'Game of Thrones']);
    expect(ombi.callsTo('GET', /Requests\/tv\//)).toHaveLength(2);
    expect(ombi.callsTo('GET', /Requests\/movie\//)).toHaveLength(2);
  });

  test('tapping a request opens the detail page with a Requests breadcrumb', async ({ page }) => {
    const app = new App(page);
    await open(app);
    await app.row('The Matrix').locator('ion-card-title').click();
    await expect(page).toHaveURL(/\/request\/movie\/603$/);
    await expect(app.contentTitle).toHaveText('The Matrix');
    await expect(app.breadcrumbs).toContainText(['Requests', 'Movie']);
    await app.breadcrumbs.filter({ hasText: 'Requests' }).click();
    await expect(page).toHaveURL(/\/requests$/);
    await expect(app.rows).toHaveCount(5);

    await app.row('Breaking Bad').locator('ion-card-title').click();
    await expect(page).toHaveURL(/\/request\/tv\/1396$/);
    await expect(app.breadcrumbs).toContainText(['Requests', 'TV-Show']);
  });

  test('pull-to-refresh reloads requests', async ({ page, ombi }) => {
    const app = new App(page);
    await open(app);
    await expect(app.rows).toHaveCount(5);
    ombi.tvRequests = [];
    await app.pullToRefresh();
    await expect(app.rows).toHaveCount(3);
  });

  test('no requests shows the empty state', async ({ page, ombi }) => {
    ombi.movieRequests = [];
    ombi.tvRequests = [];
    const app = new App(page);
    await open(app);
    await expect(app.remark).toHaveText('No Requests Found');
    await expect(app.rows).toHaveCount(0);
  });

  test('API error on the list shows a toast', async ({ page, ombi, allowConsole }) => {
    // Mocked 500 + RequestsPage not catching the failed request (pre-existing).
    allowConsole(networkLog(500), UNHANDLED_API_REJECTION);
    ombi.on('GET', /\/Requests\/tv\//, { status: 500, json: {} });
    const app = new App(page);
    await open(app);
    await app.expectToast('500 - Internal Server Error');
    await expect(app.rows).toHaveCount(0);
    await expect(app.remark).toHaveCount(0);
  });
});
