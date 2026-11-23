import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Settings } from 'src/models/settings';
import { ToastType } from 'src/models/toast';
import { FakeRouter, FakeToastService, flushPromises } from 'src/testing/test-helpers';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { CredentialsService } from './credentials.service';
import { SettingsService } from './settings.service';
import { ToastService } from './toast.service';

class FakeCredentials {
  baseUrl = 'https://ombi.test';
  token = 'TOKEN';
  username = 'bob';
  password = 'pw';
}

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;
  let creds: FakeCredentials;
  let toast: FakeToastService;
  let router: FakeRouter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CredentialsService, useClass: FakeCredentials },
        { provide: ToastService, useClass: FakeToastService },
        { provide: Router, useClass: FakeRouter },
      ],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
    creds = TestBed.inject(CredentialsService) as unknown as FakeCredentials;
    toast = TestBed.inject(ToastService) as unknown as FakeToastService;
    router = TestBed.inject(Router) as unknown as FakeRouter;
  });

  afterEach(() => http.verify());

  it('GET: v2 by default, query string from parameters, JSON + bearer headers', async () => {
    const result = api.get('/search/Movie/1', { 'X-Extra': 'yes' }, { a: 1, b: true });
    const req = http.expectOne('https://ombi.test/api/v2/search/Movie/1?a=1&b=true');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer TOKEN');
    expect(req.request.headers.get('X-Extra')).toBe('yes');
    req.flush({ id: 1 });
    expect(await result).toEqual({ id: 1 });
  });

  it('GET without parameters keeps the trailing "?"', () => {
    api.get('/Settings/Authentication', {}, {}, undefined, '1');
    const req = http.expectOne('https://ombi.test/api/v1/Settings/Authentication?');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('POST / PUT send the parameters as JSON body; custom base URL replaces the API root', async () => {
    api.post('/token', {}, { username: 'u' }, null as any, '1');
    const post = http.expectOne('https://ombi.test/api/v1/token');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ username: 'u' });
    post.flush({});

    api.put('/Request/movie/deny', {}, { id: 3 }, undefined, '1');
    const put = http.expectOne('https://ombi.test/api/v1/Request/movie/deny');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ id: 3 });
    put.flush({});

    api.post('/api/v2/pins?strong=true', { 'X-Plex-Product': 'Ombi' }, {}, 'https://plex.tv');
    const plex = http.expectOne('https://plex.tv/api/v2/pins?strong=true');
    expect(plex.request.headers.get('X-Plex-Product')).toBe('Ombi');
    plex.flush({});

    api.delete('/thing', {});
    const del = http.expectOne('https://ombi.test/api/v2/thing');
    expect(del.request.method).toBe('DELETE');
    del.flush({});
  });

  it('401 clears the token, navigates to config and warns', async () => {
    const result = api.get('/x', {}, {});
    http.expectOne(r => r.url.endsWith('/x?')).flush({}, { status: 401, statusText: 'Unauthorized' });
    await expect_rejects(result);
    expect(creds.token).toBe('');
    expect(router.navigate.lastArgs()).toEqual([['config']]);
    expect(toast.show.lastArgs()).toEqual([ToastType.WARNING, 'You have been signed out.']);
  });

  it('other errors show a status toast (error for >= 400) and reject', async () => {
    const result = api.post('/x', {}, {});
    http.expectOne(r => r.url.endsWith('/x')).flush({}, { status: 500, statusText: 'Internal Server Error' });
    const err = await expect_rejects(result);
    expect(err instanceof Error).toBe(true);
    expect(toast.show.lastArgs()).toEqual([ToastType.ERROR, '500 - Internal Server Error']);
    expect(router.navigate.calls.length).toBe(0);
    expect(creds.token).toBe('TOKEN');
  });

  it('network errors (status 0) show a warning toast', async () => {
    const result = api.get('/x', {}, {});
    http.expectOne(r => r.url.endsWith('/x?')).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await expect_rejects(result);
    expect(toast.show.lastArgs()).toEqual([ToastType.WARNING, '0 - Unknown Error']);
  });

  it('showError=false suppresses the toast', async () => {
    const result = api.get('/x', {}, {}, undefined, '1', false);
    http.expectOne(r => r.url.endsWith('/x?')).flush({}, { status: 404, statusText: 'Not Found' });
    await expect_rejects(result);
    expect(toast.show.calls.length).toBe(0);
  });
});

