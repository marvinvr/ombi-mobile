import { Injectable } from '@angular/core';
import { CredentialsNames } from 'src/models/credentials';
import jwt_decode from 'jwt-decode';
import { Observable } from 'rxjs/internal/Observable';
import { Subscriber } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {
  private tokenChangeObservable = new Observable<void>(subscriber => this.subscriber = subscriber);
  private subscriber: Subscriber<void>;

  constructor( ) { }

  public get name(): string {
    return jwt_decode(this.token)['sub'];
  }

  public get isAdmin(): boolean {
    return jwt_decode(this.token)['roles']?.indexOf('Admin') != -1;
  }

  public get signedIn(): boolean {
    return this.token != '';
  }

  public get token(): string {
    return localStorage.getItem(CredentialsNames.TOKEN) || '';
  }

  public set token(token: string) {
    localStorage.setItem(CredentialsNames.TOKEN, token);
    this.subscriber.next();
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

  public tokenChange(): Observable<void> {
    return this.tokenChangeObservable;
  }
}
