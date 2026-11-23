import { expect, type Locator, type Page } from '@playwright/test';

/**
 * All DOM knowledge of the e2e suite lives here, so Ionic DOM changes between versions
 * only ever require selector fixes in this one file.
 */
export class App {
  constructor(public readonly page: Page) {}

  /* ---------- global ---------- */

  get tabBar(): Locator {
    return this.page.locator('ion-tab-bar');
  }

  tab(label: string): Locator {
    return this.page.locator('ion-tab-button').filter({ hasText: label });
  }

  /** Retrying assertion on the visible tab labels (in order). */
  async expectTabs(labels: string[]): Promise<void> {
    await expect(this.page.locator('ion-tab-button ion-label')).toHaveText(labels);
  }

  /** The currently active (visible) Ionic page inside the router outlet. */
  get activePage(): Locator {
    return this.page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)');
  }

  get header(): Locator {
    return this.activePage.locator('app-header h1');
  }

  /** Asserts that exactly one page is active and its header reads `title` (waits out page transitions). */
  async expectHeader(title: string): Promise<void> {
    await expect(this.header).toHaveText([title]);
  }

  toast(text: string | RegExp): Locator {
    return this.page.locator('ion-toast').getByText(text);
  }

  async expectToast(text: string | RegExp): Promise<void> {
    await expect(this.toast(text)).toBeVisible();
  }

  /**
   * Wait until every visible <img> (including shadow roots) finished loading. Off-screen
   * lazy images are skipped: browsers don't fetch them (WebKit leaves them incomplete), just
   * like ion-img (used before Ionic 9) didn't set their src.
   */
  async waitForImages(): Promise<void> {
    await this.page.waitForFunction(() => {
      const imgs: HTMLImageElement[] = [];
      const walk = (root: Document | ShadowRoot) => {
        root.querySelectorAll('img').forEach(i => imgs.push(i as HTMLImageElement));
        root.querySelectorAll('*').forEach(el => el.shadowRoot && walk(el.shadowRoot));
      };
      walk(document);
      const offscreen = (i: HTMLImageElement) => {
        const r = i.getBoundingClientRect();
        const notRendered = r.width === 0 && r.height === 0; // e.g. inside a hidden cached page
        return notRendered || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth;
      };
      return imgs.every(i => !i.src || (i.loading === 'lazy' && offscreen(i)) || (i.complete && i.naturalWidth > 0));
    });
  }

  /** Wait until the toast finished its enter animation. */
  async waitForToastShown(): Promise<void> {
    await expect.poll(() => this.page.locator('ion-toast').evaluate(el =>
      getComputedStyle(el.shadowRoot!.querySelector('.toast-wrapper')!).opacity)).toBe('1');
  }

  /** Wait for toasts to disappear (they last 1.5s) so screenshots are stable. */
  async waitForToastsGone(): Promise<void> {
    await expect(this.page.locator('ion-toast')).toHaveCount(0, { timeout: 10_000 });
  }

  /** Trigger an ion-refresher refresh (the pull-to-refresh handler) on the active page. */
  async pullToRefresh(): Promise<void> {
    await this.activePage.locator('ion-refresher').evaluate((el: any) =>
      el.dispatchEvent(new CustomEvent('ionRefresh', { bubbles: true, detail: { complete: () => el.complete() } })));
  }

  segment(label: string): Locator {
    return this.activePage.locator('ion-segment-button').filter({ hasText: label });
  }

  get remark(): Locator {
    return this.activePage.locator('app-list-remark');
  }

  /* ---------- config page ---------- */

  input(label: string): Locator {
    return this.page.locator('app-config ion-input').filter({ hasText: label }).locator('input');
  }

  inputHost(label: string): Locator {
    return this.page.locator('app-config ion-input').filter({ hasText: label });
  }

  get unreachableHint(): Locator {
    return this.page.locator('app-config .invalidUrlHint');
  }

  get credentials(): Locator {
    return this.page.locator('app-config .credentialsContainer');
  }

  button(label: string): Locator {
    return this.activePage.locator('ion-button').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) });
  }

  /* ---------- lists (search & requests) ---------- */

  get rows(): Locator {
    return this.activePage.locator('app-content-row');
  }

  row(title: string): Locator {
    return this.rows.filter({ has: this.page.locator('ion-card-title', { hasText: new RegExp(`^${escape(title)}$`) }) });
  }

  async rowTitles(): Promise<string[]> {
    return (await this.rows.locator('ion-card-title').allInnerTexts()).map(t => t.trim());
  }

  rowBadge(title: string): Locator {
    return this.row(title).locator('ion-badge');
  }

  /**
   * Poster image of a list row. Ionic 9: was <ion-img class="poster"> (deprecated), now a
   * native <img class="poster" loading="lazy">.
   */
  rowPoster(title: string): Locator {
    return this.row(title).locator('img.poster');
  }

  rowSubtitle(title: string): Locator {
    return this.row(title).locator('ion-card-subtitle');
  }

  rowDescription(title: string): Locator {
    return this.row(title).locator('ion-card-content p');
  }

  rowButton(title: string, label: 'Approve' | 'Deny'): Locator {
    return this.row(title).locator('.buttons ion-button').filter({ hasText: label });
  }

  get searchInput(): Locator {
    return this.activePage.locator('ion-searchbar input');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    // app-search listens to (ionChange), which ion-searchbar emits on commit (Enter / blur).
    await this.searchInput.press('Enter');
  }

  /* ---------- content page ---------- */

  /** Newest visible detail page (Ionic keeps earlier ones in the outlet's stack). */
  get contentPage(): Locator {
    return this.page.locator('app-content:not(.ion-page-hidden)').last();
  }

  get contentTitle(): Locator {
    return this.contentPage.locator('h1');
  }

  get contentYear(): Locator {
    return this.contentPage.locator('ion-content > i');
  }

  get contentBadge(): Locator {
    return this.contentPage.locator('ion-content ion-badge');
  }

  get contentGenres(): Locator {
    return this.contentPage.locator('ion-chip.genres');
  }

  get contentDescription(): Locator {
    return this.contentPage.locator('ion-content > p');
  }

  get fab(): Locator {
    return this.contentPage.locator('ion-fab-button');
  }

  get fabIcon(): Locator {
    return this.fab.locator(':scope > ion-icon');
  }

  get breadcrumbs(): Locator {
    return this.contentPage.locator('ion-breadcrumb');
  }

  get poster(): Locator {
    return this.contentPage.locator('.poster-backdrop img.poster');
  }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