describe('AuthService', () => {
  let http: HttpTestingController;
  let creds: CredentialsService;
  let settings: SettingsService;
  let router: FakeRouter;

  const PROBE = '/api/v1/Settings/Authentication?';

  const setup = (stored: Record<string, unknown>) => {
    localStorage.clear();
    localStorage.setItem('settings', JSON.stringify(stored));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ToastService, useClass: FakeToastService },
        { provide: Router, useClass: FakeRouter },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    settings = TestBed.inject(SettingsService);
    creds = TestBed.inject(CredentialsService);
    http.expectOne('/assets/settings/predefined-host.txt').flush('');
    router = TestBed.inject(Router) as unknown as FakeRouter;
  };

  afterEach(() => http.verify());

  it('probes a URL with protocol once and stores validity and OAuth support', async () => {
    setup({ [Settings.BASE_URL]: 'https://ombi.test' });
    TestBed.inject(AuthService);
    http.expectOne('https://ombi.test' + PROBE).flush({ enableOAuth: true });
    await flushPromises();
    expect(settings.get(Settings.URL_IS_VALID)).toBe(true);
    expect(settings.get(Settings.URL_HAS_OAUTH)).toBe(true);
  });

  it('marks the URL invalid when the probe fails (no toast)', async () => {
    setup({ [Settings.BASE_URL]: 'https://ombi.test' });
    TestBed.inject(AuthService);
    http.expectOne('https://ombi.test' + PROBE).flush({}, { status: 404, statusText: 'Not Found' });
    await flushPromises();
    expect(settings.get(Settings.URL_IS_VALID)).toBe(false);
    expect((TestBed.inject(ToastService) as unknown as FakeToastService).show.calls.length).toBe(0);
  });

  /** Answers every pending probe for `origin` (the app sometimes probes the same URL twice). */
  const answerProbes = (origin: string, respond: 'fail' | object) => {
    const reqs = http.match(origin + PROBE);
    expect(reqs.length).toBeGreaterThan(0);
    reqs.forEach(r => (respond === 'fail' ? r.error(new ProgressEvent('error')) : r.flush(respond)));
  };

  it('without protocol tries https first, then http', async () => {
    setup({ [Settings.BASE_URL]: 'ombi.test' });
    TestBed.inject(AuthService);
    answerProbes('https://ombi.test', 'fail');
    await flushPromises();
    // Switching to http:// emits a base URL change, which probes again (existing behaviour).
    answerProbes('http://ombi.test', { enableOAuth: false });
    await flushPromises();
    expect(creds.baseUrl).toBe('http://ombi.test');
    expect(settings.get(Settings.URL_IS_VALID)).toBe(true);
    expect(settings.get(Settings.URL_HAS_OAUTH)).toBe(false);
  });

  it('without protocol and both probes failing restores the typed URL and marks it invalid', async () => {
    setup({ [Settings.BASE_URL]: 'ombi.test' });
    TestBed.inject(AuthService);
    answerProbes('https://ombi.test', 'fail');
    await flushPromises();
    answerProbes('http://ombi.test', 'fail');
    await flushPromises();
    expect(settings.get(Settings.URL_IS_VALID)).toBe(false);
    // Restoring the typed URL emits a base URL change and starts the next probe round
    // (existing behaviour); stop here and discard it.
    http.match(() => true);
  });

  it('re-probes when the base URL changes', async () => {
    setup({ [Settings.BASE_URL]: 'https://ombi.test' });
    TestBed.inject(AuthService);
    http.expectOne('https://ombi.test' + PROBE).flush({});
    creds.baseUrl = 'https://other.test';
    http.expectOne('https://other.test' + PROBE).flush({ enableOAuth: true });
    await flushPromises();
    expect(settings.get(Settings.URL_HAS_OAUTH)).toBe(true);
  });

  it('fetchToken rejects without credentials and without calling the API', async () => {
    setup({ [Settings.BASE_URL]: 'https://ombi.test' });
    const auth = TestBed.inject(AuthService);
    http.expectOne('https://ombi.test' + PROBE).flush({});
    expect(await expect_rejects(auth.fetchToken())).toBe(false);
  });

  it('fetchToken posts the credentials, stores the token and navigates', async () => {
    setup({ [Settings.BASE_URL]: 'https://ombi.test', [Settings.USERNAME]: 'bob', [Settings.PASSWORD]: 'pw' });
    const auth = TestBed.inject(AuthService);
    http.expectOne('https://ombi.test' + PROBE).flush({});
    const done = auth.fetchToken();
    const req = http.expectOne('https://ombi.test/api/v1/token');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'bob', password: 'pw', rememberMe: true, usePlexOAuth: false });
    // header.payload.signature with sub=bob
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJib2IiLCJyb2xlIjpbXX0.c2ln';
    req.flush({ access_token: token });
    await done;
    expect(creds.token).toBe(token);
    expect(settings.get(Settings.IS_SIGNED_IN)).toBe(true);
    expect(settings.get(Settings.USE_PLEX_OAUTH)).toBe(false);
    expect(router.navigate.lastArgs()).toEqual([['search']]);
  });
});

/** Awaits a promise that must reject and returns the rejection reason. */
async function expect_rejects(p: Promise<unknown>): Promise<any> {
  try {
    await p;
  } catch (e) {
    return e;
  }
  throw new Error('expected promise to reject');
}
