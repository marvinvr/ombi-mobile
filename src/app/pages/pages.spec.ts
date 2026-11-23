import { LocationStrategy } from '@angular/common';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { RequestStatus } from 'src/models/content';
import { RequestAction, RequestType } from 'src/models/requests';
import { Settings } from 'src/models/settings';
import { ToastType } from 'src/models/toast';
import { AuthService } from 'src/services/auth.service';
import { CredentialsService } from 'src/services/credentials.service';
import { MovieService } from 'src/services/movie.service';
import { RequestsService } from 'src/services/requests.service';
import { SearchService } from 'src/services/search.service';
import { SettingsService } from 'src/services/settings.service';
import { ToastService } from 'src/services/toast.service';
import { TvService } from 'src/services/tv.service';
import { FakeRouter, FakeToastService, flushPromises, spyFn } from 'src/testing/test-helpers';
import { ConfigComponent } from './config/config.component';
import { ContentComponent } from './content/content.component';
import { RequestsComponent } from './requests/requests.component';
import { SearchPageComponent } from './search/search-page.component';

/**
 * Page logic is tested on plain instances (dependencies from TestBed): lifecycle hooks are
 * called explicitly, independent of the TestBed change detection mode. Rendering and
 * integration are covered by the e2e suite.
 */
const construct = <T>(factory: () => T): T => TestBed.runInInjectionContext(factory);

const rawMovie = (over: object = {}) => ({
  mediaType: 'movie', id: 603, title: 'M', description: 'd', posterUrl: 'p', genres: [], available: false,
  releaseDate: new Date('1999-01-01T00:00:00'), request: { id: 0, requested: false, approved: false, denied: false }, ...over,
});

describe('ContentComponent', () => {
  let params: BehaviorSubject<any>;
  let movieGet: ReturnType<typeof spyFn>;
  let requests: { requestMovie: ReturnType<typeof spyFn>; requestTv: ReturnType<typeof spyFn> };
  let autoApprove = false;
  let router: FakeRouter;

  const create = () => {
    params = new BehaviorSubject(convertToParamMap({ type: 'movie', id: '603' }));
    movieGet = spyFn(() => Promise.resolve(rawMovie()));
    requests = { requestMovie: spyFn(() => Promise.resolve()), requestTv: spyFn(() => Promise.resolve()) };
    router = new FakeRouter();
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: Router, useValue: router },
        { provide: MovieService, useValue: { get: (...a: any[]) => movieGet(...a) } },
        { provide: TvService, useValue: { get: spyFn(() => Promise.resolve({ ...rawMovie(), mediaType: 'tv', partlyAvailable: false })) } },
        { provide: RequestsService, useValue: requests },
        { provide: CredentialsService, useValue: { hasAutoApprove: () => autoApprove } },
        { provide: LocationStrategy, useValue: { back: spyFn() } },
      ],
    });
    const c = construct(() => new ContentComponent(
      TestBed.inject(RequestsService), TestBed.inject(ActivatedRoute), TestBed.inject(Router), TestBed.inject(MovieService),
      TestBed.inject(TvService), TestBed.inject(CredentialsService), TestBed.inject(LocationStrategy)));
    c.ngOnInit();
    return c;
  };

  it('loads the content from the route and derives label/colour/icons', async () => {
    const c = create();
    expect(c.isLoading).toBe(true);
    await flushPromises();
    expect(c.isLoading).toBe(false);
    expect(movieGet.calls[0]).toEqual(['603', false]);
    expect([c.label, c.color, c.fabIcon, c.icon, c.contentName]).toEqual(['', 'success', 'download-outline', 'film', 'Movie']);

    const states: Array<[object, string[]]> = [
      [{ available: true }, ['Available', 'success', 'checkmark']],
      [{ approved: true }, ['Approved', 'secondary', 'cloud-download-outline']],
      [{ denied: true }, ['Denied', 'danger', 'close-outline']],
      [{ requested: true }, ['Requested', 'warning', 'person-outline']],
    ];
    for (const [state, expected] of states) {
      c.content = { ...rawMovie(), ...state, type: RequestType.MOVIE } as any;
      expect([c.label, c.color, c.fabIcon]).toEqual(expected);
    }
  });

  it('request(): optimistic state, auto-approve and rollback on failure', async () => {
    autoApprove = true;
    const c = create();
    await flushPromises();
    requests.requestMovie = spyFn(() => Promise.reject(new Error('x')));
    c.request();
    expect(c.content.requested).toBe(true);
    expect(c.content.approved).toBe(true);
    await flushPromises();
    expect(c.content.requested).toBe(false);
    expect(c.content.approved).toBe(false);
    autoApprove = false;
  });

  it('marks pages reached via /request/... as requests', async () => {
    const c = create();
    router.url = '/request/movie/603';
    params.next(convertToParamMap({ type: 'movie', id: '603' }));
    await flushPromises();
    expect(c.isRequest).toBe(true);
  });
});

