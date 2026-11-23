import { test as base, expect, type Page } from '@playwright/test';
import { OMBI_ORIGIN, USERS, type UserKey } from './data';
import { OmbiMock } from './ombi-mock';

export { expect };

/**
 * Pre-existing app behaviour: ApiService rethrows `new Error(err)` and several callers
 * (AppComponent start-up re-login, SearchPage, RequestsPage, ContentPage) don't catch,
 * so zone.js logs an unhandled rejection whenever the API fails. Only allowed in tests
 * that deliberately make the API fail.
 */
export const UNHANDLED_API_REJECTION = /^ERROR Error: Uncaught \(in promise\): Error: \[object Object\]/;
/**
 * Pre-existing app bug: after a successful request ContentComponent calls
 * `refresh(new Event('request'))` and then `event.target.complete()` on an event that was
 * never dispatched (target === null). Harmless for the UI (the details are already
 * reloaded), but it logs an uncaught TypeError. Left untouched on purpose (no behaviour
 * changes in the migration); allowed only in the tests that perform a request.
 */
export const KNOWN_BUG_REQUEST_REFRESH =
  /^ERROR Error: Uncaught \(in promise\): TypeError: (Cannot read properties of null \(reading 'complete'\)|null is not an object \(evaluating '\w+\.target\.complete'\))/;

export const networkLog = (status: number) => new RegExp(`Failed to load resource: the server responded with a status of ${status}`);

interface ConsoleEntry {
  type: string;
  text: string;
  url: string;
}

export interface SeedOptions {
  user?: UserKey;
  /** Stored Ombi base URL (as the app stores it after normalisation). */
  baseUrl?: string;
  /** Persist a valid token (otherwise only credentials are stored). */
  withToken?: boolean;
  usePlexOauth?: boolean;
  hasOauth?: boolean;
}

interface Fixtures {
  ombi: OmbiMock;
  /**
   * Console errors/warnings and uncaught page errors matching one of these patterns are
   * tolerated for the current test. Every use must carry a comment explaining why the
   * message is expected (e.g. the browser logging a deliberately mocked HTTP 500).
   */
  allowConsole: (...patterns: RegExp[]) => void;
  /** Seed localStorage before the app boots (simulates a returning, signed-in user). */
  seed: (options?: SeedOptions) => Promise<void>;
  consoleLog: ConsoleEntry[];
}

/** Emitted by Playwright itself because of `serviceWorkers: 'block'` (see playwright.config.ts). */
const HARNESS_MESSAGES = [
  /^Service Worker registration blocked by Playwright$/,
  // WebKit's own informational notice when navigating to github.com (GitHub logo test).
  /has active WebKit quirks/,
];

const APP_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//;

export const test = base.extend<Fixtures>({
  consoleLog: async ({}, use) => {
    await use([]);
  },

  allowConsole: async ({}, use, testInfo) => {
    const allowed: RegExp[] = [];
    (testInfo as any)._allowedConsole = allowed;
    await use((...patterns: RegExp[]) => allowed.push(...patterns));
  },

  ombi: [async ({ context, consoleLog }, use, testInfo) => {
    const unexpected: string[] = [];

    // Network guard (registered first => evaluated last): anything not answered by a mock and
    // not served by the app under test itself is a real outbound call, which is forbidden.
    await context.route('**/*', route => {
      const url = route.request().url();
      if (APP_ORIGIN_RE.test(url) || url.startsWith(process.env.E2E_BASE_URL || '\u0000')) {
        return route.fallback();
      }
      unexpected.push(`${route.request().method()} ${url}`);
      return route.abort('blockedbyclient');
    });

    // Deterministic Math.random: SearchService shuffles popular results with it.
    await context.addInitScript(() => {
      let seed = 42;
      Math.random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    });

    const attach = (page: Page) => {
      page.on('console', msg => {
        if ((msg.type() === 'error' || msg.type() === 'warning') && !HARNESS_MESSAGES.some(re => re.test(msg.text()))) {
          consoleLog.push({ type: msg.type(), text: msg.text(), url: msg.location().url });
        }
      });
      page.on('pageerror', err => consoleLog.push({ type: 'pageerror', text: `${err.name}: ${err.message}`, url: '' }));
    };
    context.pages().forEach(attach);
    context.on('page', attach);

    const mock = new OmbiMock();
    await mock.install(context);
    await use(mock);

    const allowed: RegExp[] = (testInfo as any)._allowedConsole || [];
    const offending = consoleLog.filter(e => !allowed.some(re => re.test(e.text)));
    if (consoleLog.length) {
      await testInfo.attach('console.json', { body: JSON.stringify(consoleLog, null, 2), contentType: 'application/json' });
    }
    expect(unexpected, 'unexpected real network calls').toEqual([]);
    expect(offending, 'console errors / warnings / uncaught errors').toEqual([]);
  }, { auto: true }],

  seed: async ({ context }, use) => {
    await use(async (options: SeedOptions = {}) => {
      const user = USERS[options.user || 'admin'];
      const settings: Record<string, unknown> = {
        af: options.baseUrl ?? OMBI_ORIGIN, // BASE_URL
        ad: user.username, // USERNAME
        ae: user.password, // PASSWORD
        ah: true, // URL_IS_VALID
        ai: options.hasOauth ?? false, // URL_HAS_OAUTH
        ag: options.usePlexOauth ?? false, // USE_PLEX_OAUTH
      };
      const token = options.withToken === false ? '' : user.token;
      await context.addInitScript(([s, t]) => {
        try {
          // Only seed once per tab so reloads keep whatever state the app wrote.
          if (!sessionStorage.getItem('__e2e_seeded')) {
            sessionStorage.setItem('__e2e_seeded', '1');
            localStorage.setItem('settings', s as string);
            localStorage.setItem('token', t as string);
          }
        } catch {
          // Opaque-origin documents (about:blank popups, sandboxed frames) have no storage access.
        }
      }, [JSON.stringify(settings), token]);
    });
  },
});
