import type { BrowserContext, Request, Route } from '@playwright/test';
import { deflateSync } from 'zlib';
import * as data from './data';

export interface ApiCall {
  method: string;
  origin: string;
  /** Path including the query string, e.g. `/api/v1/Settings/Authentication?` */
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

export type MockResponse =
  | { status?: number; json?: unknown; text?: string; headers?: Record<string, string> }
  | 'abort';

type Responder = (call: ApiCall) => MockResponse | Promise<MockResponse>;

interface Override {
  method: string;
  path: RegExp;
  respond: Responder;
  times: number;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const STATUS_TEXT: Record<number, string> = {
  200: 'OK', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
};

/* ---------- tiny deterministic PNG encoder (solid colour posters) ---------- */
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) {
    c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, payload: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), payload]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
};
const solidPng = (w: number, h: number, [r, g, b]: [number, number, number]) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};
const posterFor = (url: string) => {
  let h = 0;
  for (const ch of url) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return solidPng(60, 90, [40 + (h % 180), 40 + ((h >> 8) % 180), 40 + ((h >> 16) % 180)]);
};

/**
 * Complete in-memory fake of the parts of the Ombi API (and plex.tv) that the app talks to.
 * Every request the browser makes to a non-app origin is either answered here or aborted
 * and reported as unexpected by the network guard in fixtures.ts.
 */
export class OmbiMock {
  public readonly calls: ApiCall[] = [];
  public enableOAuth = false;
  public movies = clone(data.movieDetails);
  public shows = clone(data.tvDetails);
  public popular = clone(data.popularMovies);
  public trending = clone(data.trendingTv);
  public multi = clone(data.multiSearch);
  public movieRequests = clone(data.movieRequests);
  public tvRequests = clone(data.tvRequests);
  /** pinId → number of polls before the Plex pin is authorised */
  public plexPollsUntilAuthorised = 2;
  public plexUser: data.UserKey = 'admin';

  private overrides: Override[] = [];
  private plexPolls = 0;

  /** Override a single endpoint (path regex is matched against path + query). */
  public on(method: string, path: RegExp, respond: Responder | MockResponse, times = Infinity): this {
    const fn: Responder = typeof respond === 'function' ? respond : () => respond;
    this.overrides.unshift({ method: method.toUpperCase(), path, respond: fn, times });
    return this;
  }

  public callsTo(method: string, path: RegExp): ApiCall[] {
    return this.calls.filter(c => c.method === method.toUpperCase() && path.test(c.path));
  }

  public async install(context: BrowserContext): Promise<void> {
    await context.route(/^https:\/\/image\.tmdb\.org\//, route =>
      route.fulfill({ status: 200, contentType: 'image/png', body: posterFor(route.request().url()) }));
    // Third-party analytics scripts referenced from src/index.html: answered with an empty script.
    await context.route(/^https:\/\/(stats\.marvinvr\.ch|static\.cloudflareinsights\.com)\//, route =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await context.route(/^https?:\/\/down\.test\//, route => route.abort('connectionrefused'));
    await context.route(/^https:\/\/app\.plex\.tv\//, route =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><h1>Plex sign in (mock)</h1></body></html>' }));
    await context.route(/^https?:\/\/(ombi\.test|plex\.tv)\//, route => this.handle(route));
  }

  private async handle(route: Route): Promise<void> {
    const request = route.request();
    const url = new URL(request.url());
    const cors = {
      'access-control-allow-origin': request.headers().origin || '*',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'access-control-allow-headers': request.headers()['access-control-request-headers'] || '*',
      'access-control-max-age': '600',
    };
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors });
    }
    // http:// variant of the Ombi host is not served (only https), like a typical reverse proxy setup.
    if (url.protocol === 'http:') {
      return route.abort('connectionrefused');
    }
    const call: ApiCall = {
      method: request.method(),
      origin: url.origin,
      path: decodeURIComponent(url.pathname) + (request.url().includes('?') ? url.search || '?' : ''),
      body: parseBody(request),
      headers: request.headers(),
    };
    this.calls.push(call);

    const res = await this.respond(call);
    if (res === 'abort') {
      return route.abort('connectionrefused');
    }
    const status = res.status ?? 200;
    return route.fulfill({
      status,
      headers: { ...cors, 'content-type': res.text !== undefined ? 'text/plain' : 'application/json', ...res.headers },
      body: res.text !== undefined ? res.text : res.json === undefined ? '' : JSON.stringify(res.json),
    });
  }

