import { Injectable } from '@angular/core';
import { CredentialsNames } from 'src/models/credentials';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {

  constructor() { }

  public get token(): string {
    return localStorage.getItem(CredentialsNames.TOKEN) || '';
  }

  public set token(token: string) {
    localStorage.setItem(CredentialsNames.TOKEN, token);
  }

  public get baseUrl(): string {
    return localStorage.getItem(CredentialsNames.BASE_URL) || '';
  }

  public set baseUrl(baseUrl: string) {
    localStorage.setItem(CredentialsNames.BASE_URL, baseUrl);
  }

  public get password(): string {
    return localStorage.getItem(CredentialsNames.PASSWORD) || '';
  }

  public set password(password: string) {
    localStorage.setItem(CredentialsNames.PASSWORD, password);
  }

  public get username(): string {
    return localStorage.getItem(CredentialsNames.USERNAME) || '';
  }

  public set username(username: string) {
    localStorage.setItem(CredentialsNames.USERNAME, username);
  }
}
