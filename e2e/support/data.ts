/**
 * Realistic Ombi API fixtures. Shapes mirror exactly what the services in
 * src/services/*.service.ts read from the Ombi v1/v2 API responses.
 */

export const OMBI_ORIGIN = 'https://ombi.test';
export const OMBI_HOST = 'ombi.test';
export const UNREACHABLE_HOST = 'down.test';
export const PLEX_ORIGIN = 'https://plex.tv';
export const PLEX_AUTH_URL = 'https://app.plex.tv/auth#?code=E2EPIN';

const base64url = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

/** Unsigned JWT; the app only decodes it (jwt-decode), it never verifies the signature. */
export const makeJwt = (sub: string, role: string[]): string =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({
    sub,
    role,
    nbf: 1700000000,
    exp: 4102444800,
    iss: 'Ombi',
    aud: 'Ombi',
  })}.c2lnbmF0dXJl`;

export const USERS = {
  admin: {
    username: 'admin',
    password: 'correct-horse',
    token: makeJwt('admin', ['Admin', 'AutoApproveMovie', 'AutoApproveTv', 'RequestMovie', 'RequestTv']),
  },
  poweruser: {
    username: 'paula',
    password: 'power-pass',
    token: makeJwt('paula', ['PowerUser', 'RequestMovie', 'RequestTv']),
  },
  user: {
    username: 'bob',
    password: 'bob-pass',
    token: makeJwt('bob', ['RequestMovie', 'RequestTv']),
  },
} as const;

export type UserKey = keyof typeof USERS;

export const authSettings = (enableOAuth: boolean) => ({
  disableIdentityLogin: false,
  allowNoPassword: false,
  requireDigit: false,
  requiredLength: 0,
  requireLowercase: false,
  requireNonAlphanumeric: false,
  requireUppercase: false,
  enableOAuth,
  enableHeaderAuth: false,
  headerAuthVariable: '',
  enableCustomLogin: false,
  id: 0,
});

const LONG_OVERVIEW = Array.from({ length: 90 }, (_, i) => `word${i + 1}`).join(' ');

/** GET /api/v2/search/Movie/popular/0/20 */
export const popularMovies = [
  {
    id: 603,
    title: 'The Matrix',
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents.',
    posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    voteAverage: 8.2,
    mediaType: 'movie',
  },
  {
    id: 27205,
    title: 'Inception',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets.',
    posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    voteAverage: 8.4,
    mediaType: 'movie',
  },
  {
    id: 157336,
    title: 'Interstellar',
    overview: LONG_OVERVIEW,
    posterPath: null,
    voteAverage: 8.4,
    mediaType: 'movie',
  },
];

/** GET /api/v2/search/Tv/trending/0/15 */
export const trendingTv = [
  {
    id: 1396,
    title: 'Breaking Bad',
    overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer.',
    backdropPath: 'https://image.tmdb.org/t/p/w300/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    rating: 8.9,
  },
  {
    id: 1399,
    title: 'Game of Thrones',
    overview: '',
    backdropPath: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
    rating: 8.4,
  },
];

/** POST /api/v2/search/multi/{term} */
export const multiSearch: Record<string, Array<Record<string, unknown>>> = {
  matrix: [
    { id: 603, mediaType: 'movie', title: 'The Matrix', overview: 'Neo learns the truth about reality.', poster: 'f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' },
    { id: 604, mediaType: 'movie', title: 'The Matrix Reloaded', overview: 'Neo and the rebel leaders fight on.', poster: null },
    { id: 71912, mediaType: 'tv', title: 'The Matrix: Animated', overview: 'An anthology series.', poster: 'aXZ9cmvQYhP6uZ5xbUnN4rgKH0I.jpg' },
  ],
};

/** GET /api/v2/search/Movie/{id} */
export const movieDetails: Record<number, Record<string, unknown>> = {
  603: {
    id: 603,
    title: 'The Matrix',
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents.',
    posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    releaseDate: '1999-03-30T00:00:00',
    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
    voteAverage: 8.2,
    requestId: 0,
    requested: false,
    approved: false,
    denied: false,
    available: false,
    imdbId: 'tt0133093',
  },
  27205: {
    id: 27205,
    title: 'Inception',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets.',
    posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    releaseDate: '2010-07-15T00:00:00',
    genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }],
    voteAverage: 8.4,
    requestId: 12,
    requested: true,
    approved: true,
    denied: false,
    available: true,
  },
  157336: {
    id: 157336,
    title: 'Interstellar',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole.',
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    releaseDate: '2014-11-05T00:00:00',
    genres: [{ id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }],
    voteAverage: 8.4,
    requestId: 31,
    requested: true,
    approved: false,
    denied: false,
    available: false,
  },
  550: {
    id: 550,
    title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression.',
    posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    releaseDate: '1999-10-15T00:00:00',
    genres: [{ id: 18, name: 'Drama' }],
    voteAverage: 8.4,
    requestId: 44,
    requested: true,
    approved: false,
    denied: true,
    available: false,
  },
};

/** GET /api/v2/search/Tv/{id} */
export const tvDetails: Record<number, Record<string, unknown>> = {
  1396: {
    id: 1396,
    title: 'Breaking Bad',
    overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer.',
    images: { original: 'https://image.tmdb.org/t/p/w300/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', medium: null },
    firstAired: '2008-01-20T00:00:00',
    genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }],
    network: { name: 'AMC' },
    status: 'Ended',
    rating: 8.9,
    requestId: 0,
    requested: false,
    approved: false,
    denied: false,
    requestAll: false,
    firstSeason: false,
    latestSeason: false,
    seasonRequests: [],
    available: false,
    partlyAvailable: false,
  },
  1399: {
    id: 1399,
    title: 'Game of Thrones',
    overview: 'Seven noble families fight for control of the mythical land of Westeros.',
    images: { original: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', medium: null },
    firstAired: '2011-04-17T00:00:00',
    genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }],
    network: { name: 'HBO' },
    status: 'Ended',
    rating: 8.4,
    requestId: 7,
    requested: true,
    approved: true,
    denied: false,
    requestAll: true,
    firstSeason: false,
    latestSeason: false,
    seasonRequests: [],
    available: false,
    partlyAvailable: true,
  },
};

const requestedUser = (userName: string, email: string) => ({ userName, email, alias: '', id: `${userName}-id` });

/** GET /api/v2/Requests/movie/20/0/requestedDate/desc → .collection */
export const movieRequests = [
  {
    id: 101,
    theMovieDbId: 603,
    title: 'The Matrix',
    overview: 'A hacker learns the truth.',
    posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    requestedDate: '2026-11-01T10:00:00',
    approved: false,
    denied: false,
    available: false,
    requestedUser: requestedUser('alice', 'alice@example.com'),
  },
  {
    id: 102,
    theMovieDbId: 27205,
    title: 'Inception',
    overview: 'Dreams within dreams.',
    posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    requestedDate: '2026-11-05T10:00:00',
    approved: true,
    denied: false,
    available: true,
    requestedUser: requestedUser('bob', 'bob@example.com'),
  },
  {
    id: 103,
    theMovieDbId: 550,
    title: 'Fight Club',
    overview: 'The first rule.',
    posterPath: null,
    requestedDate: '2026-11-07T10:00:00',
    approved: false,
    denied: true,
    available: false,
    requestedUser: { userName: '', email: 'carol@example.com', alias: '' },
  },
];

/** GET /api/v2/Requests/tv/20/0/requestedDate/desc → .collection (child requests) */
export const tvRequests = [
  {
    id: 201,
    title: 'Breaking Bad',
    requestedDate: '2026-11-03T10:00:00',
    approved: false,
    denied: false,
    available: false,
    requestedUser: requestedUser('dave', 'dave@example.com'),
    parentRequest: {
      id: 20,
      externalProviderId: 1396,
      overview: 'A chemistry teacher turns to crime.',
      posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    },
  },
  {
    id: 202,
    title: 'Game of Thrones',
    requestedDate: '2026-11-06T10:00:00',
    approved: true,
    denied: false,
    available: false,
    requestedUser: requestedUser('erin', 'erin@example.com'),
    parentRequest: {
      id: 21,
      externalProviderId: 1399,
      overview: 'Winter is coming.',
      posterPath: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    },
  },
];

export const requestsPage = (collection: unknown[]) => ({ collection, total: collection.length });
