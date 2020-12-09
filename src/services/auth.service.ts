import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CredentialsService } from './credentials.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private apiService: ApiService,
    private credentialsService: CredentialsService
  ) { }

  public fetchToken(): Promise<any> {
    return this.apiService.postRequest(
      '/token',
      {},
      {
        'username': this.credentialsService.username,
        'password': this.credentialsService.password,
        'rememberMe': true,
        'usePlexOAuth': false,
      }
    )
  }
}
