/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { CredentialsNames } from 'src/models/credentials';
import jwt_decode from 'jwt-decode';
import { Subject } from 'rxjs';
import { removeTrailingSlash, replaceBackslashes } from 'src/utils/credentials.utils';
import { SettingsService } from './settings.service';
import { PredefinedSetting, Settings } from 'src/models/settings';
import { AuthService } from './auth.service';
import { isValidUrl } from 'src/utils/url.utils';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  private tokenChangeSubject = new Subject();
  private baseUrlChangeSubject = new Subject();

  constructor(
    private settings: SettingsService
  ) {
    this.migrateLegacySettings();
    this.updatePermissions();
    this.fetchPredefinedHost();
    this.tokenChange().subscribe(() => {
      this.updatePermissions();
    });
  }

  /* Name */

  public get name(): string {
    if(this.token === '') {
      return '';
    }
    //@ts-ignore
    return this.tokenContents?.sub;
  }

  /* Base URL */

  public get baseUrl(): string {
    return this.settings.get(Settings.BASE_URL);
  }

  public set baseUrl(baseUrl: string) {
    if(!baseUrl) {
      return;
    }
    let url = baseUrl.toLowerCase();
    url = replaceBackslashes(url);
    url = removeTrailingSlash(url);
    this.settings.set(Settings.BASE_URL, url);
    this.baseUrlChangeSubject.next(null);
  }

  private fetchPredefinedHost(): void {
    this.settings.fetchPredefinedSetting(PredefinedSetting.PREDEFINED_HOST)
      .subscribe({
        next: predefinedUrl => {
          if(isValidUrl(predefinedUrl)) {
            this.baseUrl = predefinedUrl;
            this.settings.set(Settings.IS_PREDEFINED_URL, true)
          } else {
            this.settings.set(Settings.IS_PREDEFINED_URL, false)
          }
        },
        error: () => {
          this.settings.set(Settings.IS_PREDEFINED_URL, false)
        }
      });
  }

  public baseUrlChange(): Subject<any> {
    return this.baseUrlChangeSubject;
  }

  /* Password */

  public get password(): string {
    return this.settings.get(Settings.PASSWORD) || '';
  }

  public set password(password: string) {
    this.settings.set(Settings.PASSWORD, password);
  }

  /* Username */

  public get username(): string {
    return this.settings.get(Settings.USERNAME) || '';
  }

  public set username(username: string) {
    this.settings.set(Settings.USERNAME, username);
  }

  /* Token */

  public get token(): string {
    return localStorage.getItem(CredentialsNames.TOKEN) || '';
  }

  public set token(token: string) {
    localStorage.setItem(CredentialsNames.TOKEN, token);
    this.tokenChangeSubject.next(null);
  }

  public get tokenContents() {
    try{
      return jwt_decode(this.token);
    } catch {
      return '';
    }
  }

  public get hasValidToken(): boolean {
    return this.tokenContents !== '';
  }

  public tokenChange(): Subject<any> {
    return this.tokenChangeSubject;
  }

  /* init */

  public migrateLegacySettings() {
    if(!this.settings.get(Settings.BASE_URL)) {
      this.settings.set(Settings.BASE_URL, localStorage.getItem('baseUrl'));
    }
    if(!this.settings.get(Settings.USERNAME)) {
      this.settings.set(Settings.USERNAME, localStorage.getItem('username'));
    }
    if(!this.settings.get(Settings.PASSWORD)) {
      this.settings.set(Settings.PASSWORD, localStorage.getItem('password'));
    }
  }

  public hasRole(role: string): boolean {
    //@ts-ignore
    return this.hasValidToken && this.tokenContents?.role?.indexOf(role) !== -1;
  }

  public hasAutoApprove(type: 'movie' | 'tv'): boolean {
    return this.hasRole(`AutoApprove${type.charAt(0).toUpperCase() + type.slice(1)}`);
  }

  public updatePermissions() {
    //@ts-ignore
    this.settings.set(Settings.IS_ADMIN, this.hasRole('Admin'));
    //@ts-ignore
    this.settings.set(Settings.CAN_APPROVE_REQUESTS, this.hasRole('PowerUser'));
    this.settings.set(Settings.IS_SIGNED_IN, this.hasValidToken);
  }
}
