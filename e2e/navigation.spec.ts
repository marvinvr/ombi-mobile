import { App } from './support/app';
import { expect, test } from './support/fixtures';

test.describe('navigation & tabs', () => {
  test('admin can move between all tabs; the active tab is highlighted', async ({ page, seed }) => {
    await seed({ user: 'admin' });
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    await expect(app.tab('Search')).toHaveClass(/tab-selected/);
    await expect(app.tab('Search').locator('ion-icon')).toHaveAttribute('name', 'search-outline');
    await expect(app.tab('Requests').locator('ion-icon')).toHaveAttribute('name', 'download-outline');
    await expect(app.tab('Config').locator('ion-icon')).toHaveAttribute('name', 'cog-outline');

    await app.tab('Requests').click();
    await expect(page).toHaveURL(/\/requests$/);
    await app.expectHeader('Requests');
    await expect(app.tab('Requests')).toHaveClass(/tab-selected/);
    await expect(app.tab('Search')).not.toHaveClass(/tab-selected/);

    await app.tab('Config').click();
    await expect(page).toHaveURL(/\/config$/);
    await app.expectHeader('Config');
    await expect(app.tab('Config')).toHaveClass(/tab-selected/);

    await app.tab('Search').click();
    await expect(page).toHaveURL(/\/search$/);
    await app.expectHeader('Discover');
  });

  test('regular user has no Requests tab', async ({ page, seed }) => {
    await seed({ user: 'user' });
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    expect(await app.tabLabels()).toEqual(['Search', 'Config']);
    await app.tab('Config').click();
    await app.expectHeader('Config');
  });

  test('browser back/forward between pages', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/search');
    await app.row('The Matrix').click();
    await expect(page).toHaveURL(/\/movie\/603$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/search$/);
    await app.expectHeader('Discover');
    await page.goForward();
    await expect(app.contentTitle).toHaveText('The Matrix');
  });

  test('empty path redirects to search', async ({ page, seed }) => {
    await seed({ user: 'admin', usePlexOauth: true });
    const app = new App(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/search$/);
    await app.expectHeader('Discover');
  });

  test('signed-out deep link to a protected page ends on config', async ({ page }) => {
    const app = new App(page);
    await page.goto('/requests');
    await expect(page).toHaveURL(/\/config$/);
    await app.expectHeader('Config');
  });
});
