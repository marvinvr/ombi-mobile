import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { RequestAction, RequestType } from 'src/models/requests';
import { ToastType } from 'src/models/toast';
import { FakeRouter, FakeToastService, flushPromises, spyFn } from 'src/testing/test-helpers';
import { CredentialsService } from './credentials.service';
import { MovieService } from './movie.service';
import { RequestsService } from './requests.service';
import { SearchService } from './search.service';
import { ToastService } from './toast.service';
import { TvService } from './tv.service';

const API = 'https://ombi.test/api';

describe('content services', () => {
  let http: HttpTestingController;
  let toast: FakeToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CredentialsService, useValue: { baseUrl: 'https://ombi.test', token: 'T' } },
        { provide: ToastService, useClass: FakeToastService },
        { provide: Router, useClass: FakeRouter },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService) as unknown as FakeToastService;
  });

  afterEach(() => http.verify());

  describe('MovieService', () => {
    const raw = {
      id: 603, title: 'The Matrix', overview: 'Neo', posterPath: '/m.jpg', requestId: 5, requested: true,
      approved: false, denied: false, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], releaseDate: '1999-03-30T00:00:00',
      available: false, voteAverage: 8.24,
    };

    it('loads and maps movie details, then serves them from cache', async () => {
      const service = TestBed.inject(MovieService);
      const first = service.get('603');
      http.expectOne(`${API}/v2/search/Movie/603?`).flush(raw);
      const movie = await first;
      expect(movie).toEqual(withFields({
        mediaType: 'movie', id: 603, title: 'The Matrix', description: 'Neo',
        posterUrl: 'https://image.tmdb.org/t/p/w300//m.jpg',
        request: { id: 5, requested: true, approved: false, denied: false },
        genres: ['Action', 'Sci-Fi'], available: false, rating: 8,
      }, movie));
      expect(movie.releaseDate!.getFullYear()).toBe(1999);

      expect(await service.get('603')).toBe(movie); // cached, no request
      const forced = service.get('603', true);
      http.expectOne(`${API}/v2/search/Movie/603?`).flush(raw);
      expect((await forced).id).toBe(603);
    });

    it('maps and caches popular movies', async () => {
      const service = TestBed.inject(MovieService);
      const p = service.getPopular();
      http.expectOne(`${API}/v2/search/Movie/popular/0/20?`).flush([{ id: 1, title: 'A', overview: 'a', posterPath: null, voteAverage: 6.6 }]);
      expect(await p).toEqual([{ mediaType: 'movie', id: 1 as any, title: 'A', description: 'a', posterUrl: '/assets/backdrop.png', rating: 7 }]);
      await service.getPopular();
      const forced = service.getPopular(true);
      http.expectOne(`${API}/v2/search/Movie/popular/0/20?`).flush([]);
      expect(await forced).toEqual([]);
    });
  });

  describe('TvService', () => {
    it('loads and maps TV details (v2) and caches them', async () => {
      const service = TestBed.inject(TvService);
      const p = service.get('1396');
      http.expectOne(`${API}/v2/search/Tv/1396?`).flush({
        id: 1396, title: 'Breaking Bad', overview: 'Walt', images: { original: 'https://img.test/bb.jpg' }, requestId: 0,
        requested: false, approved: false, denied: false, requestAll: true, firstSeason: false, latestSeason: true,
        seasonRequests: [1], genres: [{ name: 'Drama' }], network: 'AMC', status: 'Ended', firstAired: '2008-01-20T00:00:00',
        available: false, partlyAvailable: true, rating: 8.9,
      });
      const show = await p;
      expect(show.mediaType).toBe('tv');
      expect(show.posterUrl).toBe('https://img.test/bb.jpg');
      expect(show.request).toEqual({ id: 0, requested: false, approved: false, denied: false, type: { all: true, firstSeason: false, latestSeason: true }, seasons: [1] });
      expect(show.genres).toEqual(['Drama']);
      expect(show.partlyAvailable).toBe(true);
      expect(show.rating).toBe(9);
      expect(show.releaseDate!.getFullYear()).toBe(2008);
      expect(service.shows['1396']).toBe(show);
      expect(await service.get('1396')).toBe(show);
    });

    it('maps trending shows using the backdrop as poster', async () => {
      const service = TestBed.inject(TvService);
      const p = service.getPopular();
      http.expectOne(`${API}/v2/search/Tv/trending/0/15?`).flush([{ id: 2, title: 'B', overview: 'b', backdropPath: '/b.jpg', rating: 7.4 }]);
      expect(await p).toEqual([{ mediaType: 'tv', id: 2 as any, title: 'B', description: 'b', posterUrl: 'https://image.tmdb.org/t/p/w300//b.jpg', rating: 7 }]);
    });
  });

  describe('SearchService', () => {
    it('posts the multi search with type flags and maps results', async () => {
      const service = TestBed.inject(SearchService);
      const p = service.search('matrix', 'movie');
      const req = http.expectOne(`${API}/v2/search/multi/matrix`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ music: false, people: false, movies: true, tvShows: false });
      req.flush([
        { id: 1, mediaType: 'movie', title: 'M', overview: 'o', poster: 'p.jpg' },
        { id: 2, mediaType: 'tv', title: 'T', overview: '', poster: null },
      ]);
      expect(await p).toEqual([
        { mediaType: 'movie', id: 1 as any, title: 'M', description: 'o', posterUrl: 'https://image.tmdb.org/t/p/w300/p.jpg' },
        { mediaType: 'tv', id: 2 as any, title: 'T', description: '', posterUrl: '/assets/backdrop.png' },
      ]);
    });

    it('combines popular movies and trending TV depending on the type', async () => {
      const service = TestBed.inject(SearchService);
      const all = service.getPopular('all');
      http.expectOne(`${API}/v2/search/Movie/popular/0/20?`).flush([{ id: 1, title: 'M' }]);
      http.expectOne(`${API}/v2/search/Tv/trending/0/15?`).flush([{ id: 2, title: 'T' }]);
      expect((await all).map(i => i.title).sort()).toEqual(['M', 'T']);

      const tvOnly = service.getPopular('tv', true);
      http.expectOne(`${API}/v2/search/Tv/trending/0/15?`).flush([{ id: 3, title: 'T2' }]);
      expect((await tvOnly).map(i => i.title)).toEqual(['T2']);
    });
  });

  describe('RequestsService', () => {
    it('lists movie requests (v2) and maps them', async () => {
      const service = TestBed.inject(RequestsService);
      const p = service.list(RequestType.MOVIE);
      http.expectOne(`${API}/v2/Requests/movie/20/0/requestedDate/desc?`).flush({
        collection: [{
          id: 9, theMovieDbId: 603, title: 'M', overview: 'o', posterPath: '/p.jpg', requestedDate: '2026-01-02T00:00:00',
          approved: true, available: false, denied: false, requestedUser: { userName: 'al', email: 'al@x', alias: 'A' },
        }],
      });
      const [item] = await p;
      expect(item.mediaType).toBe('movie');
      expect(item.id as any).toBe(603);
      expect(item.posterUrl).toBe('https://image.tmdb.org/t/p/w300//p.jpg');
      expect(item.date.getFullYear()).toBe(2026);
      expect(item.request).toEqual({
        id: 9, requested: true, approved: true, available: false, denied: false, date: '2026-01-02T00:00:00' as any,
        user: { alias: 'A', email: 'al@x', name: 'al' },
      });
    });

    it('lists TV requests using the parent request for id, overview and poster', async () => {
      const service = TestBed.inject(RequestsService);
      const p = service.list(RequestType.TV);
      http.expectOne(`${API}/v2/Requests/tv/20/0/requestedDate/desc?`).flush({
        collection: [{ id: 7, title: 'T', requestedDate: '2026-01-01', parentRequest: { externalProviderId: 1396, overview: 'po', posterPath: 'x.jpg' } }],
      });
      const [item] = await p;
      expect(item.id as any).toBe(1396);
      expect(item.description).toBe('po');
      expect(item.posterUrl).toBe('https://image.tmdb.org/t/p/w300/x.jpg');
      expect(item.request.id).toBe(7);
    });

    it('requests a movie (v1) and toasts success or the Ombi error', async () => {
      const service = TestBed.inject(RequestsService);
      let p = service.requestMovie(603);
      let req = http.expectOne(`${API}/v1/Request/Movie`);
      expect(req.request.body).toEqual({ theMovieDbId: 603, languageCode: 'en' });
      req.flush({ isError: false });
      await p;
      expect(toast.show.lastArgs()).toEqual([ToastType.SUCCESS, 'Successfully requested Movie']);

      p = service.requestMovie(603);
      req = http.expectOne(`${API}/v1/Request/Movie`);
      req.flush({ isError: true, errorMessage: 'Quota exceeded' });
      await p;
      expect(toast.show.lastArgs()).toEqual([ToastType.ERROR, 'Quota exceeded']);
    });

    it('requests a whole TV show (v2)', async () => {
      const service = TestBed.inject(RequestsService);
      const p = service.requestTv(1396);
      const req = http.expectOne(`${API}/v2/Requests/TV`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ firstSeason: false, latestSeason: false, requestAll: true, theMovieDbId: 1396 });
      req.flush({ isError: false });
      await p;
      expect(toast.show.lastArgs()).toEqual([ToastType.SUCCESS, 'Successfully requested TV Show']);
    });

    it('approves with POST and denies with PUT (v1)', async () => {
      const service = TestBed.inject(RequestsService);
      let p = service.performAction(RequestAction.APPROVE, RequestType.MOVIE, 9);
      let req = http.expectOne(`${API}/v1/Request/movie/approve`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: 9 });
      req.flush({});
      await p;
      expect(toast.show.lastArgs()).toEqual([ToastType.SUCCESS, 'Successfully approved request']);

      p = service.performAction(RequestAction.DENY, RequestType.TV, 7);
      req = http.expectOne(`${API}/v1/Request/tv/deny`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ id: 7 });
      req.flush({});
      await p;
      expect(toast.show.lastArgs()).toEqual([ToastType.SUCCESS, 'Successfully denied request']);
    });
  });
});

describe('ToastService', () => {
  it('creates a top toast with the type as colour and presents it', async () => {
    const present = spyFn(() => Promise.resolve());
    const create = spyFn((opts: unknown) => Promise.resolve({ present }));
    TestBed.configureTestingModule({ providers: [{ provide: ToastController, useValue: { create } }] });
    await TestBed.inject(ToastService).show(ToastType.ERROR, 'Boom');
    await flushPromises();
    expect(create.calls[0][0]).toEqual({ header: 'Boom', position: 'top', color: 'danger', duration: 1500 });
    expect(present.calls.length).toBe(1);
  });
});

/** Partial object match that works the same under any test runner. */
function withFields<T extends object>(expected: Partial<T>, actual: T): T {
  return { ...actual, ...expected };
}
