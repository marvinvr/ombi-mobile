import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { IONIC_COMPONENTS, registerIcons } from '../ionic';
import { Subject } from 'rxjs';
import { RequestStatus } from 'src/models/content';
import { Settings } from 'src/models/settings';
import { SettingsService } from 'src/services/settings.service';
import { FakeRouter, spyFn } from 'src/testing/test-helpers';
import { ButtonComponent } from './button/button.component';
import { ContentRowComponent } from './content-row/content-row.component';
import { MovieContent } from './content-row/content-types/movie-row';
import { RequestContent } from './content-row/content-types/request-row';
import { TvContent } from './content-row/content-types/tv-row';
import { HeaderComponent } from './header/header.component';
import { InputComponent } from './input/input.component';
import { ListRemarkComponent } from './list-remark/list-remark.component';
import { NavigationComponent } from './navigation/navigation.component';
import { SearchComponent } from './search/search.component';

describe('base components', () => {
  beforeEach(() => {
    registerIcons();
    TestBed.configureTestingModule({
      imports: [...IONIC_COMPONENTS],
      providers: [provideIonicAngular()],
      declarations: [ButtonComponent, ContentRowComponent, HeaderComponent, InputComponent, ListRemarkComponent, NavigationComponent, SearchComponent],
    });
  });

  describe('ButtonComponent', () => {
    it('renders the label and emits action without propagating the click', () => {
      const fixture = TestBed.createComponent(ButtonComponent);
      fixture.componentInstance.label = 'Approve';
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent!.trim()).toBe('Approve');
      let emitted = 0;
      fixture.componentInstance.action.subscribe(() => emitted++);
      const stop = spyFn();
      fixture.componentInstance.handleClick({ stopPropagation: stop });
      expect(emitted).toBe(1);
      expect(stop.calls.length).toBe(1);
      fixture.componentInstance.handleClick(undefined);
      expect(emitted).toBe(2);
    });
  });

  describe('HeaderComponent / ListRemarkComponent', () => {
    it('renders the title', () => {
      const fixture = TestBed.createComponent(HeaderComponent);
      fixture.componentInstance.title = 'Discover';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Discover');
    });

    it('list remark wraps its content in a paragraph', () => {
      const fixture = TestBed.createComponent(ListRemarkComponent);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('p')).toBeTruthy();
    });
  });

  describe('InputComponent', () => {
    it('updates its value and emits valueChange from ionInput', () => {
      const fixture = TestBed.createComponent(InputComponent);
      const values: string[] = [];
      fixture.componentInstance.valueChange.subscribe(v => values.push(v));
      fixture.componentInstance.updateValue({ detail: { value: 'abc' } });
      expect(fixture.componentInstance.value).toBe('abc');
      expect(values).toEqual(['abc']);
    });
  });

  describe('SearchComponent', () => {
    it('debounces ionChange by 400ms and emits only the last value', fakeAsync(() => {
      const search = new SearchComponent();
      const values: string[] = [];
      search.valueChange.subscribe(v => values.push(v));
      search.updateValue({ detail: { value: 'ma' } });
      tick(200);
      search.updateValue({ detail: { value: 'matrix' } });
      tick(399);
      expect(values).toEqual([]);
      tick(1);
      expect(values).toEqual(['matrix']);
    }));
  });

  describe('ContentRowComponent', () => {
    let fixture: ComponentFixture<ContentRowComponent>;
    const content = (over: object = {}) => ({ mediaType: 'movie', id: '1', title: 'T', description: 'short text', ...over }) as any;

    beforeEach(() => {
      fixture = TestBed.createComponent(ContentRowComponent);
    });

    it('maps request status to badge colours', () => {
      const c = fixture.componentInstance;
      const colorOf = (status?: RequestStatus) => {
        c.content = content({ status });
        return c.color;
      };
      expect(colorOf(RequestStatus.APPROVED)).toBe('secondary');
      expect(colorOf(RequestStatus.DENIED)).toBe('danger');
      expect(colorOf(RequestStatus.AVAILABLE)).toBe('success');
      expect(colorOf(RequestStatus.OPEN)).toBe('primary');
      expect(colorOf(undefined)).toBeUndefined();
    });

    it('formats descriptions: placeholder, 70 word limit, passthrough', () => {
      const c = fixture.componentInstance;
      c.content = content({ description: '' });
      expect(c.description).toBe('<i>No description avaliable</i>');
      const words = Array.from({ length: 71 }, (_, i) => `w${i}`);
      c.content = content({ description: words.join(' ') });
      expect(c.description).toBe(words.slice(0, 70).join(' ') + '<b>...</b>');
      c.content = content({ description: 'short text' });
      expect(c.description).toBe('short text');
    });

    it('renders title, type, requester and swaps broken posters for the backdrop', () => {
      fixture.componentInstance.content = content({ mediaType: 'tv', requestedBy: 'alice', status: RequestStatus.OPEN });
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('ion-card-title')!.textContent).toBe('T');
      expect(el.querySelector('ion-card-subtitle')!.textContent).toBe('TV requested by alice');
      expect(el.querySelector('ion-badge')!.textContent).toBe('Open');
      expect((el.querySelector('.poster-backdrop ion-icon') as any).name).toBe('tv-outline');
      const target = { src: 'x' };
      fixture.componentInstance.onError({ target });
      expect(target.src).toBe('/assets/backdrop.png');
    });
  });

  describe('NavigationComponent', () => {
    let settings: { values: Record<string, unknown>; change: Subject<unknown>; get: (k: string) => unknown };
    let router: FakeRouter;

    const create = (values: Record<string, unknown>) => {
      settings = { values, change: new Subject(), get: (k: string) => settings.values[k] };
      router = new FakeRouter();
      // Logic only: the template (ion-tabs) needs a real router outlet, which the e2e suite covers.
      const nav = new NavigationComponent(settings as unknown as SettingsService, router as unknown as Router);
      nav.ngOnInit();
      return nav;
    };

    it('signed out: only Config, navigates to config', () => {
      const nav = create({});
      expect(nav.tabs.map(t => t.id)).toEqual(['config']);
      expect(router.navigate.lastArgs()).toEqual([['config']]);
    });

    it('signed in user: Search + Config, navigates to search', () => {
      const nav = create({ [Settings.IS_SIGNED_IN]: true });
      expect(nav.tabs.map(t => t.id)).toEqual(['search', 'config']);
      expect(router.navigate.lastArgs()).toEqual([['search']]);
    });

    it('admin or power user: Search, Requests, Config without navigating; reacts to changes', () => {
      const nav = create({ [Settings.IS_SIGNED_IN]: true, [Settings.CAN_APPROVE_REQUESTS]: true });
      expect(nav.tabs.map(t => t.label)).toEqual(['Search', 'Requests', 'Config']);
      expect(nav.tabs.map(t => t.icon)).toEqual(['search-outline', 'download-outline', 'cog-outline']);
      expect(router.navigate.calls.length).toBe(0);
      settings.values = {};
      settings.change.next(null);
      expect(nav.tabs.map(t => t.id)).toEqual(['config']);
    });
  });
});

