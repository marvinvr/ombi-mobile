import { App } from './support/app';
import { authSettings, OMBI_HOST, OMBI_ORIGIN, PLEX_AUTH_URL, USERS } from './support/data';
import { expect, networkLog, test, UNHANDLED_API_REJECTION } from './support/fixtures';

test.describe('config page & sign in', () => {
  test('signed-out user is sent to the config page with only the Config tab', async ({ page, ombi }) => {
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/config$/);
    await app.expectHeader('Config');
    await app.expectTabs(['Config']);
    await expect(app.inputHost('Ombi Server URL')).toBeVisible();
    await expect(app.input('Ombi Server URL')).toHaveValue('');
    await expect(app.input('Ombi Server URL')).toBeEnabled();
    // No URL yet: neither the "unreachable" hint nor the credentials are shown.
    await expect(app.unreachableHint).toBeHidden();
    await expect(app.credentials).toBeHidden();
    await expect(page.locator('app-config img.github.light')).toBeVisible();
    expect(ombi.calls.filter(c => c.origin === OMBI_ORIGIN)).toEqual([]);
  });

  test('entering a reachable Ombi URL (no protocol) probes https and reveals the credential form', async ({ page, ombi }) => {
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);

    await expect(app.credentials).toBeVisible();
    await expect(app.unreachableHint).toBeHidden();
    await expect(app.input('Username')).toBeEnabled();
    await expect(app.button('Sign in')).toHaveAttribute('disabled', /.*/);
    await expect(app.button('Sign in with Plex')).toHaveCount(0);

    const probes = ombi.callsTo('GET', /^\/api\/v1\/Settings\/Authentication\?$/);
    expect(probes.length).toBeGreaterThan(0);
    expect(probes[0].origin).toBe(OMBI_ORIGIN);
    expect(probes[0].headers.accept).toBe('application/json');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('settings') || '{}'));
    expect(stored.af).toBe(OMBI_ORIGIN);
    expect(stored.ah).toBe(true);
  });

  test('Plex button and "or" separator appear when the server has OAuth enabled', async ({ page, ombi }) => {
    ombi.enableOAuth = true;
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(`https://${OMBI_HOST}/`);
    await expect(app.button('Sign in with Plex')).toBeVisible();
    await expect(app.credentials.locator('p')).toHaveText('or');
    await expect(app.credentials).toHaveClass(/bordered/);
    await expect(app.button('Sign in with Plex')).not.toHaveAttribute('disabled', /.*/);
  });

  test('unreachable URL shows the hint with an "Open in Browser" button', async ({ page, ombi, allowConsole, context }) => {
    // The browser logs the refused connections of the https:// and http:// probes.
    allowConsole(/Failed to load resource: net::ERR_CONNECTION_REFUSED/);
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill('down.test');

    await expect(app.unreachableHint).toBeVisible();
    await expect(app.unreachableHint).toContainText('Ombi is not reachable at this URL.');
    await expect(app.credentials).toBeHidden();

    const popup = context.waitForEvent('page');
    await app.button('Open in Browser').click();
    const opened = await popup;
    // window.open(model.ombiUrl) with the URL as typed (relative => resolved against the app).
    expect(opened.url()).toContain('down.test');
    await opened.close();
    expect(ombi.calls.filter(c => c.origin === OMBI_ORIGIN)).toEqual([]);
  });

  test('admin signs in with username/password', async ({ page, ombi }) => {
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);
    await expect(app.credentials).toBeVisible();
    await app.input('Username').fill(USERS.admin.username);
    await app.input('Password').fill(USERS.admin.password);
    await expect(app.input('Password')).toHaveAttribute('type', 'password');
    await app.button('Sign in').click();

    await app.expectToast('Signed in as admin!');
    await expect(page).toHaveURL(/\/search$/);
    await app.expectHeader('Discover');
    await app.expectTabs(['Search', 'Requests', 'Config']);

    const [login] = ombi.callsTo('POST', /^\/api\/v1\/token$/);
    expect(login.origin).toBe(OMBI_ORIGIN);
    expect(login.body).toEqual({ username: 'admin', password: 'correct-horse', rememberMe: true, usePlexOAuth: false });
    expect(login.headers['content-type']).toBe('application/json');
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBe(USERS.admin.token);

    // Subsequent API calls carry the bearer token.
    await expect(app.rows.first()).toBeVisible();
    const popular = ombi.callsTo('GET', /^\/api\/v2\/search\/Movie\/popular\/0\/20\?$/);
    expect(popular.at(-1)!.headers.authorization).toBe(`Bearer ${USERS.admin.token}`);
  });

  test('regular user gets Search and Config tabs only', async ({ page }) => {
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);
    await app.input('Username').fill(USERS.user.username);
    await app.input('Password').fill(USERS.user.password);
    await app.button('Sign in').click();
    await app.expectToast('Signed in as bob!');
    await expect(page).toHaveURL(/\/search$/);
    await app.expectTabs(['Search', 'Config']);
  });

  test('power user (can approve) gets the Requests tab', async ({ page }) => {
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);
    await app.input('Username').fill(USERS.poweruser.username);
    await app.input('Password').fill(USERS.poweruser.password);
    await app.button('Sign in').click();
    await app.expectToast('Signed in as paula!');
    await app.expectTabs(['Search', 'Requests', 'Config']);
  });

  test('wrong credentials show an error and keep the user signed out', async ({ page, ombi, allowConsole }) => {
    // Browser network log for the mocked 401 of POST /token.
    allowConsole(/Failed to load resource: the server responded with a status of 401/);
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);
    await app.input('Username').fill('admin');
    await app.input('Password').fill('wrong');
    await app.button('Sign in').click();

    await app.expectToast('Unable to sign in with these credentials');
    // ApiService treats any 401 as "session expired".
    await app.expectToast('You have been signed out.');
    await expect(page).toHaveURL(/\/config$/);
    await app.expectTabs(['Config']);
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('');
    expect(ombi.callsTo('POST', /^\/api\/v1\/token$/)).toHaveLength(1);
  });

  test('server error on sign in shows status toast', async ({ page, ombi, allowConsole }) => {
    // Browser network log for the mocked 500.
    allowConsole(/Failed to load resource: the server responded with a status of 500/);
    ombi.on('POST', /\/api\/v1\/token$/, { status: 500, json: {} });
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);
    await app.input('Username').fill('admin');
    await app.input('Password').fill('correct-horse');
    await app.button('Sign in').click();
    await app.expectToast('500 - Internal Server Error');
    await app.expectToast('Unable to sign in with these credentials');
    await expect(page).toHaveURL(/\/config$/);
  });

  test('sign in with Plex opens the Plex window and polls for the token', async ({ page, ombi, context }) => {
    ombi.enableOAuth = true;
    const app = new App(page);
    await page.goto('/config');
    await app.input('Ombi Server URL').fill(OMBI_HOST);
    const popupPromise = context.waitForEvent('page');
    await app.button('Sign in with Plex').click();
    const popup = await popupPromise;
    await expect.poll(() => popup.url()).toBe(PLEX_AUTH_URL);

    await app.expectToast('Signed in as admin!');
    await expect(page).toHaveURL(/\/search$/);
    await expect.poll(() => popup.isClosed()).toBe(true);

    const [pin] = ombi.callsTo('POST', /^\/api\/v2\/pins\?strong=true$/);
    expect(pin.origin).toBe('https://plex.tv');
    expect(pin.headers['x-plex-client-identifier']).toBe('97bcef7bfeea499984dd16220453a3bf');
    expect(pin.headers['x-plex-product']).toBe('Ombi');
    const [tokenCall] = ombi.callsTo('POST', /^\/api\/v1\/token$/);
    expect(tokenCall.body).toMatchObject({ usePlexOauth: true, plexTvPin: { id: 4242, code: 'E2EPIN' } });
    expect(ombi.callsTo('GET', /^\/api\/v1\/token\/4242\?$/).length).toBe(3);
    const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('settings') || '{}'));
    expect(settings.ag).toBe(true); // USE_PLEX_OAUTH
  });

  test('predefined host from assets/settings is applied and locks the URL field', async ({ page, context, ombi }) => {
    // Pre-existing race: on start-up AuthService also probes `null/api/v1/...` (no base URL yet),
    // whose failure can land after the predefined URL's successful probe. Answer the real probe
    // a bit later so the outcome is deterministic.
    ombi.on('GET', /\/api\/v1\/Settings\/Authentication/, async () => {
      await new Promise(r => setTimeout(r, 750));
      return { json: authSettings(false) };
    });
    await context.route(/\/assets\/settings\/predefined-host\.txt$/, route =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: OMBI_ORIGIN }));
    const app = new App(page);
    await page.goto('/config');
    await expect(app.input('Ombi Server URL')).toBeDisabled();
    await expect(app.inputHost('Ombi Server URL')).toContainText('This URL has been pre-set by your Media Server Host.');
    await expect(app.credentials).toBeVisible();
    await expect(app.input('Ombi Server URL')).toHaveValue(OMBI_ORIGIN);
  });

  test('GitHub logo links to the repository', async ({ page }) => {
    await page.goto('/config');
    // Leaving the page while lazy ES-module chunks are still loading makes WebKit log
    // "Importing a module script failed"; a user can't click that fast.
    await page.waitForLoadState('networkidle');
    await page.route('https://github.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>GitHub (mock)</h1>' }));
    await page.locator('app-config img.github.light').click();
    await expect(page).toHaveURL('https://github.com/marvinvr/ombi-mobile');
  });
});

