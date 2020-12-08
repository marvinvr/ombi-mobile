import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {

  constructor() { }

  public get token() {
    return localStorage.getItem('token');
  }

  public get baseUrl(): string {
    return localStorage.getItem('baseUrl');
  }

  public get password(): string {
    return localStorage.getItem('password');
  }

  public get username(): string {
    return localStorage.getItem('username');
  }
}