  private async respond(call: ApiCall): Promise<MockResponse> {
    const key = `${call.origin}${call.path}`;
    const override = this.overrides.find(o => o.method === call.method && o.times > 0 && o.path.test(key));
    if (override) {
      override.times--;
      return override.respond(call);
    }
    return this.defaultResponse(call);
  }

  private defaultResponse(call: ApiCall): MockResponse {
    const { method } = call;
    const path = call.path.replace(/\?$/, '');
    const body = (call.body || {}) as Record<string, any>;
    let m: RegExpMatchArray | null;

    if (call.origin === data.PLEX_ORIGIN) {
      if (method === 'POST' && path === '/api/v2/pins?strong=true') {
        return { status: 201, json: { id: 4242, code: 'E2EPIN', product: 'Ombi', trusted: false } };
      }
      return { status: 404, json: {} };
    }

    if (method === 'GET' && path === '/api/v1/Settings/Authentication') {
      return { json: data.authSettings(this.enableOAuth) };
    }
    if (method === 'POST' && path === '/api/v1/token') {
      if (body.usePlexOauth) {
        return { json: { url: data.PLEX_AUTH_URL, pinId: 4242 } };
      }
      const user = Object.values(data.USERS).find(u => u.username === body.username && u.password === body.password);
      if (!user) {
        return { status: 401, json: { error: 'Incorrect username or password' } };
      }
      return { json: { access_token: user.token, expiration: '2099-01-01T00:00:00Z' } };
    }
    if (method === 'GET' && (m = path.match(/^\/api\/v1\/token\/(\d+)$/))) {
      this.plexPolls++;
      return this.plexPolls > this.plexPollsUntilAuthorised
        ? { json: { access_token: data.USERS[this.plexUser].token } }
        : { json: { access_token: null } };
    }
    if (method === 'GET' && path === '/api/v2/search/Movie/popular/0/20') {
      return { json: this.popular };
    }
    if (method === 'GET' && path === '/api/v2/search/Tv/trending/0/15') {
      return { json: this.trending };
    }
    if (method === 'POST' && (m = path.match(/^\/api\/v2\/search\/multi\/(.+)$/))) {
      const term = m[1].toLowerCase();
      const hits = this.multi[term] || [];
      return {
        json: hits.filter(h => (h.mediaType === 'movie' && body.movies) || (h.mediaType === 'tv' && body.tvShows)),
      };
    }
    if (method === 'GET' && (m = path.match(/^\/api\/v2\/search\/Movie\/(\d+)$/))) {
      const movie = this.movies[+m[1]];
      return movie ? { json: movie } : { status: 404, json: {} };
    }
    if (method === 'GET' && (m = path.match(/^\/api\/v2\/search\/Tv\/(\d+)$/))) {
      const show = this.shows[+m[1]];
      return show ? { json: show } : { status: 404, json: {} };
    }
    if (method === 'GET' && (m = path.match(/^\/api\/v2\/Requests\/(movie|tv)\/20\/0\/requestedDate\/desc$/))) {
      return { json: data.requestsPage(m[1] === 'movie' ? this.movieRequests : this.tvRequests) };
    }
    if (method === 'POST' && path === '/api/v1/Request/Movie') {
      const movie = this.movies[body.theMovieDbId];
      if (movie) {
        Object.assign(movie, { requested: true, approved: true, requestId: 900 });
      }
      return { json: { result: true, message: 'Request added', isError: false, errorMessage: null, requestId: 900 } };
    }
    if (method === 'POST' && path === '/api/v2/Requests/TV') {
      const show = this.shows[body.theMovieDbId];
      if (show) {
        Object.assign(show, { requested: true, approved: true, requestId: 901 });
      }
      return { json: { result: true, message: 'Request added', isError: false, errorMessage: null, requestId: 901 } };
    }
    if ((m = path.match(/^\/api\/v1\/Request\/(movie|tv)\/(approve|deny)$/))) {
      if ((m[2] === 'approve' && method !== 'POST') || (m[2] === 'deny' && method !== 'PUT')) {
        return { status: 405, json: {} };
      }
      const list = m[1] === 'movie' ? this.movieRequests : this.tvRequests;
      const req = list.find(r => r.id === body.id);
      if (!req) {
        return { status: 404, json: {} };
      }
      Object.assign(req, m[2] === 'approve' ? { approved: true } : { denied: true });
      return { json: { result: true, message: null, isError: false, errorMessage: null } };
    }
    return { status: 404, json: { error: `No mock for ${method} ${call.path}` } };
  }
}

const parseBody = (request: Request): unknown => {
  const raw = request.postData();
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const statusText = (status: number) => STATUS_TEXT[status] || '';