test.describe('returning user / session', () => {
  test('stored credentials re-authenticate on start-up and land on search', async ({ page, ombi, seed }) => {
    await seed({ user: 'admin' });
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    await app.expectHeader('Discover');
    await app.expectTabs(['Search', 'Requests', 'Config']);
    await expect.poll(() => ombi.callsTo('POST', /^\/api\/v1\/token$/).length).toBe(1);
    expect(ombi.callsTo('POST', /^\/api\/v1\/token$/)[0].body).toMatchObject({ username: 'admin', password: 'correct-horse' });
  });

  test('Plex sessions are not re-authenticated with username/password on start-up', async ({ page, ombi, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows.first()).toBeVisible();
    expect(ombi.callsTo('POST', /^\/api\/v1\/token$/)).toHaveLength(0);
    // AuthService always re-probes the configured server on start-up.
    expect(ombi.callsTo('GET', /Settings\/Authentication/).length).toBeGreaterThan(0);
  });

  test('config page of a signed-in user shows the stored URL and credentials', async ({ page, seed }) => {
    await seed({ user: 'admin' });
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    await app.tab('Config').click();
    await expect(page).toHaveURL(/\/config$/);
    await expect(app.input('Ombi Server URL')).toHaveValue(OMBI_ORIGIN);
    await expect(app.input('Username')).toHaveValue('admin');
    await expect(app.input('Password')).toHaveValue('correct-horse');
    await expect(app.button('Sign in')).not.toHaveAttribute('disabled', /.*/);
  });

  test('a 401 from the API signs the user out (session expiry is the app\'s logout)', async ({ page, ombi, seed, allowConsole }) => {
    // Browser network log for the mocked 401 + the caller not catching the rejected request.
    allowConsole(networkLog(401), UNHANDLED_API_REJECTION);
    await seed({ user: 'admin', usePlexOauth: true });
    ombi.on('GET', /\/api\/v2\/Requests\/movie\//, { status: 401, json: {} });
    const app = new App(page);
    await page.goto('/search');
    await expect(app.rows.first()).toBeVisible();
    await app.tab('Requests').click();

    await app.expectToast('You have been signed out.');
    await expect(page).toHaveURL(/\/config$/);
    await app.expectTabs(['Config']);
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('');
  });

  test('invalid stored credentials on start-up sign the user out', async ({ page, ombi, seed, allowConsole }) => {
    // Browser network log for the mocked 401 + the caller not catching the rejected request.
    allowConsole(networkLog(401), UNHANDLED_API_REJECTION);
    await seed({ user: 'admin' });
    ombi.on('POST', /\/api\/v1\/token$/, { status: 401, json: {} });
    const app = new App(page);
    await page.goto('/');
    await app.expectToast('You have been signed out.');
    await expect(page).toHaveURL(/\/config$/);
    await app.expectTabs(['Config']);
  });
});