describe('RequestsComponent', () => {
  const raw = (id: number, type: string, flags: object, user: object = { name: 'al', email: 'al@x' }) => ({
    mediaType: type, id, title: `t${id}`, description: '', date: new Date(), request: { id: id * 10, date: `2026-01-0${id}`, approved: false, denied: false, available: false, user, ...flags },
  });

  const create = (performAction = spyFn(() => Promise.resolve())) => {
    const list = spyFn((type: RequestType) =>
      Promise.resolve(type === RequestType.MOVIE
        ? [raw(1, 'movie', {}), raw(2, 'movie', { approved: true }, { name: '', email: 'e@x' })]
        : [raw(3, 'tv', { denied: true }), raw(4, 'tv', { available: true })]));
    TestBed.configureTestingModule({
      providers: [
        { provide: RequestsService, useValue: { list, performAction } },
        { provide: Router, useClass: FakeRouter },
      ],
    });
    const c = construct(() => new RequestsComponent(TestBed.inject(RequestsService), TestBed.inject(Router)));
    return { c, list, performAction };
  };

  it('loads both lists, derives status and requester, sorts open first', async () => {
    const { c } = create();
    c.ngOnInit();
    await flushPromises();
    expect(c.contentList.map(i => [i.id, i.status, i.requestedBy])).toEqual([
      [1, RequestStatus.OPEN, 'al'],
      [4, RequestStatus.AVAILABLE, 'al'],
      [3, RequestStatus.DENIED, 'al'],
      [2, RequestStatus.APPROVED, 'e@x'],
    ] as any);
    expect(c.disableButtons(c.contentList[0])).toBe(false);
    expect(c.disableButtons(c.contentList[1])).toBe(true);
  });

  it('segment change only loads the selected type', async () => {
    const { c, list } = create();
    c.segmentChange({ detail: { value: 'tv' } });
    await flushPromises();
    expect(list.calls.map(a => a[0])).toEqual([RequestType.TV]);
    expect(c.contentList.every(i => i.mediaType === 'tv')).toBe(true);
  });

  it('approve/deny update optimistically, call the API and roll back on failure', async () => {
    const { c, performAction } = create(spyFn(() => Promise.reject(new Error('x'))));
    c.ngOnInit();
    await flushPromises();
    const item = c.contentList[0];
    const stop = spyFn();
    c.approve(item, { stopPropagation: stop } as any);
    expect(item.status).toBe(RequestStatus.APPROVED);
    expect(performAction.lastArgs()).toEqual([RequestAction.APPROVE, 'movie', 10]);
    expect(stop.calls.length).toBe(1);
    await flushPromises();
    expect(item.status).toBe(RequestStatus.OPEN);

    c.deny(item, undefined as any);
    expect(item.status).toBe(RequestStatus.DENIED);
    expect(performAction.lastArgs()).toEqual([RequestAction.DENY, 'movie', 10]);
  });

  it('opens the request detail page', () => {
    const { c } = create();
    c.showContent({ mediaType: 'tv', id: '1396' } as any);
    expect((TestBed.inject(Router) as unknown as FakeRouter).navigate.lastArgs()).toEqual([['request', 'tv', '1396']]);
  });
});

describe('SearchPageComponent', () => {
  const create = () => {
    const search = {
      getPopular: spyFn((type: string, force = false) => Promise.resolve([{ title: `popular-${type}` }])),
      search: spyFn((term: string, type: string) => Promise.resolve([{ title: `${term}-${type}` }])),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: SearchService, useValue: search }, { provide: Router, useClass: FakeRouter }],
    });
    return { c: construct(() => new SearchPageComponent(TestBed.inject(SearchService), TestBed.inject(Router))), search };
  };

  it('shows popular content, searches on input and goes back to popular when cleared', async () => {
    const { c, search } = create();
    c.ngOnInit();
    await flushPromises();
    expect(c.items.map((i: any) => i.title)).toEqual(['popular-all']);
    c.searchChange('matrix');
    await flushPromises();
    expect(c.items.map((i: any) => i.title)).toEqual(['matrix-all']);
    c.segmentChange({ detail: { value: 'movie' } });
    await flushPromises();
    expect(search.search.lastArgs()).toEqual(['matrix', 'movie']);
    c.searchChange('');
    await flushPromises();
    expect(search.getPopular.lastArgs()).toEqual(['movie', false]);
    // non-string events (e.g. raw DOM events) are ignored
    c.searchChange({} as any);
    expect(search.getPopular.calls.length).toBe(2);
  });

  it('pull-to-refresh forces a reload and completes the refresher', async () => {
    const { c, search } = create();
    const complete = spyFn();
    c.refresh({ target: { complete } });
    await flushPromises();
    expect(search.getPopular.lastArgs()).toEqual(['all', true]);
    expect(complete.calls.length).toBe(1);
  });

  it('opens the detail page', () => {
    const { c } = create();
    c.showContent({ mediaType: 'movie', id: '603' } as any);
    expect((TestBed.inject(Router) as unknown as FakeRouter).navigate.lastArgs()).toEqual([['movie', '603']]);
  });
});

