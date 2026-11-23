import { hasProtocol, removeTrailingSlash, replaceBackslashes } from './credentials.utils';
import { getPoster } from './poster.utils';
import { sort } from './requests.utils';
import { isValidUrl } from './url.utils';

describe('utils', () => {
  describe('credentials.utils', () => {
    it('detects protocols', () => {
      expect(hasProtocol('https://ombi.test')).toBe(true);
      expect(hasProtocol('http://ombi.test')).toBe(true);
      expect(hasProtocol('ombi.test')).toBe(false);
      // undefined/null is treated as "has protocol" (existing behaviour)
      expect(hasProtocol(undefined as unknown as string)).toBe(true);
    });

    it('removes exactly one trailing slash', () => {
      expect(removeTrailingSlash('https://ombi.test/')).toBe('https://ombi.test');
      expect(removeTrailingSlash('https://ombi.test')).toBe('https://ombi.test');
      expect(removeTrailingSlash('https://ombi.test//')).toBe('https://ombi.test/');
    });

    it('replaces the first backslash', () => {
      expect(replaceBackslashes('https:\\/ombi.test')).toBe('https://ombi.test');
    });
  });

  describe('poster.utils', () => {
    it('builds tmdb URLs, keeps absolute URLs and falls back to the backdrop', () => {
      expect(getPoster('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w300//abc.jpg');
      expect(getPoster('abc.jpg')).toBe('https://image.tmdb.org/t/p/w300/abc.jpg');
      expect(getPoster('https://cdn.test/a.jpg')).toBe('https://cdn.test/a.jpg');
      expect(getPoster('')).toBe('/assets/backdrop.png');
      expect(getPoster(null as unknown as string)).toBe('/assets/backdrop.png');
    });
  });

  describe('url.utils', () => {
    it('validates absolute http(s)/ftp URLs', () => {
      expect(isValidUrl('https://ombi.test')).toBe(true);
      expect(isValidUrl('http://ombi.test:5000/ombi')).toBe(true);
      expect(isValidUrl('ftp://x')).toBe(true);
      expect(isValidUrl('ombi.test')).toBe(false);
      expect(isValidUrl('https://bad url')).toBe(false);
      expect(isValidUrl('<!DOCTYPE html>')).toBe(false);
    });
  });

  describe('requests.utils sort', () => {
    const item = (title: string, date: string, flags: Partial<{ approved: boolean; denied: boolean; available: boolean }> = {}) =>
      ({ title, request: { date, approved: false, denied: false, available: false, ...flags } }) as any;

    it('puts open requests first, each group newest first', () => {
      const movies = [item('m-old-open', '2026-01-01'), item('m-new-approved', '2026-03-01', { approved: true })];
      const tv = [item('t-new-open', '2026-02-01'), item('t-old-denied', '2025-12-01', { denied: true }), item('t-avail', '2026-04-01', { available: true })];
      expect(sort([movies, tv]).map(i => i.title)).toEqual(['t-new-open', 'm-old-open', 't-avail', 'm-new-approved', 't-old-denied']);
    });

    it('handles empty lists', () => {
      expect(sort([[], []])).toEqual([]);
    });
  });
});
