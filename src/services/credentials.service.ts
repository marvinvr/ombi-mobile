import { Injectable } from '@angular/core';
import { CredentialsNames } from 'src/models/credentials';
import jwt_decode from 'jwt-decode';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs';
import { hasProtocol, removeTrailingSlash, replaceBackslashes } from 'src/utils/credentials.utils';
import { SettingsService } from './settings.service';
import { Settings } from 'src/models/settings';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  private tokenChangeSubject = new Subject();

  constructor(
    private settings: SettingsService
  ) { 
    this.migrateLegacySettings();
    this.updatePermissions();
    this.tokenChange().subscribe(() => {
      this.updatePermissions();
    })
  }

  /* Name */

  public get name(): string {
    if(this.token == '') return '';
    return this.tokenContents['sub'];
  }

  /* Base URL */

  public get baseUrl(): string {
    return this.settings.get(Settings.BASE_URL)
  }

  public set baseUrl(baseUrl: string) {
    if(!baseUrl) return;
    let url = baseUrl.toLowerCase();
    url = replaceBackslashes(url);
    if(!hasProtocol(url)) 
      url = 'http://' + url;
    url = removeTrailingSlash(url);
    this.settings.set(Settings.BASE_URL, url)
  }

  /* Password */

  public get password(): string {
    return this.settings.get(Settings.PASSWORD) || ''
  }

  public set password(password: string) {
    this.settings.set(Settings.PASSWORD, password)
  }

  /* Username */

  public get username(): string {
    return this.settings.get(Settings.USERNAME) || ''
  }

  public set username(username: string) {
    this.settings.set(Settings.USERNAME, username)
  }

  /* Token */

  public get token(): string {
    return localStorage.getItem(CredentialsNames.TOKEN) || '';
  }

  public set token(token: string) {
    localStorage.setItem(CredentialsNames.TOKEN, token);
    this.tokenChangeSubject.next();
  }

  public get tokenContents() {
    try{
      return jwt_decode(this.token)
    } catch {
      return ''
    }
  }

  public tokenChange(): Subject<any> {
    return this.tokenChangeSubject;
  }

  public get hasValidToken(): boolean {
    return this.tokenContents != ''
  }

  /* init */

  private migrateLegacySettings() {
    if(!this.settings.get(Settings.BASE_URL)) this.settings.set(Settings.BASE_URL, localStorage.getItem('baseUrl'))
    if(!this.settings.get(Settings.USERNAME)) this.settings.set(Settings.USERNAME, localStorage.getItem('username'))
    if(!this.settings.get(Settings.PASSWORD)) this.settings.set(Settings.PASSWORD, localStorage.getItem('password'))
  }

  public updatePermissions() {
    this.settings.set(Settings.IS_ADMIN, this.hasValidToken && this.tokenContents['role']?.indexOf('Admin') != -1)
    this.settings.set(Settings.CAN_APPROVE_REQUESTS, this.hasValidToken && this.tokenContents['role']?.indexOf('PowerUser') != -1)
    this.settings.set(Settings.IS_SIGNED_IN, this.hasValidToken)
  }
}