describe('ConfigComponent', () => {
  let creds: Record<string, any>;
  let settings: { values: Record<string, unknown>; change: Subject<unknown>; get: (k: string) => unknown };
  let auth: { fetchToken: ReturnType<typeof spyFn>; triggerPlexOauth: ReturnType<typeof spyFn>; updateAuthConfig: ReturnType<typeof spyFn> };
  let toast: FakeToastService;
  let router: FakeRouter;

  const create = () => {
    creds = { baseUrl: 'https://ombi.test', username: 'bob', password: 'pw', token: 'old', name: 'bob' };
    settings = { values: { [Settings.URL_IS_VALID]: true, [Settings.URL_HAS_OAUTH]: false }, change: new Subject(), get: (k: string) => settings.values[k] };
    auth = { fetchToken: spyFn(() => Promise.resolve()), triggerPlexOauth: spyFn(() => Promise.resolve()), updateAuthConfig: spyFn() };
    toast = new FakeToastService();
    router = new FakeRouter();
    TestBed.configureTestingModule({
      providers: [
        { provide: CredentialsService, useValue: creds },
        { provide: SettingsService, useValue: settings },
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
      ],
    });
    const c = construct(() => new ConfigComponent(
      TestBed.inject(CredentialsService), TestBed.inject(AuthService), TestBed.inject(ToastService), TestBed.inject(SettingsService), TestBed.inject(Router)));
    c.ngOnInit();
    return c;
  };

  it('initialises the model from the stored credentials and follows settings changes', () => {
    const c = create();
    expect(c.model).toEqual({ ombiUrl: 'https://ombi.test', username: 'bob', password: 'pw' });
    expect([c.validUrl, c.hasOauth, c.hasBaseUrl, c.hasCredentials]).toEqual([true, false, true, true]);
    settings.values[Settings.URL_HAS_OAUTH] = true;
    settings.change.next(null);
    expect(c.hasOauth).toBe(true);
    c.model.password = '';
    expect(c.hasCredentials).toBe(false);
    expect(c.prettifyUrl('https://a.test')).toBe('a.test');
    expect(c.prettifyUrl(undefined)).toBe('');
  });

  it('submit stores credentials, resets the token and navigates on success', async () => {
    const c = create();
    c.model.username = 'alice';
    c.submit();
    expect(creds.username).toBe('alice');
    expect(creds.token).toBe('');
    await flushPromises();
    expect(toast.show.lastArgs()).toEqual([ToastType.SUCCESS, 'Signed in as bob!']);
    expect(router.navigate.lastArgs()).toEqual([['search']]);
  });

  it('submit / Plex failures show an error toast', async () => {
    const c = create();
    auth.fetchToken = spyFn(() => Promise.reject(false));
    auth.triggerPlexOauth = spyFn(() => Promise.reject(false));
    c.submit();
    await flushPromises();
    expect(toast.show.lastArgs()).toEqual([ToastType.ERROR, 'Unable to sign in with these credentials']);
    c.submitWithPlex();
    await flushPromises();
    expect(toast.show.lastArgs()).toEqual([ToastType.ERROR, 'Unable to sign in with Plex']);
  });

  it('debounces URL changes by 300ms before applying and probing', fakeAsync(() => {
    const c = create();
    c.model.ombiUrl = 'a';
    c.baseUrlChange();
    tick(100);
    c.model.ombiUrl = 'ombi.other';
    c.baseUrlChange();
    tick(299);
    expect(auth.updateAuthConfig.calls.length).toBe(0);
    tick(1);
    expect(creds.baseUrl).toBe('ombi.other');
    expect(auth.updateAuthConfig.calls.length).toBe(1);
  }));
});
