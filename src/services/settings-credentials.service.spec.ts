import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Settings, SETTINGS_STORAGE_KEY } from 'src/models/settings';
import { makeJwt } from 'src/testing/test-helpers';
import { CredentialsService } from './credentials.service';
import { SettingsService } from './settings.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const PREDEFINED = '/assets/settings/predefined-host.txt';

describe('SettingsService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads persisted settings on construction', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ [Settings.BASE_URL]: 'https://ombi.test' }));
    const settings = TestBed.inject(SettingsService);
    expect(settings.get(Settings.BASE_URL)).toBe('https://ombi.test');
  });

  it('persists every set() and notifies subscribers', () => {
    const settings = TestBed.inject(SettingsService);
    let changes = 0;
    settings.change.subscribe(() => changes++);
    settings.set(Settings.IS_ADMIN, true);
    settings.set(Settings.USERNAME, 'bob');
    expect(changes).toBe(2);
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toEqual({ [Settings.IS_ADMIN]: true, [Settings.USERNAME]: 'bob' });
    expect(settings.get(Settings.USERNAME)).toBe('bob');
  });

  it('starts empty when nothing is stored', () => {
    const settings = TestBed.inject(SettingsService);
    expect(settings.get(Settings.BASE_URL)).toBeUndefined();
  });

  it('fetches predefined settings as text from assets', () => {
    const settings = TestBed.inject(SettingsService);
    let value: string | undefined;
    settings.fetchPredefinedSetting('predefined-host' as any).subscribe(v => (value = v));
    const req = http.expectOne(PREDEFINED);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('text');
    req.flush('https://ombi.test');
    expect(value).toBe('https://ombi.test');
  });
});

describe('CredentialsService', () => {
  let http: HttpTestingController;
  let settings: SettingsService;

  const create = (predefined: string | 'error' = '') => {
    const service = TestBed.inject(CredentialsService);
    const req = http.expectOne(PREDEFINED);
    if (predefined === 'error') {
      req.flush('', { status: 404, statusText: 'Not Found' });
    } else {
      req.flush(predefined);
    }
    return service;
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    settings = TestBed.inject(SettingsService);
  });

  afterEach(() => http.verify());

  it('normalises the base URL (lowercase, backslash, trailing slash) and notifies', () => {
    const creds = create();
    let changes = 0;
    creds.baseUrlChange().subscribe(() => changes++);
    creds.baseUrl = 'HTTPS://Ombi.Test\\ombi/';
    expect(creds.baseUrl).toBe('https://ombi.test/ombi');
    expect(changes).toBe(1);
  });

  it('ignores empty base URLs', () => {
    const creds = create();
    creds.baseUrl = 'https://ombi.test';
    creds.baseUrl = '';
    expect(creds.baseUrl).toBe('https://ombi.test');
  });

  it('stores username / password in settings and defaults to empty strings', () => {
    const creds = create();
    expect(creds.username).toBe('');
    expect(creds.password).toBe('');
    creds.username = 'bob';
    creds.password = 'pw';
    expect(settings.get(Settings.USERNAME)).toBe('bob');
    expect(settings.get(Settings.PASSWORD)).toBe('pw');
  });

  it('decodes the token and derives name, roles and permissions', () => {
    const creds = create();
    let tokenChanges = 0;
    creds.tokenChange().subscribe(() => tokenChanges++);
    creds.token = makeJwt({ sub: 'alice', role: ['Admin', 'AutoApproveMovie'] });

    expect(localStorage.getItem('token')).toBe(creds.token);
    expect(tokenChanges).toBe(1);
    expect(creds.name).toBe('alice');
    expect(creds.hasValidToken).toBe(true);
    expect(creds.hasRole('Admin')).toBe(true);
    expect(creds.hasRole('PowerUser')).toBe(false);
    expect(creds.hasAutoApprove('movie')).toBe(true);
    expect(creds.hasAutoApprove('tv')).toBe(false);
    expect(settings.get(Settings.IS_ADMIN)).toBe(true);
    expect(settings.get(Settings.CAN_APPROVE_REQUESTS)).toBe(false);
    expect(settings.get(Settings.IS_SIGNED_IN)).toBe(true);
  });

  it('power users can approve requests', () => {
    const creds = create();
    creds.token = makeJwt({ sub: 'paula', role: ['PowerUser'] });
    expect(settings.get(Settings.IS_ADMIN)).toBe(false);
    expect(settings.get(Settings.CAN_APPROVE_REQUESTS)).toBe(true);
  });

  it('treats an empty or garbage token as signed out', () => {
    const creds = create();
    creds.token = '';
    expect(creds.name).toBe('');
    expect(creds.hasValidToken).toBe(false);
    expect(settings.get(Settings.IS_SIGNED_IN)).toBe(false);
    creds.token = 'not-a-jwt';
    expect(creds.tokenContents).toBe('');
    expect(creds.hasRole('Admin')).toBe(false);
  });

  it('migrates legacy top-level localStorage credentials', () => {
    localStorage.setItem('baseUrl', 'https://legacy.test');
    localStorage.setItem('username', 'legacy-user');
    localStorage.setItem('password', 'legacy-pw');
    const creds = create();
    expect(creds.baseUrl).toBe('https://legacy.test');
    expect(creds.username).toBe('legacy-user');
    expect(creds.password).toBe('legacy-pw');
  });

  it('applies a valid predefined host and flags it', () => {
    const creds = create('https://Predefined.test/');
    expect(creds.baseUrl).toBe('https://predefined.test');
    expect(settings.get(Settings.IS_PREDEFINED_URL)).toBe(true);
  });

  it('ignores an invalid predefined host (e.g. SPA fallback HTML)', () => {
    const creds = create('<!DOCTYPE html><html></html>');
    expect(creds.baseUrl).toBeFalsy();
    expect(settings.get(Settings.IS_PREDEFINED_URL)).toBe(false);
  });

  it('handles a missing predefined host file', () => {
    create('error');
    expect(settings.get(Settings.IS_PREDEFINED_URL)).toBe(false);
  });
});