describe('content row models', () => {
  const movie = (request: object = {}) =>
    new MovieContent({
      mediaType: 'movie', id: 603, title: 'M', description: 'd', posterUrl: 'p', genres: ['A'], available: false, rating: 8,
      releaseDate: new Date('1999-03-30T00:00:00'), request: { id: 1, requested: false, approved: false, denied: false, ...request },
    } as any);

  it('MovieContent exposes the movie and can be marked requested/approved', () => {
    const m = movie();
    expect([m.id, m.title, m.description, m.posterUrl, m.releaseYear, m.type]).toEqual([603, 'M', 'd', 'p', 1999, 'movie' as any]);
    expect(m.genres).toEqual(['A']);
    m.requested = true;
    m.approved = true;
    expect(m.requested).toBe(true);
    expect(m.approved).toBe(true);
    m.disable();
    expect(m.requested).toBe(true);
  });

  it('TvContent exposes the show', () => {
    const t = new TvContent({
      mediaType: 'tv', id: 1, title: 'T', description: 'd', posterUrl: 'p', genres: [], available: true, partlyAvailable: true,
      releaseDate: new Date('2008-01-20T00:00:00'), request: { id: 1, requested: true, approved: false, denied: true },
    } as any);
    expect([t.type, t.releaseYear, t.available, t.partlyAvailable, t.denied, t.requested]).toEqual(['tv' as any, 2008, true, true, true, true]);
  });

  it('RequestContent builds buttons from the request state', () => {
    const build = (request: object) =>
      new RequestContent({
        id: 1, title: 'R', type: 'movie', posterUrl: 'x.jpg', releaseDate: new Date('2020-01-01T00:00:00'), genres: [],
        request: { id: 9, approved: false, denied: false, user: { name: 'al' }, ...request },
      } as any);
    expect(build({}).buttons.map(b => b.label)).toEqual(['Deny', 'Approve']);
    expect(build({ approved: true }).buttons).toEqual([{ label: 'Approved', color: 'success', action: undefined, disabled: true } as any]);
    expect(build({ denied: true }).buttons[0].label).toBe('Denied');
    const r = build({});
    expect(r.posterUrl).toBe('https://image.tmdb.org/t/p/w300//x.jpg');
    expect(r.requestId).toBe(9);
    expect(r.description).toContain('<i>al</i>');
    r.approve();
    expect(r.approved).toBe(true);
    r.deny();
    expect(r.denied).toBe(true);
  });
});
